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
  it("maps the wheel's 8 segments to what the artwork says", () => {
    const rows = buildCyclePrizes();
    expect(rows).toHaveLength(8);
    expect(rows.map((r) => r.segmentIndex)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);

    // Clockwise from the top, exactly as painted on
    // attached_assets/daily-spin-wheel.svg. This is the mapping that decides
    // which wedge the pointer stops on, so if it ever drifts the member is
    // credited one prize while the wheel shows another.
    //
    //   0  10 POINTS      1  50% DISCOUNT   2  25 POINTS     3  10% DISCOUNT
    //   4  75 POINTS      5   5% DISCOUNT   6  50 POINTS     7  20% DISCOUNT
    expect(rows.map((r) => r.rewardKind)).toEqual([
      "points", "discount", "points", "discount",
      "points", "discount", "points", "discount",
    ]);
    expect(rows.map((r) => r.pointsValue)).toEqual([10, 0, 25, 0, 75, 0, 50, 0]);
    expect(rows.map((r) => r.discountValue)).toEqual([
      null, "50", null, "10", null, "5", null, "20",
    ]);

    // A fresh cycle starts with everything in stock.
    expect(rows.every((r) => r.remaining === r.quantity)).toBe(true);
  });

  it("caps every discount slice, so a percentage cannot run away on a big basket", () => {
    const discounts = buildCyclePrizes().filter((r) => r.rewardKind === "discount");
    expect(discounts).toHaveLength(4);
    for (const d of discounts) {
      expect(Number(d.discountMaxAmount)).toBeGreaterThan(0);
      // Nothing on a free daily spin should be worth more than a few pounds.
      expect(Number(d.discountMaxAmount)).toBeLessThanOrEqual(5);
      expect(d.discountHours).toBe(48);
    }
  });

  it("the default cycle costs what we expect in points", () => {
    const s = summarisePool(buildCyclePrizes().map((r, i) => ({ ...r, id: String(i) })));
    expect(s.totalSpins).toBe(6125);
    // Only the four points slices carry a points liability; the discount
    // slices cost nothing until someone actually spends the code.
    expect(s.totalPoints).toBe(10 * 2000 + 25 * 1500 + 75 * 400 + 50 * 800);
    expect(s.liabilityGbp).toBeCloseTo(1275, 2);
  });

  it("the worst case on the discount slices is a number we can state", () => {
    const rows = buildCyclePrizes();
    const exposure = rows
      .filter((r) => r.rewardKind === "discount")
      .reduce((sum, r) => sum + r.quantity * Number(r.discountMaxAmount), 0);
    // 25x£5 + 400x£2 + 800x£1 + 200x£3 — every code won and spent to its cap.
    expect(exposure).toBe(2325);
  });

  it("accepts custom tiers so each cycle can be rebalanced", () => {
    const rows = buildCyclePrizes([{ pointsValue: 20, quantity: 3 }]);
    expect(rows[0]).toMatchObject({
      pointsValue: 20, quantity: 3, remaining: 3, segmentIndex: 0, rewardKind: "points",
    });
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

describe("summarisePool with discount slices", () => {
  // A slice switched to a discount keeps its old points value; nothing clears
  // it and nothing reads it. Counting it made the admin liability read far
  // higher than anything that could actually be owed.
  const liveWheel = [
    { id: "0", segmentIndex: 0, rewardKind: "points",   pointsValue: 10,  quantity: 2001, remaining: 1156 },
    { id: "1", segmentIndex: 1, rewardKind: "discount", pointsValue: 500, quantity: 25,   remaining: 22 },
    { id: "2", segmentIndex: 2, rewardKind: "points",   pointsValue: 25,  quantity: 1500, remaining: 810 },
    { id: "3", segmentIndex: 3, rewardKind: "discount", pointsValue: 150, quantity: 400,  remaining: 397 },
    { id: "4", segmentIndex: 4, rewardKind: "points",   pointsValue: 75,  quantity: 400,  remaining: 219 },
    { id: "5", segmentIndex: 5, rewardKind: "discount", pointsValue: 100, quantity: 800,  remaining: 792 },
    { id: "6", segmentIndex: 6, rewardKind: "points",   pointsValue: 50,  quantity: 800,  remaining: 444 },
    { id: "7", segmentIndex: 7, rewardKind: "discount", pointsValue: 250, quantity: 200,  remaining: 198 },
  ] as any;

  it("counts points only where points are actually paid", () => {
    const s = summarisePool(liveWheel);
    expect(s.pointsRemaining).toBe(1156 * 10 + 810 * 25 + 219 * 75 + 444 * 50);
  });

  it("no longer inflates the liability with slices that pay no points", () => {
    const s = summarisePool(liveWheel);
    const ifDiscountsCounted =
      s.pointsRemaining + 22 * 500 + 397 * 150 + 792 * 100 + 198 * 250;
    // The old figure was more than three times the real one.
    expect(ifDiscountsCounted).toBeGreaterThan(s.pointsRemaining * 3);
  });

  it("still counts every slice as a spin, whatever it pays", () => {
    expect(summarisePool(liveWheel).totalSpins).toBe(6126);
  });

  it("treats a slice with no rewardKind as points, as older cycles are", () => {
    const legacy = [{ id: "0", segmentIndex: 0, pointsValue: 50, quantity: 10, remaining: 10 }] as any;
    expect(summarisePool(legacy).pointsRemaining).toBe(500);
  });
});

describe("the default wheel can actually be created", () => {
  // The admin "New cycle" button rejected any slice with pointsValue <= 0, a
  // rule written before a slice could pay anything but points. The four
  // discount slices carry none, so the new wheel could not be created at all.
  // This is that rule, as the endpoint now applies it.
  const rejects = (r: any) => {
    if (!Number.isFinite(r.quantity) || r.quantity < 0) return true;
    if (r.rewardKind === "discount") {
      const value = Number(r.discountValue);
      if (r.discountType !== "percentage" && r.discountType !== "cash") return true;
      if (!Number.isFinite(value) || value <= 0) return true;
      if (r.discountType === "percentage" && value > 100) return true;
      return false;
    }
    return !Number.isFinite(r.pointsValue) || r.pointsValue <= 0;
  };

  it("accepts every slice of the shipped wheel", () => {
    const bad = buildCyclePrizes().filter(rejects);
    expect(bad).toEqual([]);
  });

  it("would have been rejected by the old rule, which is the bug", () => {
    const oldRule = (r: any) => !Number.isFinite(r.pointsValue) || r.pointsValue <= 0 || r.quantity < 0;
    const rejectedBefore = buildCyclePrizes().filter(oldRule);
    expect(rejectedBefore).toHaveLength(4);
    expect(rejectedBefore.map((r) => r.segmentIndex)).toEqual([1, 3, 5, 7]);
  });

  it("still refuses a points slice worth nothing", () => {
    expect(buildCyclePrizes([{ pointsValue: 0, quantity: 10 }]).filter(rejects)).toHaveLength(1);
  });

  it("refuses a discount slice that was never configured", () => {
    const rows = buildCyclePrizes([
      { pointsValue: 0, quantity: 10, rewardKind: "discount" } as any,
    ]);
    expect(rows.filter(rejects)).toHaveLength(1);
  });

  it("refuses a percentage over 100", () => {
    const rows = buildCyclePrizes([
      { pointsValue: 0, quantity: 10, rewardKind: "discount", discountType: "percentage", discountValue: 150 } as any,
    ]);
    expect(rows.filter(rejects)).toHaveLength(1);
  });
});
