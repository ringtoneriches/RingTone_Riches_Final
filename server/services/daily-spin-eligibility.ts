/**
 * Who may take a free daily spin.
 *
 * The spin hands out real value — points convert to wallet credit at 1p each —
 * so eligibility is deliberately narrow: registered, verified members only.
 *
 * Kept pure so every rule is covered by tests rather than discovered in
 * production.
 */

export type SpinnerAccount = {
  emailVerified?: boolean | null;
  isGuestAccount?: boolean | null;
};

export type IneligibleReason =
  | "not_signed_in"
  | "guest_account"
  | "email_not_verified"
  | "disabled"
  | "no_pool"
  | "already_spun"
  | "ip_limit";

export type Ineligible = { eligible: false; reason: IneligibleReason; message: string };
export type Eligibility = { eligible: true } | Ineligible;

const MESSAGES: Record<IneligibleReason, string> = {
  not_signed_in: "The daily spin is for members. Log in or join free to take yours.",
  guest_account:
    "The daily spin is for full members. Finish setting up your account to take your free spin.",
  email_not_verified:
    "Verify your email address to unlock your free daily spin.",
  disabled: "The daily spin isn't running at the moment. Check back shortly.",
  no_pool: "No prize pool is active right now. Check back shortly.",
  already_spun: "You've already had your free spin today.",
  ip_limit:
    "There have been too many spins from this connection today. Please try again tomorrow.",
};

export function ineligible(reason: IneligibleReason): Ineligible {
  return { eligible: false, reason, message: MESSAGES[reason] };
}

/**
 * Whether this account may spin at all, ignoring today's usage and the pool.
 *
 * Note that login already refuses unverified accounts, so in practice the only
 * signed-in users who fail this are GUEST accounts — guest checkout creates
 * them without email verification, and they would otherwise be an easy way to
 * farm points without owning a real inbox.
 */
export function accountCanSpin(account: SpinnerAccount | null | undefined): Eligibility {
  if (!account) return ineligible("not_signed_in");
  if (account.isGuestAccount) return ineligible("guest_account");
  if (!account.emailVerified) return ineligible("email_not_verified");
  return { eligible: true };
}

/**
 * Whether another spin may come from this IP today.
 *
 * `limit` of 0 (or less) disables the cap. It should stay generous: UK mobile
 * networks put many unrelated customers behind one address, so a tight cap
 * refuses genuine members with no way for support to explain it.
 */
export function ipWithinDailyLimit(spinsFromIpToday: number, limit: number | null | undefined): boolean {
  if (!limit || limit <= 0) return true;
  return spinsFromIpToday < limit;
}
