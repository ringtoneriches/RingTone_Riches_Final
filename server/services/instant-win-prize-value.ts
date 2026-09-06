/** Prize-table £ value for cash/physical; ringtone points count for points prizes. */
export function instantWinValueFromTablePrize(
  parent: { prizeValue: string | number; ringtonePoints?: number | null },
  rewardType: string
): number {
  if (rewardType === "points") {
    const pts = Math.max(0, Number(parent.ringtonePoints || 0));
    if (pts > 0) return pts;
  }
  return Number(parent.prizeValue || 0);
}
