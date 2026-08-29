export const BRAND_NAME = "Ringtone Riches";
export const FROM_EMAIL = "support@ringtoneriches.co.uk";
export const GOLD = "#F1D47A";
export const RED = "#FF263D";
const EMAIL_LOGO_KEY = "email/ringtone-riches-logo-dark.png";

export function brandSiteUrl() {
  return (process.env.CLIENT_URL || "https://ringtoneriches.co.uk").replace(/\/$/, "");
}

export function brandLogoUrl() {
  if (process.env.EMAIL_LOGO_URL) return process.env.EMAIL_LOGO_URL;
  const hosted = (process.env.R2_PUBLIC_URL || "https://pub-8ee6681709ff46c18f6e8ff4543d7d3b.r2.dev").replace(/\/$/, "");
  return `${hosted}/${EMAIL_LOGO_KEY}`;
}

export function emailOtpBoxes(otp: string) {
  const digits = String(otp).replace(/\D/g, "").slice(0, 8).split("");
  const cells = digits
    .map(
      (digit) => `
      <td align="center" style="padding: 0 3px;">
        <div style="width: 42px; height: 52px; line-height: 52px; background-color: #141416; border: 1px solid rgba(241,212,122,0.4); border-radius: 10px; font-size: 24px; font-weight: 800; color: ${GOLD}; font-family: 'Courier New', Consolas, monospace;">
          ${escapeHtml(digit)}
        </div>
      </td>`,
    )
    .join("");
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
      <tr>${cells}</tr>
    </table>`;
}

export function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emailCta(label: string, href: string) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 8px auto 0;">
      <tr>
        <td align="center" style="background-color: #C8102E; border-radius: 10px;">
          <a href="${escapeHtml(href)}" style="display: inline-block; padding: 13px 28px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; letter-spacing: 0.04em;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

export function emailCard(innerHtml: string) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 10px;">
      <tr>
        <td style="background-color: #141416; border: 1px solid #26262b; border-radius: 12px; padding: 14px 16px;">
          ${innerHtml}
        </td>
      </tr>
    </table>`;
}

export function wrapBrandEmail(opts: {
  pageTitle: string;
  kicker: string;
  title: string;
  subtitle?: string;
  preheader?: string;
  bodyHtml: string;
}) {
  const logo = brandLogoUrl();
  const preheader = escapeHtml(opts.preheader || opts.subtitle || opts.pageTitle);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(opts.pageTitle)}</title>
  <style type="text/css">
    @media only screen and (max-width: 480px) {
      .email-shell { width: 100% !important; }
      .email-pad { padding: 22px 16px !important; }
      .email-title { font-size: 28px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F2F2F3; font-family: Arial, Helvetica, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F2F2F3" style="background-color: #F2F2F3;">
    <tr>
      <td align="center" bgcolor="#F2F2F3" style="padding: 24px 12px; background-color: #F2F2F3;">
        <table class="email-shell" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: #0A0A0D; border: 1px solid #26262b; border-radius: 20px; overflow: hidden;">
          <tr>
            <td style="background-color: #050505; padding: 22px 20px 10px; text-align: center;">
              <img src="${logo}" alt="${BRAND_NAME}" width="168" style="display: block; margin: 0 auto; max-width: 70%; height: auto;" />
            </td>
          </tr>
          <tr>
            <td style="height: 2px; background: linear-gradient(90deg, #C8102E 0%, ${GOLD} 100%); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="email-pad" style="padding: 28px 24px 10px; text-align: center;">
              <div style="display: inline-block; border: 1px solid rgba(200,16,46,0.45); background-color: rgba(200,16,46,0.12); border-radius: 999px; padding: 5px 12px; font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: ${RED};">${escapeHtml(opts.kicker)}</div>
              <h1 class="email-title" style="margin: 12px 0 8px; font-size: 34px; line-height: 1; color: #ffffff; font-weight: 800;">${escapeHtml(opts.title)}</h1>
              ${
                opts.subtitle
                  ? `<p style="margin: 0; font-size: 14px; line-height: 1.5; color: #9a9aa3;">${opts.subtitle}</p>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding: 18px 24px 8px;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color: #050505; border-top: 1px solid #26262b; padding: 18px 20px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #8b8b93;">
                Questions? <a href="mailto:${FROM_EMAIL}" style="color: ${GOLD}; text-decoration: none; font-weight: 700;">${FROM_EMAIL}</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #5c5c64;">&copy; ${new Date().getFullYear()} ${BRAND_NAME}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
