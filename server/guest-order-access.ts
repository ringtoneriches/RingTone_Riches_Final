import crypto from "crypto";
import type { RequestHandler } from "express";
import type { GuestOrder } from "@shared/schema";
import { storage } from "./storage";

export const GUEST_ORDER_TOKEN_HEADER = "x-guest-order-token";

export function normalizeGuestEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function issueGuestOrderAccessToken(req: any, orderId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  if (!req.session) {
    return token;
  }
  if (!req.session.guestOrderAccess) {
    req.session.guestOrderAccess = {};
  }
  req.session.guestOrderAccess[orderId] = token;
  return token;
}

export function extractGuestOrderToken(req: any, orderId: string): string | undefined {
  const headerValue =
    req.headers[GUEST_ORDER_TOKEN_HEADER] ??
    req.headers[GUEST_ORDER_TOKEN_HEADER.toLowerCase()];
  if (typeof headerValue === "string" && headerValue.length >= 16) {
    return headerValue;
  }
  if (typeof req.query?.token === "string" && req.query.token.length >= 16) {
    return req.query.token;
  }
  if (typeof req.body?.accessToken === "string" && req.body.accessToken.length >= 16) {
    return req.body.accessToken;
  }
  return req.session?.guestOrderAccess?.[orderId];
}

export async function loadSessionUser(req: any): Promise<void> {
  if (req.user || !req.session?.userId) return;
  req.user = await storage.getUser(req.session.userId);
}

export function verifyGuestOrderAccess(
  req: any,
  order: GuestOrder,
  explicitToken?: string,
): boolean {
  const token = explicitToken ?? extractGuestOrderToken(req, order.id);
  const sessionToken = req.session?.guestOrderAccess?.[order.id];
  if (token && sessionToken && token === sessionToken) {
    return true;
  }

  const user = req.user;
  if (!user) return false;

  if (
    user.isGuestAccount &&
    normalizeGuestEmail(user.email) === normalizeGuestEmail(order.guestEmail)
  ) {
    return true;
  }

  if (!user.isGuestAccount && order.userId && order.userId === user.id) {
    return true;
  }

  return false;
}

export function requireGuestOrderAccess(
  loadOrder: (req: any) => Promise<GuestOrder | undefined>,
): RequestHandler {
  return async (req: any, res, next) => {
    try {
      await loadSessionUser(req);
      const order = await loadOrder(req);
      if (!order) {
        return res.status(404).json({ success: false, message: "Guest order not found" });
      }
      if (!verifyGuestOrderAccess(req, order)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this guest order",
        });
      }
      req.guestOrder = order;
      next();
    } catch (error) {
      console.error("Guest order access check failed:", error);
      res.status(500).json({ success: false, message: "Failed to verify guest order access" });
    }
  };
}
