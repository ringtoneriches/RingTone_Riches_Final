/**
 * Applying one discount code to a whole basket.
 *
 * A code has always been a single-order thing: the billing page put it on the
 * order it was looking at, and the basket had nowhere to type one. The owner's
 * decision is that a basket code comes off the basket TOTAL -- three items
 * adding up to £20 with a 30% code is charged £14 -- rather than being applied
 * to each line in turn, which would have given away three times the discount.
 *
 * The discount is worked out once on the total and then shared back across the
 * orders, because everything downstream reads per-order figures: the card
 * checkout sums order totals, revenue reporting reads them, and the spend
 * figures on a user card come from them. Leaving the discount only at basket
 * level would have made every one of those disagree with what was charged.
 *
 * All arithmetic is in whole pence. Money in this codebase arrives as decimal
 * strings and a third of £20 has no exact representation in binary floating
 * point, so pounds are converted once at the edges and never added up as
 * floats in between.
 */

export type CartDiscountType = "cash" | "points" | "percentage";

export interface CartLineInput {
  orderId: string;
  /** What this line costs before any basket discount, in pence. */
  amountPence: number;
}

export interface CartLineQuote {
  orderId: string;
  originalPence: number;
  /** This line's share of the basket discount. */
  discountPence: number;
  /** What this line is actually charged. */
  payPence: number;
}

export interface CartDiscountQuote {
  subtotalPence: number;
  discountPence: number;
  totalPence: number;
  lines: CartLineQuote[];
}

/** Points are worth a penny each, the same rate as everywhere else. */
export const PENCE_PER_POINT = 1;

export function poundsToPence(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function penceToPounds(pence: number): number {
  return Math.round(pence) / 100;
}

/**
 * How much comes off the basket, in pence.
 *
 * Never more than the basket is worth: a £5 code on a £3 basket takes the
 * basket to zero rather than owing the customer £2.
 */
export function discountForCart(opts: {
  type: CartDiscountType;
  /** The code's stored value: pounds for cash, points for points, 0-100 for percentage. */
  value: number;
  subtotalPence: number;
}): number {
  const { type, value, subtotalPence } = opts;
  if (!Number.isFinite(value) || value <= 0 || subtotalPence <= 0) return 0;

  let pence: number;
  switch (type) {
    case "percentage":
      if (value > 100) return subtotalPence;
      pence = Math.round((subtotalPence * value) / 100);
      break;
    case "cash":
      pence = Math.round(value * 100);
      break;
    case "points":
      pence = Math.round(value * PENCE_PER_POINT);
      break;
    default:
      return 0;
  }

  return Math.max(0, Math.min(pence, subtotalPence));
}

/**
 * Shares a basket discount back across its lines.
 *
 * Proportional to each line's value, then the leftover pennies from rounding
 * go to the lines with the largest fractional remainder. That keeps the shares
 * as close to proportional as whole pennies allow while guaranteeing they add
 * up to exactly the discount given -- if they did not, the sum of the orders
 * would not equal the amount taken from the card.
 */
export function apportionDiscount(
  discountPence: number,
  lines: CartLineInput[],
): Map<string, number> {
  const out = new Map<string, number>();
  for (const line of lines) out.set(line.orderId, 0);

  const subtotal = lines.reduce((sum, l) => sum + Math.max(0, l.amountPence), 0);
  if (discountPence <= 0 || subtotal <= 0) return out;

  const capped = Math.min(discountPence, subtotal);

  const shares = lines.map((line) => {
    const exact = (Math.max(0, line.amountPence) * capped) / subtotal;
    const floor = Math.floor(exact);
    return { orderId: line.orderId, floor, remainder: exact - floor, cap: Math.max(0, line.amountPence) };
  });

  let assigned = 0;
  for (const share of shares) {
    out.set(share.orderId, share.floor);
    assigned += share.floor;
  }

  // Hand out the pennies lost to flooring, biggest remainder first. A line can
  // never take more than it is worth, so a fully discounted line is skipped.
  let leftover = capped - assigned;
  const order = [...shares].sort((a, b) => b.remainder - a.remainder);
  let i = 0;
  while (leftover > 0 && i < order.length * 2) {
    const share = order[i % order.length];
    const current = out.get(share.orderId) ?? 0;
    if (current < share.cap) {
      out.set(share.orderId, current + 1);
      leftover -= 1;
    }
    i += 1;
  }

  return out;
}

/**
 * The whole quote: what the basket costs, what comes off, and what each order
 * is charged once the discount is shared out.
 */
export function quoteCartDiscount(opts: {
  type: CartDiscountType;
  value: number;
  lines: CartLineInput[];
}): CartDiscountQuote {
  const lines = opts.lines.map((l) => ({
    orderId: l.orderId,
    amountPence: Math.max(0, Math.round(l.amountPence)),
  }));
  const subtotalPence = lines.reduce((sum, l) => sum + l.amountPence, 0);
  const discountPence = discountForCart({
    type: opts.type,
    value: opts.value,
    subtotalPence,
  });
  const shares = apportionDiscount(discountPence, lines);

  const quoted: CartLineQuote[] = lines.map((line) => {
    const share = shares.get(line.orderId) ?? 0;
    return {
      orderId: line.orderId,
      originalPence: line.amountPence,
      discountPence: share,
      payPence: line.amountPence - share,
    };
  });

  const actualDiscount = quoted.reduce((sum, l) => sum + l.discountPence, 0);

  return {
    subtotalPence,
    discountPence: actualDiscount,
    totalPence: subtotalPence - actualDiscount,
    lines: quoted,
  };
}
