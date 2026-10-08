import { randomInt } from "crypto";

const POP_LOSE_DECOY_AMOUNTS = [
  1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 250, 500, 750, 1000,
];

/** Three different decoy cash amounts for losing Pop balloons (order shuffled). */
export function generateLosingBalloonValues(cashValues: number[] = []): number[] {
  const pool = [
    ...new Set(
      cashValues
        .map((v) => Math.round(Number(v) * 100) / 100)
        .filter((v) => Number.isFinite(v) && v > 0),
    ),
  ];
  const source = pool.length >= 2 ? pool : POP_LOSE_DECOY_AMOUNTS;

  let vals: number[];
  if (source.length >= 3) {
    vals = pickDistinctRandom(source, 3);
  } else {
    const [a, b] = source;
    const extra =
      POP_LOSE_DECOY_AMOUNTS.find((v) => v !== a && v !== b) ??
      Math.max(a, b) + Math.min(a, b);
    vals = pickDistinctRandom([a, b, extra], 3);
  }

  for (let i = vals.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [vals[i], vals[j]] = [vals[j], vals[i]];
  }
  return vals;
}

/** Pick distinct values from `available` without replacement. */
export function pickDistinctRandom(available: number[], count: number): number[] {
  const pool = available.slice();
  const picked: number[] = [];
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) break;
    const idx = randomInt(0, pool.length);
    picked.push(pool[idx]);
    pool[idx] = pool[pool.length - 1];
    pool.pop();
  }
  return picked;
}

export type BlockAllocationInput = {
  quantity: number;
  maxTickets: number;
  blockSize: number;
  sold: Set<number>;
  reserved: Set<number>;
};

/**
 * Controlled-pool sale allocation: fill block 1 (1..blockSize), then block 2, etc.
 * Within each block, pick randomly among unsold/unreserved numbers.
 */
export function allocateTicketSeqsInBlocks(input: BlockAllocationInput): number[] {
  const { quantity, maxTickets, blockSize, sold, reserved } = input;
  const size = Math.min(Math.max(1, blockSize), maxTickets);
  const seqs: number[] = [];
  let need = quantity;

  for (let start = 1; start <= maxTickets && need > 0; start += size) {
    const end = Math.min(start + size - 1, maxTickets);
    const available: number[] = [];
    for (let n = start; n <= end; n++) {
      if (!sold.has(n) && !reserved.has(n)) available.push(n);
    }
    if (available.length === 0) continue;
    const take = Math.min(need, available.length);
    seqs.push(...pickDistinctRandom(available, take));
    need -= take;
  }

  if (need > 0) {
    throw new Error("sold_out");
  }
  return seqs;
}

export type ActiveWinEntry = {
  name: string;
  value: number;
  rewardType: string;
};

/** Mirrors checkout freeze: win only when ticketSeq matches an active winning number. */
export function resolveTicketInstantWin(
  ticketSeq: number,
  activeWinningBySeq: Map<number, ActiveWinEntry>
): { isWin: boolean; prize: ActiveWinEntry | null } {
  const prize = activeWinningBySeq.get(ticketSeq) || null;
  return { isWin: Boolean(prize), prize };
}

export function assertSeqsWithinBlock(
  seqs: number[],
  blockIndex: number,
  blockSize: number,
  maxTickets: number
): boolean {
  const start = blockIndex * blockSize + 1;
  const end = Math.min(start + blockSize - 1, maxTickets);
  return seqs.every((n) => n >= start && n <= end);
}

/**
 * Turning a competition's prize rows into the pool of decoy amounts a losing
 * ticket is shown -- the three Pop balloons, the Voltz switch labels, and so
 * on. They are drawn from the real prize list so a near miss looks like
 * something that could genuinely have been won.
 *
 * Pure, so the shaping is covered by tests and so the caller can fetch every
 * row it needs in ONE query.
 *
 * What this replaced ran a separate SELECT for every points prize in the
 * competition, on every losing ticket issued, inside the purchase
 * transaction. A thousand-prize pool meant ~930 round trips per ticket -- a
 * ten-play order fired about 9,300 -- and those ~930 queries only ever reached
 * ten distinct parent prizes, asking the same ten questions ninety-odd times
 * each, to end up picking three numbers. Pop purchases averaged 97 seconds.
 *
 * Points are shown at the platform rate of 100 points to £1, so a decoy reads
 * as money next to the cash amounts.
 */
export type DecoyPrizeRow = {
  value: string | number | null;
  rewardType: string | null;
  /**
   * ringtonePoints from the parent prize-table row, joined in by the caller.
   * A points prize's own `value` is not authoritative; the parent's count wins
   * when it has one. Mirrors resolveInstantWinValueNum.
   */
  parentPoints?: string | number | null;
};

export function decoyValuesFromPrizeRows(rows: DecoyPrizeRow[]): number[] {
  const values: number[] = [];
  for (const row of rows) {
    if (row.rewardType === "cash") {
      const n = Number(row.value);
      if (Number.isFinite(n) && n > 0) values.push(Math.round(n * 100) / 100);
    } else if (row.rewardType === "points") {
      const parent = Math.max(0, Number(row.parentPoints || 0));
      const pts = parent > 0 ? parent : Number(row.value || 0);
      if (Number.isFinite(pts) && pts > 0) values.push(Math.round((pts / 100) * 100) / 100);
    }
  }
  return values;
}

export type DecoyTableRow = {
  prizeValue: string | number | null;
  ringtonePoints: string | number | null;
};

/**
 * Fallback decoys taken straight from the prize table.
 *
 * Only reached when the pool yields fewer than two usable values, which is a
 * competition whose prizes are all non-cash or not yet configured.
 */
export function decoyValuesFromTableRows(rows: DecoyTableRow[]): number[] {
  const values: number[] = [];
  for (const row of rows) {
    const cash = Number(row.prizeValue || 0);
    if (cash > 0) values.push(Math.round(cash * 100) / 100);
    const pts = Number(row.ringtonePoints || 0);
    if (pts > 0) values.push(Math.round((pts / 100) * 100) / 100);
  }
  return values;
}
