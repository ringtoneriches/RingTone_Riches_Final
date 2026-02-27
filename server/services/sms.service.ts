import twilio from 'twilio';
import dotenv from "dotenv";
dotenv.config();

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export class SMSService {
  
  // Send single SMS
  static async sendSMS(to: string, message: string, title?: string) {
    try {
      // Format message with title if provided
      const fullMessage = title ? `${title}\n\n${message}` : message;
      
      // Ensure phone number is in E.164 format
      const formattedNumber = this.formatPhoneNumber(to);
      
      if (!formattedNumber) {
        throw new Error(`Invalid phone number: ${to}`);
      }

      const result = await twilioClient.messages.create({
        body: fullMessage,
        to: formattedNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
      });

      console.log(`✅ SMS sent to ${formattedNumber}: ${result.sid}`);
      
      return {
        success: true,
        messageId: result.sid,
        status: result.status,
      };
    } catch (error) {
      console.error(`❌ Failed to send SMS to ${to}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Send bulk SMS with rate limiting
  static async sendBulkSMS(
    recipients: { userId: string; phoneNumber: string }[],
    message: string,
    title?: string,
    onProgress?: (sent: number, failed: number, total: number) => void
  ) {
    const results = [];
    const rateLimitDelay = 100; // 100ms between messages (10 per second)
    
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        const result = await this.sendSMS(recipient.phoneNumber, message, title);
        
        results.push({
          ...recipient,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
        }

        // Report progress
        if (onProgress) {
          onProgress(sent, failed, recipients.length);
        }

        // Rate limiting - wait between messages
        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        }

      } catch (error) {
        console.error(`Bulk SMS error for ${recipient.phoneNumber}:`, error);
        failed++;
        results.push({
          ...recipient,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      total: recipients.length,
      sent,
      failed,
      results,
    };
  }

 
static formatPhoneNumber(phone: string): string | null {
    if (!phone) return null;
    
    // Remove all non-numeric characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it already has + and valid length, return as is
    if (cleaned.startsWith('+') && cleaned.length >= 10) {
      return cleaned;
    }
    
    // Remove any leading zeros and non-digits
    const numbersOnly = phone.replace(/\D/g, '');
    
    // UK numbers
    if (numbersOnly.startsWith('44') && numbersOnly.length >= 11) {
      return `+${numbersOnly}`;
    } else if (numbersOnly.startsWith('0') && numbersOnly.length === 11) {
      // UK number with leading 0 (e.g., 03459678641)
      return `+44${numbersOnly.substring(1)}`;
    } else if (numbersOnly.length === 10) {
      // Assume UK number without country code
      return `+44${numbersOnly}`;
    } else if (numbersOnly.length > 10) {
      // Try to extract country code
      return `+${numbersOnly}`;
    }
    
    console.warn(`Could not format phone number: ${phone} -> ${numbersOnly}`);
    return null;
  }

  // Check message status
  static async checkStatus(messageId: string) {
    try {
      const message = await twilioClient.messages(messageId).fetch();
      return {
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
      };
    } catch (error) {
      console.error('Failed to check SMS status:', error);
      return null;
    }
  }
}