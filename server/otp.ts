export class OTPGenerator {
  static generate(): string {
    // Generate 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  static getExpiryTime(minutes: number = 10): Date {
    const now = new Date();
    return new Date(now.getTime() + minutes * 60000);
  }
}