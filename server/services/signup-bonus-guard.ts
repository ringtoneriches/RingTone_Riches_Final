/**
 * Whether a new account may have the signup bonus.
 *
 * The bonus used to be credited at registration with no check of any kind: the
 * route read `signupBonusEnabled` and paid out. Registration also marked every
 * new account as email-verified without ever sending a verification email, so
 * the address was never proven either. One person took it repeatedly from one
 * handset using invented names and inboxes they did not own.
 *
 * Two things close that, and they work together:
 *
 *  - the bonus is now granted only once the email has actually been verified,
 *    so an address nobody owns earns nothing, and
 *  - a limited number of bonuses may be claimed from one IP address in a
 *    rolling window.
 *
 * The IP rule only ever withholds the *bonus*. Registration itself still
 * succeeds, because households, workplaces and student halls share an address
 * and refusing the account would turn a fraud control into a support problem.
 */

/**
 * Bonuses allowed from one address per window.
 *
 * Three rather than one: partners and families sharing a connection are
 * ordinary, and a limit that refuses the second person in a house would be
 * wrong far more often than it was right.
 */
export const SIGNUP_BONUS_IP_LIMIT = 3;

/**
 * How far back the count reaches.
 *
 * A rolling window rather than all time, so one shared or recycled address
 * does not carry a permanent mark. Set against the observed pattern: this
 * account opened roughly six a month for seven months, which this stops after
 * the third in any thirty days.
 */
export const SIGNUP_BONUS_IP_WINDOW_DAYS = 30;

export type BonusRefusal =
  | "already_granted"
  | "bonus_disabled"
  | "nothing_to_give"
  | "ip_limit";

export type BonusDecision = { grant: true } | { grant: false; reason: BonusRefusal };

export type BonusInput = {
  enabled: boolean;
  cash: number;
  points: number;
  /** Set once the bonus has been paid, which makes granting idempotent. */
  alreadyGrantedAt: Date | string | null | undefined;
  /** Bonuses already paid to accounts from this address inside the window. */
  priorGrantsFromIp: number;
  /** 0 or less disables the cap, matching the daily spin's IP limit. */
  ipLimit: number;
};

export function signupBonusDecision(input: BonusInput): BonusDecision {
  // Checked first so a replayed verification can never pay twice, whatever
  // else is true.
  if (input.alreadyGrantedAt) return { grant: false, reason: "already_granted" };

  if (!input.enabled) return { grant: false, reason: "bonus_disabled" };

  const cash = Number(input.cash) || 0;
  const points = Number(input.points) || 0;
  if (cash <= 0 && points <= 0) return { grant: false, reason: "nothing_to_give" };

  const limit = Number(input.ipLimit);
  if (Number.isFinite(limit) && limit > 0 && input.priorGrantsFromIp >= limit) {
    return { grant: false, reason: "ip_limit" };
  }

  return { grant: true };
}

/** The cutoff for counting earlier grants from the same address. */
export function bonusWindowStart(
  now: Date = new Date(),
  days: number = SIGNUP_BONUS_IP_WINDOW_DAYS
): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
