import type { Express, NextFunction } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { storage } from "./storage";
import {
  setupCustomAuth,
  isAuthenticated,
  hashPassword,
  verifyPassword,
} from "./customAuth";
import {
  insertOrderSchema,
  insertTransactionSchema,
  insertTicketSchema,
  registerUserSchema,
  loginUserSchema,
  insertWithdrawalRequestSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  passwordResetTokens,
  competitions,
  tickets,
  orders,
  transactions,
  users,
  winners,
  gameSpinConfig,
  scratchCardImages,
  scratchCardWins,
  scratchCardUsage,
  withdrawalRequests,
  spinWins,
  spinUsage,
  campaignEmails,
  promotionalCampaigns,
  platformSettings,
  spinWheel2Configs,
  auditLogs,
  supportTickets,
  insertSupportMessageSchema,
  insertSupportTicketSchema,
  pendingPayments,
  wellbeingRequests,
} from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import {stripe} from "./stripe";
import { cashflows } from "./cashflows";
import { and, asc, desc, eq, inArray, sql, like, gte, lte, or } from "drizzle-orm";
import { count } from "drizzle-orm/sql";
import { z } from "zod";
import { sendOrderConfirmationEmail, sendWelcomeEmail, sendPromotionalEmail, sendPasswordResetEmail, sendTopupConfirmationEmail } from "./email";
import { wsManager } from "./websocket";
import { upload } from "./cloudinary";
import { applySelfSuspensionExpiry, isNotRestricted } from "./restriction";

// Default spin wheel configuration - 26 segments with 6 evenly-distributed black segments
// Color palette: Black #000000, Red #FE0000, White #FFFFFF, Blue #1E54FF, Yellow #FEED00, Green #00A223
// 6 Black segments evenly distributed: X icons at positions 1, 5, 10, 15, 20 + R_Prize at position 26 (mystery prize)
// Icon order based on uploaded image (clockwise from top X)
// Total probability MUST equal 100% exactly
const DEFAULT_SPIN_WHEEL_CONFIG = {
  id: "active",
  segments: [
    { id: "1", label: "Nice Try", color: "#000000", iconKey: "NoWin", rewardType: "lose", rewardValue: 0, probability: 3, maxWins: null },
    { id: "2", label: "Mini Cooper", color: "#FE0000", iconKey: "MiniCooper", rewardType: "cash", rewardValue: 0.55, probability: 4, maxWins: null },
    { id: "3", label: "Mercedes Benz", color: "#FFFFFF", iconKey: "MercedesBenz", rewardType: "cash", rewardValue: 0.60, probability: 4, maxWins: null },
    { id: "4", label: "Nissan", color: "#1E54FF", iconKey: "Nissan", rewardType: "points", rewardValue: 50, probability: 4, maxWins: null },
    { id: "5", label: "Nice Try", color: "#000000", iconKey: "NoWin", rewardType: "lose", rewardValue: 0, probability: 8, maxWins: null },
    { id: "6", label: "Bentley", color: "#00A223", iconKey: "Bentley", rewardType: "cash", rewardValue: 0.25, probability: 4, maxWins: null },
    { id: "7", label: "Porsche", color: "#FEED00", iconKey: "Porsche", rewardType: "cash", rewardValue: 0.80, probability: 4, maxWins: null },
    { id: "8", label: "Lexus", color: "#FE0000", iconKey: "Lexus", rewardType: "points", rewardValue: 850, probability: 3, maxWins: null },
    { id: "9", label: "McLaren", color: "#FFFFFF", iconKey: "McLaren", rewardType: "cash", rewardValue: 0.70, probability: 3, maxWins: null },
    { id: "10", label: "Nice Try", color: "#000000", iconKey: "NoWin", rewardType: "lose", rewardValue: 0, probability: 8, maxWins: null },
    { id: "11", label: "Aston Martin", color: "#FEED00", iconKey: "AstonMartin", rewardType: "cash", rewardValue: 0.15, probability: 3, maxWins: null },
    { id: "12", label: "Lamborghini", color: "#00A223", iconKey: "Lamborghini", rewardType: "cash", rewardValue: 0.90, probability: 3, maxWins: null },
    { id: "13", label: "Jaguar", color: "#1E54FF", iconKey: "Jaguar", rewardType: "points", rewardValue: 1000, probability: 3, maxWins: null },
    { id: "14", label: "Maserati", color: "#FE0000", iconKey: "Maserati", rewardType: "cash", rewardValue: 5, probability: 2, maxWins: 10 },
    { id: "15", label: "Nice Try", color: "#000000", iconKey: "NoWin", rewardType: "lose", rewardValue: 0, probability: 8, maxWins: null },
    { id: "16", label: "Honda", color: "#1E54FF", iconKey: "Honda", rewardType: "points", rewardValue: 150, probability: 3, maxWins: null },
    { id: "17", label: "BMW", color: "#FEED00", iconKey: "BMW", rewardType: "cash", rewardValue: 0.50, probability: 3, maxWins: null },
    { id: "18", label: "Audi", color: "#00A223", iconKey: "Audi", rewardType: "points", rewardValue: 3000, probability: 3, maxWins: null },
    { id: "19", label: "Ford", color: "#FFFFFF", iconKey: "Ford", rewardType: "points", rewardValue: 100, probability: 3, maxWins: null },
    { id: "20", label: "Nice Try", color: "#000000", iconKey: "NoWin", rewardType: "lose", rewardValue: 0, probability: 8, maxWins: null },
    { id: "21", label: "Toyota", color: "#FFFFFF", iconKey: "Toyota", rewardType: "points", rewardValue: 250, probability: 3, maxWins: null },
    { id: "22", label: "Land Rover", color: "#1E54FF", iconKey: "LandRover", rewardType: "points", rewardValue: 2000, probability: 3, maxWins: null },
    { id: "23", label: "Ferrari", color: "#FEED00", iconKey: "Ferrari", rewardType: "cash", rewardValue: 0.50, probability: 3, maxWins: null },
    { id: "24", label: "Rolls Royce", color: "#00A223", iconKey: "RollsRoyce", rewardType: "cash", rewardValue: 0.10, probability: 3, maxWins: null },
    { id: "25", label: "Volkswagen", color: "#FE0000", iconKey: "Volkswagen", rewardType: "points", rewardValue: 450, probability: 3, maxWins: null },
    { id: "26", label: "R Prize", color: "#000000", iconKey: "R_Prize", rewardType: "cash", rewardValue: 100, probability: 1, maxWins: 1 }
  ],
  maxSpinsPerUser: null,
  mysteryPrize: {
    rewardType: "cash",
    rewardValue: 100,
    probability: 1,
    maxWins: 1,
    segmentId: "26"
  },
  isActive: true,
  isVisible: true,
};
// Verify total probability = 100 at module load
const totalProb = DEFAULT_SPIN_WHEEL_CONFIG.segments.reduce((sum, s) => sum + s.probability, 0);
if (totalProb !== 100) {
  throw new Error(`DEFAULT_SPIN_WHEEL_CONFIG probabilities total ${totalProb}, must be 100`);
}

const DEFAULT_SPIN_WHEEL_2_CONFIG = {
  id: "active",
  segments: [
    // Segment 1-5
    { id: "1", label: "Nice Try", color: "#000000", iconKey: "NoWin", rewardType: "lose", rewardValue: 0, probability: 3, maxWins: null },
    { id: "2", label: "Santa", color: "#FE0000", iconKey: "Santa", rewardType: "cash", rewardValue: 5000, probability: 1, maxWins: null }, // Rare big prize
    { id: "3", label: "Sleigh", color: "#FFFFFF", iconKey: "Sleigh", rewardType: "cash", rewardValue: 1000, probability: 2, maxWins: null },
    { id: "4", label: "Santa's Sack", color: "#1E54FF", iconKey: "SantasSack", rewardType: "cash", rewardValue: 750, probability: 2, maxWins: null },
    { id: "5", label: "Nice Try", color: "#000000", iconKey: "NoWin", rewardType: "lose", rewardValue: 0, probability: 8, maxWins: null },
    
    // Segment 6-10
    { id: "6", label: "Rudolph", color: "#00A223", iconKey: "Rudolph", rewardType: "cash", rewardValue: 500, probability: 3, maxWins: null },
    { id: "7", label: "Elf", color: "#FEED00", iconKey: "Elf", rewardType: "cash", rewardValue: 250, probability: 4, maxWins: null },
    { id: "8", label: "Gold Star", color: "#FE0000", iconKey: "GoldStar", rewardType: "cash", rewardValue: 150, probability: 4, maxWins: null },
    { id: "9", label: "Christmas Tree", color: "#FFFFFF", iconKey: "ChristmasTree", rewardType: "cash", rewardValue: 100, probability: 4, maxWins: null },
    { id: "10", label: "Nice Try", color: "#000000", iconKey: "NoWin", rewardType: "lose", rewardValue: 0, probability: 8, maxWins: null },
    
    // Segment 11-15
    { id: "11", label: "Present", color: "#FEED00", iconKey: "Present", rewardType: "cash", rewardValue: 75, probability: 4, maxWins: null },
    { id: "12", label: "Snowman", color: "#00A223", iconKey: "Snowman", rewardType: "cash", rewardValue: 50, probability: 4, maxWins: null },
    { id: "13", label: "Bauble", color: "#1E54FF", iconKey: "Bauble", rewardType: "cash", rewardValue: 25, probability: 4, maxWins: null },
    { id: "14", label: "Snowflake", color: "#FE0000", iconKey: "Snowflake", rewardType: "points", rewardValue: 1000, probability: 3, maxWins: null },
    // { id: "15", label: "Nice Try", color: "#000000", iconKey: "NoWin", rewardType: "lose", rewardValue: 0, probability: 8, maxWins: null },
    
    // Segment 16-20
    { id: "16", label: "Wreath", color: "#1E54FF", iconKey: "Wreath", rewardType: "points", rewardValue: 750, probability: 3, maxWins: null }, // Using Holly icon for Wreath
    { id: "17", label: "Candy Cane", color: "#FEED00", iconKey: "CandyCane", rewardType: "points", rewardValue: 500, probability: 3, maxWins: null },
    { id: "18", label: "Stocking", color: "#00A223", iconKey: "Stocking", rewardType: "points", rewardValue: 400, probability: 3, maxWins: null }, // Using Mitten icon for Stocking
    { id: "19", label: "Mitten", color: "#FFFFFF", iconKey: "Mitten", rewardType: "points", rewardValue: 300, probability: 3, maxWins: null },
    { id: "20", label: "Nice Try", color: "#000000", iconKey: "NoWin", rewardType: "lose", rewardValue: 0, probability: 8, maxWins: null },
    
    // Segment 21-25
    { id: "21", label: "Candle", color: "#FFFFFF", iconKey: "Candle", rewardType: "points", rewardValue: 250, probability: 3, maxWins: null },
    { id: "22", label: "Holly", color: "#1E54FF", iconKey: "Holly", rewardType: "points", rewardValue: 200, probability: 3, maxWins: null },
    { id: "23", label: "Gingerbread Man", color: "#FEED00", iconKey: "GingerbreadMan", rewardType: "points", rewardValue: 150, probability: 3, maxWins: null },
    { id: "24", label: "Snow Globe", color: "#00A223", iconKey: "SnowGlobe", rewardType: "points", rewardValue: 100, probability: 3, maxWins: null },
    { id: "25", label: "Bell", color: "#FE0000", iconKey: "Bell", rewardType: "points", rewardValue: 50, probability: 3, maxWins: null },
    
    // Segment 26 - Mystery Prize
    { id: "26", label: "R Prize", color: "#000000", iconKey: "R_Prize", rewardType: "cash", rewardValue: 10000, probability: 1, maxWins: 1 } // Big mystery prize
  ],
  maxSpinsPerUser: null,
  mysteryPrize: {
    rewardType: "cash",
    rewardValue: 10000, // £10,000 mega prize
    probability: 1,
    maxWins: 1,
    segmentId: "26"
  },
  isActive: true,
  isVisible: true,
};

// Verify total probability = 100
const totalProb2 = DEFAULT_SPIN_WHEEL_2_CONFIG.segments.reduce((sum, s) => sum + s.probability, 0);
console.log(`Christmas Wheel Total Probability: ${totalProb2}%`); // Should be 100%

// Validation schema for spin wheel segment
const spinSegmentSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string(),
  iconKey: z.string(),
  rewardType: z.enum(["cash", "points", "lose"]),
  rewardValue: z.union([z.number(), z.string()]),
  probability: z.number().min(0).max(100),
  maxWins: z.number().nullable(),
});

const mysteryPrizeSchema = z.object({
  rewardType: z.enum(["cash", "points", "lose"]),
  rewardValue: z.number(),
  probability: z.number().min(0).max(100),
  maxWins: z.number().nullable(),
  segmentId: z.string(),
});

const spinConfigSchema = z.object({
  segments: z.array(spinSegmentSchema).length(26, "Must have exactly 26 segments"),
  maxSpinsPerUser: z.number().nullable().optional(),
  mysteryPrize: mysteryPrizeSchema.optional(),
  isVisible: z.boolean().optional(),
});

const spinConfigSchema2 = z.object({
  segments: z.array(spinSegmentSchema).length(25, "Must have exactly 25 segments"),
  maxSpinsPerUser: z.number().nullable().optional(),
  mysteryPrize: mysteryPrizeSchema.optional(),
  isVisible: z.boolean().optional(),
});

const scratchConfigSchema = z.object({
  isVisible: z.boolean().optional(),
});



// const uploadDir = path.join(process.cwd(), "attached_assets", "competitions");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// const upload = multer({
  // storage: multer.diskStorage({
  //   destination: (req, file, cb) => {
  //     cb(null, uploadDir);
  //   },
  //   filename: (req, file, cb) => {
  //     const uniqueName = `${Date.now()}-${nanoid(8)}${path.extname(file.originalname)}`;
  //     cb(null, uniqueName);
  //   },
  // }),
  // fileFilter: (req, file, cb) => {
  //   const allowedTypes = /jpeg|jpg|png|gif|webp/;
  //   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  //   const mimetype = allowedTypes.test(file.mimetype);
  //   if (extname && mimetype) {
  //     cb(null, true);
  //   } else {
  //     cb(new Error("Only image files are allowed"));
  //   }
  // },
  // limits: { fileSize: 5 * 1024 * 1024 },
// });
// Initialize Stripe only if keys are available
// let stripe: Stripe | null = null;
// if (process.env.STRIPE_SECRET_KEY) {
//   stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//     apiVersion: "2025-08-27.basil",
//   });
// }

// Admin middleware
export const isAdmin = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
};


// ✅ Top of the file or after imports
export async function recheckPendingPayments() {
  const pendings = await db.query.pendingPayments.findMany({
    where: (p, { eq }) => eq(p.status, "pending"),
  });

  for (const p of pendings) {
    try {
      if (!p.paymentReference) {
        console.log("⚠️ Skipping pending payment without paymentReference:", p.paymentJobReference);
        continue;
      }

      const payment = await cashflows.getPaymentStatus(
        p.paymentJobReference,
        p.paymentReference
      );

      const { status, paidAmount } = normalizeCashflowsStatus(payment);

      if (status !== "PAID") continue;

      const amount = paidAmount > 0 ? paidAmount : Number(p.amount);

      await processWalletTopup(p.userId, p.paymentReference, amount);

      await db.update(pendingPayments)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(pendingPayments.id, p.id));

      console.log("♻️ Recovered payment:", p.paymentJobReference);

    } catch (err) {
      console.error("❌ Recheck error:", p.paymentJobReference, err);
    }
  }
}



function normalizeCashflowsStatus(payment: any): {
  status: "PAID" | "PENDING" | "FAILED" | "UNKNOWN",
  paidAmount: number
} {
  const raw =
    payment?.status ||
    payment?.data?.status ||
    payment?.data?.paymentStatus ||
    payment?.data?.payments?.[0]?.status ||
    "";

  const status = raw.toUpperCase();

  const paidAmount = Number(
    payment?.data?.paidAmount ||
    payment?.data?.amountCollected ||
    payment?.data?.payments?.[0]?.paidAmount ||
    0
  );

  if (status.includes("PAID") || status.includes("SUCCESS") || status.includes("CAPTURE")) {
    return { status: "PAID", paidAmount };
  }

  if (status.includes("FAIL") || status.includes("CANCEL")) {
    return { status: "FAILED", paidAmount: 0 };
  }

  if (status.includes("PENDING") || status.includes("PROCESS") || status.includes("AUTHOR")) {
    return { status: "PENDING", paidAmount: 0 };
  }

  return { status: "UNKNOWN", paidAmount: 0 };
}


async function processWalletTopup(
  userId: string,
  paymentRef: string,
  amount: number
) {
  console.log("💰 processWalletTopup called", { userId, paymentRef, amount });

  await db.transaction(async (tx) => {
    // 1️⃣ Check for duplicate
    const existing = await tx.query.transactions.findFirst({
      where: (t, { eq }) => eq(t.paymentRef, paymentRef)
    });

    if (existing) {
      console.warn("⚠️ Duplicate transaction found, skipping:", paymentRef);
      return;
    }

    console.log("📝 Inserting transaction...");
    try {
      await tx.insert(transactions).values({
        userId,
        type: "deposit",
        amount: Math.round(amount * 100) / 100, // ensure number
        paymentRef,
        description: `Cashflows wallet top-up £${amount}`,
      });
      console.log("✅ Transaction inserted");
    } catch (err) {
      console.error("❌ Failed to insert transaction:", err);
      throw err; // re-throw so balance update does not silently fail
    }

    console.log("💳 Updating user balance...");
    try {
      const result = await tx.execute(sql`
        UPDATE users
        SET balance = balance + ${amount}
        WHERE id = ${userId}
      `);
      console.log("✅ Balance updated", result);
    } catch (err) {
      console.error("❌ Failed to update balance:", err);
      throw err;
    }

    console.log("🎉 Wallet top-up completed for user:", userId);
  });
}


export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupCustomAuth(app);

  // File upload endpoint for competition images
  app.post("/api/upload/competition-image", isAuthenticated, isAdmin, upload.single("image"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const imagePath = req.file.path;
      return res.status(200).json({ imagePath });
    } catch (error: any) {
      console.error("File upload error:", error);
      return res.status(500).json({ message: error.message || "File upload failed" });
    }
  });

  // Registration route
app.post("/api/auth/register", async (req, res) => {
  try {
    const result = registerUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid registration data",
        errors: result.error.issues,
      });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      phoneNumber,
      receiveNewsletter,
      birthMonth,
      birthYear,
      referralCode, // ⭐ IMPORTANT
    } = req.body;

    // Check if user exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password || "");

    // Create DOB
    const dobString =
      birthMonth && birthYear
        ? `${birthYear}-${String(birthMonth).padStart(2, "0")}-01`
        : undefined;

    // Create new user
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      dateOfBirth: dobString,
      phoneNumber,
      receiveNewsletter: receiveNewsletter || false,
    });

    let bonusCashCredited = 0;
    let bonusPointsCredited = 0;

    // Apply normal signup bonus
    try {
      const settings = await storage.getPlatformSettings();
      if (settings?.signupBonusEnabled) {
        const bonusCash = parseFloat(settings.signupBonusCash || "0");
        const bonusPoints = settings.signupBonusPoints || 0;

        if (bonusCash > 0) {
          await storage.updateUserBalance(user.id, bonusCash.toFixed(2));
          bonusCashCredited = bonusCash;

          await storage.createTransaction({
            userId: user.id,
            amount: bonusCash.toFixed(2),
            type: "deposit",
            status: "completed",
            description: "Signup bonus - Welcome cash",
            paymentMethod: "bonus",
          });
        }

        if (bonusPoints > 0) {
          await storage.updateUserRingtonePoints(user.id, bonusPoints);
          bonusPointsCredited = bonusPoints;

          await storage.createTransaction({
            userId: user.id,
            amount: "0.00",
            type: "deposit",
            status: "completed",
            description: `Signup bonus - ${bonusPoints} RingTone Points`,
            paymentMethod: "bonus",
          });
        }
      }
    } catch (bonusError) {
      console.error("Signup bonus error:", bonusError);
    }

    // ⭐⭐ REFERRAL SYSTEM — REWARDED ON SIGNUP ⭐⭐
    try {
      if (referralCode) {
        const referrer = await storage.getUserByReferralCode(referralCode);

        if (referrer && referrer.id !== user.id) {
          // Save referredBy
          await storage.saveUserReferral({
            userId: user.id,
            referrerId: referrer.id,
          });

          console.log(`🎉 Referral: ${referrer.email} referred ${user.email}`);

          // ⭐ GIVE NEW USER 100 POINTS
          const welcomeReferralPoints = 100;
          const existingPoints = await storage.getUserRingtonePoints(user.id);

          await storage.updateUserRingtonePoints(
            user.id,
            existingPoints + welcomeReferralPoints
          );

          await storage.createTransaction({
            userId: user.id,
            amount: welcomeReferralPoints.toString(),
            type: "referral_bonus",
            status: "completed",
            description: `Welcome referral bonus +${welcomeReferralPoints} points`,
            paymentMethod: "bonus",
          });
        }
      }
    } catch (referralError) {
      console.error("Referral processing error:", referralError);
    }

    // Send welcome email
    sendWelcomeEmail(email, {
      userName: `${firstName} ${lastName}`.trim() || "there",
      email,
    }).catch((err) => console.error("Failed to send welcome email:", err));

    res.status(201).json({
      message: "User registered successfully",
      userId: user.id,
      bonusCash: bonusCashCredited,
      bonusPoints: bonusPointsCredited,
      userName: `${firstName} ${lastName}`.trim() || firstName,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to register user" });
  }
});


  // Login route
