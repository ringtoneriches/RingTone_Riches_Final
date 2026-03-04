import bcrypt from "bcrypt";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import { applySelfSuspensionExpiry } from "./restriction";
import { logUserIpIfNeeded } from "./logUserIpIfNeeded";

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
      // httpOnly: true,
      secure: false,
      maxAge: sessionTtl,
      // sameSite: "none",
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
    await  logUserIpIfNeeded(req);
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// Interface for session data
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}