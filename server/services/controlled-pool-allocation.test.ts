import { describe, expect, it } from "vitest";
import {
  allocateTicketSeqsInBlocks,
  assertSeqsWithinBlock,
  generateLosingBalloonValues,
  pickDistinctRandom,
  resolveTicketInstantWin,
  decoyValuesFromPrizeRows,
  decoyValuesFromTableRows,
  type DecoyPrizeRow,
} from "./controlled-pool-allocation";

describe("generateLosingBalloonValues", () => {
  it("returns three distinct values from the prize pool when possible", () => {
    const vals = generateLosingBalloonValues([1, 5, 10, 25, 50]);
    expect(vals).toHaveLength(3);
    expect(new Set(vals).size).toBe(3);
    vals.forEach((v) => expect([1, 5, 10, 25, 50]).toContain(v));
  });

  it("uses fallback decoys when fewer than two pool values exist", () => {
    const vals = generateLosingBalloonValues([5]);
    expect(vals).toHaveLength(3);
    expect(new Set(vals).size).toBe(3);
  });
});

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

/**
 * The decoy amounts shown on a losing ticket.
 *
 * These used to be built by querying the parent prize-table row once per
 * points prize -- about 930 queries per ticket on a live thousand-prize pool,
 * repeated for every ticket in the order. The join that replaced it has to
 * produce exactly the same numbers, so these pin the shaping against the
 * old per-row rule: a points prize takes its parent's count when it has one,
 * otherwise its own value, and points are shown at 100 to £1.
 */
describe("decoyValuesFromPrizeRows", () => {
  it("takes cash prizes at face value", () => {
    expect(
      decoyValuesFromPrizeRows([
        { rewardType: "cash", value: "5.00" },
        { rewardType: "cash", value: 2.5 },
      ]),
    ).toEqual([5, 2.5]);
  });

  it("prefers the parent's points count over the prize's own value", () => {
    // What resolveInstantWinValueNum did with a second query.
    expect(
      decoyValuesFromPrizeRows([{ rewardType: "points", value: "1", parentPoints: "500" }]),
    ).toEqual([5]);
  });

  it("falls back to the prize's own value when the parent has none", () => {
    // No parent row, or a parent with zero points -- both mean "use mine".
    expect(decoyValuesFromPrizeRows([{ rewardType: "points", value: "250" }])).toEqual([2.5]);
    expect(
      decoyValuesFromPrizeRows([{ rewardType: "points", value: "250", parentPoints: 0 }]),
    ).toEqual([2.5]);
    expect(
      decoyValuesFromPrizeRows([{ rewardType: "points", value: "250", parentPoints: null }]),
    ).toEqual([2.5]);
  });

  it("shows points as money at 100 to the pound", () => {
    expect(
      decoyValuesFromPrizeRows([{ rewardType: "points", value: 0, parentPoints: 100 }]),
    ).toEqual([1]);
  });

  it("drops anything worthless or unusable", () => {
    expect(
      decoyValuesFromPrizeRows([
        { rewardType: "cash", value: "0" },
        { rewardType: "cash", value: "-5" },
        { rewardType: "cash", value: "not a number" },
        { rewardType: "points", value: "0", parentPoints: 0 },
        { rewardType: "physical", value: "100" },
        { rewardType: null, value: "100" },
      ]),
    ).toEqual([]);
  });

  it("keeps duplicates, because the caller dedupes", () => {
    // generateLosingBalloonValues() puts them through a Set; shaping must not
    // quietly change how many of each there are.
    const out = decoyValuesFromPrizeRows([
      { rewardType: "cash", value: "5" },
      { rewardType: "cash", value: "5" },
    ]);
    expect(out).toEqual([5, 5]);
  });

  it("handles a real pool the way the old loop did", () => {
    // Shaped like a live competition: a handful of cash prizes and a long
    // tail of points prizes pointing at a few parent rows.
    const rows: DecoyPrizeRow[] = [
      ...Array.from({ length: 7 }, (_, i) => ({ rewardType: "cash", value: String((i + 1) * 5) })),
      ...Array.from({ length: 930 }, () => ({
        rewardType: "points",
        value: "1",
        parentPoints: "100",
      })),
    ];
    const out = decoyValuesFromPrizeRows(rows);
    expect(out).toHaveLength(937);
    expect(new Set(out).size).toBe(8); // 7 cash tiers + £1 of points
    expect(generateLosingBalloonValues(out)).toHaveLength(3);
  });
});

describe("decoyValuesFromTableRows", () => {
  it("takes both the cash value and the points from one row", () => {
    expect(
      decoyValuesFromTableRows([{ prizeValue: "10.00", ringtonePoints: 250 }]),
    ).toEqual([10, 2.5]);
  });

  it("skips the halves that are empty", () => {
    expect(decoyValuesFromTableRows([{ prizeValue: "0", ringtonePoints: 500 }])).toEqual([5]);
    expect(decoyValuesFromTableRows([{ prizeValue: "4", ringtonePoints: 0 }])).toEqual([4]);
    expect(decoyValuesFromTableRows([{ prizeValue: null, ringtonePoints: null }])).toEqual([]);
  });
});
