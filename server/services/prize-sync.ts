// server/services/prize-sync.ts

import { competitionPrizes } from "@shared/schema";
import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";

interface PrizeSyncParams {
  competitionId: string;
  gameType: 'pop' | 'voltz' | 'plinko' | 'scratch' | 'spin' | 'wheel' | 'slot';  // ← ADD 'slot' here
  gamePrizeId: string;
  prizeName: string;
  prizeValue: number | string;
  rewardType: string;
  quantity?: number;
  maxWins?: number | null;
}

// ✅ Configuration: Prize types to skip syncing
const SKIP_REWARD_TYPES = ['points', 'try_again', 'physical'];

function cleanPrizeName(name: string): string {
  return name
    .replace(/[^\w\s£$€]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

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

    // ✅ ONLY SYNC CASH PRIZES
    if (rewardType !== 'cash') {
      console.log(`⏭️ Skipping ${rewardType} prize sync for ${gameType}: "${prizeName}"`);
      return {
        success: true,
        action: 'skipped',
        message: `Only cash prizes are synced. ${rewardType} prizes skipped.`,
        reason: 'non-cash-reward'
      };
    }

    const prizeValueNum = typeof prizeValue === 'string' ? parseFloat(prizeValue) : prizeValue;

    // 🔍 MATCH BY COMPETITION + VALUE ONLY
    let existingPrize = null;

    const allPrizes = await db.select()
      .from(competitionPrizes)
      .where(
        eq(competitionPrizes.competitionId, competitionId)
      );

    for (const prize of allPrizes) {
      const dbValue = Number(prize.prizeValue);
      
      if (Math.abs(dbValue - prizeValueNum) < 0.01) {
        existingPrize = prize;
        break;
      }
    }

    if (existingPrize) {
      const newRemaining = Math.max(0, existingPrize.remainingQuantity - quantity);
      
      const [updatedPrize] = await db.update(competitionPrizes)
        .set({
          remainingQuantity: newRemaining,
          updatedAt: new Date(),
        })
        .where(eq(competitionPrizes.id, existingPrize.id))
        .returning();

      console.log(`✅ [${gameType}] Prize "${existingPrize.prizeName}" decremented: ${existingPrize.remainingQuantity} → ${newRemaining} remaining`);

      return {
        success: true,
        action: 'updated',
        prize: updatedPrize,
        remaining: newRemaining,
        message: `Prize "${existingPrize.prizeName}" decremented`
      };
    }

    console.log(`⚠️ [${gameType}] Prize with value £${prizeValueNum} not found in competition ${competitionId}`);
    
    return {
      success: false,
      action: 'skipped',
      message: `Prize with value £${prizeValueNum} not found. Please add it manually.`,
      reason: 'not-found'
    };

  } catch (error) {
    console.error('Prize sync error:', error);
    return {
      success: false,
      action: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ─── EXISTING GAME SYNC FUNCTIONS ───

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

// ─── SPIN WHEEL (the wheel game) ───
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
    gameType: 'spin',  // ← This is the WHEEL game
    gamePrizeId: prizeId,
    prizeName,
    prizeValue,
    rewardType,
    maxWins,
  });
}

// ─── SLOT MACHINE (the slot game) ───
export async function syncSlotPrize(
  competitionId: string, 
  prizeId: string, 
  prizeName: string, 
  prizeValue: string | number,
  rewardType: string,
  maxWins?: number | null
) {
  return syncPrizeWin({
    competitionId,
    gameType: 'slot',  // ← This is the SLOT MACHINE game
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