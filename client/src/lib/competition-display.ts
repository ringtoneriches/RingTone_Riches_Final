import type { Competition } from "@shared/schema";
import { Gift, RotateCw, Sparkles, Target, Trophy, Zap } from "lucide-react";

export const HIDDEN_COMPETITION_IDS = [
  "d54eee36-2280-4372-84f6-93d07343a970",
  "25f0ee99-6f54-435d-9605-f4c287fe1338",
];

export type CompetitionTypeConfig = {
  Icon: typeof RotateCw;
  label: string;
  accent: string;
};

export function getCompetitionTypeConfig(type: string): CompetitionTypeConfig {
  switch (type) {
    case "spin":
      return { Icon: RotateCw, label: "RETRO SPIN", accent: "#E31B36" };
    case "scratch":
      return { Icon: Sparkles, label: "SCRATCH & WIN", accent: "#D4AF37" };
    case "pop":
      return { Icon: Gift, label: "BALLOON POP", accent: "#FF263D" };
    case "plinko":
      return { Icon: Target, label: "PLINKO DROP", accent: "#C8102E" };
    case "voltz":
      return { Icon: Zap, label: "RINGTONE VOLTZ", accent: "#E31B36" };
    case "slot":
      return { Icon: Trophy, label: "ROYAL REELS", accent: "#D4AF37" };
    case "royal":
      return { Icon: Trophy, label: "ROYAL REELS", accent: "#E3C15A" };
    default:
      return { Icon: Trophy, label: "PRIZE DRAW", accent: "#D4AF37" };
  }
}

export function getDefaultBadgeLabel(type: string) {
  return getCompetitionTypeConfig(type).label;
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

export function getPrizeOffer(competition: Competition) {
  const prize = getPrizeDisplay(competition);
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

export function getCtaLabel(type: string, isClosed: boolean) {
  if (isClosed) return "SOLD OUT";
  if (["spin", "scratch", "pop", "plinko", "voltz", "slot", "royal"].includes(type)) {
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

/** Live competitions with real prize/artwork/ticket data, in admin display order. */
export function pickFeaturedCompetitions(competitions: Competition[], limit = 4) {
  return competitions.filter(isFeaturedCandidate).slice(0, limit);
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
