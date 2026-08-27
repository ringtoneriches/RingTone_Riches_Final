import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { storage } from "../storage";
import {
  competitions,
  gameSlotConfig,
  slotPrizeWins,
  slotUsage,
  users,
  winners,
} from "@shared/schema";
import { syncSlotPrize } from "./prize-sync";

type OrderLike = {
  id: string;
  quantity: number;
  competitionId: string;
};

export type SlotSpinResponse = {
  success: true;
  isWin: boolean;
  coinsWon: number;
  prizeId: string | null;
  prizeName: string | null;
  prizeType: string | null;
  prizeImage: string | null;
  spinNumber: number;
  spinsUsed: number;
  spinsAllowed: number;
};

type ProcessResult =
  | { ok: true; response: SlotSpinResponse }
  | { ok: false; status: number; body: Record<string, unknown> };

async function resolveCompetition(order: OrderLike) {
  let competitionId = order.competitionId || "slot-default";
  let competitionTitle = "Slot Machine";

  try {
    if (order.competitionId) {
      const [competition] = await db
        .select({
          id: competitions.id,
          title: competitions.title,
          imageUrl: competitions.imageUrl,
        })
        .from(competitions)
        .where(eq(competitions.id, order.competitionId))
        .limit(1);

      if (competition) {
        competitionTitle = competition.title || "Slot Machine";
      }
    } else {
      const [slotComp] = await db
        .select({
          id: competitions.id,
          title: competitions.title,
          imageUrl: competitions.imageUrl,
        })
        .from(competitions)
        .where(and(eq(competitions.isActive, true), eq(competitions.type, "slot")))
        .limit(1);

      if (slotComp) {
        competitionId = slotComp.id;
        competitionTitle = slotComp.title || "Slot Machine";
      }
    }
  } catch (compError) {
    console.log("[API] ⚠️ Could not get competition, using default:", compError);
  }

  return { competitionId, competitionTitle };
}

/**
 * One uncontrolled (probability) slot spin — same prize, credit, and usage
 * rules as /api/play-slot. Used by single spin and reveal-all.
 */
