import { playTicketLabel, insertScratchPlayRecord, insertSpinPlayRecord } from "./play-ticket-labels";
import { planGroupActivation } from "@shared/instant-win-groups";
import {
  allocateTicketSeqsInBlocks,
  pickDistinctRandom,
} from "./controlled-pool-allocation";
import {
  buildScratchTileLayout,
  matchScratchImageRow,
  scratchDisplayImages,
  scratchPrizeFromDetails,
} from "./scratch-controlled-layout";
import {
  buildRoyalReelStops,
  royalSymbolFromPrize,
} from "./royal-controlled-layout";
import { instantWinValueFromTablePrize } from "./instant-win-prize-value";
import { notifyPublicWinnerUpdate } from "./record-game-winner";
import { randomInt, randomBytes } from "crypto";
import { and, asc, eq, gte, inArray, isNotNull, lte, ne, or, sql } from "drizzle-orm";
import { db } from "../db";
import { storage } from "../storage";
import {
  competitionPrizes,
  competitions,
  guestOrders,
  guestPrizes,
  guestTickets,
  instantWinPrizeAudit,
  instantWinPrizes,
  orders,
  platformSettings,
  tickets,
  transactions,
  users,
  winners,
  popUsage,
  popWins,
  slotUsage,
  spinUsage,
  spinWins,
  voltzUsage,
  voltzWins,
  plinkoUsage,
  plinkoWins,
  scratchCardUsage,
  scratchCardImages,
  royalUsage,
  gameSpinConfig,
  spinWheel2Configs,
} from "@shared/schema";

export const HIGH_VALUE_THRESHOLD = 1000;
export const CONTROLLED_MODE = "controlled_pool" as const;
export const PROBABILITY_MODE = "probability" as const;

type DbTx = typeof db | any;

export class InstantWinError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 400, code = "instant_win_error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function isControlledMode(mode?: string | null) {
  return mode === CONTROLLED_MODE;
}

function parseSaleBlockSize(raw: unknown, maxTickets: number): number {
  if (raw == null || raw === "" || raw === 0) {
    throw new InstantWinError(
      "Sale block size is required for controlled pool competitions",
      400,
      "block_required"
    );
  }
  const size = Number(raw);
  if (!Number.isInteger(size) || size < 1) {
    throw new InstantWinError(
      "Sale block size must be a whole number of at least 1",
      400,
      "invalid_block"
    );
  }
  if (maxTickets && size > maxTickets) {
    throw new InstantWinError(
      `Sale block size cannot be larger than the ticket pool (${maxTickets})`,
      400,
      "invalid_block"
    );
  }
  return size;
}

function assertControlledHasBlockSize(competition: { ticketBlockSize?: number | null }) {
  const size = Number(competition.ticketBlockSize || 0);
  if (!Number.isInteger(size) || size < 1) {
    throw new InstantWinError(
      "Sale block size is required for controlled pool competitions",
      400,
      "block_required"
    );
  }
}

function newRngRef() {
  return `rng_${Date.now()}_${randomBytes(6).toString("hex")}`;
}

function displayNameFromUser(user?: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null) {
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return name || user?.email || "Winner";
}

function shuffleThreeDifferent(base: number[] = [1, 5, 10]) {
  const vals = [...base];
  for (let i = vals.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [vals[i], vals[j]] = [vals[j], vals[i]];
  }
  if (vals[0] === vals[1]) vals[1] = vals[0] + 1;
  if (vals[1] === vals[2]) vals[2] = vals[1] + 2;
  if (vals[0] === vals[2]) vals[2] = vals[0] + 3;
  return vals.slice(0, 3);
}

export async function getMaxTicketsPerOrder(): Promise<number> {
  try {
    const [settings] = await db.select().from(platformSettings).limit(1);
    return Number(settings?.maxTicketsPerOrder || 250);
  } catch {
    return 250;
  }
}

export async function assertCanPurchaseTickets(
  competitionId: string,
  quantity: number,
  options?: { skipModeCheck?: boolean }
) {
  const qty = Number(quantity || 0);
  if (!Number.isFinite(qty) || qty < 1) {
    throw new InstantWinError("Quantity must be at least 1", 400, "invalid_quantity");
  }

  const [competition] = await db
    .select()
    .from(competitions)
    .where(eq(competitions.id, competitionId))
    .limit(1);

  if (!competition) {
    throw new InstantWinError("Competition not found", 404, "not_found");
  }

  const maxPerOrder = await getMaxTicketsPerOrder();
  const controlled = isControlledMode(competition.instantWinMode);

  if (controlled && qty > maxPerOrder) {
    throw new InstantWinError(
      `You can buy at most ${maxPerOrder} tickets per order`,
      400,
      "max_per_order"
    );
  }

  if (!controlled) {
    return competition;
  }

  assertControlledHasBlockSize(competition);

  const maxTickets = Number(competition.maxTickets || 0);
  if (!maxTickets || maxTickets < 1) {
    throw new InstantWinError(
      "Controlled instant-win competitions require a finite ticket pool",
      400,
      "unlimited_not_allowed"
    );
  }
  const remaining = maxTickets - Number(competition.soldTickets || 0);
  const reservedUnsold = await countReservedUnsold(db, competitionId, maxTickets);
  const buyable = Math.max(0, remaining - reservedUnsold);
  if (qty > buyable) {
    throw new InstantWinError(
      buyable <= 0 ? "This competition is sold out" : `Only ${buyable} tickets remaining`,
      400,
      "sold_out"
    );
  }

  return competition;
}

async function writeAudit(
  tx: DbTx,
  data: {
    prizeId: string;
    adminId?: string | null;
    action: string;
    previousStatus?: string | null;
    newStatus?: string | null;
    activationRule?: any;
    rngRef?: string | null;
    winningTicketNumber?: number | null;
    reason?: string | null;
  }
) {
  await tx.insert(instantWinPrizeAudit).values({
    prizeId: data.prizeId,
    adminId: data.adminId || null,
    action: data.action,
    previousStatus: data.previousStatus || null,
    newStatus: data.newStatus || null,
    activationRule: data.activationRule || null,
    rngRef: data.rngRef || null,
    winningTicketNumber: data.winningTicketNumber ?? null,
    reason: data.reason || null,
    createdAt: new Date(),
  });
}

export async function syncTablePrizeCounts(tx: DbTx, competitionPrizeId: string) {
  const siblings = await tx
    .select()
    .from(instantWinPrizes)
    .where(eq(instantWinPrizes.competitionPrizeId, competitionPrizeId));

  const live = siblings.filter((s) => s.status !== "disabled");
  const won = live.filter((s) => s.status === "won").length;
  const total = live.length;

  await tx
    .update(competitionPrizes)
    .set({
      totalQuantity: total,
      remainingQuantity: Math.max(0, total - won),
      updatedAt: new Date(),
    })
    .where(eq(competitionPrizes.id, competitionPrizeId));
}

async function soldSeqsInRange(tx: DbTx, competitionId: string, from: number, to: number) {
  const userSold = await tx
    .select({ seq: tickets.ticketSeq })
    .from(tickets)
    .where(
      and(
        eq(tickets.competitionId, competitionId),
        isNotNull(tickets.ticketSeq),
        gte(tickets.ticketSeq, from),
        lte(tickets.ticketSeq, to)
      )
    );
  const guestSold = await tx
    .select({ seq: guestTickets.ticketSeq })
    .from(guestTickets)
    .where(
      and(
        eq(guestTickets.competitionId, competitionId),
        isNotNull(guestTickets.ticketSeq),
        gte(guestTickets.ticketSeq, from),
        lte(guestTickets.ticketSeq, to)
      )
    );
  return new Set(
    [...userSold, ...guestSold]
      .map((r) => Number(r.seq))
      .filter((n) => Number.isFinite(n))
  );
}

/** Winning numbers on locked/disabled prizes are withheld from loser sales until active. */
async function reservedWinningSeqs(tx: DbTx, competitionId: string) {
  const rows = await tx
    .select({ n: instantWinPrizes.winningTicketNumber })
    .from(instantWinPrizes)
    .where(
      and(
        eq(instantWinPrizes.competitionId, competitionId),
        isNotNull(instantWinPrizes.winningTicketNumber),
        inArray(instantWinPrizes.status, ["locked", "disabled"])
      )
    );
  return new Set(
    rows
      .map((r) => Number(r.n))
      .filter((n) => Number.isFinite(n) && n >= 1)
  );
}

async function countReservedUnsold(tx: DbTx, competitionId: string, maxTickets: number) {
  const reserved = await reservedWinningSeqs(tx, competitionId);
  if (!reserved.size) return 0;
  const from = Math.min(...reserved);
  const to = Math.max(...reserved);
  const sold = await soldSeqsInRange(tx, competitionId, from, to);
  let reservedUnsold = 0;
  for (const n of reserved) {
    if (n <= maxTickets && !sold.has(n)) reservedUnsold += 1;
  }
  return reservedUnsold;
}

/** Every assigned winning number is permanently tied to its prize (all statuses). */
async function allocatedWinningNumbers(tx: DbTx, competitionId: string, exceptPrizeId?: string) {
  const rows = await tx
    .select({
      n: instantWinPrizes.winningTicketNumber,
      id: instantWinPrizes.id,
    })
    .from(instantWinPrizes)
    .where(
      and(
        eq(instantWinPrizes.competitionId, competitionId),
        isNotNull(instantWinPrizes.winningTicketNumber)
      )
    );
  return new Set(
    rows
      .filter((r) => !exceptPrizeId || r.id !== exceptPrizeId)
      .map((r) => Number(r.n))
      .filter((n) => Number.isFinite(n))
  );
}

async function allocateRandomSeqsInBlocks(
  tx: DbTx,
  competitionId: string,
  quantity: number,
  maxTickets: number,
  blockSize: number
): Promise<number[]> {
  const reserved = await reservedWinningSeqs(tx, competitionId);
  const sold = await soldSeqsInRange(tx, competitionId, 1, maxTickets);
  try {
    return allocateTicketSeqsInBlocks({
      quantity,
      maxTickets,
      blockSize,
      sold: sold as Set<number>,
      reserved: reserved as Set<number>,
    });
  } catch {
    throw new InstantWinError("This competition is sold out", 400, "sold_out");
  }
}

function sortTicketsForReveal<T extends { createdAt?: Date | string | null; ticketSeq?: number | null }>(
  rows: T[]
) {
  return rows.slice().sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return Number(a.ticketSeq || 0) - Number(b.ticketSeq || 0);
  });
}

