import type { Express } from "express";
import { isAuthenticated } from "./customAuth";
import {
  GoldenTicketError,
  activateCampaign,
  cancelCampaign,
  createCampaign,
  getCampaign,
  listCampaigns,
  listWins,
  setFulfilmentStatus,
  updateCampaign,
} from "./services/golden-ticket";

// Local, to avoid a circular import back into routes.ts. Same shape as the
// other extracted route modules.
const isAdmin = (req: any, res: any, next: any) => {
  if (!req.user) return res.status(401).json({ message: "Authentication required" });
  if (!req.user.isAdmin) return res.status(403).json({ message: "Admin access required" });
  next();
};

function handleError(res: any, error: any) {
  if (error instanceof GoldenTicketError) {
    return res.status(error.status).json({ message: error.message, code: error.code });
  }
  console.error("[golden-ticket]", error);
  return res.status(500).json({ message: error?.message || "Golden Ticket request failed" });
}

function parseDate(value: unknown) {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function campaignInput(body: any) {
  return {
    name: String(body.name ?? ""),
    prizeType: body.prizeType,
    prizeValue: body.prizeValue ?? null,
    prizeDescription: body.prizeDescription ?? null,
    prizeImageUrl: body.prizeImageUrl ?? null,
    eligibleGameTypes: Array.isArray(body.eligibleGameTypes) ? body.eligibleGameTypes : [],
    eligibleCompetitionIds: Array.isArray(body.eligibleCompetitionIds)
      ? body.eligibleCompetitionIds
      : [],
    minSpend: body.minSpend ?? null,
    includeFreePlays: Boolean(body.includeFreePlays),
    ticketCount: Number(body.ticketCount),
    dropWindow: Number(body.dropWindow),
    startsAt: parseDate(body.startsAt),
    endsAt: parseDate(body.endsAt),
  };
}

export function registerGoldenTicketRoutes(app: Express) {
  app.get("/api/admin/golden-tickets", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      res.json(await listCampaigns());
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/admin/golden-tickets/wins", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const campaignId = req.query.campaignId ? String(req.query.campaignId) : undefined;
      res.json(await listWins(campaignId));
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/admin/golden-tickets/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const campaign = await getCampaign(req.params.id);
      if (!campaign) return res.status(404).json({ message: "Campaign not found." });
      res.json(campaign);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/admin/golden-tickets", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      res.json(await createCampaign(campaignInput(req.body), req.user.id));
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/admin/golden-tickets/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      res.json(await updateCampaign(req.params.id, campaignInput(req.body), req.user.id));
    } catch (error) {
      handleError(res, error);
    }
  });

  // Sealing the draw. After this the campaign is immutable, including for the
  // admin who activated it.
  app.post(
    "/api/admin/golden-tickets/:id/activate",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        res.json(await activateCampaign(req.params.id, req.user.id));
      } catch (error) {
        handleError(res, error);
      }
    },
  );

  app.post(
    "/api/admin/golden-tickets/:id/cancel",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        res.json(await cancelCampaign(req.params.id, req.user.id));
      } catch (error) {
        handleError(res, error);
      }
    },
  );

  app.patch(
    "/api/admin/golden-tickets/wins/:winId/fulfilment",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        res.json(await setFulfilmentStatus(req.params.winId, req.body.status, req.body.note));
      } catch (error) {
        handleError(res, error);
      }
    },
  );
}
