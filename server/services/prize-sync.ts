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
const SKIP_REWARD_TYPES = ['points', 'try_again', 'physical']; // Skip non-cash prizes

// Helper: Clean prize name (remove emojis, special chars, extra spaces)
function cleanPrizeName(name: string): string {
  return name
    .replace(/[^\w\s£$€]/g, '') // Remove emojis and special characters
    .replace(/\s+/g, ' ')        // Normalize spaces
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

    // ✅ ONLY SYNC CASH PRIZES - skip everything else
    if (rewardType !== 'cash') {
      console.log(`⏭️ Skipping ${rewardType} prize sync: "${prizeName}"`);
      return {
        success: true,
        action: 'skipped',
        message: `Only cash prizes are synced. ${rewardType} prizes skipped.`,
        reason: 'non-cash-reward'
      };
    }

    const prizeValueNum = typeof prizeValue === 'string' ? parseFloat(prizeValue) : prizeValue;
    const cleanedGameName = cleanPrizeName(prizeName);

    // 🔍 MATCHING STRATEGY: Find existing prize by name (cleaned) AND value
    let existingPrize = null;

    // Get all prizes for this competition and game type
    const allPrizes = await db.select()
      .from(competitionPrizes)
      .where(
        and(
          eq(competitionPrizes.competitionId, competitionId),
          eq(competitionPrizes.gameType, gameType)
        )
      );

    // Try to find a match by cleaning both names and comparing
    for (const prize of allPrizes) {
      const cleanedDbName = cleanPrizeName(prize.prizeName);
      const dbValue = Number(prize.prizeValue);
      
      // Check if names match (ignoring emojis/icons) AND values match
      if (cleanedDbName === cleanedGameName && Math.abs(dbValue - prizeValueNum) < 0.01) {
        existingPrize = prize;
        break;
      }
    }

    // If found, JUST DECREMENT the remaining quantity
    if (existingPrize) {
      const newRemaining = Math.max(0, existingPrize.remainingQuantity - quantity);
      
      const [updatedPrize] = await db.update(competitionPrizes)
        .set({
          remainingQuantity: newRemaining,
          updatedAt: new Date(),
        })
        .where(eq(competitionPrizes.id, existingPrize.id))
        .returning();

      console.log(`✅ Prize "${existingPrize.prizeName}" decremented: ${existingPrize.remainingQuantity} → ${newRemaining} remaining`);

      return {
        success: true,
        action: 'updated',
        prize: updatedPrize,
        remaining: newRemaining,
        message: `Prize "${existingPrize.prizeName}" decremented: ${newRemaining} remaining`
      };
    }

    // ❌ PRIZE NOT FOUND - DO NOT CREATE, just log and skip
    console.log(`⚠️ Prize "${prizeName}" (value: £${prizeValueNum}) not found in competition prizes. Manual creation required.`);
    
    return {
      success: false,
      action: 'skipped',
      message: `Prize "${prizeName}" not found in competition prizes. Please add it manually in admin panel.`,
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

// Game-specific sync functions (keep these the same)
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