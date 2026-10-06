import { describe, expect, it } from "vitest";
import { hasCashflowsReference, isCashflowsTransaction } from "./cashflows-transactions";

/** What the old three-clause rule did, kept so the change can be compared to it. */
function oldRule(tx: { type?: string | null; paymentRef?: string | null; description?: string | null }) {
  if (tx.type === "deposit") return true;
  const ref = tx.paymentRef ?? "";
  if (
    tx.type === "purchase" &&
    ref !== "" &&
    ref !== "N/A" &&
    (tx.description ?? "").includes("Instant play purchase")
  ) {
    return true;
  }
  return ref.startsWith("260");
}

describe("hasCashflowsReference", () => {
  it("accepts a real Cashflows reference", () => {
    expect(hasCashflowsReference("261021100445493516")).toBe(true);
  });

  it("accepts the old prefix too, which is the same kind of reference", () => {
    expect(hasCashflowsReference("260998877665544332")).toBe(true);
  });

  it("rejects the placeholders written when there was no payment", () => {
    expect(hasCashflowsReference(null)).toBe(false);
    expect(hasCashflowsReference(undefined)).toBe(false);
    expect(hasCashflowsReference("")).toBe(false);
    expect(hasCashflowsReference("   ")).toBe(false);
    expect(hasCashflowsReference("N/A")).toBe(false);
    expect(hasCashflowsReference("n/a")).toBe(false);
  });
});

describe("isCashflowsTransaction", () => {
  // The bug. A basket purchase is written as "Cart card payment: ...", so the
  // description test never matched it, and once Cashflows moved its reference
  // prefix from 260 to 261 on 1 October 2026 nothing matched it at all.
  const basketPurchase = {
    type: "purchase",
    paymentRef: "261021100445493516",
    description: "Cart card payment: 1 game — £10.69",
  };

  it("shows a basket purchase, which the old rule hid", () => {
    expect(oldRule(basketPurchase)).toBe(false);
    expect(isCashflowsTransaction(basketPurchase)).toBe(true);
  });

  it("still shows an instant play purchase", () => {
    const tx = {
      type: "purchase",
      paymentRef: "260111222333444555",
      description: "Instant play purchase: RINGTONE POP - £9.80",
    };
    expect(oldRule(tx)).toBe(true);
    expect(isCashflowsTransaction(tx)).toBe(true);
  });

  it("still shows deposits, with or without a reference", () => {
    expect(isCashflowsTransaction({ type: "deposit", paymentRef: "260555" })).toBe(true);
    expect(isCashflowsTransaction({ type: "deposit", paymentRef: null })).toBe(true);
    expect(isCashflowsTransaction({ type: "deposit", paymentRef: "cb_261021100445493516" })).toBe(true);
  });

  it("leaves out spending that never touched a card", () => {
    // Only purchases and deposits ever carry a reference, so these are the
    // rows that must stay off the screen.
    expect(isCashflowsTransaction({ type: "prize", paymentRef: null })).toBe(false);
    expect(isCashflowsTransaction({ type: "ringtone_points", paymentRef: null })).toBe(false);
    expect(isCashflowsTransaction({ type: "pop_purchase", paymentRef: null })).toBe(false);
    expect(isCashflowsTransaction({ type: "withdrawal", paymentRef: null })).toBe(false);
    expect(isCashflowsTransaction({ type: "purchase", paymentRef: null })).toBe(false);
  });

  it("does not depend on the reference prefix, so the next roll is harmless", () => {
    // 260 -> 261 broke the screen once. 262 must not break it again.
    for (const prefix of ["251", "260", "261", "262", "270"]) {
      const tx = { type: "purchase", paymentRef: `${prefix}021100445493516`, description: "Cart card payment: 1 game" };
      expect(isCashflowsTransaction(tx)).toBe(true);
    }
  });

  it("never hides anything the old rule showed", () => {
    const rows = [
      { type: "deposit", paymentRef: null, description: "Signup bonus" },
      { type: "deposit", paymentRef: "cb_260111", description: "Card cashback — 1% of £9.80" },
      { type: "purchase", paymentRef: "260111", description: "Instant play purchase: POP" },
      { type: "purchase", paymentRef: "260222", description: "Cart card payment: 2 games" },
      { type: "purchase", paymentRef: "261333", description: "Cart card payment: 1 game" },
      { type: "prize", paymentRef: null, description: "Voltz win" },
    ];
    for (const row of rows) {
      if (oldRule(row)) expect(isCashflowsTransaction(row)).toBe(true);
    }
  });
});
