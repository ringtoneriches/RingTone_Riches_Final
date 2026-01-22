import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "support@ringtoneriches.co.uk";
const BRAND_NAME = "Ringtone Riches";
const BRAND_COLOR = "#FACC15";

// Logo URL - Update this with your deployed logo URL
// For now using a placeholder - replace with actual hosted URL when deployed
// Example: const LOGO_URL = 'https://yourdomain.com/logo.gif';
const LOGO_URL =
  "https://pub-8ee6681709ff46c18f6e8ff4543d7d3b.r2.dev/Logo_1758887059353.gif";

// Order confirmation email payload type
export interface OrderConfirmationPayload {
  orderId: string;
  userName: string;
  orderType: "competition" | "spin" | "scratch" | "pop";
  itemName: string;
  quantity: number;
  totalAmount: string;
  orderDate: string;
  paymentMethod: string;
  skillQuestion?: string;
  skillAnswer?: string;
  ticketNumbers?: string[];
}

// Email templates with yellow/gold theme
export async function sendOrderConfirmationEmail(
  to: string,
  orderData: OrderConfirmationPayload,
) {
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${BRAND_NAME}</title>
  <style type="text/css">
    /* Mobile-responsive styles */
    @media only screen and (max-width: 480px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding: 20px 15px !important; }
      .mobile-h1 { font-size: 24px !important; }
      .mobile-h2 { font-size: 20px !important; }
      .mobile-text-lg { font-size: 18px !important; line-height: 1.5 !important; }
      .mobile-text-md { font-size: 16px !important; line-height: 1.6 !important; }
      .mobile-label { font-size: 15px !important; }
      .ticket-row { display: block !important; }
      .ticket-box { display: block !important; margin: 5px 0 !important; padding: 10px 15px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="200" style="display: block; margin: 0 auto; max-width: 90%; height: auto;" />
            </td>
          </tr>
          
          <!-- Yellow Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #F59E0B 100%); padding: 25px; text-align: center;">
              <h1 class="mobile-h1" style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: bold;">🎉 Order Confirmed!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px 30px; background-color: #ffffff;">
              <p class="mobile-text-lg" style="margin: 0 0 20px; font-size: 18px; color: #1a1a1a; font-weight: 600;">Hi ${orderData.userName},</p>
              
              <p class="mobile-text-md" style="margin: 0 0 30px; font-size: 16px; color: #333333; line-height: 1.6;">
                Thank you for your purchase! Your order has been confirmed and you're all set to win amazing prizes.
              </p>
              
              <!-- Order Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; border-radius: 8px; border: 2px solid ${BRAND_COLOR}; margin-bottom: 20px;">
                <tr>
                  <td class="mobile-padding" style="padding: 20px;">
                    <h2 class="mobile-h2" style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: bold;">Order Details</h2>
                    
                    <table width="100%" cellpadding="8" cellspacing="0" border="0">
                      <tr>
                        <td class="mobile-label" style="color: #666666; font-size: 15px;">Order ID:</td>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; font-weight: bold; text-align: right;">#${orderData.orderId.substring(orderData.orderId.length - 8).toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td class="mobile-label" style="color: #666666; font-size: 15px;">Date:</td>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; text-align: right;">${orderData.orderDate}</td>
                      </tr>
                      <tr>
                        <td class="mobile-label" style="color: #666666; font-size: 15px;">Game:</td>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; font-weight: bold; text-align: right;">${orderData.itemName}</td>
                      </tr>
                      <tr>
                        <td class="mobile-label" style="color: #666666; font-size: 15px;">Type:</td>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; text-align: right;">
  ${
    orderData.orderType === "competition"
      ? "Competition Entry"
      : orderData.orderType === "spin"
        ? "Spin Wheel"
        : orderData.orderType === "scratch"
          ? "Scratch Card"
          : orderData.orderType === "pop"
            ? "Pop Balloon"
            : "Order"
  }
</td>

                      </tr>
                      <tr>
                        <td class="mobile-label" style="color: #666666; font-size: 15px;">Quantity:</td>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; text-align: right;">${orderData.quantity}</td>
                      </tr>
                      <tr>
                        <td class="mobile-label" style="color: #666666; font-size: 15px;">Payment Method:</td>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; text-align: right;">${orderData.paymentMethod}</td>
                      </tr>
                      <tr style="border-top: 2px solid ${BRAND_COLOR};">
                        <td class="mobile-text-lg" style="color: #1a1a1a; font-size: 18px; font-weight: bold; padding-top: 12px;">Total Paid:</td>
                        <td class="mobile-text-lg" style="color: #1a1a1a; font-size: 20px; font-weight: bold; text-align: right; padding-top: 12px;">£${orderData.totalAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- MANDATORY Skill Question Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbea; border-radius: 8px; border: 2px solid ${BRAND_COLOR}; margin-bottom: 20px;">
                <tr>
                  <td class="mobile-padding" style="padding: 20px;">
                    <h2 class="mobile-h2" style="margin: 0 0 15px; color: #1a1a1a; font-size: 20px; font-weight: bold;">📝 Skill Question</h2>
                    <p class="mobile-label" style="margin: 0 0 10px; color: #666666; font-size: 15px; font-weight: 600;">Question:</p>
                    <p class="mobile-text-md" style="margin: 0 0 15px; color: #1a1a1a; font-size: 16px; line-height: 1.5; font-weight: 600;">
                      You wake up at 7:00am and take 30 minutes to get ready. What time are you ready?
                    </p>
                    <ul style="margin: 0 0 20px; padding-left: 20px; color: #666666;">
                      <li class="mobile-label" style="font-size: 15px; margin: 5px 0;">7:15am</li>
                      <li class="mobile-label" style="font-size: 15px; margin: 5px 0;">7:25am</li>
                      <li class="mobile-label" style="font-size: 15px; margin: 5px 0;">7:30am</li>
                      <li class="mobile-label" style="font-size: 15px; margin: 5px 0;">7:45am</li>
                    </ul>
                     <p class="mobile-text-md" style="margin: 0 0 15px; color: #1a1a1a; font-size: 16px; line-height: 1.5; font-weight: 600;">
                      Answer: 7:30am
                    </p>
                    ${
                      orderData.skillAnswer
                        ? `
                    <p class="mobile-label" style="margin: 0 0 10px; color: #666666; font-size: 15px; font-weight: 600;">Your Answer:</p>
                    <p class="mobile-text-md" style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: bold; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid ${BRAND_COLOR};">
                      ✓ ${orderData.skillAnswer}
                    </p>
                    `
                        : ""
                    }
                  </td>
                </tr>
              </table>
              
              ${
                orderData.ticketNumbers && orderData.ticketNumbers.length > 0
                  ? `
              <!-- Ticket Numbers Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; border-radius: 8px; border: 2px solid ${BRAND_COLOR};">
                <tr>
                  <td class="mobile-padding" style="padding: 20px;">
                    <h2 class="mobile-h2" style="margin: 0 0 15px; color: #1a1a1a; font-size: 20px; font-weight: bold;">🎫 Your ${orderData.orderType === "competition" ? "Entry" : "Draw"} Ticket${orderData.ticketNumbers.length > 1 ? "s" : ""}</h2>
                    <p class="mobile-label" style="margin: 0 0 15px; color: #333333; font-size: 15px;">
                      ${
                        orderData.orderType === "competition"
                          ? "These are your unique competition entry numbers:"
                          : orderData.orderType === "spin"
                            ? "These are your unique ticket numbers for the live draw:"
                            : "These are your unique ticket numbers for the live draw:"
                      }
                    </p>
                    <table cellpadding="5" cellspacing="5" border="0" style="width: 100%;">
                      <tr class="ticket-row">
                        ${orderData.ticketNumbers
                          .map(
                            (ticket) => `
                          <td class="ticket-box" style="background-color: #ffffff; border: 2px solid ${BRAND_COLOR}; border-radius: 8px; padding: 12px 20px;">
                            <span class="mobile-text-lg" style="color: #1a1a1a; font-size: 18px; font-weight: bold; font-family: 'Courier New', monospace;">${ticket}</span>
                          </td>
                        `,
                          )
                          .join("")}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }
              
              <p class="mobile-text-md" style="margin: 30px 0 0; font-size: 16px; color: #333333; line-height: 1.6;">
                Good luck! Visit your account to view your entries and track your progress.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 25px 30px; text-align: center; border-top: 3px solid ${BRAND_COLOR};">
              <p style="margin: 0 0 10px; font-size: 14px; color: #cccccc;">
                Questions? Contact us at <a href="mailto:${FROM_EMAIL}" style="color: ${BRAND_COLOR}; text-decoration: none; font-weight: bold;">${FROM_EMAIL}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </p>
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
    const { data, error } = await resend.emails.send({
      from: `${BRAND_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `Order Confirmation #${orderData.orderId} - ${BRAND_NAME}`,
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
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${BRAND_NAME}</title>
  <style type="text/css">
    /* Mobile-responsive styles */
    @media only screen and (max-width: 480px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding: 20px 15px !important; }
      .mobile-h1 { font-size: 24px !important; }
      .mobile-h2 { font-size: 20px !important; }
      .mobile-text-lg { font-size: 18px !important; line-height: 1.5 !important; }
      .mobile-text-md { font-size: 16px !important; line-height: 1.6 !important; }
      .mobile-label { font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="200" style="display: block; margin: 0 auto; max-width: 90%; height: auto;" />
            </td>
          </tr>
          
          <!-- Yellow Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #F59E0B 100%); padding: 35px 30px; text-align: center;">
              <h1 class="mobile-h1" style="margin: 0 0 10px; color: #1a1a1a; font-size: 32px; font-weight: bold;">Welcome to ${BRAND_NAME}! 🎊</h1>
              <p class="mobile-text-md" style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">Your journey to amazing prizes starts here</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px 30px; background-color: #ffffff;">
              <p class="mobile-text-lg" style="margin: 0 0 20px; font-size: 18px; color: #1a1a1a; font-weight: 600;">Hi ${userData.userName},</p>
              
              <p class="mobile-text-md" style="margin: 0 0 25px; font-size: 16px; color: #333333; line-height: 1.6;">
                Thank you for joining ${BRAND_NAME}! We're excited to have you as part of our community.
              </p>
              
              <!-- Features Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbea; border-radius: 8px; border: 2px solid ${BRAND_COLOR}; margin-bottom: 25px;">
                <tr>
                  <td class="mobile-padding" style="padding: 25px;">
                    <h2 class="mobile-h2" style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: bold;">What You Can Do:</h2>
                    
                    <table width="100%" cellpadding="12" cellspacing="0" border="0">
                      <tr>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; line-height: 1.6;">
                          🏆 <strong style="color: #1a1a1a;">Enter Competitions</strong><br/>
                          <span style="color: #666666; font-size: 15px;">Win amazing prizes from our daily competitions</span>
                        </td>
                      </tr>
                      <tr>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; line-height: 1.6; padding-top: 5px;">
                          🎡 <strong style="color: #1a1a1a;">Spin the Wheel</strong><br/>
                          <span style="color: #666666; font-size: 15px;">Try your luck with our exciting spin wheel games</span>
                        </td>
                      </tr>
                      <tr>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; line-height: 1.6; padding-top: 5px;">
                          🎫 <strong style="color: #1a1a1a;">Scratch Cards</strong><br/>
                          <span style="color: #666666; font-size: 15px;">Instant wins with our digital scratch cards</span>
                        </td>
                      </tr>
                      <tr>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; line-height: 1.6; padding-top: 5px;">
                          🎵 <strong style="color: #1a1a1a;">Earn Ringtone Points</strong><br/>
                          <span style="color: #666666; font-size: 15px;">Collect points to enter more competitions</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p class="mobile-text-md" style="margin: 0 0 25px; font-size: 16px; color: #333333; line-height: 1.6;">
                Log in to your account to start playing and winning today!
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #F59E0B 100%); border-radius: 8px; padding: 15px 35px;">
                    <a href="https://ringtoneriches.co.uk" style="color: #1a1a1a; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                      Start Playing Now
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 25px 30px; text-align: center; border-top: 3px solid ${BRAND_COLOR};">
              <p style="margin: 0 0 10px; font-size: 14px; color: #cccccc;">
                Need help? Contact us at <a href="mailto:${FROM_EMAIL}" style="color: ${BRAND_COLOR}; text-decoration: none; font-weight: bold;">${FROM_EMAIL}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </p>
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
    const { data, error } = await resend.emails.send({
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
  // Build offer details section based on campaign type
  let offerSection = "";

  if (campaign.offerType === "discount" && campaign.discountCode) {
    offerSection = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbea; border-radius: 8px; border: 2px solid ${BRAND_COLOR}; margin-bottom: 25px;">
        <tr>
          <td class="mobile-padding" style="padding: 25px; text-align: center;">
            <h2 class="mobile-h2" style="margin: 0 0 15px; color: #1a1a1a; font-size: 20px; font-weight: bold;">🎁 Special Discount Code</h2>
            <div style="background-color: #ffffff; border: 2px dashed ${BRAND_COLOR}; border-radius: 6px; padding: 15px; display: inline-block; margin: 10px 0;">
              <p style="margin: 0; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Use Code:</p>
              <p style="margin: 5px 0 0; font-size: 28px; color: #1a1a1a; font-weight: bold; font-family: monospace;">${campaign.discountCode}</p>
            </div>
            ${campaign.discountPercentage ? `<p style="margin: 15px 0 0; font-size: 18px; color: #1a1a1a; font-weight: bold;">Save ${campaign.discountPercentage}% on your next purchase!</p>` : ""}
            ${campaign.expiryDate ? `<p style="margin: 10px 0 0; font-size: 14px; color: #666666;">Expires: ${new Date(campaign.expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>` : ""}
          </td>
        </tr>
      </table>
    `;
  } else if (
    campaign.offerType === "bonus" &&
    (campaign.bonusAmount || campaign.bonusPoints)
  ) {
    offerSection = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbea; border-radius: 8px; border: 2px solid ${BRAND_COLOR}; margin-bottom: 25px;">
        <tr>
          <td class="mobile-padding" style="padding: 25px; text-align: center;">
            <h2 class="mobile-h2" style="margin: 0 0 15px; color: #1a1a1a; font-size: 20px; font-weight: bold;">🎉 Bonus Reward!</h2>
            ${campaign.bonusAmount ? `<p style="margin: 10px 0; font-size: 32px; color: #1a1a1a; font-weight: bold;">£${campaign.bonusAmount} Bonus Cash</p>` : ""}
            ${campaign.bonusPoints ? `<p style="margin: 10px 0; font-size: 32px; color: #1a1a1a; font-weight: bold;">${campaign.bonusPoints} Bonus Points</p>` : ""}
            ${campaign.expiryDate ? `<p style="margin: 15px 0 0; font-size: 14px; color: #666666;">Available until: ${new Date(campaign.expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>` : ""}
          </td>
        </tr>
      </table>
    `;
  }

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${campaign.subject}</title>
  <style type="text/css">
    @media only screen and (max-width: 480px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding: 20px 15px !important; }
      .mobile-h1 { font-size: 24px !important; }
      .mobile-h2 { font-size: 20px !important; }
      .mobile-text-lg { font-size: 18px !important; line-height: 1.5 !important; }
      .mobile-text-md { font-size: 16px !important; line-height: 1.6 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="200" style="display: block; margin: 0 auto; max-width: 90%; height: auto;" />
            </td>
          </tr>
          
          <!-- Yellow Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #F59E0B 100%); padding: 25px; text-align: center;">
              <h1 class="mobile-h1" style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: bold;">${campaign.title}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px 30px; background-color: #ffffff;">
              
              <p class="mobile-text-md" style="margin: 0 0 25px; font-size: 16px; color: #333333; line-height: 1.6; white-space: pre-line;">
                ${campaign.message}
              </p>
              
              ${offerSection}
              
              <table cellpadding="0" cellspacing="0" border="0" style="margin: 25px auto 0;">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #F59E0B 100%); border-radius: 8px; padding: 15px 35px;">
                    <a href="https://ringtoneriches.co.uk" style="color: #1a1a1a; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                      Visit Ringtone Riches
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 25px 30px; text-align: center; border-top: 3px solid ${BRAND_COLOR};">
              <p style="margin: 0 0 10px; font-size: 14px; color: #cccccc;">
                Need help? Contact us at <a href="mailto:${FROM_EMAIL}" style="color: ${BRAND_COLOR}; text-decoration: none; font-weight: bold;">${FROM_EMAIL}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </p>
              <p style="margin: 10px 0 0; font-size: 11px; color: #777777;">
                You're receiving this email because you subscribed to our newsletter.
              </p>
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
    const { data, error } = await resend.emails.send({
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
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - ${BRAND_NAME}</title>
  <style type="text/css">
    @media only screen and (max-width: 480px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding: 20px 15px !important; }
      .mobile-h1 { font-size: 24px !important; }
      .mobile-text-lg { font-size: 18px !important; line-height: 1.5 !important; }
      .mobile-text-md { font-size: 16px !important; line-height: 1.6 !important; }
      .mobile-button { padding: 15px 30px !important; font-size: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="200" style="display: block; margin: 0 auto; max-width: 90%; height: auto;" />
            </td>
          </tr>
          
          <!-- Yellow Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #F59E0B 100%); padding: 25px; text-align: center;">
              <h1 class="mobile-h1" style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: bold;">🔐 Password Reset Request</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px 30px;">
              <p class="mobile-text-lg" style="margin: 0 0 20px; font-size: 16px; color: #333333; line-height: 1.6;">
                ${userName ? `Hi ${userName},` : "Hello,"}
              </p>
              
              <p class="mobile-text-md" style="margin: 0 0 20px; font-size: 15px; color: #555555; line-height: 1.6;">
                We received a request to reset your password for your ${BRAND_NAME} account. Click the button below to create a new password:
              </p>
              
              <!-- Reset Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" class="mobile-button" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #F59E0B 100%); color: #1a1a1a; text-decoration: none; font-weight: bold; font-size: 18px; border-radius: 8px; box-shadow: 0 4px 6px rgba(250,204,21,0.3);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p class="mobile-text-md" style="margin: 20px 0 0; font-size: 15px; color: #555555; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="margin: 10px 0 30px; padding: 15px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; word-break: break-all; font-size: 13px; color: #666666;">
                ${resetUrl}
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #fff9e6; border-left: 4px solid ${BRAND_COLOR}; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">
                  <strong style="color: #1a1a1a;">⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
                </p>
              </div>
              
              <p class="mobile-text-md" style="margin: 30px 0 0; font-size: 15px; color: #555555; line-height: 1.6;">
                For security reasons, if you didn't request this password reset, please contact our support team immediately.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #cccccc;">
                Thank you for choosing <strong>${BRAND_NAME}</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </p>
              <p style="margin: 10px 0 0; font-size: 11px; color: #777777;">
                This is an automated email. Please do not reply to this message.
              </p>
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
    const { data, error } = await resend.emails.send({
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
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wallet Top-up Confirmation - ${BRAND_NAME}</title>
  <style type="text/css">
    @media only screen and (max-width: 480px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding: 20px 15px !important; }
      .mobile-h1 { font-size: 24px !important; }
      .mobile-h2 { font-size: 20px !important; }
      .mobile-text-lg { font-size: 18px !important; line-height: 1.5 !important; }
      .mobile-text-md { font-size: 16px !important; line-height: 1.6 !important; }
      .mobile-label { font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="200" style="display: block; margin: 0 auto; max-width: 90%; height: auto;" />
            </td>
          </tr>
          
          <!-- Yellow Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #F59E0B 100%); padding: 25px; text-align: center;">
              <h1 class="mobile-h1" style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: bold;">💰 Wallet Top-up Successful!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px 30px; background-color: #ffffff;">
              <p class="mobile-text-lg" style="margin: 0 0 20px; font-size: 18px; color: #1a1a1a; font-weight: 600;">Hi ${topupData.userName},</p>
              
              <p class="mobile-text-md" style="margin: 0 0 30px; font-size: 16px; color: #333333; line-height: 1.6;">
                Your wallet top-up has been processed successfully! Your funds are now available to use for competitions, spins, and scratch cards.
              </p>
              
              <!-- Top-up Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; border-radius: 8px; border: 2px solid ${BRAND_COLOR}; margin-bottom: 25px;">
                <tr>
                  <td class="mobile-padding" style="padding: 20px;">
                    <h2 class="mobile-h2" style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: bold;">Top-up Details</h2>
                    
                    <table width="100%" cellpadding="8" cellspacing="0" border="0">
                      <tr>
                        <td class="mobile-label" style="color: #666666; font-size: 15px; width: 40%;">Amount Added:</td>
                        <td class="mobile-text-lg" style="color: #1a1a1a; font-size: 20px; font-weight: bold; text-align: right; color: ${BRAND_COLOR};">£${topupData.amount}</td>
                      </tr>
                      <tr>
                        <td class="mobile-label" style="color: #666666; font-size: 15px;">Date:</td>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; text-align: right;">${topupData.topupDate}</td>
                      </tr>
                      <tr>
                        <td class="mobile-label" style="color: #666666; font-size: 15px;">Payment Method:</td>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; text-align: right;">${topupData.paymentMethod}</td>
                      </tr>
                      <tr>
                        <td class="mobile-label" style="color: #666666; font-size: 15px;">Reference:</td>
                        <td class="mobile-label" style="color: #666666; font-size: 14px; text-align: right; font-family: monospace;">${topupData.paymentRef.substring(0, 8)}</td>
                      </tr>
                      <tr style="border-top: 2px solid ${BRAND_COLOR};">
                        <td class="mobile-text-lg" style="color: #1a1a1a; font-size: 18px; font-weight: bold; padding-top: 12px;">New Balance:</td>
                        <td class="mobile-text-lg" style="color: #1a1a1a; font-size: 24px; font-weight: bold; text-align: right; padding-top: 12px; color: #10b981;">£${topupData.newBalance}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Action CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbea; border-radius: 8px; border: 2px solid ${BRAND_COLOR}; margin-bottom: 25px;">
                <tr>
                  <td class="mobile-padding" style="padding: 25px; text-align: center;">
                    <h2 class="mobile-h2" style="margin: 0 0 15px; color: #1a1a1a; font-size: 20px; font-weight: bold;">🎉 Ready to Play?</h2>
                    <p class="mobile-text-md" style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                      Your wallet is now loaded! Start playing and winning amazing prizes today.
                    </p>
                    
                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td align="center" style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #F59E0B 100%); border-radius: 8px; padding: 15px 35px;">
                          <a href="https://ringtoneriches.co.uk" style="color: #1a1a1a; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                            Start Playing Now
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p class="mobile-text-md" style="margin: 30px 0 0; font-size: 16px; color: #333333; line-height: 1.6;">
                If you have any questions about your top-up, please contact our support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 25px 30px; text-align: center; border-top: 3px solid ${BRAND_COLOR};">
              <p style="margin: 0 0 10px; font-size: 14px; color: #cccccc;">
                Questions? Contact us at <a href="mailto:${FROM_EMAIL}" style="color: ${BRAND_COLOR}; text-decoration: none; font-weight: bold;">${FROM_EMAIL}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </p>
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
    const { data, error } = await resend.emails.send({
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
