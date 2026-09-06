import bcrypt from "bcrypt";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { users, sessions, type User } from "@shared/schema";
import { applySelfSuspensionExpiry } from "./restriction";
import { logUserIpIfNeeded } from "./logUserIpIfNeeded";

const isProduction = process.env.NODE_ENV === "production";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password with bcrypt
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function setupCustomAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}

/** Strip sensitive fields before sending user records to the client. */
export function sanitizeUserForClient(user: User) {
  const {
    password: _password,
    emailVerificationOtp: _otp,
    emailVerificationOtpExpiresAt: _otpExpires,
    securityAnswer: _securityAnswer,
    securityQuestion: _securityQuestion,
    stripeCustomerId: _stripeCustomerId,
    stripeSubscriptionId: _stripeSubscriptionId,
    notes: _notes,
    pendingRedeemCode: _pendingRedeemCode,
    pendingRedeemAmount: _pendingRedeemAmount,
    ...safeUser
  } = user;
  return safeUser;
}

/** Invalidate every server-side session for a user (e.g. after password change). */
export async function destroyAllUserSessions(userId: string): Promise<void> {
  try {
    await db
      .delete(sessions)
      .where(sql`${sessions.sess}->>'userId' = ${userId}`);
  } catch (error) {
    console.error("Failed to destroy user sessions:", error);
  }
}

// Custom authentication middleware
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const now = new Date();

    // Auto-re-enable admin disable
    if (user.disabled && user.disabledUntil && now > new Date(user.disabledUntil)) {
      await db.update(users)
        .set({ disabled: false, disabledAt: null, disabledUntil: null, updatedAt: now })
        .where(eq(users.id, user.id));
      user.disabled = false;
    }

    // Auto-re-enable self-suspension
    await applySelfSuspensionExpiry(user.id);

    // Refresh user after potential self-suspension expiry
    const freshUser = await storage.getUser(user.id);

    // Block login if admin-disabled
    if (freshUser.disabled) {
      req.session.destroy(() => {});
      return res.status(403).json({ message: "This account has been closed." });
    }

    // Block login if self-suspended
    if (freshUser.selfSuspended && freshUser.selfSuspensionEndsAt && now < new Date(freshUser.selfSuspensionEndsAt)) {
      req.session.destroy(() => {});
      return res.status(403).json({
        code: "SELF_SUSPENDED",
        message: "Your account is temporarily suspended due to a wellbeing request.",
        endsAt: freshUser.selfSuspensionEndsAt,
      });
    }

    req.user = freshUser;
    await logUserIpIfNeeded(req);
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const ADMIN_STEP_UP_DURATION_MS = 30 * 60 * 1000;

export type AdminStepUpScope = "games" | "users";

export function getAdminStepUpStatus(req: any) {
  const now = Date.now();
  const stepUp = req.session?.adminStepUp || {};
  return {
    games: typeof stepUp.games === "number" && stepUp.games > now,
    users: typeof stepUp.users === "number" && stepUp.users > now,
  };
}

export function grantAdminStepUp(req: any, scope: AdminStepUpScope): number {
  if (!req.session.adminStepUp) {
    req.session.adminStepUp = {};
  }
  const expiresAt = Date.now() + ADMIN_STEP_UP_DURATION_MS;
  req.session.adminStepUp[scope] = expiresAt;
  return expiresAt;
}

export function revokeAdminStepUp(req: any, scope: AdminStepUpScope | "all") {
  if (!req.session?.adminStepUp) return;
  if (scope === "all") {
    delete req.session.adminStepUp;
    return;
  }
  delete req.session.adminStepUp[scope];
}

/** Block guest-checkout sessions from wallet, verification, and other full-account APIs. */
export const requireFullAccount: RequestHandler = async (req: any, res, next) => {
  if (req.user?.isGuestAccount) {
    return res.status(403).json({
      code: "GUEST_ACCOUNT_LIMITED",
      message: "Save a password on your account to use this feature.",
    });
  }
  next();
};

export const isFullUserAuthenticated: RequestHandler[] = [
  isAuthenticated,
  requireFullAccount,
];

// Interface for session data
declare module "express-session" {
  interface SessionData {
    userId: string;
    guestOrderAccess?: Record<string, string>;
    adminStepUp?: {
      games?: number;
      users?: number;
    };
  }
}