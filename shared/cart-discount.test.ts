import { describe, it, expect } from "vitest";
import {
  discountForCart,
  apportionDiscount,
  quoteCartDiscount,
  poundsToPence,
  penceToPounds,
} from "./cart-discount";

describe("discountForCart", () => {
  it("takes a percentage off the basket total", () => {
    // The owner's example: three items totalling £20, 30% off, charge £14.
    expect(discountForCart({ type: "percentage", value: 30, subtotalPence: 2000 })).toBe(600);
  });

  it("takes a cash amount off the total", () => {
    expect(discountForCart({ type: "cash", value: 5, subtotalPence: 2000 })).toBe(500);
  });

  it("treats a points code as a penny a point", () => {
    expect(discountForCart({ type: "points", value: 300, subtotalPence: 2000 })).toBe(300);
  });

  it("never gives back more than the basket is worth", () => {
    expect(discountForCart({ type: "cash", value: 5, subtotalPence: 300 })).toBe(300);
    expect(discountForCart({ type: "points", value: 5000, subtotalPence: 300 })).toBe(300);
    expect(discountForCart({ type: "percentage", value: 150, subtotalPence: 300 })).toBe(300);
  });

  it("is nothing on an empty or worthless basket", () => {
    expect(discountForCart({ type: "percentage", value: 30, subtotalPence: 0 })).toBe(0);
    expect(discountForCart({ type: "cash", value: 5, subtotalPence: 0 })).toBe(0);
  });

  it("ignores a nonsensical code value", () => {
    expect(discountForCart({ type: "cash", value: 0, subtotalPence: 2000 })).toBe(0);
    expect(discountForCart({ type: "cash", value: -5, subtotalPence: 2000 })).toBe(0);
    expect(discountForCart({ type: "percentage", value: Number.NaN, subtotalPence: 2000 })).toBe(0);
  });

  it("rounds a percentage to the nearest penny", () => {
    // 33% of £10.01 = 330.33p
    expect(discountForCart({ type: "percentage", value: 33, subtotalPence: 1001 })).toBe(330);
  });
});

describe("the discount cap", () => {
  it("stops a percentage running away on a big basket", () => {
    // 50% of £60 is £30; the prize was only ever meant to be worth £5.
    expect(discountForCart({ type: "percentage", value: 50, subtotalPence: 6000, maxDiscountPence: 500 })).toBe(500);
  });

  it("leaves a small basket alone, where the percentage is under the cap", () => {
    // 50% of £1 is 50p, nowhere near the £5 ceiling.
    expect(discountForCart({ type: "percentage", value: 50, subtotalPence: 100, maxDiscountPence: 500 })).toBe(50);
  });

  it("caps a cash code too", () => {
    expect(discountForCart({ type: "cash", value: 10, subtotalPence: 6000, maxDiscountPence: 300 })).toBe(300);
  });

  it("is uncapped when no cap is set, as every older code is", () => {
    for (const cap of [null, undefined, 0, -1]) {
      expect(discountForCart({ type: "percentage", value: 50, subtotalPence: 6000, maxDiscountPence: cap as any })).toBe(3000);
    }
  });

  it("never lets the cap push the discount above the basket", () => {
    expect(discountForCart({ type: "cash", value: 50, subtotalPence: 200, maxDiscountPence: 5000 })).toBe(200);
  });

  it("carries the cap through a whole basket quote", () => {
    const q = quoteCartDiscount({
      type: "percentage", value: 50, maxDiscountPence: 500,
      lines: [{ orderId: "a", amountPence: 4000 }, { orderId: "b", amountPence: 2000 }],
    });
    expect(q.discountPence).toBe(500);
    expect(q.totalPence).toBe(5500);
    expect(q.lines.reduce((s, l) => s + l.discountPence, 0)).toBe(500);
  });
});

