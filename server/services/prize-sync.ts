// server/services/prize-sync.ts

import { competitionPrizes } from "@shared/schema";
import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";

interface PrizeSyncParams {
  competitionId: string;
  gameType: 'pop' | 'voltz' | 'plinko' | 'scratch' | 'spin' | 'wheel';
  gamePrizeId: string;
  prizeName: string;
  prizeValue: number | string;
  rewardType: string; // 'cash', 'points', 'physical', 'try_again'
  quantity?: number;
  maxWins?: number | null;
}

// ✅ Configuration: Prize types to skip syncing
const SKIP_REWARD_TYPES = ['points', 'try_again']; // Add any types you want to skip

export async function syncPrizeWin(params: PrizeSyncParams) {
  try {
    const { 
      competitionId, 
      gameType, 
      gamePrizeId, 
      prizeName, 
      prizeValue,
      rewardType,
      quantity = 1,
      maxWins = null
    } = params;

    // ✅ SKIP POINTS AND OTHER NON-CASH PRIZES
    if (SKIP_REWARD_TYPES.includes(rewardType)) {
      console.log(`⏭️ Skipping ${rewardType} prize sync: "${prizeName}" (${prizeValue})`);
      return {
        success: true,
        action: 'skipped',
        message: `${rewardType} prizes are not synced to competition prizes table`,
        reason: 'non-cash-reward'
      };
    }

    const prizeValueNum = typeof prizeValue === 'string' ? parseFloat(prizeValue) : prizeValue;

    // Try multiple matching strategies in order:
    let existingPrize = null;

    // STRATEGY 1: Exact match by gamePrizeId
    if (!existingPrize) {
      [existingPrize] = await db.select()
        .from(competitionPrizes)
        .where(
          and(
            eq(competitionPrizes.competitionId, competitionId),
            eq(competitionPrizes.gameType, gameType),
            eq(competitionPrizes.gamePrizeId, gamePrizeId)
          )
        );
    }

    // STRATEGY 2: Match by prize name AND value
    if (!existingPrize && prizeName) {
      [existingPrize] = await db.select()
        .from(competitionPrizes)
        .where(
          and(
            eq(competitionPrizes.competitionId, competitionId),
            eq(competitionPrizes.prizeName, prizeName),
            prizeValueNum > 0 
              ? sql`ABS(${competitionPrizes.prizeValue} - ${prizeValueNum}) < 0.01`
              : eq(competitionPrizes.prizeValue, 0)
          )
        );
    }

    // STRATEGY 3: Match by value only (last resort for cash prizes)
    if (!existingPrize && prizeValueNum > 0 && rewardType !== 'physical') {
      [existingPrize] = await db.select()
        .from(competitionPrizes)
        .where(
          and(
            eq(competitionPrizes.competitionId, competitionId),
            eq(competitionPrizes.gameType, gameType),
            sql`ABS(${competitionPrizes.prizeValue} - ${prizeValueNum}) < 0.01`
          )
        );
    }

    // STRATEGY 4: For physical prizes, match by name containing similar words
    if (!existingPrize && rewardType === 'physical' && prizeName) {
      [existingPrize] = await db.select()
        .from(competitionPrizes)
        .where(
          and(
            eq(competitionPrizes.competitionId, competitionId),
            eq(competitionPrizes.gameType, gameType),
            sql`LOWER(${competitionPrizes.prizeName}) LIKE LOWER(${'%' + prizeName + '%'})`
          )
        );
    }

    if (existingPrize) {
      // --- UPDATE EXISTING PRIZE (DECREMENT REMAINING) ---
      const newRemaining = Math.max(0, existingPrize.remainingQuantity - quantity);
      
      const [updatedPrize] = await db.update(competitionPrizes)
        .set({
          remainingQuantity: newRemaining,
          gamePrizeId: existingPrize.gamePrizeId || gamePrizeId,
          updatedAt: new Date(),
        })
        .where(eq(competitionPrizes.id, existingPrize.id))
        .returning();

      console.log(`✅ Prize "${existingPrize.prizeName}" updated: ${existingPrize.remainingQuantity} → ${newRemaining} remaining`);

      return {
        success: true,
        action: 'updated',
        prize: updatedPrize,
        remaining: newRemaining,
        message: `Prize "${existingPrize.prizeName}" updated: ${newRemaining} remaining`
      };
    } else {
      // --- NO EXISTING PRIZE FOUND - CREATE NEW ONE ---
      
      if (!prizeName || prizeValue === undefined || prizeValue === null) {
        console.warn(`⚠️ Skipping prize creation - missing name/value`);
        return {
          success: false,
          action: 'skipped',
          message: 'Prize name and value required for auto-creation'
        };
      }

      // Use maxWins as totalQuantity, or high number for unlimited
      const totalQuantity = maxWins !== null && maxWins !== undefined 
        ? maxWins 
        : 999999;

      const prizeValueFinal = prizeValueNum || 0;

      const [newPrize] = await db.insert(competitionPrizes).values({
        id: crypto.randomUUID(),
        competitionId,
        prizeName: prizeName,
        prizeValue: prizeValueFinal,
        totalQuantity: totalQuantity,
        remainingQuantity: totalQuantity - quantity,
        gameType: gameType,
        gamePrizeId: gamePrizeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      console.log(`🆕 Prize "${prizeName}" auto-created with ${totalQuantity} total, ${totalQuantity - quantity} remaining`);

      return {
        success: true,
        action: 'created',
        prize: newPrize,
        remaining: totalQuantity - quantity,
        message: `New prize "${prizeName}" auto-created`
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

// Game-specific sync functions remain the same...
export async function syncPopPrize(
  competitionId: string, 
  prizeId: string, 
  prizeName: string, 
  prizeValue: string | number,
  rewardType: string,
  maxWins?: number | null
) {
  return syncPrizeWin({
    competitionId,
    gameType: 'pop',
    gamePrizeId: prizeId,
    prizeName,
    prizeValue,
    rewardType,
    maxWins,
  });
}

export async function syncVoltzPrize(
  competitionId: string, 
  prizeId: string, 
  prizeName: string, 
  prizeValue: string | number,
  rewardType: string,
  maxWins?: number | null
) {
  return syncPrizeWin({
    competitionId,
    gameType: 'voltz',
    gamePrizeId: prizeId,
    prizeName,
    prizeValue,
    rewardType,
    maxWins,
  });
}

export async function syncPlinkoPrize(
  competitionId: string, 
  prizeId: string, 
  prizeName: string, 
  prizeValue: string | number,
  rewardType: string,
  maxWins?: number | null
) {
  return syncPrizeWin({
    competitionId,
    gameType: 'plinko',
    gamePrizeId: prizeId,
    prizeName,
    prizeValue,
    rewardType,
    maxWins,
  });
}

export async function syncScratchPrize(
  competitionId: string, 
  prizeId: string, 
  prizeName: string, 
  prizeValue: string | number,
  rewardType: string,
  maxWins?: number | null
) {
  return syncPrizeWin({
    competitionId,
    gameType: 'scratch',
    gamePrizeId: prizeId,
    prizeName,
    prizeValue,
    rewardType,
    maxWins,
  });
}

export async function syncSpinPrize(
  competitionId: string, 
  prizeId: string, 
  prizeName: string, 
  prizeValue: string | number,
  rewardType: string,
  maxWins?: number | null
) {
  return syncPrizeWin({
    competitionId,
    gameType: 'spin',
    gamePrizeId: prizeId,
    prizeName,
    prizeValue,
    rewardType,
    maxWins,
  });
}

export async function syncWheelPrize(
  competitionId: string, 
  prizeId: string, 
  prizeName: string, 
  prizeValue: string | number,
  rewardType: string,
  maxWins?: number | null
) {
  return syncPrizeWin({
    competitionId,
    gameType: 'wheel',
    gamePrizeId: prizeId,
    prizeName,
    prizeValue,
    rewardType,
    maxWins,
  });
}