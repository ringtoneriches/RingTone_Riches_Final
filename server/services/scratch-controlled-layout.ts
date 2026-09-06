import { randomInt } from "crypto";

const WINNING_PATTERNS = [
  [0, 1, 2],
  [3, 4, 5],
  [0, 2, 4],
  [1, 3, 5],
];

export type ScratchImageRow = {
  id: string;
  imageName: string | null;
  rewardType: string;
  rewardValue: string | number | null;
  label?: string | null;
};

export function scratchDisplayImages(rows: ScratchImageRow[]): string[] {
  return rows
    .filter(
      (p) =>
        p.rewardType !== "try_again" &&
        p.rewardType !== "lose" &&
        p.imageName &&
        String(p.imageName).trim() !== ""
    )
    .map((p) => String(p.imageName));
}

export function matchScratchImageRow(
  rows: ScratchImageRow[],
  rewardType: string,
  rewardValue: string | number
): ScratchImageRow | null {
  const valueStr = String(rewardValue);
  const exact = rows.find(
    (p) => p.rewardType === rewardType && String(p.rewardValue ?? "") === valueStr
  );
  if (exact) return exact;
  if (rewardType === "physical") {
    return rows.find((p) => p.rewardType === "physical") || null;
  }
  const sameType = rows.filter((p) => p.rewardType === rewardType);
  if (sameType.length === 0) return null;
  const target = Number(rewardValue);
  return sameType.reduce((best, p) => {
    const diff = Math.abs(Number(p.rewardValue || 0) - target);
    const bestDiff = Math.abs(Number(best.rewardValue || 0) - target);
    return diff < bestDiff ? p : best;
  });
}

export function buildScratchTileLayout(
  isWinner: boolean,
  winningImage: string | null,
  activeImages: string[]
): string[] {
  if (activeImages.length < 3) {
    throw new Error("Not enough active scratch images - need at least 3");
  }

  if (isWinner && winningImage) {
    if (!activeImages.includes(winningImage)) {
      throw new Error(`Winning image "${winningImage}" is not active`);
    }
    const winPositions = WINNING_PATTERNS[randomInt(0, WINNING_PATTERNS.length)];
    const tileLayout = Array<string>(6).fill("");
    winPositions.forEach((pos) => {
      tileLayout[pos] = winningImage;
    });
    const otherImages = activeImages.filter((img) => img !== winningImage);
    const shuffledOthers = [...otherImages].sort(() => randomInt(0, 2) - 0.5);
    let nonWinIndex = 0;
    for (let i = 0; i < 6; i++) {
      if (tileLayout[i] === "") {
        tileLayout[i] = shuffledOthers[nonWinIndex % shuffledOthers.length];
        nonWinIndex++;
      }
    }
    return tileLayout;
  }

  let tilesOk = false;
  let attempt = 0;
  let tileLayout: string[] = [];
  while (!tilesOk && attempt < 20) {
    const shuffled = [...activeImages].sort(() => randomInt(0, 2) - 0.5);
    tileLayout = shuffled.slice(0, 6);
    tilesOk = !WINNING_PATTERNS.some((pattern) => {
      const [a, b, c] = pattern;
      return tileLayout[a] === tileLayout[b] && tileLayout[b] === tileLayout[c];
    });
    attempt++;
  }
  if (!tilesOk) {
    tileLayout = activeImages.slice(0, 3).flatMap((img) => [img, img]).slice(0, 6);
  }
  return tileLayout;
}

export function scratchPrizeFromDetails(details: {
  isWin?: boolean;
  rewardType?: string;
  rewardValue?: string | number;
  prizeName?: string;
}) {
  const isWinner = Boolean(details.isWin);
  if (!isWinner) {
    return {
      isWinner: false,
      prizeInfo: { type: "none", value: "0", label: "Try Again" },
    };
  }
  const rewardType = details.rewardType || "lose";
  if (rewardType === "cash") {
    return {
      isWinner: true,
      prizeInfo: {
        type: "cash",
        value: parseFloat(String(details.rewardValue)).toFixed(2),
        label: details.prizeName || "Cash Prize",
      },
    };
  }
  if (rewardType === "points") {
    return {
      isWinner: true,
      prizeInfo: {
        type: "points",
        value: String(details.rewardValue),
        label: details.prizeName || "Points Prize",
      },
    };
  }
  if (rewardType === "physical") {
    return {
      isWinner: true,
      prizeInfo: {
        type: "physical",
        value: details.prizeName || "Physical Prize",
        label: details.prizeName || "Physical Prize",
      },
    };
  }
  return {
    isWinner: false,
    prizeInfo: { type: "none", value: "0", label: "Try Again" },
  };
}
