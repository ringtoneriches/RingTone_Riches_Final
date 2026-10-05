/**
 * Choosing which prize to put on an order, without asking.
 *
 * A discount won on the daily spin is already tied to the person who won it,
 * so there is nothing for them to type and nothing to lose. Making them enter
 * a code was only ever how they claimed it; the reward exists either way. So
 * the checkout puts it on for them and says where it came from.
 *
 * Only prizes are auto-applied. A campaign code an admin handed out is still
 * typed in, because applying one nobody asked for would spend a limited code
 * on an order that did not need it.
 */

export interface AutoDiscountCandidate {
  code: string;
  type: string;
  value: string | number;
  maxDiscountAmount: string | number | null;
  expiresAt: Date | string | null;
  source: string | null;
  /** Whether this one has already been spent. */
  used: boolean;
}

function expiryTime(expiresAt: Date | string | null): number {
  if (!expiresAt) return Number.POSITIVE_INFINITY;
  const at = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const ms = at.getTime();
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

export function isUsable(candidate: AutoDiscountCandidate, now: Date): boolean {
  if (candidate.used) return false;
  if (candidate.source !== "daily_spin") return false;
  const value = Number(candidate.value);
  if (!Number.isFinite(value) || value <= 0) return false;
  return expiryTime(candidate.expiresAt) > now.getTime();
}

/**
 * The one to use: whichever runs out first.
 *
 * Not the biggest. A customer who wins 5% today and 50% tomorrow would
 * otherwise watch the 5% quietly expire while the 50% sat on every order --
 * the bigger prize is the one they will come back for anyway, and the small
 * one is the one that needs using. Ties break on the larger discount.
 */
export function pickAutoDiscount(
  candidates: AutoDiscountCandidate[],
  now: Date,
): AutoDiscountCandidate | null {
  const usable = candidates.filter((c) => isUsable(c, now));
  if (!usable.length) return null;

  return usable.slice().sort((a, b) => {
    const ea = expiryTime(a.expiresAt);
    const eb = expiryTime(b.expiresAt);
    if (ea !== eb) return ea - eb;
    return Number(b.value) - Number(a.value);
  })[0];
}

/** How the checkout explains an automatic discount. */
export function autoDiscountLabel(candidate: AutoDiscountCandidate): string {
  const value = Number(candidate.value);
  const headline =
    candidate.type === "percentage"
      ? `${value % 1 === 0 ? value : value.toFixed(2)}% off`
      : `£${value.toFixed(2)} off`;
  return `${headline} — won on your daily spin`;
}
