import { eq } from "drizzle-orm";
import { db } from "../db";
import { competitionPrizes } from "@shared/schema";
import { instantWinValueFromTablePrize } from "./instant-win-prize-value";

export type PromoJackpotPrize = {
  name: string;
  value: string;
  rewardType: "cash" | "points" | "physical";
  valueNum: number;
};

export {
  getPromoVideoModeStatus,
  isPromoVideoModeEnabled,
  isPromoVideoProductionBlocked,
  isPromoVideoStagingHost,
} from "./promo-video-mode-env";

function inferRewardTypeFromTable(row: {
  prizeName: string;
  prizeValue: string | number;
  ringtonePoints?: number | null;
}): "cash" | "points" | "physical" {
  const pts = Math.max(0, Number(row.ringtonePoints || 0));
  const cash = Number(row.prizeValue || 0);
  if (pts > 0 && cash <= 0) return "points";
  if (cash > 0) return "cash";
  return "physical";
}

/** Highest cash jackpot from prize table; falls back to highest points tier. */
export async function resolvePromoJackpotPrize(
  competitionId: string,
  tx: typeof db = db,
): Promise<PromoJackpotPrize | null> {
  const rows = await tx
    .select()
    .from(competitionPrizes)
    .where(eq(competitionPrizes.competitionId, competitionId));

  if (!rows.length) return null;

  const cashRows = rows
    .filter((r) => Number(r.prizeValue || 0) > 0)
    .sort((a, b) => Number(b.prizeValue) - Number(a.prizeValue));
  const pointsRows = rows
    .filter((r) => Number(r.ringtonePoints || 0) > 0)
    .sort((a, b) => Number(b.ringtonePoints || 0) - Number(a.ringtonePoints || 0));

  const row = cashRows[0] || pointsRows[0];
  if (!row) return null;

  const rewardType = inferRewardTypeFromTable(row);
  const valueNum = instantWinValueFromTablePrize(row, rewardType);

  return {
    name: row.prizeName.trim(),
    value: String(valueNum),
    rewardType,
    valueNum,
  };
}
