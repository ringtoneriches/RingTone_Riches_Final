/**
 * What it means for a discount code to have been "used".
 *
 * A code used to be spent the moment someone typed it into the checkout box
 * and clicked Apply. Nothing ever gave it back: abandoning the page, a
 * declined card, or simply changing your mind all left the use counted. A
 * code with four "uses" had been paid for once. Worse, the counter switched
 * the code off for everybody once it hit its limit, and the per-user record
 * meant the people who never paid could never use it again.
 *
 * So a use is no longer an event we record when the box is filled in. It is
 * read back from the order the code was applied to, which the payment paths
 * already keep up to date:
 *
 *   completed          a real, paid use — counts for good
 *   pending, recent    someone is at the checkout right now, so hold the code
 *                      for them and don't let the last one be taken twice
 *   pending, stale     they walked away; the code is free again
 *   failed / expired   the payment didn't happen; the code is free again
 *
 * Deriving it this way rather than incrementing a counter means there is no
 * second place to keep in step. Orders reach "completed" down ten different
 * payment paths, and a counter hooked into all ten is a counter that breaks
 * the first time an eleventh is added.
 */

/** How long a checkout in progress holds the code before it is handed back. */
export const RESERVATION_HOLD_MINUTES = 30;

export type UsageOrderStatus = "pending" | "completed" | "failed" | "expired" | null;

export interface UsageRow {
  userId: string;
  orderId: string | null;
  usedAt: Date | string | null;
  /** The status of the order this was applied to; null if there is no order. */
  orderStatus: UsageOrderStatus;
}

export type UsageState = "confirmed" | "reserved" | "released";

function ageMinutes(usedAt: Date | string | null, now: Date): number {
  if (!usedAt) return Number.POSITIVE_INFINITY;
  const at = usedAt instanceof Date ? usedAt : new Date(usedAt);
  const ms = at.getTime();
  if (!Number.isFinite(ms)) return Number.POSITIVE_INFINITY;
  return (now.getTime() - ms) / 60000;
}

export function classifyUsage(
  row: UsageRow,
  now: Date,
  holdMinutes: number = RESERVATION_HOLD_MINUTES,
): UsageState {
  if (row.orderStatus === "completed") return "confirmed";

  // Rows from before this was order-backed have nothing to check against.
  // Treat them as spent rather than silently handing back codes that may
  // genuinely have been paid for.
  if (!row.orderId) return "confirmed";

  if (row.orderStatus === "pending") {
    return ageMinutes(row.usedAt, now) < holdMinutes ? "reserved" : "released";
  }

  // failed, expired, or an order that no longer exists.
  return "released";
}

export interface UsageSummary {
  /** Uses that were actually paid for. This is the number to show an admin. */
  confirmed: number;
  /** Checkouts in progress holding the code right now. */
  reserved: number;
}

export function summariseUsages(
  rows: UsageRow[],
  now: Date,
  holdMinutes: number = RESERVATION_HOLD_MINUTES,
): UsageSummary {
  let confirmed = 0;
  let reserved = 0;
  for (const row of rows) {
    const state = classifyUsage(row, now, holdMinutes);
    if (state === "confirmed") confirmed += 1;
    else if (state === "reserved") reserved += 1;
  }
  return { confirmed, reserved };
}

export type ApplyRefusal = "already_used" | "already_applied" | "limit_reached" | "not_yours";

export interface ApplyDecision {
  ok: boolean;
  reason?: ApplyRefusal;
  summary: UsageSummary;
}

/**
 * Whether this person may put this code on an order right now.
 *
 * Both the per-person limit and the overall limit count paid uses plus live
 * holds, so the last remaining use cannot be taken by two people at once,
 * while a checkout someone abandoned half an hour ago stops standing in the
 * way of either of them.
 */
export function canApplyCode(opts: {
  userId: string;
  maxUses: number | null;
  rows: UsageRow[];
  now: Date;
  holdMinutes?: number;
  /**
   * Set when the code belongs to one person, as a daily spin prize does.
   * Null or undefined is a shared code, which is every code that existed
   * before prizes were minted.
   */
  assignedUserId?: string | null;
}): ApplyDecision {
  const hold = opts.holdMinutes ?? RESERVATION_HOLD_MINUTES;
  const summary = summariseUsages(opts.rows, opts.now, hold);

  // Someone else's prize. Checked before anything else so a shared screenshot
  // cannot even reserve the code, let alone spend it.
  if (opts.assignedUserId && opts.assignedUserId !== opts.userId) {
    return { ok: false, reason: "not_yours", summary };
  }

  for (const row of opts.rows) {
    if (row.userId !== opts.userId) continue;
    const state = classifyUsage(row, opts.now, hold);
    if (state === "confirmed") return { ok: false, reason: "already_used", summary };
    if (state === "reserved") return { ok: false, reason: "already_applied", summary };
  }

  // A null limit means unlimited.
  if (opts.maxUses !== null && summary.confirmed + summary.reserved >= opts.maxUses) {
    return { ok: false, reason: "limit_reached", summary };
  }

  return { ok: true, summary };
}

export function refusalMessage(reason: ApplyRefusal): string {
  switch (reason) {
    case "already_used":
      return "You've already used this code";
    case "already_applied":
      return "This code is already on another order you haven't paid for yet";
    case "limit_reached":
      return "Usage limit reached";
    case "not_yours":
      return "That code belongs to another account";
  }
}
