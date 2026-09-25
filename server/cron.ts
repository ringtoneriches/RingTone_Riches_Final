import cron from "node-cron";
// import { cleanup404Payments, recheckPendingPayments } from "./routes";
import { users } from "@shared/schema";
import { and, eq, lt } from "drizzle-orm";
import { db } from "./db";
import { expireLapsedCampaigns } from "./services/golden-ticket";
import { awardWeeklyPrize } from "./services/referrals";

// Function to initialize all cron jobs
export function startCrons() {
  // Recheck pending payments every 5 minutes
  // cron.schedule("*/5 * * * *", async () => {
  //   console.log("🔁 Running recheckPendingPayments");
  //   try {
  //     await recheckPendingPayments();
  //   } catch (err) {
  //     console.error("❌ Recheck job failed:", err);
  //   }
  // });

  // // Cleanup 404 payments daily at 1 AM
  // cron.schedule("0 1 * * *", async () => {
  //   console.log("🧹 Running cleanup404Payments");
  //   try {
  //     await cleanup404Payments();
  //   } catch (err) {
  //     console.error("❌ Cleanup 404 payments failed:", err);
  //   }
  // });

  // Cleanup expired OTPs every hour
  cron.schedule("0 * * * *", async () => {
    console.log("🕑 Running cleanupExpiredOtps");
    try {
      await db.update(users)
        .set({
          emailVerificationOtp: null,
          emailVerificationOtpExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            lt(users.emailVerificationOtpExpiresAt, new Date()),
            eq(users.emailVerified, false)
          )
        );
      console.log("✅ Cleaned up expired OTPs");
    } catch (err) {
      console.error("❌ Cleanup OTPs failed:", err);
    }
  });

  // Weekly top recruiter prize. Runs a little after UK midnight on Monday,
  // and again hourly that day in case the first run was missed — the unique
  // index on (week_start, user_id) means nobody is paid twice.
  cron.schedule("7 0-6 * * 1", async () => {
    try {
      const result = await awardWeeklyPrize();
      if (result.awarded > 0) {
        console.log(`🏆 Top Recruiter: paid ${result.awarded} winner(s) for ${result.weekStart}`);
      }
    } catch (err) {
      console.error("❌ Weekly referral prize failed:", err);
    }
  });

  // Close Golden Ticket campaigns whose end date has passed.
  //
  // Without this a lapsed campaign stays "active" forever: its counter keeps
  // advancing on every eligible play, so tickets could still drop long after
  // the promotion was supposed to be over.
  cron.schedule("*/15 * * * *", async () => {
    try {
      const closed = await expireLapsedCampaigns();
      if (closed > 0) console.log(`🎟️ Expired ${closed} lapsed Golden Ticket campaign(s)`);
    } catch (err) {
      console.error("❌ Golden Ticket expiry sweep failed:", err);
    }
  });

  cron.schedule("* * * * *", async () => {
    try {
      const { activateDueDatetimePrizes } = await import("./services/instant-win-pool");
      await activateDueDatetimePrizes();
    } catch (err) {
      console.error("❌ Instant-win datetime activation failed:", err);
    }
  });

  console.log("✅ All cron jobs started");
}