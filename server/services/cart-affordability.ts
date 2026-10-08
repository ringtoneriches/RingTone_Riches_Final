/**
 * Whether a basket can actually be paid for before any of it is charged.
 *
 * The basket pays its lines one at a time, and threw partway when the money
 * ran out -- so everything already charged stayed charged. On 5 October one
 * customer lost three games out of five that way, £16.33 taken from a £22.19
 * basket, then hit it twice more in the next four minutes while shrinking the
 * basket to try to get through.
 *
 * There was a guard, but it compared against a balance held on the page. By
 * the time the loop was halfway down the basket that figure was stale -- and
 * each partial payment made the next attempt's estimate worse still.
 *
 * So the sum is checked against the real balance, server side, on the real
 * order totals, before the first line is paid. It is pure so the arithmetic is
 * tested rather than discovered in a customer's wallet.
 */

export type BasketFunds = {
  /** Sum of the orders' totals, in pounds. */
  total: number;
  walletBalance: number;
  /** Points balance as a count, not pounds. */
  ringtonePoints: number;
  useWallet: boolean;
  usePoints: boolean;
};

export type BasketVerdict =
  | { ok: true; wallet: number; points: number }
  | { ok: false; shortfall: number; covered: number };

/** Points are spent at the platform rate of 100 to £1. */
export const PENCE_PER_POINT = 1;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function canCoverBasket(input: BasketFunds): BasketVerdict {
  const total = round2(Math.max(0, Number(input.total) || 0));
  if (total <= 0) return { ok: true, wallet: 0, points: 0 };

  const walletAvailable = input.useWallet
    ? Math.max(0, round2(Number(input.walletBalance) || 0))
    : 0;
  const pointsAvailable = input.usePoints
    ? Math.max(0, round2((Number(input.ringtonePoints) || 0) * 0.01))
    : 0;

  const wallet = Math.min(walletAvailable, total);
  const points = Math.min(pointsAvailable, round2(total - wallet));
  const covered = round2(wallet + points);

  // A penny of float either way should not refuse a basket that is covered.
  if (covered + 0.009 >= total) {
    return { ok: true, wallet: round2(wallet), points: round2(points) };
  }

  return { ok: false, shortfall: round2(total - covered), covered };
}

/** What to tell someone whose basket cannot be paid for yet. */
export function shortfallMessage(verdict: Extract<BasketVerdict, { ok: false }>): string {
  return (
    `You need £${verdict.shortfall.toFixed(2)} more to pay for this basket. ` +
    `Top up, pay by card, or remove something.`
  );
}
