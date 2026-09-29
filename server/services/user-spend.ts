/**
 * What a customer has put in, and what they have actually spent.
 *
 * The admin user card showed only their Cashflows deposits, so there was no
 * way to tell someone who topped up £10 and played it through from someone who
 * topped up £10 and never came back without reading their transaction history.
 *
 * Spend is read from `orders`, not from `transactions`. The transactions table
 * cannot answer this: a purchase is written as a negative amount when it comes
 * out of the wallet and a positive one when it comes off a card, some games
 * write a single row for the whole order while others write one row per
 * funding method, and only three of the eight games have a type of their own.
 * Summing any combination of those either cancels out or double counts. An
 * order is one row, already carries its value, and is already marked paid.
 */

/**
 * Points in one pound.
 *
 * `orders.points_amount` is a decimal column but holds a POINTS COUNT, not
 * pounds: a £0.45 order funded entirely by points stores 45.00. Verified
 * against production data -- dividing by 100 reconciles against
 * wallet + card on 96.7% of the orders that used points, where treating it
 * as pounds reconciles on none.
 */
export const POINTS_PER_POUND = 100;

/**
 * The instant win games. Everything else -- currently only `instant` -- is a
 * ticketed prize competition, the "win a £100 voucher" kind, which is bought
 * through /checkout rather than a game billing page.
 */
export const INSTANT_WIN_TYPES = [
  "spin",
  "scratch",
  "pop",
  "plinko",
  "voltz",
  "slot",
  "royal",
] as const;

export function isInstantWinType(type: string | null | undefined): boolean {
  return INSTANT_WIN_TYPES.includes((type ?? "") as (typeof INSTANT_WIN_TYPES)[number]);
}

/** A number that may have arrived from Drizzle as a decimal string. */
function money(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * The cash a customer actually parted with, in pounds.
 *
 * Order value less the part paid for with points, because points were given
 * away rather than paid in and counting them would overstate what the
 * business took. Clamped at zero: a handful of orders are a penny over from
 * rounding, and a negative spend figure on a card would be nonsense.
 */
export function cashSpend(opts: {
  totalValue: string | number | null | undefined;
  pointsValue: string | number | null | undefined;
}): number {
  const spend = money(opts.totalValue) - money(opts.pointsValue) / POINTS_PER_POUND;
  return Math.max(0, Math.round(spend * 100) / 100);
}

export interface SpendRow {
  userId: string;
  /** Order value across every completed order. */
  totalValue: string | number | null;
  /** Points spent across every completed order, as a points count. */
  totalPoints: string | number | null;
  /** Order value across completed orders on instant win games only. */
  gameValue: string | number | null;
  /** Points spent on instant win games only, as a points count. */
  gamePoints: string | number | null;
}

export interface DepositRow {
  userId: string;
  totalCashflow: string | number | null;
}

export interface UserFinancials {
  userId: string;
  /** Money in, through Cashflows. */
  totalCashflow: number;
  /** Cash spent on the instant win games. */
  instantPlaySpend: number;
  /** Cash spent on everything: games and ticketed competitions alike. */
  totalSpend: number;
}

/**
 * Joins the two aggregates into one figure set per user.
 *
 * Kept separate from the queries so the arithmetic can be tested without a
 * database, and so a user with deposits but no orders (or the reverse) still
 * comes back with zeros rather than being dropped.
 */
export function buildUserFinancials(
  deposits: DepositRow[],
  spend: SpendRow[],
): UserFinancials[] {
  const out = new Map<string, UserFinancials>();

  for (const row of deposits) {
    out.set(row.userId, {
      userId: row.userId,
      totalCashflow: Math.round(money(row.totalCashflow) * 100) / 100,
      instantPlaySpend: 0,
      totalSpend: 0,
    });
  }

  for (const row of spend) {
    const existing = out.get(row.userId) ?? {
      userId: row.userId,
      totalCashflow: 0,
      instantPlaySpend: 0,
      totalSpend: 0,
    };
    existing.instantPlaySpend = cashSpend({
      totalValue: row.gameValue,
      pointsValue: row.gamePoints,
    });
    existing.totalSpend = cashSpend({
      totalValue: row.totalValue,
      pointsValue: row.totalPoints,
    });
    out.set(row.userId, existing);
  }

  return [...out.values()];
}