export async function processUncontrolledSlotSpin(opts: {
  userId: string;
  order: OrderLike;
  coinsSpent: number;
}): Promise<ProcessResult> {
  const { userId, order, coinsSpent } = opts;
  const orderId = order.id;

  const existingSpins = await db
    .select({ id: slotUsage.id })
    .from(slotUsage)
    .where(eq(slotUsage.orderId, orderId));

  if (existingSpins.length >= order.quantity) {
    return {
      ok: false,
      status: 403,
      body: {
        message: "All spins used",
        spinsUsed: existingSpins.length,
        spinsAllowed: order.quantity,
      },
    };
  }
  const spinNumber = existingSpins.length + 1;

  const { competitionId, competitionTitle } = await resolveCompetition(order);

  let selectedPrize: any = null;
  let config;

  try {
    const configs = await db.select().from(gameSlotConfig);
    config = configs.length > 0 ? configs[0] : null;

    if (!config) {
      selectedPrize = { id: "default", symbol: "Win", isEuro: true, pay: 1 };
    } else {
      let allPrizes: any[] = [];
      try {
        allPrizes = config?.prizesConfig ? JSON.parse(config.prizesConfig) : [];
      } catch (parseError) {
        console.error("[API] ❌ Failed to parse prizesConfig:", parseError);
        allPrizes = [];
      }

      let winsMap: Record<string, number> = {};
      try {
        const prizeWins = await db.select().from(slotPrizeWins);
        for (const row of prizeWins) {
          if (row.prizeId) winsMap[row.prizeId] = Number(row.winCount);
        }
      } catch (winsError) {
        console.error("[API] ❌ Failed to get wins map:", winsError);
        winsMap = {};
      }

      const eligible = allPrizes.filter((p: any) => {
        if (p.enabled === false) return false;
        const prob = Number(p.probability || 0);
        if (prob <= 0) return false;
        const payAmount = Number(p.pay || 0);
        if (payAmount <= 0) return false;
        if (p.maxWins !== null && p.maxWins !== undefined) {
          const maxWinsValue = Number(p.maxWins);
          if (maxWinsValue <= 0) return false;
          const currentWins = winsMap[p.id] || 0;
          if (currentWins >= maxWinsValue) return false;
        }
        return true;
      });

      if (eligible.length === 0) {
        selectedPrize = null;
      } else {
        const totalProbability = eligible.reduce((sum, p) => sum + Number(p.probability), 0);
        const rand = Math.random() * totalProbability;
        let cumulative = 0;

        for (const prize of eligible) {
          cumulative += Number(prize.probability);
          if (rand <= cumulative) {
            selectedPrize = prize;
            break;
          }
        }

        if (!selectedPrize && eligible.length > 0) {
          selectedPrize = eligible[eligible.length - 1];
        }
      }
    }

    if (!selectedPrize && config) {
      selectedPrize = null;
    }
  } catch (configError) {
    console.error("[API] ❌ Error processing config:", configError);
    selectedPrize = null;
  }

  const isWin = selectedPrize !== null && Number(selectedPrize.pay || 0) > 0;
  let coinsWon = 0;
  let prizeId: string | null = null;
  let prizeName: string | null = null;
  let prizeType: string | null = null;
  let prizeImage: string | null = null;

  if (isWin && selectedPrize) {
    prizeId = selectedPrize.id;
    prizeName = selectedPrize.symbol;
    prizeType = selectedPrize.isEuro ? "cash" : "points";
    prizeImage = selectedPrize.image || null;
    coinsWon = Number(selectedPrize.pay || 0);

    try {
      const user = await storage.getUser(userId);
      if (selectedPrize.isEuro && coinsWon > 0) {
        const newBalance = parseFloat(user?.balance || "0") + coinsWon;
        await db.update(users).set({ balance: newBalance.toFixed(2) }).where(eq(users.id, userId));
        await storage.createTransaction({
          userId,
          type: "prize",
          amount: coinsWon.toFixed(2),
          description: `Slot Machine Win - £${coinsWon.toFixed(2)}`,
        });
      } else if (!selectedPrize.isEuro && coinsWon > 0) {
        const newPoints = (user?.ringtonePoints || 0) + coinsWon;
        await db.update(users).set({ ringtonePoints: newPoints }).where(eq(users.id, userId));
        await storage.createTransaction({
          userId,
          type: "prize",
          amount: coinsWon.toString(),
          description: `Slot Machine Win - ${coinsWon} Ringtone Points`,
        });
      }

      try {
        if (prizeId) {
          const existingWin = await db
            .select()
            .from(slotPrizeWins)
            .where(eq(slotPrizeWins.prizeId, prizeId))
            .limit(1);

          if (existingWin.length > 0) {
            await db
              .update(slotPrizeWins)
              .set({
                winCount: Number(existingWin[0].winCount) + 1,
                updatedAt: new Date(),
              })
              .where(eq(slotPrizeWins.prizeId, prizeId));
          } else {
            await db.insert(slotPrizeWins).values({
              prizeId,
              winCount: 1,
              updatedAt: new Date(),
            });
          }
        }
      } catch (winCountError) {
        console.error("[API] ❌ Error updating win count:", winCountError);
      }

      const syncResult = await syncSlotPrize(
        competitionId,
        prizeId || "unknown",
        prizeName || "Prize",
        coinsWon,
        selectedPrize.isEuro ? "cash" : "points",
        selectedPrize.maxWins || null
      );
      console.log("[API] Slot prize sync result:", syncResult);

      const prizeDescriptionText = `Slot Machine Win - ${competitionTitle}`;
      const prizeValueText = selectedPrize.isEuro ? `£${coinsWon} Cash` : `${coinsWon} Points`;

      await db.insert(winners).values({
        userId,
        competitionId: competitionId,
        prizeDescription: prizeDescriptionText,
        prizeValue: prizeValueText,
        imageUrl: selectedPrize.image || null,
        isShowcase: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (prizeError) {
      console.error("[API] ❌ Error processing prize:", prizeError);
    }
  }

  try {
    await db.insert(slotUsage).values({
      orderId,
      userId,
      isWin,
      coinsWon,
      coinsSpent: coinsSpent || 0,
      spinNumber,
      prizeId: prizeId || null,
      prizeName: prizeName || null,
    } as any);
  } catch (dbError) {
    console.error("[API] ❌ Error recording spin:", dbError);
  }

  return {
    ok: true,
    response: {
      success: true,
      isWin,
      coinsWon,
      prizeId,
      prizeName,
      prizeType,
      prizeImage,
      spinNumber,
      spinsUsed: spinNumber,
      spinsAllowed: order.quantity,
    },
  };
}

export async function revealAllUncontrolledSlot(opts: {
  userId: string;
  order: OrderLike;
  coinsSpent: number;
  count: number;
}) {
  const existingSpins = await db
    .select({ id: slotUsage.id })
    .from(slotUsage)
    .where(eq(slotUsage.orderId, opts.order.id));
  const remaining = opts.order.quantity - existingSpins.length;
  if (remaining <= 0) {
    return { ok: false as const, status: 400, body: { message: "No spins remaining" } };
  }

  const playsToProcess = Math.min(opts.count, remaining);
  const results: SlotSpinResponse[] = [];

  for (let i = 0; i < playsToProcess; i++) {
    const result = await processUncontrolledSlotSpin({
      userId: opts.userId,
      order: opts.order,
      coinsSpent: opts.coinsSpent,
    });
    if (!result.ok) {
      if (result.status === 403) break;
      return result;
    }
    results.push(result.response);
  }

  return { ok: true as const, results };
}
