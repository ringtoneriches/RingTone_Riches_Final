/**
 * Whether a percentage prize code is actually worth using on this order.
 *
 * Orders already carry an automatic bulk discount: 5% from five plays, 10%
 * from ten, 15% from fifteen (utils/discounts.ts). A prize code does not stack
 * with it -- applying one recalculates the total from the undiscounted price,
 * throwing the bulk saving away -- so a small code on a big basket can leave
 * someone paying MORE than if they had never applied their prize at all.
 *
 * At £0.99 a play that is not an edge case. On fifteen plays the bulk discount
 * saves £2.23, while a 5% code capped at £1 saves £0.74. The customer loses
 * £1.49 and burns a prize to do it, and it looks like a discount, so nobody
 * reports it. Of the 122 codes the daily spin has handed out, 103 are 5% or
 * 10% -- the two that lose on almost every basket worth using them on.
 *
 * So the code is only applied when it genuinely beats the bulk price. When it
 * does not, the order is left alone and the code is left unspent, which is
 * better than silently charging the lower price and consuming the prize for
 * nothing: a code kept is a code that can win on a bigger basket tomorrow.
 */

export type PercentageOutcome =
  | { apply: true; total: number; discountValue: number }
  | { apply: false; reason: "worse_than_bulk"; bulkTotal: number; codeTotal: number };

export type PercentageInput = {
  /** Undiscounted price: ticket price x quantity. */
  fullTotal: number;
  /** What the order already costs, with the automatic bulk discount applied. */
  bulkTotal: number;
  /** The code's percentage, 0-100. */
  percent: number;
  /** The code's ceiling in pounds, or null for none. */
  cap: number | null;
  /** Floor on what an order may be reduced to. */
  minimumTotal: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function decidePercentageDiscount(input: PercentageInput): PercentageOutcome {
  const fullTotal = Number(input.fullTotal) || 0;
  const bulkTotal = Number.isFinite(input.bulkTotal) ? Number(input.bulkTotal) : fullTotal;
  const percent = Number(input.percent) || 0;
  const minimumTotal = Number(input.minimumTotal) || 0;

  const raw = (fullTotal * percent) / 100;
  const cap = input.cap != null && Number.isFinite(input.cap) && input.cap > 0 ? input.cap : null;
  const capped = cap != null ? Math.min(raw, cap) : raw;

  // The floor applies to the code's own result, not to the bulk price, which
  // is whatever the ordinary pricing already decided.
  const codeTotal = round2(Math.max(fullTotal - capped, minimumTotal));
  const bulk = round2(bulkTotal);

  // Ties go to keeping the code: paying the same either way, the customer is
  // better off still holding the prize.
  if (codeTotal >= bulk) {
    return { apply: false, reason: "worse_than_bulk", bulkTotal: bulk, codeTotal };
  }

  return { apply: true, total: codeTotal, discountValue: round2(fullTotal - codeTotal) };
}

/** What to tell someone whose code would have cost them money. */
export function worseThanBulkMessage(bulkTotal: number, codeTotal: number): string {
  const saving = round2(codeTotal - bulkTotal);
  return (
    `Your bulk discount already saves you more than this code ` +
    `(£${bulkTotal.toFixed(2)} vs £${codeTotal.toFixed(2)}). ` +
    `We've kept your code so you can use it when it's worth £${saving.toFixed(2)} more to you.`
  );
}
