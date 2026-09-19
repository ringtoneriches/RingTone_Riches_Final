import { describe, expect, it } from "vitest";
import { buildCheckoutBoostOffers } from "./checkout-boost";
import type { BasketItem } from "./basket";

const item = (over: Partial<BasketItem> = {}): BasketItem => ({
  competitionId: "a",
  type: "pop",
  title: "Ringtone Pop",
  ticketPrice: "0.50",
  quantity: 1,
  ...over,
});

describe("buildCheckoutBoostOffers and per-person limits", () => {
  it("offers extras as usual when nothing is limited", () => {
    const offers = buildCheckoutBoostOffers([item()]);
    expect(offers.length).toBeGreaterThan(0);
  });

  it("never offers past the competition's cap", () => {
    // Limit 3, one already in the basket: at most 2 more may be offered.
    const offers = buildCheckoutBoostOffers([item({ quantity: 1 })], undefined, () => 3);
    expect(offers.length).toBeGreaterThan(0);
    for (const offer of offers) expect(offer.newQty).toBeLessThanOrEqual(3);
  });

  it("offers nothing on a line already at its cap", () => {
    // The case that matters: offering "2 more plays" on a competition limited
    // to 2 and then refusing at payment is worse than not offering at all.
    expect(buildCheckoutBoostOffers([item({ quantity: 2 })], undefined, () => 2)).toEqual([]);
  });

  it("boosts a different line rather than the capped one", () => {
    const offers = buildCheckoutBoostOffers(
      [item({ competitionId: "capped", quantity: 2 }), item({ competitionId: "free", quantity: 1 })],
      undefined,
      (id) => (id === "capped" ? 2 : 500),
    );
    expect(offers.length).toBeGreaterThan(0);
    for (const offer of offers) expect(offer.competitionId).toBe("free");
  });

  it("offers nothing when every line is at its cap", () => {
    expect(
      buildCheckoutBoostOffers(
        [item({ competitionId: "a", quantity: 2 }), item({ competitionId: "b", quantity: 4 })],
        undefined,
        (id) => (id === "a" ? 2 : 4),
      ),
    ).toEqual([]);
  });

  it("still returns nothing for an empty basket", () => {
    expect(buildCheckoutBoostOffers([])).toEqual([]);
  });
});
