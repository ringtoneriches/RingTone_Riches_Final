/**
 * How a transaction amount should read in the wallet history.
 *
 * Points prizes are stored the same way as cash prizes — type "prize" with the
 * points count in `amount` (e.g. "Instant win — 200 points" with amount "200").
 * Only the description says which it is, so decide from the description and fall
 * back to cash. Kept pure so the awkward cases stay covered by tests.
 */

export type AmountLike = {
  type?: string | null;
  amount: string | number;
  description?: string | null;
};

/** "200 points", "50 pts", "500 Ringtones" — a points payout. */
const POINTS_PATTERN = /\b\d[\d,]*\s*(points?|pts|ringtones?)\b/i;
/** "£25", "25 cash", "Cash £1" — real money, even if the word "points" appears elsewhere. */
const CASH_PATTERN = /£|\bcash\b/i;

export function isPointsTransaction(transaction: AmountLike): boolean {
  if (transaction.type === "ringtone_points") return true;

  const description = transaction.description || "";
  if (CASH_PATTERN.test(description)) return false;
  return POINTS_PATTERN.test(description);
}

export function formatTransactionAmount(transaction: AmountLike): string {
  const amount = Math.abs(parseFloat(String(transaction.amount)) || 0);

  if (isPointsTransaction(transaction)) {
    return `${Math.round(amount).toLocaleString()} pts`;
  }

  return `£${amount.toFixed(2)}`;
}
