import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRIZE_TIERS,
  buildCyclePrizes,
  pickPrize,
  summarisePool,
  type SpinPrize,
} from "./daily-spin-pool";
import { ukDateString } from "./uk-day";

function prize(partial: Partial<SpinPrize> & { remaining: number }): SpinPrize {
  return {
    id: partial.id ?? "p",
    pointsValue: partial.pointsValue ?? 10,
    quantity: partial.quantity ?? partial.remaining,
    remaining: partial.remaining,
    segmentIndex: partial.segmentIndex ?? 0,
  };
}

describe("pickPrize", () => {
  it("returns null when the pool is exhausted", () => {
    expect(pickPrize([])).toBeNull();
    expect(pickPrize([prize({ remaining: 0 }), prize({ remaining: 0 })])).toBeNull();
  });

  it("never picks a tier with nothing left", () => {
    const prizes = [
      prize({ id: "empty", remaining: 0 }),
      prize({ id: "stocked", remaining: 1 }),
    ];
    // Across the whole random range, the empty tier must never come out.
    for (const r of [0, 0.25, 0.5, 0.75, 0.999999]) {
      expect(pickPrize(prizes, () => r)?.id).toBe("stocked");
    }
  });

  it("weights by remaining stock, not by tier count", () => {
    const prizes = [
      prize({ id: "common", remaining: 90 }),
      prize({ id: "rare", remaining: 10 }),
    ];
    expect(pickPrize(prizes, () => 0)?.id).toBe("common");
    expect(pickPrize(prizes, () => 0.5)?.id).toBe("common");
    expect(pickPrize(prizes, () => 0.89)?.id).toBe("common");
    expect(pickPrize(prizes, () => 0.9)?.id).toBe("rare");
    expect(pickPrize(prizes, () => 0.99)?.id).toBe("rare");
  });

  it("does not fall off the end when random() returns 1", () => {
    const prizes = [prize({ id: "a", remaining: 5 }), prize({ id: "b", remaining: 5 })];
    expect(pickPrize(prizes, () => 1)?.id).toBe("b");
  });

  it("distributes roughly in proportion to stock over many draws", () => {
    const prizes = [
      prize({ id: "small", remaining: 800 }),
      prize({ id: "big", remaining: 200 }),
    ];
    let big = 0;
    // Deterministic sweep across the range rather than real randomness.
    for (let i = 0; i < 1000; i++) {
      if (pickPrize(prizes, () => i / 1000)?.id === "big") big++;
    }
    expect(big).toBe(200);
  });
});

describe("summarisePool", () => {
  it("reports spend and remaining liability in pounds", () => {
    const prizes = [
      prize({ pointsValue: 10, quantity: 100, remaining: 40, segmentIndex: 0 }),
      prize({ pointsValue: 500, quantity: 2, remaining: 1, segmentIndex: 1 }),
    ];
    const s = summarisePool(prizes);

    expect(s.totalSpins).toBe(102);
    expect(s.spinsRemaining).toBe(41);
    expect(s.spinsUsed).toBe(61);
    expect(s.totalPoints).toBe(2000);      // 100*10 + 2*500
    expect(s.pointsRemaining).toBe(900);   // 40*10 + 1*500
    expect(s.pointsAwarded).toBe(1100);
    expect(s.liabilityGbp).toBe(9);        // 900 points at 1p
    expect(s.exhausted).toBe(false);
  });

  it("flags an exhausted pool", () => {
    expect(summarisePool([prize({ quantity: 5, remaining: 0 })]).exhausted).toBe(true);
  });
});

describe("buildCyclePrizes", () => {
  it("maps the agreed tiers onto the wheel's 8 segments", () => {
    const rows = buildCyclePrizes();
    expect(rows).toHaveLength(8);
    expect(rows.map((r) => r.segmentIndex)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    // Clockwise from the top, matching the wheel artwork. This is the mapping
    // that decides which wedge the pointer stops on, so it is asserted exactly.
    expect(rows.map((r) => r.pointsValue)).toEqual([10, 500, 25, 150, 75, 100, 50, 250]);
    // A fresh cycle starts with everything in stock.
    expect(rows.every((r) => r.remaining === r.quantity)).toBe(true);
  });

  it("the default cycle costs what we expect", () => {
    const s = summarisePool(buildCyclePrizes().map((r, i) => ({ ...r, id: String(i) })));
    expect(s.totalSpins).toBe(5000);
    expect(s.totalPoints).toBe(166750);
    expect(s.liabilityGbp).toBeCloseTo(1667.5, 2);
  });

  it("accepts custom tiers so each cycle can be rebalanced", () => {
    const rows = buildCyclePrizes([{ pointsValue: 20, quantity: 3 }]);
    expect(rows).toEqual([{ pointsValue: 20, quantity: 3, remaining: 3, segmentIndex: 0 }]);
  });
});

describe("ukDateString (the daily lock key)", () => {
  it("uses the UK date, not the UTC one, during BST", () => {
    // 23:30 UTC on 15 June is already 00:30 on the 16th in the UK. A UTC-based
    // key would still say the 15th and allow a second spin the same UK evening.
    expect(ukDateString(new Date("2026-06-15T23:30:00Z"))).toBe("2026-06-16");
  });

  it("matches UTC in winter, when the UK is on GMT", () => {
    expect(ukDateString(new Date("2026-01-15T23:30:00Z"))).toBe("2026-01-15");
  });

  it("rolls over at UK midnight", () => {
    expect(ukDateString(new Date("2026-06-15T22:59:00Z"))).toBe("2026-06-15");
    expect(ukDateString(new Date("2026-06-15T23:00:00Z"))).toBe("2026-06-16");
  });
});
