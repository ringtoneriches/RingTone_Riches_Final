import { describe, expect, it } from "vitest";
import {
  buildScratchTileLayout,
  matchScratchImageRow,
  scratchPrizeFromDetails,
} from "./scratch-controlled-layout";

const SAMPLE_IMAGES = [
  { id: "1", imageName: "England", rewardType: "cash", rewardValue: "2000" },
  { id: "2", imageName: "Croatia", rewardType: "points", rewardValue: "200" },
  { id: "3", imageName: "Japan", rewardType: "points", rewardValue: "500" },
  { id: "4", imageName: "No Win", rewardType: "try_again", rewardValue: "0" },
];

describe("scratchPrizeFromDetails", () => {
  it("maps frozen win details to scratch prize display", () => {
    const win = scratchPrizeFromDetails({
      isWin: true,
      rewardType: "points",
      rewardValue: "200",
      prizeName: "200 Ringtone Points",
    });
    expect(win.isWinner).toBe(true);
    expect(win.prizeInfo.type).toBe("points");
    expect(win.prizeInfo.value).toBe("200");
  });

  it("maps frozen lose details to lose display", () => {
    const lose = scratchPrizeFromDetails({ isWin: false, rewardType: "lose", rewardValue: "0" });
    expect(lose.isWinner).toBe(false);
    expect(lose.prizeInfo.type).toBe("none");
  });
});

describe("matchScratchImageRow", () => {
  it("finds display image for exact reward match", () => {
    const row = matchScratchImageRow(SAMPLE_IMAGES, "points", "200");
    expect(row?.imageName).toBe("Croatia");
  });
});

describe("buildScratchTileLayout", () => {
  it("builds a winning 3-match layout for winners", () => {
    const layout = buildScratchTileLayout(true, "Croatia", ["England", "Croatia", "Japan"]);
    expect(layout).toHaveLength(6);
    const croatiaCount = layout.filter((x) => x === "Croatia").length;
    expect(croatiaCount).toBe(3);
  });

  it("builds a layout with no 3-match line for losers", () => {
    const layout = buildScratchTileLayout(false, null, ["England", "Croatia", "Japan"]);
    expect(layout).toHaveLength(6);
    const patterns = [
      [0, 1, 2],
      [3, 4, 5],
      [0, 2, 4],
      [1, 3, 5],
    ];
    const hasWinLine = patterns.some(([a, b, c]) => layout[a] === layout[b] && layout[b] === layout[c]);
    expect(hasWinLine).toBe(false);
  });
});