export async function pickUnsoldNumberInRange(
  tx: DbTx,
  competitionId: string,
  rangeFrom: number,
  rangeTo: number,
  exceptPrizeId?: string
): Promise<{ number: number; rngRef: string }> {
  if (rangeFrom < 1 || rangeTo < rangeFrom) {
    throw new InstantWinError("Invalid ticket range", 400, "invalid_range");
  }

  const sold = await soldSeqsInRange(tx, competitionId, rangeFrom, rangeTo);
  const taken = await allocatedWinningNumbers(tx, competitionId, exceptPrizeId);
  const available: number[] = [];
  for (let n = rangeFrom; n <= rangeTo; n++) {
    if (!sold.has(n) && !taken.has(n)) available.push(n);
  }
  if (available.length === 0) {
    throw new InstantWinError(
      "No unsold ticket numbers left in this range",
      400,
      "range_exhausted"
    );
  }
  const rngRef = newRngRef();
  const picked = available[randomInt(0, available.length)];
  return { number: picked, rngRef };
}

/** Prize-table £ value for cash/physical; ringtone points count for points prizes. */
export { instantWinValueFromTablePrize } from "./instant-win-prize-value";

async function resolveInstantWinValueNum(
  prize: { value: string | number; rewardType: string; competitionPrizeId?: string | null },
  tx: DbTx
): Promise<number> {
  if (prize.rewardType === "points" && prize.competitionPrizeId) {
    const [row] = await tx
      .select({ ringtonePoints: competitionPrizes.ringtonePoints })
      .from(competitionPrizes)
      .where(eq(competitionPrizes.id, prize.competitionPrizeId))
      .limit(1);
    const pts = Math.max(0, Number(row?.ringtonePoints || 0));
    if (pts > 0) return pts;
  }
  return Number(prize.value || 0);
}

/** Cash-equivalent liability for admin exposure (points prizes use parent £ value). */
async function liabilityCashValue(
  prize: { value: string | number; rewardType: string; competitionPrizeId?: string | null },
  tx: DbTx
): Promise<number> {
  if (prize.rewardType === "points" && prize.competitionPrizeId) {
    const [row] = await tx
      .select({ prizeValue: competitionPrizes.prizeValue })
      .from(competitionPrizes)
      .where(eq(competitionPrizes.id, prize.competitionPrizeId))
      .limit(1);
    return Number(row?.prizeValue || 0);
  }
  return Number(prize.value || 0);
}

async function frozenTicketDetails(
  ticket: { prizeDetails?: unknown; instantWinPrizeId?: string | null },
  tx: DbTx = db
): Promise<any> {
  if (!ticket.instantWinPrizeId) {
    return (ticket.prizeDetails as any) || buildPrizeDetails(null);
  }
  const [prize] = await tx
    .select()
    .from(instantWinPrizes)
    .where(eq(instantWinPrizes.id, ticket.instantWinPrizeId))
    .limit(1);
  if (!prize) {
    return (ticket.prizeDetails as any) || buildPrizeDetails(null);
  }
  const valueNum = await resolveInstantWinValueNum(prize, tx);
  return buildPrizeDetails(prize, valueNum);
}

