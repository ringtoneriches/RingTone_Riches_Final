/**
 * Free Daily Spin.
 *
 * One free spin per registered member per UK day, paying Ringtone Points out of
 * a fixed pool. The result is decided here, server-side, before the wheel
 * animates; the client is told which segment to land on.
 *
 * Lives outside routes.ts (which is ~22k lines) following the pattern of
 * instantWinRoutes.ts and cart-card-payment.ts.
 */
import type { Express } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { isAuthenticated } from "./customAuth";
import { db } from "./db";
import {
  dailySpinCycles,
  dailySpinPrizes,
  dailySpinResults,
  platformSettings,
  transactions,
  users,
} from "@shared/schema";
import {
  buildCyclePrizes,
  pickPrize,
  summarisePool,
  type SpinPrize,
} from "./services/daily-spin-pool";
import { ukDateString, ukNextDayStart } from "./services/uk-day";
import {
  accountCanSpin,
  ineligible,
  ipWithinDailyLimit,
  type Eligibility,
} from "./services/daily-spin-eligibility";

// Defined locally rather than imported from routes.ts, which would be a
// circular import. Same approach as instantWinRoutes.ts.
const isAdmin = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

/** Postgres unique-violation: the member already span today. */
const UNIQUE_VIOLATION = "23505";

