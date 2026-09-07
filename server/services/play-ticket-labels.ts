import { asc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { scratchCardUsage, spinUsage, tickets } from "@shared/schema";

type TicketRow = {
  ticketNumber?: string | null;
  ticketSeq?: number | null;
  resultStatus?: string | null;
  createdAt?: Date | string | null;
};

export function playTicketLabel(ticket?: TicketRow | null) {
  if (!ticket) return null;
  const seq = Number(ticket.ticketSeq);
  if (Number.isFinite(seq) && seq > 0) return String(Math.trunc(seq));
  const raw = String(ticket.ticketNumber || "").trim().replace(/^#/, "");
  return raw || null;
}

export async function getOrderPlayTickets(orderId: string) {
  return db
    .select({
      ticketNumber: tickets.ticketNumber,
      ticketSeq: tickets.ticketSeq,
      resultStatus: tickets.resultStatus,
      createdAt: tickets.createdAt,
    })
    .from(tickets)
    .where(eq(tickets.orderId, orderId))
    .orderBy(asc(tickets.createdAt), asc(tickets.ticketSeq));
}

function sortTicketsForReveal<T extends { createdAt?: Date | string | null; ticketSeq?: number | null }>(
  rows: T[],
) {
  return rows.slice().sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return Number(a.ticketSeq || 0) - Number(b.ticketSeq || 0);
  });
}

function historyChronological<T extends { spinNumber?: number | null; usedAt?: Date | string | null; wonAt?: Date | string | null }>(
  historyNewestFirst: T[],
) {
  return [...historyNewestFirst].sort((a, b) => {
    const snA = Number(a.spinNumber);
    const snB = Number(b.spinNumber);
    if (Number.isFinite(snA) && Number.isFinite(snB) && snA !== snB) return snA - snB;

    const ta = a.usedAt || a.wonAt;
    const tb = b.usedAt || b.wonAt;
    const timeA = ta ? new Date(ta).getTime() : 0;
    const timeB = tb ? new Date(tb).getTime() : 0;
    if (timeA !== timeB) return timeA - timeB;
    return 0;
  });
}

function sortHistoryNewestFirst<T extends { spinNumber?: number | null; usedAt?: Date | string | null; wonAt?: Date | string | null }>(
  rows: T[],
) {
  return [...rows].sort((a, b) => {
    const snA = Number(a.spinNumber);
    const snB = Number(b.spinNumber);
    if (Number.isFinite(snA) && Number.isFinite(snB) && snA !== snB) return snB - snA;

    const ta = a.usedAt || a.wonAt;
    const tb = b.usedAt || b.wonAt;
    const timeA = ta ? new Date(ta).getTime() : 0;
    const timeB = tb ? new Date(tb).getTime() : 0;
    return timeB - timeA;
  });
}

