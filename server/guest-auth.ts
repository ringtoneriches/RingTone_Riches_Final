import type { Express, Request, Response } from "express";
import crypto from "crypto";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import { storage } from "./storage";
import { hashPassword, isAuthenticated } from "./customAuth";
import { sendGuestMagicLinkEmail } from "./email";
import { issueEmailVerificationOtp } from "./email-otp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSiteUrl(req: Request): string {
  const proto = (
    (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ||
    req.protocol ||
    "https"
  ).trim();
  const host = (
    (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0] ||
    req.get("host") ||
    "ringtoneriches.co.uk"
  ).trim();
  return `${proto}://${host}`.replace(/\/$/, "");
}

function safeNext(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return "/";
  }
  return raw;
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

const guestBeginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many guest checkout attempts. Please wait a few minutes and try again.",
    });
  },
});

const guestMagicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => {
    const email = normalizeEmail(String(req.body?.email || req.query?.email || ""));
    return email ? `guest-magic:${email}` : ipKeyGenerator(req);
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many email links requested. Check your inbox, or try again later.",
    });
  },
});

export function registerGuestAuthRoutes(app: Express) {
  app.post("/api/guest/begin-session", guestBeginLimiter, guestMagicLimiter, async (req: Request, res: Response) => {
    try {
      const firstName = String(req.body?.firstName || "").trim();
      const lastName = String(req.body?.lastName || "").trim();
      const email = normalizeEmail(String(req.body?.email || ""));
      const phone = String(req.body?.phone || "").replace(/\s/g, "");
      const acceptTerms = Boolean(req.body?.acceptTerms);
      const ageConfirmed = Boolean(req.body?.ageConfirmed);
      const receiveNewsletter = Boolean(req.body?.receiveNewsletter);
      const next = safeNext(req.body?.next);

      if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ success: false, message: "Enter a valid email address." });
      }
      if (firstName && firstName.length < 2) {
        return res.status(400).json({ success: false, message: "First name looks too short." });
      }
      if (lastName && lastName.length < 2) {
        return res.status(400).json({ success: false, message: "Last name looks too short." });
      }
      if (phone && phone.replace(/\D/g, "").length < 10) {
        return res.status(400).json({ success: false, message: "Enter a valid phone number." });
      }
      if (!acceptTerms) {
        return res.status(400).json({ success: false, message: "Please accept the terms and conditions." });
      }
      if (!ageConfirmed) {
        return res.status(400).json({ success: false, message: "You must confirm you are 18 or over and a UK resident." });
      }

      const existing = await storage.getUserByEmail(email);

      if (existing && !existing.isGuestAccount) {
        return res.status(409).json({
          success: false,
          code: "ACCOUNT_EXISTS",
          message: "An account already exists for this email. Log in to continue.",
        });
      }

      if (existing?.isGuestAccount) {
        const token = crypto.randomBytes(32).toString("hex");
        await db
          .update(users)
          .set({
            emailVerificationOtp: token,
            emailVerificationOtpExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
            updatedAt: new Date(),
          })
          .where(eq(users.id, existing.id));

        const continueUrl = `${getSiteUrl(req)}/api/guest/continue?token=${token}&next=${encodeURIComponent(next)}`;
        await sendGuestMagicLinkEmail(email, continueUrl, existing.firstName || firstName).catch((err) =>
          console.error("Guest magic link send failed:", err),
        );

        return res.json({
          success: true,
          needsMagicLink: true,
          message: "We emailed you a link to continue this checkout. It expires in 30 minutes.",
        });
      }

      const randomSecret = crypto.randomBytes(32).toString("hex");
      const user = await storage.createUser({
        email,
        password: await hashPassword(randomSecret),
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phoneNumber: phone || undefined,
        receiveNewsletter,
        emailVerified: true,
        isGuestAccount: true,
      });

      (req as any).session.userId = user.id;

      return res.json({
        success: true,
        needsMagicLink: false,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isGuestAccount: true,
        },
      });
    } catch (error: any) {
      console.error("guest begin-session error:", error);
      return res.status(500).json({
        success: false,
        message: "Could not start guest checkout. Please try again.",
      });
    }
  });

  app.get("/api/guest/continue", async (req: Request, res: Response) => {
    const token = String(req.query.token || "");
    const next = safeNext(req.query.next);

    if (!token || token.length < 16) {
      return res.redirect("/login?guest=expired");
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.emailVerificationOtp, token))
        .limit(1);

      if (!user?.isGuestAccount) {
        return res.redirect("/login?guest=expired");
      }

      if (!user.emailVerificationOtpExpiresAt || new Date() > new Date(user.emailVerificationOtpExpiresAt)) {
        return res.redirect("/login?guest=expired");
      }

      await db
        .update(users)
        .set({
          emailVerificationOtp: null,
          emailVerificationOtpExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      (req as any).session.userId = user.id;
      return res.redirect(next || "/");
    } catch (error) {
      console.error("guest continue error:", error);
      return res.redirect("/login?guest=expired");
    }
  });

  app.post("/api/guest/set-password", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = req.user;
      if (!user?.isGuestAccount) {
        return res.status(400).json({
          success: false,
          message: "This account already has a password.",
        });
      }

      const password = String(req.body?.password || "");
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters.",
        });
      }

      await db
        .update(users)
        .set({
          password: await hashPassword(password),
          isGuestAccount: false,
          passwordChangedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      await issueEmailVerificationOtp(user);

      return res.json({
        success: true,
        needsVerification: true,
        email: user.email,
        message: "Password saved. Check your email for a verification code.",
      });
    } catch (error) {
      console.error("guest set-password error:", error);
      return res.status(500).json({
        success: false,
        message: "Could not save your password. Please try again.",
      });
    }
  });
}
