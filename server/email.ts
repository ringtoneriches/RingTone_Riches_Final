import { Resend } from "resend";
import {
  BRAND_NAME,
  FROM_EMAIL,
  GOLD,
  brandLogoUrl,
  brandSiteUrl,
  emailCard,
  emailCta,
  escapeHtml,
  wrapBrandEmail,
} from "./email-chrome";

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

function emailGameLabel(orderType: string) {
  switch (orderType) {
    case "competition":
      return "Prize draw";
    case "spin":
      return "Spin Wheel";
    case "scratch":
      return "Scratch Card";
    case "pop":
      return "Pop Balloon";
    case "royal":
      return "Royal Spin";
    case "slot":
      return "Slot";
    case "voltz":
      return "Voltz";
    case "plinko":
      return "Plinko";
    default:
      return "Game";
  }
}

function stripGameDecor(value: string) {
  return value
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, " ")
    .replace(/[\u{2600}-\u{27BF}]/gu, " ")
    .replace(/[✨⭐️🔥💥🎈👑🎰🕹️☀️🌴🏖️👾🍛👟🎃👻✉️🌟⚡⚡️💷🔋]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseName(value: string) {
  return value
    .toLowerCase()
    .replace(/\b[\w£]/g, (char) => char.toUpperCase())
    .replace(/\bRrp\b/g, "RRP");
}

function shortGameName(itemName: string, orderType: string) {
  const fallback = emailGameLabel(orderType);
  const raw = stripGameDecor(itemName || "");
  if (!raw) return fallback;

  const prize = raw.match(/WIN\s+(.+?)\s+FOR JUST/i);
  if (prize?.[1]) {
    let name = prize[1]
      .replace(/^A\s+|^AN\s+/i, "")
      .replace(/^TICKETS FOR \d+ TO\s+/i, "")
      .replace(/^£([\d,]+)\s+WORTH OF\s+/i, "£$1 ")
      .trim();
    if (name.length > 28) name = `${name.slice(0, 26).trim()}…`;
    return titleCaseName(name);
  }

  let core = raw.split(/\s[—–]\s|\s-\s|\sWIN UP\b/i)[0].trim();
  core = core
    .replace(/\s*INSTANT WIN.*$/i, "")
    .replace(/\s*[–—-]\s*.*$/, "")
    .replace(/^RINGTONE\s+/i, "")
    .trim();
  if (core.length >= 2 && core.length <= 28) return titleCaseName(core);
  if (core.length > 28) return `${titleCaseName(core.slice(0, 26).trim())}…`;
  return fallback;
}

function ticketChipsHtml(tickets: string[]) {
  const rows: string[] = [];
  for (let i = 0; i < tickets.length; i += 2) {
    const cell = (ticket: string) => `
      <td width="50%" style="padding: 3px;">
        <div style="background-color: #141416; border: 1px solid rgba(241,212,122,0.28); border-radius: 8px; padding: 8px 6px; text-align: center; font-family: 'Courier New', Consolas, monospace; font-size: 12px; font-weight: bold; color: #F1D47A; word-break: break-all;">
          ${escapeHtml(ticket)}
        </div>
      </td>`;
    rows.push(`<tr>${cell(tickets[i])}${tickets[i + 1] ? cell(tickets[i + 1]) : `<td width="50%" style="padding: 3px;"></td>`}</tr>`);
  }
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0">${rows.join("")}</table>`;
}

// Order confirmation email payload type
export interface OrderConfirmationLine {
  itemName: string;
  orderType: string;
  quantity: number;
  amount: string;
  ticketNumbers?: string[];
}

export interface OrderConfirmationPayload {
  orderId: string;
  userName: string;
  orderType: "competition" | "spin" | "scratch" | "pop" | "royal" | "slot" | "voltz" | "plinko";
  itemName: string;
  quantity: number;
  totalAmount: string;
  orderDate: string;
  paymentMethod: string;
  skillQuestion?: string;
  skillAnswer?: string;
  ticketNumbers?: string[];
  cartLines?: OrderConfirmationLine[];
}

export async function sendOrderConfirmationEmail(
  to: string,
  orderData: OrderConfirmationPayload,
) {
  const gold = "#F1D47A";
  const lines: OrderConfirmationLine[] =
    orderData.cartLines && orderData.cartLines.length > 1
      ? orderData.cartLines
      : [
          {
            itemName: orderData.itemName,
            orderType: orderData.orderType,
            quantity: orderData.quantity,
            amount: orderData.totalAmount,
            ticketNumbers: orderData.ticketNumbers,
          },
        ];
  const orderRef = `#${orderData.orderId.substring(orderData.orderId.length - 8).toUpperCase()}`;
  const firstName = escapeHtml((orderData.userName || "there").split(" ")[0]);
  const itemCards = lines
    .map((line) => {
      const name = escapeHtml(shortGameName(line.itemName, line.orderType));
      const type = escapeHtml(emailGameLabel(line.orderType));
      return `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 8px;">
          <tr>
            <td style="background-color: #141416; border: 1px solid #26262b; border-radius: 12px; padding: 12px 14px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: ${gold};">${type}</div>
                    <div style="margin-top: 4px; font-size: 16px; font-weight: 700; color: #ffffff; line-height: 1.25;">${name}</div>
                    <div style="margin-top: 3px; font-size: 12px; color: #8b8b93;">Qty ${line.quantity}</div>
                  </td>
                  <td align="right" style="vertical-align: middle; width: 88px; font-size: 16px; font-weight: 800; color: ${gold}; white-space: nowrap;">£${escapeHtml(String(line.amount))}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;
    })
    .join("");

  const ticketBlocks = lines
    .filter((line) => line.ticketNumbers && line.ticketNumbers.length > 0)
    .map((line) => {
      const name = escapeHtml(shortGameName(line.itemName, line.orderType));
      const type = escapeHtml(emailGameLabel(line.orderType));
      return `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 10px;">
          <tr>
            <td style="background-color: #141416; border: 1px solid #26262b; border-radius: 12px; padding: 12px 14px;">
              <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: ${gold};">${type}</div>
              <div style="margin: 4px 0 10px; font-size: 14px; font-weight: 700; color: #ffffff;">${name}</div>
              ${ticketChipsHtml(line.ticketNumbers || [])}
            </td>
          </tr>
        </table>`;
    })
    .join("");

  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order confirmed - ${BRAND_NAME}</title>
  <style type="text/css">
    @media only screen and (max-width: 480px) {
      .email-shell { width: 100% !important; }
      .email-pad { padding: 22px 16px !important; }
      .email-title { font-size: 28px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F2F2F3; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F2F2F3" style="background-color: #F2F2F3;">
    <tr>
      <td align="center" bgcolor="#F2F2F3" style="padding: 24px 12px; background-color: #F2F2F3;">
        <table class="email-shell" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: #0A0A0D; border: 1px solid #26262b; border-radius: 20px; overflow: hidden;">
          <tr>
            <td style="background-color: #050505; padding: 22px 20px 10px; text-align: center;">
              <img src="${brandLogoUrl()}" alt="${BRAND_NAME}" width="168" style="display: block; margin: 0 auto; max-width: 70%; height: auto;" />
            </td>
          </tr>
          <tr>
            <td style="height: 2px; background: linear-gradient(90deg, #C8102E 0%, ${gold} 100%); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="email-pad" style="padding: 28px 24px 10px; text-align: center;">
              <div style="display: inline-block; border: 1px solid rgba(200,16,46,0.45); background-color: rgba(200,16,46,0.12); border-radius: 999px; padding: 5px 12px; font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #FF263D;">Order confirmed</div>
              <h1 class="email-title" style="margin: 12px 0 8px; font-size: 34px; line-height: 1; color: #ffffff; font-weight: 800;">YOU'RE IN</h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #9a9aa3;">Hi ${firstName}. Your tickets are ready.</p>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding: 18px 24px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" style="padding: 0 4px 8px 0;">
                    <div style="background-color: #141416; border: 1px solid #26262b; border-radius: 10px; padding: 10px 12px;">
                      <div style="font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #8b8b93;">Order</div>
                      <div style="margin-top: 4px; font-size: 14px; font-weight: 800; color: #ffffff;">${orderRef}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding: 0 0 8px 4px;">
                    <div style="background-color: #141416; border: 1px solid #26262b; border-radius: 10px; padding: 10px 12px;">
                      <div style="font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #8b8b93;">Date</div>
                      <div style="margin-top: 4px; font-size: 14px; font-weight: 700; color: #ffffff;">${escapeHtml(orderData.orderDate)}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding: 8px 24px 6px;">
              <div style="margin: 0 0 10px; font-size: 10px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #8b8b93;">Your games</div>
              ${itemCards}
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding: 4px 24px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #141416; border: 1px solid rgba(241,212,122,0.28); border-radius: 12px;">
                <tr>
                  <td style="padding: 14px 16px; font-size: 13px; color: #9a9aa3;">${escapeHtml(orderData.paymentMethod)}</td>
                  <td align="right" style="padding: 14px 16px; font-size: 20px; font-weight: 800; color: ${gold};">£${escapeHtml(String(orderData.totalAmount))}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding: 0 24px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #141416; border: 1px solid #26262b; border-radius: 12px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: ${gold};">Skill question</div>
                    <p style="margin: 8px 0 6px; font-size: 13px; line-height: 1.45; color: #d8d8de;">You wake up at 7:00am and take 30 minutes to get ready. What time are you ready?</p>
                    <p style="margin: 0; font-size: 12px; color: #8b8b93;">7:15am · 7:25am · 7:30am · 7:45am</p>
                    <p style="margin: 10px 0 0; font-size: 13px; font-weight: 800; color: #ffffff;">Answer: 7:30am${
                      orderData.skillAnswer ? ` · Yours: ${escapeHtml(orderData.skillAnswer)}` : ""
                    }</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${
            ticketBlocks
              ? `
          <tr>
            <td class="email-pad" style="padding: 0 24px 8px;">
              <div style="margin: 0 0 10px; font-size: 10px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #8b8b93;">Your tickets</div>
              ${ticketBlocks}
            </td>
          </tr>`
              : ""
          }
          <tr>
            <td class="email-pad" style="padding: 8px 24px 24px; text-align: center;">
              <p style="margin: 0 0 14px; font-size: 13px; line-height: 1.5; color: #8b8b93;">Play everything on My Plays in your account.</p>
              ${emailCta("Open My Plays", `${brandSiteUrl()}/my-plays`)}
            </td>
          </tr>
          <tr>
            <td style="background-color: #050505; border-top: 1px solid #26262b; padding: 18px 20px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #8b8b93;">
                Questions? <a href="mailto:${FROM_EMAIL}" style="color: ${gold}; text-decoration: none; font-weight: 700;">${FROM_EMAIL}</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #5c5c64;">&copy; ${new Date().getFullYear()} ${BRAND_NAME}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { data, error } = await getResend().emails.send({
      from: `${BRAND_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `Order Confirmation #${orderData.orderId.substring(orderData.orderId.length - 8).toUpperCase()}${
        orderData.cartLines && orderData.cartLines.length > 1
          ? ` · ${orderData.cartLines.length} games`
          : ""
      } - ${BRAND_NAME}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending order confirmation email:", error);
      return { success: false, error };
    }

    console.log("Order confirmation email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(
  to: string,
  userData: {
    userName: string;
    email: string;
  },
) {
  const firstName = escapeHtml((userData.userName || "there").split(" ")[0]);
  const emailHtml = wrapBrandEmail({
    pageTitle: `Welcome to ${BRAND_NAME}`,
    kicker: "Welcome",
    title: "YOU'RE IN",
    subtitle: `Hi ${firstName}. Your account is ready.`,
    bodyHtml: `
      ${emailCard(`
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: ${GOLD};">Play now</div>
        <p style="margin: 8px 0 0; font-size: 14px; line-height: 1.55; color: #d8d8de;">Enter prize draws, play instant games, and keep tickets on My Plays.</p>
      `)}
      ${emailCta("Start playing", brandSiteUrl())}
    `,
  });

  try {
    const { data, error } = await getResend().emails.send({
      from: `${BRAND_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `Welcome to ${BRAND_NAME} - Let's Get Started! 🎉`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending welcome email:", error);
      return { success: false, error };
    }

    console.log("Welcome email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return { success: false, error };
  }
}

// Promotional campaign email interface
export interface PromotionalCampaign {
  id: string;
  title: string;
  subject: string;
  message: string;
  offerType: "discount" | "bonus" | "announcement" | "custom";
  discountCode?: string | null;
  discountPercentage?: number | null;
  bonusAmount?: string | null;
  bonusPoints?: number | null;
  expiryDate?: Date | null;
}

// Send promotional campaign email
export async function sendPromotionalEmail(
  to: string,
  campaign: PromotionalCampaign,
) {
  let offerSection = "";

  if (campaign.offerType === "discount" && campaign.discountCode) {
    offerSection = emailCard(`
      <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: ${GOLD};">Discount code</div>
      <div style="margin-top: 10px; font-size: 26px; font-weight: 800; letter-spacing: 0.08em; color: #ffffff; font-family: 'Courier New', monospace;">${escapeHtml(campaign.discountCode)}</div>
      ${campaign.discountPercentage ? `<p style="margin: 8px 0 0; font-size: 14px; color: #d8d8de;">Save ${campaign.discountPercentage}% on your next play.</p>` : ""}
      ${campaign.expiryDate ? `<p style="margin: 6px 0 0; font-size: 12px; color: #8b8b93;">Expires ${new Date(campaign.expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>` : ""}
    `);
  } else if (campaign.offerType === "bonus" && (campaign.bonusAmount || campaign.bonusPoints)) {
    offerSection = emailCard(`
      <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: ${GOLD};">Bonus</div>
      ${campaign.bonusAmount ? `<div style="margin-top: 8px; font-size: 28px; font-weight: 800; color: ${GOLD};">£${escapeHtml(String(campaign.bonusAmount))}</div>` : ""}
      ${campaign.bonusPoints ? `<p style="margin: 6px 0 0; font-size: 16px; font-weight: 700; color: #ffffff;">${campaign.bonusPoints} Ringtone Points</p>` : ""}
      ${campaign.expiryDate ? `<p style="margin: 6px 0 0; font-size: 12px; color: #8b8b93;">Until ${new Date(campaign.expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>` : ""}
    `);
  }

  const emailHtml = wrapBrandEmail({
    pageTitle: campaign.subject,
    kicker: "From the club",
    title: campaign.title.toUpperCase().slice(0, 42),
    subtitle: "A note from Ringtone Riches.",
    bodyHtml: `
      ${emailCard(`<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #d8d8de;">${escapeHtml(campaign.message).replace(/\n/g, "<br/>")}</p>`)}
      ${offerSection}
      ${emailCta("Visit Ringtone Riches", brandSiteUrl())}
      <p style="margin: 16px 0 0; text-align: center; font-size: 11px; color: #5c5c64;">You’re receiving this because you opted in to offers.</p>
    `,
  });

  try {
    const { data, error } = await getResend().emails.send({
      from: `${BRAND_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: campaign.subject,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending promotional email:", error);
      return { success: false, error };
    }

    console.log("Promotional email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send promotional email:", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  userName?: string,
) {
  const firstName = escapeHtml((userName || "there").split(" ")[0]);
  const emailHtml = wrapBrandEmail({
    pageTitle: `Reset your password - ${BRAND_NAME}`,
    kicker: "Security",
    title: "RESET PASSWORD",
    subtitle: `Hi ${firstName}. This link expires in 1 hour.`,
    bodyHtml: `
      ${emailCard(`<p style="margin: 0; font-size: 14px; line-height: 1.55; color: #d8d8de;">If you asked to reset your ${BRAND_NAME} password, tap the button below. If you didn’t, you can ignore this email.</p>`)}
      ${emailCta("Reset password", resetUrl)}
    `,
  });

  try {
    const { data, error } = await getResend().emails.send({
      from: `${BRAND_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: "Reset Your Password",
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending password reset email:", error);
      return { success: false, error };
    }

    console.log("Password reset email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error };
  }
}

// Add this interface at the top with other interfaces
export interface TopupConfirmationPayload {
  userName: string;
  amount: string;
  newBalance: string;
  paymentRef: string;
  paymentMethod: string; // e.g., "Cashflows", "Stripe", "Direct"
  topupDate: string;
}

// Add this function after other email functions
export async function sendTopupConfirmationEmail(
  to: string,
  topupData: TopupConfirmationPayload,
) {
  const firstName = escapeHtml((topupData.userName || "there").split(" ")[0]);
  const emailHtml = wrapBrandEmail({
    pageTitle: `Wallet top-up - ${BRAND_NAME}`,
    kicker: "Wallet",
    title: "FUNDS ADDED",
    subtitle: `Hi ${firstName}. Your wallet is ready to play.`,
    bodyHtml: `
      ${emailCard(`
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size: 12px; color: #8b8b93;">Added</td>
            <td align="right" style="font-size: 20px; font-weight: 800; color: ${GOLD};">£${escapeHtml(String(topupData.amount))}</td>
          </tr>
          <tr>
            <td style="padding-top: 10px; font-size: 12px; color: #8b8b93;">New balance</td>
            <td align="right" style="padding-top: 10px; font-size: 16px; font-weight: 800; color: #ffffff;">£${escapeHtml(String(topupData.newBalance))}</td>
          </tr>
          <tr>
            <td style="padding-top: 10px; font-size: 12px; color: #8b8b93;">${escapeHtml(topupData.paymentMethod)}</td>
            <td align="right" style="padding-top: 10px; font-size: 12px; color: #8b8b93;">${escapeHtml(topupData.topupDate)}</td>
          </tr>
          <tr>
            <td style="padding-top: 10px; font-size: 12px; color: #8b8b93;">Reference</td>
            <td align="right" style="padding-top: 10px; font-size: 12px; color: #8b8b93; font-family: 'Courier New', Consolas, monospace;">${escapeHtml(String(topupData.paymentRef).substring(0, 8))}</td>
          </tr>
        </table>
      `)}
      ${emailCta("Start playing", brandSiteUrl())}
    `,
  });

  try {
    const { data, error } = await getResend().emails.send({
      from: `${BRAND_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `Wallet Top-up Confirmation - £${topupData.amount} Added - ${BRAND_NAME}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending top-up confirmation email:", error);
      return { success: false, error };
    }

    console.log("Top-up confirmation email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send top-up confirmation email:", error);
    return { success: false, error };
  }
}

export async function sendGuestMagicLinkEmail(
  to: string,
  continueUrl: string,
  firstName?: string,
) {
  const name = escapeHtml(firstName || "there");
  const html = wrapBrandEmail({
    pageTitle: `Continue checkout - ${BRAND_NAME}`,
    kicker: "Guest checkout",
    title: "CONTINUE",
    subtitle: `Hi ${name}. This link expires in 30 minutes.`,
    bodyHtml: `
      ${emailCard(`<p style="margin: 0; font-size: 14px; line-height: 1.55; color: #d8d8de;">Tap below to return to your tickets. If you didn’t ask for this, ignore the email.</p>`)}
      ${emailCta("Continue checkout", continueUrl)}
    `,
  });

  try {
    const { data, error } = await getResend().emails.send({
      from: `${BRAND_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `Continue your ${BRAND_NAME} checkout`,
      html,
    });
    if (error) {
      console.error("Guest magic link email error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (error) {
    console.error("Guest magic link email failed:", error);
    return { success: false, error };
  }
}
