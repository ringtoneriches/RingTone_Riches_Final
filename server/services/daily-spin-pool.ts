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
export const DEFAULT_PRIZE_TIERS: ReadonlyArray<{ pointsValue: number; quantity: number }> = [
  { pointsValue: 10, quantity: 2000 },  // 0 — top
  { pointsValue: 500, quantity: 5 },    // 1
  { pointsValue: 25, quantity: 1500 },  // 2
  { pointsValue: 150, quantity: 70 },   // 3
  { pointsValue: 75, quantity: 400 },   // 4 — bottom
  { pointsValue: 100, quantity: 200 },  // 5
  { pointsValue: 50, quantity: 800 },   // 6
  { pointsValue: 250, quantity: 25 },   // 7
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

/** The figures the admin page shows for a cycle. */
export function summarisePool(prizes: readonly SpinPrize[]): PoolSummary {
  const totalSpins = prizes.reduce((n, p) => n + p.quantity, 0);
  const spinsRemaining = prizes.reduce((n, p) => n + Math.max(0, p.remaining), 0);
  const totalPoints = prizes.reduce((n, p) => n + p.quantity * p.pointsValue, 0);
  const pointsRemaining = prizes.reduce(
    (n, p) => n + Math.max(0, p.remaining) * p.pointsValue,
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
  tiers: ReadonlyArray<{ pointsValue: number; quantity: number }> = DEFAULT_PRIZE_TIERS,
) {
  return tiers.map((tier, segmentIndex) => ({
    pointsValue: tier.pointsValue,
    quantity: tier.quantity,
    remaining: tier.quantity,
    segmentIndex,
  }));
}
