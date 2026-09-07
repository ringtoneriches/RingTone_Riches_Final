import { randomInt } from "crypto";

/** Shared 10-symbol tape — must match slotConfigRoyalReels reel symbolImages order. */
export const ROYAL_SYMBOL_TAPE = [
  "RCoin",
  "RBell",
  "RCherry",
  "RBar",
  "RStar",
  "RDice",
  "RSeven",
  "RDiamond",
  "RTrophy",
  "RCrown",
] as const;

export type RoyalSlotSymbol = (typeof ROYAL_SYMBOL_TAPE)[number];

export function royalSymbolFromPrize(details: {
  isWin?: boolean;
  rewardType?: string;
  rewardValue?: string | number;
  prizeName?: string;
}): RoyalSlotSymbol | null {
  if (!details.isWin) return null;

  const name = String(details.prizeName || "").toLowerCase();
  const value = Number(details.rewardValue || 0);

  if (details.rewardType === "points") {
    if (value === 99 || name.includes("coin")) return "RCoin";
    if (value === 200 || name.includes("bell")) return "RBell";
    if (value === 1000 || name.includes("cherry")) return "RCherry";
    return "RCoin";
  }

  if (details.rewardType === "cash") {
    if (value === 50 || name.includes("bar")) return "RBar";
    if (value === 100 || name.includes("star")) return "RStar";
    if (value === 250 || name.includes("dice")) return "RDice";
    if (value === 500 || name.includes("seven") || name.includes("7")) return "RSeven";
    if (value === 1000 || name.includes("diamond")) return "RDiamond";
    if (value === 2500 || name.includes("trophy")) return "RTrophy";
    if (value === 5000 || name.includes("crown")) return "RCrown";
  }

  return null;
}

/** Middle row (window index 1) shows tape[(stop + 1) % len]. */
export function reelStopForMiddleSymbol(
  tape: readonly string[],
  symbolName: string
): number {
  const idx = tape.indexOf(symbolName);
  if (idx < 0) return 0;
  return (idx - 1 + tape.length) % tape.length;
}

function middleSymbolAtStop(tape: readonly string[], stop: number): string {
  return tape[(stop + 1) % tape.length];
}

export function buildRoyalReelStops(
  isWin: boolean,
  winSymbol: string | null,
  tape: readonly string[] = ROYAL_SYMBOL_TAPE
): [number, number, number] {
  const len = tape.length;
  if (len === 0) return [0, 0, 0];

  if (isWin && winSymbol) {
    const stop = reelStopForMiddleSymbol(tape, winSymbol);
    return [stop, stop, stop];
  }

  for (let attempt = 0; attempt < 80; attempt++) {
    const p0 = randomInt(0, len);
    const p1 = randomInt(0, len);
    const p2 = randomInt(0, len);
    const m0 = middleSymbolAtStop(tape, p0);
    const m1 = middleSymbolAtStop(tape, p1);
    const m2 = middleSymbolAtStop(tape, p2);
    if (!(m0 === m1 && m1 === m2)) {
      return [p0, p1, p2];
    }
  }

  return [0, 1, 2];
}
