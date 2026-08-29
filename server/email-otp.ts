import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import { OTPGenerator } from "./otp";
import { sendVerificationEmail } from "./emails/verification-email";

export async function issueEmailVerificationOtp(user: {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const otp = OTPGenerator.generate();
  const expiresAt = OTPGenerator.getExpiryTime(30);

  await db
    .update(users)
    .set({
      emailVerified: false,
      emailVerificationOtp: otp,
      emailVerificationOtpExpiresAt: expiresAt,
      verificationSentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  const userName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.firstName ||
    "there";

  await sendVerificationEmail(user.email, otp, userName).catch((err) =>
    console.error("Verification email failed:", err),
  );

  return { email: user.email, expiresInMinutes: 30 };
}
