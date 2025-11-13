import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'support@ringtoneriches.co.uk';
const BRAND_NAME = 'Ringtone Riches';
const BRAND_COLOR = '#FACC15';

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
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #1a1a1a; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #2a2a2a; border-radius: 12px; overflow: hidden; border: 2px solid ${BRAND_COLOR};">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #F59E0B 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: bold;">🎉 Order Confirmed!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #ffffff;">Hi ${orderData.userName},</p>
              
              <p style="margin: 0 0 30px; font-size: 16px; color: #cccccc; line-height: 1.6;">
                Thank you for your purchase! Your order has been confirmed and you're all set to win amazing prizes.
              </p>
              
              <!-- Order Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 8px; border: 1px solid #404040; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 20px; color: ${BRAND_COLOR}; font-size: 18px;">Order Details</h2>
                    
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #999999; font-size: 14px;">Order ID:</td>
                        <td style="color: #ffffff; font-size: 14px; font-weight: bold; text-align: right;">#${orderData.orderId.substring(orderData.orderId.length - 8).toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td style="color: #999999; font-size: 14px;">Date:</td>
                        <td style="color: #ffffff; font-size: 14px; text-align: right;">${orderData.orderDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #999999; font-size: 14px;">Game:</td>
                        <td style="color: #ffffff; font-size: 14px; font-weight: bold; text-align: right;">${orderData.itemName}</td>
                      </tr>
                      <tr>
                        <td style="color: #999999; font-size: 14px;">Type:</td>
                        <td style="color: #ffffff; font-size: 14px; text-align: right;">${orderData.orderType === 'competition' ? 'Competition Entry' : orderData.orderType === 'spin' ? 'Spin Wheel' : 'Scratch Card'}</td>
                      </tr>
                      <tr>
                        <td style="color: #999999; font-size: 14px;">Quantity:</td>
                        <td style="color: #ffffff; font-size: 14px; text-align: right;">${orderData.quantity}</td>
                      </tr>
                      <tr>
                        <td style="color: #999999; font-size: 14px;">Payment Method:</td>
                        <td style="color: #ffffff; font-size: 14px; text-align: right;">${orderData.paymentMethod}</td>
                      </tr>
                      <tr style="border-top: 1px solid #404040;">
                        <td style="color: ${BRAND_COLOR}; font-size: 16px; font-weight: bold; padding-top: 12px;">Total Paid:</td>
                        <td style="color: ${BRAND_COLOR}; font-size: 18px; font-weight: bold; text-align: right; padding-top: 12px;">£${orderData.totalAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              ${orderData.skillQuestion && orderData.skillAnswer ? `
              <!-- Skill Question Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 8px; border: 1px solid #404040; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px; color: ${BRAND_COLOR}; font-size: 18px;">Skill Question</h2>
                    <p style="margin: 0 0 10px; color: #999999; font-size: 14px;">Question:</p>
                    <p style="margin: 0 0 20px; color: #ffffff; font-size: 15px; line-height: 1.5;">${orderData.skillQuestion}</p>
                    <p style="margin: 0 0 10px; color: #999999; font-size: 14px;">Your Answer:</p>
                    <p style="margin: 0; color: ${BRAND_COLOR}; font-size: 15px; font-weight: bold;">${orderData.skillAnswer}</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              ${orderData.ticketNumbers && orderData.ticketNumbers.length > 0 ? `
              <!-- Ticket Numbers Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 8px; border: 1px solid #404040;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px; color: ${BRAND_COLOR}; font-size: 18px;">Your ${orderData.orderType === 'competition' ? 'Entry' : 'Draw'} Ticket${orderData.ticketNumbers.length > 1 ? 's' : ''}</h2>
                    <p style="margin: 0 0 15px; color: #cccccc; font-size: 14px;">
                      ${orderData.orderType === 'competition' 
                        ? 'These are your unique competition entry numbers:' 
                        : orderData.orderType === 'spin'
                        ? 'These are your unique ticket numbers for the live draw:'
                        : 'These are your unique ticket numbers for the live draw:'}
                    </p>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                      ${orderData.ticketNumbers.map(ticket => `
                        <div style="background-color: #2a2a2a; border: 2px solid ${BRAND_COLOR}; border-radius: 8px; padding: 12px 20px; display: inline-block; margin: 5px;">
                          <span style="color: ${BRAND_COLOR}; font-size: 18px; font-weight: bold; font-family: 'Courier New', monospace;">${ticket}</span>
                        </div>
                      `).join('')}
                    </div>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 30px 0 0; font-size: 16px; color: #cccccc; line-height: 1.6;">
                Good luck! Visit your account to view your entries and track your progress.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 25px 30px; text-align: center; border-top: 1px solid #404040;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #999999;">
                Questions? Contact us at <a href="mailto:${FROM_EMAIL}" style="color: ${BRAND_COLOR}; text-decoration: none;">${FROM_EMAIL}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #666666;">
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
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #1a1a1a; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #2a2a2a; border-radius: 12px; overflow: hidden; border: 2px solid ${BRAND_COLOR};">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #F59E0B 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 10px; color: #1a1a1a; font-size: 32px; font-weight: bold;">Welcome to ${BRAND_NAME}! 🎊</h1>
              <p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 500;">Your journey to amazing prizes starts here</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 18px; color: #ffffff; font-weight: bold;">Hi ${userData.userName},</p>
              
              <p style="margin: 0 0 25px; font-size: 16px; color: #cccccc; line-height: 1.6;">
                Thank you for joining ${BRAND_NAME}! We're excited to have you as part of our community.
              </p>
              
              <!-- Features Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 8px; border: 1px solid #404040; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="margin: 0 0 20px; color: ${BRAND_COLOR}; font-size: 18px;">What You Can Do:</h2>
                    
                    <table width="100%" cellpadding="12" cellspacing="0">
                      <tr>
                        <td style="color: #ffffff; font-size: 15px; line-height: 1.6;">
                          🏆 <strong style="color: ${BRAND_COLOR};">Enter Competitions</strong><br/>
                          <span style="color: #999999; font-size: 14px;">Win amazing prizes from our daily competitions</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #ffffff; font-size: 15px; line-height: 1.6; padding-top: 5px;">
                          🎡 <strong style="color: ${BRAND_COLOR};">Spin the Wheel</strong><br/>
                          <span style="color: #999999; font-size: 14px;">Try your luck with our exciting spin wheel games</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #ffffff; font-size: 15px; line-height: 1.6; padding-top: 5px;">
                          🎫 <strong style="color: ${BRAND_COLOR};">Scratch Cards</strong><br/>
                          <span style="color: #999999; font-size: 14px;">Instant wins with our digital scratch cards</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #ffffff; font-size: 15px; line-height: 1.6; padding-top: 5px;">
                          🎵 <strong style="color: ${BRAND_COLOR};">Earn Ringtone Points</strong><br/>
                          <span style="color: #999999; font-size: 14px;">Collect points to enter more competitions</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 25px; font-size: 16px; color: #cccccc; line-height: 1.6;">
                Log in to your account to start playing and winning today!
              </p>
              
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
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
            <td style="background-color: #1a1a1a; padding: 25px 30px; text-align: center; border-top: 1px solid #404040;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #999999;">
                Need help? Contact us at <a href="mailto:${FROM_EMAIL}" style="color: ${BRAND_COLOR}; text-decoration: none;">${FROM_EMAIL}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #666666;">
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