app.post("/api/auth/login", async (req, res) => {
  try {
    const result = loginUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid login data" });
    }
     const now = new Date();
    const { email, password } = result.data;

    // Get user by email
    const user = await storage.getUserByEmail(email);
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

  // 1️⃣ Check admin disables first
    if (user.disabled) {
      if (user.disabledUntil && now > new Date(user.disabledUntil)) {
        await db.update(users)
          .set({ disabled: false, disabledAt: null, disabledUntil: null, updatedAt: now })
          .where(eq(users.id, user.id));
        user.disabled = false;
      }

      if (user.disabled) {
        return res.status(403).json({ message: "This account has been closed." });
      }
    }

    // 2️⃣ Check self-suspension before password verification
    if (user.selfSuspended && user.selfSuspensionEndsAt && now < new Date(user.selfSuspensionEndsAt)) {
      return res.status(403).json({
        code: "SELF_SUSPENDED",
        message: "Your account is temporarily suspended due to a wellbeing request.",
        endsAt: user.selfSuspensionEndsAt,
      });
    }

    // 3️⃣ Apply self-suspension expiry for past suspensions
    await applySelfSuspensionExpiry(user.id);

    // Refresh user object after potential suspension removal
    const freshUser = await storage.getUser(user.id);

    // Verify password
    const isValidPassword = await verifyPassword(password, freshUser.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Store user ID in session
    (req as any).session.userId = freshUser.id;

    res.json({
      message: "Login successful",
      user: { 
        id: freshUser.id,
        email: freshUser.email,
        firstName: freshUser.firstName,
        lastName: freshUser.lastName,
        balance: freshUser.balance,
        ringtonePoints: freshUser.ringtonePoints,
        isAdmin: freshUser.isAdmin || false
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to log in" });
  }
});



// Logout route
app.post("/api/auth/logout", (req: any, res) => {
  req.session.destroy((err: any) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Failed to log out" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

  // Get current user route
app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
});

// Password reset - Request reset link
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.json({ 
        message: "If an account exists with this email, a password reset link has been sent." 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    await db.insert(passwordResetTokens).values({
      email: user.email,
      token: resetToken,
      expiresAt,
      used: false,
    });

    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    await sendPasswordResetEmail(
      user.email, 
      resetUrl, 
      user.firstName || undefined
    );

    console.log(`Password reset requested for: ${user.email}`);
    
    res.json({ 
      message: "If an account exists with this email, a password reset link has been sent." 
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to process password reset request" });
  }
});

// Password reset - Verify token validity
app.get("/api/auth/verify-reset-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (!resetToken) {
      return res.status(404).json({ message: "Invalid or expired reset token" });
    }

    if (resetToken.used) {
      return res.status(400).json({ message: "This reset link has already been used" });
    }

    if (new Date() > new Date(resetToken.expiresAt)) {
      return res.status(400).json({ message: "This reset link has expired" });
    }

    res.json({ valid: true, email: resetToken.email });
  } catch (error) {
    console.error("Verify reset token error:", error);
    res.status(500).json({ message: "Failed to verify reset token" });
  }
});

// Password reset - Reset password with token
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (!resetToken) {
      return res.status(404).json({ message: "Invalid or expired reset token" });
    }

    if (resetToken.used) {
      return res.status(400).json({ message: "This reset link has already been used" });
    }

    if (new Date() > new Date(resetToken.expiresAt)) {
      return res.status(400).json({ message: "This reset link has expired" });
    }

    const user = await storage.getUserByEmail(resetToken.email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await hashPassword(newPassword);
    await storage.updateUser(user.id, { password: hashedPassword });

    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));

    console.log(`Password reset successful for: ${user.email}`);

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

app.put("/api/auth/user", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      birthMonth,
      birthYear,
      addressStreet,
      addressCity,
      addressPostcode,
      addressCountry,
    } = req.body;


    let dobString: string | undefined = dateOfBirth;
if (birthMonth && birthYear) {
  dobString = `${birthYear}-${String(birthMonth).padStart(2, "0")}-01`;
}

    const updateData: any = {
      email,
      firstName,
      lastName,
      dateOfBirth:dobString,
      birthMonth,
      birthYear,
      addressStreet,
      addressCity,
      addressPostcode,
      addressCountry,
    };

    if (password) {
  updateData.password = await hashPassword(password);
}

if (email) {
  const existing = await storage.getUserByEmail(email);
  if (existing && existing.id !== userId) {
    return res.status(400).json({ message: "Email already in use" });
  }
}


    const updatedUser = await storage.updateUser(userId, updateData);

    // Broadcast real-time update
    wsManager.broadcast({ type: 'user_updated', userId });

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      dateOfBirth: updatedUser.dateOfBirth,
      addressStreet: updatedUser.addressStreet,
      addressCity: updatedUser.addressCity,
      addressPostcode: updatedUser.addressPostcode,
      addressCountry: updatedUser.addressCountry,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

  // Competition routes
app.get("/api/competitions", async (req, res) => {
  try {
    const competitionsList = await db.select()
      .from(competitions)
      .where(eq(competitions.isActive, true))
      .orderBy(asc(competitions.displayOrder), desc(competitions.createdAt));
    
    // Check visibility settings for game types
    const { gameSpinConfig, gameScratchConfig } = await import("@shared/schema");
    const [spinConfig] = await db.select().from(gameSpinConfig).where(eq(gameSpinConfig.id, "active"));
    const [scratchConfig] = await db.select().from(gameScratchConfig).where(eq(gameScratchConfig.id, "active"));
    
    // Filter out hidden competitions based on game type visibility
    const visibleCompetitions = competitionsList.filter((comp) => {
      if (comp.type === "spin" && spinConfig && spinConfig.isVisible === false) {
        return false;
      }
      if (comp.type === "scratch" && scratchConfig && scratchConfig.isVisible === false) {
        return false;
      }
      return true;
    });
    
    res.json(visibleCompetitions);
  } catch (error) {
    console.error("Error fetching competitions:", error);
    res.status(500).json({ message: "Failed to fetch competitions" });
  }
});

app.get("/api/competitions/:id", async (req, res) => {
  try {
    const competition = await storage.getCompetition(req.params.id);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }
    res.json(competition);
  } catch (error) {
    console.error("Error fetching competition:", error);
    res.status(500).json({ message: "Failed to fetch competition" });
  }
 });

app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
  try {
    const { orderId, quantity, useWalletBalance = false, useRingtonePoints = false } = req.body;
    const userId = req.user.id;

    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ message: "Invalid or missing order ID" });
    }

    console.log("📋 Creating payment for orderId:", orderId); 

    const order = await storage.getOrder(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    
    if (order.userId !== userId) {
      return res.status(403).json({ message: "Not authorized for this order" });
    }

    const competition = await storage.getCompetition(order.competitionId);
    if (!competition) return res.status(404).json({ message: "Competition not found" });

    // Get user's current balances
    const user = await storage.getUser(userId);
    const walletBalance = parseFloat(user?.balance || "0");
    const ringtonePoints = user?.ringtonePoints || 0;
    const pointsValue = ringtonePoints * 0.01;
    
    const totalAmount = parseFloat(order.totalAmount);
    let remainingAmount = totalAmount;
    let walletUsed = 0;
    let pointsUsed = 0;
    
    const paymentBreakdown = [];

    // -------------------------
    // APPLY WALLET IF SELECTED
    // -------------------------
    if (useWalletBalance) {
      walletUsed = Math.min(walletBalance, remainingAmount);
      if (walletUsed > 0) {
        const newBalance = (walletBalance - walletUsed).toFixed(2);
        await storage.updateUserBalance(userId, newBalance);

        await storage.createTransaction({
          userId,
          type: "purchase",
          amount: `-${walletUsed}`,
          description: `Wallet payment for ${competition.title}`,
          orderId,
        });

        remainingAmount -= walletUsed;
        paymentBreakdown.push({
          method: "wallet",
          amount: walletUsed,
        });
      }
    }

    // -------------------------
    // APPLY POINTS IF SELECTED
    // -------------------------
    if (useRingtonePoints && remainingAmount > 0) {
      const pointsToMoney = Math.min(pointsValue, remainingAmount);
      pointsUsed = Math.floor(pointsToMoney * 100); // convert to points (1p)

      if (pointsUsed > 0) {
        const newPoints = ringtonePoints - pointsUsed;

        await storage.updateUserRingtonePoints(userId, newPoints);

        await storage.createTransaction({
          userId,
          type: "purchase",
          amount: `-${pointsUsed}`,
          description: `Ringtone Points payment for ${competition.title}`,
          orderId,
        });

        remainingAmount -= pointsToMoney;
        paymentBreakdown.push({
          method: "points",
          amount: pointsToMoney,
          pointsUsed,
        });
      }
    }

    // Check if anything is left to pay via Cashflows
    if (remainingAmount <= 0) {
      // Fully paid with wallet/points - complete the order immediately
      let paymentMethodText = "pending";
      if (walletUsed > 0 && pointsUsed > 0) {
        paymentMethodText = "Wallet+Points";
      } else if (walletUsed > 0) {
        paymentMethodText = "Wallet Credit";
      } else if (pointsUsed > 0) {
        paymentMethodText = "Points";
      }

      // Update order with payment info
      await storage.updateOrderPaymentInfo(orderId, {
        paymentMethod: paymentMethodText,
        walletAmount: walletUsed.toString(),
        pointsAmount: pointsUsed.toString(),
        cashflowsAmount: "0",
        paymentBreakdown: JSON.stringify(paymentBreakdown),
      });

      await storage.updateOrderStatus(orderId, "completed");

      // Create tickets
      const tickets = [];
      const actualQuantity = quantity || order.quantity || 1;
      for (let i = 0; i < actualQuantity; i++) {
        const ticketNumber = nanoid(8).toUpperCase();
        const ticket = await storage.createTicket({
          userId,
          competitionId: competition.id,
          orderId,
          ticketNumber,
          isWinner: false,
        });
        tickets.push(ticket);
      }

      return res.json({
        success: true,
        message: "Payment completed successfully with wallet/points",
        orderId,
        competitionId: competition.id,
        tickets,
        paymentMethod: paymentMethodText,
        fullyPaid: true,
      });
    }

    // If there's remaining amount, create Cashflows session
    const session = await cashflows.createCompetitionPaymentSession(remainingAmount, {
      orderId,
      competitionId: competition.id,
      userId,
      quantity: (quantity || order.quantity || 1).toString(),
      paymentBreakdown: JSON.stringify(paymentBreakdown),
    });

    if (!session.hostedPageUrl) {
      // If Cashflows fails, refund wallet + points
      if (walletUsed > 0) {
        await storage.updateUserBalance(userId, (walletBalance + walletUsed).toFixed(2));
      }
      if (pointsUsed > 0) {
        await storage.updateUserRingtonePoints(userId, ringtonePoints + pointsUsed);
      }
      
      return res.status(500).json({ message: "Failed to get Cashflows checkout URL" });
    }

    // Save partial payment info
    let paymentMethodText = "Cashflow";
    if (walletUsed > 0 && pointsUsed > 0 && remainingAmount > 0) {
      paymentMethodText = "Wallet+Points+Cashflow";
    } else if (walletUsed > 0 && remainingAmount > 0) {
      paymentMethodText = "Wallet+Cashflow";
    } else if (pointsUsed > 0 && remainingAmount > 0) {
      paymentMethodText = "Points+Cashflow";
    }

    await storage.updateOrderPaymentInfo(orderId, {
      paymentMethod: paymentMethodText,
      walletAmount: walletUsed.toString(),
      pointsAmount: pointsUsed.toString(),
      cashflowsAmount: remainingAmount.toString(),
      paymentBreakdown: JSON.stringify(paymentBreakdown),
    });

    res.json({
      success: true,
      redirectUrl: session.hostedPageUrl,
      sessionId: session.paymentJobReference,
      fullyPaid: false,
      paymentMethod: paymentMethodText,
      remainingAmount,
    });
  } catch (error: any) {
    console.error("❌ Error creating Cashflows session:", error);
    res.status(500).json({
      message: "Failed to create payment session",
      error: error.message,
    });
  }
});



// Update the payment success route (IDEMPOTENT)
app.post("/api/payment-success/competition", isAuthenticated, async (req: any, res) => {
  try {
    const { paymentJobRef, paymentRef, orderId } = req.body;
    const userId = req.user.id;

    if (!paymentJobRef || !paymentRef || !orderId) {
      return res.status(400).json({ message: "Missing paymentJobRef, paymentRef or orderId" });
    }

    console.log("🔍 Confirming Cashflows payment:", { paymentJobRef, paymentRef, orderId });

    // Fetch specific payment
    const payment = await cashflows.getPaymentStatus(paymentJobRef, paymentRef);

    const paymentStatus =
      payment?.status ||
      payment?.data?.status ||
      payment?.data?.paymentStatus ||
      payment?.paymentStatus;

    console.log("📊 Payment Status:", paymentStatus);

    const successStatuses = ["SUCCESS", "COMPLETED", "PAID", "Paid"];
    
    // AUDIT LOG: Payment attempt (before checking status)
    const user = await storage.getUser(userId);
    const balance = parseFloat(user?.balance || "0");
    
    if (!successStatuses.includes(paymentStatus)) {
      await db.insert(auditLogs)
        .values({
          userId,
          userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
          email: user?.email || '',
          action: "payment_failed",
          description: `Payment failed for order ${orderId}. Status: ${paymentStatus}`,
          startBalance: balance,
          endBalance: balance,
          createdAt: new Date(),
        })
        .execute();
        
      return res.status(400).json({ message: `Payment not completed. Status: ${paymentStatus}` });
    }

    // Retrieve order
    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId) {
      await db.insert(auditLogs)
        .values({
          userId,
          userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
          email: user?.email || '',
          action: "order_not_found",
          description: `Order ${orderId} not found or belongs to wrong user`,
          startBalance: balance,
          endBalance: balance,
          createdAt: new Date(),
        })
        .execute();
        
      return res.status(404).json({ message: "Order not found or belongs to wrong user" });
    }

    // Get competition type
    const competition = await storage.getCompetition(order.competitionId);
    if (!competition) {
      await db.insert(auditLogs)
        .values({
          userId,
          userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
          email: user?.email || '',
          action: "competition_not_found",
          description: `Competition not found for order ${orderId}`,
          startBalance: balance,
          endBalance: balance,
          createdAt: new Date(),
        })
        .Execute();
        
      return res.status(404).json({ message: "Competition not found" });
    }

    const competitionType = competition.type || "competition";
    const competitionId = order.competitionId;

    // Idempotency: avoid duplicates
    if (order.status === "completed") {
      await db.insert(auditLogs)
        .values({
          userId,
          userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
          email: user?.email || '',
          action: "order_already_processed",
          description: `Order ${orderId} was already processed`,
          startBalance: balance,
          endBalance: balance,
          createdAt: new Date(),
        })
        .execute();
        
      return res.json({
        success: true,
        orderId,
        competitionId: order.competitionId,
        competitionType,
        alreadyProcessed: true
      });
    }

    const ticketCount = order.quantity;
    const totalAmount = parseFloat(order.totalAmount || "0");

    // AUDIT LOG: Start of competition purchase processing
    const startBalance = parseFloat(user?.balance || "0");
    
    // Log before creating tickets
    await db.insert(auditLogs)
      .values({
        userId,
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
        email: user?.email || '',
        action: "competition_payment_started",
        competitionId,
        description: `Processing payment for ${ticketCount} ticket(s) in ${competition.title}`,
        startBalance: startBalance,
        endBalance: startBalance,
        createdAt: new Date(),
      })
      .execute();

    // Create tickets
    const ticketsCreated = [];
    for (let i = 0; i < ticketCount; i++) {
      const ticket = await storage.createTicket({
        userId,
        competitionId,
        orderId,
        ticketNumber: nanoid(8).toUpperCase(),
      });

      ticketsCreated.push(ticket);
    }

    // Update competition sold number
    await storage.updateCompetitionSoldTickets(competitionId, ticketCount);

    // Mark order complete
    await storage.updateOrderStatus(orderId, "completed");

   // Default action for normal competitions
let auditAction = "competition_purchase";
let auditDescription = `Purchased ${ticketCount} ticket(s) for ${competition.title}`;

// Override based on type
if (competitionType === "spin") {
  auditAction = "spin_purchase";
  auditDescription = `Purchased ${ticketCount} spin(s) for ${competition.title}`;
} else if (competitionType === "scratch") {
  auditAction = "scratch_purchase";
  auditDescription = `Purchased ${ticketCount} scratch card(s) for ${competition.title}`;
} else if (competitionType === "instant") {
  // you can keep this or remove since default already matches
  auditAction = "competition_purchase";
  auditDescription = `Purchased ${ticketCount} competition ticket(s) for ${competition.title}`;
}


    // Calculate end balance (if payment was from wallet)
    let endBalance = startBalance;
    if (order.walletAmount && parseFloat(order.walletAmount) > 0) {
      endBalance = startBalance - parseFloat(order.walletAmount);
    }

    // AUDIT LOG: Successful competition purchase
    await db.insert(auditLogs)
      .values({
        userId,
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
        email: user?.email || '',
        action: auditAction,
        competitionId,
        description: auditDescription,
        startBalance: startBalance,
        endBalance: endBalance,
        createdAt: new Date(),
      })
      .execute();

    console.log(`✅ AUDIT LOG: ${auditAction} recorded for order ${orderId}`);

    // -------------------------
    // SEND ORDER CONFIRMATION EMAIL
    // -------------------------
    try {
      const tickets = await storage.getTicketsByOrderId(order.id);
      const ticketNumbers = tickets.map(t => t.ticketNumber);

      if (user?.email && tickets.length > 0) {
        const orderType = competition.type === 'spin' ? 'spin' :
                          competition.type === 'scratch' ? 'scratch' : 'competition';

        await sendOrderConfirmationEmail(user.email, {
          orderId: order.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
          orderType,
          itemName: competition.title,
          quantity: tickets.length,
          totalAmount: order.totalAmount,
          orderDate: new Date().toLocaleDateString('en-GB', { 
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
          }),
          paymentMethod: 'Card Payment (Cashflows)',
          skillQuestion: competition.skillQuestion || undefined,
          skillAnswer: order.skillAnswer || undefined,
          ticketNumbers: ticketNumbers.length > 0 ? ticketNumbers : undefined,
        });
      }
    } catch (err) {
      console.error('Failed to send order confirmation email for Cashflows payment:', err);
      
      // AUDIT LOG: Email failure
      await db.insert(auditLogs)
        .values({
          userId,
          userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
          email: user?.email || '',
          action: "email_failed",
          competitionId,
          description: `Failed to send confirmation email for order ${orderId}`,
          startBalance: endBalance,
          endBalance: endBalance,
          createdAt: new Date(),
        })
        .execute();
    }

    // Log transaction (cash or points)
    const amount =
      order.pointsAmount > 0 ? `-${order.pointsAmount}` : `-${order.totalAmount}`;

    await storage.createTransaction({
      userId,
      type: "purchase",
      amount,
      description: `Purchased ${ticketCount} ticket(s)`,
      orderId,
    });

    console.log("✅ Competition payment processed successfully!");

    // AUDIT LOG: Final success log
    await db.insert(auditLogs)
      .values({
        userId,
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
        email: user?.email || '',
        action: "payment_complete",
        competitionId,
        description: `Payment completed successfully for ${ticketCount} ${competitionType} entries`,
        startBalance: startBalance,
        endBalance: endBalance,
        createdAt: new Date(),
      })
      .execute();

    return res.json({
      success: true,
      ticketsCreated,
      competitionId,
      orderId,
      competitionType
    });

  } catch (error) {
    console.error("❌ Error confirming competition payment:", error);
    
    // AUDIT LOG: General error
    try {
      const user = await storage.getUser(req.user.id);
      const balance = parseFloat(user?.balance || "0");
      
      await db.insert(auditLogs)
        .values({
          userId: req.user.id,
          userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
          email: user?.email || '',
          action: "payment_error",
          description: `Error processing payment: ${error.message}`,
          startBalance: balance,
          endBalance: balance,
          createdAt: new Date(),
        })
        .execute();
    } catch (auditError) {
      console.error("Failed to log audit error:", auditError);
    }
    
    return res.status(500).json({ message: "Failed to confirm competition payment" });
  }
});


app.get("/api/admin/users/audit/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // USER INFO
    const user = await storage.getUser(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // AUDIT LOGS
    const logs = await db.query.auditLogs.findMany({
      where: (a) => eq(a.userId, id),
      orderBy: (a) => [desc(a.createdAt)],
    });

    // Get competition names (optional)
    const competitionIds = logs
      .filter((l) => l.competitionId)
      .map((l) => l.competitionId);

    const competitions =
      competitionIds.length > 0
        ? await db.query.competitions.findMany({
            where: (c) => inArray(c.id, competitionIds),
          })
        : [];

    // Map competitionId → title
    const compMap = {};
    competitions.forEach((c) => {
      compMap[c.id] = c.title;
    });

    // FORMAT RESPONSE
    const audit = logs.map((log) => ({
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      action: log.action, // FIXED
      competition: log.competitionId ? compMap[log.competitionId] : null,
      startBalance: log.startBalance,
      endBalance: log.endBalance,
      description: log.description, // FIXED
      date: log.createdAt,
    }));

    res.json({ audit });

  } catch (error) {
    console.error("Audit Error", error);
    res.status(500).json({ message: "Audit route failed" });
  }
});

// Add webhook handler for Cashflows notifications
app.post("/api/cashflows/webhook", async (req, res) => {
  const { paymentJobReference, paymentReference } = req.body;

  console.log("🌊 Webhook received", req.body);

  // Always reply immediately
  res.status(200).json({ received: true });

  try {
    const pendingPayment = await db.query.pendingPayments.findFirst({
      where: (p, { eq }) =>
        eq(p.paymentJobReference, paymentJobReference),
    });

    if (!pendingPayment) {
      console.warn("No pending payment:", paymentJobReference);
      return;
    }

    // Save paymentReference if we get it for first time
    if (!pendingPayment.paymentReference && paymentReference) {
      await db.update(pendingPayments)
        .set({ paymentReference })
        .where(eq(pendingPayments.id, pendingPayment.id));
    }

    // Already processed? Stop.
    if (pendingPayment.status === "completed") {
      console.log("Already completed:", paymentJobReference);
      return;
    }

    const payment = await cashflows.getPaymentStatus(
      paymentJobReference,
      paymentReference
    );

    const { status, paidAmount } = normalizeCashflowsStatus(payment);

    console.log("💳 Normalized status", {
      paymentJobReference,
      status,
      paidAmount,
    });

    if (status === "PENDING") return;

    if (status === "FAILED") {
      await db.update(pendingPayments)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(pendingPayments.id, pendingPayment.id));
      return;
    }

    // ✅ PAID
    const finalAmount =
      paidAmount > 0 ? paidAmount : Number(pendingPayment.amount);

    await processWalletTopup(
      pendingPayment.userId,
      paymentReference,
      finalAmount
    );

    await db.update(pendingPayments)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(pendingPayments.id, pendingPayment.id));

    console.log("✅ Wallet credited", paymentJobReference);

  } catch (err) {
    console.error("Webhook error:", err);
  }
});











  // Ticket purchase route
