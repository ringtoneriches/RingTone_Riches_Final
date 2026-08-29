import { Resend } from "resend";
import {
  BRAND_NAME,
  FROM_EMAIL,
  GOLD,
  brandSiteUrl,
  emailCard,
  emailCta,
  emailOtpBoxes,
  escapeHtml,
  wrapBrandEmail,
} from "../email-chrome";

let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export const verificationEmailTemplate = (otp: string, userName: string) => {
  const firstName = escapeHtml((userName || "there").split(" ")[0]);
  return wrapBrandEmail({
    pageTitle: `Verify your email - ${BRAND_NAME}`,
    kicker: "Verification",
    title: "YOUR CODE",
    subtitle: `Hi ${firstName}. Enter this code to verify your email.`,
    preheader: `Your ${BRAND_NAME} verification code. Expires in 30 minutes.`,
    bodyHtml: `
      ${emailCard(`
        <div style="text-align: center;">
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: ${GOLD};">6-digit code</div>
          <div style="margin: 16px 0 12px;">${emailOtpBoxes(otp)}</div>
          <p style="margin: 0; font-size: 12px; color: #8b8b93;">Expires in 30 minutes</p>
        </div>
      `)}
      ${emailCard(`
        <p style="margin: 0; font-size: 13px; line-height: 1.55; color: #d8d8de;">
          Never share this code. ${BRAND_NAME} staff will never ask for it.
        </p>
      `)}
      ${emailCta("Enter code", `${brandSiteUrl()}/verify-email`)}
      <p style="margin: 16px 0 0; text-align: center; font-size: 12px; line-height: 1.5; color: #8b8b93;">
        If you didn’t create an account, you can ignore this email.
      </p>
    `,
  });
};

export async function sendVerificationEmail(email: string, otp: string, userName: string) {
  const subject = `Your ${BRAND_NAME} verification code`;
  const html = verificationEmailTemplate(otp, userName);

  console.log("📧 [sendVerificationEmail] Starting...");
  console.log("   To:", email);
  console.log("   From:", FROM_EMAIL);
  console.log("   Subject:", subject);
  console.log("   OTP:", otp);
  console.log("   User:", userName);

  try {
    console.log("   Sending via Resend...");
    const { data, error } = await getResend().emails.send({
      from: `${BRAND_NAME} <${FROM_EMAIL}>`,
      to: [email],
      subject,
      html,
    });

    if (error) {
      console.error("❌ [sendVerificationEmail] Resend error:", error);
      console.error("   Error details:", JSON.stringify(error, null, 2));
      return { success: false, error };
    }

    console.log("✅ [sendVerificationEmail] Success!");
    console.log("   Email ID:", data?.id);
    console.log("   Response:", data);
    return { success: true, data };
  } catch (error: any) {
    console.error("🔥 [sendVerificationEmail] Exception:", error);
    console.error("   Stack:", error.stack);
    return { success: false, error };
  }
}
