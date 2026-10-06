/**
 * Pure logic for the Free Daily Spin prize pool.
 *
 * A cycle holds a fixed quantity of each prize tier — many small, few large.
 * A spin draws from what is left, so the odds follow the remaining stock rather
 * than a fixed probability, and the total giveaway for a cycle is known up
 * front. Nothing here touches the database: the caller does the drawing inside
 * a transaction, using `pickPrize` to choose and then a conditional UPDATE to
 * claim it, so two members spinning at once cannot take the same last prize.
 */

export type SpinPrize = {
  id: string;
  pointsValue: number;
  quantity: number;
  remaining: number;
  segmentIndex: number;
  /** What this slice pays. Absent on older callers, which means points. */
  rewardKind?: string | null;
  discountType?: string | null;
  discountValue?: string | number | null;
  discountMaxAmount?: string | number | null;
  discountHours?: number | null;
};

/**
 * The prize tiers, in the order they appear on the wheel artwork.
 *
 * ORDER IS NOT COSMETIC. Index 0 is the wedge at 12 o'clock and they run
 * CLOCKWISE from there, matching attached_assets/daily-spin-wheel.svg, whose
 * labels are baked into the image. The index becomes `segment_index`, which is
 * what the client rotates to — so if this list and the artwork ever disagree,
 * the pointer stops on one prize while the member is credited another.
 *
 * Changing a prize VALUE therefore needs new artwork too. Quantities are free
 * to change at any time: they never appear on the wheel.
 */
export type PrizeTier = {
  pointsValue: number;
  quantity: number;
  rewardKind?: "points" | "discount";
  discountType?: "percentage" | "cash";
  discountValue?: number;
  /** The most the code may take off. Null is uncapped. */
  discountMaxAmount?: number | null;
  discountHours?: number;
};

/**
 * These match the labels painted on the wheel. Four slices pay points and four
 * pay a discount code, alternating, so a spin never feels like only one kind of
 * prize is on offer.
 *
 * The caps matter more than the percentages. A percentage comes off the basket
 * total, so 50% off a £60 basket is £30 -- far more than a free daily spin is
 * meant to be worth. Each one is held to a few pounds, which keeps the top
 * slice exciting to land on and cheap to honour.
 *
 * Quantities are lowest on the biggest discounts, the same way the old wheel
 * rationed its 500-point slice.
 */
export const DEFAULT_PRIZE_TIERS: ReadonlyArray<PrizeTier> = [
  // 0 — top. "10 POINTS"
  { pointsValue: 10, quantity: 2000 },
  // 1 — "50% DISCOUNT"
  { pointsValue: 0, quantity: 25, rewardKind: "discount", discountType: "percentage", discountValue: 50, discountMaxAmount: 5, discountHours: 48 },
  // 2 — "25 POINTS"
  { pointsValue: 25, quantity: 1500 },
  // 3 — "10% DISCOUNT"
  { pointsValue: 0, quantity: 400, rewardKind: "discount", discountType: "percentage", discountValue: 10, discountMaxAmount: 2, discountHours: 48 },
  // 4 — bottom. "75 POINTS"
  { pointsValue: 75, quantity: 400 },
  // 5 — "5% DISCOUNT"
  { pointsValue: 0, quantity: 800, rewardKind: "discount", discountType: "percentage", discountValue: 5, discountMaxAmount: 1, discountHours: 48 },
  // 6 — "50 POINTS"
  { pointsValue: 50, quantity: 800 },
  // 7 — "20% DISCOUNT"
  { pointsValue: 0, quantity: 200, rewardKind: "discount", discountType: "percentage", discountValue: 20, discountMaxAmount: 3, discountHours: 48 },
];

/** Ringtone Points are worth 1p each when converted to wallet credit. */
export const POINT_VALUE_PENCE = 1;

/**
 * Weighted pick across the prizes still in stock, weighted by how many remain.
 *
 * `random` is injectable so the draw can be tested deterministically. Returns
 * null when the pool is exhausted — the caller should then close the cycle.
 */
export function pickPrize<T extends { remaining: number }>(
  prizes: readonly T[],
  random: () => number = Math.random,
): T | null {
  const available = prizes.filter((p) => p.remaining > 0);
  if (available.length === 0) return null;

  const total = available.reduce((sum, p) => sum + p.remaining, 0);
  if (total <= 0) return null;

  // Clamp: a random() of exactly 1 would otherwise fall past the last bucket.
  let ticket = Math.min(Math.floor(random() * total), total - 1);
  for (const prize of available) {
    ticket -= prize.remaining;
    if (ticket < 0) return prize;
  }
  return available[available.length - 1];
}

export type PoolSummary = {
  totalSpins: number;
  spinsRemaining: number;
  spinsUsed: number;
  totalPoints: number;
  pointsAwarded: number;
  pointsRemaining: number;
  /** Remaining giveaway in pounds, if every remaining prize is claimed. */
  liabilityGbp: number;
  exhausted: boolean;
};

/**
 * The figures the admin page shows for a cycle.
 *
 * Only points slices count toward the points figures. A slice switched over to
 * a discount keeps whatever points value it had before -- nothing clears it,
 * and nothing reads it -- so counting it here made the liability read far
 * higher than anything the business could actually owe. The live wheel, whose
 * four discount slices still carry 500, 150, 100 and 250 from their previous
 * lives, was overstated by thousands of points.
 */
export function summarisePool(prizes: readonly SpinPrize[]): PoolSummary {
  const paysPoints = (p: SpinPrize) => (p.rewardKind ?? "points") !== "discount";

  const totalSpins = prizes.reduce((n, p) => n + p.quantity, 0);
  const spinsRemaining = prizes.reduce((n, p) => n + Math.max(0, p.remaining), 0);
  const totalPoints = prizes.reduce(
    (n, p) => n + (paysPoints(p) ? p.quantity * p.pointsValue : 0),
    0,
  );
  const pointsRemaining = prizes.reduce(
    (n, p) => n + (paysPoints(p) ? Math.max(0, p.remaining) * p.pointsValue : 0),
    0,
  );

  return {
    totalSpins,
    spinsRemaining,
    spinsUsed: totalSpins - spinsRemaining,
    totalPoints,
    pointsAwarded: totalPoints - pointsRemaining,
    pointsRemaining,
    liabilityGbp: Math.round(pointsRemaining * POINT_VALUE_PENCE) / 100,
    exhausted: spinsRemaining === 0,
  };
}

/** Build the prize rows for a new cycle, one per wheel segment. */
export function buildCyclePrizes(
  tiers: ReadonlyArray<PrizeTier> = DEFAULT_PRIZE_TIERS,
) {
  return tiers.map((tier, segmentIndex) => ({
    pointsValue: tier.pointsValue,
    quantity: tier.quantity,
    remaining: tier.quantity,
    segmentIndex,
    rewardKind: tier.rewardKind ?? "points",
    discountType: tier.discountType ?? null,
    discountValue: tier.discountValue != null ? String(tier.discountValue) : null,
    discountMaxAmount: tier.discountMaxAmount != null ? String(tier.discountMaxAmount) : null,
    discountHours: tier.discountHours ?? 48,
  }));
}
