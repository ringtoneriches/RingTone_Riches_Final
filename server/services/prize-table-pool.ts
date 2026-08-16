import { eq } from "drizzle-orm";
import { db } from "../db";
import { competitionPrizes, competitions, instantWinPrizes } from "@shared/schema";
import {
  InstantWinError,
  createInstantWinPrize,
  isControlledMode,
  syncTablePrizeCounts,
} from "./instant-win-pool";

function inferRewardType(name: string): "cash" | "points" | "physical" {
  const n = (name || "").toLowerCase();
  if (n.includes("point") || n.includes("ringtone")) return "points";
  if (n.includes("cash") || n.includes("£") || n.includes("gbp")) return "cash";
  return "physical";
}

async function getCompetition(competitionId: string) {
  const [competition] = await db
    .select()
    .from(competitions)
    .where(eq(competitions.id, competitionId))
    .limit(1);
  return competition || null;
}

async function spawnChildren(opts: {
  parent: typeof competitionPrizes.$inferSelect;
  count: number;
  adminId?: string;
}) {
  const competition = await getCompetition(opts.parent.competitionId);
  if (!competition || !isControlledMode(competition.instantWinMode)) return [];

  const maxTickets = Number(competition.maxTickets || 0);
  if (!maxTickets) {
    throw new InstantWinError("Set a finite max tickets value before adding Prize Table prizes", 400);
  }

  const created = [];
  for (let i = 0; i < opts.count; i++) {
    const prize = await createInstantWinPrize({
      competitionId: opts.parent.competitionId,
      name: opts.parent.prizeName,
      value: opts.parent.prizeValue,
      rewardType: inferRewardType(opts.parent.prizeName),
      rangeFrom: 1,
      rangeTo: maxTickets,
      activationType: "manual",
      allocationMethod: "b_on_activate",
      adminId: opts.adminId,
      confirmHighValue: true,
      competitionPrizeId: opts.parent.id,
    });
    created.push(prize);
  }
  return created;
}

export async function onTablePrizeCreated(
  parent: typeof competitionPrizes.$inferSelect,
  adminId?: string
) {
  const competition = await getCompetition(parent.competitionId);
  if (!competition || !isControlledMode(competition.instantWinMode)) {
    return { spawned: 0 };
  }

  const qty = Math.max(1, Number(parent.totalQuantity || 1));
  const created = await spawnChildren({ parent, count: qty, adminId });
  await db.transaction(async (tx) => {
    await syncTablePrizeCounts(tx, parent.id);
  });
  return { spawned: created.length };
}

export async function onTablePrizeUpdated(
  parent: typeof competitionPrizes.$inferSelect,
  adminId?: string
) {
  const competition = await getCompetition(parent.competitionId);
  if (!competition || !isControlledMode(competition.instantWinMode)) {
    return { spawned: 0, removed: 0 };
  }

  const children = await db
    .select()
    .from(instantWinPrizes)
    .where(eq(instantWinPrizes.competitionPrizeId, parent.id));

  const live = children.filter((c) => c.status !== "disabled");
  const won = live.filter((c) => c.status === "won");
  const removable = live.filter((c) => c.status === "locked" || c.status === "active");
  const target = Math.max(1, Number(parent.totalQuantity || 1));

  if (target < won.length) {
    throw new InstantWinError(
      `Cannot set quantity to ${target}. ${won.length} of these prizes are already won.`,
      400
    );
  }

  for (const child of live) {
    if (child.status === "won") continue;
    await db
      .update(instantWinPrizes)
      .set({
        name: parent.prizeName,
        value: String(parent.prizeValue),
        updatedAt: new Date(),
      })
      .where(eq(instantWinPrizes.id, child.id));
  }

  let spawned = 0;
  let removed = 0;

  if (target > live.length) {
    const created = await spawnChildren({ parent, count: target - live.length, adminId });
    spawned = created.length;
  } else if (target < live.length) {
    const extra = live.length - target;
    const toRemove = removable
      .sort((a, b) => {
        if (a.status === "locked" && b.status !== "locked") return -1;
        if (b.status === "locked" && a.status !== "locked") return 1;
        return 0;
      })
      .slice(0, extra);
    if (toRemove.length < extra) {
      throw new InstantWinError("Not enough unwon prizes to reduce this quantity", 400);
    }
    for (const child of toRemove) {
      await db.delete(instantWinPrizes).where(eq(instantWinPrizes.id, child.id));
      removed += 1;
    }
  }

  await db.transaction(async (tx) => {
    await syncTablePrizeCounts(tx, parent.id);
  });

  return { spawned, removed };
}

export async function onTablePrizeDeleted(parentId: string) {
  const children = await db
    .select()
    .from(instantWinPrizes)
    .where(eq(instantWinPrizes.competitionPrizeId, parentId));

  if (children.some((c) => c.status === "won")) {
    throw new InstantWinError("Cannot delete this prize. One or more Instant Pool copies have already been won.", 400);
  }

  for (const child of children) {
    await db.delete(instantWinPrizes).where(eq(instantWinPrizes.id, child.id));
  }
}

export async function ensureChildrenForCompetition(competitionId: string, adminId?: string) {
  const competition = await getCompetition(competitionId);
  if (!competition || !isControlledMode(competition.instantWinMode)) return { spawned: 0 };

  const tablePrizes = await db
    .select()
    .from(competitionPrizes)
    .where(eq(competitionPrizes.competitionId, competitionId));

  let spawned = 0;
  for (const parent of tablePrizes) {
    const children = await db
      .select()
      .from(instantWinPrizes)
      .where(eq(instantWinPrizes.competitionPrizeId, parent.id));
    if (children.length > 0) continue;
    const result = await onTablePrizeCreated(parent, adminId);
    spawned += result.spawned;
  }
  return { spawned };
}
