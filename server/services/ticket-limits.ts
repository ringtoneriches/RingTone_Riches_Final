/**
 * Per-competition cap on how many tickets one account may hold.
 *
 * Counted CUMULATIVELY across all of that account's orders, not per order —
 * a per-order cap is trivially beaten by placing several orders, which is
 * exactly what happened on the 100%-off sale that prompted this.
 *
 * Kept pure so the arithmetic and the messages are covered by tests; the
 * caller supplies how many the user already holds.
 */

export type TicketLimitCheck =
  | { allowed: true }
  | { allowed: false; message: string; alreadyHeld: number; limit: number; remaining: number };

/** Whether a competition caps tickets per account at all. */
export function hasPerUserLimit(maxTicketsPerUser: number | null | undefined): boolean {
  return typeof maxTicketsPerUser === "number" && maxTicketsPerUser > 0;
}

/**
 * How many more tickets this account may take.
 *
 * Returns Infinity when the competition has no cap, so callers can compare
 * without special-casing.
 */
export function ticketsRemainingForUser(
  maxTicketsPerUser: number | null | undefined,
  alreadyHeld: number,
): number {
  if (!hasPerUserLimit(maxTicketsPerUser)) return Infinity;
  return Math.max(0, (maxTicketsPerUser as number) - Math.max(0, alreadyHeld));
}

/**
 * Whether this purchase is within the account's remaining allowance.
 *
 * The message is written for the customer, since it is shown to them directly:
 * it says what the limit is and how many they can still take, so support does
 * not have to explain a bare refusal.
 */
export function checkTicketLimit(opts: {
  maxTicketsPerUser: number | null | undefined;
  alreadyHeld: number;
  requested: number;
}): TicketLimitCheck {
  const { maxTicketsPerUser, alreadyHeld, requested } = opts;

  if (!hasPerUserLimit(maxTicketsPerUser)) return { allowed: true };

  const limit = maxTicketsPerUser as number;
  const held = Math.max(0, alreadyHeld);
  const remaining = Math.max(0, limit - held);
  const want = Math.max(0, requested);

  if (want <= remaining) return { allowed: true };

  const ticketWord = (n: number) => `${n} ${n === 1 ? "ticket" : "tickets"}`;

  const message =
    remaining === 0
      ? `You already have ${ticketWord(held)} for this competition, which is the limit of ${limit} per person.`
      : `There is a limit of ${limit} per person on this competition. You have ${ticketWord(held)}, so you can take ${ticketWord(remaining)} more.`;

  return { allowed: false, message, alreadyHeld: held, limit, remaining };
}
