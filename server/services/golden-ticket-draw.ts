/**
 * Golden Ticket draw logic.
 *
 * Deliberately free of database imports so it can be unit tested: this is the
 * part that decides who wins, and it is the part that most needs proving.
 *
 * The draw is committed before anyone plays. When a campaign is activated the
 * system picks distinct play positions inside a window and seals them. Play
 * number N arrives, and if N is on the list a ticket drops. Nobody can choose
 * a winner afterwards because there is nothing left to choose.
 */

export type CampaignDraw = {
  status: string;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  eligibleGameTypes: string[];
  eligibleCompetitionIds: string[];
  minSpend?: string | number | null;
  includeFreePlays: boolean;
  ticketCount: number;
  dropWindow: number;
  dropPositions: number[];
};

export type PlayContext = {
  gameType: string;
  competitionId?: string | null;
  /** What the player spent on this play, in pounds. Zero for a free play. */
  spend?: number;
  /** Guests are excluded, so this must be a real account. */
  userId?: string | null;
};

export class GoldenTicketError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 400, code = "golden_ticket_error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Choose the winning play positions for a campaign, in [1, dropWindow].
 *
 * Returned sorted, which makes a sealed campaign readable by a human auditor
 * without changing what it means.
 */
export function pickDropPositions(
  ticketCount: number,
  dropWindow: number,
  random: () => number = Math.random,
): number[] {
  if (!Number.isInteger(ticketCount) || ticketCount < 1) {
    throw new GoldenTicketError("A campaign needs at least one ticket.");
  }
  if (!Number.isInteger(dropWindow) || dropWindow < 1) {
    throw new GoldenTicketError("The drop window must be a positive number of plays.");
  }
  if (ticketCount > dropWindow) {
    throw new GoldenTicketError(
      `The drop window (${dropWindow} plays) has to be at least as large as the ticket count (${ticketCount}).`,
    );
  }

  // Rejection sampling is fine while the tickets are sparse in the window, and
  // degenerates badly when they are not — so shuffle instead once they are
  // dense. Both produce a uniform choice of distinct positions.
  if (ticketCount * 2 > dropWindow) {
    const all = Array.from({ length: dropWindow }, (_, i) => i + 1);
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(0, ticketCount).sort((a, b) => a - b);
  }

  const picked = new Set<number>();
  while (picked.size < ticketCount) {
    picked.add(Math.floor(random() * dropWindow) + 1);
  }
  return [...picked].sort((a, b) => a - b);
}

function toTime(value: Date | string | null | undefined) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * Whether this play counts toward a campaign at all.
 *
 * A play that is not eligible does not advance the counter, so an ineligible
 * game can never consume a ticket position.
 */
export function isPlayEligible(
  campaign: CampaignDraw,
  play: PlayContext,
  now: Date = new Date(),
): { eligible: boolean; reason?: string } {
  if (campaign.status !== "active") return { eligible: false, reason: "campaign_not_active" };

  // Guests are excluded, and they have no account to credit.
  if (!play.userId) return { eligible: false, reason: "no_account" };

  const at = now.getTime();
  const starts = toTime(campaign.startsAt);
  const ends = toTime(campaign.endsAt);
  if (starts !== null && at < starts) return { eligible: false, reason: "not_started" };
  if (ends !== null && at > ends) return { eligible: false, reason: "ended" };

  // An empty list means every game, rather than no games.
  if (campaign.eligibleGameTypes.length && !campaign.eligibleGameTypes.includes(play.gameType)) {
    return { eligible: false, reason: "game_not_eligible" };
  }
  if (
    campaign.eligibleCompetitionIds.length &&
    (!play.competitionId || !campaign.eligibleCompetitionIds.includes(play.competitionId))
  ) {
    return { eligible: false, reason: "competition_not_eligible" };
  }

  const spend = Number(play.spend ?? 0);
  if (spend <= 0 && !campaign.includeFreePlays) {
    return { eligible: false, reason: "free_play_excluded" };
  }
  const minSpend = campaign.minSpend == null ? null : Number(campaign.minSpend);
  if (minSpend !== null && Number.isFinite(minSpend) && spend < minSpend) {
    return { eligible: false, reason: "below_min_spend" };
  }

  return { eligible: true };
}

/** Does the play that landed on this position win? */
export function isWinningPosition(campaign: CampaignDraw, position: number) {
  return campaign.dropPositions.includes(position);
}

/**
 * What a campaign becomes once a play at `position` has been counted.
 *
 * Returns null while it should stay open. A campaign that has given out all of
 * its tickets is completed; one that has run out of window without doing so
 * has expired, and the remaining tickets are simply not awarded.
 */
export function closureAfterPlay(
  campaign: CampaignDraw,
  position: number,
  ticketsAwarded: number,
): "completed" | "expired" | null {
  if (ticketsAwarded >= campaign.ticketCount) return "completed";
  if (position >= campaign.dropWindow) return "expired";
  return null;
}

/** Cash and site credit land in the wallet; anything physical needs a human. */
export function fulfilmentFor(prizeType: string): "auto_credited" | "awaiting_fulfilment" {
  return prizeType === "cash" || prizeType === "credit" ? "auto_credited" : "awaiting_fulfilment";
}

/**
 * Campaigns are consulted in a fixed order — oldest activation first — and a
 * play can win at most one ticket. Without a stable order, two campaigns
 * racing over the same play would make the draw depend on row ordering.
 */
export function drawOrder<T extends { activatedAt?: Date | string | null; id: string }>(
  campaigns: T[],
): T[] {
  return [...campaigns].sort((a, b) => {
    const at = toTime(a.activatedAt) ?? 0;
    const bt = toTime(b.activatedAt) ?? 0;
    return at === bt ? a.id.localeCompare(b.id) : at - bt;
  });
}

/**
 * What one play of an order cost, in pounds.
 *
 * Orders are bought in bulk — ten spins for £9.90 — so eligibility has to be
 * judged per play rather than per order. A malformed or free order gives 0,
 * which reads as a free play.
 */
export function spendPerPlay(
  order?: { totalAmount?: string | number | null; quantity?: number | null } | null,
): number {
  const total = Number(order?.totalAmount ?? 0);
  const quantity = Number(order?.quantity ?? 0);
  if (!Number.isFinite(total) || !Number.isFinite(quantity) || quantity <= 0) return 0;
  if (total <= 0) return 0;
  return total / quantity;
}
