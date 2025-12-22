import cron from "node-cron";
import { recheckPendingPayments } from "./routes";

// Function to initialize all cron jobs
export function startCrons() {
  // Recheck pending payments every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    console.log("🔁 Running recheckPendingPayments");
    try {
      await recheckPendingPayments();
    } catch (err) {
      console.error("❌ Recheck job failed:", err);
    }
  });

  console.log("✅ Cron jobs started");
}