app.post("/api/purchase-ticket", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      orderId,
      competitionId,
      quantity = 1,
      useWalletBalance = false,
      useRingtonePoints = false,
    } = req.body;

    // -------------------------
    // 1️⃣ VALIDATE ORDER
    // -------------------------
    const order = await storage.getOrder(orderId);

    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order already processed" });
    }

    // Load the competition
    const competition = await storage.getCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    const compType = competition.type;
    const totalAmount = parseFloat(order.totalAmount);

    // -------------------------
    // 2️⃣ SOLD-OUT LOGIC (INSTANT ONLY)
    // -------------------------
    if (compType === "instant") {
      const soldTickets = Number(competition.soldTickets || 0);
      const maxTickets = Number(competition.maxTickets || 0);

      if (maxTickets > 0 && soldTickets >= maxTickets) {
        return res.status(400).json({ message: "Competition sold out" });
      }

      const remainingTickets = maxTickets - soldTickets;
      if (quantity > remainingTickets) {
        return res.status(400).json({
          message: `Only ${remainingTickets} tickets remaining`,
        });
      }
    }

    // -------------------------
    // 3️⃣ USER BALANCE + POINTS
    // -------------------------
    const user = await storage.getUser(userId);
    const walletBalance = parseFloat(user?.balance || "0");
    const ringtonePoints = user?.ringtonePoints || 0;
    const pointsValue = ringtonePoints * 0.01;

    let remainingAmount = totalAmount;
    let walletUsed = 0;
    let pointsUsed = 0;

    const paymentBreakdown = [];

    // -------------------------
    // 4️⃣ APPLY WALLET
    // -------------------------
    if (useWalletBalance) {
      walletUsed = Math.min(walletBalance, remainingAmount);
      if (walletUsed > 0) {
        const newBalance = (walletBalance - walletUsed).toFixed(2);
        await storage.updateUserBalance(userId, newBalance);

        await storage.createTransaction({
          userId,
          type: "purchase",
          amount: `-${walletUsed}`,
          description: `Wallet payment for ${competition.title}`,
          orderId,
        });

        remainingAmount -= walletUsed;
        paymentBreakdown.push({
          method: "wallet",
          amount: walletUsed,
        });
      }
    }

    // -------------------------
    // 5️⃣ APPLY POINTS
    // -------------------------
    if (useRingtonePoints && remainingAmount > 0) {
      const pointsToMoney = Math.min(pointsValue, remainingAmount);
      pointsUsed = Math.floor(pointsToMoney * 100); // convert to points (1p)

      if (pointsUsed > 0) {
        const newPoints = ringtonePoints - pointsUsed;

        await storage.updateUserRingtonePoints(userId, newPoints);

        await storage.createTransaction({
          userId,
          type: "purchase",
          amount: `-${pointsUsed}`,
          description: `Ringtone Points payment for ${competition.title}`,
          orderId,
        });

        remainingAmount -= pointsToMoney;
        paymentBreakdown.push({
          method: "points",
          amount: pointsToMoney,
          pointsUsed,
        });
      }
    }

    // -------------------------
    // 6️⃣ CASHFLOWS NEEDED?
    // -------------------------
    if (remainingAmount > 0) {
      
      const session = await cashflows.createCompetitionPaymentSession(
        remainingAmount,
        {
          orderId,
          competitionId,
          userId,
          quantity: quantity.toString(),
          paymentBreakdown: JSON.stringify(paymentBreakdown),
        }
      );

      // In case Cashflows fails: refund wallet + points
      if (!session || !session.hostedPageUrl) {
        if (walletUsed > 0)
          await storage.updateUserBalance(
            userId,
            (walletBalance + walletUsed).toFixed(2)
          );
        if (pointsUsed > 0)
          await storage.updateUserRingtonePoints(userId, ringtonePoints + pointsUsed);

        return res.status(500).json({ message: "Failed to create payment session" });
      }

      // Determine payment method text for mixed payment
      let paymentMethodText = "Cashflow";
      if (walletUsed > 0 && pointsUsed > 0 && remainingAmount > 0) {
        paymentMethodText = "Wallet+Points+Cashflow";
      } else if (walletUsed > 0 && remainingAmount > 0) {
        paymentMethodText = "Wallet+Cashflow";
      } else if (pointsUsed > 0 && remainingAmount > 0) {
        paymentMethodText = "Points+Cashflow";
      }

      // Save partial payment info with descriptive payment method
      await storage.updateOrderPaymentInfo(orderId, {
        paymentMethod: paymentMethodText,
        walletAmount: walletUsed.toString(),
        pointsAmount: pointsUsed.toString(),
        cashflowsAmount: remainingAmount.toString(),
        paymentBreakdown: JSON.stringify(paymentBreakdown),
      });

      return res.json({
        success: true,
        redirectUrl: session.hostedPageUrl,
        sessionId: session.paymentJobReference,
      });
    }

    // -------------------------
    // 7️⃣ FULLY PAID — COMPLETE ORDER
    // -------------------------
    
    // Determine payment method for wallet/points only
    let paymentMethodText = "pending";
    if (walletUsed > 0 && pointsUsed > 0) {
      paymentMethodText = "Wallet+Points";
    } else if (walletUsed > 0) {
      paymentMethodText = "Wallet Credit";
    } else if (pointsUsed > 0) {
      paymentMethodText = "Points";
    }

    // Update order with correct payment method
    await storage.updateOrderPaymentInfo(orderId, {
      paymentMethod: paymentMethodText,
      walletAmount: walletUsed.toString(),
      pointsAmount: pointsUsed.toString(),
      cashflowsAmount: "0",
      paymentBreakdown: JSON.stringify(paymentBreakdown),
    });

    await storage.updateOrderStatus(orderId, "completed");

    // Create tickets
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticketNumber = nanoid(8).toUpperCase();
      const ticket = await storage.createTicket({
        userId,
        competitionId,
        orderId,
        ticketNumber,
        isWinner: false,
      });
      tickets.push(ticket);
    }

    if (compType === "instant") {
      await storage.updateCompetitionSoldTickets(competitionId, quantity);
    }

    try {
      if (user?.email) {
        const ticketNumbers = tickets.map(t => t.ticketNumber);

        await sendOrderConfirmationEmail(user.email, {
          orderId: order.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
          orderType: 'competition',
          itemName: competition.title,
          quantity: quantity,
          totalAmount: order.totalAmount,
          orderDate: new Date().toLocaleDateString('en-GB', { 
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
          }),
          paymentMethod: paymentMethodText,
          ticketNumbers: ticketNumbers.length > 0 ? ticketNumbers : undefined,
        });
      }
    } catch (err) {
      console.error('Failed to send order confirmation email for competition:', err);
    }

    // -------------------------
    // 8️⃣ APPLY REFERRAL BONUS (FIRST PURCHASE ONLY)
    // -------------------------
    try {
      const buyer = user;
      const referrerId = buyer?.referredBy;

      if (referrerId) {
        const userOrders = await storage.getUserOrders(userId);
        const completedOrders = userOrders.filter(
          (o) => o.orders.status === "completed"
        );

        if (completedOrders.length === 1) {
          const bonus = 2;
          const referrer = await storage.getUser(referrerId);

          if (referrer) {
            const newBalance =
              parseFloat(referrer.balance || "0") + bonus;

            await storage.updateUserBalance(referrer.id, newBalance.toFixed(2));

            await storage.createTransaction({
              userId: referrer.id,
              type: "referral",
              amount: bonus.toFixed(2),
              description: `Referral reward: ${buyer.email} made their first competition entry`,
            });
          }
        }
      }
    } catch (err) {
      console.error("Referral error:", err);
    }

    // Refresh user after all deductions
    const updatedUser = await storage.getUser(userId);

    // BALANCE TRACKING
    const startBalance = Number(updatedUser.balance) + Number(totalAmount);
    const endBalance = Number(updatedUser.balance);

    // AUDIT LOG
    await db.insert(auditLogs)
      .values({
        userId,
        userName: `${updatedUser.firstName} ${updatedUser.lastName}`,
        email: updatedUser.email,
        action: "buy_competition",
        competitionId: competition.id,
        description: `Bought ${quantity} ticket(s) for ${competition.title}`,
        startBalance,
        endBalance,
        createdAt: new Date(),
      })
      .execute();

    console.log("✅ AUDIT LOG SAVED");

    // -------------------------
    // 9️⃣ RESPONSE
    // -------------------------
    return res.json({
      success: true,
      message: "Competition entry purchased successfully",
      orderId,
      competitionId,
      tickets,
      paymentMethod: paymentMethodText,
    });
  } catch (error) {
    console.error("Error purchasing ticket:", error);
    res.status(500).json({ message: "Failed to complete purchase" });
  }
});




// NEW: Create spin wheel order (shows billing page)
app.post("/api/create-spin-order", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { competitionId, quantity = 1 } = req.body; // Now we need competitionId

    // Get the competition to get the actual ticket price
    const competition = await storage.getCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    const spinCostPerTicket = parseFloat(competition.ticketPrice);
    const totalAmount = spinCostPerTicket * quantity;

    // Get user's current balances
    const user = await storage.getUser(userId);
    const userBalance = parseFloat(user?.balance || "0");
    const userPoints = user?.ringtonePoints || 0;
    const pointsValue = userPoints * 0.01; // 1 point = £0.01

    // Create pending order for spins
    const order = await storage.createOrder({
      userId,
      competitionId: competitionId, // Use actual competition ID
      quantity,
      totalAmount: totalAmount.toString(),
      paymentMethod: "pending",
      status: "pending",
    });

    res.json({
      success: true,
      orderId: order.id,
      totalAmount,
      quantity,
      userBalance: {
        wallet: userBalance,
        ringtonePoints: userPoints,
        pointsValue: pointsValue
      },
      spinCost: spinCostPerTicket,
      competition: {
        title: competition.title,
        type: competition.type
      }
    });
  } catch (error) {
    console.error("Error creating spin order:", error);
    res.status(500).json({ message: "Failed to create spin order" });
  }
});

// NEW: Process spin wheel payment with multiple options
app.post("/api/process-spin-payment", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { 
      orderId, 
      useWalletBalance = false, 
      useRingtonePoints = false 
    } = req.body;

    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order already processed" });
    }

    // Get competition to verify it's a spin type
    const competition = await storage.getCompetition(order.competitionId);
    if (!competition || competition.type !== "spin") {
      return res.status(400).json({ message: "Invalid competition type" });
    }

    const user = await storage.getUser(userId);
    const totalAmount = parseFloat(order.totalAmount);
    let remainingAmount = totalAmount;
    let walletUsed = 0;
    let pointsUsed = 0;
    let cashflowsUsed = 0;

    const paymentBreakdown = [];

    // Process wallet balance if selected
    if (useWalletBalance) {
      const walletBalance = parseFloat(user?.balance || "0");
      const walletAmount = Math.min(walletBalance, remainingAmount);
      
      if (walletAmount > 0) {
        const newBalance = walletBalance - walletAmount;
        await storage.updateUserBalance(userId, newBalance.toString());
        
        await storage.createTransaction({
          userId,
          type: "purchase",
          amount: `-${walletAmount}`,
          description: `Wallet payment for ${order.quantity} spin(s) - ${competition.title}`,
          orderId,
        });

        walletUsed = walletAmount;
        remainingAmount -= walletAmount;
        paymentBreakdown.push({
          method: "wallet",
          amount: walletAmount,
          description: `Site Credit: £${walletAmount.toFixed(2)}`
        });
      }
    }

    // Process ringtone points if selected
    if (useRingtonePoints && remainingAmount > 0) {
      const availablePoints = user?.ringtonePoints || 0;
      // Convert points to currency (1 point = £0.01)
      const pointsValue = availablePoints * 0.01;
      const pointsAmount = Math.min(pointsValue, remainingAmount);
      
      if (pointsAmount > 0) {
        const pointsToUse = Math.floor(pointsAmount * 100); // Multiply by 100 (1/0.01)
        const newPoints = availablePoints - pointsToUse;
        await storage.updateUserRingtonePoints(userId, newPoints);
        
        await storage.createTransaction({
          userId,
          type: "purchase",
          amount: `-${pointsToUse}`,
          description: `Ringtone points payment for ${order.quantity} spin(s) - ${competition.title}`,
          orderId,
        });

        pointsUsed = pointsToUse;
        remainingAmount -= pointsAmount;
        paymentBreakdown.push({
          method: "ringtone_points",
          amount: pointsAmount,
          pointsUsed: pointsToUse,
          description: `Wolf Points: £${pointsAmount.toFixed(2)} (${pointsToUse} points)`
        });
      }
    }

    // Process remaining amount through Cashflows
    if (remainingAmount > 0) {
      cashflowsUsed = remainingAmount;
      
      const session = await cashflows.createCompetitionPaymentSession(remainingAmount, {
        orderId,
        competitionId: order.competitionId,
        userId,
        quantity: order.quantity.toString(),
        paymentBreakdown: JSON.stringify(paymentBreakdown)
      });

      if (!session.hostedPageUrl) {
        // Refund wallet and points if Cashflows fails
        if (walletUsed > 0) {
          const currentBalance = parseFloat(user?.balance || "0");
          await storage.updateUserBalance(userId, (currentBalance + walletUsed).toString());
        }
        if (pointsUsed > 0) {
          const currentPoints = user?.ringtonePoints || 0;
          await storage.updateUserRingtonePoints(userId, currentPoints + pointsUsed);
        }
        
        return res.status(500).json({ message: "Failed to create Cashflows session" });
      }

      // Determine payment method text for mixed payment
      let paymentMethodText = "Cashflow";
      if (walletUsed > 0 && pointsUsed > 0 && remainingAmount > 0) {
        paymentMethodText = "Wallet+Points+Cashflow";
      } else if (walletUsed > 0 && remainingAmount > 0) {
        paymentMethodText = "Wallet+Cashflow";
      } else if (pointsUsed > 0 && remainingAmount > 0) {
        paymentMethodText = "Points+Cashflow";
      }

      // Update order with partial payment info
      await storage.updateOrderPaymentInfo(orderId, {
        paymentMethod: paymentMethodText,
        walletAmount: walletUsed.toString(),
        pointsAmount: pointsUsed.toString(),
        cashflowsAmount: cashflowsUsed.toString(),
        paymentBreakdown: JSON.stringify(paymentBreakdown)
      });

      return res.json({
        success: true,
        redirectUrl: session.hostedPageUrl,
        sessionId: session.paymentJobReference,
        paymentBreakdown: {
          walletUsed,
          pointsUsed,
          cashflowsUsed,
          remainingAmount
        }
      });
    } else {
      // Full payment completed with wallet/points only
      
      // Determine payment method text
      let paymentMethodText = "pending";
      if (walletUsed > 0 && pointsUsed > 0) {
        paymentMethodText = "Wallet+Points";
      } else if (walletUsed > 0) {
        paymentMethodText = "Wallet Credit";
      } else if (pointsUsed > 0) {
        paymentMethodText = "Points";
      }

      // Update order with correct payment method
      await storage.updateOrderPaymentInfo(orderId, {
        paymentMethod: paymentMethodText,
        walletAmount: walletUsed.toString(),
        pointsAmount: pointsUsed.toString(),
        cashflowsAmount: "0",
        paymentBreakdown: JSON.stringify(paymentBreakdown)
      });

      await storage.updateOrderStatus(orderId, "completed");
      
      // Create tickets for live draw (one per spin purchased)
      // Only create after FULL payment confirmation
      const tickets = [];
      for (let i = 0; i < order.quantity; i++) {
        const ticketNumber = nanoid(8).toUpperCase();
        const ticket = await storage.createTicket({
          userId,
          competitionId: order.competitionId,
          orderId: order.id,
          ticketNumber,
          isWinner: false,
        });
        tickets.push(ticket);
      }

      // -----------------------------
      // 5️⃣ Audit log
      // -----------------------------
      const startBalance = Number(user.balance) + totalAmount;
      const endBalance = Number(user.balance);

      await db.insert(auditLogs).values({
        userId,
        userName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        action: "buy_spin",
        competitionId: competition.id,
        description: `Bought ${order.quantity} spin(s) for ${competition.title}`,
        startBalance,
        endBalance,
        createdAt: new Date(),
      });

      console.log("✅ Spin audit log saved");
      
      // Send order confirmation email (non-blocking)
      if (user?.email) {
        // Use already-created tickets array to avoid extra database query
        const ticketNumbers = tickets.map(t => t.ticketNumber);
        
        sendOrderConfirmationEmail(user.email, {
          orderId: order.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
          orderType: 'spin',
          itemName: competition.title,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          orderDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          paymentMethod: paymentMethodText,
          skillQuestion: competition.skillQuestion || undefined,
          skillAnswer: order.skillAnswer || undefined,
          ticketNumbers: ticketNumbers.length > 0 ? ticketNumbers : undefined,
        }).catch(err => console.error('Failed to send order confirmation email:', err));
      }

      return res.json({
        success: true,
        competitionId: order.competitionId, 
        message: "Payment completed successfully",
        orderId: order.id,
        tickets: tickets.map(t => ({ ticketNumber: t.ticketNumber })),
        spinsPurchased: order.quantity,
        paymentMethod: paymentMethodText,
        paymentBreakdown
      });
    }
  } catch (error) {
    console.error("Error processing spin payment:", error);
    res.status(500).json({ message: "Failed to process payment" });
  }
});

// 🛡️ CRITICAL SAFEGUARD: In-memory cooldown tracker
const spinCooldowns = new Map<string, number>();
const SPIN_COOLDOWN_MS = 3000; // 3 seconds minimum between spins

// SERVER-SIDE: Spin wheel play route with probability and max wins enforcement
app.post("/api/play-spin-wheel", isAuthenticated,  async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId, competitionId } = req.body; // ← ADD competitionId

    if (!orderId || !competitionId) { // ← UPDATE validation
      return res.status(400).json({
        success: false,
        message: "Order ID and Competition ID are required",
      });
    }

    // 🛡️ CRITICAL: Prevent rapid-fire spins (anti-auto-consumption)
    const cooldownKey = `${userId}-${orderId}`;
    const lastSpinTime = spinCooldowns.get(cooldownKey) || 0;
    const now = Date.now();
    const timeSinceLastSpin = now - lastSpinTime;
    
    if (timeSinceLastSpin < SPIN_COOLDOWN_MS) {
      console.warn(`⚠️ Spin blocked for user ${userId}: Too fast (${timeSinceLastSpin}ms)`);
      return res.status(429).json({
        success: false,
        message: "Please wait a moment before spinning again",
        cooldownRemaining: SPIN_COOLDOWN_MS - timeSinceLastSpin,
      });
    }
    
    // Record this spin attempt immediately
    spinCooldowns.set(cooldownKey, now);

    // Verify valid completed order
    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId || order.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "No valid spin purchase found",
      });
    }

    // Check spins remaining
    const spinsUsed = await storage.getSpinsUsed(orderId);
    const spinsRemaining = order.quantity - spinsUsed;

    if (spinsRemaining <= 0) {
      return res.status(400).json({
        success: false,
        message: "No spins remaining in this purchase",
      });
    }

    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 NEW: Get competition to know which wheel type
    const competition = await storage.getCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }
    
    // Get wheel type (default to "wheel1" for backward compatibility)
    const wheelType = competition.wheelType || "wheel1";

    // 🔥 NEW: Fetch correct wheel configuration based on wheel type
    let wheelConfig;
    if (wheelType === "wheel2") {
      // Use Wheel 2 configuration
      const [config] = await db.select().from(spinWheel2Configs).where(eq(spinWheel2Configs.id, "active"));
      wheelConfig = config || DEFAULT_SPIN_WHEEL_2_CONFIG; // You need to create this default
      console.log(`🎡 Using Wheel 2 configuration for competition ${competitionId}`);
    } else {
      // Use original Wheel 1 configuration (default)
      const [config] = await db.select().from(gameSpinConfig).where(eq(gameSpinConfig.id, "active"));
      wheelConfig = config || DEFAULT_SPIN_WHEEL_CONFIG;
      console.log(`🎡 Using Wheel 1 configuration for competition ${competitionId}`);
    }
    
    const segments = wheelConfig.segments as any[];

    // Filter out segments that reached maxWins limit AND have zero probability
    const eligibleSegments = [];
    for (const segment of segments) {
      // Skip segments with zero or negative probability
      if (!segment.probability || segment.probability <= 0) {
        continue;
      }
      
      // Skip segments that reached maxWins limit
      if (segment.maxWins !== null) {
        const winCount = await storage.getSegmentWinCount(segment.id);
        if (winCount >= segment.maxWins) {
          continue;
        }
      }
      
      eligibleSegments.push(segment);
    }

    if (eligibleSegments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No prizes available at this time",
      });
    }

    // Weighted random selection (mathematically correct)
    const totalWeight = eligibleSegments.reduce((sum, seg) => sum + seg.probability, 0);
    
    if (totalWeight <= 0) {
      return res.status(500).json({
        success: false,
        message: "Invalid wheel configuration - total probability is zero",
      });
    }
    
    let random = Math.random() * totalWeight;
    let selectedSegment = eligibleSegments[0];

    for (const segment of eligibleSegments) {
      random -= segment.probability;
      if (random <= 0) {
        selectedSegment = segment;
        break;
      }
    }

    // Record spin usage
    await storage.recordSpinUsage(orderId, userId);

    // Record the win (with wheel type for tracking)
    await storage.recordSpinWin({
      userId,
      segmentId: selectedSegment.id,
      rewardType: selectedSegment.rewardType,
      rewardValue: String(selectedSegment.rewardValue),
      // Optionally add wheelType to spinWins table if needed
    });

    // Validate and award prize based on type
    if (selectedSegment.rewardType === "cash" && selectedSegment.rewardValue) {
      const amount = typeof selectedSegment.rewardValue === 'number' 
        ? selectedSegment.rewardValue 
        : parseFloat(String(selectedSegment.rewardValue));
      
      if (isNaN(amount) || amount < 0) {
        return res.status(500).json({
          success: false,
          message: "Invalid cash prize configuration",
        });
      }
      
      const finalBalance = parseFloat(user.balance || "0") + amount;
      await storage.updateUserBalance(userId, finalBalance.toFixed(2));

      await storage.createTransaction({
        userId,
        type: "prize",
        amount: amount.toFixed(2),
        description: `Spin Wheel ${wheelType} Prize - £${amount}`,
      });

      await storage.createWinner({
        userId,
        competitionId: null,
        prizeDescription: selectedSegment.label,
        prizeValue: `£${amount}`,
        imageUrl: null,
        isShowcase: false,
      });
    } else if (selectedSegment.rewardType === "points" && selectedSegment.rewardValue) {
      const points = typeof selectedSegment.rewardValue === 'number'
        ? Math.floor(selectedSegment.rewardValue)
        : parseInt(String(selectedSegment.rewardValue));
      
      if (isNaN(points) || points < 0) {
        return res.status(500).json({
          success: false,
          message: "Invalid points prize configuration",
        });
      }
      
      const newPoints = (user.ringtonePoints || 0) + points;
      await storage.updateUserRingtonePoints(userId, newPoints);

      await storage.createTransaction({
        userId,
        type: "prize",
        amount: points.toString(),
        description: `Spin Wheel ${wheelType} Prize - ${points} Ringtones`,
      });

      await storage.createWinner({
        userId,
        competitionId: null,
        prizeDescription: selectedSegment.label,
        prizeValue: `${points} Ringtones`,
        imageUrl: null,
        isShowcase: false,
      });
    }

    // Return full segment payload for frontend animation
    res.json({
      success: true,
      result: {
        segmentId: selectedSegment.id,
        label: selectedSegment.label,
        type: selectedSegment.rewardType,
        value: selectedSegment.rewardValue,
        iconKey: selectedSegment.iconKey,
        color: selectedSegment.color,
      },
      winningSegmentId: selectedSegment.id,
      prize: {
        brand: selectedSegment.label,
        amount: selectedSegment.rewardType === "cash" 
          ? parseFloat(String(selectedSegment.rewardValue))
          : selectedSegment.rewardType === "points"
          ? `${selectedSegment.rewardValue} Ringtones`
          : 0,
        type: selectedSegment.rewardType === "lose" ? "none" : selectedSegment.rewardType
      },
      spinsRemaining: spinsRemaining - 1,
      orderId: order.id,
      wheelType: wheelType, // ← Send back which wheel was used
    });
  } catch (error) {
    console.error("Error playing spin wheel:", error);
    res.status(500).json({ message: "Failed to play spin wheel" });
  }
});


// Reveal All Spins - Batch process remaining spins
app.post("/api/reveal-all-spins", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId, count, competitionId } = req.body;

    if (!orderId || !count || count <= 0 || !competitionId) {
      return res.status(400).json({
        success: false,
        message: "Valid orderId, count and competitionId are required",
      });
    }

    const batchSize = count;

    // Verify order
    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId || order.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "No valid spin purchase found",
      });
    }

    // Check spins remaining
    const spinsUsed = await storage.getSpinsUsed(orderId);
    const spinsRemaining = order.quantity - spinsUsed;
    if (spinsRemaining <= 0) {
      return res.status(400).json({
        success: false,
        message: "No spins remaining in this purchase",
      });
    }

    const spinsToProcess = Math.min(batchSize, spinsRemaining);

    // Fetch user
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch competition with wheelType
    const competition = await storage.getCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    const wheelType = competition.wheelType || "wheel1";

    const results = [];
    let totalCash = 0;
    let totalPoints = 0;

    await db.transaction(async (tx) => {

      // ✅ LOAD WHEEL CONFIG BASED ON TYPE
      let wheelConfig;

      if (wheelType === "wheel2") {
        const [cfg] = await tx
          .select()
          .from(spinWheel2Configs)
          .where(eq(spinWheel2Configs.id, "active"));
        wheelConfig = cfg || DEFAULT_SPIN_WHEEL_2_CONFIG;
      } else {
        const [cfg] = await tx
          .select()
          .from(gameSpinConfig)
          .where(eq(gameSpinConfig.id, "active"));
        wheelConfig = cfg || DEFAULT_SPIN_WHEEL_CONFIG;
      }

      const segments = wheelConfig.segments as any[];

      // --------------------------------------
      // 🚀 PROCESS SPINS
      // --------------------------------------
      for (let i = 0; i < spinsToProcess; i++) {

        // Filter eligible segments
        const eligibleSegments = [];
        for (const segment of segments) {
          if (!segment.probability || segment.probability <= 0) continue;

          if (segment.maxWins !== null) {
            const [winData] = await tx
              .select({ count: sql<number>`count(*)` })
              .from(spinWins)
              .where(eq(spinWins.segmentId, segment.id));
            const winCount = winData?.count || 0;

            if (winCount >= segment.maxWins) continue;
          }

          eligibleSegments.push(segment);
        }

        if (eligibleSegments.length === 0) break;

        // Weighted random
        const totalWeight = eligibleSegments.reduce((sum, seg) => sum + seg.probability, 0);
        let random = Math.random() * totalWeight;
        let selectedSegment = eligibleSegments[0];

        for (const seg of eligibleSegments) {
          random -= seg.probability;
          if (random <= 0) {
            selectedSegment = seg;
            break;
          }
        }

        // Record spin usage
        await tx.insert(spinUsage).values({
          orderId,
          userId,
          usedAt: new Date(),
        });

        // Record win
        await tx.insert(spinWins).values({
          userId,
          segmentId: selectedSegment.id,
          rewardType: selectedSegment.rewardType as any,
          rewardValue: String(selectedSegment.rewardValue),
        });

        // Award prize
        let prizeAmount: number | string = 0;
        let prizeType = "none";

        if (selectedSegment.rewardType === "cash" && selectedSegment.rewardValue) {
          const amount = typeof selectedSegment.rewardValue === 'number' 
            ? selectedSegment.rewardValue 
            : parseFloat(String(selectedSegment.rewardValue));

          totalCash += amount;

           const currentBalance = parseFloat(user.balance || "0");
          user.balance = (currentBalance + amount).toFixed(2);
          
          await tx
            .update(users)

          await tx.update(users)
            .set({ balance: user.balance })
            .where(eq(users.id, userId));

          await tx.insert(transactions).values({
            id: crypto.randomUUID(),
            userId,
            type: "prize",
            amount: amount.toFixed(2),
            description: `Spin Wheel Prize - £${amount}`,
            createdAt: new Date(),
          });

          await tx.insert(winners).values({
            id: crypto.randomUUID(),
            userId,
            competitionId: null,
            prizeDescription: selectedSegment.label,
            prizeValue: `£${amount}`,
            imageUrl: null,
            isShowcase: false,
            createdAt: new Date(),
          });

          prizeAmount = amount;
          prizeType = "cash";
        }

        else if (selectedSegment.rewardType === "points" && selectedSegment.rewardValue) {
          const points = typeof selectedSegment.rewardValue === 'number'
            ? Math.floor(selectedSegment.rewardValue)
            : parseInt(String(selectedSegment.rewardValue));
          totalPoints += points;

           const currentPoints = user.ringtonePoints || 0;
          user.ringtonePoints = currentPoints + points;
          
          await tx
            .update(users)

          await tx.update(users)
            .set({ ringtonePoints: user.ringtonePoints })
            .where(eq(users.id, userId));

          await tx.insert(transactions).values({
            id: crypto.randomUUID(),
            userId,
            type: "prize",
            amount: points.toString(),
            description: `Spin Wheel Prize - ${points} Ringtones`,
            createdAt: new Date(),
          });

          await tx.insert(winners).values({
            id: crypto.randomUUID(),
            userId,
            competitionId: null,
            prizeDescription: selectedSegment.label,
            prizeValue: `${points} Ringtones`,
            imageUrl: null,
            isShowcase: false,
            createdAt: new Date(),
          });

          prizeAmount = `${points} Ringtones`;
          prizeType = "points";
        }

        results.push({
          segmentId: selectedSegment.id,
          label: selectedSegment.label,
          prize: {
            brand: selectedSegment.label,
            amount: prizeAmount,
            type: prizeType,
          },
        });
      }
    });

    // --------------------------------------
    // DONE
    // --------------------------------------
    res.json({
      success: true,
      spins: results,
      summary: {
        totalCash,
        totalPoints,
        spinsProcessed: results.length,
      },
      spinsRemaining: spinsRemaining - results.length,
    });

  } catch (error) {
    console.error("Error revealing all spins:", error);
    res.status(500).json({ message: "Failed to reveal all spins" });
  }
});


