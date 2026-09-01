import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import { tickets } from "@shared/schema";

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
    .orderBy(asc(tickets.ticketSeq), asc(tickets.createdAt));
}

export function attachTicketNumbersNewestFirst<T extends object>(
  historyNewestFirst: T[],
  orderTickets: TicketRow[],
) {
  const oldest = [...historyNewestFirst].reverse();
  const labeled = oldest.map((row, index) => ({
    ...row,
    ticketNumber: playTicketLabel(orderTickets[index]),
  }));
  return labeled.reverse();
}

export async function claimNextPlayTicket(tx: any, orderId: string) {
  const rows = await tx
    .select()
    .from(tickets)
    .where(eq(tickets.orderId, orderId))
    .orderBy(asc(tickets.ticketSeq), asc(tickets.createdAt));

  const next = rows.find((row: any) => row.resultStatus !== "revealed");
  if (!next) return null;

  await tx
    .update(tickets)
    .set({ resultStatus: "revealed" })
    .where(eq(tickets.id, next.id));

  return playTicketLabel(next);
}
