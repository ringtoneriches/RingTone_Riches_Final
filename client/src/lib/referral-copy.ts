/**
 * Saying what Ringtone Points are worth, without ever calling them pounds.
 *
 * Points and pounds are not the same thing and must never be printed as if
 * they were: a reward field that had quietly changed from pounds to points
 * once rendered as "£300" for 300 points. The rule here is that a figure is
 * either "300 Ringtone Points" or a parenthetical "(worth £3)" beside it, and
 * the pound sign never goes directly in front of a points value.
 */

/** Ringtone Points in one pound. Mirrors the checkout's conversion. */
export const POINTS_PER_POUND = 100;

/**
 * The cash value of a points figure, as a phrase to sit beside it.
 *
 * Whole pounds lose the trailing zeros, because "worth £3" reads like an
 * amount a person would say and "worth £3.00" reads like a receipt.
 */
export function pointsAsPounds(points: number): string {
  if (!Number.isFinite(points) || points <= 0) return "worth £0";
  const pounds = points / POINTS_PER_POUND;
  const text = Number.isInteger(pounds) ? String(pounds) : pounds.toFixed(2);
  return `worth £${text}`;
}
