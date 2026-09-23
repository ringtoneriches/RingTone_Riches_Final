/**
 * Golden Tickets — campaign management and the award that happens on a play.
 *
 * The draw itself lives in ./golden-ticket-draw, which has no database imports
 * so it can be unit tested. This file is the part that talks to Postgres.
 *
 * Two rules hold the feature together:
 *
 *   1. A live campaign cannot be edited, only cancelled. The winning positions
 *      are sealed at activation, so there is nothing left for anyone to decide.
 *   2. The award happens inside the same transaction as the play that won it,
 *      and a unique index on (campaign_id, drop_position) means a position can
 *      only ever pay out once, whatever happens concurrently.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import {
  goldenTicketCampaigns,
  goldenTicketWins,
  transactions,
  users,
} from "@shared/schema";
import {
  GoldenTicketError,
  type CampaignDraw,
  closureAfterPlay,
  drawOrder,
  fulfilmentFor,
  isPlayEligible,
  isWinningPosition,
  pickDropPositions,
} from "./golden-ticket-draw";

export { GoldenTicketError } from "./golden-ticket-draw";

type DbTx = typeof db | any;

const EDITABLE_STATUSES = ["draft", "scheduled"] as const;
const CANCELLABLE_STATUSES = ["draft", "scheduled", "active"] as const;

export type CreateCampaignInput = {
  name: string;
  prizeType: "cash" | "credit" | "physical";
  prizeValue?: string | number | null;
  prizeDescription?: string | null;
  prizeImageUrl?: string | null;
  eligibleGameTypes?: string[];
  eligibleCompetitionIds?: string[];
  minSpend?: string | number | null;
  includeFreePlays?: boolean;
  ticketCount: number;
  dropWindow: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

function money(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new GoldenTicketError("That prize value is not a valid amount.");
  }
  return n.toFixed(2);
}

function validate(input: CreateCampaignInput) {
  if (!input.name?.trim()) throw new GoldenTicketError("Give the campaign a name.");
  if (!["cash", "credit", "physical"].includes(input.prizeType)) {
    throw new GoldenTicketError("Choose a prize type.");
  }
  // A cash or credit prize is paid automatically, so it must have an amount.
  if (input.prizeType !== "physical" && money(input.prizeValue) === null) {
    throw new GoldenTicketError("A cash or site credit prize needs an amount.");
  }
  // pickDropPositions enforces the ticket/window relationship; call it here so
  // the error surfaces at creation rather than at activation.
  pickDropPositions(Number(input.ticketCount), Number(input.dropWindow), () => 0.5);
  if (input.startsAt && input.endsAt && input.startsAt >= input.endsAt) {
    throw new GoldenTicketError("The end date has to be after the start date.");
  }
}

export async function createCampaign(input: CreateCampaignInput, adminId: string) {
  validate(input);
  const [created] = await db
    .insert(goldenTicketCampaigns)
    .values({
      name: input.name.trim(),
      prizeType: input.prizeType,
      prizeValue: money(input.prizeValue),
      prizeDescription: input.prizeDescription ?? null,
      prizeImageUrl: input.prizeImageUrl ?? null,
      eligibleGameTypes: input.eligibleGameTypes ?? [],
      eligibleCompetitionIds: input.eligibleCompetitionIds ?? [],
      minSpend: money(input.minSpend),
      includeFreePlays: Boolean(input.includeFreePlays),
      ticketCount: Number(input.ticketCount),
      dropWindow: Number(input.dropWindow),
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      status: input.startsAt && input.startsAt > new Date() ? "scheduled" : "draft",
      createdBy: adminId,
    })
    .returning();
  return created;
}

export async function updateCampaign(
  campaignId: string,
  input: Partial<CreateCampaignInput>,
  _adminId: string,
) {
  const existing = await getCampaign(campaignId);
  if (!existing) throw new GoldenTicketError("Campaign not found.", 404, "not_found");
  // This is the rule that makes the draw trustworthy: once it is live, the
  // terms are fixed. Cancelling is the only way out.
  if (!(EDITABLE_STATUSES as readonly string[]).includes(existing.status)) {
    throw new GoldenTicketError(
      `A ${existing.status} campaign cannot be edited. Cancel it and create a new one.`,
      409,
      "campaign_locked",
    );
  }
  const merged = { ...existing, ...input } as unknown as CreateCampaignInput;
  validate(merged);

  const [updated] = await db
    .update(goldenTicketCampaigns)
    .set({
      name: merged.name.trim(),
      prizeType: merged.prizeType,
      prizeValue: money(merged.prizeValue),
      prizeDescription: merged.prizeDescription ?? null,
      prizeImageUrl: merged.prizeImageUrl ?? null,
      eligibleGameTypes: merged.eligibleGameTypes ?? [],
      eligibleCompetitionIds: merged.eligibleCompetitionIds ?? [],
      minSpend: money(merged.minSpend),
      includeFreePlays: Boolean(merged.includeFreePlays),
      ticketCount: Number(merged.ticketCount),
      dropWindow: Number(merged.dropWindow),
      startsAt: merged.startsAt ?? null,
      endsAt: merged.endsAt ?? null,
      updatedAt: new Date(),
    })
    .where(eq(goldenTicketCampaigns.id, campaignId))
    .returning();
  return updated;
}

/**
 * Seal the draw and go live.
 *
 * This is the only moment the winning positions are chosen. After it returns,
 * the campaign is immutable for everyone, including admins.
 */