// Get spin order details for billing page
app.get("/api/spin-order/:orderId", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order not found" });
    }

    const user = await storage.getUser(userId);
    const used = await storage.getSpinsUsed(orderId);
    const remaining = order.quantity - used;
    res.json({
      order: {
        id: order.id,
         competitionId: order.competitionId,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        status: order.status,
         remainingPlays: remaining,
        used : used
      },
      user: {
        balance: user?.balance || "0",
        ringtonePoints: user?.ringtonePoints || 0
      },
      spinCost: 2 // £2 per spin
    });
  } catch (error) {
    console.error("Error fetching spin order:", error);
    res.status(500).json({ message: "Failed to fetch spin order" });
  }
});

// Spin History

// Get competition order details for billing page
app.get("/api/order/:orderId", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order not found" });
    }

    const competition = await storage.getCompetition(order.competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    // Verify this is a regular competition (not spin or scratch)
    const competitionType = competition.type?.toLowerCase();
    if (competitionType === "spin" || competitionType === "scratch") {
      return res.status(400).json({ 
        message: "Use appropriate endpoint for this order type" 
      });
    }

    const user = await storage.getUser(userId);
    
    res.json({
      order: {
        id: order.id,
        competitionId: order.competitionId,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        status: order.status,
      },
      user: {
        balance: user?.balance || "0",
        ringtonePoints: user?.ringtonePoints || 0,
      },
      competition: {
        title: competition.title,
        ticketPrice: competition.ticketPrice,
        type: competition.type,
      },
    });
  } catch (error) {
    console.error("Error fetching competition order:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

// NEW: Create regular competition order (shows billing page)
app.post("/api/create-competition-order", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { competitionId, quantity = 1 } = req.body;

    const competition = await storage.getCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    // Verify it's a regular competition, not spin or scratch
    if (competition.type === "spin" || competition.type === "scratch") {
      return res.status(400).json({ message: "Use appropriate endpoint for this competition type" });
    }

    const ticketPrice = parseFloat(competition.ticketPrice);
    const totalAmount = ticketPrice * quantity;

    const user = await storage.getUser(userId);
    const userBalance = parseFloat(user?.balance || "0");
    const userPoints = user?.ringtonePoints || 0;
    const pointsValue = userPoints * 0.01;

    // Create pending order for regular competition
    const order = await storage.createOrder({
      userId,
      competitionId,
      quantity,
      totalAmount: totalAmount.toString(),
      paymentMethod: "pending",
      status: "pending",
    });

    res.json({
      success: true,
      orderId: order.id,
      competitionId,
      totalAmount,
      quantity,
      userBalance: {
        wallet: userBalance,
        ringtonePoints: userPoints,
        pointsValue,
      },
      ticketPrice,
      competition: {
        title: competition.title,
        type: competition.type,
      },
    });
  } catch (error) {
    console.error("Error creating competition order:", error);
    res.status(500).json({ message: "Failed to create competition order" });
  }
});

app.post("/api/create-scratch-order", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { competitionId, quantity = 1 } = req.body;

    const competition = await storage.getCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    const scratchCostPerCard = parseFloat(competition.ticketPrice);
    const totalAmount = scratchCostPerCard * quantity;

    const user = await storage.getUser(userId);
    const userBalance = parseFloat(user?.balance || "0");
    const userPoints = user?.ringtonePoints || 0;
    const pointsValue = userPoints * 0.01;

    const order = await storage.createOrder({
      userId,
      competitionId,
      quantity,
      totalAmount: totalAmount.toString(),
      paymentMethod: "pending",
      status: "pending",
    });

    res.json({
      success: true,
      orderId: order.id,
      competitionId: competitionId,
      totalAmount,
      quantity,
      userBalance: {
        wallet: userBalance,
        ringtonePoints: userPoints,
        pointsValue,
      },
      scratchCost: scratchCostPerCard,
      competition: {
        title: competition.title,
        type: competition.type,
      },
    });
  } catch (error) {
    console.error("Error creating scratch order:", error);
    res.status(500).json({ message: "Failed to create scratch order" });
  }
});

app.post("/api/process-scratch-payment", isAuthenticated,  async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId, useWalletBalance = false, useRingtonePoints = false } = req.body;

    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order already processed" });
    }

    const competition = await storage.getCompetition(order.competitionId);
    if (!competition || competition.type !== "scratch") {
      return res.status(400).json({ message: "Invalid competition type" });
    }

    const user = await storage.getUser(userId);
    const totalAmount = parseFloat(order.totalAmount);
    let remainingAmount = totalAmount;
    let walletUsed = 0;
    let pointsUsed = 0;
    let cashflowsUsed = 0;

    const paymentBreakdown = [];

    // Wallet
    if (useWalletBalance) {
      const walletBalance = parseFloat(user?.balance || "0");
      const walletAmount = Math.min(walletBalance, remainingAmount);

      if (walletAmount > 0) {
        const newBalance = walletBalance - walletAmount;
        await storage.updateUserBalance(userId, newBalance.toString());
        await storage.createTransaction({
          userId,
          type: "purchase",
          amount: `-${walletAmount}`,
          description: `Wallet payment for ${order.quantity} scratch card(s) - ${competition.title}`,
          orderId,
        });

        walletUsed = walletAmount;
        remainingAmount -= walletAmount;
        paymentBreakdown.push({
          method: "wallet",
          amount: walletAmount,
          description: `Wallet: £${walletAmount.toFixed(2)}`,
        });
      }
    }

    // Ringtone Points
    if (useRingtonePoints && remainingAmount > 0) {
      const availablePoints = user?.ringtonePoints || 0;
      const pointsValue = availablePoints * 0.01;
      const pointsAmount = Math.min(pointsValue, remainingAmount);

      if (pointsAmount > 0) {
        const pointsToUse = Math.floor(pointsAmount * 100);
        const newPoints = availablePoints - pointsToUse;
        await storage.updateUserRingtonePoints(userId, newPoints);
        await storage.createTransaction({
          userId,
          type: "purchase",
          amount: `-${pointsToUse}`,
          description: `Ringtone points payment for ${order.quantity} scratch card(s) - ${competition.title}`,
          orderId,
        });

        pointsUsed = pointsToUse;
        remainingAmount -= pointsAmount;
        paymentBreakdown.push({
          method: "ringtone_points",
          amount: pointsAmount,
          pointsUsed: pointsToUse,
          description: `Wolf Points: £${pointsAmount.toFixed(2)} (${pointsToUse} points)`,
        });
      }
    }

    // Cashflows (for remaining)
    if (remainingAmount > 0) {
      cashflowsUsed = remainingAmount;

      const session = await cashflows.createCompetitionPaymentSession(remainingAmount, {
        orderId,
        competitionId: order.competitionId,
        userId,
        quantity: order.quantity.toString(),
        paymentBreakdown: JSON.stringify(paymentBreakdown),
      });

      if (!session.hostedPageUrl) {
        // Refund wallet + points if Cashflows fails
        if (walletUsed > 0) {
          const currentBalance = parseFloat(user?.balance || "0");
          await storage.updateUserBalance(userId, (currentBalance + walletUsed).toString());
        }
        if (pointsUsed > 0) {
          const currentPoints = user?.ringtonePoints || 0;
          await storage.updateUserRingtonePoints(userId, currentPoints + pointsUsed);
        }

        return res.status(500).json({ message: "Failed to create Cashflows session" });
      }

      // Determine payment method text for mixed payment
      let paymentMethodText = "Cashflow";
      if (walletUsed > 0 && pointsUsed > 0 && remainingAmount > 0) {
        paymentMethodText = "Wallet+Points+Cashflow";
      } else if (walletUsed > 0 && remainingAmount > 0) {
        paymentMethodText = "Wallet+Cashflow";
      } else if (pointsUsed > 0 && remainingAmount > 0) {
        paymentMethodText = "Points+Cashflow";
      }

      await storage.updateOrderPaymentInfo(orderId, {
        paymentMethod: paymentMethodText,
        walletAmount: walletUsed.toString(),
        pointsAmount: pointsUsed.toString(),
        cashflowsAmount: cashflowsUsed.toString(),
        paymentBreakdown: JSON.stringify(paymentBreakdown),
      });

      return res.json({
        success: true,
        redirectUrl: session.hostedPageUrl,
        sessionId: session.paymentJobReference,
        paymentBreakdown,
      });
    } else {
      // Fully covered by wallet/points
      
      // Determine payment method text
      let paymentMethodText = "pending";
      if (walletUsed > 0 && pointsUsed > 0) {
        paymentMethodText = "Wallet+Points";
      } else if (walletUsed > 0) {
        paymentMethodText = "Wallet Credit";
      } else if (pointsUsed > 0) {
        paymentMethodText = "Points";
      }

      // Update order with correct payment method
      await storage.updateOrderPaymentInfo(orderId, {
        paymentMethod: paymentMethodText,
        walletAmount: walletUsed.toString(),
        pointsAmount: pointsUsed.toString(),
        cashflowsAmount: "0",
        paymentBreakdown: JSON.stringify(paymentBreakdown),
      });

      await storage.updateOrderStatus(orderId, "completed");
      
      // Create tickets for live draw (one per scratch card purchased)
      // Only create after FULL payment confirmation
      const tickets = [];
      for (let i = 0; i < order.quantity; i++) {
        const ticketNumber = nanoid(8).toUpperCase();
        const ticket = await storage.createTicket({
          userId,
          competitionId: order.competitionId,
          orderId: order.id,
          ticketNumber,
          isWinner: false,
        });
        tickets.push(ticket);
      }

      // -----------------------------
      // 5️⃣ Audit log
      // -----------------------------
      const startBalance = Number(user.balance) + totalAmount;
      const endBalance = Number(user.balance);

      await db.insert(auditLogs).values({
        userId,
        userName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        action: "buy_scratch",
        competitionId: competition.id,
        description: `Bought ${order.quantity} scratch(s) for ${competition.title}`,
        startBalance,
        endBalance,
        createdAt: new Date(),
      });

      console.log("✅ Scratch audit log saved");

      // Send order confirmation email (non-blocking)
      if (user?.email) {
        // Use already-created tickets array to avoid extra database query
        const ticketNumbers = tickets.map(t => t.ticketNumber);
        
        sendOrderConfirmationEmail(user.email, {
          orderId: order.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
          orderType: 'scratch',
          itemName: competition.title,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          orderDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          paymentMethod: paymentMethodText,
          skillQuestion: competition.skillQuestion || undefined,
          skillAnswer: order.skillAnswer || undefined,
          ticketNumbers: ticketNumbers.length > 0 ? ticketNumbers : undefined,
        }).catch(err => console.error('Failed to send order confirmation email:', err));
      }

      return res.json({
        success: true,
        competitionId: order.competitionId,
        message: "Scratch card purchase completed",
        orderId: order.id,
        tickets: tickets.map(t => ({ ticketNumber: t.ticketNumber })),
        cardsPurchased: order.quantity,
        paymentMethod: paymentMethodText,
        paymentBreakdown,
      });
    }
  } catch (error) {
    console.error("Error processing scratch payment:", error);
    res.status(500).json({ message: "Failed to process scratch payment" });
  }
});

// 🛡️ SERVER-SIDE: Scratch card play with probability and max wins enforcement
app.post("/api/play-scratch-carddd", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Verify valid completed order
    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId || order.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "No valid scratch card purchase found",
      });
    }

    // Check cards remaining
    const used = await storage.getScratchCardsUsed(orderId);
    const remaining = order.quantity - used;

    if (remaining <= 0) {
      return res.status(400).json({
        success: false,
        message: "No scratch cards remaining in this purchase",
      });
    }

    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🛡️ ATOMIC TRANSACTION: Prevent race conditions and ensure maxWins cannot be bypassed
    let selectedPrize;
    let prizeResponse = { type: "none", value: "0" };

    try {
      await db.transaction(async (tx) => {
        // 🔒 Lock and fetch eligible prizes (FOR UPDATE ensures atomic check)
        const allPrizes = await tx
          .select()
          .from(scratchCardImages)
          .where(eq(scratchCardImages.isActive, true))
          .for('update');

        if (!allPrizes || allPrizes.length === 0) {
          throw new Error("No prizes configured");
        }

        // Filter prizes that haven't reached maxWins
        const eligiblePrizes = allPrizes.filter(prize => {
          if (!prize.weight || prize.weight <= 0) return false;
          if (prize.maxWins !== null && prize.quantityWon >= prize.maxWins) return false;
          return true;
        });

        if (eligiblePrizes.length === 0) {
          throw new Error("No prizes available");
        }

        // Weighted random selection
        const totalWeight = eligiblePrizes.reduce((sum, prize) => sum + prize.weight, 0);
        if (totalWeight <= 0) {
          throw new Error("Invalid prize weights");
        }

        let random = Math.random() * totalWeight;
        selectedPrize = eligiblePrizes[0];

        for (const prize of eligiblePrizes) {
          random -= prize.weight;
          if (random <= 0) {
            selectedPrize = prize;
            break;
          }
        }

        // 🔒 Record scratch card usage INSIDE transaction (atomic operation)
        await tx.insert(scratchCardUsage).values({
          orderId,
          userId,
          usedAt: new Date()
        });

        // ✅ Only update win count and record win for ACTUAL prizes (not try_again or lose)
        if (selectedPrize.rewardType !== 'try_again' && selectedPrize.rewardType !== 'lose') {
          // Update prize win count atomically
          await tx
            .update(scratchCardImages)
            .set({ quantityWon: selectedPrize.quantityWon + 1 })
            .where(eq(scratchCardImages.id, selectedPrize.id));

          // Record the win
          await tx.insert(scratchCardWins).values({
            userId,
            prizeId: selectedPrize.id,
            rewardType: selectedPrize.rewardType as any,
            rewardValue: String(selectedPrize.rewardValue),
          });
        }
      });
    } catch (error: any) {
      console.error("Transaction error in scratch card:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to process scratch card",
      });
    }

    // 🎯 Award prize based on type (outside transaction for non-critical updates)
    if (selectedPrize.rewardType === "cash" && selectedPrize.rewardValue) {
      const amount = typeof selectedPrize.rewardValue === 'number' 
        ? selectedPrize.rewardValue 
        : parseFloat(String(selectedPrize.rewardValue));
      
      if (isNaN(amount) || amount < 0) {
        return res.status(500).json({
          success: false,
          message: "Invalid cash prize configuration",
        });
      }
      
      const finalBalance = parseFloat(user.balance || "0") + amount;
      await storage.updateUserBalance(userId, finalBalance.toFixed(2));

      await storage.createTransaction({
        userId,
        type: "prize",
        amount: amount.toFixed(2),
        description: `Scratch Card Prize - £${amount}`,
      });

      await storage.createWinner({
        userId,
        competitionId: null,
        prizeDescription: "Scratch Card Prize",
        prizeValue: `£${amount}`,
        imageUrl: null,
        isShowcase: false,
      });

      prizeResponse = { type: "cash", value: amount.toFixed(2) };

    } else if (selectedPrize.rewardType === "points" && selectedPrize.rewardValue) {
      const points = typeof selectedPrize.rewardValue === 'number'
        ? selectedPrize.rewardValue
        : parseInt(String(selectedPrize.rewardValue));

      if (isNaN(points) || points < 0) {
        return res.status(500).json({
          success: false,
          message: "Invalid points prize configuration",
        });
      }

      const newPoints = (user.ringtonePoints || 0) + points;
      await storage.updateUserRingtonePoints(userId, newPoints);

      await storage.createTransaction({
        userId,
        type: "prize",
        amount: points.toString(),
        description: `Scratch Card Prize - ${points} Ringtones`,
      });

      await storage.createWinner({
        userId,
        competitionId: null,
        prizeDescription: "Scratch Card Prize",
        prizeValue: `${points} Ringtones`,
        imageUrl: null,
        isShowcase: false,
      });

      prizeResponse = { type: "points", value: points.toString() };

    } else if (selectedPrize.rewardType === "physical") {
      // Physical prize - just record the win
      await storage.createWinner({
        userId,
        competitionId: null,
        prizeDescription: `Scratch Card Prize - ${selectedPrize.label}`,
        prizeValue: selectedPrize.label,
        imageUrl: null,
        isShowcase: false,
      });

      prizeResponse = { type: "physical", value: selectedPrize.label };
    }
    // else: lose or try_again returns { type: "none", value: "0" }

    res.json({
      success: true,
      prize: prizeResponse,
      prizeLabel: selectedPrize.label,
      remainingCards: remaining - 1,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Error playing scratch card:", error);
    res.status(500).json({ message: "Failed to play scratch card" });
  }
});

// Reveal All Scratch Cards - Batch process remaining scratch cards
app.post("/api/reveal-all-scratch-cards", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId, count } = req.body;

    if (!orderId || !count || count <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid orderId and count are required",
      });
    }

    // Process all remaining scratch cards (no cap)
    const batchSize = count;

    // Verify valid completed order
    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId || order.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "No valid scratch card purchase found",
      });
    }

    // Check cards remaining
    const cardsUsed = await storage.getScratchCardsUsed(orderId);
    const cardsRemaining = order.quantity - cardsUsed;

    if (cardsRemaining <= 0) {
      return res.status(400).json({
        success: false,
        message: "No scratch cards remaining in this purchase",
      });
    }

    // Actual cards to process (safety check to prevent over-processing)
    const cardsToProcess = Math.min(batchSize, cardsRemaining);

    if (cardsToProcess <= 0 || cardsToProcess > cardsRemaining) {
      return res.status(400).json({
        success: false,
        message: "Invalid number of cards to process",
      });
    }

    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // OPTIMIZED: Process all scratch cards with batch operations
    const results: Array<{ prize: { type: string; value: string } }> = [];
    let totalCash = 0;
    let totalPoints = 0;

    // Use a single transaction for all database operations
    await db.transaction(async (tx) => {
      // Fetch all active prizes once
      const allPrizes = await tx
        .select()
        .from(scratchCardImages)
        .where(eq(scratchCardImages.isActive, true))
        .for('update');

      if (!allPrizes || allPrizes.length === 0) {
        throw new Error("No prizes configured");
      }

      // Track win counts during this batch
      const prizeWinCounts = new Map<string, number>();
      allPrizes.forEach(prize => {
        prizeWinCounts.set(prize.id, prize.quantityWon || 0);
      });

      // Pre-select all prizes using weighted random selection
      const selectedPrizes = [];
      for (let i = 0; i < cardsToProcess; i++) {
        // Filter eligible prizes based on current win counts
        const eligiblePrizes = allPrizes.filter(prize => {
          if (!prize.weight || prize.weight <= 0) return false;
          const currentWins = prizeWinCounts.get(prize.id) || 0;
          if (prize.maxWins !== null && currentWins >= prize.maxWins) return false;
          return true;
        });

        if (eligiblePrizes.length === 0) {
          selectedPrizes.push(null);
          continue;
        }

        // Weighted random selection
        const totalWeight = eligiblePrizes.reduce((sum, prize) => sum + prize.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedPrize = eligiblePrizes[0];

        for (const prize of eligiblePrizes) {
          random -= prize.weight;
          if (random <= 0) {
            selectedPrize = prize;
            break;
          }
        }

        selectedPrizes.push(selectedPrize);
        
        // Update win count for next iteration
        if (selectedPrize.rewardType !== 'try_again') {
          prizeWinCounts.set(selectedPrize.id, (prizeWinCounts.get(selectedPrize.id) || 0) + 1);
        }
      }

      // Batch insert all scratch card usages
      const usageValues = Array.from({ length: cardsToProcess }, () => ({
        orderId,
        userId,
        usedAt: new Date()
      }));
      await tx.insert(scratchCardUsage).values(usageValues);

      // Batch update prize win counts and batch insert win records
      const prizeUpdates = new Map<string, number>();
      const winRecords = [];

      for (const selectedPrize of selectedPrizes) {
        if (!selectedPrize || selectedPrize.rewardType === 'try_again') continue;
        
        prizeUpdates.set(selectedPrize.id, (prizeUpdates.get(selectedPrize.id) || 0) + 1);
        
        winRecords.push({
          userId,
          prizeId: selectedPrize.id,
          rewardType: selectedPrize.rewardType as any,
          rewardValue: String(selectedPrize.rewardValue),
        });
      }

      // Update all prize win counts in batch
      for (const [prizeId, increment] of prizeUpdates.entries()) {
        const prize = allPrizes.find(p => p.id === prizeId);
        if (prize) {
          await tx
            .update(scratchCardImages)
            .set({ quantityWon: (prize.quantityWon || 0) + increment })
            .where(eq(scratchCardImages.id, prizeId));
        }
      }

      // Batch insert all win records
      if (winRecords.length > 0) {
        await tx.insert(scratchCardWins).values(winRecords);
      }

      // Process each selected prize for user rewards and results
      for (const selectedPrize of selectedPrizes) {
        let prizeResponse = { type: "none", value: "0" };
        
        if (!selectedPrize) {
          results.push({ prize: prizeResponse });
          continue;
        }

        // Award prize based on type
        if (selectedPrize.rewardType === "cash" && selectedPrize.rewardValue) {
          const amount = parseFloat(String(selectedPrize.rewardValue));
          
          // 🔒 CRITICAL: Update balance using tx (not global db)
          // Track cumulative total for response
          totalCash += amount;
          
          // Get current balance from user object and add this prize
          const currentBalance = parseFloat(user.balance || "0");
          user.balance = (currentBalance + amount).toFixed(2); // Update user object for next iteration
          
          await tx
            .update(users)
            .set({ balance: user.balance })
            .where(eq(users.id, userId));

          await tx.insert(transactions).values({
            id: crypto.randomUUID(),
            userId,
            type: "prize",
            amount: amount.toFixed(2),
            description: `Scratch Card Prize - £${amount}`,
            createdAt: new Date(),
          });

          await tx.insert(winners).values({
            id: crypto.randomUUID(),
            userId,
            competitionId: null,
            prizeDescription: "Scratch Card Prize",
            prizeValue: `£${amount}`,
            imageUrl: null,
            isShowcase: false,
            createdAt: new Date(),
          });

          prizeResponse = { type: "cash", value: amount.toFixed(2) };

        } else if (selectedPrize.rewardType === "points" && selectedPrize.rewardValue) {
          const points = parseInt(String(selectedPrize.rewardValue));

          // 🔒 CRITICAL: Update points using tx (not global db)
          // Track cumulative total for response
          totalPoints += points;
          
          // Get current points from user object and add this prize
          const currentPoints = user.ringtonePoints || 0;
          user.ringtonePoints = currentPoints + points; // Update user object for next iteration
          
          await tx
            .update(users)
            .set({ ringtonePoints: user.ringtonePoints })
            .where(eq(users.id, userId));

          await tx.insert(transactions).values({
            id: crypto.randomUUID(),
            userId,
            type: "prize",
            amount: points.toString(),
            description: `Scratch Card Prize - ${points} Ringtones`,
            createdAt: new Date(),
          });

          await tx.insert(winners).values({
            id: crypto.randomUUID(),
            userId,
            competitionId: null,
            prizeDescription: "Scratch Card Prize",
            prizeValue: `${points} Ringtones`,
            imageUrl: null,
            isShowcase: false,
            createdAt: new Date(),
          });

          prizeResponse = { type: "points", value: points.toString() };

        } else if (selectedPrize.rewardType === "physical") {
          await tx.insert(winners).values({
            id: crypto.randomUUID(),
            userId,
            competitionId: null,
            prizeDescription: `Scratch Card Prize - ${selectedPrize.imageName}`,
            prizeValue: selectedPrize.imageName,
            imageUrl: null,
            isShowcase: false,
            createdAt: new Date(),
          });

          prizeResponse = { type: "physical", value: selectedPrize.imageName };
        }

        results.push({ prize: prizeResponse });
      }
    });

    res.json({
      success: true,
      scratches: results,
      summary: {
        totalCash,
        totalPoints,
        scratchesProcessed: results.length,
      },
      cardsRemaining: cardsRemaining - results.length,
    });
  } catch (error) {
    console.error("Error revealing all scratch cards:", error);
    res.status(500).json({ message: "Failed to reveal all scratch cards" });
  }
});

