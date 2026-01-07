import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Brand constants
const BRAND_NAME = "RingTone Riches";
const BRAND_COLOR = "#FACC15"; 
const LOGO_URL = 'https://pub-8ee6681709ff46c18f6e8ff4543d7d3b.r2.dev/Logo_1758887059353.gif';
const FROM_EMAIL = "support@ringtoneriches.co.uk";
const WEBSITE_URL = "https://ringtoneriches.co.uk";

export const verificationEmailTemplate = (otp: string, userName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - ${BRAND_NAME}</title>
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
      .otp-code { font-size: 28px !important; letter-spacing: 5px !important; padding: 15px 25px !important; }
      .otp-box { width: 40px !important; height: 40px !important; font-size: 20px !important; margin: 0 4px !important; }
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
              <h1 class="mobile-h1" style="margin: 0 0 10px; color: #1a1a1a; font-size: 32px; font-weight: bold;">Verify Your Email 🎵</h1>
              <p class="mobile-text-md" style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">Complete your registration to start winning</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px 30px; background-color: #ffffff;">
              <p class="mobile-text-lg" style="margin: 0 0 20px; font-size: 18px; color: #1a1a1a; font-weight: 600;">Hi ${userName},</p>
              
              <p class="mobile-text-md" style="margin: 0 0 25px; font-size: 16px; color: #333333; line-height: 1.6;">
                Welcome to ${BRAND_NAME}! To complete your registration and start entering competitions, please verify your email address using the 6-digit code below.
              </p>
              
              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                <tr>
                  <td align="center">
                    <div class="otp-code" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #F59E0B 100%); color: #1a1a1a; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 25px 50px; border-radius: 10px; text-align: center; margin: 20px 0; box-shadow: 0 4px 12px rgba(250, 204, 21, 0.3);">
                      ${otp}
                    </div>
                    
                    <!-- OTP Number Boxes (Alternative display) -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 20px auto; display: none;">
                      <tr>
                        ${otp.split('').map(digit => `
                          <td>
                            <div class="otp-box" style="width: 50px; height: 50px; background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #F59E0B 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 8px; font-size: 24px; font-weight: bold; color: #1a1a1a; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                              ${digit}
                            </div>
                          </td>
                        `).join('')}
                      </tr>
                    </table>
                    
                    <p class="mobile-text-md" style="margin: 15px 0 0; font-size: 14px; color: #666666; font-style: italic;">
                      ⏰ This code expires in 10 minutes
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Security Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fff5f5; border-radius: 8px; border-left: 4px solid #DC2626; margin-bottom: 25px;">
                <tr>
                  <td class="mobile-padding" style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="30" style="vertical-align: top;">
                          <span style="color: #DC2626; font-size: 20px;">⚠️</span>
                        </td>
                        <td>
                          <p class="mobile-label" style="margin: 0; color: #7F1D1D; font-size: 15px; font-weight: bold;">Security Notice</p>
                          <p class="mobile-text-md" style="margin: 5px 0 0; color: #991B1B; font-size: 14px; line-height: 1.5;">
                            Never share this code with anyone. ${BRAND_NAME} staff will never ask for your verification code.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Next Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; border: 2px solid #e2e8f0; margin-bottom: 25px;">
                <tr>
                  <td class="mobile-padding" style="padding: 25px;">
                    <h2 class="mobile-h2" style="margin: 0 0 15px; color: #1a1a1a; font-size: 20px; font-weight: bold;">What's Next?</h2>
                    
                    <table width="100%" cellpadding="10" cellspacing="0" border="0">
                      <tr>
                        <td width="40" style="vertical-align: top;">
                          <span style="color: ${BRAND_COLOR}; font-size: 20px;">1️⃣</span>
                        </td>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; line-height: 1.6;">
                          <strong style="color: #1a1a1a;">Enter the code above</strong><br/>
                          <span style="color: #666666; font-size: 14px;">Use this 6-digit code on our website to verify your email</span>
                        </td>
                      </tr>
                      <tr>
                        <td width="40" style="vertical-align: top;">
                          <span style="color: ${BRAND_COLOR}; font-size: 20px;">2️⃣</span>
                        </td>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; line-height: 1.6;">
                          <strong style="color: #1a1a1a;">Get your welcome bonus</strong><br/>
                          <span style="color: #666666; font-size: 14px;">Receive your signup bonus after verification</span>
                        </td>
                      </tr>
                      <tr>
                        <td width="40" style="vertical-align: top;">
                          <span style="color: ${BRAND_COLOR}; font-size: 20px;">3️⃣</span>
                        </td>
                        <td class="mobile-label" style="color: #1a1a1a; font-size: 15px; line-height: 1.6;">
                          <strong style="color: #1a1a1a;">Start playing & winning</strong><br/>
                          <span style="color: #666666; font-size: 14px;">Enter competitions, spin the wheel, and win amazing prizes!</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p class="mobile-text-md" style="margin: 0 0 25px; font-size: 16px; color: #333333; line-height: 1.6;">
                If you didn't create an account with ${BRAND_NAME}, please ignore this email or contact our support team immediately.
              </p>
              
              <!-- Quick Links -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #F59E0B 100%); border-radius: 8px; padding: 15px 35px;">
                          <a href="${WEBSITE_URL}/verify-email" style="color: #1a1a1a; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                            Go to Verification Page
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Need Help -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                <tr>
                  <td class="mobile-padding" style="padding: 15px; text-align: center;">
                    <p class="mobile-text-md" style="margin: 0; color: #166534; font-size: 14px;">
                      💡 <strong>Need help?</strong> Check your spam folder or <a href="mailto:${FROM_EMAIL}" style="color: #166534; font-weight: bold; text-decoration: none;">contact support</a> if you're having trouble.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 25px 30px; text-align: center; border-top: 3px solid ${BRAND_COLOR};">
              <p style="margin: 0 0 10px; font-size: 14px; color: #cccccc;">
                Questions? Contact us at <a href="mailto:${FROM_EMAIL}" style="color: ${BRAND_COLOR}; text-decoration: none; font-weight: bold;">${FROM_EMAIL}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.<br/>
                You're receiving this email because you signed up at ${WEBSITE_URL}
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

export async function sendVerificationEmail(email: string, otp: string, userName: string) {
  const subject = "🎵 Verify Your RingTone Riches Account - Your 6-Digit Code Inside!";
  const html = verificationEmailTemplate(otp, userName);

  console.log('📧 [sendVerificationEmail] Starting...');
  console.log('   To:', email);
  console.log('   From:', FROM_EMAIL);
  console.log('   Subject:', subject);
  console.log('   OTP:', otp);
  console.log('   User:', userName);

  try {
    console.log('   Sending via Resend...');
    const { data, error } = await resend.emails.send({
      from: `${BRAND_NAME} <${FROM_EMAIL}>`,
      to: [email],
      subject,
      html,
    });

    if (error) {
      console.error('❌ [sendVerificationEmail] Resend error:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      return { success: false, error };
    }

    console.log('✅ [sendVerificationEmail] Success!');
    console.log('   Email ID:', data?.id);
    console.log('   Response:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('🔥 [sendVerificationEmail] Exception:', error);
    console.error('   Stack:', error.stack);
    return { success: false, error };
  }
}