/** Same precedence Cloudflare-fronted requests use elsewhere in the app. */
function clientIp(req: any): string {
  return (
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
}

async function getSettings() {
  const [settings] = await db
    .select({
      enabled: platformSettings.dailySpinEnabled,
      ipLimit: platformSettings.dailySpinIpLimit,
    })
    .from(platformSettings)
    .limit(1);
  return { enabled: Boolean(settings?.enabled), ipLimit: settings?.ipLimit ?? 0 };
}

/** Spins already taken from this address today, for the per-IP cap. */
async function spinsFromIpToday(ip: string, spinDate: string) {
  if (!ip || ip === "unknown") return 0;
  const [row] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(dailySpinResults)
    .where(and(eq(dailySpinResults.ipAddress, ip), eq(dailySpinResults.spinDate, spinDate)));
  return row?.n ?? 0;
}

async function getActiveCycle() {
  const [cycle] = await db
    .select()
    .from(dailySpinCycles)
    .where(eq(dailySpinCycles.status, "active"))
    .orderBy(desc(dailySpinCycles.activatedAt))
    .limit(1);
  return cycle ?? null;
}

async function getCyclePrizes(cycleId: string): Promise<SpinPrize[]> {
  const rows = await db
    .select()
    .from(dailySpinPrizes)
    .where(eq(dailySpinPrizes.cycleId, cycleId))
    .orderBy(dailySpinPrizes.segmentIndex);
  return rows.map((r) => ({
    id: r.id,
    pointsValue: r.pointsValue,
    quantity: r.quantity,
    remaining: r.remaining,
    segmentIndex: r.segmentIndex,
  }));
}

export function registerDailySpinRoutes(app: Express) {
  // -------------------------------------------------------------------------
  // Customer
  // -------------------------------------------------------------------------

  /**
   * Wheel state for the signed-in member.
   *
   * Deliberately exposes the prize VALUES but never the quantities or how many
   * of each remain — the owner wants the pool size kept private.
   */
  app.get("/api/daily-spin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const spinDate = ukDateString();
      const nextSpinAt = ukNextDayStart().toISOString();

      // Read the account fresh: the session may predate a verification.
      const [account] = await db
        .select({
          emailVerified: users.emailVerified,
          isGuestAccount: users.isGuestAccount,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const allowed = accountCanSpin(account);
      const { enabled } = await getSettings();
      const cycle = enabled ? await getActiveCycle() : null;

      let state: Eligibility = allowed;
      if (state.eligible && !enabled) state = ineligible("disabled");
      if (state.eligible && !cycle) state = ineligible("no_pool");

      if (!state.eligible) {
        return res.json({
          enabled: false,
          eligible: false,
          reason: state.reason,
          message: state.message,
          segments: [],
          hasSpunToday: false,
          nextSpinAt,
        });
      }

      const prizes = await getCyclePrizes(cycle!.id);
      const [todays] = await db
        .select()
        .from(dailySpinResults)
        .where(and(eq(dailySpinResults.userId, userId), eq(dailySpinResults.spinDate, spinDate)))
        .limit(1);

      res.json({
        enabled: true,
        eligible: true,
        segments: prizes.map((p) => ({
          segmentIndex: p.segmentIndex,
          pointsValue: p.pointsValue,
        })),
        hasSpunToday: Boolean(todays),
        lastResult: todays
          ? { pointsValue: todays.pointsAwarded, segmentIndex: todays.segmentIndex }
          : null,
        nextSpinAt,
      });
    } catch (error) {
      console.error("[daily-spin] state failed:", error);
      res.status(500).json({ message: "Could not load the daily spin" });
    }
  });

  /**
   * Take today's spin.
   *
   * Idempotent: if the member has already span today it returns THAT result
   * rather than an error, so refreshing mid-animation lands on the right
   * segment instead of breaking. The unique index on (user_id, spin_date) is
   * what actually enforces one-per-day — see migration 0016.
   */
  app.post("/api/daily-spin", isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    const spinDate = ukDateString();
    const nextSpinAt = ukNextDayStart().toISOString();

    try {
      // Registered, verified members only. Checked against the database rather
      // than the session, which may predate a verification or a change.
      const [account] = await db
        .select({
          emailVerified: users.emailVerified,
          isGuestAccount: users.isGuestAccount,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const allowed = accountCanSpin(account);
      if (!allowed.eligible) {
        return res.status(403).json({ reason: allowed.reason, message: allowed.message });
      }

      const { enabled, ipLimit } = await getSettings();
      if (!enabled) {
        const off = ineligible("disabled");
        return res.status(403).json({ reason: off.reason, message: off.message });
      }

      const cycle = await getActiveCycle();
      if (!cycle) {
        const none = ineligible("no_pool");
        return res.status(503).json({ reason: none.reason, message: none.message });
      }

      // Already span today — hand back the same result.
      const [existing] = await db
        .select()
        .from(dailySpinResults)
        .where(and(eq(dailySpinResults.userId, userId), eq(dailySpinResults.spinDate, spinDate)))
        .limit(1);

      if (existing) {
        return res.json({
          alreadySpun: true,
          pointsValue: existing.pointsAwarded,
          segmentIndex: existing.segmentIndex,
          nextSpinAt,
        });
      }

      // Blunts farming across many accounts on one connection. Deliberately
      // generous, and skipped entirely when the limit is 0.
      const ip = clientIp(req);
      if (!ipWithinDailyLimit(await spinsFromIpToday(ip, spinDate), ipLimit)) {
        const capped = ineligible("ip_limit");
        console.warn("[daily-spin] ip limit reached", { ip, spinDate, ipLimit });
        return res.status(429).json({ reason: capped.reason, message: capped.message });
      }

      const outcome = await db.transaction(async (tx) => {
        const prizes = await getCyclePrizes(cycle.id);

        // Claim a prize. A conditional decrement means two members spinning at
        // the same instant cannot both take the last one; if we lose the race
        // the update touches no rows and we pick again from what is left.
        let claimed: SpinPrize | null = null;
        const stock = prizes.map((p) => ({ ...p }));

        for (let attempt = 0; attempt < stock.length; attempt++) {
          const candidate = pickPrize(stock);
          if (!candidate) break;

          const updated = await tx
            .update(dailySpinPrizes)
            .set({ remaining: sql`${dailySpinPrizes.remaining} - 1`, updatedAt: new Date() })
            .where(
              and(eq(dailySpinPrizes.id, candidate.id), sql`${dailySpinPrizes.remaining} > 0`),
            )
            .returning({ id: dailySpinPrizes.id });

          if (updated.length > 0) {
            claimed = candidate;
            break;
          }
          // Someone else took it: drop this tier and try again.
          const idx = stock.findIndex((p) => p.id === candidate.id);
          if (idx >= 0) stock[idx].remaining = 0;
        }

        if (!claimed) return { exhausted: true as const };

        // Claims the day. Throws 23505 if another request got in first.
        await tx.insert(dailySpinResults).values({
          cycleId: cycle.id,
          prizeId: claimed.id,
          userId,
          pointsAwarded: claimed.pointsValue,
          segmentIndex: claimed.segmentIndex,
          spinDate,
          ipAddress: ip,
        });

        await tx
          .update(users)
          .set({ ringtonePoints: sql`COALESCE(${users.ringtonePoints}, 0) + ${claimed.pointsValue}` })
          .where(eq(users.id, userId));

        // Recorded as ringtone_points so the wallet renders "50 pts", not "£50".
        await tx.insert(transactions).values({
          userId,
          type: "ringtone_points",
          amount: String(claimed.pointsValue),
          description: `Daily Spin — ${claimed.pointsValue} points`,
          createdAt: new Date(),
        });

        // Last prize gone: close the cycle so admins know to start the next.
        const left = await tx
          .select({ total: sql<number>`COALESCE(SUM(${dailySpinPrizes.remaining}), 0)::int` })
          .from(dailySpinPrizes)
          .where(eq(dailySpinPrizes.cycleId, cycle.id));

        if ((left[0]?.total ?? 0) <= 0) {
          await tx
            .update(dailySpinCycles)
            .set({ status: "exhausted", exhaustedAt: new Date(), updatedAt: new Date() })
            .where(eq(dailySpinCycles.id, cycle.id));
        }

        return { exhausted: false as const, prize: claimed };
      });

      if (outcome.exhausted) {
        return res.status(503).json({ message: "Today's prizes have all gone — check back soon" });
      }

      res.json({
        alreadySpun: false,
        pointsValue: outcome.prize.pointsValue,
        segmentIndex: outcome.prize.segmentIndex,
        nextSpinAt,
      });
    } catch (error: any) {
      // Lost the race against the member's own second request. Not an error as
      // far as they are concerned: return the spin that did land.
      if (error?.code === UNIQUE_VIOLATION) {
        const [row] = await db
          .select()
          .from(dailySpinResults)
          .where(and(eq(dailySpinResults.userId, userId), eq(dailySpinResults.spinDate, spinDate)))
          .limit(1);
        if (row) {
          return res.json({
            alreadySpun: true,
            pointsValue: row.pointsAwarded,
            segmentIndex: row.segmentIndex,
            nextSpinAt,
          });
        }
      }
      console.error("[daily-spin] spin failed:", error);
      res.status(500).json({ message: "Could not complete your spin" });
    }
  });

  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------

  /** Current cycle, its figures, and the global toggle. */
  app.get("/api/admin/daily-spin", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const { enabled, ipLimit } = await getSettings();
      const [cycle] = await db
        .select()
        .from(dailySpinCycles)
        .where(sql`${dailySpinCycles.status} <> 'exhausted'`)
        .orderBy(desc(dailySpinCycles.createdAt))
        .limit(1);

      if (!cycle) return res.json({ enabled, ipLimit, cycle: null, prizes: [], summary: null });

      const prizes = await getCyclePrizes(cycle.id);
      res.json({ enabled, ipLimit, cycle, prizes, summary: summarisePool(prizes) });
    } catch (error) {
      console.error("[daily-spin] admin state failed:", error);
      res.status(500).json({ message: "Could not load the daily spin settings" });
    }
  });

  /**
   * Wheel on/off and the per-IP daily cap. Either may be sent on its own.
   *
   * The cap exists to blunt farming across many accounts on one connection.
   * Keep it generous: UK mobile networks put many unrelated customers behind a
   * single address, so a tight cap refuses genuine members. 0 disables it.
   */
  app.post("/api/admin/daily-spin/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const patch: Record<string, unknown> = { updatedAt: new Date() };

      if (req.body?.enabled !== undefined) {
        patch.dailySpinEnabled = Boolean(req.body.enabled);
      }

      if (req.body?.ipLimit !== undefined) {
        const limit = Number(req.body.ipLimit);
        if (!Number.isInteger(limit) || limit < 0 || limit > 1000) {
          return res.status(400).json({ message: "The IP limit must be a whole number between 0 and 1000" });
        }
        patch.dailySpinIpLimit = limit;
      }

      await db
        .insert(platformSettings)
        .values({
          id: "active",
          dailySpinEnabled: Boolean(patch.dailySpinEnabled ?? false),
          dailySpinIpLimit: (patch.dailySpinIpLimit as number) ?? 12,
        })
        .onConflictDoUpdate({ target: platformSettings.id, set: patch });

      const settings = await getSettings();
      res.json({ success: true, ...settings });
    } catch (error) {
      console.error("[daily-spin] settings update failed:", error);
      res.status(500).json({ message: "Could not update the daily spin" });
    }
  });

  /** Create the next pool. Starts as a draft so quantities can be checked first. */
  app.post("/api/admin/daily-spin/cycles", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { name, tiers, notes } = req.body || {};
      const rows = buildCyclePrizes(Array.isArray(tiers) && tiers.length ? tiers : undefined);

      if (rows.some((r) => !Number.isFinite(r.pointsValue) || r.pointsValue <= 0 || r.quantity < 0)) {
        return res.status(400).json({ message: "Prize values must be positive and quantities cannot be negative" });
      }

      const created = await db.transaction(async (tx) => {
        const [cycle] = await tx
          .insert(dailySpinCycles)
          .values({
            name: name || `Cycle ${new Date().toISOString().slice(0, 10)}`,
            status: "draft",
            notes: notes || null,
            createdBy: req.user?.email || req.user?.id || null,
          })
          .returning();

        await tx.insert(dailySpinPrizes).values(rows.map((r) => ({ ...r, cycleId: cycle.id })));
        return cycle;
      });

      const prizes = await getCyclePrizes(created.id);
      res.json({ success: true, cycle: created, prizes, summary: summarisePool(prizes) });
    } catch (error) {
      console.error("[daily-spin] create cycle failed:", error);
      res.status(500).json({ message: "Could not create the prize pool" });
    }
  });

  /** Adjust one tier's quantity while a cycle is still draft or paused. */
  app.patch("/api/admin/daily-spin/prizes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const quantity = Number(req.body?.quantity);
      const pointsValue = req.body?.pointsValue === undefined ? undefined : Number(req.body.pointsValue);

      if (!Number.isFinite(quantity) || quantity < 0) {
        return res.status(400).json({ message: "Quantity must be zero or more" });
      }

      const [prize] = await db
        .select()
        .from(dailySpinPrizes)
        .where(eq(dailySpinPrizes.id, req.params.id))
        .limit(1);
      if (!prize) return res.status(404).json({ message: "Prize not found" });

      const [cycle] = await db
        .select()
        .from(dailySpinCycles)
        .where(eq(dailySpinCycles.id, prize.cycleId))
        .limit(1);

      if (cycle?.status === "active") {
        return res
          .status(409)
          .json({ message: "Pause the cycle before changing its prizes" });
      }

      const awarded = prize.quantity - prize.remaining;
      if (quantity < awarded) {
        return res
          .status(400)
          .json({ message: `${awarded} of these have already gone out; quantity cannot be lower` });
      }

      const [updated] = await db
        .update(dailySpinPrizes)
        .set({
          quantity,
          remaining: quantity - awarded,
          ...(pointsValue && pointsValue > 0 ? { pointsValue } : {}),
          updatedAt: new Date(),
        })
        .where(eq(dailySpinPrizes.id, prize.id))
        .returning();

      res.json({ success: true, prize: updated });
    } catch (error) {
      console.error("[daily-spin] update prize failed:", error);
      res.status(500).json({ message: "Could not update the prize" });
    }
  });

  /** Activate a cycle, pause it, or resume it. Only one can be active. */
  app.post("/api/admin/daily-spin/cycles/:id/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const status = String(req.body?.status || "");
      if (!["active", "paused", "draft"].includes(status)) {
        return res.status(400).json({ message: "Status must be active, paused or draft" });
      }

      const [cycle] = await db
        .select()
        .from(dailySpinCycles)
        .where(eq(dailySpinCycles.id, req.params.id))
        .limit(1);
      if (!cycle) return res.status(404).json({ message: "Cycle not found" });
      if (cycle.status === "exhausted") {
        return res.status(409).json({ message: "This cycle is finished; create a new one" });
      }

      const updated = await db.transaction(async (tx) => {
        if (status === "active") {
          const prizes = await getCyclePrizes(cycle.id);
          if (summarisePool(prizes).spinsRemaining <= 0) {
            return null;
          }
          // Only one active cycle at a time.
          await tx
            .update(dailySpinCycles)
            .set({ status: "paused", updatedAt: new Date() })
            .where(and(eq(dailySpinCycles.status, "active"), sql`${dailySpinCycles.id} <> ${cycle.id}`));
        }

        const [row] = await tx
          .update(dailySpinCycles)
          .set({
            status: status as any,
            ...(status === "active" && !cycle.activatedAt ? { activatedAt: new Date() } : {}),
            updatedAt: new Date(),
          })
          .where(eq(dailySpinCycles.id, cycle.id))
          .returning();
        return row;
      });

      if (!updated) {
        return res.status(400).json({ message: "This pool has no prizes left to give out" });
      }
      res.json({ success: true, cycle: updated });
    } catch (error) {
      console.error("[daily-spin] status change failed:", error);
      res.status(500).json({ message: "Could not update the cycle" });
    }
  });

  /** Spin history: who span, what they won, when. */
  app.get("/api/admin/daily-spin/history", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const offset = Math.max(Number(req.query.offset) || 0, 0);

      const rows = await db
        .select({
          id: dailySpinResults.id,
          pointsAwarded: dailySpinResults.pointsAwarded,
          spinDate: dailySpinResults.spinDate,
          createdAt: dailySpinResults.createdAt,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(dailySpinResults)
        .leftJoin(users, eq(users.id, dailySpinResults.userId))
        .orderBy(desc(dailySpinResults.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ total }] = await db
        .select({ total: sql<number>`COUNT(*)::int` })
        .from(dailySpinResults);

      res.json({ rows, total, limit, offset });
    } catch (error) {
      console.error("[daily-spin] history failed:", error);
      res.status(500).json({ message: "Could not load the spin history" });
    }
  });
}