// 🎯 NEW ARCHITECTURE: Pre-load scratch session BEFORE scratching starts
// Step 1: Start a scratch session - pre-determine result and tile layout
// app.post("/api/scratch-session/start", isAuthenticated, async (req: any, res) => {
//   try {
//     const userId = req.user.id;
//     const { orderId } = req.body;

//     if (!orderId) {
//       return res.status(400).json({
//         success: false,
//         message: "Order ID is required",
//       });
//     }

//     // Verify valid completed order
//     const order = await storage.getOrder(orderId);
//     if (!order || order.userId !== userId || order.status !== "completed") {
//       return res.status(400).json({
//         success: false,
//         message: "No valid scratch card purchase found",
//       });
//     }

//     // Check cards remaining
//     const used = await storage.getScratchCardsUsed(orderId);
//     const remaining = order.quantity - used;

//     if (remaining <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No scratch cards remaining in this purchase",
//       });
//     }

//     // Get user
//     const user = await storage.getUser(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // 🎲 Pre-determine the result using atomic transaction
//     let selectedPrize: any;
//     let tileLayout: string[] = [];
    
//     try {
//       await db.transaction(async (tx) => {
//         // Lock and fetch eligible prizes
//         const allPrizes = await tx
//           .select()
//           .from(scratchCardImages)
//           .where(eq(scratchCardImages.isActive, true))
//           .for("update"); 

//         if (!allPrizes || allPrizes.length === 0) {
//           throw new Error("No prizes configured");
//         }

//         // Filter prizes that haven't reached maxWins
//         const eligiblePrizes = allPrizes.filter(prize => {
//           if (!prize.weight || prize.weight <= 0) return false;
//           if (prize.maxWins !== null && prize.quantityWon >= prize.maxWins) return false;
//           return true;
//         });

//         if (eligiblePrizes.length === 0) {
//           throw new Error("No prizes available");
//         }

//         // Weighted random selection
//         const totalWeight = eligiblePrizes.reduce((sum, prize) => sum + prize.weight, 0);
//         if (totalWeight <= 0) {
//           throw new Error("Invalid prize weights");
//         }

//         let random = Math.random() * totalWeight;
//         selectedPrize = eligiblePrizes[0];

//         for (const prize of eligiblePrizes) {
//           random -= prize.weight;
//           if (random <= 0) {
//             selectedPrize = prize;
//             break;
//           }
//         }
//       });

//       // 🖼️ Generate 2x3 tile layout (6 tiles) based on win/loss
//       const isWinner = selectedPrize.rewardType !== 'try_again' && selectedPrize.rewardType !== 'lose';
      
//       // Define winning patterns for 2x3 grid:
//       // [0] [1] [2]
//       // [3] [4] [5]
//       const winningPatterns = [
//         [0, 1, 2], // Top row
//         [3, 4, 5], // Bottom row
//         [0, 2, 4], // Diagonal
//         [1, 3, 5], // Diagonal
//       ];
      
//       if (isWinner && selectedPrize.imageName) {
//         // ✅ WINNER: Show EXACTLY 3 matching images, 3 different non-matching images
//         const winningImage = selectedPrize.imageName;
//         const winPositions = winningPatterns[Math.floor(Math.random() * winningPatterns.length)];
        
//         // Get all other images (excluding winning image)
//         const otherPrizes = await db
//           .select()
//           .from(scratchCardImages)
//           .where(eq(scratchCardImages.isActive, true));
        
//         const otherImages = otherPrizes
//           .filter(p => p.imageName !== winningImage && p.imageName)
//           .map(p => p.imageName as string);
        
//         if (otherImages.length < 3) {
//           throw new Error("Not enough different images configured - need at least 4 total images");
//         }
        
//         // Build 2x3 grid (6 tiles)
//         tileLayout = Array(6).fill('');
        
//         // Place EXACTLY 3 winning images in winning positions
//         winPositions.forEach(pos => {
//           tileLayout[pos] = winningImage;
//         });
        
//         // 🛡️ CRITICAL: Fill remaining 3 positions with 3 DIFFERENT images (no duplicates)
//         // This ensures we never accidentally create a 4th or 5th matching image
//         const shuffledOthers = [...otherImages].sort(() => Math.random() - 0.5);
//         const nonWinningPositions = [0, 1, 2, 3, 4, 5].filter(pos => !winPositions.includes(pos));
        
//         // Pick 3 different images for the 3 non-winning positions
//         nonWinningPositions.forEach((pos, index) => {
//           tileLayout[pos] = shuffledOthers[index % shuffledOthers.length];
//         });
        
//         // 🔒 Final safety check: Ensure only ONE set of 3 matching exists
//         const matchCount: { [key: string]: number } = {};
//         tileLayout.forEach(img => {
//           matchCount[img] = (matchCount[img] || 0) + 1;
//         });
        
//         // Verify winning image appears exactly 3 times
//         if (matchCount[winningImage] !== 3) {
//           console.error(`❌ CRITICAL: Winning image appears ${matchCount[winningImage]} times instead of 3!`);
//         }
        
//         // Verify no other image appears 3+ times
//         Object.entries(matchCount).forEach(([img, count]) => {
//           if (img !== winningImage && count >= 3) {
//             console.error(`❌ CRITICAL: Non-winning image "${img}" appears ${count} times!`);
//           }
//         });
//       } else {
//         // 🔴 LOSER: Create layout ensuring NO 3 matching images
//         const allPrizes = await db
//           .select()
//           .from(scratchCardImages)
//           .where(eq(scratchCardImages.isActive, true));
        
//         const allImages = allPrizes
//           .filter(p => p.imageName)
//           .map(p => p.imageName as string);
        
//         if (allImages.length < 3) {
//           throw new Error("Not enough images configured - need at least 3 different images");
//         }
        
//         // 🎯 Strategy: Create pairs (2 of each image) to ensure max 2 same, never 3
//         // This guarantees the game cannot be won
//         tileLayout = [];
        
//         // Pick 3 different images randomly
//         const shuffled = [...allImages].sort(() => Math.random() - 0.5);
//         const image1 = shuffled[0];
//         const image2 = shuffled[1];
//         const image3 = shuffled[2];
        
//         // Create pairs: 2 of image1, 2 of image2, 2 of image3
//         const tiles = [image1, image1, image2, image2, image3, image3];
        
//         // Shuffle the tiles randomly
//         tileLayout = tiles.sort(() => Math.random() - 0.5);
        
//         // 🛡️ Safety check: Ensure NO winning pattern exists
//         let safetyAttempts = 0;
//         while (safetyAttempts < 20) {
//           const hasWinningPattern = winningPatterns.some(pattern => {
//             const images = pattern.map(pos => tileLayout[pos]);
//             return images[0] === images[1] && images[1] === images[2];
//           });
          
//           if (!hasWinningPattern) {
//             break; // Success! No 3 matching
//           }
          
//           // Re-shuffle and try again
//           tileLayout = tiles.sort(() => Math.random() - 0.5);
//           safetyAttempts++;
//         }
        
//         // Final verification
//         const finalCheck = winningPatterns.some(pattern => {
//           const images = pattern.map(pos => tileLayout[pos]);
//           return images[0] === images[1] && images[1] === images[2];
//         });
        
//         if (finalCheck) {
//           console.error("❌ CRITICAL: Failed to generate non-winning layout! Force-fixing...");
//           // Force fix: manually ensure no pattern matches
//           tileLayout = [image1, image2, image3, image1, image2, image3];
//         }
//       }

//       // Generate unique session ID
//       const sessionId = nanoid();

//       // Prepare prize response
//       let prizeInfo: any = {
//         type: 'none',
//         value: '0',
//         label: selectedPrize.label || 'Try Again',
//       };

//       if (isWinner) {
//         if (selectedPrize.rewardType === 'cash') {
//           prizeInfo = {
//             type: 'cash',
//             value: parseFloat(String(selectedPrize.rewardValue)).toFixed(2),
//             label: selectedPrize.label,
//           };
//         } else if (selectedPrize.rewardType === 'points') {
//           prizeInfo = {
//             type: 'points',
//             value: String(selectedPrize.rewardValue),
//             label: selectedPrize.label,
//           };
//         } else if (selectedPrize.rewardType === 'physical') {
//           prizeInfo = {
//             type: 'physical',
//             value: selectedPrize.label,
//             label: selectedPrize.label,
//           };
//         }
//       }

//       // Return session data to frontend (NO database changes yet)
//       res.json({
//         success: true,
//         sessionId,
//         isWinner,
//         prize: prizeInfo,
//         tileLayout, // 9-element array of image names
//         prizeId: selectedPrize.id,
//         orderId,
//       });

//     } catch (error) {
//       console.error("Error creating scratch session:", error);
//       throw error;
//     }

//   } catch (error) {
//     console.error("Error starting scratch session:", error);
//     res.status(500).json({ message: "Failed to start scratch session" });
//   }
// });

app.post("/api/scratch-session/start", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Verify valid completed order
    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId || order.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "No valid scratch card purchase found",
      });
    }

    // Check cards remaining
    const used = await storage.getScratchCardsUsed(orderId);
    const remaining = order.quantity - used;

    if (remaining <= 0) {
      return res.status(400).json({
        success: false,
        message: "No scratch cards remaining in this purchase",
      });
    }

    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🎲 Pre-determine the result using atomic transaction
    let selectedPrize: any;
    let tileLayout: string[] = [];
    
    try {
      await db.transaction(async (tx) => {
        // Lock and fetch eligible prizes
        const allPrizes = await tx
          .select()
          .from(scratchCardImages)
          .where(eq(scratchCardImages.isActive, true))
          .for("update"); 

        if (!allPrizes || allPrizes.length === 0) {
          throw new Error("No prizes configured");
        }

        // Filter prizes that haven't reached maxWins
        const eligiblePrizes = allPrizes.filter(prize => {
          if (!prize.weight || prize.weight <= 0) return false;
          if (prize.maxWins !== null && prize.quantityWon >= prize.maxWins) return false;
          return true;
        });

        if (eligiblePrizes.length === 0) {
          throw new Error("No prizes available");
        }

        // Weighted random selection
        const totalWeight = eligiblePrizes.reduce((sum, prize) => sum + prize.weight, 0);
        if (totalWeight <= 0) {
          throw new Error("Invalid prize weights");
        }

        let random = Math.random() * totalWeight;
        selectedPrize = eligiblePrizes[0];

        for (const prize of eligiblePrizes) {
          random -= prize.weight;
          if (random <= 0) {
            selectedPrize = prize;
            break;
          }
        }
      });

      // 🖼️ Generate 2x3 tile layout (6 tiles) based on win/loss
      const isWinner = selectedPrize.rewardType !== 'try_again' && selectedPrize.rewardType !== 'lose';
      
      // Define winning patterns for 2x3 grid:
      // [0] [1] [2]
      // [3] [4] [5]
      const winningPatterns = [
        [0, 1, 2], // Top row
        [3, 4, 5], // Bottom row
        [0, 2, 4], // Diagonal
        [1, 3, 5], // Diagonal
      ];
      
      // Get ONLY ACTIVE prizes with weight > 0 (not disabled) for tile generation
      const activePrizes = await db
        .select()
        .from(scratchCardImages)
        .where(eq(scratchCardImages.isActive, true));
      
      // Filter for prizes with weight > 0 AND that have an image name
      const activeImages = activePrizes
        .filter(p => p.imageName && p.imageName.trim() !== '' && p.weight && p.weight > 0)
        .map(p => p.imageName as string);
      
      if (activeImages.length < 3) {
        throw new Error("Not enough active images configured - need at least 3 different images with weight > 0");
      }
      
      if (isWinner && selectedPrize.imageName) {
        // ✅ WINNER: Show EXACTLY 3 matching images, 3 different non-matching images
        const winningImage = selectedPrize.imageName;
        
        // Verify winning image is actually in active images
        if (!activeImages.includes(winningImage)) {
          throw new Error(`Winning image "${winningImage}" is not active or has weight = 0`);
        }
        
        const winPositions = winningPatterns[Math.floor(Math.random() * winningPatterns.length)];
        
        // Get other active images (excluding winning image)
        const otherImages = activeImages.filter(img => img !== winningImage);
        
        if (otherImages.length < 3) {
          throw new Error("Not enough different active images configured - need at least 4 total active images");
        }
        
        // Build 2x3 grid (6 tiles)
        tileLayout = Array(6).fill('');
        
        // Place EXACTLY 3 winning images in winning positions
        winPositions.forEach(pos => {
          tileLayout[pos] = winningImage;
        });
        
        // Fill remaining 3 positions with 3 DIFFERENT active images (no duplicates)
        const shuffledOthers = [...otherImages].sort(() => Math.random() - 0.5);
        const nonWinningPositions = [0, 1, 2, 3, 4, 5].filter(pos => !winPositions.includes(pos));
        
        nonWinningPositions.forEach((pos, index) => {
          tileLayout[pos] = shuffledOthers[index % shuffledOthers.length];
        });
        
        // 🔒 Final safety check
        const matchCount: { [key: string]: number } = {};
        tileLayout.forEach(img => {
          matchCount[img] = (matchCount[img] || 0) + 1;
        });
        
        // Verify winning image appears exactly 3 times
        if (matchCount[winningImage] !== 3) {
          console.error(`❌ CRITICAL: Winning image appears ${matchCount[winningImage]} times instead of 3!`);
        }
        
        // Verify no other image appears 3+ times
        Object.entries(matchCount).forEach(([img, count]) => {
          if (img !== winningImage && count >= 3) {
            console.error(`❌ CRITICAL: Non-winning image "${img}" appears ${count} times!`);
          }
        });
        
      } else {
        // 🔴 LOSER: Create layout ensuring NO 3 matching images using ONLY active images
        
        // 🎯 Strategy: Create pairs (2 of each image) to ensure max 2 same, never 3
        tileLayout = [];
        
        if (activeImages.length < 3) {
          throw new Error("Not enough active images - need at least 3 different images with weight > 0");
        }
        
        // Pick 3 different active images randomly
        const shuffled = [...activeImages].sort(() => Math.random() - 0.5);
        const image1 = shuffled[0];
        const image2 = shuffled[1];
        const image3 = shuffled[2];
        
        // Create pairs: 2 of image1, 2 of image2, 2 of image3
        const tiles = [image1, image1, image2, image2, image3, image3];
        
        // Shuffle the tiles randomly
        tileLayout = tiles.sort(() => Math.random() - 0.5);
        
        // 🛡️ Safety check: Ensure NO winning pattern exists
        let safetyAttempts = 0;
        while (safetyAttempts < 20) {
          const hasWinningPattern = winningPatterns.some(pattern => {
            const images = pattern.map(pos => tileLayout[pos]);
            return images[0] === images[1] && images[1] === images[2];
          });
          
          if (!hasWinningPattern) {
            break; // Success! No 3 matching
          }
          
          // Re-shuffle and try again
          tileLayout = tiles.sort(() => Math.random() - 0.5);
          safetyAttempts++;
        }
        
        // Final verification
        const finalCheck = winningPatterns.some(pattern => {
          const images = pattern.map(pos => tileLayout[pos]);
          return images[0] === images[1] && images[1] === images[2];
        });
        
        if (finalCheck) {
          console.error("❌ CRITICAL: Failed to generate non-winning layout! Force-fixing...");
          // Force fix: manually ensure no pattern matches
          tileLayout = [image1, image2, image3, image1, image2, image3];
        }
      }

      // Generate unique session ID
      const sessionId = nanoid();

      // Prepare prize response
      let prizeInfo: any = {
        type: 'none',
        value: '0',
        label: selectedPrize.label || 'Try Again',
      };

      if (isWinner) {
        if (selectedPrize.rewardType === 'cash') {
          prizeInfo = {
            type: 'cash',
            value: parseFloat(String(selectedPrize.rewardValue)).toFixed(2),
            label: selectedPrize.label,
          };
        } else if (selectedPrize.rewardType === 'points') {
          prizeInfo = {
            type: 'points',
            value: String(selectedPrize.rewardValue),
            label: selectedPrize.label,
          };
        } else if (selectedPrize.rewardType === 'physical') {
          prizeInfo = {
            type: 'physical',
            value: selectedPrize.label,
            label: selectedPrize.label,
          };
        }
      }

      // Return session data to frontend (NO database changes yet)
      res.json({
        success: true,
        sessionId,
        isWinner,
        prize: prizeInfo,
        tileLayout, // 6-element array of image names (2x3 grid)
        prizeId: selectedPrize.id,
        orderId,
      });

    } catch (error) {
      console.error("Error creating scratch session:", error);
      throw error;
    }

  } catch (error) {
    console.error("Error starting scratch session:", error);
    res.status(500).json({ message: "Failed to start scratch session" });
  }
});

// Step 2: Complete scratch session - record usage and award prize
app.post("/api/scratch-session/:sessionId/complete", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const { orderId, prizeId, isWinner } = req.body;

    if (!orderId || !prizeId) {
      return res.status(400).json({
        success: false,
        message: "Order ID and Prize ID are required",
      });
    }

    // Verify order
    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId || order.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Invalid order",
      });
    }

    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get prize details
    const prize = await db
      .select()
      .from(scratchCardImages)
      .where(eq(scratchCardImages.id, prizeId))
      .limit(1);

    if (!prize || prize.length === 0) {
      return res.status(404).json({ message: "Prize not found" });
    }

    const selectedPrize = prize[0];
    let prizeResponse = { type: "none", value: "0" };

    // 🔒 Atomic transaction to record usage and award prize
    await db.transaction(async (tx) => {
      // Record scratch card usage
      await tx.insert(scratchCardUsage).values({
        orderId,
        userId,
        usedAt: new Date()
      });

      // Award prize if winner
      if (isWinner && selectedPrize.rewardType !== 'try_again' && selectedPrize.rewardType !== 'lose') {
        // Update prize win count
        await tx
          .update(scratchCardImages)
          .set({ quantityWon: selectedPrize.quantityWon + 1 })
          .where(eq(scratchCardImages.id, selectedPrize.id));

        // Record the win
        await tx.insert(scratchCardWins).values({
          userId,
          prizeId: selectedPrize.id,
          rewardType: selectedPrize.rewardType,
          rewardValue: String(selectedPrize.rewardValue ?? ""),
          wonAt: new Date()
        });

        // Award cash prize
        if (selectedPrize.rewardType === 'cash' && selectedPrize.rewardValue) {
          const amount = parseFloat(String(selectedPrize.rewardValue));
          const finalBalance = parseFloat(user.balance || "0") + amount;

          // Update balance using transaction context
          await tx
            .update(users)
            .set({ balance: finalBalance.toFixed(2), updatedAt: new Date() })
            .where(eq(users.id, userId));

          // Create transaction record
          await tx.insert(transactions).values({
            userId,
            type: "prize",
            amount: amount.toFixed(2),
            description: `Scratch Card Prize - £${amount}`,
            createdAt: new Date(),
          });

          // Create winner record
          await tx.insert(winners).values({
            userId,
            competitionId: null,
            prizeDescription: "Scratch Card Prize",
            prizeValue: `£${amount}`,
            imageUrl: null,
            isShowcase: false,
            createdAt: new Date(),
          });

          prizeResponse = { type: "cash", value: amount.toFixed(2) };
        } 
        // Award points prize
        else if (selectedPrize.rewardType === 'points' && selectedPrize.rewardValue) {
          const points = parseInt(String(selectedPrize.rewardValue));
          const newPoints = (user.ringtonePoints || 0) + points;

          // Update points using transaction context
          await tx
            .update(users)
            .set({ ringtonePoints: newPoints })
            .where(eq(users.id, userId));

          // Create transaction record
          await tx.insert(transactions).values({
            userId,
            type: "prize",
            amount: points.toString(),
            description: `Scratch Card Prize - ${points} Ringtones`,
            createdAt: new Date(),
          });

          // Create winner record
          await tx.insert(winners).values({
            userId,
            competitionId: null,
            prizeDescription: "Scratch Card Prize",
            prizeValue: `${points} Ringtones`,
            imageUrl: null,
            isShowcase: false,
            createdAt: new Date(),
          });

          prizeResponse = { type: "points", value: points.toString() };
        }
        // Physical prize
        else if (selectedPrize.rewardType === 'physical') {
          // Create winner record
          await tx.insert(winners).values({
            userId,
            competitionId: null,
            prizeDescription: `Scratch Card Prize - ${selectedPrize.imageName}`,
            prizeValue: selectedPrize.imageName,
            imageUrl: null,
            isShowcase: false,
            createdAt: new Date(),
          });

          prizeResponse = { type: "physical", value: selectedPrize.imageName };
        }
      }
    });

    // Get updated remaining count
    const used = await storage.getScratchCardsUsed(orderId);
    const remaining = order.quantity - used;

    res.json({
      success: true,
      prize: prizeResponse,
      prizeLabel: selectedPrize.imageName,
      remainingCards: remaining,
      orderId: order.id,
    });

  } catch (error) {
    console.error("Error completing scratch session:", error);
    res.status(500).json({ message: "Failed to complete scratch session" });
  }
});

app.get("/api/scratch-order/:orderId", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order not found" });
    }

    const user = await storage.getUser(userId);
    const used = await storage.getScratchCardsUsed(orderId);
    const remaining =  order.quantity - used;
    res.json({
      order: {
        id: order.id,
        competitionId: order.competitionId,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        status: order.status,
        remainingPlays: remaining,
        used : used
      },
      user: {
        balance: user?.balance || "0",
        ringtonePoints: user?.ringtonePoints || 0,
      },
      scratchCost: 2, // £2 per scratch
    });
  } catch (error) {
    console.error("Error fetching scratch order:", error);
    res.status(500).json({ message: "Failed to fetch scratch order" });
  }
});

  // Convert ringtone points to wallet balance
app.post("/api/convert-ringtone-points", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { points } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({ message: "Invalid points amount" });
    }

    const user = await storage.getUser(userId);
    const currentPoints = user?.ringtonePoints || 0;

    if (points > currentPoints) {
      return res.status(400).json({ message: "Not enough ringtone points" });
    }

    if (points < 100) {
      return res.status(400).json({ message: "Minimum conversion is 100 points" });
    }

    // ✅ Correct conversion
    const euroAmount = points * 0.01;

    // Update ringtone points
    const newPoints = currentPoints - points;
    await storage.updateUserRingtonePoints(userId, newPoints);

    // Update wallet balance
    const currentBalance = parseFloat(user?.balance || "0");
    const newBalance = currentBalance + euroAmount;
    await storage.updateUserBalance(userId, newBalance.toString());

    // Create transaction records
    await storage.createTransaction({
      userId,
      type: "prize",
      amount: `-${points}`,
      description: `Converted ${points} ringtone points`,
    });

    await storage.createTransaction({
      userId,
      type: "prize",
      amount: euroAmount.toString(),
      description: `Received £${euroAmount.toFixed(2)} from ringtone points conversion`,
    });

    res.json({
      success: true,
      convertedPoints: points,
      euroAmount,
      newRingtonePoints: newPoints,
      newBalance,
    });

  } catch (error) {
    console.error("Error converting ringtone points:", error);
    res.status(500).json({ message: "Failed to convert ringtone points" });
  }
});


  // User account routes
