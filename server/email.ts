import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'support@ringtoneriches.co.uk';
const BRAND_NAME = 'Ringtone Riches';
const BRAND_COLOR = '#FACC15';

// Logo URL - Update this with your deployed logo URL
// For now using a placeholder - replace with actual hosted URL when deployed
// Example: const LOGO_URL = 'https://yourdomain.com/logo.gif';
const LOGO_URL = 'https://via.placeholder.com/200x80/FACC15/1a1a1a?text=Ringtone+Riches';

// Order confirmation email payload type
export interface OrderConfirmationPayload {
  orderId: string;
  userName: string;
  orderType: 'competition' | 'spin' | 'scratch';
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
  orderData: OrderConfirmationPayload
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
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; text-align: right;">${orderData.orderType === 'competition' ? 'Competition Entry' : orderData.orderType === 'spin' ? 'Spin Wheel' : 'Scratch Card'}</td>
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
                    ${orderData.skillAnswer ? `
                    <p class="mobile-label" style="margin: 0 0 10px; color: #666666; font-size: 15px; font-weight: 600;">Your Answer:</p>
                    <p class="mobile-text-md" style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: bold; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid ${BRAND_COLOR};">
                      ✓ ${orderData.skillAnswer}
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
              
              ${orderData.ticketNumbers && orderData.ticketNumbers.length > 0 ? `
              <!-- Ticket Numbers Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; border-radius: 8px; border: 2px solid ${BRAND_COLOR};">
                <tr>
                  <td class="mobile-padding" style="padding: 20px;">
                    <h2 class="mobile-h2" style="margin: 0 0 15px; color: #1a1a1a; font-size: 20px; font-weight: bold;">🎫 Your ${orderData.orderType === 'competition' ? 'Entry' : 'Draw'} Ticket${orderData.ticketNumbers.length > 1 ? 's' : ''}</h2>
                    <p class="mobile-label" style="margin: 0 0 15px; color: #333333; font-size: 15px;">
                      ${orderData.orderType === 'competition' 
                        ? 'These are your unique competition entry numbers:' 
                        : orderData.orderType === 'spin'
                        ? 'These are your unique ticket numbers for the live draw:'
                        : 'These are your unique ticket numbers for the live draw:'}
                    </p>
                    <table cellpadding="5" cellspacing="5" border="0" style="width: 100%;">
                      <tr class="ticket-row">
                        ${orderData.ticketNumbers.map(ticket => `
                          <td class="ticket-box" style="background-color: #ffffff; border: 2px solid ${BRAND_COLOR}; border-radius: 8px; padding: 12px 20px;">
                            <span class="mobile-text-lg" style="color: #1a1a1a; font-size: 18px; font-weight: bold; font-family: 'Courier New', monospace;">${ticket}</span>
                          </td>
                        `).join('')}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}
              
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
      console.error('Error sending order confirmation email:', error);
      return { success: false, error };
    }

    console.log('Order confirmation email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(
  to: string,
  userData: {
    userName: string;
    email: string;
  }
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
      console.error('Error sending welcome email:', error);
      return { success: false, error };
    }

    console.log('Welcome email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error };
  }
}