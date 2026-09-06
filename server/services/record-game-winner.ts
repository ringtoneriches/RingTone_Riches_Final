import { winners } from "@shared/schema";
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
