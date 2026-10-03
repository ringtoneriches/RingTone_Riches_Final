import { describe, it, expect } from "vitest";
import {
  generateSpinCode,
  codeExpiryFrom,
  discountFromSlice,
  describeSpinDiscount,
  SPIN_CODE_BODY_LENGTH,
} from "./spin-discount-code";

describe("generateSpinCode", () => {
  it("looks like a code someone could read out", () => {
    expect(generateSpinCode(() => 0)).toMatch(/^SPIN-[A-Z0-9]{6}$/);
  });

  it("avoids the characters people mistype", () => {
    const codes = Array.from({ length: 400 }, () => generateSpinCode());
    const bodies = codes.map((c) => c.split("-")[1]).join("");
    for (const confusing of ["O", "0", "I", "1", "S", "5", "Z", "2"]) {
      expect(bodies).not.toContain(confusing);
    }
  });

  it("is the right length every time", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateSpinCode().split("-")[1]).toHaveLength(SPIN_CODE_BODY_LENGTH);
    }
  });

  it("does not collide across a realistic day of spins", () => {
    const seen = new Set(Array.from({ length: 5000 }, () => generateSpinCode()));
    expect(seen.size).toBeGreaterThan(4990);
  });

  it("stays in range even if the generator misbehaves", () => {
    expect(generateSpinCode(() => 1)).toMatch(/^SPIN-[A-Z0-9]{6}$/);
    expect(generateSpinCode(() => -1)).toMatch(/^SPIN-[A-Z0-9]{6}$/);
  });
});

describe("codeExpiryFrom", () => {
  const now = new Date("2026-10-03T12:00:00Z");

  it("expires after the configured window", () => {
    expect(codeExpiryFrom(now, 24).toISOString()).toBe("2026-10-04T12:00:00.000Z");
  });

  it("falls back to 48 hours when the window is missing or silly", () => {
    for (const bad of [null, undefined, 0, -5, Number.NaN]) {
      expect(codeExpiryFrom(now, bad as any).toISOString()).toBe("2026-10-05T12:00:00.000Z");
    }
  });
});

describe("discountFromSlice", () => {
  const slice = (over = {}) => ({
    rewardKind: "discount",
    discountType: "percentage",
    discountValue: "20",
    discountMaxAmount: "5",
    discountHours: 48,
    ...over,
  });

  it("reads a configured percentage slice", () => {
    expect(discountFromSlice(slice())).toEqual({
      type: "percentage", value: 20, maxAmount: 5, hours: 48,
    });
  });

  it("reads a cash slice", () => {
    expect(discountFromSlice(slice({ discountType: "cash", discountValue: "3", discountMaxAmount: null })))
      .toEqual({ type: "cash", value: 3, maxAmount: null, hours: 48 });
  });

  it("is nothing for a points slice", () => {
    expect(discountFromSlice(slice({ rewardKind: "points" }))).toBeNull();
  });

  it("refuses a discount slice that was never configured, so it pays points instead", () => {
    expect(discountFromSlice(slice({ discountValue: null }))).toBeNull();
    expect(discountFromSlice(slice({ discountValue: "0" }))).toBeNull();
    expect(discountFromSlice(slice({ discountType: null }))).toBeNull();
    expect(discountFromSlice(slice({ discountValue: "abc" }))).toBeNull();
  });

  it("refuses a percentage over 100", () => {
    expect(discountFromSlice(slice({ discountValue: "150" }))).toBeNull();
  });

  it("treats a missing cap as uncapped and a missing window as 48 hours", () => {
    const d = discountFromSlice(slice({ discountMaxAmount: null, discountHours: null }));
    expect(d).toMatchObject({ maxAmount: null, hours: 48 });
  });
});

describe("describeSpinDiscount", () => {
  it("names a capped percentage so the winner is not surprised at checkout", () => {
    expect(describeSpinDiscount({ type: "percentage", value: 50, maxAmount: 5 }))
      .toBe("50% off, up to £5.00");
  });

  it("names an uncapped percentage plainly", () => {
    expect(describeSpinDiscount({ type: "percentage", value: 20, maxAmount: null }))
      .toBe("20% off");
  });

  it("names a cash discount", () => {
    expect(describeSpinDiscount({ type: "cash", value: 3, maxAmount: null })).toBe("£3.00 off");
  });
});
