import { createElement, type ComponentType } from "react";
import type { Competition } from "@shared/schema";
import { RotateCw, Sparkles, Target, Trophy, Zap } from "lucide-react";

type BadgeIcon = ComponentType<{ className?: string }>;

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function BalloonIcon({ className }: { className?: string }) {
  return createElement(
    "svg",
    { ...svgProps, className },
    createElement("path", {
      d: "M12 2.8c3.4 0 6.1 3.2 6.1 7.1 0 3.6-2.4 6.6-5.4 7.1l-.7 2.2h-1.8l-.7-2.2c-3-.5-5.4-3.5-5.4-7.1 0-3.9 2.7-7.1 6.1-7.1Z",
    }),
    createElement("path", { d: "M11.1 21.2c.6-1.1 1.8-1.1 2.4 0" }),
  );
}

function SlotMachineIcon({ className }: { className?: string }) {
  return createElement(
    "svg",
    { ...svgProps, className },
    createElement("rect", { x: 3.5, y: 3, width: 14, height: 18, rx: 2 }),
    createElement("rect", { x: 5.6, y: 6, width: 3, height: 5.4, rx: 0.4 }),
    createElement("rect", { x: 9, y: 6, width: 3, height: 5.4, rx: 0.4 }),
    createElement("rect", { x: 12.4, y: 6, width: 3, height: 5.4, rx: 0.4 }),
    createElement("path", { d: "M17.5 8.2h1.8A1.6 1.6 0 0 1 21 9.8v1.4" }),
    createElement("circle", { cx: 20.8, cy: 13.4, r: 1.4 }),
    createElement("path", { d: "M6.4 14.8h8.2" }),
    createElement("path", { d: "M7.4 18h6.2" }),
  );
}

export const HIDDEN_COMPETITION_IDS = [
  "d54eee36-2280-4372-84f6-93d07343a970",
  "25f0ee99-6f54-435d-9605-f4c287fe1338",
];

export type CompetitionTypeConfig = {
  Icon: BadgeIcon;
  label: string;
  accent: string;
};

export function getCompetitionTypeConfig(type: string): CompetitionTypeConfig {
  switch (type) {
    case "spin":
      return { Icon: RotateCw, label: "RETRO SPIN", accent: "#E31B36" };
    case "scratch":
      return { Icon: Sparkles, label: "SCRATCH NATIONS", accent: "#D4AF37" };
    case "pop":
      return { Icon: BalloonIcon, label: "BALLOON POP", accent: "#FF263D" };
    case "plinko":
      return { Icon: Target, label: "PLINKO DROP", accent: "#C8102E" };
    case "voltz":
      return { Icon: Zap, label: "RINGTONE VOLTZ", accent: "#E31B36" };
    case "slot":
      return { Icon: SlotMachineIcon, label: "ROYAL REELS", accent: "#D4AF37" };
    case "royal":
      return { Icon: SlotMachineIcon, label: "ROYAL REELS", accent: "#E3C15A" };
    default:
      return { Icon: Trophy, label: "PRIZE DRAW", accent: "#D4AF37" };
  }
}

export function getDefaultBadgeLabel(type: string) {
  return getCompetitionTypeConfig(type).label;
}

export function getDefaultQuantity(
  competition: { defaultQuantity?: number | null },
  maxQty = 500
) {
  const raw = Number(competition.defaultQuantity);
  const n = Number.isFinite(raw) ? Math.floor(raw) : 1;
  const cap = Math.max(1, maxQty);
  return Math.min(cap, Math.max(1, n || 1));
}

export function getCompetitionBadgeLabel(competition: {
  type: string;
  badgeLabel?: string | null;
}) {
  const custom = String(competition.badgeLabel || "").trim();
  return custom || getDefaultBadgeLabel(competition.type);
}

export function serializeBadgeLabel(value?: string | null, type?: string) {
  const trimmed = String(value || "").trim();
  if (trimmed) return trimmed.slice(0, 40);
  return type ? getDefaultBadgeLabel(type) : null;
}

export function getTicketStats(competition: Competition) {
  const maxT = competition.maxTickets ?? 0;
  const soldT = competition.soldTickets ?? 0;
  const pct = maxT > 0 ? Math.min(100, (soldT / maxT) * 100) : 0;
  const remaining = maxT - soldT;
  const isSoldOut = remaining <= 0 && maxT > 0;
  const endDate = competition.endDate ? new Date(competition.endDate) : null;
  const isExpired = endDate ? endDate.getTime() < Date.now() : false;
  const isClosed = isSoldOut || isExpired;

  return {
    maxT,
    soldT,
    pct,
    remaining,
    hasTickets: maxT > 0,
    isSoldOut,
    isExpired,
    isClosed,
    endDate,
    isFree: competition.ticketPrice === "0.00",
    isAlmostGone: pct > 85 && !isClosed,
    isHot: pct > 60 && !isClosed,
  };
}

export function parsePrizeAmount(value?: string | number | null): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function serializePrizeAmount(value?: string | null): string | null {
  const n = parsePrizeAmount(value);
  return n == null ? null : n.toFixed(2);
}

