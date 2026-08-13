import type { Express } from "express";
import { isAuthenticated } from "./customAuth";
import { db } from "./db";
import { competitions, instantWinPrizeAudit } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import {
  HIGH_VALUE_THRESHOLD,
  InstantWinError,
  activateInstantWinPrize,
  createInstantWinPrize,
  disableInstantWinPrize,
  getAdminExposure,
  getPublicPrizePool,
  listInstantWinPrizes,
  lockInstantWinPrize,
  setCompetitionInstantWinMode,
} from "./services/instant-win-pool";

const isAdmin = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

function handleInstantWinError(res: any, error: any) {
  if (error instanceof InstantWinError) {
    return res.status(error.status).json({
      message: error.message,
      code: error.code,
      highValueThreshold: error.code === "high_value_confirm" ? HIGH_VALUE_THRESHOLD : undefined,
    });
  }
  console.error("[instant-win]", error);
  return res.status(500).json({ message: error?.message || "Instant win request failed" });
}

export function registerInstantWinRoutes(app: Express) {
  app.get("/api/admin/instant-win/competitions", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const rows = await db
        .select({
          id: competitions.id,
          title: competitions.title,
          type: competitions.type,
          ticketPrice: competitions.ticketPrice,
          maxTickets: competitions.maxTickets,
          soldTickets: competitions.soldTickets,
          instantWinMode: competitions.instantWinMode,
          nextTicketNumber: competitions.nextTicketNumber,
          isActive: competitions.isActive,
          status: competitions.status,
        })
        .from(competitions);
      res.json(
        rows.filter((c) => c.type !== "instant")
      );
    } catch (error) {
      handleInstantWinError(res, error);
    }
  });

  app.get(
    "/api/admin/competitions/:competitionId/instant-win",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const { competitionId } = req.params;
        const { status } = req.query;
        const [exposure, prizes] = await Promise.all([
          getAdminExposure(competitionId),
          listInstantWinPrizes(competitionId, {
            status: typeof status === "string" ? status : "all",
            revealLockedTickets: true,
          }),
        ]);
        res.json({ exposure, prizes, highValueThreshold: HIGH_VALUE_THRESHOLD });
      } catch (error) {
        handleInstantWinError(res, error);
      }
    }
  );

  app.patch(
    "/api/admin/competitions/:competitionId/instant-win-mode",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { mode } = req.body || {};
        if (mode !== "probability" && mode !== "controlled_pool") {
          return res.status(400).json({ message: "mode must be probability or controlled_pool" });
        }
        const updated = await setCompetitionInstantWinMode(
          req.params.competitionId,
          mode,
          req.user?.id
        );
        res.json(updated);
      } catch (error) {
        handleInstantWinError(res, error);
      }
    }
  );

  app.post(
    "/api/admin/competitions/:competitionId/instant-win/prizes",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const prize = await createInstantWinPrize({
          competitionId: req.params.competitionId,
          name: req.body.name,
          value: req.body.value,
          rewardType: req.body.rewardType,
          rangeFrom: Number(req.body.rangeFrom),
          rangeTo: Number(req.body.rangeTo),
          activationType: req.body.activationType || "manual",
          activationValue: req.body.activationValue,
          allocationMethod: req.body.allocationMethod || "b_on_activate",
          adminId: req.user?.id,
          confirmHighValue: Boolean(req.body.confirmHighValue),
        });
        res.json(prize);
      } catch (error) {
        handleInstantWinError(res, error);
      }
    }
  );

  app.post(
    "/api/admin/instant-win/prizes/:prizeId/activate",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const prize = await activateInstantWinPrize(req.params.prizeId, req.user?.id, {
          confirmHighValue: Boolean(req.body?.confirmHighValue),
          reason: req.body?.reason,
        });
        res.json(prize);
      } catch (error) {
        handleInstantWinError(res, error);
      }
    }
  );

  app.post(
    "/api/admin/instant-win/prizes/:prizeId/lock",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const prize = await lockInstantWinPrize(req.params.prizeId, req.user?.id);
        res.json(prize);
      } catch (error) {
        handleInstantWinError(res, error);
      }
    }
  );

  app.post(
    "/api/admin/instant-win/prizes/:prizeId/disable",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const prize = await disableInstantWinPrize(req.params.prizeId, req.user?.id);
        res.json(prize);
      } catch (error) {
        handleInstantWinError(res, error);
      }
    }
  );

  app.get(
    "/api/admin/instant-win/prizes/:prizeId/audit",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const rows = await db
          .select()
          .from(instantWinPrizeAudit)
          .where(eq(instantWinPrizeAudit.prizeId, req.params.prizeId))
          .orderBy(desc(instantWinPrizeAudit.createdAt));
        res.json(rows);
      } catch (error) {
        handleInstantWinError(res, error);
      }
    }
  );

  app.get("/api/competitions/:competitionId/instant-win-pool", async (req, res) => {
    try {
      const pool = await getPublicPrizePool(req.params.competitionId);
      res.json(pool);
    } catch (error) {
      handleInstantWinError(res, error);
    }
  });
}
