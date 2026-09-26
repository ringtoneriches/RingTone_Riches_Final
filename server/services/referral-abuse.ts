/**
 * Referral abuse checks.
 *
 * No database imports, so the rules that decide whether someone gets paid can
 * be tested directly.
 *
 * The aim is not to catch everyone — it is to make self-referral cost more
 * than it pays, while not punishing real customers. Two households on the same
 * mobile network share an IP; a father and son share a surname and an address.
 * So the hard blocks are limited to things that cannot innocently happen, and
 * everything softer flags for a human instead.
 */

export type Identity = {
  id: string;
  email?: string | null;
  phoneNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  /** IPs seen for this account. */
  ips?: string[];
  /** Fingerprints of cards used to top up, if the gateway gives them. */
  cardFingerprints?: string[];
};

export type Verdict = {
  /** block: refuse and pay nothing. flag: pay, but queue for review. */
  decision: "allow" | "flag" | "block";
  reason?: string;
  signals: string[];
};

/**
 * Reduce an address to the inbox it actually reaches.
 *
 * Unique emails stop nothing on their own: john+1@gmail.com, john+2@gmail.com
 * and j.o.h.n@gmail.com are one inbox and would otherwise look like three
 * customers. Dots are only ignored by Google, so that part is Gmail-only.
 */
export function normaliseEmail(email?: string | null): string {
  const raw = String(email ?? "").trim().toLowerCase();
  const at = raw.lastIndexOf("@");
  if (at <= 0) return raw;

  let local = raw.slice(0, at);
  const domain = raw.slice(at + 1);

  // Sub-addressing: everything from the first + is a label, not an address.
  const plus = local.indexOf("+");
  if (plus > 0) local = local.slice(0, plus);

  const GOOGLE = new Set(["gmail.com", "googlemail.com"]);
  if (GOOGLE.has(domain)) local = local.replace(/\./g, "");

  return `${local}@${GOOGLE.has(domain) ? "gmail.com" : domain}`;
}

/**
 * UK mobile numbers, reduced so the same phone always compares equal.
 * 07700 900123, +447700900123 and 00447700900123 are one number.
 */
export function normalisePhone(phone?: string | null): string {
  let digits = String(phone ?? "").replace(/[^0-9+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("44")) digits = digits.slice(2);
  digits = digits.replace(/^0+/, "");
  return digits;
}

function toTime(value?: Date | string | null): number | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function overlap(a: string[] = [], b: string[] = []) {
  const set = new Set(a.filter(Boolean));
  return b.filter((v) => v && set.has(v));
}

/**
 * Judge a referral.
 *
 * `strict` decides what happens to a shared IP: on its own it only ever flags,
 * because on UK mobile networks a shared IP is routine.
 */
export function assessReferral(
  referrer: Identity,
  referred: Identity,
  opts: { requirePhone?: boolean } = {},
): Verdict {
  const signals: string[] = [];

  // Certainties first — these cannot happen between two real customers.
  if (referrer.id === referred.id) {
    return { decision: "block", reason: "Referred themselves.", signals: ["self_id"] };
  }

  const refEmail = normaliseEmail(referrer.email);
  const newEmail = normaliseEmail(referred.email);
  if (refEmail && refEmail === newEmail) {
    return {
      decision: "block",
      reason: "Both accounts use the same email inbox.",
      signals: ["same_email"],
    };
  }

  const refPhone = normalisePhone(referrer.phoneNumber);
  const newPhone = normalisePhone(referred.phoneNumber);
  if (refPhone && refPhone === newPhone) {
    return {
      decision: "block",
      reason: "Both accounts use the same mobile number.",
      signals: ["same_phone"],
    };
  }

  const sharedCards = overlap(referrer.cardFingerprints, referred.cardFingerprints);
  if (sharedCards.length) {
    return {
      decision: "block",
      reason: "Both accounts topped up with the same card.",
      signals: ["same_card"],
    };
  }

  // Softer signals: real, but innocently explainable. Flag, never block.
  if (opts.requirePhone && !newPhone) {
    signals.push("no_phone");
  }

  const sharedIps = overlap(referrer.ips, referred.ips);
  if (sharedIps.length) signals.push("shared_ip");

  const sameName =
    Boolean(referrer.lastName) &&
    referrer.lastName?.trim().toLowerCase() === referred.lastName?.trim().toLowerCase() &&
    referrer.firstName?.trim().toLowerCase() === referred.firstName?.trim().toLowerCase();
  if (sameName) signals.push("same_name");

  // One soft signal is weak evidence; two together is worth a look.
  if (signals.includes("shared_ip") && (signals.includes("same_name") || signals.includes("no_phone"))) {
    return {
      decision: "flag",
      reason: "Same network as the referrer, plus another match.",
      signals,
    };
  }
  if (signals.includes("same_name")) {
    return { decision: "flag", reason: "Referrer and new member share a name.", signals };
  }

  return { decision: "allow", signals };
}

/**
 * Who wins the weekly prize.
 *
 * Highest number of qualifying referrals takes it. On a tie, the member who
 * reached that total first wins — so the prize rewards getting there quickly
 * rather than being split, and there is exactly one winner to announce.
 *
 * `reachedAt` is when that member's Nth qualifying referral landed, where N is
 * their total for the week. Comparing the moment each of them hit the same
 * number is the only fair reading of "first to reach that total": comparing
 * their last referral overall would punish someone who kept going.
 */
export function pickWeeklyWinners(
  counts: Array<{ userId: string; referrals: number; reachedAt?: Date | string | null }>,
  minReferrals: number,
): Array<{ userId: string; referrals: number }> {
  const floor = Math.max(1, minReferrals);
  const eligible = counts.filter((c) => c.referrals >= floor);
  if (!eligible.length) return [];

  const top = Math.max(...eligible.map((c) => c.referrals));
  const tied = eligible.filter((c) => c.referrals === top);
  if (tied.length === 1) return [{ userId: tied[0].userId, referrals: top }];

  // Earliest to reach the total wins. A missing timestamp sorts last rather
  // than winning by accident.
  const sorted = [...tied].sort((a, b) => {
    const at = toTime(a.reachedAt) ?? Number.POSITIVE_INFINITY;
    const bt = toTime(b.reachedAt) ?? Number.POSITIVE_INFINITY;
    if (at !== bt) return at - bt;
    return a.userId.localeCompare(b.userId);
  });
  return [{ userId: sorted[0].userId, referrals: top }];
}
