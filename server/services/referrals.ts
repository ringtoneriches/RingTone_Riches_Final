/**
 * The referral programme.
 *
 * A member shares their code, someone registers with it and gets points, and
 * the referrer is paid only once that member actually tops up. The rules that
 * decide whether a referral is genuine live in ./referral-abuse, which has no
 * database imports so they can be tested directly.
 *
 * Nothing here is allowed to break a top-up or a registration. A referral is a
 * bonus on top of those; if it fails, it is logged and the real transaction
 * carries on.
 */
import { and, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { db } from "../db";
import {
  platformSettings,
  referrals,
  referralWeeklyWinners,
  transactions,
  userIpLogs,
  users,
} from "@shared/schema";
import {
  type Identity,
  assessReferral,
  pickWeeklyWinners,
  weekStartFor,
} from "./referral-abuse";

type DbTx = typeof db | any;

export type ReferralSettings = {
  enabled: boolean;
  signupPoints: number;
  rewardPoints: number;
  minTopUp: number;
  weeklyPrizePoints: number;
  weeklyMinReferrals: number;
};

const DEFAULTS: ReferralSettings = {
  enabled: true,
  signupPoints: 100,
  rewardPoints: 300,
  minTopUp: 10,
  weeklyPrizePoints: 1500,
  weeklyMinReferrals: 1,
};

export async function getReferralSettings(tx: DbTx = db): Promise<ReferralSettings> {
  try {
    const [row] = await tx.select().from(platformSettings).limit(1);
    if (!row) return DEFAULTS;
    return {
      enabled: row.referralsEnabled ?? DEFAULTS.enabled,
      signupPoints: row.referralSignupPoints ?? DEFAULTS.signupPoints,
      rewardPoints: row.referralRewardPoints ?? DEFAULTS.rewardPoints,
      minTopUp: Number(row.referralMinTopUp ?? DEFAULTS.minTopUp),
      weeklyPrizePoints: row.referralWeeklyPrizePoints ?? DEFAULTS.weeklyPrizePoints,
      weeklyMinReferrals: row.referralWeeklyMinReferrals ?? DEFAULTS.weeklyMinReferrals,
    };
  } catch (error) {
    // A missing settings row must not stop referrals working.
    console.error("[referrals] settings lookup failed, using defaults:", error);
    return DEFAULTS;
  }
}

/**
 * Record a referral at registration.
 *
 * The unique index on referred_user_id means a second call for the same member
 * does nothing, so this is safe to retry.
 */
export async function recordReferralOnSignup(
  tx: DbTx,
  opts: {
    referrerId: string;
    referredUserId: string;
    referralCode?: string | null;
    signupPoints: number;
  },
) {
  if (opts.referrerId === opts.referredUserId) return null;
  const [row] = await tx
    .insert(referrals)
    .values({
      referrerId: opts.referrerId,
      referredUserId: opts.referredUserId,
      referralCode: opts.referralCode ?? null,
      signupPointsAwarded: opts.signupPoints,
      status: "pending",
    })
    .onConflictDoNothing()
    .returning();
  return row ?? null;
}

/** Everything the abuse rules need about one account. */
async function identityFor(tx: DbTx, userId: string): Promise<Identity> {
  const [user] = await tx
    .select({
      id: users.id,
      email: users.email,
      phoneNumber: users.phoneNumber,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const ipRows = await tx
    .select({ ip: userIpLogs.ipAddress })
    .from(userIpLogs)
    .where(eq(userIpLogs.userId, userId))
    .limit(50);

  return {
    id: userId,
    email: user?.email,
    phoneNumber: user?.phoneNumber,
    firstName: user?.firstName,
    lastName: user?.lastName,
    ips: ipRows.map((r: any) => r.ip).filter(Boolean),
    // Card fingerprints are not captured yet — see the note in the PR. When
    // they are, this is the strongest signal available and slots in here.
    cardFingerprints: [],
  };
}

/**
 * Pay the referrer, if this top-up is the one that qualifies.
 *
 * Call inside the same transaction as the top-up. Returns a short description
 * of what happened, for the logs; it never throws.
 */
export async function qualifyReferralOnTopUp(
  tx: DbTx,
  opts: { userId: string; amount: number; paymentRef?: string | null },
): Promise<{ outcome: string; points?: number }> {
  try {
    const settings = await getReferralSettings(tx);
    if (!settings.enabled) return { outcome: "referrals_disabled" };

    // Only a referral still waiting on a top-up is of interest. The status
    // check is what makes this idempotent: once rewarded, blocked or flagged,
    // a later top-up finds nothing to do.
    const [referral] = await tx
      .select()
      .from(referrals)
      .where(and(eq(referrals.referredUserId, opts.userId), eq(referrals.status, "pending")))
      .limit(1);
    if (!referral) return { outcome: "no_pending_referral" };

    if (settings.minTopUp > 0 && opts.amount < settings.minTopUp) {
      return { outcome: `below_minimum_${settings.minTopUp}` };
    }

    const [referrer, referred] = await Promise.all([
      identityFor(tx, referral.referrerId),
      identityFor(tx, opts.userId),
    ]);
    const verdict = assessReferral(referrer, referred, { requirePhone: true });

    const topUp = {
      firstTopUpAt: new Date(),
      firstTopUpAmount: opts.amount.toFixed(2),
      firstTopUpRef: opts.paymentRef ?? null,
      riskSignals: verdict.signals,
      updatedAt: new Date(),
    };

    if (verdict.decision === "block") {
      await tx
        .update(referrals)
        .set({ ...topUp, status: "blocked", riskReason: verdict.reason ?? "Blocked" })
        .where(eq(referrals.id, referral.id));
      return { outcome: `blocked:${verdict.signals.join(",")}` };
    }

    // Flagged referrals are still paid — a false positive that silently
    // withholds someone's reward is worse than one an admin reverses — but
    // they land in the review queue.
    const points = settings.rewardPoints;
    await tx
      .update(users)
      .set({ ringtonePoints: sql`${users.ringtonePoints} + ${points}` })
      .where(eq(users.id, referral.referrerId));

    const [txRow] = await tx
      .insert(transactions)
      .values({
        userId: referral.referrerId,
        type: "referral",
        amount: String(points),
        description: `Referral reward: +${points} Ringtone Points`,
      })
      .returning();

    await tx
      .update(referrals)
      .set({
        ...topUp,
        status: verdict.decision === "flag" ? "flagged" : "rewarded",
        riskReason: verdict.reason ?? null,
        rewardPoints: points,
        rewardedAt: new Date(),
        rewardTransactionId: txRow?.id ?? null,
      })
      .where(eq(referrals.id, referral.id));

    return { outcome: verdict.decision === "flag" ? "rewarded_flagged" : "rewarded", points };
  } catch (error) {
    // A referral must never cost someone their top-up.
    console.error("[referrals] qualify failed:", error);
    return { outcome: "error" };
  }
}

/** What a member sees on their own referral page. */
export async function getReferrerSummary(userId: string) {
  const rows = await db
    .select({
      id: referrals.id,
      status: referrals.status,
      registeredAt: referrals.registeredAt,
      firstTopUpAt: referrals.firstTopUpAt,
      rewardPoints: referrals.rewardPoints,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(referrals)
    .leftJoin(users, eq(users.id, referrals.referredUserId))
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.registeredAt));

  // Blocked referrals are not shown: telling someone their referral was
  // refused invites an argument and teaches whoever is gaming it what tripped.
  const visible = rows.filter((r: any) => r.status !== "blocked");
  const rewarded = visible.filter((r: any) => r.status === "rewarded" || r.status === "flagged");

  return {
    invites: visible.map((r: any) => ({
      id: r.id,
      // First name and last initial, same as everywhere else public-facing.
      name: [r.firstName, r.lastName ? `${String(r.lastName).charAt(0).toUpperCase()}.` : ""]
        .filter(Boolean)
        .join(" ") || "A member",
      joinedAt: r.registeredAt,
      toppedUp: Boolean(r.firstTopUpAt),
      rewardPoints: r.rewardPoints ?? 0,
      status: r.status === "flagged" ? "rewarded" : r.status,
    })),
    signedUp: visible.length,
    completed: rewarded.length,
    pointsEarned: rewarded.reduce((sum: number, r: any) => sum + (r.rewardPoints ?? 0), 0),
  };
}

/** Counts for the leaderboard: rewarded referrals inside one UK week. */
export async function weeklyCounts(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00Z`);
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + 7);

  const rows = await db
    .select({
      userId: referrals.referrerId,
      referrals: sql<number>`count(*)::int`,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(referrals)
    .leftJoin(users, eq(users.id, referrals.referrerId))
    .where(
      and(
        sql`${referrals.status} in ('rewarded','flagged')`,
        gte(referrals.rewardedAt, start),
        lt(referrals.rewardedAt, end),
      ),
    )
    .groupBy(referrals.referrerId, users.firstName, users.lastName)
    .orderBy(desc(sql`count(*)`));

  return rows.map((r: any) => ({
    userId: r.userId,
    referrals: Number(r.referrals),
    name:
      [r.firstName, r.lastName ? `${String(r.lastName).charAt(0).toUpperCase()}.` : ""]
        .filter(Boolean)
        .join(" ") || "A member",
  }));
}

/**
 * Award last week's top recruiter prize.
 *
 * Safe to run repeatedly: the unique index on (week_start, user_id) means a
 * second run pays nobody twice.
 */
export async function awardWeeklyPrize(forWeekStart?: string) {
  const settings = await getReferralSettings();
  if (!settings.enabled || settings.weeklyPrizePoints <= 0) return { awarded: 0 };

  const lastWeek = new Date();
  lastWeek.setUTCDate(lastWeek.getUTCDate() - 7);
  const weekStart = forWeekStart ?? weekStartFor(lastWeek);

  const counts = await weeklyCounts(weekStart);
  const winners = pickWeeklyWinners(counts, settings.weeklyMinReferrals);
  if (!winners.length) return { awarded: 0, weekStart };

  let awarded = 0;
  for (const winner of winners) {
    try {
      await db.transaction(async (tx) => {
        const [claim] = await tx
          .insert(referralWeeklyWinners)
          .values({
            weekStart,
            userId: winner.userId,
            referralCount: winner.referrals,
            prizePoints: settings.weeklyPrizePoints,
          })
          .onConflictDoNothing()
          .returning();
        if (!claim) return; // Already paid for this week.

        await tx
          .update(users)
          .set({ ringtonePoints: sql`${users.ringtonePoints} + ${settings.weeklyPrizePoints}` })
          .where(eq(users.id, winner.userId));

        const [txRow] = await tx
          .insert(transactions)
          .values({
            userId: winner.userId,
            type: "referral",
            amount: String(settings.weeklyPrizePoints),
            description: `Top Recruiter, week of ${weekStart}: +${settings.weeklyPrizePoints} Ringtone Points`,
              })
          .returning();

        await tx
          .update(referralWeeklyWinners)
          .set({ transactionId: txRow?.id ?? null })
          .where(eq(referralWeeklyWinners.id, claim.id));
        awarded += 1;
      });
    } catch (error) {
      console.error("[referrals] weekly prize failed for", winner.userId, error);
    }
  }
  return { awarded, weekStart, winners };
}

/** Admin list, with the whole lifecycle in one row. */
export async function listReferralsForAdmin(opts: { status?: string; limit?: number } = {}) {
  const referrer = { ...users };
  const rows = await db.execute(sql`
    SELECT r.id, r.status, r.referral_code, r.registered_at, r.signup_points_awarded,
           r.first_top_up_at, r.first_top_up_amount, r.reward_points, r.rewarded_at,
           r.risk_reason, r.risk_signals,
           ref.id  AS referrer_id,  ref.email AS referrer_email,
           ref.first_name AS referrer_first, ref.last_name AS referrer_last,
           ref.referral_code AS referrer_code,
           new.id  AS referred_id,  new.email AS referred_email,
           new.first_name AS referred_first, new.last_name AS referred_last
      FROM referrals r
      LEFT JOIN users ref ON ref.id = r.referrer_id
      LEFT JOIN users new ON new.id = r.referred_user_id
     WHERE ${opts.status ? sql`r.status = ${opts.status}` : sql`true`}
     ORDER BY r.registered_at DESC
     LIMIT ${Math.min(Number(opts.limit) || 200, 1000)}`);
  return result(rows);
}

function result(rows: any) {
  return rows?.rows ?? rows ?? [];
}

/** Headline numbers for the admin page. */
export async function referralTotals() {
  const rows = await db.execute(sql`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE status = 'pending')::int  AS pending,
      count(*) FILTER (WHERE status IN ('rewarded','flagged'))::int AS successful,
      count(*) FILTER (WHERE status = 'flagged')::int  AS flagged,
      count(*) FILTER (WHERE status = 'blocked')::int  AS blocked,
      COALESCE(SUM(reward_points), 0)::int             AS reward_points,
      COALESCE(SUM(signup_points_awarded), 0)::int     AS signup_points
    FROM referrals`);
  return result(rows)[0] ?? {};
}

/** An admin resolving something from the flagged queue. */
export async function reviewReferral(
  referralId: string,
  decision: "approve" | "block",
  adminId: string,
) {
  const [updated] = await db
    .update(referrals)
    .set({
      status: decision === "approve" ? "rewarded" : "blocked",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(referrals.id, referralId))
    .returning();
  return updated;
}
