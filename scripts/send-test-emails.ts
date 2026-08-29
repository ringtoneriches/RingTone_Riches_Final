/**
 * Temporary template check. Delete this file after review.
 * Run: npx tsx scripts/send-test-emails.ts
 */
import "dotenv/config";
import {
  sendGuestMagicLinkEmail,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail,
  sendPromotionalEmail,
  sendTopupConfirmationEmail,
  sendWelcomeEmail,
} from "../server/email";
import { sendVerificationEmail } from "../server/emails/verification-email";

const TO = "YOURTESTEMAIL@example.com"; // Replace with your test email address
const site = (process.env.CLIENT_URL || "https://ringtoneriches.co.uk").replace(/\/$/, "");

async function main() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing in .env");
  }

  const results: Array<{ name: string; ok: boolean; detail?: string }> = [];

  async function send(name: string, fn: () => Promise<{ success: boolean; error?: unknown }>) {
    console.log(`\n→ ${name}`);
    try {
      const result = await fn();
      const ok = Boolean(result?.success);
      results.push({
        name,
        ok,
        detail: ok ? undefined : JSON.stringify(result?.error ?? result),
      });
      console.log(ok ? "  sent" : `  failed: ${JSON.stringify(result?.error ?? result)}`);
    } catch (error) {
      results.push({ name, ok: false, detail: String(error) });
      console.error("  exception:", error);
    }
  }

  await send("Order confirmation (cart)", () =>
    sendOrderConfirmationEmail(TO, {
      orderId: "test-order-a1b2c3d4",
      userName: "Tayyab",
      orderType: "competition",
      itemName: "WIN A £250 CASH FOR JUST £1",
      quantity: 3,
      totalAmount: "7.00",
      orderDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      paymentMethod: "Card",
      skillAnswer: "7:30am",
      ticketNumbers: ["RR-10482", "RR-10483"],
      cartLines: [
        {
          itemName: "WIN A £250 CASH FOR JUST £1",
          orderType: "competition",
          quantity: 2,
          amount: "2.00",
          ticketNumbers: ["RR-10482", "RR-10483"],
        },
        {
          itemName: "Royal Spin — Instant Win",
          orderType: "royal",
          quantity: 1,
          amount: "5.00",
        },
      ],
    }),
  );

  await send("Welcome", () =>
    sendWelcomeEmail(TO, {
      userName: "Tayyab",
      email: TO,
    }),
  );

  await send("Promotional", () =>
    sendPromotionalEmail(TO, {
      id: "test-campaign",
      title: "Weekend play",
      subject: "[TEST] Weekend play — Ringtone Riches",
      message: "This is a test campaign so you can check the promotional template.",
      offerType: "discount",
      discountCode: "TEST10",
      discountPercentage: 10,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }),
  );

  await send("Password reset", () =>
    sendPasswordResetEmail(TO, `${site}/reset-password?token=TEST-DO-NOT-USE`, "Tayyab"),
  );

  await send("Wallet top-up", () =>
    sendTopupConfirmationEmail(TO, {
      userName: "Tayyab",
      amount: "20.00",
      newBalance: "35.00",
      paymentRef: "TESTREF1",
      paymentMethod: "Card",
      topupDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    }),
  );

  await send("Guest magic link", () =>
    sendGuestMagicLinkEmail(TO, `${site}/guest-checkout?token=TEST-DO-NOT-USE`, "Tayyab"),
  );

  await send("Email verification", () => sendVerificationEmail(TO, "482917", "Tayyab"));

  const failed = results.filter((row) => !row.ok);
  console.log("\n———");
  console.log(`Sent ${results.filter((row) => row.ok).length}/${results.length} to ${TO}`);
  if (failed.length) {
    for (const row of failed) {
      console.log(`Failed: ${row.name} — ${row.detail}`);
    }
    process.exit(1);
  }
}

main();