app.get("/api/user/orders", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const orders = await storage.getUserOrders(userId);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

app.get("/api/user/transactions", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const transactions = await storage.getUserTransactions(userId);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

app.get("/api/user/cashflow-transactions", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const cashflowDeposits = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        description: transactions.description,
        createdAt: transactions.createdAt,
        type: transactions.type
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "deposit") // Only cashflow top-ups
        )
      );

    res.json(cashflowDeposits);

  } catch (error) {
    console.error("Error fetching cashflow deposits:", error);
    res.status(500).json({ message: "Failed to fetch cashflow deposits" });
  }
});

app.get("/api/admin/users/cashflow-transactions", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // 1️⃣ Get all users with their cashflow deposits
    const usersCashflow = await db
      .select({
        userId: users.id,
        userName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        userEmail: users.email,
        totalCashflow: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(users)
      .leftJoin(transactions, and(
        eq(transactions.userId, users.id),
        eq(transactions.type, 'deposit')
      ))
      .groupBy(users.id);

    res.json(usersCashflow);

  } catch (error) {
    console.error("Error fetching users cashflow transactions:", error);
    res.status(500).json({ message: "Failed to fetch users cashflow transactions" });
  }
});


app.get("/api/admin/cashflow-transactions", isAuthenticated, isAdmin, async (req, res) => {
  try {
    //
    // 1️⃣ CASHFLOW DEPOSITS (Wallet top-ups)
    //
    const cashflowDeposits = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        userName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        userEmail: users.email,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        createdAt: transactions.createdAt,
        source: sql`'transaction'`,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(sql`${transactions.type} = 'deposit'`);



    //
    // 2️⃣ CASHFLOW USED IN ORDERS (cashflowsAmount > 0)
    //
    const cashflowOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        userName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        userEmail: users.email,
        competitionId: orders.competitionId,
        competitionTitle: competitions.title,
        type: sql`'cashflow_spent'`,
        amount: orders.cashflowsAmount,
        description: sql`COALESCE(${competitions.title}, ${orders.paymentBreakdown}, 'Competition Purchase')`,
        createdAt: orders.createdAt,
        source: sql`'order'`,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(competitions, eq(orders.competitionId, competitions.id))
      .where(sql`${orders.cashflowsAmount} > 0`);



    //
    // 3️⃣ MERGE RESULTS
    //
    const allCashflowTx = [...cashflowDeposits, ...cashflowOrders];

    //
    // 4️⃣ SORT NEWEST FIRST
    //
    allCashflowTx.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allCashflowTx);

  } catch (error) {
    console.error("Error fetching cashflow transactions:", error);
    res.status(500).json({ message: "Failed to fetch cashflow transactions" });
  }
});


app.get("/api/user/tickets", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const tickets = await storage.getUserTickets(userId);
    res.json(tickets);
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

// Referral routes
app.get("/api/user/referral-code", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const referralCode = await storage.getUserReferralCode(userId);
    res.json({ referralCode });
  } catch (error) {
    console.error("Error fetching referral code:", error);
    res.status(500).json({ message: "Failed to fetch referral code" });
  }
});

app.get("/api/user/referrals", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const referrals = await storage.getUserReferrals(userId);
    res.json(referrals.map(r => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      createdAt: r.createdAt,
    })));
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ message: "Failed to fetch referrals" });
  }
});

app.get("/api/user/referral-stats", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Get list of referred users
    const referrals = await storage.getUserReferrals(userId);

    // Get ONLY CASH referral earnings (exclude points)
    const referralTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "referral") // true cash referral ONLY
        )
      );

    // Sum only positive money amounts (ignore "0", ignore points)
    const totalEarned = referralTransactions.reduce((sum, tx) => {
      const amount = parseFloat(tx.amount || "0");
      return amount > 0 ? sum + amount : sum;
    }, 0);

    res.json({
      totalReferrals: referrals.length,
      totalEarned: totalEarned.toFixed(2),
      referrals: referrals.map((r) => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    res.status(500).json({ message: "Failed to fetch referral stats" });
  }
});


// Newsletter subscription endpoint
app.post("/api/user/newsletter/subscribe", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Get the user's registered email
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate email matches user's registered email
    if (user.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({ 
        message: "Email doesn't match your registered email. Please use the email you signed up with." 
      });
    }

    // Check if already subscribed
    if (user.receiveNewsletter) {
      return res.status(409).json({ 
        message: "You have already subscribed to our newsletter!" 
      });
    }

    // Subscribe user to newsletter
    await db
      .update(users)
      .set({ receiveNewsletter: true })
      .where(eq(users.id, userId));

    res.json({ 
      success: true, 
      message: "Successfully subscribed to newsletter! You'll receive exclusive offers and updates." 
    });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    res.status(500).json({ message: "Failed to subscribe to newsletter" });
  }
});

// Newsletter unsubscribe endpoint
app.post("/api/user/newsletter/unsubscribe", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Get the user
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already unsubscribed
    if (!user.receiveNewsletter) {
      return res.status(409).json({ 
        message: "You are not subscribed to our newsletter" 
      });
    }

    // Unsubscribe user from newsletter
    await db
      .update(users)
      .set({ receiveNewsletter: false })
      .where(eq(users.id, userId));

    res.json({ 
      success: true, 
      message: "Successfully unsubscribed from newsletter" 
    });
  } catch (error) {
    console.error("Error unsubscribing from newsletter:", error);
    res.status(500).json({ message: "Failed to unsubscribe from newsletter" });
  }
});

app.post("/api/wallet/topup", isAuthenticated,  async (req: any, res) => {
  try {
      console.log("Wallet topup endpoint called - middleware passed");
    const userId = req.user.id;
    const { amount, direct } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // 🎯 DIRECT TOP-UP (no Stripe, just update DB)
    if (direct) {
      // Update user balance
      // Update user balance using storage abstraction
      const user = await storage.getUser(userId);
      const newBalance = (parseFloat(user?.balance || "0") + parseFloat(amount)).toString();
      await storage.updateUserBalance(userId, newBalance);

      // Insert a transaction record using storage abstraction
      await storage.createTransaction({
        userId,
        type: "deposit",
        amount: amount.toString(),
        description: `Direct top-up of £${amount}`,
      });

      return res.json({ success: true });
    }

    // 🎯 STRIPE PAYMENT FLOW
    if (!stripe) {
      return res.status(500).json({
        message:
          "Payment processing not configured. Please contact admin.",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "gbp",
      metadata: {
        userId,
        type: "wallet_topup",
      },
    });

    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating wallet top-up:", error);
    res.status(500).json({ message: "Failed to create wallet top-up" });
  }
});

app.post(
  "/api/wallet/topup-checkout",
  isAuthenticated,
  async (req: any, res) => {
    try {
      const { amount } = req.body;
      const userId = req.user.id;

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      await enforceDailySpendLimit(userId, Number(amount));

      const session = await cashflows.createPaymentSession(amount, userId);

      if (!session?.hostedPageUrl || !session?.paymentJobReference) {
        return res.status(500).json({ message: "Failed to create payment" });
      }

      await db.insert(pendingPayments).values({
        userId,
        paymentJobReference: session.paymentJobReference,
        amount: Number(amount).toFixed(2),
        status: "pending",
        createdAt: new Date(),
      });

      res.json({
        redirectUrl: session.hostedPageUrl,
        paymentJobRef: session.paymentJobReference,
      });

    } catch (err: any) {
      console.error("Checkout error:", err);
      res.status(500).json({ message: "Checkout failed" });
    }
  }
);




app.post(
  "/api/wallet/confirm-topup",
  isAuthenticated,
  async (req, res) => {
    const { paymentJobRef, paymentRef } = req.body;

    const payment = await cashflows.getPaymentStatus(
      paymentJobRef,
      paymentRef
    );

    const { status } = normalizeCashflowsStatus(payment);

    res.json({
      status,
      message:
        status === "PAID"
          ? "Payment received. Wallet updating."
          : "Payment processing.",
    });
  }
);



// POST endpoint
app.post("/api/wellbeing/daily-limit", isAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const { limit } = req.body;

  const parsed = Number(limit);

  // If limit is 0, treat it as removing the limit (set to null)
  if (parsed === 0) {
    await db.update(users)
      .set({
        dailySpendLimit: null,  // Set to null instead of "0.00"
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Audit log
    await db.insert(auditLogs).values({
      userId,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      email: req.user.email,
      action: "daily_spend",
      description: "Daily spend limit removed",
      createdAt: new Date(),
    });

    return res.json({
      success: true,
      dailySpendLimit: null,
    });
  }

  // Existing validation for non-zero values
  if (isNaN(parsed) || parsed < 0) {
    return res.status(400).json({ error: "Invalid limit" });
  }

  await db.update(users)
    .set({
      dailySpendLimit: parsed.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Audit (important for compliance)
  await db.insert(auditLogs).values({
    userId,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    email: req.user.email,
    action: "daily_spend",
    description: `Daily spend limit set to £${parsed.toFixed(2)}`,
    createdAt: new Date(),
  });

  res.json({
    success: true,
    dailySpendLimit: parsed.toFixed(2),
  });
});

// PUT endpoint
app.put("/api/wellbeing/daily-limit", isAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const { limit } = req.body;

  const parsed = Number(limit);
  
  // If limit is 0, treat it as removing the limit
  if (parsed === 0) {
    await db.update(users)
      .set({
        dailySpendLimit: null,  // Set to null
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Audit (important for compliance)
    await db.insert(auditLogs).values({
      userId,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      email: req.user.email,
      action: "daily_spend_updated",
      description: "Daily spend limit removed",
      createdAt: new Date(),
    });

    return res.json({
      success: true,
      dailySpendLimit: null,
    });
  }

  // Existing validation for non-zero values
  if (isNaN(parsed) || parsed < 0) {
    return res.status(400).json({ error: "Invalid limit" });
  }

  await db.update(users)
    .set({
      dailySpendLimit: parsed.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Audit (important for compliance)
  await db.insert(auditLogs).values({
    userId,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    email: req.user.email,
    action: "daily_spend_updated",
    description: `Daily spend limit set to £${parsed.toFixed(2)}`,
    createdAt: new Date(),
  });

  res.json({
    success: true,
    dailySpendLimit: parsed.toFixed(2),
  });
});

app.get("/api/wellbeing", isAuthenticated, async (req, res) => {
  const spentToday = await getTodaysCashSpend(req.user.id);
  const limit = req.user.dailySpendLimit;

  if (limit === null) {
    return res.json({
      dailySpendLimit: null,
      spentToday: spentToday.toFixed(2),
      remaining: null,
    });
  }

  const limitNum = Number(limit);

  res.json({
    dailySpendLimit: limit,
    spentToday: spentToday.toFixed(2),
    remaining: Math.max(0, limitNum - spentToday).toFixed(2),
  });
});

// app.post(
//   "/api/admin/migrate/daily-limit-null",
//   isAuthenticated,
//   isAdmin,
//   async (req, res) => {
//     try {
//       // 1️⃣ Remove default at DB level (safe to run multiple times)
//       await db.execute(
//         sql`ALTER TABLE users ALTER COLUMN daily_spend_limit DROP DEFAULT`
//       );

//       // 2️⃣ Normalize existing data
//       const result = await db.execute(
//         sql`
//           UPDATE users
//           SET daily_spend_limit = NULL
//           WHERE daily_spend_limit = 0
//         `
//       );

//       res.json({
//         success: true,
//         message: "Daily spend limits normalized",
//         affectedRows: result.rowCount ?? 0,
//       });
//     } catch (err) {
//       console.error("Migration error:", err);
//       res.status(500).json({ error: "Migration failed" });
//     }
//   }
// );


async function getTodaysCashSpend(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "deposit"),
        gte(transactions.createdAt, startOfDay),
        lte(transactions.createdAt, endOfDay)
      )
    );

  return Number(result[0]?.total || 0);
}




async function enforceDailySpendLimit(userId: string, newSpendAmount: number) {
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  if (!user) throw new Error("USER_NOT_FOUND");

  // ✅ No limit set → allow
  if (user.dailySpendLimit === null || Number(user.dailySpendLimit) === 0) {
    return;
  }

  const dailyLimit = Number(user.dailySpendLimit);

  const spentToday = await getTodaysCashSpend(userId);

  if (spentToday + newSpendAmount > dailyLimit) {
    throw new Error("DAILY_LIMIT_REACHED");
  }
}



app.post("/api/wellbeing/suspend", isAuthenticated, async (req, res) => {
  const user = req.user;
  const { days } = req.body;

  const parsedDays = Number(days);

  if (
    isNaN(parsedDays) ||
    parsedDays <= 0 ||
    parsedDays > 365
  ) {
    return res.status(400).json({ error: "Invalid suspension duration" });
  }

  // 🚫 Already suspended
  if (
    user.selfSuspended &&
    user.selfSuspensionEndsAt &&
    new Date() < new Date(user.selfSuspensionEndsAt)
  ) {
    return res.status(400).json({
      error: "Your account is already suspended",
      endsAt: user.selfSuspensionEndsAt,
    });
  }

  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + parsedDays);

  await db.insert(wellbeingRequests).values({
  userId: user.id,
  type: "suspension",
  daysRequested: parsedDays,
});


  // Apply immediately
  await db.update(users)
    .set({
      selfSuspended: true,
      selfSuspensionEndsAt: endsAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Audit log (VERY IMPORTANT)
  await db.insert(auditLogs).values({
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    action: "self_suspension_requested",
    description: `User self-suspended for ${parsedDays} days until ${endsAt.toISOString()}`,
    createdAt: new Date(),
  });

  res.json({
    success: true,
    suspendedUntil: endsAt,
    message:
      "Once submitted, this suspension cannot be reversed or removed early.",
  });
});

// Testing only - unsuspend immediately
app.post("/api/wellbeing/unsuspend", async (req, res) => {
  const { userId, secret } = req.body;

  if (secret !== process.env.UNSUSPEND_SECRET) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    await db.update(users)
      .set({
        selfSuspended: false,
        selfSuspensionEndsAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    const freshUser = await storage.getUser(userId);

    res.json({ 
      success: true, 
      message: "User is now unsuspended.",
      user: {
        id: freshUser.id,
        email: freshUser.email,
        firstName: freshUser.firstName,
        lastName: freshUser.lastName,
        selfSuspended: freshUser.selfSuspended,
        selfSuspensionEndsAt: freshUser.selfSuspensionEndsAt,
      }
    });
  } catch (err) {
    console.error("Unsuspend error:", err);
    res.status(500).json({ success: false, message: "Failed to unsuspend" });
  }
});



app.post("/api/wellbeing/close-account", isAuthenticated, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1️⃣ Disable the account
    await db.update(users)
      .set({
        disabled: true,
        disabledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

        await db.insert(wellbeingRequests).values({
    userId,
    type: "full_closure",
    daysRequested: null,
  });

    // 2️⃣ Audit log (important for compliance)
    await db.insert(auditLogs).values({
      userId,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      email: req.user.email,
      action: "account_closed",
      description: `User requested full account closure.`,
      createdAt: new Date(),
    });

    // 3️⃣ Destroy session and respond
    req.session.destroy((err) => {
      if (err) console.error("Failed to destroy session:", err);

      res.json({
        success: true,
        message: "Your account has been disabled and you have been logged out.",
      });
    });

  } catch (err) {
    console.error("Account closure error:", err);
    res.status(500).json({ success: false, message: "Failed to close account" });
  }
});


app.post("/api/wellbeing/undo-close-account", async (req, res) => {
  const { userId, secret } = req.body;

  if (secret !== process.env.UNDO_CLOSE_SECRET) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    await db.update(users)
      .set({
        disabled: false,
        disabledAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      message: "Account re-enabled for testing.",
    });
  } catch (err) {
    console.error("Undo account closure error:", err);
    res.status(500).json({ success: false, message: "Failed to re-enable account" });
  }
});





// Withdrawal Request Routes - Collect details for manual processing
const withdrawalRequestInputSchema = insertWithdrawalRequestSchema.extend({
  amount: z.string().refine((val) => parseFloat(val) >= 5, {
    message: "Minimum withdrawal amount is £5",
  }),
  accountName: z.string().trim().min(1, "Account name is required"),
  accountNumber: z.string().trim().regex(/^\d{8}$/, "Account number must be 8 digits"),
  sortCode: z.string().trim().regex(/^\d{6}$/, "Sort code must be 6 digits"),
});

app.post("/api/withdrawal-requests", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Validate input with Zod
    const result = withdrawalRequestInputSchema.safeParse({
      ...req.body,
      userId,
      status: "pending",
    });

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid withdrawal request data",
        errors: result.error.issues,
      });
    }

    const { amount, accountName, accountNumber, sortCode } = result.data;

    // Check user has sufficient balance
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentBalance = parseFloat(user.balance);
    const withdrawalAmount = parseFloat(amount);

    if (currentBalance < withdrawalAmount) {
      return res.status(400).json({ message: "Insufficient balance for this withdrawal request" });
    }

    // Deduct the amount from user's balance immediately
    const newBalance = (currentBalance - withdrawalAmount).toFixed(2);
    await storage.updateUserBalance(userId, newBalance);

    // Create withdrawal request
    await storage.createWithdrawalRequest({
      userId,
      amount,
      accountName,
      accountNumber,
      sortCode,
      status: "pending",
    });

    // Create transaction record
    await storage.createTransaction({
      userId,
      type: "withdrawal",
      amount: `-${amount}`,
      description: `Withdrawal request to ${accountName}`,
    });

    res.status(201).json({ 
      message: "Withdrawal request submitted successfully. The amount has been deducted from your account balance.",
      newBalance,
    });
  } catch (error: any) {
    console.error("Error creating withdrawal request:", error);
    res.status(500).json({
      message: error.message || "Failed to create withdrawal request",
    });
  }
});

app.get("/api/withdrawal-requests/me", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const requests = await storage.getUserWithdrawalRequests(userId);
    res.json(requests);
  } catch (error) {
    console.error("Error fetching user withdrawal requests:", error);
    res.status(500).json({ message: "Failed to fetch withdrawal requests" });
  }
});

app.get("/api/admin/withdrawal-requests", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const requests = await storage.getWithdrawalRequests();
    
    // Enrich with user details
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const user = await storage.getUser(request.userId);
        return {
          ...request,
          user: user ? {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            balance: user.balance,
            ringtonePoints: user.ringtonePoints,
          } : null
        };
      })
    );
    
    res.json(enrichedRequests);
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    res.status(500).json({ message: "Failed to fetch withdrawal requests" });
  }
});

app.patch("/api/admin/withdrawal-requests/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const processedBy = req.user.id;

    if (!status || !["approved", "rejected", "processed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'approved', 'rejected', or 'processed'" });
    }

    // Get the withdrawal request
    const request = await storage.getWithdrawalRequest(id);
    if (!request) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "This request has already been processed" });
    }

    // --- REFUND LOGIC FOR REJECTIONS ---
    if (status === "rejected") {
      const user = await storage.getUser(request.userId);
      if (user) {
        const currentBalance = parseFloat(user.balance);
        const withdrawalAmount = parseFloat(request.amount);
        
        // Refund the amount to the user's balance
        const newBalance = (currentBalance + withdrawalAmount).toFixed(2);
        await storage.updateUserBalance(request.userId, newBalance);
        
        // Create a transaction record for the refund
        await storage.createTransaction({
          userId: request.userId,
          type: "refund", // Or "credit", "reversal" - choose a suitable type
          amount: `+${request.amount}`, // Positive amount
          description: `Withdrawal request rejected - amount refunded`,
        });
      }
    }
    // --- END REFUND LOGIC ---

    // Update the withdrawal request status
    const updated = await storage.updateWithdrawalRequestStatus(
      id,
      status,
      adminNotes,
      processedBy
    );

    res.json({ 
      message: `Withdrawal request ${status} successfully`, 
      request: updated 
    });
  } catch (error) {
    console.error("Error updating withdrawal request:", error);
    res.status(500).json({ message: "Failed to update withdrawal request" });
  }
});



// ====== ENTRIES ADMIN ENDPOINTS ======
app.get("/api/admin/entries", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { dateFrom, dateTo, search } = req.query;
    
    let query = db
      .select()
      .from(tickets)
      .leftJoin(users, eq(tickets.userId, users.id))
      .leftJoin(competitions, eq(tickets.competitionId, competitions.id));
    
    // Apply date filtering
    const conditions = [];
    if (dateFrom) {
      conditions.push(gte(tickets.createdAt, new Date(dateFrom as string)));
    }
    if (dateTo) {
      const endDate = new Date(dateTo as string);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(tickets.createdAt, endDate));
    }
    
    // Apply search filter
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(users.email, searchTerm),
          like(users.firstName, searchTerm),
          like(users.lastName, searchTerm),
          like(competitions.title, searchTerm),
          like(tickets.ticketNumber, searchTerm)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const allEntries = await query.orderBy(desc(tickets.createdAt));
    
    res.json(allEntries.map(entry => ({
      id: entry.tickets.id,
      ticketNumber: entry.tickets.ticketNumber,
      user: entry.users ? {
        id: entry.users.id,
        firstName: entry.users.firstName,
        lastName: entry.users.lastName,
        email: entry.users.email,
      } : null,
      competition: entry.competitions ? {
        id: entry.competitions.id,
        title: entry.competitions.title,
        type: entry.competitions.type,
      } : null,
      isWinner: entry.tickets.isWinner,
      prizeAmount: entry.tickets.prizeAmount,
      createdAt: entry.tickets.createdAt,
    })));
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ message: "Failed to fetch entries" });
  }
});

// Delete entry
app.delete("/api/admin/entries/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [deleted] = await db
      .delete(tickets)
      .where(eq(tickets.id, id))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({ message: "Entry not found" });
    }
    
    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting entry:", error);
    res.status(500).json({ message: "Failed to delete entry" });
  }
});

app.get("/api/admin/entries/download/:competitionId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    const entries = await db
      .select()
      .from(tickets)
      .leftJoin(users, eq(tickets.userId, users.id))
      .leftJoin(competitions, eq(tickets.competitionId, competitions.id))
      .where(eq(tickets.competitionId, competitionId))
      .orderBy(asc(tickets.ticketNumber));
    
    if (entries.length === 0) {
      return res.status(404).json({ message: "No entries found for this competition" });
    }

    // Helper function to properly escape CSV cells
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes by doubling them and wrap in quotes if contains comma, newline, or quote
      if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return `"${stringValue}"`;
    };

    // Generate CSV content
    const headers = ["Ticket Number", "User Name", "User Email", "Is Winner", "Prize Amount", "Entry Date"];
    const rows = entries.map(entry => [
      escapeCSV(entry.tickets.ticketNumber),
      escapeCSV(`${entry.users?.firstName || ''} ${entry.users?.lastName || ''}`.trim()),
      escapeCSV(entry.users?.email || ''),
      escapeCSV(entry.tickets.isWinner ? 'Yes' : 'No'),
      escapeCSV(entry.tickets.prizeAmount || '0.00'),
      escapeCSV(entry.tickets.createdAt ? new Date(entry.tickets.createdAt).toLocaleString() : ''),
    ]);

    // Create CSV string
    const csvContent = [
      headers.map(h => escapeCSV(h)).join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const competitionTitle = entries[0].competitions?.title || 'competition';
    const sanitizedTitle = competitionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}_entries.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error("Error downloading entries CSV:", error);
    res.status(500).json({ message: "Failed to download entries CSV" });
  }
});

// ====== WINNERS PUBLIC ENDPOINTS ======
app.get("/api/winners", async (req, res) => {
  try {
    // Check if showcase parameter is provided
    const showcaseOnly = req.query.showcase === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    
    // console.log(`Fetching winners - showcaseOnly: ${showcaseOnly}, limit: ${limit}`);
    
    const winners = await storage.getRecentWinners(limit, showcaseOnly);

    // console.log(`✅ Returning ${winners.length} winners, showcaseOnly: ${showcaseOnly}`);

    res.json(winners);
  } catch (error) {
    console.error("Error fetching winners:", error);
    res.status(500).json({ message: "Failed to fetch winners" });
  }
});