export function formatPrizeAmountInput(value?: string | number | null): string {
  const n = parsePrizeAmount(value);
  return n == null ? "" : String(n);
}

export function getPrizeDisplay(competition: Competition) {
  const fromField = parsePrizeAmount(competition.prizeAmount);
  const fromTitle = (() => {
    const m = competition.title.match(/£([\d,]+(?:\.\d+)?)/);
    return m ? parseFloat(m[1].replace(/,/g, "")) : null;
  })();
  const prizeNum = fromField ?? (Number.isFinite(fromTitle) ? fromTitle : null);

  const isMysteryPrize = competition.title.toLowerCase().includes("mystery");

  let prizeDisplay: string | null = null;
  if (isMysteryPrize) {
    prizeDisplay = "MYSTERY PRIZE";
  } else if (prizeNum) {
    prizeDisplay = prizeNum >= 1000 ? `£${prizeNum.toLocaleString("en-GB")}` : `£${prizeNum.toFixed(0)}`;
  }

  return { prizeNum, isMysteryPrize, prizeDisplay };
}

export function getDrawCardTitle(title: string) {
  let text = String(title || "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{20E3}]/gu, " ")
    .replace(/^WIN\s+/i, "")
    .replace(/\s+(?:FOR\s+)?JUST\s+[£$€]?\s*[\d,.]+.*$/i, "")
    .replace(/\s*[–—-]\s*JUST\s+.+$/i, "")
    .replace(/!+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) text = String(title || "").replace(/\s+/g, " ").trim();

  if (text.length > 3 && text === text.toUpperCase()) {
    text = text
      .toLowerCase()
      .replace(/(^|[^\p{L}])([\p{L}])/gu, (_, prefix: string, letter: string) => prefix + letter.toUpperCase());
  }

  return text;
}

export function getPrizeOffer(competition: Competition) {
  const prize = getPrizeDisplay(competition);
  if (!isInstantWinGame(competition.type)) {
    return { kicker: null, amount: null, prize };
  }
  if (prize.isMysteryPrize) {
    return { kicker: "Instantly win a", amount: "MYSTERY PRIZE", prize };
  }
  if (prize.prizeDisplay) {
    return { kicker: "Instantly win up to", amount: prize.prizeDisplay, prize };
  }
  return { kicker: null, amount: null, prize };
}

export function getStatusBadge(opts: {
  isExpired: boolean;
  isSoldOut: boolean;
  isAlmostGone: boolean;
  isHot: boolean;
}) {
  if (opts.isExpired) return "EXPIRED";
  if (opts.isSoldOut) return "SOLD OUT";
  if (opts.isAlmostGone) return "SELLING FAST";
  if (opts.isHot) return "HOT";
  return "LIVE";
}

export const INSTANT_WIN_GAME_TYPES = [
  "spin",
  "scratch",
  "pop",
  "plinko",
  "voltz",
  "slot",
  "royal",
] as const;

export function isInstantWinGame(type?: string | null) {
  return !!type && (INSTANT_WIN_GAME_TYPES as readonly string[]).includes(type);
}

export function getCtaLabel(type: string, isClosed: boolean) {
  if (isClosed) return "SOLD OUT";
  if (isInstantWinGame(type)) {
    return "ENTER NOW";
  }
  return "ENTER NOW";
}

export function isTestCompetition(competition: Competition) {
  return /\btest\b/i.test(competition.title);
}

export function isFeaturedCandidate(competition: Competition) {
  if (HIDDEN_COMPETITION_IDS.includes(competition.id)) return false;
  if (isTestCompetition(competition)) return false;
  const stats = getTicketStats(competition);
  if (stats.isClosed) return false;
  if (!competition.imageUrl) return false;
  if (!getPrizeDisplay(competition).prizeDisplay) return false;
  if (!stats.hasTickets) return false;
  return true;
}

function featuredRank(competition: Competition) {
  const n = Number(competition.featuredOrder);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Live competitions chosen for the homepage slider, in admin featured order. */
export function pickFeaturedCompetitions(competitions: Competition[], limit = 4) {
  const eligible = competitions.filter(isFeaturedCandidate);
  const pinned = eligible
    .filter((c) => featuredRank(c) != null)
    .sort((a, b) => (featuredRank(a) as number) - (featuredRank(b) as number));
  if (pinned.length >= limit) return pinned.slice(0, limit);

  const used = new Set(pinned.map((c) => c.id));
  const fill = eligible
    .filter((c) => !used.has(c.id))
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  return [...pinned, ...fill].slice(0, limit);
}

export function pickFeaturedCompetition(competitions: Competition[]) {
  return (
    pickFeaturedCompetitions(competitions, 1)[0] ||
    competitions.find((c) => !HIDDEN_COMPETITION_IDS.includes(c.id) && !isTestCompetition(c)) ||
    null
  );
}

export function getFallbackImage(type: string) {
  if (type === "pop") return "/pop.jpeg";
  if (type === "voltz") return "/voltz.jpeg";
  if (type === "scratch") return "/scratch.jpeg";
  return "/pop.jpeg";
}
