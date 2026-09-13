import { describe, expect, it } from "vitest";
import { formatTransactionAmount, isPointsTransaction } from "./transaction-amount";

describe("formatTransactionAmount", () => {
  it("shows instant-win points prizes as points, not pounds", () => {
    // The customer-reported case: stored as type "prize" with the points count as the amount.
    expect(
      formatTransactionAmount({
        type: "prize",
        amount: "200",
        description: "Instant win — 200 points (ticket #36429)",
      }),
    ).toBe("200 pts");

    expect(
      formatTransactionAmount({
        type: "prize",
        amount: "25",
        description: "Instant win — 25 points (ticket #28888)",
      }),
    ).toBe("25 pts");
  });

  it("keeps cash prizes in pounds", () => {
    expect(
      formatTransactionAmount({ type: "prize", amount: "50.00", description: "Instant win — £50 Cash (test spin)" }),
    ).toBe("£50.00");
    expect(
      formatTransactionAmount({ type: "prize", amount: "1.00", description: "Instant win — Cash £1 (ticket #3)" }),
    ).toBe("£1.00");
    // "cash" without a pound sign still means money
    expect(
      formatTransactionAmount({ type: "prize", amount: "100.00", description: "Instant win — 100 cash (ticket #17)" }),
    ).toBe("£100.00");
  });

  it("handles the other points wordings already in the data", () => {
    expect(
      formatTransactionAmount({ type: "prize", amount: "500", description: "Scratch Card Prize — 500 Ringtones" }),
    ).toBe("500 pts");
    expect(
      formatTransactionAmount({ type: "prize", amount: "50", description: "Ringtone Plinko Win — 50 Points" }),
    ).toBe("50 pts");
    expect(formatTransactionAmount({ type: "ringtone_points", amount: "1800", description: "Ringtone Pop Win — 1800 pts" })).toBe(
      "1,800 pts",
    );
  });

  it("treats everything else as money", () => {
    expect(formatTransactionAmount({ type: "deposit", amount: "10.00", description: "Cashflows wallet top-up £10" })).toBe(
      "£10.00",
    );
    expect(formatTransactionAmount({ type: "purchase", amount: "-4.50", description: "Wallet payment for Royal Reels" })).toBe(
      "£4.50",
    );
    expect(formatTransactionAmount({ type: "withdrawal", amount: "-20.00", description: "Withdrawal request" })).toBe("£20.00");
  });

  it("is robust to missing or odd values", () => {
    expect(formatTransactionAmount({ type: "prize", amount: "", description: null })).toBe("£0.00");
    expect(formatTransactionAmount({ type: "prize", amount: "abc", description: "Instant win — 5 points" })).toBe("0 pts");
    expect(isPointsTransaction({ type: "prize", amount: "3", description: "Instant win — 3 pts (ticket #9)" })).toBe(true);
    expect(isPointsTransaction({ type: "prize", amount: "3", description: "Instant win — £3 cash" })).toBe(false);
  });
});