// ====== WINNERS ADMIN ENDPOINTS ======
app.get("/api/admin/winners", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    let query = db
      .select()
      .from(winners)
      .leftJoin(users, eq(users.id, winners.userId))
      .leftJoin(competitions, eq(competitions.id, winners.competitionId));

    // Apply filters
    const conditions = [];

    // Date from
    if (dateFrom) {
      conditions.push(gte(winners.createdAt, new Date(dateFrom)));
    }

    // Date to
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(winners.createdAt, endDate));
    }

    // If any conditions exist → add to query
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Order newest first
    const allWinners = await query.orderBy(desc(winners.createdAt));

    // Transform shape to match frontend
    const result = allWinners.map((row) => ({
      winners: {
        id: row.winners.id,
        userId: row.winners.userId,
        competitionId: row.winners.competitionId,
        prizeDescription: row.winners.prizeDescription,
        prizeValue: row.winners.prizeValue,
        imageUrl: row.winners.imageUrl,
        isShowcase: row.winners.isShowcase, 
        createdAt: row.winners.createdAt,
      },
      users: row.users
        ? {
            id: row.users.id,
            firstName: row.users.firstName,
            lastName: row.users.lastName,
            email: row.users.email,
          }
        : null,
      competitions: row.competitions
        ? {
            id: row.competitions.id,
            title: row.competitions.title,
          }
        : null,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching winners for admin:", error);
    res.status(500).json({ message: "Failed to fetch winners" });
  }
});


app.post("/api/admin/winners", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId, competitionId, prizeDescription, prizeValue, imageUrl } = req.body;
    
    if (!userId || !prizeDescription || !prizeValue) {
      return res.status(400).json({ message: "userId, prizeDescription, and prizeValue are required" });
    }

    const winner = await storage.createWinner({
      userId,
      competitionId: competitionId === null || competitionId === "" ? null : competitionId,
      prizeDescription,
      prizeValue,
      imageUrl: imageUrl === null || imageUrl === "" ? null : imageUrl,
      isShowcase: true, // Manual admin entries are showcase winners
    });

    res.json(winner);
  } catch (error) {
    console.error("Error creating winner:", error);
    res.status(500).json({ message: "Failed to create winner" });
  }
});

app.patch("/api/admin/winners/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, competitionId, prizeDescription, prizeValue, imageUrl, isShowcase } = req.body;

    const existingWinner = await storage.getWinner(id);
    if (!existingWinner) {
      return res.status(404).json({ message: "Winner not found" });
    }

    const updateData: any = {};
    if (userId !== undefined) updateData.userId = userId;
    if (competitionId !== undefined) updateData.competitionId = competitionId === null || competitionId === "" ? null : competitionId;
    if (prizeDescription !== undefined) updateData.prizeDescription = prizeDescription;
    if (prizeValue !== undefined) updateData.prizeValue = prizeValue;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl === null || imageUrl === "" ? null : imageUrl;
    if (isShowcase !== undefined) updateData.isShowcase = !!isShowcase; // Use isShowcase (not is_showcase)
// console.log('PATCH winner request:', {
//   id,
//   body: req.body,
//   isShowcase: req.body.isShowcase,
//   typeofIsShowcase: typeof req.body.isShowcase
// });
    const updatedWinner = await storage.updateWinner(id, updateData);
    res.json(updatedWinner);
  } catch (error) {
    console.error("Error updating winner:", error);
    res.status(500).json({ message: "Failed to update winner" });
  }
});

app.delete("/api/admin/winners/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existingWinner = await storage.getWinner(id);
    if (!existingWinner) {
      return res.status(404).json({ message: "Winner not found" });
    }

    await storage.deleteWinner(id);
    res.json({ message: "Winner deleted successfully" });
  } catch (error) {
    console.error("Error deleting winner:", error);
    res.status(500).json({ message: "Failed to delete winner" });
  }
});


app.post("/api/seed-competitions", async (req, res) => {
    try {
      const competitions = req.body;
      for (const comp of competitions) {
        await storage.createCompetition(comp);
      }
      res.json({ message: "Sample competitions created successfully" });
    } catch (error) {
      console.error("Error seeding competitions:", error);
      res.status(500).json({ message: "Failed to seed competitions" });
    }
  });

app.delete("/api/delete" , async (req , res) => {
    try {
    console.log("🗑️ Deleting all competitions...");
        await db.delete(transactions).execute();
        // 1. Delete tickets linked to competitions
    await db.delete(tickets).execute();
    // 2. Delete orders linked to competitions
    await db.delete(orders).execute();
    const result = await db.delete(competitions).execute();
    console.log("✅ Delete result:", result);
      res.status(200).json({message : "all competitions deleted"})
    } catch (error) {
      console.error("❌ Delete failed:", error);
      res.status(500).json({ message: "Failed to delete competitions" });
    }  })

app.delete("/api/test-delete", (req, res) => {

  res.json({ message: "Delete route works!" });
});


// Admin routes would go here (protected by isAdmin middleware)
// Admin Routes

// Get admin dashboard stats
app.get("/api/admin/dashboard", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    // Get total users
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);

    // Get total competitions
    const totalCompetitions = await db.select({ count: sql<number>`count(*)` }).from(competitions);

    // Get total revenue
    const revenueResult = await db.select({
      total: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`
    })
      .from(orders)
      .where(eq(orders.status, "completed"));

    // 👉 NEW: Total site credit across all users
    const totalSiteCreditResult = await db.select({
      total: sql<number>`coalesce(sum(${users.balance}), 0)`
    }).from(users);

    
   // 👉 NEW: Total approved withdrawals
    const totalApprovedWithdrawalsResult = await db.select({
      total: sql<number>`coalesce(sum(${withdrawalRequests.amount}), 0)`
    })
      .from(withdrawalRequests)
      .where(inArray(withdrawalRequests.status, ["approved", "processed"]));




    // Get recent orders
    const recentOrders = await db
      .select()
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(competitions, eq(orders.competitionId, competitions.id))
      .where(eq(orders.status, "completed")) 
      .orderBy(desc(orders.createdAt))
      .limit(10);

    res.json({
      stats: {
        totalUsers: totalUsers[0]?.count || 0,
        totalCompetitions: totalCompetitions[0]?.count || 0,
        totalRevenue: revenueResult[0]?.total || 0,

        // ⭐ Added fields
        totalSiteCredit: totalSiteCreditResult[0]?.total || 0,
        totalApprovedWithdrawals: totalApprovedWithdrawalsResult[0]?.total || 0,
      },

      recentOrders: recentOrders.map(order => ({
        id: order.orders.id,
        user: {
          firstName: order.users?.firstName,
          lastName: order.users?.lastName,
          email: order.users?.email,
        },
        competition: order.competitions?.title,
        amount: order.orders.totalAmount,
        status: order.orders.status,
        createdAt: order.orders.createdAt,
      }))
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});


app.get("/api/admin/wellbeing/daily-top-users",isAuthenticated, isAdmin, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Sum deposits per user for today
    const topDailyCashflowUsers = await db
      .select({
        userId: transactions.userId,
        totalDeposited: sql<number>`SUM(${transactions.amount})`,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(transactions)
      .leftJoin(users, eq(users.id, transactions.userId))
      .where(
        and(
          eq(transactions.type, "deposit"),
          gte(transactions.createdAt, startOfDay),
          lte(transactions.createdAt, endOfDay)
        )
      )
      .groupBy(transactions.userId, users.email, users.firstName, users.lastName)
      .orderBy(sql`SUM(${transactions.amount})`, "desc")
      

    res.json({ success: true, topDailyCashflowUsers });
  } catch (err) {
    console.error("Admin daily top users error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch daily top users" });
  }
});


app.get("/api/admin/wellbeing/requests",isAuthenticated, isAdmin, async (req, res) => {
  try {
    const requests = await db
      .select({
        id: wellbeingRequests.id,
        userId: wellbeingRequests.userId,
        email: users.email,          
        type: wellbeingRequests.type,
        daysRequested: wellbeingRequests.daysRequested,
        createdAt: wellbeingRequests.createdAt,
      })
      .from(wellbeingRequests)
      .leftJoin(users, eq(users.id, wellbeingRequests.userId))
      .orderBy(wellbeingRequests.createdAt, "desc");

    res.json({ success: true, requests });
  } catch (err) {
    console.error("Admin wellbeing requests error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch requests" });
  }
});

app.post("/api/admin/users/:id/disable", isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params; 
  const { days } = req.body; 

  try {
    const now = new Date();
    let disabledUntil = null;

    if (days && days > 0) {
      disabledUntil = new Date();
      disabledUntil.setDate(disabledUntil.getDate() + Number(days)); 
    }

    await db.update(users)
      .set({
        disabled: true,
        disabledAt: now,
        disabledUntil,
        updatedAt: now,
      })
      .where(eq(users.id, id));

    res.json({
      success: true,
      message: days
        ? `User disabled for ${days} days`
        : "User disabled indefinitely",
      disabledUntil,
    });

  } catch (err) {
    console.error("Admin disable error:", err);
    res.status(500).json({ success: false, message: "Failed to disable user" });
  }
});

app.post("/api/admin/users/:userId/enable", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    
    // Update user in database
    await db.update(users)
      .set({
        disabled: false,
        disabledAt: null,
        disabledUntil: null
      })
      .where(eq(users.id, userId));
    
    res.json({ 
      success: true, 
      message: "User enabled successfully" 
    });
  } catch (error) {
    console.error("Error enabling user:", error);
    res.status(500).json({ message: "Failed to enable user" });
  }
});

app.get("/api/admin/users/search", isAuthenticated, isAdmin, async (req, res) => {
  const { email } = req.query;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        dailySpendLimit: users.dailySpendLimit,
        selfSuspended: users.selfSuspended,
        selfSuspensionEndsAt: users.selfSuspensionEndsAt,
        disabled: users.disabled,
        disabledAt: users.disabledAt,
        disabledUntil: users.disabledUntil,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then(res => res[0] || null);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Search user error:", err);
    res.status(500).json({ success: false, message: "Failed to search user" });
  }
});



// Manage competitions
app.get("/api/admin/competitions", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const allCompetitions = await db.select()
      .from(competitions)
      .orderBy(asc(competitions.displayOrder), desc(competitions.createdAt));
    
    res.json(allCompetitions);
  } catch (error) {
    console.error("Error fetching competitions:", error);
    res.status(500).json({ message: "Failed to fetch competitions" });
  }
});

// Create competition
app.post("/api/admin/competitions", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const data = req.body;

    const competition = await storage.createCompetition({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: true,
    });

    // Broadcast real-time update
    wsManager.broadcast({ type: "competition_created" });

    res.status(201).json(competition);
  } catch (error) {
    console.error("Error creating competition:", error);
    res.status(500).json({ message: "Failed to create competition" });
  }
});


// Update competition
app.put("/api/admin/competitions/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    const formattedUpdateData: any = { ...req.body };

    // Always override updatedAt
    formattedUpdateData.updatedAt = new Date();

    // MUST NOT allow updating createdAt
    delete formattedUpdateData.createdAt;
    delete formattedUpdateData.created_at;

    function sanitizeTimestamps(obj: any) {
      for (const key in obj) {
        const value = obj[key];

         // convert empty string → null
    if (value === "") {
      obj[key] = null;
      continue;
    }

    // ONLY delete undefined (not null!)
    if (value === undefined) {
      delete obj[key];
      continue;
    }

        // Only these are timestamp columns in schema
        const timestampFields = ["endDate", "end_date", "updatedAt", "updated_at"];

        if (timestampFields.includes(key)) {
          const parsed = new Date(value);
          if (isNaN(parsed.getTime())) {
            delete obj[key];
          } else {
            obj[key] = parsed;
          }
        }

        // NEVER allow updating createdAt
        if (key === "createdAt" || key === "created_at") {
          delete obj[key];
        }
      }
    }

    sanitizeTimestamps(formattedUpdateData);

    const [updatedCompetition] = await db
      .update(competitions)
      .set(formattedUpdateData)
      .where(eq(competitions.id, id))
      .returning();

    if (!updatedCompetition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    wsManager.broadcast({ type: 'competition_updated', competitionId: id });
    res.json(updatedCompetition);

  } catch (error) {
    console.error("Error updating competition:", error);
    res.status(500).json({ message: "Failed to update competition" });
  }
});

// Update competition display order
app.patch("/api/admin/competitions/:id/display-order", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { displayOrder } = req.body;
    
    // Validate display order
    if (typeof displayOrder !== 'number' || displayOrder < 0) {
      return res.status(400).json({ message: "Invalid display order" });
    }
    
    const [updatedCompetition] = await db
      .update(competitions)
      .set({
        displayOrder,
        updatedAt: new Date(),
      })
      .where(eq(competitions.id, id))
      .returning();
    
    if (!updatedCompetition) {
      return res.status(404).json({ message: "Competition not found" });
    }
    
    res.json(updatedCompetition);
  } catch (error) {
    console.error("Error updating display order:", error);
    res.status(500).json({ message: "Failed to update display order" });
  }
});

// Delete competition
app.delete("/api/admin/competitions/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    // 🔥 NEW: First, get all order IDs for this competition
    const competitionOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.competitionId, id));
    
    const orderIds = competitionOrders.map(order => order.id);

    if (orderIds.length > 0) {
      // ✅ 1. Delete spin usage (NEW - this was missing!)
      await db
        .delete(spinUsage)
        .where(inArray(spinUsage.orderId, orderIds));

      // ✅ 2. Delete spin wins related to these orders
      await db
        .delete(spinWins)
        .where(inArray(spinWins.userId, db.select({ userId: orders.userId }).from(orders).where(eq(orders.competitionId, id))));

      // ✅ 3. Delete scratch card usage
      await db
        .delete(scratchCardUsage)
        .where(inArray(scratchCardUsage.orderId, orderIds));

      // ✅ 4. Delete scratch card wins
      await db
        .delete(scratchCardWins)
        .where(inArray(scratchCardWins.userId, db.select({ userId: orders.userId }).from(orders).where(eq(orders.competitionId, id))));
    }

    // ✅ 5. Delete all transactions related to orders for this competition
    await db
      .delete(transactions)
      .where(inArray(transactions.orderId, orderIds));

    // ✅ 6. Delete all tickets related to this competition
    await db.delete(tickets).where(eq(tickets.competitionId, id));

    // ✅ 7. Delete all winners related to this competition
    await db.delete(winners).where(eq(winners.competitionId, id));

    // ✅ 8. Delete all orders related to this competition
    await db.delete(orders).where(eq(orders.competitionId, id));

    // ✅ 9. Finally, delete the competition itself
    const [deletedCompetition] = await db
      .delete(competitions)
      .where(eq(competitions.id, id))
      .returning();

    if (!deletedCompetition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    // Broadcast real-time update
    wsManager.broadcast({ type: 'competition_deleted', competitionId: id });

    res.json({ message: "Competition deleted successfully" });
  } catch (error) {
    console.error("Error deleting competition:", error);
    res.status(500).json({ message: "Failed to delete competition" });
  }
});

// Get tickets for a competition
app.get("/api/admin/competitions/:id/tickets", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const competitionTickets = await db.select()
      .from(tickets)
      .where(eq(tickets.competitionId, id));
    
    res.json(competitionTickets);
  } catch (error) {
    console.error("Error fetching competition tickets:", error);
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

// Draw a winner for a competition
app.post("/api/admin/competitions/:id/draw-winner", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    // Get all tickets for this competition
    const competitionTickets = await db.select()
      .from(tickets)
      .where(eq(tickets.competitionId, id));
    
    if (competitionTickets.length === 0) {
      return res.status(400).json({ message: "No tickets found for this competition" });
    }
    
    // Randomly select a winning ticket
    const randomIndex = Math.floor(Math.random() * competitionTickets.length);
    const winningTicket = competitionTickets[randomIndex];
    
    // Get user and competition details
    const user = await storage.getUser(winningTicket.userId);
    const competition = await storage.getCompetition(id);
    
    if (!user || !competition) {
      return res.status(404).json({ message: "User or competition not found" });
    }
    
    // Create winner record
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.email;
    
    const [dbWinner] = await db.insert(winners).values({
      userId: user.id,
      competitionId: competition.id,
      prizeDescription: `Winner of ${competition.title}`,
      prizeValue: competition.ticketPrice,
    }).returning();
    
    // Broadcast real-time update
    wsManager.broadcast({ type: 'winner_drawn', competitionId: id });
    
    // Return enriched winner data for frontend
    res.json({ 
      winner: {
        ...dbWinner,
        userName,
        userEmail: user.email,
        competitionTitle: competition.title,
        prizeDetails: dbWinner.prizeDescription,
      }
    });
  } catch (error) {
    console.error("Error drawing winner:", error);
    res.status(500).json({ message: "Failed to draw winner" });
  }
});

// Game Spin Wheel Configuration Routes

// Update the existing game-spin-config endpoint
app.get("/api/admin/game-spin-config", isAuthenticated, async (req: any, res) => {
  try {
    const { gameSpinConfig } = await import("@shared/schema");
    const [config] = await db.select().from(gameSpinConfig).where(eq(gameSpinConfig.id, "active"));
    
    if (!config) {
      // Return default configuration if none exists in database
      return res.json(DEFAULT_SPIN_WHEEL_CONFIG);
    }
    
    // Get win stats for all segments
    const winStats = {};
    
    // Initialize with 0 for all segments
    const segments = config.segments || [];
    segments.forEach((segment: any) => {
      if (segment.id) {
        winStats[segment.id] = 0;
      }
    });
    
    // Get wins from spin_wins table (if you're tracking wins there)
    const spinWinsData = await db
      .select({
        segmentId: spinWins.segmentId,
        winCount: sql<number>`count(*)`
      })
      .from(spinWins)
      .groupBy(spinWins.segmentId);
    
    // Add the counts
    spinWinsData.forEach(win => {
      if (win.segmentId && winStats[win.segmentId] !== undefined) {
        winStats[win.segmentId] = Number(win.winCount);
      }
    });
    
    // Add win counts to segments
    const segmentsWithWins = segments.map((segment: any) => ({
      ...segment,
      currentWins: winStats[segment.id] || 0
    }));
    
    res.json({
      ...config,
      segments: segmentsWithWins
    });
    
  } catch (error) {
    console.error("Error fetching spin config:", error);
    res.status(500).json({ message: "Failed to fetch spin configuration" });
  }
});


app.put("/api/admin/game-spin-config", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { gameSpinConfig } = await import("@shared/schema");
    
    // Validate incoming data
    const validationResult = spinConfigSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid spin configuration", 
        errors: validationResult.error.issues 
      });
    }
    
    const { segments, maxSpinsPerUser, mysteryPrize, isVisible } = validationResult.data;
    
    // Validate total probability equals 100 (with 0.01% tolerance for decimal precision)
    const totalProbability = segments.reduce((sum, seg) => sum + seg.probability, 0);
    if (Math.abs(totalProbability - 100) >= 0.01) {
      return res.status(400).json({ 
        message: "Total probability must equal 100% (within 0.01% tolerance)", 
        currentTotal: totalProbability.toFixed(2)
      });
    }
    
    // Check if config exists
    const [existing] = await db.select().from(gameSpinConfig).where(eq(gameSpinConfig.id, "active"));
    
    if (existing) {
      // Update existing config
      const [updated] = await db
        .update(gameSpinConfig)
        .set({
          segments,
          maxSpinsPerUser: maxSpinsPerUser ?? null,
          mysteryPrize: mysteryPrize ?? existing.mysteryPrize,
          isVisible: isVisible ?? existing.isVisible,
          updatedAt: new Date(),
        })
        .where(eq(gameSpinConfig.id, "active"))
        .returning();
      
      res.json(updated);
    } else {
      // Insert new config
      const [created] = await db
        .insert(gameSpinConfig)
        .values({
          id: "active",
          segments,
          maxSpinsPerUser: maxSpinsPerUser ?? null,
          mysteryPrize: mysteryPrize ?? null,
          isVisible: isVisible ?? true,
          isActive: true,
        })
        .returning();
      
      res.json(created);
    }
  } catch (error) {
    console.error("Error updating spin config:", error);
    res.status(500).json({ message: "Failed to update spin configuration" });
  }
});

// Admin Game Spin 2 routes spinWheel2Configs
app.get("/api/admin/game-spin-2-config", isAuthenticated, async (req: any, res) => {
  try {
    const { spinWheel2Configs } = await import("@shared/schema");
    const [config] = await db.select().from(spinWheel2Configs).where(eq(spinWheel2Configs.id, "active"));
    
    if (!config) {
      // Return default configuration if none exists in database
      return res.json(DEFAULT_SPIN_WHEEL_2_CONFIG);
    }
    
    // Get win stats for all segments
    const winStats = {};
    
    // Initialize with 0 for all segments
    const segments = config.segments || [];
    segments.forEach((segment: any) => {
      if (segment.id) {
        winStats[segment.id] = 0;
      }
    });
    
    // Get wins from spin_wins table (if you're tracking wins there)
    const spinWinsData = await db
      .select({
        segmentId: spinWins.segmentId,
        winCount: sql<number>`count(*)`
      })
      .from(spinWins)
      .groupBy(spinWins.segmentId);
    
    // Add the counts
    spinWinsData.forEach(win => {
      if (win.segmentId && winStats[win.segmentId] !== undefined) {
        winStats[win.segmentId] = Number(win.winCount);
      }
    });
    
    // Add win counts to segments
    const segmentsWithWins = segments.map((segment: any) => ({
      ...segment,
      currentWins: winStats[segment.id] || 0
    }));
    
    res.json({
      ...config,
      segments: segmentsWithWins
    });
    
  } catch (error) {
    console.error("Error fetching spin config:", error);
    res.status(500).json({ message: "Failed to fetch spin configuration" });
  }
});

app.put("/api/admin/game-spin-2-config", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { spinWheel2Configs } = await import("@shared/schema");
    
    // Validate incoming data
    const validationResult = spinConfigSchema2.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid spin configuration", 
        errors: validationResult.error.issues 
      });
    }
    
    const { segments, maxSpinsPerUser, mysteryPrize, isVisible } = validationResult.data;
    
    // Validate total probability equals 100 (with 0.01% tolerance for decimal precision)
    const totalProbability = segments.reduce((sum, seg) => sum + seg.probability, 0);
    if (Math.abs(totalProbability - 100) >= 0.01) {
      return res.status(400).json({ 
        message: "Total probability must equal 100% (within 0.01% tolerance)", 
        currentTotal: totalProbability.toFixed(2)
      });
    }
    
    // Check if config exists
    const [existing] = await db.select().from(spinWheel2Configs).where(eq(spinWheel2Configs.id, "active"));
    
    if (existing) {
      // Update existing config
      const [updated] = await db
        .update(spinWheel2Configs)
        .set({
          segments,
          maxSpinsPerUser: maxSpinsPerUser ?? null,
          mysteryPrize: mysteryPrize ?? existing.mysteryPrize,
          isVisible: isVisible ?? existing.isVisible,
          updatedAt: new Date(),
        })
        .where(eq(spinWheel2Configs.id, "active"))
        .returning();
      
      res.json(updated);
    } else {
      // Insert new config
      const [created] = await db
        .insert(spinWheel2Configs)
        .values({
          id: "active",
          segments,
          maxSpinsPerUser: maxSpinsPerUser ?? null,
          mysteryPrize: mysteryPrize ?? null,
          isVisible: isVisible ?? true,
          isActive: true,
        })
        .returning();
      
      res.json(created);
    }
  } catch (error) {
    console.error("Error updating spin config:", error);
    res.status(500).json({ message: "Failed to update spin configuration" });
  }
});

// Add a test endpoint to check spin_wins data
app.get("/api/admin/test-spin-wins", isAuthenticated, async (req: any, res) => {
  try {
    const spinWinsData = await db
      .select({
        segmentId: spinWins.segmentId,
        winCount: sql<number>`count(*)`
      })
      .from(spinWins)
      .groupBy(spinWins.segmentId);
    
    const allWins = await db.select().from(spinWins).limit(10);
    
    res.json({
      totalWins: spinWinsData.reduce((sum, w) => sum + Number(w.winCount), 0),
      winsBySegment: spinWinsData,
      recentWins: allWins
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Game Scratch Card Configuration Routes
app.get("/api/admin/game-scratch-config", isAuthenticated, async (req: any, res) => {
  try {
    const { gameScratchConfig } = await import("@shared/schema");
    const [config] = await db.select().from(gameScratchConfig).where(eq(gameScratchConfig.id, "active"));
    
    if (!config) {
      return res.json({ isVisible: true });
    }
    
    res.json(config);
  } catch (error) {
    console.error("Error fetching scratch config:", error);
    res.status(500).json({ message: "Failed to fetch scratch configuration" });
  }
});

app.put("/api/admin/game-scratch-config", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { gameScratchConfig } = await import("@shared/schema");
    
    const validationResult = scratchConfigSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid scratch configuration", 
        errors: validationResult.error.issues 
      });
    }
    
    const { isVisible } = validationResult.data;
    
    const [existing] = await db.select().from(gameScratchConfig).where(eq(gameScratchConfig.id, "active"));
    
    if (existing) {
      const [updated] = await db
        .update(gameScratchConfig)
        .set({
          isVisible: isVisible ?? existing.isVisible,
          updatedAt: new Date(),
        })
        .where(eq(gameScratchConfig.id, "active"))
        .returning();
      
      res.json(updated);
    } else {
      const [created] = await db
        .insert(gameScratchConfig)
        .values({
          id: "active",
          mode: "tight",
          landmarkImages: [],
          cashPrizes: [],
          ringtunePrizes: [],
          isVisible: isVisible ?? true,
          isActive: true,
        })
        .returning();
      
      res.json(created);
    }
  } catch (error) {
    console.error("Error updating scratch config:", error);
    res.status(500).json({ message: "Failed to update scratch configuration" });
  }
});



app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Prevent self-deleting admin
    if (id === adminId) {
      return res.status(400).json({ message: "Admin cannot delete their own account" });
    }

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1️⃣ Get ALL order IDs for this user
    const ordersList = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.userId, id));

    const orderIds = ordersList.map(o => o.id);

    // 2️⃣ Delete transactions linked to these orders
    if (orderIds.length > 0) {
      await db
        .delete(transactions)
        .where(inArray(transactions.orderId, orderIds));
    }

    // 3️⃣ Delete user's own transactions
    await db
      .delete(transactions)
      .where(eq(transactions.userId, id));

    // 4️⃣ Delete tickets belonging to the user
    await db
      .delete(tickets)
      .where(eq(tickets.userId, id));

    // 5️⃣ Delete orders
    if (orderIds.length > 0) {
      await db
        .delete(orders)
        .where(inArray(orders.id, orderIds));
    }

    // 6️⃣ Remove this user from being someone’s referrer
    await db
      .update(users)
      .set({ referredBy: null })
      .where(eq(users.referredBy, id));

    // 7️⃣ Finally delete user
    await db
      .delete(users)
      .where(eq(users.id, id));

    res.json({ message: "User deleted successfully" });

  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

app.delete(
  "/api/admin/full-reset",
  isAuthenticated,
  isAdmin,
  async (req: any, res) => {
    try {
      
      // GAME DATA
      await db.delete(spinUsage);
      await db.delete(spinWins);
      await db.delete(scratchCardUsage);
      await db.delete(scratchCardWins);

      // CAMPAIGN EMAILS & CAMPAIGNS
      await db.delete(campaignEmails);
      await db.delete(promotionalCampaigns);

      // ENTRY DATA
      await db.delete(tickets);

      // ORDER AND WALLET DATA
      await db.delete(transactions);
      await db.delete(orders);

      // WITHDRAWALS
      await db.delete(withdrawalRequests);

      // WINNERS
      await db.delete(winners);

      // SCRATCH CARD CONFIG LIST
      await db.delete(scratchCardImages);


      // RESET PLATFORM SETTINGS
      await db.update(platformSettings).set({
        signupBonusEnabled: false,
        signupBonusCash: "0.00",
        signupBonusPoints: 0,
        commissionRate: "0.00",
        minimumTopUp: "10.00"
      });

      res.json({
        message: "Platform successfully reset. All data wiped except admin accounts."
      });

    } catch (error) {
      console.error("FULL RESET ERROR:", error);
      res.status(500).json({
        message: "Failed to reset platform"
      });
    }
  }
);

app.post("/api/admin/users/restrict/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    const user = await storage.getUser(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isRestricted)
      return res.status(400).json({ message: "User is already restricted" });

    await storage.updateUser(id, {
      isRestricted: true,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: "User restricted successfully", userId: id });

  } catch (error) {
    console.error("Error restricting user:", error);
    res.status(500).json({ message: "Failed to restrict user" });
  }
});

app.post("/api/admin/users/unrestrict/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    const user = await storage.getUser(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isRestricted)
      return res.status(400).json({ message: "User is not restricted" });

    await storage.updateUser(id, {
      isRestricted: false,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: "User unrestricted", userId: id });

  } catch (error) {
    console.error("Error unrestricting user:", error);
    res.status(500).json({ message: "Failed to unrestrict user" });
  }
});



// Deactivate user
app.delete("/api/admin/users/deactivate/:id" ,isAuthenticated, isAdmin, async (req:any , res)=>{
  try {
    const { id} = req.params;
    const userId = req.user.id;

    if(id === userId){
      return res.status(400).json({ message : "admin cannnot deactivate own account"})
    }

    const user = await storage.getUser(id);

    if(!user){
      return res.status(404).json({ message : "user not found"})
    }

     await storage.updateUser(id, { 
      isActive: false, 
      email: `deleted_${Date.now()}_${user.email}` // Prevent email reuse
    });

    res.status(200).json({ message: "User deactivated successfully" });

  } catch (error) {
     console.error("Error deactivating user:", error);
    res.status(500).json({ message: "Failed to deactivate user" });
  }
})

// Manage users
app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { dateFrom, dateTo, search } = req.query;
    
    let query = db.select().from(users);
    
    // Apply date filtering
    const conditions = [];
    if (dateFrom) {
      conditions.push(gte(users.createdAt, new Date(dateFrom as string)));
    }
    if (dateTo) {
      const endDate = new Date(dateTo as string);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(users.createdAt, endDate));
    }
    
    // Apply search filter
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(users.email, searchTerm),
          like(users.firstName, searchTerm),
          like(users.lastName, searchTerm)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const allUsers = await query.orderBy(desc(users.createdAt));
    
    res.json(allUsers.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      balance: user.balance,
      phoneNumber: user.phoneNumber,
      ringtonePoints: user.ringtonePoints,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      addressStreet: user.addressStreet,
      addressCity: user.addressCity,
      addressPostcode: user.addressPostcode,
      addressCountry: user.addressCountry,
      notes: user.notes, 
      
      // ADD THESE DISABLE FIELDS:
      disabled: user.disabled,           // Add this line
      disabledAt: user.disabledAt,       // Add this line
      disabledUntil: user.disabledUntil  // Add this line
    })));
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});
// Get single user by ID (simple version)
app.get("/api/admin/users/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      phoneNumber: user.phoneNumber,
      profileImageUrl: user.profileImageUrl,
      balance: user.balance,
      ringtonePoints: user.ringtonePoints,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      isRestricted: user.isRestricted,
      restrictedAt: user.restrictedAt,
      emailVerified: user.emailVerified,
      receiveNewsletter: user.receiveNewsletter,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      addressStreet: user.addressStreet,
      addressCity: user.addressCity,
      addressPostcode: user.addressPostcode,
      addressCountry: user.addressCountry,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Update user
app.put("/api/admin/users/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phoneNumber:updatedUser.phoneNumber,
      balance: updatedUser.balance,
      ringtonePoints: updatedUser.ringtonePoints,
      isAdmin: updatedUser.isAdmin,
      notes: updatedUser.notes, 
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// Reset user password (admin only)
app.post("/api/admin/users/:id/reset-password", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    
    const hashedPassword = await hashPassword(password);
    
    const [updatedUser] = await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log(`Admin ${req.user.email} reset password for user ${updatedUser.email}`);
    
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

// Get all orders
app.get("/api/admin/orders", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { dateFrom, dateTo, search } = req.query;
    
    let query = db
      .select()
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(competitions, eq(orders.competitionId, competitions.id));
    
    // Apply date filtering
    const conditions = [];
    if (dateFrom) {
      conditions.push(gte(orders.createdAt, new Date(dateFrom as string)));
    }
    if (dateTo) {
      const endDate = new Date(dateTo as string);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(orders.createdAt, endDate));
    }
    
    // Apply search filter
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(users.email, searchTerm),
          like(users.firstName, searchTerm),
          like(users.lastName, searchTerm),
          like(competitions.title, searchTerm),
          like(orders.id, searchTerm)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const allOrders = await query.orderBy(desc(orders.createdAt));
    
    res.json(allOrders.map(order => ({
      id: order.orders.id,
      user: {
        id: order.users?.id,
        firstName: order.users?.firstName,
        lastName: order.users?.lastName,
        email: order.users?.email,
      },
      competition: order.competitions?.title,
      quantity: order.orders.quantity,
      totalAmount: order.orders.totalAmount,
      paymentMethod: order.orders.paymentMethod,
      status: order.orders.status,
      createdAt: order.orders.createdAt,
      walletAmount: order.orders.walletAmount,       // ✅ add this
    pointsAmount: order.orders.pointsAmount,       // ✅ add this
    cashflowsAmount: order.orders.cashflowsAmount, // ✅ add this
    })));
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Delete order
app.delete("/api/admin/orders/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete dependent transactions first
    await db.delete(transactions).where(eq(transactions.orderId, id));

    // Delete dependent tickets
    await db.delete(tickets).where(eq(tickets.orderId, id));

    // Delete the order
    const [deleted] = await db
      .delete(orders)
      .where(eq(orders.id, id))
      .returning();

    if (!deleted) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
});


// Get system analytics
app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    // Daily revenue for last 7 days
    const revenueByDay = await db
      .select({
        date: sql<string>`date(${orders.createdAt})`,
        revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.status, "completed"),
          sql`${orders.createdAt} >= now() - interval '7 days'`
        )
      )
      .groupBy(sql`date(${orders.createdAt})`)
      .orderBy(sql`date(${orders.createdAt})`);

    // Competition performance
    const competitionPerformance = await db
      .select({
        competitionId: competitions.id,
        title: competitions.title,
        ticketPrice: competitions.ticketPrice,
        soldTickets: competitions.soldTickets,
        maxTickets: competitions.maxTickets,
        revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
      })
      .from(competitions)
      .leftJoin(orders, eq(competitions.id, orders.competitionId))
      .groupBy(competitions.id, competitions.title, competitions.ticketPrice, competitions.soldTickets, competitions.maxTickets)
      .orderBy(sql`coalesce(sum(${orders.totalAmount}), 0) DESC`);

    res.json({
      revenueByDay,
      competitionPerformance,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

// Platform settings endpoints
app.get("/api/admin/settings", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const settings = await storage.getPlatformSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    res.status(500).json({ message: "Failed to fetch platform settings" });
  }
});

app.put("/api/admin/settings", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const updates = req.body;
    const updatedSettings = await storage.updatePlatformSettings(updates);
    res.json(updatedSettings);
  } catch (error) {
    console.error("Error updating platform settings:", error);
    res.status(500).json({ message: "Failed to update platform settings" });
  }
});

// Admin credential management endpoints
app.post("/api/admin/change-username", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { changeAdminUsernameSchema } = await import("@shared/schema");
    
    // Validate request body
    const validationResult = changeAdminUsernameSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: validationResult.error.errors[0]?.message || "Invalid username" 
      });
    }

    const { newUsername } = validationResult.data;
    const adminId = req.user.id;

    // Update admin's firstName (username)
    await storage.updateUser(adminId, { firstName: newUsername });

    // Audit log
    console.log(`[INFO] Admin username changed - AdminID: ${adminId}, Action: username_change, Timestamp: ${new Date().toISOString()}`);

    res.json({ 
      success: true, 
      message: "Username updated successfully" 
    });
  } catch (error) {
    console.error("[WARN] Failed to change admin username:", error);
    res.status(500).json({ message: "Failed to update username" });
  }
});

app.post("/api/admin/change-password", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { changeAdminPasswordSchema } = await import("@shared/schema");
    
    // Validate request body
    const validationResult = changeAdminPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: validationResult.error.errors[0]?.message || "Invalid password" 
      });
    }

    const { currentPassword, newPassword } = validationResult.data;
    const adminId = req.user.id;

    // Get current user to verify password
    const admin = await storage.getUser(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      console.log(`[WARN] Failed password change attempt - AdminID: ${adminId}, Reason: incorrect_current_password, Timestamp: ${new Date().toISOString()}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if new password is same as current (optional security check)
    const isSamePassword = await verifyPassword(newPassword, admin.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await storage.updateUser(adminId, { password: hashedPassword });

    // Audit log (never log passwords)
    console.log(`[INFO] Admin password changed successfully - AdminID: ${adminId}, Action: password_change, Timestamp: ${new Date().toISOString()}`);

    res.json({ 
      success: true, 
      message: "Password updated successfully" 
    });
  } catch (error) {
    console.error("[WARN] Failed to change admin password:", error);
    res.status(500).json({ message: "Failed to update password" });
  }
});

