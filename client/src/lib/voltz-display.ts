export type VoltzRevealKind = "cash" | "points" | "physical" | "replay" | "nomatch" | "other";

export type VoltzRevealCopy = {
  kind: VoltzRevealKind;
  headline: string;
  sub?: string;
};

function formatCashAmount(value: number) {
  if (!Number.isFinite(value)) return "£0";
  if (Number.isInteger(value)) return `£${value.toLocaleString("en-GB")}`;
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPointsAmount(value: number) {
  const n = Math.floor(value);
  return Number.isFinite(n) ? n.toLocaleString("en-GB") : "0";
}

function parseNumber(raw: string) {
  const n = Number(String(raw).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

export function parseVoltzSwitchText(raw: string): VoltzRevealCopy {
  const text = String(raw || "").trim();
  if (!text) return { kind: "other", headline: "?" };

  const upper = text.toUpperCase();
  if (upper === "REPLAY" || upper === "TRY AGAIN") {
    return { kind: "replay", headline: "REPLAY" };
  }
  if (upper === "NO MATCH" || upper === "STATIC" || upper === "OVERLOAD") {
    return { kind: "nomatch", headline: text };
  }

  const pound = text.match(/£\s*([\d,]+(?:\.\d+)?)/);
  if (pound) {
    const n = parseNumber(pound[1]);
    return { kind: "cash", headline: n === null ? `£${pound[1]}` : formatCashAmount(n) };
  }

  if (/point|pts/i.test(text)) {
    const n = parseNumber(text.replace(/[^\d.,]/g, ""));
    return {
      kind: "points",
      headline: n === null ? text : formatPointsAmount(n),
      sub: "Ringtone Points",
    };
  }

  if (/^[\d,]+(?:\.\d+)?$/.test(text)) {
    const n = parseNumber(text);
    return { kind: "cash", headline: n === null ? text : formatCashAmount(n) };
  }

  return { kind: "physical", headline: text };
}

export function formatVoltzPrizeHeadline(rewardType?: string, rewardValue?: string) {
  const n = parseNumber(String(rewardValue || "0"));
  if (rewardType === "points") {
    return n === null ? String(rewardValue || "0") : formatPointsAmount(n);
  }
  if (rewardType === "cash") {
    return n === null ? `£${rewardValue}` : formatCashAmount(n);
  }
  return rewardValue || "";
}

export function formatVoltzSwitchCompact(raw: string) {
  const parsed = parseVoltzSwitchText(raw);
  if (parsed.kind === "points") return `${parsed.headline} pts`;
  return parsed.headline;
}
