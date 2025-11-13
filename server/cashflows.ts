// cashflows.ts
import dotenv from "dotenv";
dotenv.config();
import crypto from "crypto";
import axios from "axios";

export class CashflowsService {
  constructor(
    private config: {
      apiKey: string;
      configurationId: string;
      baseUrl: string;
    }
  ) {}

  async createPaymentSession(amount: number, userId?: string) {
    const amountString = amount.toFixed(2); // amount in GBP (e.g. 10.00)
    
    // Get client URL from environment
    const domains = process.env.REPLIT_DOMAINS?.split(',') || [];
    const clientUrl = domains.length > 0 ? `https://${domains[0]}` : 'http://localhost:5000';

    // ✅ Minimal payload for Hosted Checkout (configurationId goes in HEADERS ONLY)
    const payload = {
      amountToCollect: amountString,
      currency: "GBP",
      parameters: {
        returnUrlSuccess: `${clientUrl}/wallet/success`,
        returnUrlFailed: `${clientUrl}/wallet/failed`,
        returnUrlCancelled: `${clientUrl}/wallet/cancelled`,
      },
      metadata: {
        userId, 
      },
    };

    // ✅ Generate correct SHA512 hash: "append message body to API password" = apiKey + body
    const jsonBody = JSON.stringify(payload);
    const hash = crypto
      .createHash("sha512")
      .update(this.config.apiKey + jsonBody, "utf8")
      .digest("hex")
      .toUpperCase();

    const headers = {
      ConfigurationId: this.config.configurationId,
      Hash: hash,
      "Content-Type": "application/json",
    };

    console.log("🧩 Sending Cashflows Hosted request...");
    console.log("➡️ URL:", `${this.config.baseUrl}/payment-jobs`);
    console.log("➡️ Body:", jsonBody);
    console.log("Hash:", hash);
    try {
      const res = await axios.post(
        `${this.config.baseUrl}/payment-jobs`,
        payload,
        { headers }
      );

      // Cashflows Hosted usually returns `actions[0].url`
      const hostedPageUrl =
        res.data?.actions?.[0]?.url || res.data?.links?.action?.url;

      return {
        success: true,
        hostedPageUrl,
        paymentJobReference:
          res.data?.data?.reference || res.data?.reference || null,
        fullResponse: res.data,
      };
    } catch (err: any) {
      console.error("❌ Cashflows API Error:");
      console.error("Status:", err.response?.status);
      console.error("Full Error:", JSON.stringify(err.response?.data, null, 2));
      console.error("Message:", err.message);
      throw err;
    }
  }

async createCompetitionPaymentSession(amount: number, metadata: any) {
  const amountString = amount.toFixed(2);
  
  // Get client URL from environment
  const domains = process.env.REPLIT_DOMAINS?.split(',') || [];
  const clientUrl = domains.length > 0 ? `https://${domains[0]}` : 'http://localhost:5000';

  const payload = {
    amountToCollect: amountString,
    currency: "GBP",
    parameters: {
      returnUrlSuccess: `${clientUrl}/success/competition`,
      returnUrlFailed: `${clientUrl}/failed`,
      returnUrlCancelled: `${clientUrl}/cancelled`,
    },
    metadata,
  };

  const jsonBody = JSON.stringify(payload);
  const hash = crypto
    .createHash("sha512")
    .update(this.config.apiKey + jsonBody, "utf8")
    .digest("hex")
    .toUpperCase();

  const headers = {
    ConfigurationId: this.config.configurationId,
    Hash: hash,
    "Content-Type": "application/json",
  };

  try {
    const res = await axios.post(`${this.config.baseUrl}/payment-jobs`, payload, { headers });

      const hostedPageUrl =
      res.data?.links?.action?.url ||
      res.data?.actions?.[0]?.url || // fallback for other response shapes
      null;

    console.log("🔗 Hosted page redirect URL:", hostedPageUrl);
    console.log("🔁 Full Cashflows Response:", res.data);

    console.log("➡️ Cashflows Hosted URL:", hostedPageUrl || "❌ Missing in response");
    return {
      success: true,
      hostedPageUrl,
      paymentJobReference: res.data?.data?.reference || res.data?.reference || null,
      fullResponse: res.data,
    };
  } catch (err: any) {
    console.error("❌ Cashflows Competition Payment API Error:");
    console.error("Status:", err.response?.status);
    console.error("Full Error:", JSON.stringify(err.response?.data, null, 2));
    console.error("Message:", err.message);
    throw err;
  }
}

  async getPaymentStatus(sessionId: string) {
    const url = `${this.config.baseUrl}/payment-jobs/${sessionId}`;

    // For GET, Cashflows requires only the API key hashed
    const hash = crypto
      .createHash("sha512")
      .update(this.config.apiKey, "utf8")
      .digest("hex")
      .toUpperCase();

    const headers = {
      ConfigurationId: this.config.configurationId,
      Hash: hash,
      "Content-Type": "application/json",
    };

    try {
      const res = await axios.get(url, { headers });
      return res.data;
    } catch (err: any) {
      console.error(
        "❌ Failed to fetch payment status:",
        err.response?.data || err.message
      );
      throw err;
    }
  }
}

// ✅ Use the Hosted endpoint
// Integration URL: https://gateway-int.cashflows.com/api/gateway
// Production URL: https://gateway.cashflows.com/api/gateway
export const cashflows = new CashflowsService({
  apiKey: process.env.CASHFLOWS_API_KEY!,
  configurationId: process.env.CASHFLOWS_CONFIGURATION_ID!,
  baseUrl:
    process.env.CASHFLOWS_BASE_URL ||
    "https://gateway-int.cashflows.com/api/gateway", // Default to integration for testing
});
