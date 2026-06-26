// server/services/prize-sync.ts

import { db } from "../db";
import { competitionPrizes } from "../db/schema";
import { eq, and } from "drizzle-orm";

interface PrizeSyncParams {
  competitionId: string;
  gameType: 'pop' | 'voltz' | 'plinko' | 'scratch' | 'spin' | 'wheel';
  gamePrizeId: string;
  prizeName: string;
  prizeValue: number | string;
  quantity?: number;
}

export async function syncPrizeWin(params: PrizeSyncParams) {
  try {
    const { 
      competitionId, 
      gameType, 
      gamePrizeId, 
      prizeName, 
      prizeValue,
      quantity = 1 
    } = params;

    const prizeValueNum = typeof prizeValue === 'string' ? parseFloat(prizeValue) : prizeValue;

    // 1. Try to find existing prize by gamePrizeId and gameType
    let [existingPrize] = await db.select()
      .from(competitionPrizes)
      .where(
        and(
          eq(competitionPrizes.competitionId, competitionId),
          eq(competitionPrizes.gameType, gameType),
          eq(competitionPrizes.gamePrizeId, gamePrizeId)
        )
      );

    // 2. If not found, try by prize name (fallback)
    if (!existingPrize && prizeName) {
      [existingPrize] = await db.select()
        .from(competitionPrizes)
        .where(
          and(
            eq(competitionPrizes.competitionId, competitionId),
            eq(competitionPrizes.prizeName, prizeName)
          )
        );
    }

    if (existingPrize) {
      // --- UPDATE EXISTING PRIZE ---
      const newRemaining = Math.max(0, existingPrize.remainingQuantity - quantity);
      
      const [updatedPrize] = await db.update(competitionPrizes)
        .set({
          remainingQuantity: newRemaining,
          updatedAt: new Date(),
        })
        .where(eq(competitionPrizes.id, existingPrize.id))
        .returning();

      return {
        success: true,
        action: 'updated',
        prize: updatedPrize,
        remaining: newRemaining,
        message: `Prize "${prizeName}" updated: ${newRemaining} remaining`
      };
    } else {
      // --- CREATE NEW PRIZE AUTOMATICALLY ---
      // Only create if we have a name and value
      if (!prizeName || prizeValue === undefined || prizeValue === null || prizeValue === "") {
        return {
          success: false,
          action: 'skipped',
          message: 'Prize name and value required for auto-creation'
        };
      }

      const [newPrize] = await db.insert(competitionPrizes).values({
        id: crypto.randomUUID(),
        competitionId,
        prizeName: prizeName,
        prizeValue: prizeValueNum || 0,
        totalQuantity: 100, // Default total quantity
        remainingQuantity: 99, // One was just won
        gameType: gameType,
        gamePrizeId: gamePrizeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return {
        success: true,
        action: 'created',
        prize: newPrize,
        remaining: 99,
        message: `New prize "${prizeName}" auto-created with 99 remaining`
      };
    }
  } catch (error) {
    console.error('Prize sync error:', error);
    return {
      success: false,
      action: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Game-specific sync functions
export async function syncPopPrize(competitionId: string, prizeId: string, prizeName: string, prizeValue: string | number) {
  return syncPrizeWin({
    competitionId,
    gameType: 'pop',
    gamePrizeId: prizeId,
    prizeName,
    prizeValue,
  });
}

export async function syncVoltzPrize(competitionId: string, prizeId: string, prizeName: string, prizeValue: string | number) {
  return syncPrizeWin({
    competitionId,
    gameType: 'voltz',
    gamePrizeId: prizeId,
    prizeName,
    prizeValue,
  });
}

export async function syncPlinkoPrize(competitionId: string, prizeId: string, prizeName: string, prizeValue: string | number) {
  return syncPrizeWin({
    competitionId,
    gameType: 'plinko',
    gamePrizeId: prizeId,
    prizeName,
    prizeValue,
  });
}

export async function syncScratchPrize(competitionId: string, prizeId: string, prizeName: string, prizeValue: string | number) {
  return syncPrizeWin({
    competitionId,
    gameType: 'scratch',
    gamePrizeId: prizeId,
    prizeName,
    prizeValue,
  });
}

export async function syncSpinPrize(competitionId: string, prizeId: string, prizeName: string, prizeValue: string | number) {
  return syncPrizeWin({
    competitionId,
    gameType: 'spin',
    gamePrizeId: prizeId,
    prizeName,
    prizeValue,
  });
}

export async function syncWheelPrize(competitionId: string, prizeId: string, prizeName: string, prizeValue: string | number) {
  return syncPrizeWin({
    competitionId,
    gameType: 'wheel',
    gamePrizeId: prizeId,
    prizeName,
    prizeValue,
  });
}