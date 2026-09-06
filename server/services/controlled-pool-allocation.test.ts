import { describe, expect, it } from "vitest";
import {
  allocateTicketSeqsInBlocks,
  assertSeqsWithinBlock,
  pickDistinctRandom,
  resolveTicketInstantWin,
} from "./controlled-pool-allocation";

describe("pickDistinctRandom", () => {
  it("returns distinct numbers without replacement", () => {
    const picked = pickDistinctRandom([1, 2, 3, 4, 5], 3);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
    picked.forEach((n) => expect([1, 2, 3, 4, 5]).toContain(n));
  });
});

describe("allocateTicketSeqsInBlocks", () => {
  it("fills block 1 before block 2 and stays within block bounds", () => {
    const sold = new Set<number>();
    const reserved = new Set<number>([50]);
    const seqs = allocateTicketSeqsInBlocks({
      quantity: 5,
      maxTickets: 2000,
      blockSize: 1000,
      sold,
      reserved,
    });
    expect(seqs).toHaveLength(5);
    expect(assertSeqsWithinBlock(seqs, 0, 1000, 2000)).toBe(true);
    expect(seqs.every((n) => n !== 50)).toBe(true);
  });

  it("skips sold and reserved numbers inside a block", () => {
    const sold = new Set([1, 2, 3]);
    const reserved = new Set([4]);
    const seqs = allocateTicketSeqsInBlocks({
      quantity: 3,
      maxTickets: 1000,
      blockSize: 1000,
      sold,
      reserved,
    });
    expect(seqs).toHaveLength(3);
    seqs.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(1000);
      expect(sold.has(n)).toBe(false);
      expect(reserved.has(n)).toBe(false);
    });
  });

  it("throws when not enough numbers remain", () => {
    const sold = new Set(Array.from({ length: 999 }, (_, i) => i + 2));
    expect(() =>
      allocateTicketSeqsInBlocks({
        quantity: 5,
        maxTickets: 1000,
        blockSize: 1000,
        sold,
        reserved: new Set([1]),
      })
    ).toThrow("sold_out");
  });
});

describe("resolveTicketInstantWin", () => {
  it("wins only on assigned active winning ticket numbers", () => {
    const active = new Map<number, { name: string; value: number; rewardType: string }>([
      [221, { name: "200 Points", value: 200, rewardType: "points" }],
      [999, { name: "£2000", value: 2000, rewardType: "cash" }],
    ]);

    expect(resolveTicketInstantWin(221, active).isWin).toBe(true);
    expect(resolveTicketInstantWin(221, active).prize?.value).toBe(200);

    expect(resolveTicketInstantWin(104, active).isWin).toBe(false);
    expect(resolveTicketInstantWin(202, active).isWin).toBe(false);
    expect(resolveTicketInstantWin(243, active).isWin).toBe(false);
  });
});
