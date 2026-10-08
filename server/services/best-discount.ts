/**
 * Working out a percentage prize code on a single game's checkout.
 *
 * Orders already carry an automatic bulk discount: 5% from five plays, 10%
 * from ten, 15% from fifteen (utils/discounts.ts). Every other kind of code on
 * this checkout comes off the order total, which already has that discount in
 * it -- cash and points codes both subtract from it directly. The percentage
 * branch was the one exception: it recalculated from the undiscounted price,
 * so applying a prize threw the bulk saving away.
 *
 * That made it the odd one out twice over, because the basket at
 * /api/cart/apply-discount quotes a percentage against line totals that
 * already include the bulk discount. The same eight plays came to £9.02 in the
 * basket and £9.50 on the game's own page, and only the game page called it a
 * failure. The owner recorded the difference on video before anyone read the
 * code for it.
 *
 * So a percentage now comes off the order total, like everything else, and the
 * arithmetic is the basket's own discountForCart() rather than a second
 * version of it -- same rounding, same cap, same answer to the penny.
 */
import { discountForCart } from "@shared/cart-discount";

export type PercentageOutcome =
  | { apply: true; total: number; discountValue: number }
  | { apply: false; reason: "nothing_to_save" };

export type PercentageInput = {
  /** What the order already costs, with the automatic bulk discount applied. */
  bulkTotal: number;
  /** The code's percentage, 0-100. */
  percent: number;
  /** The code's ceiling in pounds, or null for none. */
  cap: number | null;
  /** Floor on what an order may be reduced to. */
  minimumTotal: number;
};

const toPence = (pounds: number) => Math.round((Number(pounds) || 0) * 100);
const toPounds = (pence: number) => Math.round(pence) / 100;

export function decidePercentageDiscount(input: PercentageInput): PercentageOutcome {
  const bulkPence = Math.max(0, toPence(input.bulkTotal));
  const minimumPence = Math.max(0, toPence(input.minimumTotal));

  const cap = input.cap != null && Number.isFinite(input.cap) && input.cap > 0 ? input.cap : null;

  // The basket's own maths, so the two checkouts cannot drift apart.
  let discountPence = discountForCart({
    type: "percentage",
    value: Number(input.percent) || 0,
    subtotalPence: bulkPence,
    maxDiscountPence: cap != null ? toPence(cap) : null,
  });

  // Never take an order below the floor.
  if (bulkPence - discountPence < minimumPence) {
    discountPence = Math.max(0, bulkPence - minimumPence);
  }

  // Nothing to give. Refusing leaves the prize unspent for a basket where it
  // is worth something, rather than burning it for zero.
  if (discountPence <= 0) return { apply: false, reason: "nothing_to_save" };

  return {
    apply: true,
    total: toPounds(bulkPence - discountPence),
    discountValue: toPounds(discountPence),
  };
}

/** What to tell someone whose code could not take anything off. */
export function nothingToSaveMessage(): string {
  return "This code can't take anything off this order, so we've kept it for you to use on another.";
}
