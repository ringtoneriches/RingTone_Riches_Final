import { quantityCapFor } from "@/lib/competition-display";

/** What /api/ticket-limits reports for one competition, for this customer. */
export type TicketLimitInfo = {
  limit: number | null;
  note: string | null;
  held: number;
  /** How many more this account may take; null when the competition has no limit. */
  remaining: number | null;
};

export type TicketLimitMap = Record<string, TicketLimitInfo | undefined>;

/**
 * The most a quantity picker may offer for one competition.
 *
 * Unknown limits fall back to the global maximum on purpose: the basket must
 * keep working when the limits request fails, and the server refuses anything
 * over the limit at checkout either way.
 */
export function capFromLimit(info: TicketLimitInfo | undefined, globalMax = 500) {
  if (!info) return Math.max(1, globalMax);
  return quantityCapFor({ maxTicketsPerUser: info.limit }, globalMax, info.remaining);
}

/** Whether this competition caps what one account may take. */
export function isLimited(info: TicketLimitInfo | undefined) {
  return Boolean(info && typeof info.limit === "number" && info.limit > 0);
}

/**
 * Basket lines sitting above what the customer may actually buy.
 *
 * A basket outlives the page it was filled on: an admin can lower a limit, a
 * sale can start, the same account can buy elsewhere, and localStorage keeps
 * the old quantity regardless. Rather than let checkout be the first place
 * anyone hears about it, the basket corrects itself and says so.
 */
export function overLimitLines(
  items: { competitionId: string; quantity: number; title?: string }[],
  limits: TicketLimitMap,
  globalMax = 500,
) {
  const over: { competitionId: string; title?: string; from: number; to: number }[] = [];

  for (const item of items) {
    const info = limits[item.competitionId];
    if (!isLimited(info)) continue;

    const cap = capFromLimit(info, globalMax);
    if (item.quantity > cap) {
      over.push({ competitionId: item.competitionId, title: item.title, from: item.quantity, to: cap });
    }
  }

  return over;
}
