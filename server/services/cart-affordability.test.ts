import { describe, expect, it } from "vitest";
import { canCoverBasket, shortfallMessage } from "./cart-affordability";

const base = {
  total: 10,
  walletBalance: 0,
  ringtonePoints: 0,
  useWallet: false,
  usePoints: false,
};

describe("canCoverBasket", () => {
  it("passes a basket the wallet covers", () => {
    expect(canCoverBasket({ ...base, walletBalance: 25, useWallet: true })).toEqual({
      ok: true, wallet: 10, points: 0,
    });
  });

  it("passes a basket points cover, at 100 to the pound", () => {
    expect(canCoverBasket({ ...base, ringtonePoints: 1500, usePoints: true })).toEqual({
      ok: true, wallet: 0, points: 10,
    });
  });

  it("spends the wallet first, then points for the rest", () => {
    expect(
      canCoverBasket({ ...base, walletBalance: 4, ringtonePoints: 1000, useWallet: true, usePoints: true }),
    ).toEqual({ ok: true, wallet: 4, points: 6 });
  });

  it("refuses the basket that cost a customer three games", () => {
    // 5 October: £22.19 of games against £16.33 of wallet. The old guard let
    // it start and three lines were charged before it stopped.
    const v = canCoverBasket({ ...base, total: 22.19, walletBalance: 16.33, useWallet: true });
    expect(v).toEqual({ ok: false, shortfall: 5.86, covered: 16.33 });
  });

  it("refuses when nothing is selected to pay with", () => {
    expect(canCoverBasket({ ...base, walletBalance: 100, ringtonePoints: 10000 })).toEqual({
      ok: false, shortfall: 10, covered: 0,
    });
  });

  it("ignores a balance the customer did not choose to spend", () => {
    // Wallet selected, points not: the points must not quietly fill the gap.
    expect(
      canCoverBasket({ ...base, walletBalance: 4, ringtonePoints: 10000, useWallet: true }),
    ).toEqual({ ok: false, shortfall: 6, covered: 4 });
  });

  it("does not refuse over a penny of float", () => {
    // 1999 points is £19.99; a £19.99 basket must pass.
    expect(canCoverBasket({ ...base, total: 19.99, ringtonePoints: 1999, usePoints: true }).ok).toBe(true);
    // And a third of a pound three times over.
    expect(canCoverBasket({ ...base, total: 0.99, walletBalance: 0.33 * 3, useWallet: true }).ok).toBe(true);
  });

  it("still refuses a real shortfall of a penny", () => {
    const v = canCoverBasket({ ...base, total: 10, walletBalance: 9.9, useWallet: true });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.shortfall).toBe(0.1);
  });

  it("passes an empty or free basket", () => {
    expect(canCoverBasket({ ...base, total: 0 }).ok).toBe(true);
    expect(canCoverBasket({ ...base, total: -5 }).ok).toBe(true);
  });

  it("treats nonsense balances as nothing rather than as credit", () => {
    for (const bad of [Number.NaN, -100, undefined as any, null as any]) {
      const v = canCoverBasket({ ...base, walletBalance: bad, useWallet: true });
      expect(v.ok).toBe(false);
    }
  });

  it("never reports covering more than the basket costs", () => {
    const v = canCoverBasket({ ...base, total: 5, walletBalance: 100, ringtonePoints: 100000, useWallet: true, usePoints: true });
    expect(v).toEqual({ ok: true, wallet: 5, points: 0 });
  });
});

describe("shortfallMessage", () => {
  it("names the amount and what to do", () => {
    const msg = shortfallMessage({ ok: false, shortfall: 5.86, covered: 16.33 });
    expect(msg).toContain("£5.86");
    expect(msg).toMatch(/top up|card|remove/i);
  });
});
