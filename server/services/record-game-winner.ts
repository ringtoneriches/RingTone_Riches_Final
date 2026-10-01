import { winners } from "@shared/schema";
import { inArray } from "drizzle-orm";
import { wsManager } from "../websocket";

export type GameWinnerInput = {
  userId: string;
  competitionId?: string | null;
  prizeDescription: string;
  prizeValue: string;
  imageUrl?: string | null;
  createdAt?: Date;
  id?: string;
};

type DbWriter = {
  insert: (table: typeof winners) => {
    values: (values: Record<string, unknown>) => Promise<unknown>;
  };
};

export function notifyPublicWinnerUpdate(competitionId?: string | null) {
  try {
    wsManager.broadcast({
      type: "winner_drawn",
      competitionId: competitionId || "game",
    });
  } catch {
    // Non-blocking: winner is saved even if websocket is unavailable.
  }
}

export async function recordGameWinner(
  dbWriter: DbWriter,
  input: GameWinnerInput,
): Promise<void> {
  const now = input.createdAt ?? new Date();
  await dbWriter.insert(winners).values({
    ...(input.id ? { id: input.id } : {}),
    userId: input.userId,
    competitionId: input.competitionId ?? null,
    prizeDescription: input.prizeDescription,
    prizeValue: input.prizeValue,
    imageUrl: input.imageUrl ?? null,
    isShowcase: true,
    createdAt: now,
    updatedAt: now,
  });

  notifyPublicWinnerUpdate(input.competitionId);
}

/**
 * Puts the winning ticket number on winner rows after the fact.
 *
 * Most games write the winner row before they claim the play's ticket, and the
 * two happen in different transactions. Reordering those routes to claim first
 * would mean moving payment and play bookkeeping around for the sake of a
 * label, so the winner is stamped once the ticket is known instead.
 *
 * Deliberately forgiving: a winner row with no ticket is the normal state for
 * everything recorded before this existed, and the card simply leaves the line
 * out. A failure here must never lose someone their prize, so it is logged and
 * swallowed rather than thrown.
 */
export async function stampWinningTicket(
  dbWriter: { update: Function },
  winnerIds: string[],
  ticketNumber: string | null | undefined,
): Promise<void> {
  if (!ticketNumber || !winnerIds.length) return;
  try {
    await (dbWriter as any)
      .update(winners)
      .set({ winningTicketNumber: ticketNumber })
      .where(inArray(winners.id, winnerIds));
  } catch (error) {
    console.error("Could not stamp winning ticket on winner row:", error);
  }
}
