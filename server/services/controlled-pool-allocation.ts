import { randomInt } from "crypto";

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
