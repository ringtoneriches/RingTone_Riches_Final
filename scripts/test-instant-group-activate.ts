import assert from "node:assert/strict";
import { instantPrizeGroupKey, planGroupActivation } from "../shared/instant-win-groups";

function prize(partial: Record<string, unknown>) {
  return {
    id: String(partial.id),
    status: String(partial.status),
    name: partial.name as string,
    value: partial.value,
    rewardType: (partial.rewardType as string) || "cash",
    competitionPrizeId: (partial.competitionPrizeId as string | null) ?? null,
  };
}

const pointsA = "grp-points";
const cash5k = "grp-5k";

const pool = [
  prize({ id: "p1", status: "locked", name: "125 Points", value: 1.25, rewardType: "points", competitionPrizeId: pointsA }),
  prize({ id: "p2", status: "locked", name: "125 Points", value: 1.25, rewardType: "points", competitionPrizeId: pointsA }),
  prize({ id: "p3", status: "active", name: "125 Points", value: 1.25, rewardType: "points", competitionPrizeId: pointsA }),
  prize({ id: "p4", status: "won", name: "125 Points", value: 1.25, rewardType: "points", competitionPrizeId: pointsA }),
  prize({ id: "p5", status: "locked", name: "£5,000", value: 5000, competitionPrizeId: cash5k }),
  prize({ id: "p6", status: "disabled", name: "£5,000", value: 5000, competitionPrizeId: cash5k }),
  prize({ id: "p7", status: "locked", name: "£2", value: 2, rewardType: "cash" }),
];

const pointsOnly = planGroupActivation(pool, [pointsA], 1000);
assert.equal(pointsOnly.totalLocked, 2);
assert.equal(pointsOnly.toActivate.map((p) => p.id).join(","), "p1,p2");
assert.equal(pointsOnly.requiresHighValueConfirm, false);
assert.equal(pointsOnly.groups.length, 1);
assert.equal(pointsOnly.groups[0].alreadyActive, 1);
assert.equal(pointsOnly.groups[0].won, 1);

const highOnly = planGroupActivation(pool, [cash5k], 1000);
assert.equal(highOnly.totalLocked, 1);
assert.equal(highOnly.toActivate[0].id, "p5");
assert.equal(highOnly.requiresHighValueConfirm, true);
assert.equal(highOnly.groups[0].disabled, 1);

const mixed = planGroupActivation(pool, [pointsA, cash5k], 1000);
assert.equal(mixed.totalLocked, 3);
assert.equal(mixed.requiresHighValueConfirm, true);
assert.ok(!mixed.toActivate.some((p) => p.id === "p3" || p.id === "p4" || p.id === "p6"));

const none = planGroupActivation(pool, ["missing"], 1000);
assert.equal(none.groups.length, 0);
assert.equal(none.totalLocked, 0);

const empty = planGroupActivation(pool, [], 1000);
assert.equal(empty.totalLocked, 0);

const fallbackKey = instantPrizeGroupKey({ value: 2, name: "£2", rewardType: "cash" });
assert.equal(fallbackKey, "2.00|£2|cash");
const fallback = planGroupActivation(pool, [fallbackKey], 1000);
assert.equal(fallback.totalLocked, 1);
assert.equal(fallback.toActivate[0].id, "p7");
assert.equal(fallback.requiresHighValueConfirm, false);

console.log("planGroupActivation: all assertions passed");
