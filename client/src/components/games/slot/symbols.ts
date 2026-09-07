import type { Scene } from "phaser";

/** PNG/WebP symbols loaded in Preload. */
export const IMAGE_SYMBOLS = [
  { key: "sym_coin", file: "Coin £1.png" },
  { key: "sym_tomato", file: "Tomato £2.png" },
  { key: "sym_apple", file: "Apple £3.png" },
  { key: "sym_bell", file: "Bell £4.png" },
  { key: "sym_grape", file: "Grape £5.png" },
  { key: "sym_banana", file: "Banana £25.png" },
  { key: "sym_cherry", file: "Cherry £50.png" },
  { key: "sym_orange", file: "Orange £80.png" },
  { key: "sym_star", file: "Star £100.png" },
  { key: "sym_diamond", file: "Diamond £1000.png" },
  { key: "sym_pts750", file: "750 Points.png" },
  { key: "sym_pts1000", file: "1000 Points.png" },
] as const;

/** Fallback emoji symbols — no PNG assets required. */
export const EMOJI_SYMBOLS = [
  { key: "sym_bar", emoji: "🟥" },
  { key: "sym_seven", emoji: "7️⃣" },
  { key: "sym_dice", emoji: "🎲" },
  { key: "sym_trophy", emoji: "🏆" },
  { key: "sym_crown", emoji: "👑" },
] as const;

export const ALL_SYM_KEYS = [
  ...IMAGE_SYMBOLS.map((s) => s.key),
  ...EMOJI_SYMBOLS.map((s) => s.key),
];

/** Royal Spin / prize-table symbols used on non-win filler rows. */
export const ROYAL_SPIN_KEYS = [
  "sym_coin",
  "sym_bell",
  "sym_cherry",
  "sym_bar",
  "sym_star",
  "sym_dice",
  "sym_seven",
  "sym_diamond",
  "sym_trophy",
  "sym_crown",
] as const;

const EMOJI_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

export function generateEmojiSymbolTextures(scene: Scene, size = 256) {
  for (const { key, emoji } of EMOJI_SYMBOLS) {
    if (scene.textures.exists(key)) continue;

    const text = scene.make.text({
      x: size / 2,
      y: size / 2,
      text: emoji,
      style: {
        fontFamily: EMOJI_FONT,
        fontSize: `${Math.floor(size * 0.62)}px`,
      },
    });
    text.setOrigin(0.5);
    text.generateTexture(key, size, size);
    text.destroy();
  }
}

export function chooseWinSymbolKey(result: {
  isWin?: boolean;
  coinsWon?: number;
  prizeType?: string;
  prizeName?: string;
}): string {
  const name = String(result.prizeName || "").toLowerCase();

  if (name.includes("crown")) return "sym_crown";
  if (name.includes("trophy")) return "sym_trophy";
  if (name.includes("diamond")) return "sym_diamond";
  if (name.includes("seven") || /\b7\b/.test(name)) return "sym_seven";
  if (name.includes("dice")) return "sym_dice";
  if (name.includes("star")) return "sym_star";
  if (name.includes("bar")) return "sym_bar";
  if (name.includes("cherry")) return "sym_cherry";
  if (name.includes("bell")) return "sym_bell";
  if (name.includes("coin")) return "sym_coin";

  if (result.prizeType === "points") {
    const pts = Number(result.coinsWon || 0);
    if (pts >= 1000) return "sym_cherry";
    if (pts >= 200) return "sym_bell";
    return "sym_coin";
  }

  const v = Number(result.coinsWon || 0);
  if (v >= 5000) return "sym_crown";
  if (v >= 2500) return "sym_trophy";
  if (v >= 1000) return "sym_diamond";
  if (v >= 500) return "sym_seven";
  if (v >= 250) return "sym_dice";
  if (v >= 100) return "sym_star";
  if (v >= 50) return "sym_bar";
  return "sym_coin";
}
