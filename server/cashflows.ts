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

    // ✅ Minimal payload for Hosted Checkout (configurationId goes in HEADERS ONLY)
    const payload = {
      amountToCollect: amountString,
      currency: "GBP",
      parameters: {
        returnUrlSuccess: `${process.env.CLIENT_URL}/wallet/success`,
        returnUrlFailed: `${process.env.CLIENT_URL}/wallet/failed`,
        returnUrlCancelled: `${process.env.CLIENT_URL}/wallet/cancelled`,
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
  const displayOrderNumber = `${String(metadata.orderId || "cart")
    .replace(/-/g, "")
    .substring(0, 12)}/${Date.now().toString().slice(-7)}`;

  const firstName = String(metadata.firstName || metadata.customerFirstName || "").trim();
  const lastName = String(metadata.lastName || metadata.customerLastName || "").trim();
  const emailAddress = String(metadata.email || metadata.customerEmail || "").trim();
  const orderLines = Array.isArray(metadata.orderLines) ? metadata.orderLines : [];
  const cartReturn = metadata.cartCheckout ? "&cart=1" : "";

  const order: Record<string, unknown> = {
    orderNumber: displayOrderNumber,
  };
  if (firstName || lastName) {
    order.billingAddress = {
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
    };
  }
  if (emailAddress) {
    order.billingIdentity = { emailAddress };
  }

  const cashflowsMeta = { ...metadata };
  delete cashflowsMeta.orderLines;
  delete cashflowsMeta.firstName;
  delete cashflowsMeta.lastName;
  delete cashflowsMeta.email;
  delete cashflowsMeta.customerFirstName;
  delete cashflowsMeta.customerLastName;
  delete cashflowsMeta.customerEmail;

  const buildPayload = (includeLines: boolean) => ({
    amountToCollect: amountString,
    currency: "GBP",
    order: includeLines && orderLines.length ? { ...order, orderLines } : order,
    parameters: {
      returnUrlSuccess: `${process.env.CLIENT_URL}/success/competition?orderId=${metadata.orderId}${cartReturn}`,
      returnUrlFailed: `${process.env.CLIENT_URL}/failed?orderId=${metadata.orderId}`,
      returnUrlCancelled: `${process.env.CLIENT_URL}/cancelled?orderId=${metadata.orderId}`,
    },
    metadata: cashflowsMeta,
  });

  const postJob = async (payload: ReturnType<typeof buildPayload>) => {
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

    return axios.post(`${this.config.baseUrl}/payment-jobs`, payload, { headers });
  };

  try {
    let res;
    try {
      res = await postJob(buildPayload(true));
    } catch (lineErr: any) {
      if (!orderLines.length) throw lineErr;
      console.warn(
        "Cashflows rejected orderLines; retrying without them:",
        lineErr.response?.data || lineErr.message,
      );
      res = await postJob(buildPayload(false));
    }

    const hostedPageUrl =
      res.data?.links?.action?.url ||
      res.data?.actions?.[0]?.url ||
      null;

    console.log("🔗 Hosted page redirect URL:", hostedPageUrl);
    console.log("🔁 Full Cashflows Response:", JSON.stringify(res.data, null, 2));
    console.log("📝 Cashflows Reference:", res.data?.data?.reference);
    console.log("📝 Our Order ID:", metadata.orderId);

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

  async getPaymentStatus(paymentJobRef: string, paymentRef?: string) {
  let url = `${this.config.baseUrl}/payment-jobs/${paymentJobRef}`;

  // If paymentRef exists, fetch the specific payment inside the job
  if (paymentRef) {
    url = `${this.config.baseUrl}/payment-jobs/${paymentJobRef}/payments/${paymentRef}`;
  }

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
    "https://gateway.cashflows.com/api/gateway", // Default to integration for testing
});
