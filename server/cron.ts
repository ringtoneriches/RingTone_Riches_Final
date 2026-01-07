import cron from "node-cron";
import { cleanup404Payments, recheckPendingPayments } from "./routes";
import { users } from "@shared/schema";
import { and, eq, lt } from "drizzle-orm";
import { db } from "./db";

// Function to initialize all cron jobs
export function startCrons() {
  // Recheck pending payments every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("🔁 Running recheckPendingPayments");
    try {
      await recheckPendingPayments();
    } catch (err) {
      console.error("❌ Recheck job failed:", err);
    }
  });

  // Cleanup 404 payments daily at 1 AM
  cron.schedule("0 1 * * *", async () => {
    console.log("🧹 Running cleanup404Payments");
    try {
      await cleanup404Payments();
    } catch (err) {
      console.error("❌ Cleanup 404 payments failed:", err);
    }
  });

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

  console.log("✅ All cron jobs started");
}