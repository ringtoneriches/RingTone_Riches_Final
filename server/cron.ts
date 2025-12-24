import cron from "node-cron";
import { cleanup404Payments, recheckPendingPayments } from "./routes";

// Function to initialize all cron jobs
export function startCrons() {
  // Recheck pending payments every 15 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("🔁 Running recheckPendingPayments");
    try {
      await recheckPendingPayments();
    } catch (err) {
      console.error("❌ Recheck job failed:", err);
    }
  });

  console.log("✅ Cron jobs started");
}


export function cleanUpCron (){
 // Run cleanup daily
cron.schedule('0 1 * * *', cleanup404Payments); // 1 AM daily
}