export async function activateCampaign(campaignId: string, adminId: string) {
  const existing = await getCampaign(campaignId);
  if (!existing) throw new GoldenTicketError("Campaign not found.", 404, "not_found");
  if (!(EDITABLE_STATUSES as readonly string[]).includes(existing.status)) {
    throw new GoldenTicketError(
      `This campaign is already ${existing.status}.`,
      409,
      "already_activated",
    );
  }

  const positions = pickDropPositions(existing.ticketCount, existing.dropWindow);

  // The status guard in the WHERE clause is what makes a double activation
  // impossible: the second one updates no rows rather than resealing the draw.
  const [activated] = await db
    .update(goldenTicketCampaigns)
    .set({
      dropPositions: positions,
      status: "active",
      activatedBy: adminId,
      activatedAt: new Date(),
      playsSeen: 0,
      ticketsAwarded: 0,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(goldenTicketCampaigns.id, campaignId),
        inArray(goldenTicketCampaigns.status, [...EDITABLE_STATUSES]),
      ),
    )
    .returning();

  if (!activated) {
    throw new GoldenTicketError("That campaign was already activated.", 409, "already_activated");
  }
  return activated;
}

export async function cancelCampaign(campaignId: string, _adminId: string) {
  const [cancelled] = await db
    .update(goldenTicketCampaigns)
    .set({ status: "cancelled", closedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(goldenTicketCampaigns.id, campaignId),
        inArray(goldenTicketCampaigns.status, [...CANCELLABLE_STATUSES]),
      ),
    )
    .returning();
  if (!cancelled) {
    throw new GoldenTicketError("That campaign is already closed.", 409, "already_closed");
  }
  return cancelled;
}

export async function getCampaign(campaignId: string) {
  const [row] = await db
    .select()
    .from(goldenTicketCampaigns)
    .where(eq(goldenTicketCampaigns.id, campaignId))
    .limit(1);
  return row;
}

export async function listCampaigns() {
  return db.select().from(goldenTicketCampaigns).orderBy(desc(goldenTicketCampaigns.createdAt));
}

/** The admin audit trail: every drop, with who won it and what happened next. */
export async function listWins(campaignId?: string) {
  const rows = await db
    .select({
      win: goldenTicketWins,
      campaign: { id: goldenTicketCampaigns.id, name: goldenTicketCampaigns.name },
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      },
    })
    .from(goldenTicketWins)
    .leftJoin(goldenTicketCampaigns, eq(goldenTicketCampaigns.id, goldenTicketWins.campaignId))
    .leftJoin(users, eq(users.id, goldenTicketWins.userId))
    .where(campaignId ? eq(goldenTicketWins.campaignId, campaignId) : sql`true`)
    .orderBy(desc(goldenTicketWins.awardedAt));

  return rows.map((r) => ({ ...r.win, campaign: r.campaign, user: r.user }));
}

export async function setFulfilmentStatus(
  winId: string,
  status: "awaiting_fulfilment" | "fulfilled" | "cancelled",
  note?: string,
) {
  const [updated] = await db
    .update(goldenTicketWins)
    .set({ fulfilmentStatus: status, fulfilmentNote: note ?? null, updatedAt: new Date() })
    .where(eq(goldenTicketWins.id, winId))
    .returning();
  if (!updated) throw new GoldenTicketError("Win not found.", 404, "not_found");
  return updated;
}

/** Close campaigns whose end date has passed without their window filling. */
export async function expireLapsedCampaigns() {
  const result = await db.execute(sql`
    UPDATE golden_ticket_campaigns
       SET status = 'expired', closed_at = now(), updated_at = now()
     WHERE status = 'active'
       AND ends_at IS NOT NULL
       AND ends_at < now()
    RETURNING id`);
  return result.rows?.length ?? 0;
}

export type AwardContext = {
  userId: string | null | undefined;
  gameType: string;
  competitionId?: string | null;
  playId?: string | null;
  orderId?: string | null;
  /** Spend on this play, in pounds. Zero means a free play. */
  spend?: number;
  /** What the game itself returned, recorded so the audit shows both results. */
  originalResult?: string | null;
};

export type GoldenTicketAward = {
  winId: string;
  campaignId: string;
  prizeType: string;
  prizeName: string;
  prizeValue: string | null;
  prizeDescription: string | null;
  prizeImageUrl: string | null;
  fulfilmentStatus: string;
};

