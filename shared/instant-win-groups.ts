/** Same grouping as Instant Pool admin cards. */
export function instantPrizeGroupKey(prize: {
  competitionPrizeId?: string | null;
  value?: unknown;
  name?: string | null;
  rewardType?: string | null;
}) {
  if (prize.competitionPrizeId) return prize.competitionPrizeId;
  return `${Number(prize.value || 0).toFixed(2)}|${prize.name || ""}|${prize.rewardType || ""}`;
}

export type PlannedGroupActivation = {
  key: string;
  name: string;
  value: number;
  rewardType: string;
  lockedCount: number;
  alreadyActive: number;
  won: number;
  disabled: number;
  highValue: boolean;
};

export function planGroupActivation<T extends {
  id: string;
  status: string;
  competitionPrizeId?: string | null;
  value?: unknown;
  name?: string | null;
  rewardType?: string | null;
}>(
  prizes: T[],
  groupKeys: string[],
  highValueThreshold = 1000
) {
  const wanted = new Set(groupKeys.filter((k) => typeof k === "string" && k.length > 0));
  const groups = new Map<string, PlannedGroupActivation>();
  const toActivate: T[] = [];

  for (const prize of prizes) {
    const key = instantPrizeGroupKey(prize);
    if (!wanted.has(key)) continue;
    const value = Number(prize.value || 0);
    const existing = groups.get(key) || {
      key,
      name: prize.name || "Prize",
      value,
      rewardType: prize.rewardType || "",
      lockedCount: 0,
      alreadyActive: 0,
      won: 0,
      disabled: 0,
      highValue: value >= highValueThreshold,
    };
    if (prize.status === "locked") {
      existing.lockedCount += 1;
      toActivate.push(prize);
    } else if (prize.status === "active") existing.alreadyActive += 1;
    else if (prize.status === "won") existing.won += 1;
    else if (prize.status === "disabled") existing.disabled += 1;
    groups.set(key, existing);
  }

  const list = Array.from(groups.values()).sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return a.name.localeCompare(b.name);
  });

  return {
    groups: list,
    toActivate,
    totalLocked: toActivate.length,
    requiresHighValueConfirm: toActivate.some((p) => Number(p.value || 0) >= highValueThreshold),
  };
}