function normalizeStoredTicket(value: unknown) {
  if (value == null) return null;
  const raw = String(value).trim().replace(/^#/, "");
  return raw || null;
}

function revealLabelForPlay(
  row: { spinNumber?: number | null },
  index: number,
  revealedInOrder: TicketRow[],
) {
  const spinIdx = Number(row.spinNumber);
  if (Number.isFinite(spinIdx) && spinIdx > 0) {
    return playTicketLabel(revealedInOrder[spinIdx - 1]);
  }
  return playTicketLabel(revealedInOrder[index]);
}

export function attachTicketNumbersNewestFirst<
  T extends {
    spinNumber?: number | null;
    usedAt?: Date | string | null;
    wonAt?: Date | string | null;
    ticketNumber?: string | null;
  },
>(rowsNewestFirst: T[], orderTickets: TicketRow[]) {
  const revealedInOrder = sortTicketsForReveal(
    orderTickets.filter((t) => t.resultStatus === "revealed"),
  );

  const chronological = historyChronological(rowsNewestFirst);
  const labeled = chronological.map((row, index) => {
    const stored = normalizeStoredTicket(row.ticketNumber);
    const fromReveal = revealLabelForPlay(row, index, revealedInOrder);

    // Reveal order matches play order; prefer it over stale/wrong persisted labels.
    if (fromReveal) {
      if (stored && stored !== fromReveal) {
        return { ...row, ticketNumber: fromReveal };
      }
      return { ...row, ticketNumber: stored ?? fromReveal };
    }

    if (stored) return { ...row, ticketNumber: stored };
    return row;
  });

  return sortHistoryNewestFirst(labeled);
}

export async function claimNextPlayTicket(tx: any, orderId: string) {
  const rows = await tx
    .select()
    .from(tickets)
    .where(eq(tickets.orderId, orderId));

  const next = sortTicketsForReveal(rows).find(
    (row: any) => row.resultStatus !== "revealed",
  );
  if (!next) return null;

  await tx
    .update(tickets)
    .set({ resultStatus: "revealed" })
    .where(eq(tickets.id, next.id));

  return playTicketLabel(next);
}

/** Attach play ticket numbers to reveal-all batch rows (legacy probability mode). */
export async function labelRevealAllResultTickets(orderId: string, results: any[]) {
  if (!results.length) return results;
  try {
    await db.transaction(async (tx) => {
      for (const row of results) {
        if (normalizeStoredTicket(row.ticketNumber)) continue;
        const ticketNumber = await claimNextPlayTicket(tx, orderId);
        if (ticketNumber) row.ticketNumber = ticketNumber;
      }
    });
  } catch (err) {
    console.error("Failed to label reveal-all tickets:", err);
  }
  return results;
}

export async function listOrderPlayTicketLabels(orderId: string) {
  return (await getOrderPlayTickets(orderId))
    .map((ticket) => playTicketLabel(ticket))
    .filter((n): n is string => Boolean(n));
}

export type SpinPlayRecord = {
  orderId: string;
  userId: string;
  ticketNumber?: string | null;
  isWin?: boolean;
  segmentId?: string | null;
  prizeLabel?: string | null;
  rewardType?: string | null;
  rewardValue?: string | null;
};

export async function insertSpinPlayRecord(
  tx: any,
  opts: SpinPlayRecord,
): Promise<number> {
  const [countRow] = await tx
    .select({ count: sql<number>`count(*)` })
    .from(spinUsage)
    .where(eq(spinUsage.orderId, opts.orderId));
  const spinNumber = Number(countRow?.count || 0) + 1;
  await tx.insert(spinUsage).values({
    orderId: opts.orderId,
    userId: opts.userId,
    spinNumber,
    ticketNumber: opts.ticketNumber ?? null,
    isWin: Boolean(opts.isWin),
    segmentId: opts.segmentId ?? null,
    prizeLabel: opts.prizeLabel ?? null,
    rewardType: opts.rewardType ?? null,
    rewardValue: opts.rewardValue ?? null,
  });
  return spinNumber;
}

export type ScratchPlayRecord = {
  orderId: string;
  userId: string;
  ticketNumber?: string | null;
  isWin?: boolean;
  prizeId?: string | null;
  prizeLabel?: string | null;
  rewardType?: string | null;
  rewardValue?: string | null;
};

export async function insertScratchPlayRecord(
  tx: any,
  opts: ScratchPlayRecord,
): Promise<number> {
  const [countRow] = await tx
    .select({ count: sql<number>`count(*)` })
    .from(scratchCardUsage)
    .where(eq(scratchCardUsage.orderId, opts.orderId));
  const cardNumber = Number(countRow?.count || 0) + 1;
  await tx.insert(scratchCardUsage).values({
    orderId: opts.orderId,
    userId: opts.userId,
    cardNumber,
    ticketNumber: opts.ticketNumber ?? null,
    isWin: Boolean(opts.isWin),
    prizeId: opts.prizeId ?? null,
    prizeLabel: opts.prizeLabel ?? null,
    rewardType: opts.rewardType ?? null,
    rewardValue: opts.rewardValue ?? null,
  });
  return cardNumber;
}