function buildPrizeDetails(
  prize: {
    name: string;
    value: string | number;
    rewardType: string;
  } | null,
  valueNumOverride?: number
) {
  if (!prize) {
    const balloonValues = shuffleThreeDifferent();
    return {
      creditedAtSale: true,
      isWin: false,
      isRPrize: false,
      rewardType: "lose",
      rewardValue: "0",
      prizeName: "Better luck next time",
      balloonValues,
      switchTexts: balloonValues.map((v) => `£${Number(v).toLocaleString("en-GB")}`),
      slot: { isEuro: true, pay: 0, symbol: "No Win", enabled: true },
      spin: { label: "No Win", type: "lose", value: "0", color: "#334155" },
      voltz: { outcome: "noWin", isWin: false, isFreeReplay: false },
      plinko: { isWin: false, slotIndex: 0, color: "#64748b" },
      scratch: { isWin: false, imageName: null },
      royal: { isWin: false, coinsWon: 0, rewardType: "no_win", rewardValue: "0" },
    };
  }

  const valueNum = valueNumOverride ?? Number(prize.value || 0);
  const rewardType = prize.rewardType;
  const isWin = rewardType === "cash" || rewardType === "points" || rewardType === "physical";
  const balloonValues =
    rewardType === "physical" ? [0, 0, 0] : [valueNum, valueNum, valueNum];
  const display =
    rewardType === "cash"
      ? Number.isInteger(valueNum)
        ? `£${valueNum.toLocaleString("en-GB")}`
        : `£${valueNum.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : rewardType === "points"
      ? `${Math.floor(valueNum).toLocaleString("en-GB")} Ringtone Points`
      : prize.name;

  return {
    creditedAtSale: true,
    isWin,
    isRPrize: false,
    rewardType,
    rewardValue: String(valueNum),
    prizeName: prize.name,
    balloonValues,
    switchTexts: [display, display, display],
    slot: {
      isEuro: rewardType === "cash",
      pay: rewardType === "physical" ? 0 : valueNum,
      symbol: prize.name,
      enabled: true,
    },
    spin: {
      label: prize.name,
      type: rewardType,
      value: String(valueNum),
      color: "#eab308",
    },
    voltz: {
      outcome: isWin ? "win" : "noWin",
      isWin,
      isFreeReplay: false,
    },
    plinko: {
      isWin,
      slotIndex: 0,
      color: isWin ? "#eab308" : "#64748b",
    },
    scratch: { isWin, imageName: null as string | null },
    royal: {
      isWin,
      coinsWon: isWin && rewardType !== "physical" ? Math.round(valueNum * (rewardType === "cash" ? 100 : 1)) : 0,
      rewardType: isWin ? rewardType : "no_win",
      rewardValue: String(valueNum),
    },
  };
}

async function creditFrozenWin(
  tx: DbTx,
  opts: {
    prize: any;
    competitionId: string;
    ticketSeq: number;
    userId?: string;
    guestOrderId?: string;
    isGuest?: boolean;
    valueNum?: number;
  }
) {
  const valueNum = opts.valueNum ?? (await resolveInstantWinValueNum(opts.prize, tx));
  let winnerUserId: string | null = opts.userId || null;
  let winnerDisplayName = "Winner";

  if (opts.isGuest && opts.guestOrderId) {
    const [guestOrder] = await tx
      .select()
      .from(guestOrders)
      .where(eq(guestOrders.id, opts.guestOrderId))
      .limit(1);
    winnerDisplayName =
      `${guestOrder?.firstName || ""} ${guestOrder?.lastName || ""}`.trim() ||
      guestOrder?.guestName ||
      "Guest";
    if (guestOrder) {
      await tx.insert(guestPrizes).values({
        guestOrderId: guestOrder.id,
        guestEmail: guestOrder.guestEmail,
        guestName: guestOrder.guestName,
        guestPhone: guestOrder.guestPhone,
        competitionId: opts.competitionId,
        prizeAmount: valueNum.toFixed(2),
        prizeType: opts.prize.rewardType,
        prizeDetails: {
          prizeName: opts.prize.name,
          ticketSeq: opts.ticketSeq,
          creditedAtSale: true,
        },
        winStatus: "pending",
        createdAt: new Date(),
      });
    }
  } else if (opts.userId) {
    const [user] = await tx.select().from(users).where(eq(users.id, opts.userId)).limit(1);
    winnerDisplayName = displayNameFromUser(user);
    if (opts.prize.rewardType === "cash" && valueNum > 0) {
      const nextBalance = (parseFloat(user?.balance || "0") + valueNum).toFixed(2);
      await tx.update(users).set({ balance: nextBalance }).where(eq(users.id, opts.userId));
      await tx.insert(transactions).values({
        userId: opts.userId,
        type: "prize",
        amount: valueNum.toFixed(2),
        description: `Instant win — ${opts.prize.name} (ticket #${opts.ticketSeq})`,
        createdAt: new Date(),
      });
    } else if (opts.prize.rewardType === "points" && valueNum > 0) {
      const pts = Math.floor(valueNum);
      await tx
        .update(users)
        .set({ ringtonePoints: (user?.ringtonePoints || 0) + pts })
        .where(eq(users.id, opts.userId));
      await tx.insert(transactions).values({
        userId: opts.userId,
        type: "prize",
        amount: String(pts),
        description: `Instant win — ${pts} points (ticket #${opts.ticketSeq})`,
        createdAt: new Date(),
      });
    }

    await tx.insert(winners).values({
      userId: opts.userId,
      competitionId: opts.competitionId,
      prizeDescription: opts.prize.name,
      prizeValue:
        opts.prize.rewardType === "cash"
          ? `£${valueNum.toFixed(2)}`
          : opts.prize.rewardType === "points"
          ? `${Math.floor(valueNum)} Points`
          : opts.prize.name,
      isShowcase: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    notifyPublicWinnerUpdate(opts.competitionId);
  }

  await tx
    .update(instantWinPrizes)
    .set({
      status: "won",
      wonAt: new Date(),
      winnerUserId,
      winnerDisplayName,
      lastChangedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(instantWinPrizes.id, opts.prize.id));

  if (opts.prize.competitionPrizeId) {
    await syncTablePrizeCounts(tx, opts.prize.competitionPrizeId);
  }

  await writeAudit(tx, {
    prizeId: opts.prize.id,
    action: "won_on_sale",
    previousStatus: opts.prize.status,
    newStatus: "won",
    winningTicketNumber: opts.ticketSeq,
    reason: "Winning ticket sold; prize frozen and credited",
  });

  return { winnerDisplayName, winnerUserId };
}

async function freezeIssuedTicket(
  tx: DbTx,
  opts: {
    competitionId: string;
    ticketSeq: number;
    userId?: string;
    guestOrderId?: string;
    isGuest?: boolean;
    ticketId: string;
  }
) {
  const [matchingPrize] = await tx
    .select()
    .from(instantWinPrizes)
    .where(
      and(
        eq(instantWinPrizes.competitionId, opts.competitionId),
        eq(instantWinPrizes.status, "active"),
        eq(instantWinPrizes.winningTicketNumber, opts.ticketSeq)
      )
    )
    .limit(1);

  const details = matchingPrize
    ? buildPrizeDetails(matchingPrize, await resolveInstantWinValueNum(matchingPrize, tx))
    : buildPrizeDetails(null);
  const isWin = Boolean(matchingPrize);
  const prizeAmount = matchingPrize
    ? String(details.rewardValue)
    : "0";

  if (matchingPrize) {
    await creditFrozenWin(tx, {
      prize: matchingPrize,
      competitionId: opts.competitionId,
      ticketSeq: opts.ticketSeq,
      userId: opts.userId,
      guestOrderId: opts.guestOrderId,
      isGuest: opts.isGuest,
      valueNum: Number(details.rewardValue),
    });
  }

  const patch = {
    isWinner: isWin,
    prizeAmount,
    prizeType: matchingPrize?.rewardType || "lose",
    prizeDetails: details,
    resultStatus: isWin ? "win" : "lose",
    instantWinPrizeId: matchingPrize?.id || null,
  };

  if (opts.isGuest) {
    await tx.update(guestTickets).set(patch).where(eq(guestTickets.id, opts.ticketId));
  } else {
    await tx.update(tickets).set(patch).where(eq(tickets.id, opts.ticketId));
  }

  return { isWin, details, prize: matchingPrize || null };
}

export type IssueTicketsOpts = {
  tx?: DbTx;
  competitionId: string;
  quantity: number;
  userId?: string;
  orderId?: string;
  guestOrderId?: string;
  isGuest?: boolean;
  gameType?: string;
  incrementSold?: boolean;
  makeLegacyNumber: (index: number) => string;
};

async function issuePlayTicketsInner(tx: DbTx, opts: IssueTicketsOpts) {
  const quantity = Number(opts.quantity || 0);
  if (quantity < 1) return { tickets: [] as any[], competition: null as any };

  await tx.execute(sql`SELECT id FROM competitions WHERE id = ${opts.competitionId} FOR UPDATE`);
  const [competition] = await tx
    .select()
    .from(competitions)
    .where(eq(competitions.id, opts.competitionId))
    .limit(1);

  if (!competition) {
    throw new InstantWinError("Competition not found", 404, "not_found");
  }

  const controlled = isControlledMode(competition.instantWinMode);
  const maxTickets = Number(competition.maxTickets || 0);
  const sold = Number(competition.soldTickets || 0);
  const configuredStart = Number(competition.nextTicketNumber || 1);
  const blockSize = Number(competition.ticketBlockSize || 0);
  const useBlocks = controlled && blockSize >= 1;

  let startSeq = configuredStart;
  if (controlled && !useBlocks) {
    throw new InstantWinError(
      "Sale block size is required for controlled pool ticket allocation",
      400,
      "block_required"
    );
  }

  if (controlled) {
    if (!maxTickets) {
      throw new InstantWinError(
        "Controlled instant-win competitions require a finite ticket pool",
        400,
        "unlimited_not_allowed"
      );
    }
    if (sold + quantity > maxTickets) {
      throw new InstantWinError("This competition is sold out", 400, "sold_out");
    }
    const reservedUnsold = await countReservedUnsold(tx, opts.competitionId, maxTickets);
    if (quantity > Math.max(0, maxTickets - sold - reservedUnsold)) {
      throw new InstantWinError("This competition is sold out", 400, "sold_out");
    }
    const maxPerOrder = await getMaxTicketsPerOrder();
    if (quantity > maxPerOrder) {
      throw new InstantWinError(
        `You can buy at most ${maxPerOrder} tickets per order`,
        400,
        "max_per_order"
      );
    }
  }

  let seqs: Array<number | null> = [];

  if (controlled) {
    if (useBlocks) {
      seqs = await allocateRandomSeqsInBlocks(
        tx,
        opts.competitionId,
        quantity,
        maxTickets,
        blockSize
      );
    }
  } else {
    seqs = Array.from({ length: quantity }, () => null);
  }

  const issued: any[] = [];
  const issuedAtBase = Date.now();

  for (let i = 0; i < quantity; i++) {
    const seq = seqs[i];
    const ticketNumber = controlled ? String(seq) : opts.makeLegacyNumber(i);
    const base = {
      ticketNumber,
      competitionId: opts.competitionId,
      ticketSeq: seq,
      isWinner: false,
      resultStatus: "pending" as const,
      createdAt: new Date(issuedAtBase + i),
    };

    if (opts.isGuest) {
      const [row] = await tx
        .insert(guestTickets)
        .values({
          ...base,
          guestOrderId: opts.guestOrderId,
        })
        .returning();
      issued.push(row);
    } else {
      if (!opts.userId) {
        throw new InstantWinError("User is required to issue tickets", 400, "user_required");
      }
      const [row] = await tx
        .insert(tickets)
        .values({
          ...base,
          userId: opts.userId,
          orderId: opts.orderId,
        })
        .returning();
      issued.push(row);
    }
  }

  const issuedSeqs = seqs.filter((n): n is number => Number.isFinite(Number(n)));
  const nextTicketNumber = controlled
    ? Math.max(startSeq, ...(issuedSeqs.length ? issuedSeqs : [startSeq - 1])) + 1
    : Number(competition.nextTicketNumber || 1);
  const soldTickets =
    opts.incrementSold === false ? sold : sold + quantity;

  await tx
    .update(competitions)
    .set({
      nextTicketNumber,
      soldTickets,
      updatedAt: new Date(),
    })
    .where(eq(competitions.id, opts.competitionId));

  if (controlled) {
    for (const ticket of issued) {
      await freezeIssuedTicket(tx, {
        competitionId: opts.competitionId,
        ticketSeq: Number(ticket.ticketSeq),
        userId: opts.userId,
        guestOrderId: opts.guestOrderId,
        isGuest: opts.isGuest,
        ticketId: ticket.id,
      });
    }
  }

  return { tickets: issued, competition };
}

export async function issuePlayTickets(opts: IssueTicketsOpts) {
  const run = async (tx: DbTx) => issuePlayTicketsInner(tx, opts);
  const result = opts.tx ? await run(opts.tx) : await db.transaction((tx) => run(tx));

  if (isControlledMode(result.competition?.instantWinMode)) {
    setImmediate(() => {
      evaluateAutoActivation(opts.competitionId).catch((err) =>
        console.error("[instant-win] auto-activate after sale failed", err)
      );
    });
  }

  return result;
}

export async function createInstantWinPrize(input: {
  competitionId: string;
  name: string;
  value: number | string;
  rewardType: "cash" | "points" | "physical";
  rangeFrom: number;
  rangeTo: number;
  activationType: "manual" | "percent_sold" | "count_sold" | "revenue" | "datetime";
  activationValue?: any;
  adminId?: string;
  confirmHighValue?: boolean;
  competitionPrizeId?: string | null;
}) {
  const [competition] = await db
    .select()
    .from(competitions)
    .where(eq(competitions.id, input.competitionId))
    .limit(1);
  if (!competition) throw new InstantWinError("Competition not found", 404);
  if (!isControlledMode(competition.instantWinMode)) {
    throw new InstantWinError("Enable controlled pool mode on this competition first", 400, "mode");
  }

  const maxTickets = Number(competition.maxTickets || 0);
  if (!maxTickets) throw new InstantWinError("Set a finite ticket pool first", 400);

  const rangeFrom = Number(input.rangeFrom);
  const rangeTo = Number(input.rangeTo);
  if (rangeFrom < 1 || rangeTo > maxTickets || rangeTo < rangeFrom) {
    throw new InstantWinError(`Range must be between 1 and ${maxTickets}`, 400, "invalid_range");
  }

  const valueNum = Number(input.value);
  if (!Number.isFinite(valueNum) || valueNum < 0) {
    throw new InstantWinError("Invalid prize value", 400);
  }
  if (valueNum >= HIGH_VALUE_THRESHOLD && !input.confirmHighValue) {
    throw new InstantWinError(
      `High-value prize (£${HIGH_VALUE_THRESHOLD}+) requires confirmation`,
      400,
      "high_value_confirm"
    );
  }

  const method = "a_pregen" as const;

  return db.transaction(async (tx) => {
    const picked = await pickUnsoldNumberInRange(tx, input.competitionId, rangeFrom, rangeTo);
    const winningTicketNumber = picked.number;
    const rngRef = picked.rngRef;

    const [prize] = await tx
      .insert(instantWinPrizes)
      .values({
        competitionId: input.competitionId,
        name: input.name.trim(),
        value: valueNum.toFixed(2),
        rewardType: input.rewardType,
        status: "locked",
        rangeFrom,
        rangeTo,
        activationType: input.activationType,
        activationValue: input.activationValue ?? null,
        allocationMethod: method,
        winningTicketNumber,
        lastChangedAt: new Date(),
        lastChangedBy: input.adminId || null,
        competitionPrizeId: input.competitionPrizeId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await writeAudit(tx, {
      prizeId: prize.id,
      adminId: input.adminId,
      action: "create",
      previousStatus: null,
      newStatus: "locked",
      activationRule: {
        type: input.activationType,
        value: input.activationValue,
        method,
      },
      rngRef,
      winningTicketNumber,
      reason: "Pre-generated winning number (locked)",
    });

    return prize;
  });
}

export async function activateInstantWinPrize(
  prizeId: string,
  adminId?: string,
  opts?: { confirmHighValue?: boolean; reason?: string }
) {
  return db.transaction(async (tx) => {
    const [prize] = await tx
      .select()
      .from(instantWinPrizes)
      .where(eq(instantWinPrizes.id, prizeId))
      .limit(1);
    if (!prize) throw new InstantWinError("Prize not found", 404);
    if (prize.status === "won") {
      throw new InstantWinError("This prize is already won and cannot be changed", 400, "already_won");
    }
    if (prize.status === "active") return prize;

    const valueNum = Number(prize.value || 0);
    if (valueNum >= HIGH_VALUE_THRESHOLD && !opts?.confirmHighValue) {
      throw new InstantWinError(
        `High-value prize (£${HIGH_VALUE_THRESHOLD}+) requires confirmation`,
        400,
        "high_value_confirm"
      );
    }

    let winningTicketNumber = prize.winningTicketNumber;
    let rngRef: string | null = null;

    if (prize.status === "disabled" && !winningTicketNumber) {
      throw new InstantWinError(
        "Disabled prize has no winning ticket number to re-enable",
        400,
        "no_winning_number"
      );
    }

    if (winningTicketNumber) {
      const sold = await soldSeqsInRange(
        tx,
        prize.competitionId,
        winningTicketNumber,
        winningTicketNumber
      );
      if (sold.has(Number(winningTicketNumber))) {
        throw new InstantWinError(
          `Winning ticket #${winningTicketNumber} is already sold and stays assigned to this prize. It cannot be replaced.`,
          400,
          "ticket_fixed"
        );
      }
    } else {
      const picked = await pickUnsoldNumberInRange(
        tx,
        prize.competitionId,
        prize.rangeFrom,
        prize.rangeTo,
        prize.id
      );
      winningTicketNumber = picked.number;
      rngRef = picked.rngRef;
    }

    const [updated] = await tx
      .update(instantWinPrizes)
      .set({
        status: "active",
        winningTicketNumber,
        lastChangedAt: new Date(),
        lastChangedBy: adminId || null,
        updatedAt: new Date(),
      })
      .where(eq(instantWinPrizes.id, prizeId))
      .returning();

    await writeAudit(tx, {
      prizeId,
      adminId,
      action: "activate",
      previousStatus: prize.status,
      newStatus: "active",
      activationRule: { type: prize.activationType, value: prize.activationValue },
      rngRef,
      winningTicketNumber,
      reason: opts?.reason || (prize.status === "disabled" ? "Disabled prize re-enabled; winning number unchanged" : "Prize activated; winning number stays fixed"),
    });

    return updated;
  });
}

export async function activateInstantWinPrizeGroups(
  competitionId: string,
  groupKeys: string[],
  adminId?: string,
  opts?: { confirmHighValue?: boolean }
) {
  if (!Array.isArray(groupKeys) || groupKeys.length === 0) {
    throw new InstantWinError("Select at least one prize group", 400);
  }
  if (!(await isCompetitionControlled(competitionId))) {
    throw new InstantWinError("Bulk activate is only for controlled pool games", 400);
  }

  const prizes = await db
    .select()
    .from(instantWinPrizes)
    .where(eq(instantWinPrizes.competitionId, competitionId));

  const plan = planGroupActivation(prizes, groupKeys, HIGH_VALUE_THRESHOLD);
  if (plan.groups.length === 0) {
    throw new InstantWinError("None of the selected groups have prizes on this game", 400);
  }
  if (plan.totalLocked === 0) {
    return {
      activated: 0,
      failed: [] as { id: string; message: string; code?: string }[],
      groups: plan.groups,
    };
  }
  if (plan.requiresHighValueConfirm && !opts?.confirmHighValue) {
    throw new InstantWinError(
      `High-value prize (£${HIGH_VALUE_THRESHOLD}+) requires confirmation`,
      400,
      "high_value_confirm"
    );
  }

  const failed: { id: string; message: string; code?: string }[] = [];
  let activated = 0;
  for (const prize of plan.toActivate) {
    try {
      await activateInstantWinPrize(prize.id, adminId, {
        confirmHighValue: true,
        reason: "Bulk activate selected groups",
      });
      activated += 1;
    } catch (error: any) {
      failed.push({
        id: prize.id,
        message: error?.message || "Activate failed",
        code: error?.code,
      });
    }
  }

  return { activated, failed, groups: plan.groups };
}

export async function lockInstantWinPrize(prizeId: string, adminId?: string) {
  return db.transaction(async (tx) => {
    const [prize] = await tx
      .select()
      .from(instantWinPrizes)
      .where(eq(instantWinPrizes.id, prizeId))
      .limit(1);
    if (!prize) throw new InstantWinError("Prize not found", 404);
    if (prize.status === "won") {
      throw new InstantWinError("Won prizes cannot be locked again", 400, "already_won");
    }
    const [updated] = await tx
      .update(instantWinPrizes)
      .set({
        status: "locked",
        lastChangedAt: new Date(),
        lastChangedBy: adminId || null,
        updatedAt: new Date(),
      })
      .where(eq(instantWinPrizes.id, prizeId))
      .returning();
    await writeAudit(tx, {
      prizeId,
      adminId,
      action: "lock",
      previousStatus: prize.status,
      newStatus: "locked",
      winningTicketNumber: prize.winningTicketNumber,
      reason: "Prize locked",
    });
    return updated;
  });
}

export async function disableInstantWinPrize(prizeId: string, adminId?: string) {
  return db.transaction(async (tx) => {
    const [prize] = await tx
      .select()
      .from(instantWinPrizes)
      .where(eq(instantWinPrizes.id, prizeId))
      .limit(1);
    if (!prize) throw new InstantWinError("Prize not found", 404);
    if (prize.status === "won") {
      throw new InstantWinError("Won prizes cannot be disabled", 400, "already_won");
    }
    if (prize.winningTicketNumber) {
      const sold = await soldSeqsInRange(
        tx,
        prize.competitionId,
        prize.winningTicketNumber,
        prize.winningTicketNumber
      );
      if (sold.has(Number(prize.winningTicketNumber))) {
        throw new InstantWinError(
          "Cannot disable a prize after its winning ticket has been sold",
          400,
          "ticket_sold"
        );
      }
    }
    const [updated] = await tx
      .update(instantWinPrizes)
      .set({
        status: "disabled",
        lastChangedAt: new Date(),
        lastChangedBy: adminId || null,
        updatedAt: new Date(),
      })
      .where(eq(instantWinPrizes.id, prizeId))
      .returning();
    await writeAudit(tx, {
      prizeId,
      adminId,
      action: "disable",
      previousStatus: prize.status,
      newStatus: "disabled",
      winningTicketNumber: prize.winningTicketNumber,
      reason: "Prize disabled; winning number stays reserved",
    });
    if (prize.competitionPrizeId) {
      await syncTablePrizeCounts(tx, prize.competitionPrizeId);
    }
    return updated;
  });
}

async function loadLinkedPrizeIds(tx: DbTx, competitionId: string) {
  const userLinked = await tx
    .select({ id: tickets.instantWinPrizeId })
    .from(tickets)
    .where(
      and(eq(tickets.competitionId, competitionId), isNotNull(tickets.instantWinPrizeId))
    );
  const guestLinked = await tx
    .select({ id: guestTickets.instantWinPrizeId })
    .from(guestTickets)
    .where(
      and(eq(guestTickets.competitionId, competitionId), isNotNull(guestTickets.instantWinPrizeId))
    );
  return new Set(
    [...userLinked, ...guestLinked]
      .map((row) => row.id)
      .filter((id): id is string => Boolean(id))
  );
}

function canRemoveInstantWinPrize(
  prize: typeof instantWinPrizes.$inferSelect,
  sold: Set<number>,
  linkedPrizeIds: Set<string>
) {
  if (prize.status === "won") return false;
  if (linkedPrizeIds.has(prize.id)) return false;
  if (prize.winningTicketNumber && sold.has(Number(prize.winningTicketNumber))) return false;
  return true;
}

async function removeInstantWinPrizes(
  tx: DbTx,
  prizes: Array<typeof instantWinPrizes.$inferSelect>
) {
  if (prizes.length === 0) return 0;
  const ids = prizes.map((p) => p.id);
  await tx.delete(instantWinPrizes).where(inArray(instantWinPrizes.id, ids));
  const parentIds = [...new Set(prizes.map((p) => p.competitionPrizeId).filter(Boolean))] as string[];
  for (const parentId of parentIds) {
    await syncTablePrizeCounts(tx, parentId);
  }
  return prizes.length;
}

export async function deleteInstantWinPrize(prizeId: string, _adminId?: string) {
  return db.transaction(async (tx) => {
    const [prize] = await tx
      .select()
      .from(instantWinPrizes)
      .where(eq(instantWinPrizes.id, prizeId))
      .limit(1);
    if (!prize) throw new InstantWinError("Prize not found", 404);
    if (prize.status === "won") {
      throw new InstantWinError("Won prizes cannot be deleted", 400, "already_won");
    }

    const [competition] = await tx
      .select()
      .from(competitions)
      .where(eq(competitions.id, prize.competitionId))
      .limit(1);
    const maxTickets = Number(competition?.maxTickets || prize.rangeTo || 0);
    const sold = await soldSeqsInRange(tx, prize.competitionId, 1, Math.max(1, maxTickets));
    const linkedPrizeIds = await loadLinkedPrizeIds(tx, prize.competitionId);

    if (!canRemoveInstantWinPrize(prize, sold, linkedPrizeIds)) {
      throw new InstantWinError(
        "Cannot delete a prize after its winning ticket has been sold",
        400,
        "ticket_sold"
      );
    }

    await removeInstantWinPrizes(tx, [prize]);
    return { deleted: 1, id: prizeId };
  });
}

export async function clearUnusedInstantWinPrizes(
  competitionId: string,
  opts?: { prizeIds?: string[] }
) {
  return db.transaction(async (tx) => {
    const [competition] = await tx
      .select()
      .from(competitions)
      .where(eq(competitions.id, competitionId))
      .limit(1);
    if (!competition) throw new InstantWinError("Competition not found", 404);

    const rows = await tx
      .select()
      .from(instantWinPrizes)
      .where(eq(instantWinPrizes.competitionId, competitionId));

    const requested = opts?.prizeIds?.length
      ? new Set(opts.prizeIds)
      : null;
    const scoped = requested ? rows.filter((p) => requested.has(p.id)) : rows;

    const maxTickets = Number(competition.maxTickets || 0);
    const sold = await soldSeqsInRange(tx, competitionId, 1, Math.max(1, maxTickets || 1));
    const linkedPrizeIds = await loadLinkedPrizeIds(tx, competitionId);
    const removable = scoped.filter((p) => canRemoveInstantWinPrize(p, sold, linkedPrizeIds));

    const deleted = await removeInstantWinPrizes(tx, removable);
    return {
      deleted,
      kept: scoped.length - deleted,
    };
  });
}

export async function listInstantWinPrizes(
  competitionId: string,
  opts?: { status?: string; revealLockedTickets?: boolean }
) {
  const rows = await db
    .select()
    .from(instantWinPrizes)
    .where(eq(instantWinPrizes.competitionId, competitionId))
    .orderBy(asc(instantWinPrizes.createdAt), asc(instantWinPrizes.id));

  const filtered = opts?.status && opts.status !== "all"
    ? rows.filter((r) => r.status === opts.status)
    : rows;

  return filtered.map((prize) => {
    return {
      ...prize,
      winningTicketHidden: false,
      winningTicketLabel: prize.winningTicketNumber
        ? `#${prize.winningTicketNumber}`
        : "Not generated",
    };
  });
}

export async function getPublicPrizePool(competitionId: string) {
  const [competition] = await db
    .select()
    .from(competitions)
    .where(eq(competitions.id, competitionId))
    .limit(1);

  const prizes = await db
    .select()
    .from(instantWinPrizes)
    .where(eq(instantWinPrizes.competitionId, competitionId));

  const tablePrizes = await db
    .select({
      id: competitionPrizes.id,
      ringtonePoints: competitionPrizes.ringtonePoints,
    })
    .from(competitionPrizes)
    .where(eq(competitionPrizes.competitionId, competitionId));
  const pointsByTableId = new Map(
    tablePrizes.map((row) => [row.id, Math.max(0, Number(row.ringtonePoints || 0))])
  );

  const publicPrizes = prizes.map((p) => {
    const showTicket = Boolean(p.winningTicketNumber);
    const isWon = p.status === "won";
    const ringtonePoints = p.competitionPrizeId ? pointsByTableId.get(p.competitionPrizeId) || 0 : 0;
    const isPointsPrize = p.rewardType === "points";
    return {
      id: p.id,
      competitionId: p.competitionId,
      competitionPrizeId: p.competitionPrizeId,
      prizeName: p.name,
      prizeValue: isPointsPrize ? 0 : Number(p.value),
      ringtonePoints,
      rewardType: p.rewardType,
      publicStatus: isWon ? ("won" as const) : ("available" as const),
      winningTicketNumber: showTicket ? p.winningTicketNumber : null,
      winnerDisplayName: isWon ? p.winnerDisplayName : null,
      wonAt: isWon ? p.wonAt : null,
      totalQuantity: 1,
      remainingQuantity: isWon ? 0 : 1,
    };
  });

  const grouped = new Map<string, typeof publicPrizes>();
  for (const prize of publicPrizes) {
    const key = prize.competitionPrizeId || `solo-${prize.id}`;
    const list = grouped.get(key) || [];
    list.push(prize);
    grouped.set(key, list);
  }

  const groups = Array.from(grouped.entries()).map(([id, items]) => {
    const wonItems = items.filter((p) => p.publicStatus === "won");
    const leftItems = items.filter((p) => p.publicStatus !== "won");
    const first = items[0];
    return {
      id,
      prizeName: first.prizeName,
      prizeValue: first.prizeValue,
      ringtonePoints: first.ringtonePoints,
      rewardType: first.rewardType,
      totalQuantity: items.length,
      remainingQuantity: leftItems.length,
      wonCount: wonItems.length,
      leftCount: leftItems.length,
      tickets: items.map((p) => ({
        id: p.id,
        winningTicketNumber: p.winningTicketNumber,
        publicStatus: p.publicStatus,
        winnerDisplayName: p.winnerDisplayName,
      })),
    };
  }).sort((a, b) => {
    const sortValue = (row: { rewardType?: string | null; ringtonePoints: number; prizeValue: number }) =>
      row.rewardType === "points" && row.ringtonePoints > 0
        ? row.ringtonePoints / 100
        : row.prizeValue;
    return sortValue(b) - sortValue(a);
  });

  const maxTickets = Number(competition?.maxTickets || 0);
  const soldTickets = Number(competition?.soldTickets || 0);

  return {
    mode: isControlledMode(competition?.instantWinMode) ? CONTROLLED_MODE : PROBABILITY_MODE,
    prizes: publicPrizes,
    groups,
    pool: {
      maxTickets,
      soldTickets,
      remaining: Math.max(0, maxTickets - soldTickets),
      percentSold: maxTickets > 0 ? Math.round((soldTickets / maxTickets) * 1000) / 10 : 0,
    },
  };
}

export async function getAdminExposure(competitionId: string) {
  const [competition] = await db
    .select()
    .from(competitions)
    .where(eq(competitions.id, competitionId))
    .limit(1);
  if (!competition) throw new InstantWinError("Competition not found", 404);

  const prizes = await db
    .select()
    .from(instantWinPrizes)
    .where(eq(instantWinPrizes.competitionId, competitionId));

  const maxTickets = Number(competition.maxTickets || 0);
  const soldTickets = Number(competition.soldTickets || 0);
  const ticketPrice = Number(competition.ticketPrice || 0);
  const revenue = Math.round(soldTickets * ticketPrice * 100) / 100;

  const sum = async (status: string) => {
    let total = 0;
    for (const p of prizes.filter((row) => row.status === status)) {
      total += await liabilityCashValue(p, db);
    }
    return total;
  };

  const paid = await sum("won");
  const activeLiability = await sum("active");
  const lockedLiability = await sum("locked");

  return {
    competitionId,
    title: competition.title,
    type: competition.type,
    instantWinMode: competition.instantWinMode || PROBABILITY_MODE,
    ticketPrice,
    maxTickets,
    soldTickets,
    remaining: Math.max(0, maxTickets - soldTickets),
    percentSold: maxTickets > 0 ? Math.round((soldTickets / maxTickets) * 1000) / 10 : 0,
    nextTicketNumber: competition.nextTicketNumber || 1,
    ticketBlockSize: competition.ticketBlockSize || null,
    revenue,
    instantWinsPaid: Math.round(paid * 100) / 100,
    activePrizeValue: Math.round(activeLiability * 100) / 100,
    lockedPrizeValue: Math.round(lockedLiability * 100) / 100,
    remainingLiability: Math.round((activeLiability + lockedLiability) * 100) / 100,
    prizeCounts: {
      locked: prizes.filter((p) => p.status === "locked").length,
      active: prizes.filter((p) => p.status === "active").length,
      won: prizes.filter((p) => p.status === "won").length,
      disabled: prizes.filter((p) => p.status === "disabled").length,
    },
  };
}

export async function setCompetitionInstantWinMode(
  competitionId: string,
  mode: "probability" | "controlled_pool",
  adminId?: string,
  ticketBlockSize?: number | null
) {
  const [competition] = await db
    .select()
    .from(competitions)
    .where(eq(competitions.id, competitionId))
    .limit(1);
  if (!competition) throw new InstantWinError("Competition not found", 404);

  if (mode === CONTROLLED_MODE) {
    if (competition.type === "instant") {
      throw new InstantWinError(
        "Instant-draw competitions stay raffle-based and cannot use the controlled pool",
        400,
        "instant_draw"
      );
    }
    if (!competition.maxTickets || Number(competition.maxTickets) < 1) {
      throw new InstantWinError(
        "Set a finite max tickets value before enabling the controlled pool",
        400,
        "unlimited_not_allowed"
      );
    }
  }

  const maxTickets = Number(competition.maxTickets || 0);
  const patch: any = {
    instantWinMode: mode,
    nextTicketNumber: competition.nextTicketNumber || Number(competition.soldTickets || 0) + 1,
    updatedAt: new Date(),
  };

  if (mode === CONTROLLED_MODE) {
    if (ticketBlockSize !== undefined) {
      patch.ticketBlockSize = parseSaleBlockSize(ticketBlockSize, maxTickets);
    } else if (!competition.ticketBlockSize || Number(competition.ticketBlockSize) < 1) {
      throw new InstantWinError(
        "Set a sale block size before enabling controlled pool",
        400,
        "block_required"
      );
    }
  } else {
    patch.ticketBlockSize = null;
    if (ticketBlockSize !== undefined && ticketBlockSize != null && ticketBlockSize !== 0) {
      throw new InstantWinError(
        "Sale block size only applies to controlled pool mode",
        400,
        "invalid_block"
      );
    }
  }

  if (mode === CONTROLLED_MODE) {
    assertControlledHasBlockSize({
      ticketBlockSize: patch.ticketBlockSize ?? competition.ticketBlockSize,
    });
  }

  const [updated] = await db
    .update(competitions)
    .set(patch)
    .where(eq(competitions.id, competitionId))
    .returning();

  return updated;
}

function thresholdMet(
  prize: typeof instantWinPrizes.$inferSelect,
  competition: typeof competitions.$inferSelect
) {
  const sold = Number(competition.soldTickets || 0);
  const maxTickets = Number(competition.maxTickets || 0);
  const ticketPrice = Number(competition.ticketPrice || 0);
  const revenue = sold * ticketPrice;
  const raw = prize.activationValue as any;
  const numeric =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
      ? parseFloat(raw)
      : raw && typeof raw === "object"
      ? parseFloat(raw.value ?? raw.percent ?? raw.count ?? raw.amount ?? raw.threshold)
      : NaN;

  if (prize.activationType === "percent_sold") {
    if (!maxTickets || !Number.isFinite(numeric)) return false;
    return (sold / maxTickets) * 100 >= numeric;
  }
  if (prize.activationType === "count_sold") {
    return Number.isFinite(numeric) && sold >= numeric;
  }
  if (prize.activationType === "revenue") {
    return Number.isFinite(numeric) && revenue >= numeric;
  }
  if (prize.activationType === "datetime") {
    const when = raw?.at || raw?.datetime || raw?.date || raw;
    const ts = when ? new Date(when).getTime() : NaN;
    return Number.isFinite(ts) && Date.now() >= ts;
  }
  return false;
}

export async function evaluateAutoActivation(competitionId: string) {
  const [competition] = await db
    .select()
    .from(competitions)
    .where(eq(competitions.id, competitionId))
    .limit(1);
  if (!competition || !isControlledMode(competition.instantWinMode)) return;

  const locked = await db
    .select()
    .from(instantWinPrizes)
    .where(
      and(
        eq(instantWinPrizes.competitionId, competitionId),
        eq(instantWinPrizes.status, "locked"),
        inArray(instantWinPrizes.activationType, [
          "percent_sold",
          "count_sold",
          "revenue",
          "datetime",
        ])
      )
    );

  for (const prize of locked) {
    if (!thresholdMet(prize, competition)) continue;
    try {
      await activateInstantWinPrize(prize.id, "system", {
        confirmHighValue: true,
        reason: `Auto-activated by ${prize.activationType} rule`,
      });
    } catch (err) {
      console.error(`[instant-win] failed to auto-activate prize ${prize.id}`, err);
    }
  }
}

export async function activateDueDatetimePrizes() {
  const due = await db
    .select()
    .from(instantWinPrizes)
    .where(
      and(
        eq(instantWinPrizes.status, "locked"),
        eq(instantWinPrizes.activationType, "datetime")
      )
    );

  for (const prize of due) {
    const [competition] = await db
      .select()
      .from(competitions)
      .where(eq(competitions.id, prize.competitionId))
      .limit(1);
    if (!competition || !isControlledMode(competition.instantWinMode)) continue;
    if (!thresholdMet(prize, competition)) continue;
    try {
      await activateInstantWinPrize(prize.id, "system", {
        confirmHighValue: true,
        reason: "Auto-activated by datetime cron",
      });
    } catch (err) {
      console.error(`[instant-win] datetime activate failed for ${prize.id}`, err);
    }
  }
}

async function nextFrozenTicket(opts: {
  orderId?: string;
  guestOrderId?: string;
  isGuest?: boolean;
}) {
  if (opts.isGuest && opts.guestOrderId) {
    const rows = await db
      .select()
      .from(guestTickets)
      .where(eq(guestTickets.guestOrderId, opts.guestOrderId));
    const pending = sortTicketsForReveal(
      rows.filter((t) => t.resultStatus === "win" || t.resultStatus === "lose")
    );
    return { ticket: pending[0] || null, remaining: pending.length, total: rows.length };
  }
  if (!opts.orderId) return { ticket: null, remaining: 0, total: 0 };
  const rows = await db.select().from(tickets).where(eq(tickets.orderId, opts.orderId));
  const pending = sortTicketsForReveal(
    rows.filter((t) => t.resultStatus === "win" || t.resultStatus === "lose")
  );
  return { ticket: pending[0] || null, remaining: pending.length, total: rows.length };
}

async function markTicketRevealed(ticketId: string, isGuest?: boolean) {
  if (isGuest) {
    await db
      .update(guestTickets)
      .set({ resultStatus: "revealed" })
      .where(eq(guestTickets.id, ticketId));
  } else {
    await db
      .update(tickets)
      .set({ resultStatus: "revealed" })
      .where(eq(tickets.id, ticketId));
  }
}

export async function isCompetitionControlled(competitionId: string) {
  const [competition] = await db
    .select({ instantWinMode: competitions.instantWinMode })
    .from(competitions)
    .where(eq(competitions.id, competitionId))
    .limit(1);
  return isControlledMode(competition?.instantWinMode);
}

export async function tryRevealControlledPop(opts: {
  competitionId: string;
  orderId: string;
  userId?: string;
  isGuest?: boolean;
  guestOrder?: any;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;
  const { ticket, remaining, total } = await nextFrozenTicket({
    orderId: opts.isGuest ? undefined : opts.orderId,
    guestOrderId: opts.isGuest ? opts.orderId : undefined,
    isGuest: opts.isGuest,
  });
  if (!ticket) return { handled: true, noTickets: true, remaining: 0, total };

  const details: any = await frozenTicketDetails(ticket);
  await markTicketRevealed(ticket.id, opts.isGuest);
  const ticketLabel = playTicketLabel(ticket);

  if (!opts.isGuest && opts.userId) {
    await db.insert(popUsage).values({
      orderId: opts.orderId,
      userId: opts.userId,
      usedAt: new Date(),
    });
    await db.insert(popWins).values({
      orderId: opts.orderId,
      userId: opts.userId,
      prizeId: ticket.instantWinPrizeId || "controlled",
      balloonValues: details.balloonValues,
      prizeName: details.prizeName,
      rewardType: details.rewardType === "lose" ? "lose" : details.rewardType,
      rewardValue: String(details.rewardValue ?? "0"),
      isWin: Boolean(details.isWin),
      ticketNumber: ticketLabel,
      wonAt: new Date(),
    });
  }

  const playsRemaining = Math.max(0, remaining - 1);
  if (opts.isGuest) {
    return {
      handled: true,
      response: {
        success: true,
        isGuest: true,
        controlledPool: true,
        isWinner: Boolean(details.isWin),
        prizeAmount: details.isWin ? details.rewardValue : "0",
        prizeType: details.rewardType,
        result: {
          balloonValues: details.balloonValues,
          isWin: Boolean(details.isWin),
          isRPrize: false,
          rewardType: details.rewardType,
          rewardValue: details.rewardType === "physical" ? details.prizeName : details.rewardValue,
          prizeName: details.prizeName,
          isPhysical: details.rewardType === "physical",
        },
        playsRemaining,
        totalTickets: total,
        ticketNumber: ticket.ticketNumber,
        orderReference: opts.guestOrder?.orderReference,
        guestEmail: opts.guestOrder?.guestEmail,
        message: details.isWin
          ? `Congratulations! You won ${details.prizeName}!`
          : "Better luck next time!",
      },
    };
  }

  return {
    handled: true,
    response: {
      success: true,
      isGuest: false,
      controlledPool: true,
      result: {
        balloonValues: details.balloonValues,
        isWin: Boolean(details.isWin),
        isRPrize: false,
        rewardType: details.rewardType,
        rewardValue: details.rewardType === "physical" ? details.prizeName : details.rewardValue,
        prizeName: details.prizeName,
        isPhysical: details.rewardType === "physical",
      },
      playsRemaining,
      ticketNumber: ticketLabel,
    },
  };
}

export async function revealAllControlledPop(opts: {
  competitionId: string;
  orderId: string;
  userId: string;
  count: number;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;
  const rows = await db.select().from(tickets).where(eq(tickets.orderId, opts.orderId));
  const pending = sortTicketsForReveal(
    rows.filter((t) => t.resultStatus === "win" || t.resultStatus === "lose")
  ).slice(0, opts.count);

  const results: any[] = [];
  let totalCash = 0;
  let totalPoints = 0;

  for (const ticket of pending) {
    const details: any = await frozenTicketDetails(ticket);
    await markTicketRevealed(ticket.id, false);
    const ticketLabel = playTicketLabel(ticket);
    await db.insert(popUsage).values({
      orderId: opts.orderId,
      userId: opts.userId,
      usedAt: new Date(),
    });
    await db.insert(popWins).values({
      orderId: opts.orderId,
      userId: opts.userId,
      prizeId: ticket.instantWinPrizeId || "controlled",
      balloonValues: details.balloonValues,
      prizeName: details.prizeName,
      rewardType: details.rewardType === "lose" ? "lose" : details.rewardType,
      rewardValue: String(details.rewardValue ?? "0"),
      isWin: Boolean(details.isWin),
      ticketNumber: ticketLabel,
      wonAt: new Date(),
    });
    if (details.rewardType === "cash") totalCash += Number(details.rewardValue || 0);
    if (details.rewardType === "points") totalPoints += Number(details.rewardValue || 0);
    results.push({
      balloonValues: details.balloonValues,
      isWin: Boolean(details.isWin),
      isRPrize: false,
      rewardType: details.rewardType,
      rewardValue: details.rewardValue,
      prizeName: details.prizeName,
      ticketNumber: playTicketLabel(ticket),
    });
  }

  const leftover = rows.filter((t) => t.resultStatus === "win" || t.resultStatus === "lose").length - pending.length;

  return {
    handled: true,
    response: {
      success: true,
      controlledPool: true,
      results,
      totalCashWon: totalCash,
      totalPointsWon: totalPoints,
      freeReplaysWon: 0,
      playsProcessed: results.length,
      playsRemaining: Math.max(0, leftover),
      creditedAtSale: true,
    },
  };
}

export async function tryRevealControlledSlot(opts: {
  competitionId: string;
  orderId: string;
  userId: string;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;
  const { ticket, remaining, total } = await nextFrozenTicket({ orderId: opts.orderId });
  if (!ticket) {
    return { handled: true, noTickets: true, remaining: 0, total };
  }
  const details: any = await frozenTicketDetails(ticket);
  const existingSpins = await db
    .select({ id: slotUsage.id })
    .from(slotUsage)
    .where(eq(slotUsage.orderId, opts.orderId));
  const spinNumber = existingSpins.length + 1;
  await markTicketRevealed(ticket.id, false);
  const isWin = Boolean(details.isWin);
  const coinsWon = details.rewardType === "physical" ? 0 : Number(details.rewardValue || 0);
  const ticketLabel = playTicketLabel(ticket);
  await db.insert(slotUsage).values({
    orderId: opts.orderId,
    userId: opts.userId,
    isWin,
    coinsWon,
    coinsSpent: 0,
    spinNumber,
    prizeId: ticket.instantWinPrizeId || null,
    prizeName: details.prizeName || null,
    ticketNumber: ticketLabel,
  } as any);

  return {
    handled: true,
    response: {
      success: true,
      controlledPool: true,
      isWin,
      coinsWon,
      prizeId: ticket.instantWinPrizeId,
      prizeName: details.prizeName,
      prizeType: details.rewardType === "cash" ? "cash" : details.rewardType,
      prizeImage: null,
      spinNumber,
      spinsUsed: spinNumber,
      spinsAllowed: total,
      ticketNumber: playTicketLabel(ticket),
      creditedAtSale: true,
    },
  };
}

export async function revealAllControlledSlot(opts: {
  competitionId: string;
  orderId: string;
  userId: string;
  count: number;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;

  const results: any[] = [];
  const max = Math.max(0, Math.floor(opts.count));
  for (let i = 0; i < max; i++) {
    const one = await tryRevealControlledSlot({
      competitionId: opts.competitionId,
      orderId: opts.orderId,
      userId: opts.userId,
    });
    if (!one?.handled) {
      if (results.length) break;
      return null;
    }
    if (one.noTickets) break;
    results.push(one.response);
  }

  const leftoverQuery = await nextFrozenTicket({ orderId: opts.orderId });

  return {
    handled: true,
    response: {
      success: true,
      controlledPool: true,
      creditedAtSale: true,
      processed: results.length,
      results,
      spinsRemaining: leftoverQuery.remaining,
      winCount: results.filter((r) => r.isWin).length,
      cashWon: results
        .filter((r) => r.isWin && r.prizeType === "cash")
        .reduce((sum, r) => sum + Number(r.coinsWon || 0), 0),
      pointsWon: results
        .filter((r) => r.isWin && r.prizeType === "points")
        .reduce((sum, r) => sum + Number(r.coinsWon || 0), 0),
    },
  };
}

type WheelSegment = {
  id?: string;
  label?: string;
  color?: string;
  iconKey?: string;
  rewardType?: string;
  rewardValue?: string | number;
};

async function loadWheelSegments(competitionId: string): Promise<WheelSegment[]> {
  const [competition] = await db
    .select({ wheelType: competitions.wheelType })
    .from(competitions)
    .where(eq(competitions.id, competitionId))
    .limit(1);
  const wheelType = competition?.wheelType || "wheel1";
  if (wheelType === "wheel2") {
    const [config] = await db
      .select()
      .from(spinWheel2Configs)
      .where(eq(spinWheel2Configs.id, "active"));
    return ((config?.segments as WheelSegment[]) || []).filter((s) => s?.id);
  }
  const [config] = await db
    .select()
    .from(gameSpinConfig)
    .where(eq(gameSpinConfig.id, "active"));
  return ((config?.segments as WheelSegment[]) || []).filter((s) => s?.id);
}

function pickWheelSegment(segments: WheelSegment[], details: any, prizeId?: string | null) {
  if (!segments.length) return null;
  const storedId = details?.spin?.segmentId;
  const byStored = storedId ? segments.find((s) => s.id === storedId) : null;
  if (byStored) return byStored;
  const byPrizeId = prizeId ? segments.find((s) => s.id === prizeId) : null;
  if (byPrizeId) return byPrizeId;

  const type = details?.spin?.type || details?.rewardType || "lose";
  const valueNum = Number(details?.spin?.value ?? details?.rewardValue ?? 0);
  const isLose = type === "lose" || details?.isWin === false;

  if (isLose) {
    const loseSegs = segments.filter((s) => s.rewardType === "lose");
    if (loseSegs.length) {
      return loseSegs[randomInt(loseSegs.length)];
    }
  } else {
    const sameType = segments.filter((s) => s.rewardType === type);
    const exact = sameType.find((s) => Number(s.rewardValue) === valueNum);
    if (exact) return exact;
    if (sameType.length) {
      return sameType.reduce((best, s) =>
        Math.abs(Number(s.rewardValue) - valueNum) < Math.abs(Number(best.rewardValue) - valueNum)
          ? s
          : best
      );
    }
    const label = String(details?.spin?.label || details?.prizeName || "");
    const byLabel = segments.find(
      (s) => s.label && label && (s.label === label || label.includes(s.label) || s.label.includes(label))
    );
    if (byLabel) return byLabel;
  }

  return segments[0];
}

export async function tryRevealControlledSpin(opts: {
  competitionId: string;
  orderId: string;
  userId: string;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;
  const { ticket, remaining, total } = await nextFrozenTicket({ orderId: opts.orderId });
  if (!ticket) return { handled: true, noTickets: true, remaining: 0, total };
  const details: any = await frozenTicketDetails(ticket);
  const wheelSegment = pickWheelSegment(
    await loadWheelSegments(opts.competitionId),
    details,
    ticket.instantWinPrizeId
  );
  const winningSegmentId = wheelSegment?.id;
  if (!winningSegmentId) {
    throw new InstantWinError("Wheel configuration is missing segments", 500, "wheel_config");
  }
  await markTicketRevealed(ticket.id, false);
  const ticketLabel = playTicketLabel(ticket);
  const spin = details.spin || {};
  const rewardType =
    details.rewardType === "points" || details.rewardType === "cash"
      ? details.rewardType
      : "lose";
  await db.transaction(async (tx) => {
    await insertSpinPlayRecord(tx, {
      orderId: opts.orderId,
      userId: opts.userId,
      ticketNumber: ticketLabel,
      isWin: Boolean(details.isWin),
      segmentId: winningSegmentId,
      prizeLabel: spin.label || details.prizeName || wheelSegment?.label || null,
      rewardType,
      rewardValue: String(details.rewardValue ?? "0"),
    });
    await tx.insert(spinWins).values({
      userId: opts.userId,
      segmentId: winningSegmentId,
      rewardType: rewardType as any,
      rewardValue: String(details.rewardValue ?? "0"),
      wonAt: new Date(),
    });
  });

  return {
    handled: true,
    response: {
      success: true,
      controlledPool: true,
      result: {
        segmentId: winningSegmentId,
        label: spin.label || details.prizeName || wheelSegment?.label,
        type: spin.type || details.rewardType,
        value: spin.value || details.rewardValue,
        iconKey: wheelSegment?.iconKey || null,
        color: spin.color || wheelSegment?.color || "#eab308",
      },
      winningSegmentId,
      ticketNumber: playTicketLabel(ticket),
      prize: {
        brand: details.prizeName,
        amount:
          details.rewardType === "cash"
            ? Number(details.rewardValue)
            : details.rewardType === "points"
            ? `${details.rewardValue} Ringtones`
            : details.rewardType === "physical"
            ? details.prizeName
            : 0,
        type: details.isWin ? details.rewardType : "none",
        ticketNumber: playTicketLabel(ticket),
      },
      spinsRemaining: Math.max(0, remaining - 1),
      orderId: opts.orderId,
      creditedAtSale: true,
    },
  };
}

export async function revealAllControlledSpin(opts: {
  competitionId: string;
  orderId: string;
  userId: string;
  count: number;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;
  const rows = await db.select().from(tickets).where(eq(tickets.orderId, opts.orderId));
  const pending = sortTicketsForReveal(
    rows.filter((t) => t.resultStatus === "win" || t.resultStatus === "lose")
  ).slice(0, opts.count);

  const results: any[] = [];
  for (const ticket of pending) {
    const details: any = await frozenTicketDetails(ticket);
    await markTicketRevealed(ticket.id, false);
    const ticketNumber = playTicketLabel(ticket);
    const rewardType =
      details.rewardType === "points" || details.rewardType === "cash"
        ? details.rewardType
        : "lose";
    await db.transaction(async (tx) => {
      await insertSpinPlayRecord(tx, {
        orderId: opts.orderId,
        userId: opts.userId,
        ticketNumber,
        isWin: Boolean(details.isWin),
        segmentId: details.spin?.segmentId || null,
        prizeLabel: details.prizeName || null,
        rewardType,
        rewardValue: String(details.rewardValue ?? "0"),
      });
    });
    results.push({
      label: details.prizeName,
      type: details.rewardType,
      value: details.rewardValue,
      isWin: Boolean(details.isWin),
      ticketNumber,
      prize: {
        brand: details.prizeName,
        amount:
          details.rewardType === "cash"
            ? Number(details.rewardValue)
            : details.rewardType === "points"
            ? `${details.rewardValue} Ringtones`
            : details.rewardType === "physical"
            ? details.prizeName
            : 0,
        type: details.isWin ? details.rewardType : "none",
        ticketNumber,
      },
    });
  }

  return {
    handled: true,
    response: {
      success: true,
      controlledPool: true,
      results,
      spins: results,
      freeReplaysWon: 0,
      creditedAtSale: true,
    },
  };
}

export async function peekControlledVoltz(opts: {
  competitionId: string;
  orderId: string;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;
  const { ticket, remaining, total } = await nextFrozenTicket({ orderId: opts.orderId });
  if (!ticket) return { handled: true, noTickets: true, remaining: 0, total };
  const details: any = await frozenTicketDetails(ticket);
  const voltz = details.voltz || {};
  return {
    handled: true,
    ticketId: ticket.id,
    response: {
      success: true,
      controlledPool: true,
      result: {
        outcome: voltz.outcome || (details.isWin ? "win" : "noWin"),
        isWin: Boolean(details.isWin),
        isFreeReplay: false,
        rewardType: details.rewardType === "lose" ? "no_win" : details.rewardType,
        rewardValue: details.rewardValue,
        prizeName: details.prizeName,
        prizeId: ticket.instantWinPrizeId,
        isPhysical: details.rewardType === "physical",
        switchTexts: details.switchTexts || ["NO MATCH", "£5", "£10"],
        ticketId: ticket.id,
        ticketNumber: playTicketLabel(ticket),
      },
      playsRemaining: Math.max(0, remaining - 1),
      creditedAtSale: true,
    },
  };
}

export async function confirmControlledVoltz(opts: {
  competitionId: string;
  orderId: string;
  userId: string;
  ticketId?: string;
  switchChosen?: number;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;
  let ticket: any = null;
  if (opts.ticketId) {
    const [row] = await db.select().from(tickets).where(eq(tickets.id, opts.ticketId)).limit(1);
    ticket = row;
  }
  if (!ticket) {
    const next = await nextFrozenTicket({ orderId: opts.orderId });
    ticket = next.ticket;
  }
  if (!ticket || (ticket.resultStatus !== "win" && ticket.resultStatus !== "lose")) {
    return { handled: true, alreadyRevealed: true };
  }
  const details: any = await frozenTicketDetails(ticket);
  await markTicketRevealed(ticket.id, false);
  const ticketLabel = playTicketLabel(ticket);
  await db.insert(voltzUsage).values({
    orderId: opts.orderId,
    userId: opts.userId,
    usedAt: new Date(),
  });
  await db.insert(voltzWins).values({
    orderId: opts.orderId,
    userId: opts.userId,
    prizeId: ticket.instantWinPrizeId || "controlled",
    switchChosen: opts.switchChosen || 0,
    rewardType: details.rewardType === "lose" ? "no_win" : details.rewardType,
    rewardValue: details.rewardValue,
    isWin: Boolean(details.isWin),
    ticketNumber: ticketLabel,
    wonAt: new Date(),
  });
  return {
    handled: true,
    response: {
      success: true,
      controlledPool: true,
      creditedAtSale: true,
      extraQuantity: 0,
      ticketNumber: ticketLabel,
    },
  };
}

export async function tryRevealControlledPlinko(opts: {
  competitionId: string;
  orderId: string;
  userId: string;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;
  const { ticket, remaining, total } = await nextFrozenTicket({ orderId: opts.orderId });
  if (!ticket) return { handled: true, noTickets: true, remaining: 0, total };
  const details: any = await frozenTicketDetails(ticket);
  await markTicketRevealed(ticket.id, false);
  const ticketLabel = playTicketLabel(ticket);
  await db.insert(plinkoUsage).values({
    orderId: opts.orderId,
    userId: opts.userId,
    usedAt: new Date(),
  });
  await db.insert(plinkoWins).values({
    orderId: opts.orderId,
    userId: opts.userId,
    prizeId: ticket.instantWinPrizeId || "controlled",
    slotIndex: details.plinko?.slotIndex || 0,
    rewardType: details.rewardType === "lose" ? "try_again" : details.rewardType,
    rewardValue: String(details.rewardValue ?? "0"),
    isWin: Boolean(details.isWin),
    ticketNumber: ticketLabel,
    wonAt: new Date(),
  });
  const user = await storage.getUser(opts.userId);
  return {
    handled: true,
    response: {
      success: true,
      controlledPool: true,
      slotIndex: details.plinko?.slotIndex || 0,
      prizeName: details.prizeName,
      prizeValue: details.rewardValue,
      rewardType: details.rewardType === "lose" ? "try_again" : details.rewardType,
      isWin: Boolean(details.isWin),
      color: details.plinko?.color || "#eab308",
      freeReplay: false,
      segmentFreePlay: false,
      ticketNumber: ticketLabel,
      playsRemaining: Math.max(0, remaining - 1),
      newBalance: user?.balance,
      newPoints: user?.ringtonePoints,
      creditedAtSale: true,
    },
  };
}

export async function revealAllControlledPlinko(opts: {
  competitionId: string;
  orderId: string;
  userId: string;
  count: number;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;
  const rows = await db.select().from(tickets).where(eq(tickets.orderId, opts.orderId));
  const pending = sortTicketsForReveal(
    rows.filter((t) => t.resultStatus === "win" || t.resultStatus === "lose")
  ).slice(0, opts.count);

  const results: any[] = [];
  let totalCashWon = 0;
  let totalPointsWon = 0;
  for (const ticket of pending) {
    const details: any = await frozenTicketDetails(ticket);
    await markTicketRevealed(ticket.id, false);
    const ticketLabel = playTicketLabel(ticket);
    await db.insert(plinkoUsage).values({
      orderId: opts.orderId,
      userId: opts.userId,
      usedAt: new Date(),
    });
    await db.insert(plinkoWins).values({
      orderId: opts.orderId,
      userId: opts.userId,
      prizeId: ticket.instantWinPrizeId || "controlled",
      slotIndex: details.plinko?.slotIndex || 0,
      rewardType: details.rewardType === "lose" ? "try_again" : details.rewardType,
      rewardValue: String(details.rewardValue ?? "0"),
      isWin: Boolean(details.isWin),
      ticketNumber: ticketLabel,
      wonAt: new Date(),
    });
    if (details.rewardType === "cash") totalCashWon += Number(details.rewardValue || 0);
    if (details.rewardType === "points") totalPointsWon += Number(details.rewardValue || 0);
    results.push({
      slotIndex: details.plinko?.slotIndex || 0,
      prizeName: details.prizeName,
      prizeValue: details.rewardValue,
      rewardType: details.rewardType,
      isWin: Boolean(details.isWin),
      color: details.plinko?.color || "#eab308",
      ticketNumber: ticketLabel,
    });
  }

  const leftover =
    rows.filter((t) => t.resultStatus === "win" || t.resultStatus === "lose").length - pending.length;

  return {
    handled: true,
    response: {
      success: true,
      controlledPool: true,
      results,
      totalCashWon,
      totalPointsWon,
      freeReplaysGranted: 0,
      playsRemaining: Math.max(0, leftover),
      creditedAtSale: true,
    },
  };
}

async function loadScratchImageRows() {
  return db
    .select()
    .from(scratchCardImages)
    .where(eq(scratchCardImages.isActive, true));
}

async function buildControlledScratchSessionPayload(ticket: any) {
  const details: any = await frozenTicketDetails(ticket);
  const { isWinner, prizeInfo } = scratchPrizeFromDetails(details);
  const imageRows = await loadScratchImageRows();
  const activeImages = scratchDisplayImages(imageRows);
  let winningImage: string | null = null;
  let prizeId = ticket.instantWinPrizeId || "controlled-lose";

  if (isWinner) {
    const matched = matchScratchImageRow(
      imageRows,
      details.rewardType,
      details.rewardValue
    );
    winningImage = matched?.imageName ? String(matched.imageName) : activeImages[0] || null;
    prizeId = matched?.id || ticket.instantWinPrizeId || prizeId;
    if (details.scratch?.imageName) {
      winningImage = details.scratch.imageName;
    }
  }

  const tileLayout = buildScratchTileLayout(isWinner, winningImage, activeImages);
  return {
    ticketId: ticket.id,
    ticketNumber: playTicketLabel(ticket),
    isWinner,
    prizeInfo,
    tileLayout,
    prizeId,
    details,
  };
}

export async function peekControlledScratch(opts: {
  competitionId: string;
  orderId: string;
  userId?: string;
  isGuest?: boolean;
  guestOrderId?: string;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;
  const { ticket, remaining, total } = await nextFrozenTicket({
    orderId: opts.isGuest ? undefined : opts.orderId,
    guestOrderId: opts.isGuest ? opts.guestOrderId || opts.orderId : undefined,
    isGuest: opts.isGuest,
  });
  if (!ticket) return { handled: true, noTickets: true, remaining: 0, total };

  const payload = await buildControlledScratchSessionPayload(ticket);
  return {
    handled: true,
    response: {
      success: true,
      controlledPool: true,
      creditedAtSale: true,
      ticketId: payload.ticketId,
      ticketNumber: payload.ticketNumber,
      isWinner: payload.isWinner,
      prize: payload.prizeInfo,
      tileLayout: payload.tileLayout,
      prizeId: payload.prizeId,
      remainingCards: Math.max(0, remaining - 1),
    },
  };
}

export async function confirmControlledScratch(opts: {
  competitionId: string;
  orderId: string;
  userId: string;
  ticketId: string;
  isGuest?: boolean;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;

  const table = opts.isGuest ? guestTickets : tickets;
  const [ticket] = await db
    .select()
    .from(table)
    .where(eq(table.id, opts.ticketId))
    .limit(1);

  if (!ticket) {
    throw new InstantWinError("Ticket not found", 404, "ticket_not_found");
  }
  if (ticket.resultStatus === "revealed") {
    return {
      handled: true,
      alreadyCompleted: true,
      response: {
        success: true,
        controlledPool: true,
        creditedAtSale: true,
        ticketNumber: playTicketLabel(ticket),
        prize: scratchPrizeFromDetails(await frozenTicketDetails(ticket)).prizeInfo,
      },
    };
  }
  if (ticket.resultStatus !== "win" && ticket.resultStatus !== "lose") {
    throw new InstantWinError("Ticket outcome is not ready", 400, "ticket_pending");
  }

  const details: any = await frozenTicketDetails(ticket);
  const { isWinner, prizeInfo } = scratchPrizeFromDetails(details);

  await markTicketRevealed(ticket.id, opts.isGuest);
  const ticketLabel = playTicketLabel(ticket);
  await db.transaction(async (tx) => {
    await insertScratchPlayRecord(tx, {
      orderId: opts.orderId,
      userId: opts.userId,
      ticketNumber: ticketLabel,
      isWin: isWinner,
      prizeId: ticket.instantWinPrizeId || null,
      prizeLabel: prizeInfo.label || null,
      rewardType: prizeInfo.type || null,
      rewardValue: String(prizeInfo.value ?? "0"),
    });
  });

  const [usedRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(scratchCardUsage)
    .where(eq(scratchCardUsage.orderId, opts.orderId));
  const order = await storage.getOrder(opts.orderId);
  const remainingCards = Math.max(0, Number(order?.quantity || 0) - Number(usedRow?.count || 0));

  return {
    handled: true,
    response: {
      success: true,
      controlledPool: true,
      creditedAtSale: true,
      ticketNumber: playTicketLabel(ticket),
      prize: prizeInfo,
      prizeLabel: prizeInfo.label,
      remainingCards,
      orderId: opts.orderId,
      isWinner,
    },
  };
}

export async function revealAllControlledScratch(opts: {
  competitionId: string;
  orderId: string;
  userId: string;
  count: number;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;

  const rows = await db.select().from(tickets).where(eq(tickets.orderId, opts.orderId));
  const pending = sortTicketsForReveal(
    rows.filter((t) => t.resultStatus === "win" || t.resultStatus === "lose")
  ).slice(0, opts.count);

  const scratches: Array<{ prize: { type: string; value: string; ticketNumber?: string | null; label?: string } }> = [];

  for (const ticket of pending) {
    const confirmed = await confirmControlledScratch({
      competitionId: opts.competitionId,
      orderId: opts.orderId,
      userId: opts.userId,
      ticketId: ticket.id,
    });
    if (!confirmed?.handled) break;
    scratches.push({
      prize: {
        ...confirmed.response.prize,
        ticketNumber: confirmed.response.ticketNumber,
      },
    });
  }

  const order = await storage.getOrder(opts.orderId);
  const [usedRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(scratchCardUsage)
    .where(eq(scratchCardUsage.orderId, opts.orderId));

  let totalCash = 0;
  let totalPoints = 0;
  for (const scratch of scratches) {
    const type = String(scratch.prize?.type || "").toLowerCase();
    const raw = scratch.prize?.value;
    if (type === "cash") totalCash += Number(raw || 0);
    else if (type === "points") totalPoints += parseInt(String(raw || "0"), 10) || 0;
  }

  return {
    handled: true,
    response: {
      success: true,
      controlledPool: true,
      creditedAtSale: true,
      scratches,
      summary: {
        totalCash,
        totalPoints,
        scratchesProcessed: scratches.length,
      },
      cardsRemaining: Math.max(0, Number(order?.quantity || 0) - Number(usedRow?.count || 0)),
    },
  };
}

export async function revealAllControlledVoltz(opts: {
  competitionId: string;
  orderId: string;
  userId: string;
  count: number;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;

  const results: any[] = [];
  const max = Math.max(0, Math.floor(opts.count));
  for (let i = 0; i < max; i++) {
    const peek = await peekControlledVoltz({
      competitionId: opts.competitionId,
      orderId: opts.orderId,
    });
    if (!peek?.handled || peek.noTickets) break;

    const confirmed = await confirmControlledVoltz({
      competitionId: opts.competitionId,
      orderId: opts.orderId,
      userId: opts.userId,
      ticketId: peek.ticketId,
      switchChosen: 0,
    });
    if (!confirmed?.handled) break;

    const result = peek.response?.result ?? {};
    results.push({
      outcome: (result as any).outcome,
      isWin: (result as any).isWin,
      rewardType: (result as any).rewardType,
      rewardValue: (result as any).rewardValue,
      prizeName: (result as any).prizeName,
      isFreeReplay: Boolean((result as any).isFreeReplay),
      switchTexts: (result as any).switchTexts,
      ticketNumber: (result as any).ticketNumber ?? null,
    });
  }

  const order = await storage.getOrder(opts.orderId);
  const [usedRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(voltzUsage)
    .where(eq(voltzUsage.orderId, opts.orderId));

  return {
    handled: true,
    response: {
      success: true,
      controlledPool: true,
      creditedAtSale: true,
      results,
      totalCash: 0,
      totalPoints: 0,
      freeReplaysWon: 0,
      playsProcessed: results.length,
      playsRemaining: Math.max(0, Number(order?.quantity || 0) - Number(usedRow?.count || 0)),
    },
  };
}

function royalCoinsFromDetails(details: any): number {
  if (!details?.isWin) return 0;
  if (details.rewardType === "cash") {
    return Math.round(Number(details.rewardValue || 0) * 100);
  }
  if (details.rewardType === "points") {
    return Math.floor(Number(details.rewardValue || 0));
  }
  return 0;
}

export async function tryRevealControlledRoyal(opts: {
  competitionId: string;
  orderId: string;
  userId: string;
}) {
  if (!(await isCompetitionControlled(opts.competitionId))) return null;
  const { ticket, remaining, total } = await nextFrozenTicket({ orderId: opts.orderId });
  if (!ticket) return { handled: true, noTickets: true, remaining: 0, total };

  const details: any = await frozenTicketDetails(ticket);
  const isWin = Boolean(details.isWin);
  const coinsWon = royalCoinsFromDetails(details);
  const winSymbol = royalSymbolFromPrize(details);
  const reelStops = buildRoyalReelStops(isWin, winSymbol);
  const ticketLabel = playTicketLabel(ticket);
  const cashValue =
    details.rewardType === "cash" && isWin
      ? parseFloat(String(details.rewardValue || 0)).toFixed(2)
      : "0";

  await markTicketRevealed(ticket.id, false);
  await db.insert(royalUsage).values({
    orderId: opts.orderId,
    userId: opts.userId,
    isWin,
    isRoyalReplay: false,
    rewardType: isWin ? details.rewardType : "no_win",
    rewardValue: isWin && details.rewardType === "points" ? String(details.rewardValue) : cashValue,
    prizeId: ticket.instantWinPrizeId || null,
    symbols: details.royal?.symbols || [],
    ticketNumber: ticketLabel,
    usedAt: new Date(),
  });

  const usageRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(royalUsage)
    .where(eq(royalUsage.orderId, opts.orderId));
  const spinNumber = Number(usageRows[0]?.count || 0);

  return {
    handled: true,
    response: {
      success: true,
      controlledPool: true,
      creditedAtSale: true,
      result: {
        isWin,
        rewardType: isWin ? details.rewardType : "no_win",
        rewardValue: isWin ? String(details.rewardValue ?? "0") : "0",
        prizeId: ticket.instantWinPrizeId,
        prizeName: details.prizeName,
        winSymbol: winSymbol || details.royal?.winSymbol || null,
        symbols: details.royal?.symbols || [],
        royalReplay: false,
      },
      reelStops,
      winSymbol: winSymbol || null,
      coinsWon,
      isWin,
      ticketNumber: playTicketLabel(ticket),
      spinNumber,
      playsRemaining: Math.max(0, remaining - 1),
    },
  };
}

export async function listPrizeAudit(prizeId: string) {
  return db
    .select()
    .from(instantWinPrizeAudit)
    .where(eq(instantWinPrizeAudit.prizeId, prizeId));
}