describe("apportionDiscount", () => {
  const lines = [
    { orderId: "a", amountPence: 1000 },
    { orderId: "b", amountPence: 600 },
    { orderId: "c", amountPence: 400 },
  ];

  it("shares the discount in proportion to each line", () => {
    const shares = apportionDiscount(600, lines);
    expect(shares.get("a")).toBe(300);
    expect(shares.get("b")).toBe(180);
    expect(shares.get("c")).toBe(120);
  });

  it("always adds up to exactly the discount, pennies and all", () => {
    // 1/3 of each line does not divide evenly into pennies.
    const awkward = [
      { orderId: "a", amountPence: 333 },
      { orderId: "b", amountPence: 333 },
      { orderId: "c", amountPence: 334 },
    ];
    for (const discount of [1, 7, 99, 100, 333, 500, 999]) {
      const shares = apportionDiscount(discount, awkward);
      const total = [...shares.values()].reduce((s, v) => s + v, 0);
      expect(total).toBe(discount);
    }
  });

  it("never discounts a line by more than it costs", () => {
    const shares = apportionDiscount(1900, lines);
    for (const line of lines) {
      expect(shares.get(line.orderId)!).toBeLessThanOrEqual(line.amountPence);
    }
  });

  it("gives a single line the whole discount", () => {
    const shares = apportionDiscount(450, [{ orderId: "solo", amountPence: 2000 }]);
    expect(shares.get("solo")).toBe(450);
  });

  it("is all zeros when there is no discount", () => {
    const shares = apportionDiscount(0, lines);
    expect([...shares.values()]).toEqual([0, 0, 0]);
  });

  it("copes with a free line in the basket", () => {
    const withFree = [
      { orderId: "paid", amountPence: 1000 },
      { orderId: "free", amountPence: 0 },
    ];
    const shares = apportionDiscount(300, withFree);
    expect(shares.get("free")).toBe(0);
    expect(shares.get("paid")).toBe(300);
  });
});

describe("quoteCartDiscount", () => {
  it("matches the owner's worked example", () => {
    const quote = quoteCartDiscount({
      type: "percentage",
      value: 30,
      lines: [
        { orderId: "a", amountPence: 1000 },
        { orderId: "b", amountPence: 600 },
        { orderId: "c", amountPence: 400 },
      ],
    });
    expect(quote.subtotalPence).toBe(2000);
    expect(quote.discountPence).toBe(600);
    expect(quote.totalPence).toBe(1400);
  });

  it("keeps the line charges adding up to the basket total", () => {
    const quote = quoteCartDiscount({
      type: "percentage",
      value: 17,
      lines: [
        { orderId: "a", amountPence: 333 },
        { orderId: "b", amountPence: 667 },
        { orderId: "c", amountPence: 1 },
      ],
    });
    const summed = quote.lines.reduce((s, l) => s + l.payPence, 0);
    expect(summed).toBe(quote.totalPence);
    const discounts = quote.lines.reduce((s, l) => s + l.discountPence, 0);
    expect(discounts).toBe(quote.discountPence);
  });

  it("never charges a line a negative amount", () => {
    const quote = quoteCartDiscount({
      type: "cash",
      value: 100,
      lines: [
        { orderId: "a", amountPence: 100 },
        { orderId: "b", amountPence: 200 },
      ],
    });
    for (const line of quote.lines) expect(line.payPence).toBeGreaterThanOrEqual(0);
    expect(quote.totalPence).toBe(0);
  });

  it("handles an empty basket without dividing by zero", () => {
    const quote = quoteCartDiscount({ type: "percentage", value: 30, lines: [] });
    expect(quote).toMatchObject({ subtotalPence: 0, discountPence: 0, totalPence: 0 });
  });
});

describe("pounds and pence", () => {
  it("round-trips a money string from the database", () => {
    expect(poundsToPence("17.57")).toBe(1757);
    expect(penceToPounds(1757)).toBe(17.57);
  });

  it("does not lose a penny to floating point", () => {
    // The values that actually occur: money is stored to two decimals.
    expect(poundsToPence(0.29)).toBe(29);
    expect(poundsToPence(1.01)).toBe(101);
    expect(penceToPounds(1)).toBe(0.01);
  });

  it("round-trips every two-decimal amount up to £50", () => {
    for (let pence = 0; pence <= 5000; pence += 1) {
      expect(poundsToPence(penceToPounds(pence))).toBe(pence);
    }
  });

  it("treats junk as nothing", () => {
    expect(poundsToPence(null)).toBe(0);
    expect(poundsToPence("abc")).toBe(0);
  });
});
