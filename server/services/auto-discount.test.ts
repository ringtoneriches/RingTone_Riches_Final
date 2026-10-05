import { describe, it, expect } from "vitest";
import { pickAutoDiscount, isUsable, autoDiscountLabel, type AutoDiscountCandidate } from "./auto-discount";

const NOW = new Date("2026-10-05T12:00:00Z");
const hours = (n: number) => new Date(NOW.getTime() + n * 3600 * 1000);

const c = (over: Partial<AutoDiscountCandidate> = {}): AutoDiscountCandidate => ({
  code: "SPIN-AAA111",
  type: "percentage",
  value: 10,
  maxDiscountAmount: 2,
  expiresAt: hours(24),
  source: "daily_spin",
  used: false,
  ...over,
});

describe("isUsable", () => {
  it("accepts a fresh unspent prize", () => {
    expect(isUsable(c(), NOW)).toBe(true);
  });

  it("skips one already spent", () => {
    expect(isUsable(c({ used: true }), NOW)).toBe(false);
  });

  it("skips one that has expired", () => {
    expect(isUsable(c({ expiresAt: hours(-1) }), NOW)).toBe(false);
  });

  it("never auto-applies a campaign code an admin handed out", () => {
    expect(isUsable(c({ source: "admin" }), NOW)).toBe(false);
    expect(isUsable(c({ source: null }), NOW)).toBe(false);
  });

  it("skips a prize worth nothing", () => {
    expect(isUsable(c({ value: 0 }), NOW)).toBe(false);
    expect(isUsable(c({ value: "abc" }), NOW)).toBe(false);
  });

  it("treats no expiry as still usable", () => {
    expect(isUsable(c({ expiresAt: null }), NOW)).toBe(true);
  });
});

describe("pickAutoDiscount", () => {
  it("uses the one that runs out first, not the biggest", () => {
    const picked = pickAutoDiscount(
      [
        c({ code: "BIG", value: 50, expiresAt: hours(48) }),
        c({ code: "SOON", value: 5, expiresAt: hours(2) }),
      ],
      NOW,
    );
    // The 50% is what they will come back for; the 5% is what would be lost.
    expect(picked?.code).toBe("SOON");
  });

  it("breaks a tie on the larger discount", () => {
    const picked = pickAutoDiscount(
      [
        c({ code: "SMALL", value: 5, expiresAt: hours(6) }),
        c({ code: "LARGE", value: 25, expiresAt: hours(6) }),
      ],
      NOW,
    );
    expect(picked?.code).toBe("LARGE");
  });

  it("prefers one that expires over one that never does", () => {
    const picked = pickAutoDiscount(
      [c({ code: "FOREVER", expiresAt: null }), c({ code: "TODAY", expiresAt: hours(5) })],
      NOW,
    );
    expect(picked?.code).toBe("TODAY");
  });

  it("is nothing when everything is spent or expired", () => {
    expect(pickAutoDiscount([c({ used: true }), c({ expiresAt: hours(-5) })], NOW)).toBeNull();
  });

  it("is nothing when there is nothing", () => {
    expect(pickAutoDiscount([], NOW)).toBeNull();
  });

  it("ignores campaign codes even when they are the only ones there", () => {
    expect(pickAutoDiscount([c({ source: "admin", value: 90 })], NOW)).toBeNull();
  });
});

describe("autoDiscountLabel", () => {
  it("says where it came from, so it is not mistaken for a price change", () => {
    expect(autoDiscountLabel(c({ value: 20 }))).toBe("20% off — won on your daily spin");
  });

  it("handles a cash prize", () => {
    expect(autoDiscountLabel(c({ type: "cash", value: 3 }))).toBe("£3.00 off — won on your daily spin");
  });
});
