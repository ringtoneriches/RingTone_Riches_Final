/**
 * Minting a discount code that belongs to the person who won it.
 *
 * The daily spin used to pay Ringtone Points. A discount is a better prize for
 * the business -- it brings someone back and they still have to top up to
 * spend it -- but only if the code is actually theirs. Every code before this
 * was a shared string, so revealing "the 20% code" to a winner would really be
 * revealing it to whoever they showed it to.
 */

/**
 * Letters and digits that survive being read aloud, written down and typed
 * back in. No O/0, I/1, S/5 or Z/2, because a prize nobody can retype is not a
 * prize.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRTUVWXY346789";

export const SPIN_CODE_PREFIX = "SPIN";
export const SPIN_CODE_BODY_LENGTH = 6;

/**
 * A code of the shape SPIN-7K3M9Q.
 *
 * `random` is injected so a test can pin the output; it defaults to
 * Math.random. Collisions are handled by the caller retrying against the
 * unique index on discount_codes.code -- with this alphabet and length there
 * are about 480 million codes, so a retry is rare rather than routine.
 */
export function generateSpinCode(random: () => number = Math.random): string {
  let body = "";
  for (let i = 0; i < SPIN_CODE_BODY_LENGTH; i += 1) {
    const pick = Math.floor(random() * ALPHABET.length);
    body += ALPHABET[Math.min(Math.max(pick, 0), ALPHABET.length - 1)];
  }
  return `${SPIN_CODE_PREFIX}-${body}`;
}

/** When a code won now should stop working. */
export function codeExpiryFrom(now: Date, hours: number | null | undefined): Date {
  const h = Number(hours);
  const safe = Number.isFinite(h) && h > 0 ? h : 48;
  return new Date(now.getTime() + safe * 3600 * 1000);
}

export interface SpinDiscountSlice {
  rewardKind: string | null;
  discountType: string | null;
  discountValue: string | number | null;
  discountMaxAmount: string | number | null;
  discountHours: number | null;
}

/**
 * Whether a slice of the wheel pays a discount, and whether it is usable.
 *
 * A slice set to "discount" with nothing configured would otherwise mint a
 * code worth nothing, which reads to the winner as a broken prize. Treated as
 * not-a-discount so the spin falls back to its points value.
 */
export function discountFromSlice(slice: SpinDiscountSlice): {
  type: "percentage" | "cash";
  value: number;
  maxAmount: number | null;
  hours: number;
} | null {
  if (slice.rewardKind !== "discount") return null;
  if (slice.discountType !== "percentage" && slice.discountType !== "cash") return null;

  const value = Number(slice.discountValue);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (slice.discountType === "percentage" && value > 100) return null;

  const rawMax = Number(slice.discountMaxAmount);
  const maxAmount = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : null;

  const rawHours = Number(slice.discountHours);
  const hours = Number.isFinite(rawHours) && rawHours > 0 ? rawHours : 48;

  return { type: slice.discountType, value, maxAmount, hours };
}

/** How the win reads on the wheel and in the winner's list. */
export function describeSpinDiscount(opts: {
  type: "percentage" | "cash";
  value: number;
  maxAmount: number | null;
}): string {
  const headline =
    opts.type === "percentage"
      ? `${opts.value % 1 === 0 ? opts.value : opts.value.toFixed(2)}% off`
      : `£${opts.value.toFixed(2)} off`;
  if (opts.type === "percentage" && opts.maxAmount) {
    return `${headline}, up to £${opts.maxAmount.toFixed(2)}`;
  }
  return headline;
}
