import type { Express } from "express";
import { isAuthenticated } from "./customAuth";
import {
  awardWeeklyPrize,
  listReferralsForAdmin,
  referralTotals,
  reviewReferral,
  weeklyCounts,
} from "./services/referrals";
import { weekStartFor } from "./services/referral-abuse";

// Local, to avoid a circular import back into routes.ts.
const isAdmin = (req: any, res: any, next: any) => {
  if (!req.user) return res.status(401).json({ message: "Authentication required" });
  if (!req.user.isAdmin) return res.status(403).json({ message: "Admin access required" });
  next();
};

function fail(res: any, error: any, what: string) {
  console.error(`[referrals] ${what}:`, error);
  res.status(500).json({ message: error?.message || what });
}

export function registerReferralRoutes(app: Express) {
  app.get("/api/admin/referrals", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      const [rows, totals] = await Promise.all([
        listReferralsForAdmin({ status, limit: Number(req.query.limit) || 200 }),
        referralTotals(),
      ]);
      res.json({ referrals: rows, totals });
    } catch (error) {
      fail(res, error, "Failed to list referrals");
    }
  });

  app.get("/api/admin/referrals/leaderboard", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const weekStart = req.query.weekStart
        ? String(req.query.weekStart)
        : weekStartFor(new Date());
      res.json({ weekStart, leaderboard: await weeklyCounts(weekStart) });
    } catch (error) {
      fail(res, error, "Failed to load leaderboard");
    }
  });

  // Resolving something from the flagged queue.
  app.patch(
    "/api/admin/referrals/:id/review",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const decision = req.body?.decision === "block" ? "block" : "approve";
        res.json(await reviewReferral(req.params.id, decision, req.user.id));
      } catch (error) {
        fail(res, error, "Failed to review referral");
      }
    },
  );

  // Paying the weekly prize by hand, if the sweep was missed or is being
  // tested. Safe to call twice — the unique index refuses a second payment.
  app.post("/api/admin/referrals/award-weekly", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const weekStart = req.body?.weekStart ? String(req.body.weekStart) : undefined;
      res.json(await awardWeeklyPrize(weekStart));
    } catch (error) {
      fail(res, error, "Failed to award weekly prize");
    }
  });
}