/**
 * The play-path hook. Call inside the transaction that records the play.
 *
 * Returns null on the overwhelming majority of plays. When it does return an
 * award, the money has already moved and the audit row already exists, in the
 * same transaction — so a failure later rolls the whole thing back rather than
 * leaving a ticket half-given.
 *
 * A play can win at most one ticket. Campaigns are consulted oldest first, and
 * counters only advance for campaigns the play was actually eligible for, so
 * an ineligible game can never consume a ticket position.
 */
export async function maybeAwardGoldenTicket(
  tx: DbTx,
  play: AwardContext,
): Promise<GoldenTicketAward | null> {
  if (!play.userId) return null; // Guests are excluded.

  try {
    const live = await tx
      .select()
      .from(goldenTicketCampaigns)
      .where(eq(goldenTicketCampaigns.status, "active"));
    if (!live.length) return null;

    for (const campaign of drawOrder<any>(live)) {
      const draw = campaign as unknown as CampaignDraw;
      if (!isPlayEligible(draw, { ...play, userId: play.userId }).eligible) continue;

      // Atomic: one statement claims this play's position and locks the row,
      // so two simultaneous plays cannot be handed the same position.
      const bumped = await tx.execute(sql`
        UPDATE golden_ticket_campaigns
           SET plays_seen = plays_seen + 1, updated_at = now()
         WHERE id = ${campaign.id} AND status = 'active'
        RETURNING plays_seen`);
      const position = Number(bumped.rows?.[0]?.plays_seen ?? 0);
      if (!position) continue; // Closed underneath us.

      const won = isWinningPosition(draw, position);
      if (!won) {
        await closeIfFinished(tx, campaign.id, draw, position, campaign.ticketsAwarded);
        continue;
      }

      const award = await grantTicket(tx, campaign, play, position);
      if (award) return award;
    }
    return null;
  } catch (error) {
    // A Golden Ticket must never cost someone the game result they paid for.
    // If anything here goes wrong, the play still stands and we get a log.
    console.error("[golden-ticket] award check failed:", error);
    return null;
  }
}

async function closeIfFinished(
  tx: DbTx,
  campaignId: string,
  draw: CampaignDraw,
  position: number,
  ticketsAwarded: number,
) {
  const closure = closureAfterPlay(draw, position, ticketsAwarded);
  if (!closure) return;
  await tx
    .update(goldenTicketCampaigns)
    .set({ status: closure, closedAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(goldenTicketCampaigns.id, campaignId), eq(goldenTicketCampaigns.status, "active")),
    );
}

async function grantTicket(
  tx: DbTx,
  campaign: any,
  play: AwardContext,
  position: number,
): Promise<GoldenTicketAward | null> {
  const fulfilment = fulfilmentFor(campaign.prizeType);
  const amount = campaign.prizeValue == null ? null : Number(campaign.prizeValue);

  let transactionId: string | null = null;

  if (fulfilment === "auto_credited" && amount && amount > 0) {
    const [user] = await tx
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, play.userId as string))
      .limit(1);
    const newBalance = (Number(user?.balance ?? 0) + amount).toFixed(2);

    await tx
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, play.userId as string));

    const [txRow] = await tx
      .insert(transactions)
      .values({
        userId: play.userId as string,
        type: "prize",
        amount: amount.toFixed(2),
        description: `Golden Ticket — ${campaign.name}`,
      })
      .returning();
    transactionId = txRow?.id ?? null;
  }

  // The unique index on (campaign_id, drop_position) is the real guarantee
  // here: if two plays somehow reach the same position, the second insert
  // fails rather than paying twice.
  const [win] = await tx
    .insert(goldenTicketWins)
    .values({
      campaignId: campaign.id,
      userId: play.userId as string,
      competitionId: play.competitionId ?? null,
      gameType: play.gameType,
      playId: play.playId ?? null,
      orderId: play.orderId ?? null,
      originalResult: play.originalResult ?? null,
      dropPosition: position,
      prizeType: campaign.prizeType,
      prizeName: campaign.name,
      prizeValue: amount == null ? null : amount.toFixed(2),
      transactionId,
      fulfilmentStatus: fulfilment,
    })
    .returning();

  const awarded = Number(campaign.ticketsAwarded ?? 0) + 1;
  const closure = closureAfterPlay(campaign as unknown as CampaignDraw, position, awarded);

  await tx
    .update(goldenTicketCampaigns)
    .set({
      ticketsAwarded: awarded,
      status: closure ?? "active",
      closedAt: closure ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(goldenTicketCampaigns.id, campaign.id));

  return {
    winId: win.id,
    campaignId: campaign.id,
    prizeType: campaign.prizeType,
    prizeName: campaign.name,
    prizeValue: win.prizeValue ?? null,
    prizeDescription: campaign.prizeDescription ?? null,
    prizeImageUrl: campaign.prizeImageUrl ?? null,
    fulfilmentStatus: fulfilment,
  };
}
