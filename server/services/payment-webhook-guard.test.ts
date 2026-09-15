import { describe, expect, it } from "vitest";
import { shouldProcessPaymentWebhook } from "./payment-webhook-guard";

describe("shouldProcessPaymentWebhook", () => {
  it("processes a pending payment (the normal path)", () => {
    expect(shouldProcessPaymentWebhook("pending")).toBe(true);
  });

  it("re-checks a failed payment, because a later attempt may have paid", () => {
    // The customer-reported case: attempt 1 failed 3D Secure and marked the row
    // "failed", then attempt 2 on the same job paid. Blocking here meant the
    // money was collected and nothing was issued.
    expect(shouldProcessPaymentWebhook("failed")).toBe(true);
  });

  it("never reprocesses a completed payment", () => {
    expect(shouldProcessPaymentWebhook("completed")).toBe(false);
  });

  it("stops on anything unrecognised rather than guessing", () => {
    expect(shouldProcessPaymentWebhook("refunded")).toBe(false);
    expect(shouldProcessPaymentWebhook("cancelled")).toBe(false);
    expect(shouldProcessPaymentWebhook("")).toBe(false);
    expect(shouldProcessPaymentWebhook(null)).toBe(false);
    expect(shouldProcessPaymentWebhook(undefined)).toBe(false);
  });
});