// Scratch card image configuration endpoints
// GET endpoint is accessible to all authenticated users (they need to see the cards to play)
app.get("/api/admin/scratch-images", isAuthenticated, async (req: any, res) => {
  try {
    const images = await storage.getScratchCardImages();
    res.json(images);
  } catch (error) {
    console.error("Error fetching scratch card images:", error);
    res.status(500).json({ message: "Failed to fetch scratch card images" });
  }
});

app.post("/api/admin/scratch-images", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const imageData = req.body;
    const created = await storage.createScratchCardImage(imageData);
    res.json(created);
  } catch (error) {
    console.error("Error creating scratch card image:", error);
    res.status(500).json({ message: "Failed to create scratch card image" });
  }
});

app.put("/api/admin/scratch-images/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await storage.updateScratchCardImage(id, updates);
    res.json(updated);
  } catch (error) {
    console.error("Error updating scratch card image:", error);
    res.status(500).json({ message: "Failed to update scratch card image" });
  }
});

app.delete("/api/admin/scratch-images/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    await storage.deleteScratchCardImage(id);
    res.json({ message: "Scratch card image deleted successfully" });
  } catch (error) {
    console.error("Error deleting scratch card image:", error);
    res.status(500).json({ message: "Failed to delete scratch card image" });
  }
});

// Marketing routes
app.get("/api/admin/marketing/subscribers", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const subscribers = await storage.getNewsletterSubscribers();
    res.json(subscribers);
  } catch (error) {
    console.error("Error fetching newsletter subscribers:", error);
    res.status(500).json({ message: "Failed to fetch newsletter subscribers" });
  }
});

app.get("/api/admin/marketing/campaigns", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const campaigns = await storage.getPromotionalCampaigns();
    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
});

app.get("/api/admin/marketing/campaigns/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const campaign = await storage.getPromotionalCampaignById(id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    res.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({ message: "Failed to fetch campaign" });
  }
});

app.post("/api/admin/marketing/campaigns", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const campaignData = {
      ...req.body,
      createdBy: req.user.id,
      status: "draft",
      // Convert expiryDate string to Date object if provided
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
    };
    const campaign = await storage.createPromotionalCampaign(campaignData);
    res.json(campaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ message: "Failed to create campaign" });
  }
});

app.post("/api/admin/marketing/campaigns/:id/send", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const campaign = await storage.getPromotionalCampaignById(id);
    
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status === "sent") {
      return res.status(400).json({ message: "Campaign has already been sent" });
    }

    // Get all newsletter subscribers
    const subscribers = await storage.getNewsletterSubscribers();
    
    if (subscribers.length === 0) {
      return res.status(400).json({ message: "No subscribers found" });
    }

    // Send emails to all subscribers
    let sentCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      try {
        await sendPromotionalEmail(subscriber.email, campaign);
        
        // Record email send
        await storage.createCampaignEmail({
          campaignId: campaign.id,
          userId: subscriber.id,
          email: subscriber.email,
          deliveryStatus: "sent",
        });
        
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${subscriber.email}:`, emailError);
        failedCount++;
        
        // Record failed email
        await storage.createCampaignEmail({
          campaignId: campaign.id,
          userId: subscriber.id,
          email: subscriber.email,
          deliveryStatus: "failed",
        });
      }
    }

    // Update campaign status
    await storage.updatePromotionalCampaign(id, {
      status: "sent",
      sentAt: new Date(),
      recipientCount: sentCount,
    });

    res.json({
      message: "Campaign sent successfully",
      sentCount,
      failedCount,
      totalSubscribers: subscribers.length,
    });
  } catch (error) {
    console.error("Error sending campaign:", error);
    res.status(500).json({ message: "Failed to send campaign" });
  }
});

app.delete("/api/admin/marketing/campaigns/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    await storage.deletePromotionalCampaign(id);
    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ message: "Failed to delete campaign" });
  }
});

app.get("/api/admin/marketing/stats", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const subscribers = await storage.getNewsletterSubscribers();
    const campaigns = await storage.getPromotionalCampaigns();
    
    const stats = {
      totalSubscribers: subscribers.length,
      totalCampaigns: campaigns.length,
      sentCampaigns: campaigns.filter(c => c.status === "sent").length,
      draftCampaigns: campaigns.filter(c => c.status === "draft").length,
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching marketing stats:", error);
    res.status(500).json({ message: "Failed to fetch marketing stats" });
  }
});

app.get("/api/maintenance", async (req, res) => {
  try {
    const [settings] = await db.select().from(platformSettings).limit(1);

    res.json({
      maintenanceMode: settings?.maintenanceMode || false
    });

  } catch (err) {
    console.error("Error fetching maintenance:", err);
    res.json({ maintenanceMode: false });
  }
});


app.post("/api/admin/maintenance/on", isAuthenticated, isAdmin, async (req, res) => {
  const [updated] = await db
    .update(platformSettings)
    .set({ maintenanceMode: true, updatedAt: new Date() })
    .returning();

  res.json({ message: "Maintenance mode enabled", settings: updated });
});

app.post("/api/admin/maintenance/off", isAuthenticated, isAdmin, async (req, res) => {
  const [updated] = await db
    .update(platformSettings)
    .set({ maintenanceMode: false, updatedAt: new Date() })
    .returning();

  res.json({ message: "Maintenance mode disabled", settings: updated });
});

// ==================== SUPPORT TICKET ROUTES ====================

// User: Get unread ticket count
app.get("/api/support/unread-count", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const count = await storage.getUserUnreadTicketCount(userId);
    res.json({ count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ message: "Failed to get unread count" });
  }
});

// Admin: Get unread ticket count
app.get("/api/admin/support/unread-count", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const count = await storage.getAdminUnreadTicketCount();
    res.json({ count });
  } catch (error) {
    console.error("Error getting admin unread count:", error);
    res.status(500).json({ message: "Failed to get unread count" });
  }
});


// User: Get their support tickets
app.get("/api/support/tickets", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const tickets = await storage.getUserSupportTickets(userId);
    // Mark as read by user when they view the list
    await storage.markTicketsAsReadByUser(userId);
    res.json(tickets);
  } catch (error) {
    console.error("Error getting user tickets:", error);
    res.status(500).json({ message: "Failed to get tickets" });
  }
});

// User: Create a support ticket
app.post("/api/support/tickets", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { subject, description, imageUrls } = req.body;
    
    if (!subject || !description) {
      return res.status(400).json({ message: "Subject and description are required" });
    }

    const ticket = await storage.createSupportTicket({
      userId,
      subject,
      description,
      imageUrls: imageUrls || [],
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: "Failed to create ticket" });
  }
});

// User: Get single ticket
app.get("/api/support/tickets/:id", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const ticket = await storage.getSupportTicket(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Mark as read by user
    if (ticket.userHasUnread) {
      await storage.updateSupportTicket(ticket.id, { userHasUnread: false });
    }

    res.json(ticket);
  } catch (error) {
    console.error("Error getting ticket:", error);
    res.status(500).json({ message: "Failed to get ticket" });
  }
});

// Admin: Get all support tickets
app.get("/api/admin/support/tickets", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const tickets = await storage.getSupportTickets();
    
    // Get user info for each ticket
    const ticketsWithUsers = await Promise.all(
      tickets.map(async (ticket) => {
        const user = await storage.getUser(ticket.userId);
        return {
          ...ticket,
          user: user ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          } : null,
        };
      })
    );
    
    res.json(ticketsWithUsers);
  } catch (error) {
    console.error("Error getting admin tickets:", error);
    res.status(500).json({ message: "Failed to get tickets" });
  }
});

// Admin: Get single ticket
app.get("/api/admin/support/tickets/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const ticket = await storage.getSupportTicket(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Mark as read by admin
    await storage.markTicketAsReadByAdmin(ticket.id);

    const user = await storage.getUser(ticket.userId);
    
    res.json({
      ...ticket,
      user: user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      } : null,
    });
  } catch (error) {
    console.error("Error getting ticket:", error);
    res.status(500).json({ message: "Failed to get ticket" });
  }
});

// Admin: Update ticket status/response
app.patch("/api/admin/support/tickets/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { status, adminResponse, priority, adminImageUrls } = req.body;
    
    const ticket = await storage.getSupportTicket(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      if (status === "resolved" || status === "closed") {
        updateData.resolvedAt = new Date();
      }
    }
    
    if (adminResponse !== undefined) {
      updateData.adminResponse = adminResponse;
      updateData.userHasUnread = true; // Notify user of update
    }
    
    if (priority) {
      updateData.priority = priority;
    }
    
    if (adminImageUrls !== undefined) {
      // Append new images to existing ones
      const existingImages = ticket.adminImageUrls || [];
      updateData.adminImageUrls = [...existingImages, ...adminImageUrls];
      updateData.userHasUnread = true; // Notify user of update
    }

    const updated = await storage.updateSupportTicket(req.params.id, updateData);
    res.json(updated);
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({ message: "Failed to update ticket" });
  }
});

// Admin: Delete ticket
app.delete("/api/admin/support/tickets/:id", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const ticket = await storage.getSupportTicket(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await storage.deleteSupportTicket(req.params.id);
    res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ message: "Failed to delete ticket" });
  }
});

// Upload support ticket images - use local storage fallback when Cloudinary is not configured
// const supportUploadStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = 'public/uploads/support';
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const ext = file.originalname.split('.').pop();
//     cb(null, `support-${uniqueSuffix}.${ext}`);
//   }
// });

// const supportUpload = multer({ 
//   storage: supportUploadStorage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
//     }
//   }
// });

app.post("/api/support/upload", isAuthenticated, upload.array("images", 5), async (req: any, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Map uploaded files to their Cloudinary URLs
    const imageUrls = (req.files as Express.Multer.File[]).map(file => file.path);

    res.json({ imageUrls }); // return array of uploaded image URLs
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({ message: "Failed to upload images" });
  }
});

// Get messages for a ticket (user)
app.get("/api/support/tickets/:id/messages", isAuthenticated, async (req: any, res) => {
  try {
    const ticket = await storage.getSupportTicket(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (ticket.userId !== req.user!.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    const messages = await storage.getMessagesByTicketId(req.params.id);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// User: Add a message to their ticket
app.post("/api/support/tickets/:id/messages", isAuthenticated, async (req: any, res) => {
  try {
    const ticket = await storage.getSupportTicket(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (ticket.userId !== req.user!.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (ticket.status === "closed") {
      return res.status(400).json({ message: "Cannot add messages to a closed ticket" });
    }

    const parsed = insertSupportMessageSchema.safeParse({
      ticketId: req.params.id,
      senderId: req.user!.id,
      senderType: "user",
      message: req.body.message,
      imageUrls: req.body.imageUrls || [],
    });

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid message data", errors: parsed.error.errors });
    }

    const message = await storage.createSupportMessage(parsed.data);

    // Mark ticket as unread for admin
    await storage.updateSupportTicket(req.params.id, { 
      adminHasUnread: true,
      updatedAt: new Date() 
    });

    res.json(message);
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ message: "Failed to add message" });
  }
});

// Admin: Get messages for a ticket
app.get("/api/admin/support/tickets/:id/messages", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const messages = await storage.getMessagesByTicketId(req.params.id);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Admin: Add a message to a ticket
app.post("/api/admin/support/tickets/:id/messages", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const ticket = await storage.getSupportTicket(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const parsed = insertSupportMessageSchema.safeParse({
      ticketId: req.params.id,
      senderId: req.user!.id,
      senderType: "admin",
      message: req.body.message,
      imageUrls: req.body.imageUrls || [],
    });

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid message data", errors: parsed.error.errors });
    }

    const message = await storage.createSupportMessage(parsed.data);

    // Mark ticket as unread for user and update status
    await storage.updateSupportTicket(req.params.id, { 
      userHasUnread: true,
      status: "in_progress",
      updatedAt: new Date() 
    });

    res.json(message);
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ message: "Failed to add message" });
  }
});

app.patch("/api/admin/support/tickets/:id/mark-as-read", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    
       // Use the correct method name
    await storage.markTicketAsReadByAdmin(id);
    
    // Fetch the updated ticket
    const updatedTicket = await storage.getSupportTicket(id);
    
    res.json(updatedTicket)
  } catch (error) {
    console.error("Error marking ticket as read:", error);
    res.status(500).json({ message: "Failed to mark ticket as read" });
  }
});



const httpServer = createServer(app);
return httpServer;
}