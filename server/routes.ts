import type { Express, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from 'bcrypt';
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
  supportMessages,
  gamePopConfig,
  popPrizes,
  popUsage,
  popWins,
  savedBankAccounts,
  discountCodes,
  discountCodeUsages,
  gamePlinkoConfig,
  plinkoPrizes,
  plinkoUsage,
  plinkoWins,
  userVerifications,
  userIpLogs,
  gamePrizes,
  redeemCodeBatches,
  redeemCodes,
  redeemCodeRedemptions,
  pushMessages,
  userNotifications,
  smsMessages,
  smsDeliveries,
  voltzWins,
  voltzPrizes,
  gameVoltzConfig,
  voltzUsage,
  pushNotifications,
  pushDeliveries,
  faqs,
  competitionPrizes,
  royalWins,
  royalPrizes,
  royalUsage,
  gameRoyalConfig,
  gameSlotConfig,
  slotUsage
} from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { stripe } from "./stripe";
import { cashflows } from "./cashflows";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  sql,
  like,
  gte,
  lte,
  or,
} from "drizzle-orm";
import { count, gt, isNull, ne } from "drizzle-orm/sql";
import { z } from "zod";
import {
  sendOrderConfirmationEmail,
  sendWelcomeEmail,
  sendPromotionalEmail,
  sendPasswordResetEmail,
  sendTopupConfirmationEmail,
} from "./email";
import { wsManager } from "./websocket";

import { applySelfSuspensionExpiry, isNotRestricted } from "./restriction";
import {
  createS3Uploader,
  createVideoUploader,
  deleteR2Object,
} from "./cloudeflare/cloudeflareHelper";
import { OTPGenerator } from "./otp";
import { sendVerificationEmail } from "./emails/verification-email";
import { createPrizeSchema, updatePrizeSchema } from "./validators/prizeSchema";
import { SMSService } from "./services/sms.service";
import { calculateDiscountedTotal } from "./utils/discounts";
import { syncPlinkoPrize, syncPopPrize, syncScratchPrize, syncSlotPrize, syncSpinPrize, syncVoltzPrize } from "./services/prize-sync";

const supportUpload = createS3Uploader("support");
const competitionUpload = createS3Uploader("competitions");
const verificationUpload = createS3Uploader("Verifications");
// Default spin wheel configuration - 26 segments with 6 evenly-distributed black segments
// Color palette: Black #000000, Red #FE0000, White #FFFFFF, Blue #1E54FF, Yellow #FEED00, Green #00A223
// 6 Black segments evenly distributed: X icons at positions 1, 5, 10, 15, 20 + R_Prize at position 26 (mystery prize)
// Icon order based on uploaded image (clockwise from top X)
// Total probability MUST equal 100% exactly
const DEFAULT_SPIN_WHEEL_CONFIG = {
  id: "active",
  segments: [
    {
      id: "1",
      label: "Nice Try",
      color: "#000000",
      iconKey: "NoWin",
      rewardType: "lose",
      rewardValue: 0,
      probability: 3,
      maxWins: null,
    },
    {
      id: "2",
      label: "Mini Cooper",
      color: "#FE0000",
      iconKey: "MiniCooper",
      rewardType: "cash",
      rewardValue: 0.55,
      probability: 4,
      maxWins: null,
    },
    {
      id: "3",
      label: "Mercedes Benz",
      color: "#FFFFFF",
      iconKey: "MercedesBenz",
      rewardType: "cash",
      rewardValue: 0.6,
      probability: 4,
      maxWins: null,
    },
    {
      id: "4",
      label: "Nissan",
      color: "#1E54FF",
      iconKey: "Nissan",
      rewardType: "points",
      rewardValue: 50,
      probability: 4,
      maxWins: null,
    },
    {
      id: "5",
      label: "Nice Try",
      color: "#000000",
      iconKey: "NoWin",
      rewardType: "lose",
      rewardValue: 0,
      probability: 8,
      maxWins: null,
    },
    {
      id: "6",
      label: "Bentley",
      color: "#00A223",
      iconKey: "Bentley",
      rewardType: "cash",
      rewardValue: 0.25,
      probability: 4,
      maxWins: null,
    },
    {
      id: "7",
      label: "Porsche",
      color: "#FEED00",
      iconKey: "Porsche",
      rewardType: "cash",
      rewardValue: 0.8,
      probability: 4,
      maxWins: null,
    },
    {
      id: "8",
      label: "Lexus",
      color: "#FE0000",
      iconKey: "Lexus",
      rewardType: "points",
      rewardValue: 850,
      probability: 3,
      maxWins: null,
    },
    {
      id: "9",
      label: "McLaren",
      color: "#FFFFFF",
      iconKey: "McLaren",
      rewardType: "cash",
      rewardValue: 0.7,
      probability: 3,
      maxWins: null,
    },
    {
      id: "10",
      label: "Nice Try",
      color: "#000000",
      iconKey: "NoWin",
      rewardType: "lose",
      rewardValue: 0,
      probability: 8,
      maxWins: null,
    },
    {
      id: "11",
      label: "Aston Martin",
      color: "#FEED00",
      iconKey: "AstonMartin",
      rewardType: "cash",
      rewardValue: 0.15,
      probability: 3,
      maxWins: null,
    },
    {
      id: "12",
      label: "Lamborghini",
      color: "#00A223",
      iconKey: "Lamborghini",
      rewardType: "cash",
      rewardValue: 0.9,
      probability: 3,
      maxWins: null,
    },
    {
      id: "13",
      label: "Jaguar",
      color: "#1E54FF",
      iconKey: "Jaguar",
      rewardType: "points",
      rewardValue: 1000,
      probability: 3,
      maxWins: null,
    },
    {
      id: "14",
      label: "Maserati",
      color: "#FE0000",
      iconKey: "Maserati",
      rewardType: "cash",
      rewardValue: 5,
      probability: 2,
      maxWins: 10,
    },
    {
      id: "15",
      label: "Nice Try",
      color: "#000000",
      iconKey: "NoWin",
      rewardType: "lose",
      rewardValue: 0,
      probability: 8,
      maxWins: null,
    },
    {
      id: "16",
      label: "Honda",
      color: "#1E54FF",
      iconKey: "Honda",
      rewardType: "points",
      rewardValue: 150,
      probability: 3,
      maxWins: null,
    },
    {
      id: "17",
      label: "BMW",
      color: "#FEED00",
      iconKey: "BMW",
      rewardType: "cash",
      rewardValue: 0.5,
      probability: 3,
      maxWins: null,
    },
    {
      id: "18",
      label: "Audi",
      color: "#00A223",
      iconKey: "Audi",
      rewardType: "points",
      rewardValue: 3000,
      probability: 3,
      maxWins: null,
    },
    {
      id: "19",
      label: "Ford",
      color: "#FFFFFF",
      iconKey: "Ford",
      rewardType: "points",
      rewardValue: 100,
      probability: 3,
      maxWins: null,
    },
    {
      id: "20",
      label: "Nice Try",
      color: "#000000",
      iconKey: "NoWin",
      rewardType: "lose",
      rewardValue: 0,
      probability: 8,
      maxWins: null,
    },
    {
      id: "21",
      label: "Toyota",
      color: "#FFFFFF",
      iconKey: "Toyota",
      rewardType: "points",
      rewardValue: 250,
      probability: 3,
      maxWins: null,
    },
    {
      id: "22",
      label: "Land Rover",
      color: "#1E54FF",
      iconKey: "LandRover",
      rewardType: "points",
      rewardValue: 2000,
      probability: 3,
      maxWins: null,
    },
    {
      id: "23",
      label: "Ferrari",
      color: "#FEED00",
      iconKey: "Ferrari",
      rewardType: "cash",
      rewardValue: 0.5,
      probability: 3,
      maxWins: null,
    },
    {
      id: "24",
      label: "Rolls Royce",
      color: "#00A223",
      iconKey: "RollsRoyce",
      rewardType: "cash",
      rewardValue: 0.1,
      probability: 3,
      maxWins: null,
    },
    {
      id: "25",
      label: "Volkswagen",
      color: "#FE0000",
      iconKey: "Volkswagen",
      rewardType: "points",
      rewardValue: 450,
      probability: 3,
      maxWins: null,
    },
    {
      id: "26",
      label: "R Prize",
      color: "#000000",
      iconKey: "R_Prize",
      rewardType: "cash",
      rewardValue: 100,
      probability: 1,
      maxWins: 1,
    },
  ],
  maxSpinsPerUser: null,
  mysteryPrize: {
    rewardType: "cash",
    rewardValue: 100,
    probability: 1,
    maxWins: 1,
    segmentId: "26",
  },
  isActive: true,
  isVisible: true,
};
// Verify total probability = 100 at module load
const totalProb = DEFAULT_SPIN_WHEEL_CONFIG.segments.reduce(
  (sum, s) => sum + s.probability,
  0
);
if (totalProb !== 100) {
  throw new Error(
    `DEFAULT_SPIN_WHEEL_CONFIG probabilities total ${totalProb}, must be 100`
  );
}

const DEFAULT_SPIN_WHEEL_2_CONFIG = {
  id: "active",
  name: "Arcade Spin",
  segments: [ 
    // Segment 1-12 (exactly 12 segments total)
    { id: "1", label: "Dead", color: "#000000", iconKey: "Dead", rewardType: "lose", rewardValue: 0, probability: 10, maxWins: null },
    { id: "2", label: "Bomb", color: "#2B2B2B", iconKey: "Bomb", rewardType: "lose", rewardValue: 0, probability: 6, maxWins: null },
    { id: "3", label: "Coin", color: "#FFD700", iconKey: "Coin", rewardType: "cash", rewardValue: 50, probability: 7, maxWins: null },
    { id: "4", label: "Fire", color: "#FF4500", iconKey: "Fire", rewardType: "cash", rewardValue: 75, probability: 6, maxWins: null },
    { id: "5", label: "Heart", color: "#E63946", iconKey: "Heart", rewardType: "points", rewardValue: 200, probability: 7, maxWins: null },
    { id: "6", label: "Chemical", color: "#9B5DE5", iconKey: "Chemical", rewardType: "points", rewardValue: 300, probability: 6, maxWins: null },
    { id: "7", label: "Star", color: "#FCA311", iconKey: "Star", rewardType: "cash", rewardValue: 150, probability: 5, maxWins: null },
    { id: "8", label: "Shield", color: "#3A86FF", iconKey: "Shield", rewardType: "cash", rewardValue: 200, probability: 4, maxWins: null },
    { id: "9", label: "Key", color: "#FFD166", iconKey: "Key", rewardType: "points", rewardValue: 500, probability: 4, maxWins: null },
    { id: "10", label: "Current", color: "#00F5D4", iconKey: "Current", rewardType: "cash", rewardValue: 300, probability: 3, maxWins: null },
    { id: "11", label: "Treasure", color: "#FFBE0B", iconKey: "Treasure", rewardType: "cash", rewardValue: 750, probability: 2, maxWins: null },
    { id: "12", label: "Diamond", color: "#00BBF9", iconKey: "Diamond", rewardType: "cash", rewardValue: 2000, probability: 1, maxWins: null },
  ],
  maxSpinsPerUser: null,
  mysteryPrize: null, // No mystery prize for 12-segment wheel
  isActive: true,
  isVisible: true,
};

// Verify total probability = 100
const totalProb2 = DEFAULT_SPIN_WHEEL_2_CONFIG.segments.reduce(
  (sum, s) => sum + s.probability,
  0
);
console.log(`Arcade Wheel Total Probability: ${totalProb2}%`); // Should be 100%

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
  segments: z
    .array(spinSegmentSchema)
    .length(26, "Must have exactly 26 segments"),
  maxSpinsPerUser: z.number().nullable().optional(),
  mysteryPrize: mysteryPrizeSchema.optional(),
  isVisible: z.boolean().optional(),
});

const spinConfigSchema2 = z.object({
  segments: z
    .array(spinSegmentSchema)
    .length(12, "Must have exactly 12 segments"),
  maxSpinsPerUser: z.number().nullable().optional(),
  mysteryPrize: mysteryPrizeSchema.optional(),
  isVisible: z.boolean().optional(),
});

const scratchConfigSchema = z.object({
  isVisible: z.boolean().optional(),
});

// Ringtone Pop configuration schema (matching Spin Wheel segments structure)
const popSegmentSchema = z.object({
  id: z.string(),
  label: z.string(),
  rewardType: z.enum(["cash", "points", "lose", "try_again"]),
  rewardValue: z.union([z.number(), z.string()]),
  probability: z.number().min(0).max(100),
  maxWins: z.number().nullable(),
  currentWins: z.number().default(0),
});

const popConfigSchema = z.object({
  segments: z.array(popSegmentSchema),
  isVisible: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// Default Ringtone Pop configuration (matching Spin Wheel pattern)
const DEFAULT_POP_CONFIG = {
  id: "active",
  segments: [
    {
      id: "1",
      label: "£1 Cash",
      rewardType: "cash",
      rewardValue: 1,
      probability: 25,
      maxWins: null,
      currentWins: 0,
    },
    {
      id: "2",
      label: "£5 Cash",
      rewardType: "cash",
      rewardValue: 5,
      probability: 15,
      maxWins: null,
      currentWins: 0,
    },
    {
      id: "3",
      label: "£10 Cash",
      rewardType: "cash",
      rewardValue: 10,
      probability: 10,
      maxWins: 100,
      currentWins: 0,
    },
    {
      id: "4",
      label: "£25 Cash",
      rewardType: "cash",
      rewardValue: 25,
      probability: 5,
      maxWins: 50,
      currentWins: 0,
    },
    {
      id: "5",
      label: "Free Replay",
      rewardType: "try_again",
      rewardValue: 0,
      probability: 10,
      maxWins: null,
      currentWins: 0,
    },
    {
      id: "6",
      label: "No Win",
      rewardType: "lose",
      rewardValue: 0,
      probability: 35,
      maxWins: null,
      currentWins: 0,
    },
  ],
  isActive: true,
  isVisible: true,
};


const DEFAULT_PLINKO_CONFIG = {
  id: "active",
  rows: 12,
  freeReplayProbability: "5.00",
  isActive: true,
  isVisible: true,
  prizes: [
    {
      slotIndex: 0,
      prizeName: "£500 JACKPOT",
      prizeValue: 500.00,
      rewardType: "cash" as const,
      probability: 2.00,
      color: "#FFD700",
      maxWins: 5,
      currentWins: 0,
    },
    {
      slotIndex: 1,
      prizeName: "£100 CASH",
      prizeValue: 100.00,
      rewardType: "cash" as const,
      probability: 5.00,
      color: "#FF9800",
      maxWins: 10,
      currentWins: 0,
    },
    {
      slotIndex: 2,
      prizeName: "£50 CASH",
      prizeValue: 50.00,
      rewardType: "cash" as const,
      probability: 8.00,
      color: "#4CAF50",
      maxWins: 15,
      currentWins: 0,
    },
    {
      slotIndex: 3,
      prizeName: "£20 CASH",
      prizeValue: 20.00,
      rewardType: "cash" as const,
      probability: 10.00,
      color: "#2196F3",
      maxWins: 20,
      currentWins: 0,
    },
    {
      slotIndex: 4,
      prizeName: "TRY AGAIN",
      prizeValue: 0.00,
      rewardType: "try_again" as const,
      probability: 30.00,
      color: "#9E9E9E",
      maxWins: null,
      currentWins: 0,
    },
    {
      slotIndex: 5,
      prizeName: "100 POINTS",
      prizeValue: 100.00,
      rewardType: "points" as const,
      probability: 15.00,
      color: "#9C27B0",
      maxWins: 25,
      currentWins: 0,
    },
    {
      slotIndex: 6,
      prizeName: "50 POINTS",
      prizeValue: 50.00,
      rewardType: "points" as const,
      probability: 20.00,
      color: "#00BCD4",
      maxWins: 30,
      currentWins: 0,
    },
    {
      slotIndex: 7,
      prizeName: "10 POINTS",
      prizeValue: 10.00,
      rewardType: "points" as const,
      probability: 10.00,
      color: "#E91E63",
      maxWins: 40,
      currentWins: 0,
    },
  ],
};

// Verify total probability = 100%
const totalProbability = DEFAULT_PLINKO_CONFIG.prizes.reduce(
  (sum, p) => sum + p.probability,
  0
);
console.log(`Plinko Total Probability: ${totalProbability}%`); // Should be 100%

const DEFAULT_VOLTZ_CONFIG = {
  id: "active",
  prizes: [] as any[],
  winProbability: "10.00",
  freeReplayProbability: "5.00",
  isActive: true,
  isVisible: true,
};

async function checkDailyTicketCap(userId: string, competitionId: string, quantity: number, gameType: string) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recentTickets = await db
    .select({ count: sql<number>`count(*)` })
    .from(tickets)
    .where(
      and(
        eq(tickets.userId, userId),
        eq(tickets.competitionId, competitionId),
        sql`${tickets.createdAt} >= ${twentyFourHoursAgo}`
      )
    );
  
  const ticketsInLast24h = Number(recentTickets[0]?.count || 0);
  const DAILY_TICKET_CAP = 250;
  
  if (ticketsInLast24h + quantity > DAILY_TICKET_CAP) {
    const remainingTickets = DAILY_TICKET_CAP - ticketsInLast24h;
    return {
      exceeded: true,
      message: `Daily ${gameType} ticket limit reached. You can only purchase ${remainingTickets} more ticket(s) in the next 24 hours. You've already purchased ${ticketsInLast24h} tickets for this competition.`,
      dailyLimit: DAILY_TICKET_CAP,
      purchasedToday: ticketsInLast24h,
      remainingToday: Math.max(0, remainingTickets)
    };
  }
  
  return { exceeded: false };
}


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

export function getClientIp(req: any) {
  return (
    req.headers["cf-connecting-ip"] || // Cloudflare
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
}

function normalizeCashflowsStatus(payment: any): {
  status: "PAID" | "PENDING" | "FAILED" | "UNKNOWN";
  paidAmount: number;
} {
  const raw =
    payment?.status ||
    payment?.data?.status ||
    payment?.data?.paymentStatus ||
    payment?.data?.payments?.[0]?.status ||
    "";

  const status = String(raw).toUpperCase();

  const paidAmount = Number(
    payment?.data?.paidAmount ||
    payment?.data?.amountCollected ||
    payment?.data?.payments?.[0]?.paidAmount ||
    0
  );

  // ✅ Paid
  if (
    status.includes("PAID") ||
    status.includes("SUCCESS") ||
    status.includes("CAPTURE")
  ) {
    return { status: "PAID", paidAmount };
  }

  // ❌ Expired / Failed / Cancelled
  if (
    status.includes("FAIL") ||
    status.includes("CANCEL") ||
    status.includes("EXPIRE")
  ) {
    return { status: "FAILED", paidAmount: 0 };
  }

  // ⏳ Still pending
  if (
    status.includes("PENDING") ||
    status.includes("PROCESS") ||
    status.includes("AUTHOR")
  ) {
    return { status: "PENDING", paidAmount: 0 };
  }

  // ❓ Unknown = NEVER PAY
  return { status: "UNKNOWN", paidAmount: 0 };
}


async function updateSegmentWinCount(segmentId: string, wheelType: string) {
  if (wheelType === "wheel2") {
    const [config] = await db
      .select()
      .from(spinWheel2Configs)
      .where(eq(spinWheel2Configs.id, "active"));
    
    if (config && config.segments) {
      const updatedSegments = config.segments.map((segment: any) => {
        if (segment.id === segmentId) {
          return { ...segment, currentWins: (segment.currentWins || 0) + 1 };
        }
        return segment;
      });
      
      await db
        .update(spinWheel2Configs)
        .set({ segments: updatedSegments, updated_at: new Date() })
        .where(eq(spinWheel2Configs.id, "active"));
    }
  } else {
    const [config] = await db
      .select()
      .from(gameSpinConfig)
      .where(eq(gameSpinConfig.id, "active"));
    
    if (config && config.segments) {
      const updatedSegments = config.segments.map((segment: any) => {
        if (segment.id === segmentId) {
          return { ...segment, currentWins: (segment.currentWins || 0) + 1 };
        }
        return segment;
      });
      
      await db
        .update(gameSpinConfig)
        .set({ segments: updatedSegments, updated_at: new Date() })
        .where(eq(gameSpinConfig.id, "active"));
    }
  }
}



const FROM_EMAIL = "support@ringtoneriches.co.uk";

async function processWalletTopup(
  userId: string,
  pendingPaymentId: string,
  paymentRef: string,
  amount: number,
  shouldCheckReferral: boolean = true
) {
  if (amount <= 0) {
    throw new Error("Invalid wallet credit amount");
  }

  try {
    await db.transaction(async (tx) => {
      // 🛑 Check for existing transaction first
      const existing = await tx.query.transactions.findFirst({
        where: (t, { eq }) => eq(t.pendingPaymentId, pendingPaymentId),
      });

      if (existing) {
        console.warn("Duplicate wallet credit blocked:", pendingPaymentId);
        return;
      }

      // Check pending payment status with FOR UPDATE lock using SQL
      const pendingResult = await tx.execute<{
        rows: Array<{ id: string; status: string }>
      }>(sql`
        SELECT id, status 
        FROM pending_payments 
        WHERE id = ${pendingPaymentId}
        FOR UPDATE
      `);
      
      const pending = Array.isArray(pendingResult) ? pendingResult[0] : pendingResult.rows?.[0];

      if (!pending || pending.status !== "pending") {
        console.warn("Pending payment not found or already processed:", pendingPaymentId);
        return;
      }

      // Insert transaction - REMOVED status field
      await tx.insert(transactions).values({
        userId,
        type: "deposit",
        amount: Math.round(amount * 100) / 100,
        paymentRef,
        pendingPaymentId,
        description: `Cashflows wallet top-up £${amount}`,
        // status: "completed", // ❌ REMOVE THIS LINE if column doesn't exist
        createdAt: new Date(),
      });

      // Update user balance
      await tx.execute(sql`
        UPDATE users
        SET balance = balance + ${amount}
        WHERE id = ${userId}
      `);

      // Update pending payment status
      await tx.update(pendingPayments)
        .set({
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(pendingPayments.id, pendingPaymentId));

      console.log("Wallet credited successfully", {
        userId,
        pendingPaymentId,
        amount,
        shouldCheckReferral,
      });

      // ✅ Only check referral if shouldCheckReferral is true
      if (shouldCheckReferral) {
        await awardReferralBonusInsideTransaction(tx, userId, amount, paymentRef);
      } else {
        console.log("Skipping referral check for this topup");
      }
    });
  } catch (err) {
    console.error("processWalletTopup FAILED", err);
    throw err;
  }
}

// ✅ Fixed function that runs INSIDE the transaction
async function awardReferralBonusInsideTransaction(
  tx: any,
  userId: string,
  amount: number,
  paymentRef: string
) {
  try {
    // Get user with referredBy field - Fixed SQL
    const userResult = await tx.execute<{
      rows: Array<{ id: string; referred_by: string | null; email: string }>
    }>(sql`
      SELECT id, referred_by as "referredBy", email
      FROM users 
      WHERE id = ${userId}
      FOR UPDATE
    `);
    
    const user = Array.isArray(userResult) ? userResult[0] : userResult.rows?.[0];
    
    if (!user || !user.referredBy) {
      console.log("No referrer found for user:", userId);
      return;
    }

    // ✅ Check if this is FIRST deposit - Fixed to work without status column
    const transactionsCountResult = await tx.execute<{
      rows: Array<{ count: string }>
    }>(sql`
      SELECT COUNT(*) as count
      FROM transactions 
      WHERE user_id = ${userId} 
      AND type = 'deposit'
      AND payment_ref != ${paymentRef}
    `);
    
    const previousDeposits = Array.isArray(transactionsCountResult) 
      ? parseInt(transactionsCountResult[0]?.count || '0')
      : 0;
    
    console.log(`Previous completed deposits for user ${userId}: ${previousDeposits}`);
    
    // ✅ Only award if this is the FIRST deposit (previous count = 0)
    if (previousDeposits === 0) {
      // ✅ Check minimum deposit amount (e.g., £10 minimum for referral bonus)
      const MIN_REFERRAL_DEPOSIT = 10;
      
      if (amount < MIN_REFERRAL_DEPOSIT) {
        console.log(`Deposit amount £${amount} is less than minimum £${MIN_REFERRAL_DEPOSIT} for referral bonus`);
        return;
      }
      
      // Get referrer with FOR UPDATE lock
      const referrerResult = await tx.execute<{
        rows: Array<{ id: string; email: string; balance: number }>
      }>(sql`
        SELECT id, email, balance
        FROM users 
        WHERE id = ${user.referredBy}
        FOR UPDATE
      `);
      
      const referrer = Array.isArray(referrerResult) ? referrerResult[0] : referrerResult.rows?.[0];
      
      if (!referrer) {
        console.warn("Referrer not found:", user.referredBy);
        return;
      }
      
      const bonusAmount = 2.0;
      
      // ✅ Check if referral bonus already awarded - Fixed to work without status column
      const existingReferralBonus = await tx.execute<{
        rows: Array<{ id: string }>
      }>(sql`
        SELECT id
        FROM transactions 
        WHERE user_id = ${referrer.id} 
        AND type = 'referral'
        AND description LIKE ${`%${user.email}%`}
        LIMIT 1
      `);
      
      const existingBonus = Array.isArray(existingReferralBonus) 
        ? existingReferralBonus[0] 
        : existingReferralBonus.rows?.[0];
      
      if (existingBonus) {
        console.log(`Referral bonus already awarded for user ${user.email}`);
        return;
      }
      
      // Award bonus to referrer
      await tx.execute(sql`
        UPDATE users
        SET balance = balance + ${bonusAmount}
        WHERE id = ${referrer.id}
      `);
      
      // Create referral transaction - REMOVED status field
      await tx.insert(transactions).values({
        userId: referrer.id,
        amount: bonusAmount,
        type: "referral",
        // status: "completed", // ❌ REMOVE THIS LINE
        description: `Referral reward: ${user.email} made their first wallet top-up of £${amount}`,
        paymentMethod: "bonus",
        createdAt: new Date(),
      });
      
      console.log(`✅ Referral bonus awarded: £${bonusAmount} to ${referrer.email} for ${user.email}'s first top-up of £${amount}`);
    } else {
      console.log(`Not first deposit. User has ${previousDeposits} previous deposits.`);
    }
  } catch (error) {
    console.error("Error awarding referral bonus:", error);
    // Don't throw - we don't want to fail the deposit
  }
}


export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupCustomAuth(app);

  // File upload endpoint for competition images
  app.post(
    "/api/upload/competition-image",
    isAuthenticated,
    isAdmin,
    competitionUpload.single("image"),
    (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        const fileKey = (req.file as any).key; // e.g., competitions/12345.png
        const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`; // use your public URL

        return res.status(200).json({ imagePath: publicUrl });
      } catch (error: any) {
        console.error("File upload error:", error);
        return res
          .status(500)
          .json({ message: error.message || "File upload failed" });
      }
    }
  );

  // app.post(
  //   "/api/admin/cleanup-payments",
  //   isAuthenticated,
  //   isAdmin,
  //   async (req: any, res) => {
  //     try {
  //       console.log("🔧 Manual cleanup triggered by admin");
  //       await cleanup404Payments();

  //       // Also run recheck to see current state
  //       await recheckPendingPayments();

  //       res.json({
  //         success: true,
  //         message: "Cleanup completed manually",
  //       });
  //     } catch (err) {
  //       console.error("❌ Manual cleanup error:", err);
  //       res.status(500).json({
  //         success: false,
  //         message: "Cleanup failed",
  //         error: err.message,
  //       });
  //     }
  //   }
  // );

  app.post("/api/admin/verify-all-existing-users", async (req, res) => {
    try {
      // Simple auth check (you can add proper admin auth)
      const { adminKey } = req.body;
      if (adminKey !== process.env.ADMIN_MIGRATION_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log("🔧 Verifying ALL existing users...");

      const result = await db.execute(sql`
      UPDATE users 
      SET 
        email_verified = true,
        verification_sent_at = COALESCE(verification_sent_at, created_at),
        email_verification_otp = NULL,
        email_verification_otp_expires_at = NULL,
        updated_at = NOW()
      WHERE email IS NOT NULL 
        AND email != ''
    `);

      // Count after update
      const verifiedCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`email_verified = true`);

      res.json({
        success: true,
        message: `Grandfathered all existing users into verified status`,
        verifiedCount: verifiedCount[0].count,
        rowCount: result.rowCount,
      });
    } catch (error) {
      console.error("❌ Migration error:", error);
      res.status(500).json({
        success: false,
        message: "Migration failed",
        error: error.message,
      });
    }
  });

app.post("/api/auth/register", async (req, res) => {
  try {
    console.log("🚀 [register] Starting registration...");
    console.log("   Request body:", JSON.stringify(req.body, null, 2));

    // Update schema validation to include redeemCode
    const result = registerUserSchema.safeParse(req.body);
    if (!result.success) {
      console.error("❌ [register] Validation failed:", result.error);
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
      referralCode,
      howDidYouFindUs,
      redeemCode,
    } = req.body;

    console.log("   Email to register:", email);
    console.log("   Referral code provided:", referralCode);
    console.log("   Redeem code provided:", redeemCode);

    const normalizedEmail = email.toLowerCase().trim();
    
    console.log("   Original email:", email);
    console.log("   Normalized email (stored in DB):", normalizedEmail);

    // Check if user exists
    const existingUser = await storage.getUserByEmail(normalizedEmail);
    if (existingUser) {
      console.log("❌ [register] User already exists:", normalizedEmail);
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Validate referral code if provided
    let referrerId = null;
    if (referralCode) {
      const referrer = await storage.getUserByReferralCode(referralCode);
      if (referrer) {
        referrerId = referrer.id;
        console.log("   ✅ Valid referral code found. Referrer:", referrer.email);
      } else {
        console.log("   ❌ Invalid referral code:", referralCode);
      }
    }

    // Validate redeem code if provided
    let pendingRedeemCode = null;
    let pendingRedeemAmount = null;
    
    if (redeemCode) {
      try {
        const upperCode = redeemCode.toUpperCase().trim();
        
        // Find the redeem code
        const foundCode = await db.query.redeemCodes.findFirst({
          where: eq(redeemCodes.code, upperCode),
        });

        if (foundCode) {
          // Check if code is active
          if (!foundCode.isActive) {
            console.log(`   ❌ Redeem code is inactive: ${upperCode}`);
          }
          // Check if expired
          else if (foundCode.expiresAt && new Date() > new Date(foundCode.expiresAt)) {
            console.log(`   ❌ Redeem code expired: ${upperCode}`);
          }
          // Check usage limits
          else if (foundCode.usageLimit !== null && foundCode.currentUses >= foundCode.usageLimit) {
            console.log(`   ❌ Redeem code has reached its usage limit (${foundCode.usageLimit} uses): ${upperCode}`);
          }
          // Code is valid for potential use
          else {
            pendingRedeemCode = upperCode;
            pendingRedeemAmount = foundCode.amount;
            console.log(`   ✅ Valid redeem code found: ${upperCode} worth £${foundCode.amount}`);
            console.log(`      Current usage: ${foundCode.currentUses}/${foundCode.usageLimit || '∞'}`);
          }
        } else {
          console.log(`   ❌ Invalid redeem code: ${upperCode}`);
        }
      } catch (redeemError) {
        console.error("   Error validating redeem code:", redeemError);
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password || "");
    console.log("   Password hashed");

    // Create DOB
    const dobString =
      birthMonth && birthYear
        ? `${birthYear}-${String(birthMonth).padStart(2, "0")}-01`
        : undefined;

    // Create new user (emailVerified set to true by default)
    console.log("   Creating user in database...");
    const user = await storage.createUser({
      email: normalizedEmail,
      password: hashedPassword,
      firstName,
      lastName,
      dateOfBirth: dobString,
      phoneNumber,
      howDidYouFindUs,
      receiveNewsletter: receiveNewsletter || false,
      emailVerified: true, // ⭐ Auto-verify email
      referredBy: referrerId,
      pendingRedeemCode: pendingRedeemCode,
      pendingRedeemAmount: pendingRedeemAmount,
    });

    console.log("✅ [register] User created:", user.id);

    // Log IP
    try {
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "";
      await db.insert(userIpLogs).values({
        userId: user.id,
        ipAddress: ip,
        userAgent: ua,
      });
    } catch (e) {
      console.error("IP log failed on register:", e);
    }

    // Apply bonuses immediately (no verification needed)
    let bonusCashCredited = 0;
    let bonusPointsCredited = 0;
    let redeemAmountCredited = 0;

    await db.transaction(async (tx) => {
      // 1. Apply normal signup bonus
      try {
        const settings = await storage.getPlatformSettings();
        if (settings?.signupBonusEnabled) {
          const bonusCash = parseFloat(settings.signupBonusCash || "0");
          const bonusPoints = settings.signupBonusPoints || 0;

          if (bonusCash > 0) {
            await tx.update(users)
              .set({
                balance: sql`${users.balance} + ${bonusCash}`,
              })
              .where(eq(users.id, user.id));
            bonusCashCredited = bonusCash;

            await tx.insert(transactions).values({
              userId: user.id,
              amount: bonusCash.toFixed(2),
              type: "deposit",
              status: "completed",
              description: "Signup bonus - Welcome cash",
            });
          }

          if (bonusPoints > 0) {
            await tx.update(users)
              .set({
                ringtonePoints: sql`${users.ringtonePoints} + ${bonusPoints}`,
              })
              .where(eq(users.id, user.id));
            bonusPointsCredited = bonusPoints;

            await tx.insert(transactions).values({
              userId: user.id,
              amount: "0.00",
              type: "deposit",
              status: "completed",
              description: `Signup bonus - ${bonusPoints} RingTone Points`,
            });
          }
        }
      } catch (bonusError) {
        console.error("Signup bonus error:", bonusError);
      }

      // 2. Apply redeem code if exists
      if (pendingRedeemCode && pendingRedeemAmount) {
        try {
          const code = pendingRedeemCode;
          const amount = parseFloat(pendingRedeemAmount);

          // Find the redeem code again (within transaction)
          const redeemCode = await tx.query.redeemCodes.findFirst({
            where: eq(redeemCodes.code, code),
          });

          if (redeemCode) {
            // Double-check all conditions within the transaction
            if (!redeemCode.isActive) {
              console.log(`❌ Code ${code} is inactive`);
              return;
            }

            if (redeemCode.expiresAt && new Date() > new Date(redeemCode.expiresAt)) {
              console.log(`❌ Code ${code} has expired`);
              return;
            }

            // Check usage limits
            if (redeemCode.usageLimit !== null && redeemCode.currentUses >= redeemCode.usageLimit) {
              console.log(`❌ Code ${code} has reached its usage limit (${redeemCode.usageLimit} uses)`);
              return;
            }

            // Check if user has already used this specific code
            const existingRedemption = await tx.query.redeemCodeRedemptions.findFirst({
              where: and(
                eq(redeemCodeRedemptions.redeemCodeId, redeemCode.id),
                eq(redeemCodeRedemptions.userId, user.id)
              ),
            });

            if (existingRedemption) {
              console.log(`❌ User ${user.id} has already used code ${code}`);
              return;
            }

            // For flyer codes (system generated), check if they've used any code
            if (redeemCode.isSystemGenerated) {
              const anyRedemption = await tx.query.redeemCodeRedemptions.findFirst({
                where: eq(redeemCodeRedemptions.userId, user.id),
              });

              if (anyRedemption) {
                console.log(`❌ User ${user.id} has already used a flyer code`);
                return;
              }
            }

            // IMPORTANT: Update the usage counter
            const newCurrentUses = redeemCode.currentUses + 1;
            console.log(`📝 Updating code usage from ${redeemCode.currentUses} to ${newCurrentUses}`);
            
            await tx.update(redeemCodes)
              .set({ 
                currentUses: newCurrentUses,
                // Update legacy fields for backward compatibility
                isUsed: redeemCode.usageLimit !== null && newCurrentUses >= redeemCode.usageLimit,
                usedByUserId: user.id,
                usedAt: new Date(),
              })
              .where(eq(redeemCodes.id, redeemCode.id));

            // Add amount to user's balance
            await tx.update(users)
              .set({
                balance: sql`${users.balance} + ${amount}`,
              })
              .where(eq(users.id, user.id));

            // Record redemption
            await tx.insert(redeemCodeRedemptions).values({
              redeemCodeId: redeemCode.id,
              userId: user.id,
              amount: amount.toString(),
              ipAddress: req.ip,
              userAgent: req.headers["user-agent"],
            });

            // Create transaction record
            await tx.insert(transactions).values({
              userId: user.id,
              amount: amount.toString(),
              type: "redeem",
              description: `Redeemed flyer code: ${code}`,
              status: "completed",
            });

            redeemAmountCredited = amount;
            console.log(`✅ Flyer code ${code} redeemed for user ${user.id} - £${amount}`);
            console.log(`   New currentUses: ${newCurrentUses}`);
          }

          // Clear pending fields
          await tx.update(users)
            .set({
              pendingRedeemCode: null,
              pendingRedeemAmount: null,
            })
            .where(eq(users.id, user.id));

        } catch (redeemError) {
          console.error("Failed to apply redeem code during registration:", redeemError);
          // Clear pending fields
          await tx.update(users)
            .set({
              pendingRedeemCode: null,
              pendingRedeemAmount: null,
            })
            .where(eq(users.id, user.id));
        }
      }

      // 3. Apply referral system
      try {
        if (referrerId) {
          const referrer = await storage.getUser(referrerId);
          if (referrer && referrer.id !== user.id) {
            await storage.saveUserReferral({
              userId: user.id,
              referrerId: referrer.id,
            });

            console.log(`🎉 Referral: ${referrer.email} referred ${user.email}`);

            // Give new user 100 points
            const welcomeReferralPoints = 100;
            await tx.update(users)
              .set({
                ringtonePoints: sql`${users.ringtonePoints} + ${welcomeReferralPoints}`,
              })
              .where(eq(users.id, user.id));

            await tx.insert(transactions).values({
              userId: user.id,
              amount: welcomeReferralPoints.toString(),
              type: "referral_bonus",
              status: "completed",
              description: `Welcome referral bonus +${welcomeReferralPoints} points`,
            });
          }
        }
      } catch (referralError) {
        console.error("Referral processing error:", referralError);
      }
    });

    // Send welcome email (optional - just for notification)
    sendWelcomeEmail(email, {
      userName: `${user.firstName} ${user.lastName}`.trim() || "there",
      email,
    }).catch((err) => console.error("Failed to send welcome email:", err));

    // Create session immediately
    (req as any).session.userId = user.id;

    // Get updated user
    const updatedUser = await storage.getUser(user.id);

    console.log("✅ [register] Registration complete with bonuses!");

    res.status(201).json({
      message: "Registration successful! Welcome to RingTone Riches!",
      user: {
        id: updatedUser?.id,
        email: updatedUser?.email,
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        balance: updatedUser?.balance,
        ringtonePoints: updatedUser?.ringtonePoints,
        isAdmin: updatedUser?.isAdmin || false,
        emailVerified: true,
      },
      bonusesApplied: {
        cash: bonusCashCredited,
        points: bonusPointsCredited,
        referral: !!referrerId,
        redeemCode: redeemAmountCredited > 0 ? `£${redeemAmountCredited.toFixed(2)}` : null,
      },
    });

  } catch (error: any) {
    console.error("🔥 [register] Registration error:", error);
    res.status(500).json({
      message: "Failed to register user",
      error: error.message,
    });
  }
});

// Login route (simplified - no verification check)
app.post("/api/auth/login", async (req, res) => {
  try {
    const result = loginUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid login data" });
    }

    const now = new Date();
    const { email, password } = result.data;

    const normalizedEmail = email.toLowerCase().trim();
    
    console.log("   Login attempt with:", email);
    console.log("   Looking up with normalized email:", normalizedEmail);


    // Get user by email
    const user = await storage.getUserByEmail(normalizedEmail);
    if (!user || !user.password) {
       console.log("❌ [login] User not found for:", normalizedEmail);
      return res.status(401).json({ message: "Invalid email or password" });
    }
 console.log("✅ [login] User found:", user.email);
    // 1️⃣ Check admin disables first
    if (user.disabled) {
      if (user.disabledUntil && now > new Date(user.disabledUntil)) {
        await db
          .update(users)
          .set({
            disabled: false,
            disabledAt: null,
            disabledUntil: null,
            updatedAt: now,
          })
          .where(eq(users.id, user.id));
        user.disabled = false;
      }

      if (user.disabled) {
        return res
          .status(403)
          .json({ message: "This account has been closed." });
      }
    }

    // 2️⃣ Check self-suspension before password verification
    if (
      user.selfSuspended &&
      user.selfSuspensionEndsAt &&
      now < new Date(user.selfSuspensionEndsAt)
    ) {
      return res.status(403).json({
        code: "SELF_SUSPENDED",
        message:
          "Your account is temporarily suspended due to a wellbeing request.",
        endsAt: user.selfSuspensionEndsAt,
      });
    }

    // 3️⃣ Apply self-suspension expiry for past suspensions
    await applySelfSuspensionExpiry(user.id);

    // Refresh user object after potential suspension removal
    const freshUser = await storage.getUser(user.id);

    // Verify password
    const isValidPassword = await verifyPassword(
      password,
      freshUser.password
    );
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Store user ID in session
    (req as any).session.userId = freshUser.id;

    // Log IP
    try {
      console.log("=== IP LOGGING DEBUG ===");
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "";
      
      await db.insert(userIpLogs).values({
        userId: freshUser.id,
        ipAddress: ip,
        userAgent: ua,
      }).returning();
      
      console.log("IP Log inserted successfully");
      console.log("=== END IP LOGGING DEBUG ===");
      
    } catch (e) {
      console.error("❌ IP log failed on login:", e);
    }

    res.json({
      message: "Login successful",
      user: {
        id: freshUser.id,
        email: freshUser.email,
        firstName: freshUser.firstName,
        lastName: freshUser.lastName,
        balance: freshUser.balance,
        ringtonePoints: freshUser.ringtonePoints,
        isAdmin: freshUser.isAdmin || false,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to log in" });
  }
});


  app.get("/api/auth/verification-status/:email", async (req, res) => {
    try {
      const { email } = req.params;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if OTP is expired
      let otpExpired = false;
      let timeRemaining = 0;

      if (user.emailVerificationOtpExpiresAt) {
        const now = new Date();
        const expiresAt = new Date(user.emailVerificationOtpExpiresAt);
        otpExpired = now > expiresAt;

        if (!otpExpired) {
          timeRemaining = Math.floor(
            (expiresAt.getTime() - now.getTime()) / 1000
          ); // seconds
        }
      }

      res.json({
        emailVerified: user.emailVerified,
        verificationSentAt: user.verificationSentAt,
        hasOtp: !!user.emailVerificationOtp,
        otpExpired: otpExpired,
        timeRemaining: timeRemaining,
        canResend: !user.emailVerified,
        expiresAt: user.emailVerificationOtpExpiresAt,
      });
    } catch (error) {
      console.error("Status check error:", error);
      res.status(500).json({ message: "Failed to check status" });
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
          message:
            "If an account exists with this email, a password reset link has been sent.",
        });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 3600000);

      await db.insert(passwordResetTokens).values({
        email: user.email,
        token: resetToken,
        expiresAt,
        used: false,
      });

      const baseUrl = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : `${req.protocol}://${req.get("host")}`;
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      await sendPasswordResetEmail(
        user.email,
        resetUrl,
        user.firstName || undefined
      );

      console.log(`Password reset requested for: ${user.email}`);

      res.json({
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res
        .status(500)
        .json({ message: "Failed to process password reset request" });
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
        return res
          .status(404)
          .json({ message: "Invalid or expired reset token" });
      }

      if (resetToken.used) {
        return res
          .status(400)
          .json({ message: "This reset link has already been used" });
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
        return res
          .status(404)
          .json({ message: "Invalid or expired reset token" });
      }

      if (resetToken.used) {
        return res
          .status(400)
          .json({ message: "This reset link has already been used" });
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
        phoneNumber,
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
        phoneNumber,
        dateOfBirth: dobString,
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
      wsManager.broadcast({ type: "user_updated", userId });

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
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

  function generateFlyerCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like 0,O,1,I
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  function getCodeStatus(code: any): string {
  if (!code.isActive) return "inactive";
  if (code.expiresAt && new Date() > new Date(code.expiresAt)) return "expired";
  if (code.usageLimit !== null && code.currentUses >= code.usageLimit) return "fully_used";
  if (code.currentUses > 0) return "partially_used";
  return "available";
}

// POST /api/admin/redeem-codes/generate - Generate flyer codes (system generated)
app.post("/api/admin/redeem-codes/generate", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const schema = z.object({
      amount: z.number().positive(), // Amount in pounds (e.g., 10 for £10)
      quantity: z.number().int().min(1).max(1000), // How many codes to generate
      notes: z.string().optional(), // Optional notes
      expiresAt: z.string().optional(), // Optional expiry date
    });

    const { amount, quantity, notes, expiresAt } = schema.parse(req.body);

    // Start a transaction
    const results = await db.transaction(async (tx) => {
      const codes = [];
      for (let i = 0; i < quantity; i++) {
        let code = generateFlyerCode();
        
        // Ensure uniqueness
        let existing = await tx.query.redeemCodes.findFirst({
          where: eq(redeemCodes.code, code),
        });
        
        while (existing) {
          code = generateFlyerCode();
          existing = await tx.query.redeemCodes.findFirst({
            where: eq(redeemCodes.code, code),
          });
        }

        const [newCode] = await tx.insert(redeemCodes).values({
          code,
          amount: amount.toString(),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          createdBy: req.user.id,
          notes,
          isSystemGenerated: true,
          usageLimit: 1, // Flyer codes are single-use by default
          currentUses: 0,
        }).returning();

        codes.push(newCode);
      }

      return codes;
    });

    res.json({
      success: true,
      message: `Generated ${quantity} redeem codes`,
      codes: results,
      totalValue: `£${(amount * quantity).toFixed(2)}`,
      type: "flyer_codes",
    });

  } catch (error) {
    console.error("Generate codes error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to generate codes" });
  }
});

// POST /api/admin/redeem-codes/create-custom - Admin creates custom code
app.post("/api/admin/redeem-codes/create-custom", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const schema = z.object({
      code: z.string().min(2).max(20).transform(c => c.toUpperCase().trim()),
      amount: z.number().positive(),
      usageLimit: z.number().int().min(1).nullable().optional(), // null = unlimited
      expiresAt: z.string().optional(),
      notes: z.string().optional(),
      isActive: z.boolean().default(true),
    });

    const { code, amount, usageLimit, expiresAt, notes, isActive } = schema.parse(req.body);

    // Check if code already exists
    const existing = await db.query.redeemCodes.findFirst({
      where: eq(redeemCodes.code, code),
    });

    if (existing) {
      return res.status(400).json({ error: "Code already exists" });
    }

    // Create custom code
    const [newCode] = await db.insert(redeemCodes).values({
      code,
      amount: amount.toString(),
      usageLimit: usageLimit || null,
      currentUses: 0,
      isActive,
      isSystemGenerated: false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user.id,
      notes: notes || `Custom code created by admin`,
    }).returning();

    res.json({
      success: true,
      message: `Custom code ${code} created successfully`,
      code: newCode,
      usageLimit: usageLimit || "unlimited",
    });

  } catch (error) {
    console.error("Create custom code error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create custom code" });
  }
});

// GET /api/admin/redeem-codes - List all redeem codes (updated)

app.get("/api/admin/redeem-codes", isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log("📦 Fetching redeem codes...");
    
    const { used, type, isActive } = req.query;
    
    // Build the query
    let query = db.select().from(redeemCodes);
    
    if (used === "true") {
      query = query.where(eq(redeemCodes.isUsed, true));
    } else if (used === "false") {
      query = query.where(eq(redeemCodes.isUsed, false));
    }

    if (type === "system") {
      query = query.where(eq(redeemCodes.isSystemGenerated, true));
    } else if (type === "custom") {
      query = query.where(eq(redeemCodes.isSystemGenerated, false));
    }

    if (isActive === "true") {
      query = query.where(eq(redeemCodes.isActive, true));
    } else if (isActive === "false") {
      query = query.where(eq(redeemCodes.isActive, false));
    }

    // Execute the main query
    const codes = await query.orderBy(desc(redeemCodes.createdAt));
    console.log(`✅ Found ${codes.length} redeem codes`);

    // Get usage stats for each code
    const codesWithStats = await Promise.all(
      codes.map(async (code) => {
        try {
          const redemptions = await db.select()
            .from(redeemCodeRedemptions)
            .where(eq(redeemCodeRedemptions.redeemCodeId, code.id))
            .leftJoin(users, eq(redeemCodeRedemptions.userId, users.id));
          
          // Get unique users who redeemed this code
          const uniqueUserIds = new Set(redemptions.map(r => r.redeem_code_redemptions.userId));
          
          // Format the redemptions with user data
          const formattedRedemptions = redemptions.map(r => ({
            id: r.redeem_code_redemptions.id,
            amount: r.redeem_code_redemptions.amount,
            redeemedAt: r.redeem_code_redemptions.redeemedAt,
            user: r.users ? {
              id: r.users.id,
              email: r.users.email,
              firstName: r.users.firstName,
              lastName: r.users.lastName,
            } : null
          }));

          return {
            ...code,
            redemptions: formattedRedemptions,
            redemptionCount: formattedRedemptions.length,
            uniqueUserCount: uniqueUserIds.size,
            usageRemaining: code.usageLimit ? code.usageLimit - code.currentUses : "unlimited",
            status: getCodeStatus(code),
          };
        } catch (err) {
          console.error(`Error fetching redemptions for code ${code.code}:`, err);
          return {
            ...code,
            redemptions: [],
            redemptionCount: 0,
            uniqueUserCount: 0,
            usageRemaining: "error",
            status: "error",
          };
        }
      })
    );

    res.json(codesWithStats);
    
  } catch (error: any) {
    console.error("🔥 Failed to fetch redeem codes:", error);
    res.status(500).json({ 
      error: "Failed to fetch codes",
      details: error.message,
    });
  }
});

// PATCH /api/admin/redeem-codes/:id/toggle - Activate/deactivate a code
app.patch("/api/admin/redeem-codes/:id/toggle", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const [updated] = await db.update(redeemCodes)
      .set({ isActive })
      .where(eq(redeemCodes.id, id))
      .returning();

    res.json({
      success: true,
      message: `Code ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      code: updated,
    });
  } catch (error) {
    console.error("Toggle code error:", error);
    res.status(500).json({ error: "Failed to update code" });
  }
});

// PATCH /api/admin/redeem-codes/:id/limit - Update usage limit
app.patch("/api/admin/redeem-codes/:id/limit", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { usageLimit } = req.body;

    const schema = z.object({
      usageLimit: z.number().int().min(1).nullable(),
    });

    const validated = schema.parse({ usageLimit });

    const [updated] = await db.update(redeemCodes)
      .set({ usageLimit: validated.usageLimit })
      .where(eq(redeemCodes.id, id))
      .returning();

    res.json({
      success: true,
      message: `Usage limit updated to ${updated.usageLimit || 'unlimited'}`,
      code: updated,
    });
  } catch (error) {
    console.error("Update limit error:", error);
    res.status(500).json({ error: "Failed to update usage limit" });
  }
});

// GET /api/admin/redeem-codes/stats - Get statistics (updated)
app.get("/api/admin/redeem-codes/stats", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Overall stats
    const totalCodes = await db.select({ count: sql<number>`count(*)` }).from(redeemCodes);
    
    const activeCodes = await db.select({ count: sql<number>`count(*)` })
      .from(redeemCodes)
      .where(eq(redeemCodes.isActive, true));
    
    const systemCodes = await db.select({ count: sql<number>`count(*)` })
      .from(redeemCodes)
      .where(eq(redeemCodes.isSystemGenerated, true));
    
    const customCodes = await db.select({ count: sql<number>`count(*)` })
      .from(redeemCodes)
      .where(eq(redeemCodes.isSystemGenerated, false));
    
    // Value stats
    const totalValue = await db.select({ 
      sum: sql<number>`sum(CAST(amount as decimal))` 
    }).from(redeemCodes)
      .where(eq(redeemCodes.isActive, true));
    
    const redeemedValue = await db.select({ 
      sum: sql<number>`sum(CAST(amount as decimal) * current_uses)` 
    }).from(redeemCodes)
      .where(eq(redeemCodes.isActive, true));

    // Redemption stats
    const totalRedemptions = await db.select({ count: sql<number>`count(*)` })
      .from(redeemCodeRedemptions);
    
    const uniqueUsers = await db.select({ count: sql<number>`count(distinct user_id)` })
      .from(redeemCodeRedemptions);

    res.json({
      totalCodes: Number(totalCodes[0].count),
      activeCodes: Number(activeCodes[0].count),
      systemCodes: Number(systemCodes[0].count),
      customCodes: Number(customCodes[0].count),
      totalRedemptions: Number(totalRedemptions[0].count),
      uniqueUsers: Number(uniqueUsers[0].count),
      totalValue: Number(totalValue[0].sum) || 0,
      redeemedValue: Number(redeemedValue[0].sum) || 0,
      remainingValue: (Number(totalValue[0].sum) || 0) - (Number(redeemedValue[0].sum) || 0),
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// DELETE /api/admin/redeem-codes/:id - Delete a redeem code (admin only)
app.delete("/api/admin/redeem-codes/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Admin attempting to delete redeem code: ${id}`);

    // First, check if the code exists
    const redeemCode = await db.query.redeemCodes.findFirst({
      where: eq(redeemCodes.id, id),
    });

    if (!redeemCode) {
      return res.status(404).json({ error: "Redeem code not found" });
    }

    // Start a transaction to ensure data integrity
    await db.transaction(async (tx) => {
      // Delete any redemptions first (foreign key constraint)
      await tx.delete(redeemCodeRedemptions)
        .where(eq(redeemCodeRedemptions.redeemCodeId, id));

      // Then delete the redeem code itself
      await tx.delete(redeemCodes)
        .where(eq(redeemCodes.id, id));

      console.log(`✅ Redeem code ${redeemCode.code} (${id}) deleted successfully by admin ${req.user.id}`);
      
      // Log this admin action for audit trail
      if (redeemCode.isUsed) {
        console.log(`⚠️ Note: This code was previously used by user ${redeemCode.usedByUserId} on ${redeemCode.usedAt}`);
      }
    });

    res.json({ 
      success: true, 
      message: `Redeem code ${redeemCode.code} deleted successfully`,
      deletedCode: redeemCode.code,
      wasUsed: redeemCode.isUsed
    });

  } catch (error: any) {
    console.error("🔥 Error deleting redeem code:", error);
    res.status(500).json({ 
      error: "Failed to delete redeem code",
      details: error.message 
    });
  }
});

// ========================================
// USER ENDPOINTS
// ========================================





// POST /api/redeem - User redeems a code (with debugging)
app.post("/api/redeem", isAuthenticated, async (req, res) => {
  try {
    const schema = z.object({
      code: z.string().min(3).max(20).transform(c => c.toUpperCase().trim()),
    });

    const { code } = schema.parse(req.body);
    console.log(`🔍 Redeem attempt for code: ${code} by user: ${req.user.id}`);

    // Find the redeem code
    const redeemCode = await db.query.redeemCodes.findFirst({
      where: eq(redeemCodes.code, code),
    });

    if (!redeemCode) {
      console.log(`❌ Code not found: ${code}`);
      return res.status(404).json({ error: "Invalid redeem code" });
    }

    console.log(`📊 Before redemption - Code: ${redeemCode.code}, currentUses: ${redeemCode.currentUses}, usageLimit: ${redeemCode.usageLimit}`);

    // Check if code is active
    if (!redeemCode.isActive) {
      return res.status(400).json({ error: "This code is currently inactive" });
    }

    // Check if expired
    if (redeemCode.expiresAt && new Date() > new Date(redeemCode.expiresAt)) {
      return res.status(400).json({ error: "This code has expired" });
    }

    // Check usage limits
    if (redeemCode.usageLimit !== null && redeemCode.currentUses >= redeemCode.usageLimit) {
      return res.status(400).json({ 
        error: `This code has reached its usage limit (${redeemCode.usageLimit} uses)` 
      });
    }

    // Check if user has already used this specific code
    const existingRedemption = await db.query.redeemCodeRedemptions.findFirst({
      where: and(
        eq(redeemCodeRedemptions.redeemCodeId, redeemCode.id),
        eq(redeemCodeRedemptions.userId, req.user.id)
      ),
    });

    if (existingRedemption) {
      return res.status(400).json({ error: "You have already used this code" });
    }

    // For flyer codes (single-use), check if they've used any code (optional)
    if (redeemCode.isSystemGenerated) {
      const anyRedemption = await db.query.redeemCodeRedemptions.findFirst({
        where: eq(redeemCodeRedemptions.userId, req.user.id),
      });

      if (anyRedemption) {
        return res.status(400).json({ error: "You have already used a flyer code" });
      }
    }

    // Start transaction
console.log(`🔄 Starting transaction for code: ${redeemCode.code}`);

const result = await db.transaction(async (tx) => {
  // First, get the current value to ensure we have the latest
  const currentCode = await tx.query.redeemCodes.findFirst({
    where: eq(redeemCodes.id, redeemCode.id),
  });

  if (!currentCode) {
    throw new Error("Code not found during transaction");
  }

  console.log(`📝 Updating currentUses from ${currentCode.currentUses} to ${currentCode.currentUses + 1}`);
  
  // Update code usage - use the current value from the fetched record
  const [updatedCode] = await tx.update(redeemCodes)
    .set({
      currentUses: currentCode.currentUses + 1, // Use the actual number, not SQL expression
      // For backward compatibility with single-use codes
      ...(redeemCode.usageLimit === 1 ? {
        isUsed: true,
        usedByUserId: req.user.id,
        usedAt: new Date(),
      } : {}),
    })
    .where(eq(redeemCodes.id, redeemCode.id))
    .returning();

  console.log(`✅ After update - currentUses: ${updatedCode.currentUses}`);

  // Add amount to user's balance
  const amount = parseFloat(redeemCode.amount);
  console.log(`💰 Adding £${amount} to user ${req.user.id} balance`);
  
  await tx.update(users)
    .set({
      balance: sql`${users.balance} + ${amount}`,
    })
    .where(eq(users.id, req.user.id));

  // Record redemption
  console.log(`📝 Recording redemption for user ${req.user.id}`);
  
  const [redemption] = await tx.insert(redeemCodeRedemptions).values({
    redeemCodeId: redeemCode.id,
    userId: req.user.id,
    amount: amount.toString(),
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  }).returning();

  console.log(`✅ Redemption recorded with ID: ${redemption.id}`);

  // Create transaction record
  await tx.insert(transactions).values({
    userId: req.user.id,
    amount: amount.toString(),
    type: "redeem",
    description: `Redeemed code: ${code}`,
    status: "completed",
  });

  return { amount, redemption, updatedCode };
});

    console.log(`🎉 Transaction completed successfully for code: ${code}`);

    // Get updated user balance
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
    });

    // Calculate remaining uses
    const remainingUses = redeemCode.usageLimit 
      ? redeemCode.usageLimit - (result.updatedCode.currentUses)
      : "unlimited";

    res.json({
      success: true,
      message: `🎉 You've received £${result.amount.toFixed(2)}!`,
      amount: result.amount,
      newBalance: updatedUser?.balance,
      codeDetails: {
        code: redeemCode.code,
        remainingUses,
        isSystemGenerated: redeemCode.isSystemGenerated,
      },
    });

  } catch (error) {
    console.error("🔥 Redeem error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid code format" });
    }
    res.status(500).json({ error: "Failed to redeem code" });
  }
});

// GET /api/redeem/history - Get user's redemption history
app.get("/api/redeem/history", isAuthenticated, async (req, res) => {
  try {
    console.log("📦 Fetching redeem history for user:", req.user.id);
    
    // Use join instead of with relation
    const history = await db
      .select({
        id: redeemCodeRedemptions.id,
        amount: redeemCodeRedemptions.amount,
        redeemedAt: redeemCodeRedemptions.redeemedAt,
        ipAddress: redeemCodeRedemptions.ipAddress,
        userAgent: redeemCodeRedemptions.userAgent,
        code: redeemCodes.code,
        codeAmount: redeemCodes.amount,
        codeExpiresAt: redeemCodes.expiresAt,
      })
      .from(redeemCodeRedemptions)
      .leftJoin(redeemCodes, eq(redeemCodeRedemptions.redeemCodeId, redeemCodes.id))
      .where(eq(redeemCodeRedemptions.userId, req.user.id))
      .orderBy(desc(redeemCodeRedemptions.redeemedAt));

    console.log(`✅ Found ${history.length} redemption records`);
    res.json(history);
    
  } catch (error: any) {
    console.error("🔥 Failed to fetch redeem history:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    res.status(500).json({ 
      error: "Failed to fetch history",
      details: error.message 
    });
  }
});


  // GET /api/admin/push-notifications/:id/check-users - Debug users
app.get("/api/admin/push-notifications/:id/check-users", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await db.query.pushNotifications.findFirst({
      where: eq(pushNotifications.id, id),
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    let debug = {
      notificationId: id,
      targetType: notification.targetType,
      selectedUserIds: [] as string[],
      targetUsers: [] as any[],
      allUsers: [] as any[],
    };

    // Get selected user IDs
    if (notification.targetType === "specific_users" && notification.targetUserIds) {
      try {
        if (typeof notification.targetUserIds === 'string') {
          debug.selectedUserIds = JSON.parse(notification.targetUserIds);
        } else if (Array.isArray(notification.targetUserIds)) {
          debug.selectedUserIds = notification.targetUserIds;
        }
      } catch (e) {
        debug.selectedUserIds = [];
      }
    }

    // Get all users
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      isActive: users.isActive,
    }).from(users);

    debug.allUsers = allUsers;

    // Get target users
    if (debug.selectedUserIds.length > 0) {
      debug.targetUsers = allUsers.filter(u => debug.selectedUserIds.includes(u.id));
    }

    res.json(debug);
  } catch (error) {
    console.error("Check users error:", error);
    res.status(500).json({ error: "Failed to check users" });
  }
});

// POST /api/admin/push-notifications - Create push notification
app.post("/api/admin/push-notifications", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(10000),
      type: z.enum(["info", "success", "warning", "promotion", "system"]),
      targetType: z.enum(["all", "specific_users"]),
      targetUserIds: z.array(z.string()).optional(),
      status: z.enum(["draft", "scheduled"]),
    });

    const data = schema.parse(req.body);

    // Prepare the data for insertion
    const insertData: any = {
      title: data.title,
      message: data.message,
      type: data.type,
      targetType: data.targetType,
      createdBy: req.user.id,
      status: data.status,
    };

    // Add targetUserIds if present
    if (data.targetUserIds && data.targetUserIds.length > 0) {
      insertData.targetUserIds = JSON.stringify(data.targetUserIds);
    } else {
      insertData.targetUserIds = null;
    }

    // Create push notification
    const [notification] = await db.insert(pushNotifications).values(insertData).returning();

    res.json({
      success: true,
      message: "Push notification created successfully",
      data: notification
    });

  } catch (error) {
    console.error("Create push notification error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create push notification" });
  }
});

// POST /api/admin/push-notifications/:id/send - Send push notification
app.post("/api/admin/push-notifications/:id/send", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📨 Attempting to send push notification: ${id}`);
    
    // Get the notification
    const notification = await db.query.pushNotifications.findFirst({
      where: eq(pushNotifications.id, id),
    });

    if (!notification) {
      console.error(`❌ Push notification not found: ${id}`);
      return res.status(404).json({ error: "Push notification not found" });
    }

    console.log(`📨 Notification found:`, {
      title: notification.title,
      targetType: notification.targetType,
      status: notification.status,
    });

    if (notification.status === "sent") {
      return res.status(400).json({ error: "Notification already sent" });
    }

    // Get target users
    let targetUsers: { id: string }[] = [];
    let selectedCount = 0;
    let usersNotFound: any[] = [];

    if (notification.targetType === "all") {
      // Get all active users
      const allUsers = await db.select({ 
        id: users.id, 
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.isActive, true));
      
      targetUsers = allUsers;
      selectedCount = allUsers.length;
    } 
    else if (notification.targetType === "specific_users" && notification.targetUserIds) {
      try {
        // Parse user IDs
        let userIds: string[] = [];
        
        if (Array.isArray(notification.targetUserIds)) {
          userIds = notification.targetUserIds;
          console.log("✅ targetUserIds is already an array:", userIds);
        } 
        else if (typeof notification.targetUserIds === 'string') {
          if (notification.targetUserIds && notification.targetUserIds.trim() !== '') {
            try {
              userIds = JSON.parse(notification.targetUserIds);
              console.log("✅ Parsed targetUserIds from string:", userIds);
            } catch (parseErr) {
              userIds = [notification.targetUserIds];
            }
          }
        }
        
        console.log(`👥 Final selected user IDs:`, userIds);
        selectedCount = userIds.length;
        
        if (userIds.length > 0) {
          // Get selected users
          const selectedUsers = await db.select({ 
            id: users.id, 
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(sql`${users.id} = ANY(ARRAY[${sql.join(userIds, sql`, `)}]::varchar[])`);
          
          console.log(`📊 Found ${selectedUsers.length} users in database`);
          targetUsers = selectedUsers;
          
          // Check for users not found
          const foundUserIds = new Set(selectedUsers.map(u => u.id));
          usersNotFound = userIds.filter(id => !foundUserIds.has(id));
        }
      } catch (parseError) {
        console.error("Failed to process targetUserIds:", parseError);
        console.error("targetUserIds value:", notification.targetUserIds);
      }
    }

    console.log(`📊 Results:`, {
      selectedCount,
      validUsers: targetUsers.length,
      notFound: usersNotFound.length
    });

    if (targetUsers.length === 0) {
      return res.status(400).json({ 
        error: "No valid users found",
        debug: {
          selectedCount,
          validUsers: targetUsers.length,
          notFound: usersNotFound
        }
      });
    }

    // Send push notifications (you'll need to implement your push notification service)
    // For now, we'll just record the deliveries
    console.log(`📱 Sending push notification to ${targetUsers.length} users...`);

    // Record deliveries in database
    await db.transaction(async (tx) => {
      for (const user of targetUsers) {
        await tx.insert(pushDeliveries).values({
          notificationId: notification.id,
          userId: user.id,
          status: "sent",
          sentAt: new Date(),
        });
      }

      // Update notification status
      await tx.update(pushNotifications)
        .set({
          status: "sent",
          sentCount: targetUsers.length,
          sentAt: new Date(),
        })
        .where(eq(pushNotifications.id, notification.id));
    });

    console.log(`✅ Push notification campaign completed: sent to ${targetUsers.length} users`);

    res.json({
      success: true,
      message: `Push notification sent to ${targetUsers.length} users`,
      stats: {
        total: targetUsers.length,
        notFound: usersNotFound.length,
      }
    });

  } catch (error) {
    console.error("🔥 Send push notification error:", error);
    res.status(500).json({ 
      error: "Failed to send push notification",
      details: error.message 
    });
  }
});

// POST /api/admin/push-notifications/:id/read - Mark as read (for client-side)
app.post("/api/admin/push-notifications/:id/read", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Update delivery record
    const [delivery] = await db.update(pushDeliveries)
      .set({
        status: "read",
        readAt: new Date(),
      })
      .where(
        and(
          eq(pushDeliveries.notificationId, id),
          eq(pushDeliveries.userId, userId)
        )
      )
      .returning();

    if (delivery) {
      // Increment read count on notification
      await db.update(pushNotifications)
        .set({
          readCount: sql`${pushNotifications.readCount} + 1`
        })
        .where(eq(pushNotifications.id, id));
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// GET /api/admin/push-notifications - List all push notifications
app.get("/api/admin/push-notifications", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const notifications = await db.query.pushNotifications.findMany({
      orderBy: desc(pushNotifications.createdAt),
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch push notifications" });
  }
});

// GET /api/admin/push-notifications/:id/deliveries - Get delivery details
app.get("/api/admin/push-notifications/:id/deliveries", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deliveries = await db.select({
      id: pushDeliveries.id,
      status: pushDeliveries.status,
      sentAt: pushDeliveries.sentAt,
      readAt: pushDeliveries.readAt,
      user: {
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      }
    })
    .from(pushDeliveries)
    .leftJoin(users, eq(pushDeliveries.userId, users.id))
    .where(eq(pushDeliveries.notificationId, id))
    .orderBy(desc(pushDeliveries.createdAt));

    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch deliveries" });
  }
});

// GET /api/admin/push-notifications/stats - Get statistics
app.get("/api/admin/push-notifications/stats", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const total = await db.select({ count: sql<number>`count(*)` }).from(pushNotifications);
    const totalDeliveries = await db.select({ count: sql<number>`count(*)` }).from(pushDeliveries);
    const readDeliveries = await db.select({ count: sql<number>`count(*)` })
      .from(pushDeliveries)
      .where(eq(pushDeliveries.status, "read"));
    
    res.json({
      totalNotifications: Number(total[0].count),
      totalDeliveries: Number(totalDeliveries[0].count),
      readCount: Number(readDeliveries[0].count),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// DELETE /api/admin/push-notifications/:id - Delete notification
app.delete("/api/admin/push-notifications/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(pushNotifications).where(eq(pushNotifications.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete notification" });
  }
});



// GET /api/user/notifications - Get user's notifications
app.get("/api/user/notifications", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    const deliveries = await db.select({
      id: pushDeliveries.id,
      notificationId: pushDeliveries.notificationId,
      status: pushDeliveries.status,
      readAt: pushDeliveries.readAt,
      sentAt: pushDeliveries.sentAt,
      createdAt: pushDeliveries.createdAt,
      notification: {
        id: pushNotifications.id,
        title: pushNotifications.title,
        message: pushNotifications.message,
        type: pushNotifications.type,
        sentAt: pushNotifications.sentAt,
      }
    })
    .from(pushDeliveries)
    .innerJoin(pushNotifications, eq(pushDeliveries.notificationId, pushNotifications.id))
    .where(eq(pushDeliveries.userId, userId))
    .orderBy(desc(pushDeliveries.createdAt));

    res.json(deliveries);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// GET /api/user/notifications/unread-count - Get unread count
app.get("/api/user/notifications/unread-count", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(pushDeliveries)
    .where(
      and(
        eq(pushDeliveries.userId, userId),
        ne(pushDeliveries.status, "read")
      )
    );

    res.json({ count: Number(result.count) });
  } catch (error) {
    console.error("Fetch unread count error:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// POST /api/user/notifications/:notificationId/read - Mark as read
app.post("/api/user/notifications/:notificationId/read", isAuthenticated, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const [delivery] = await db.update(pushDeliveries)
      .set({
        status: "read",
        readAt: new Date(),
      })
      .where(
        and(
          eq(pushDeliveries.notificationId, notificationId),
          eq(pushDeliveries.userId, userId)
        )
      )
      .returning();

    if (delivery) {
      // Increment read count on notification
      await db.update(pushNotifications)
        .set({
          readCount: sql`${pushNotifications.readCount} + 1`
        })
        .where(eq(pushNotifications.id, notificationId));
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// POST /api/user/notifications/read-all - Mark all as read
app.post("/api/user/notifications/read-all", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all unread notifications for this user
    const unreadDeliveries = await db.select({
      notificationId: pushDeliveries.notificationId,
    })
    .from(pushDeliveries)
    .where(
      and(
        eq(pushDeliveries.userId, userId),
        ne(pushDeliveries.status, "read")
      )
    );

    // Update all deliveries to read
    await db.update(pushDeliveries)
      .set({
        status: "read",
        readAt: new Date(),
      })
      .where(
        and(
          eq(pushDeliveries.userId, userId),
          ne(pushDeliveries.status, "read")
        )
      );

    // Update read counts for each notification
    for (const delivery of unreadDeliveries) {
      await db.update(pushNotifications)
        .set({
          readCount: sql`${pushNotifications.readCount} + 1`
        })
        .where(eq(pushNotifications.id, delivery.notificationId));
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

// DELETE /api/user/notifications/:notificationId - Delete a notification
app.delete("/api/user/notifications/:notificationId", isAuthenticated, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    await db.delete(pushDeliveries)
      .where(
        and(
          eq(pushDeliveries.notificationId, notificationId),
          eq(pushDeliveries.userId, userId)
        )
      );

    res.json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// POST /api/user/notifications/clear-all - Clear all notifications
app.post("/api/user/notifications/clear-all", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    await db.delete(pushDeliveries)
      .where(eq(pushDeliveries.userId, userId));

    res.json({ success: true });
  } catch (error) {
    console.error("Clear all notifications error:", error);
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});

  // Competition routes
  app.get("/api/competitions", async (req, res) => {
    try {
      console.log("🔍 [API] Fetching competitions...");

      const competitionsList = await db
        .select()
        .from(competitions)
        .where(
          and(
            eq(competitions.isActive, true),
            eq(competitions.status, "active")
          )
        )
        .orderBy(asc(competitions.displayOrder), desc(competitions.createdAt));

      console.log(
        `📊 [API] Found ${competitionsList.length} active competitions`
      );

      // Log each competition's details
      competitionsList.forEach((comp) => {
        console.log(
          `  - ID: ${comp.id}, Type: ${comp.type}, Title: ${comp.title}, Status: ${comp.status}`
        );
      });

      // game visibility logic stays SAME
      const { gameSpinConfig, gameScratchConfig, gamePopConfig } = await import(
        "@shared/schema"
      );

      const [spinConfig] = await db
        .select()
        .from(gameSpinConfig)
        .where(eq(gameSpinConfig.id, "active"));

      const [scratchConfig] = await db
        .select()
        .from(gameScratchConfig)
        .where(eq(gameScratchConfig.id, "active"));

      const [popConfig] = await db
        .select()
        .from(gamePopConfig)
        .where(eq(gamePopConfig.id, "active"));

       const [voltzConfigRow] = await db
        .select()
        .from(gameVoltzConfig)
        .where(eq(gameVoltzConfig.id, "active"));

      console.log(
        `⚙️ [API] Game configs - Spin: ${spinConfig?.isVisible}, Scratch: ${scratchConfig?.isVisible}, Pop: ${popConfig?.isVisible}, Voltz: ${voltzConfigRow?.isVisible}`
      );

      const visibleCompetitions = competitionsList.filter((comp) => {
        if (comp.type === "spin" && spinConfig?.isVisible === false)
          return false;
        if (comp.type === "scratch" && scratchConfig?.isVisible === false)
          return false;
        if (comp.type === "pop" && popConfig?.isVisible === false) return false;
         if (comp.type === "voltz" && voltzConfigRow?.isVisible === false) return false;
        return true;
      });

      console.log(
        `✅ [API] Returning ${visibleCompetitions.length} visible competitions`
      );
      console.log(
        `📝 [API] Competition types: ${visibleCompetitions
          .map((c) => c.type)
          .join(", ")}`
      );

      res.json(visibleCompetitions);
    } catch (error) {
      console.error("❌ [API] Error fetching competitions:", error);
      res.status(500).json({ message: "Failed to fetch competitions" });
    }
  });

  app.get(
    "/api/user/entry-competitions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;

        const rows = await db
          .selectDistinct()
          .from(competitions)
          .innerJoin(tickets, eq(tickets.competitionId, competitions.id))
          .where(eq(tickets.userId, userId));

        // return ONLY competitions
        res.json(rows.map((r) => r.competitions));
      } catch (error) {
        console.error("Error fetching entry competitions:", error);
        res.status(500).json({ message: "Failed to fetch entry competitions" });
      }
    }
  );

  // Backend route to update registration source
app.post("/api/user/update-registration-source", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { source } = req.body;

    if (!source || source.trim().length === 0) {
      return res.status(400).json({ error: "Source is required" });
    }

    // Update the user's registration source
    await db.update(users)
      .set({
        howDidYouFindUs: source.trim(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Log this action
    await db.insert(auditLogs).values({
      userId,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      email: req.user.email,
      action: "update_registration_source",
      description: `Updated registration source to: ${source}`,
      createdAt: new Date()
    });

    res.json({
      success: true,
      message: "Registration source updated successfully"
    });

  } catch (error) {
    console.error("Error updating registration source:", error);
    res.status(500).json({ error: "Failed to update registration source" });
  }
});


// Backend route to check if user needs to provide source
app.get("/api/user/registration-source-status", isAuthenticated, async (req, res) => {
  const userId = req.user.id;
  
  const user = await db.select({
    howDidYouFindUs: users.howDidYouFindUs,
    createdAt: users.createdAt
  })
  .from(users)
  .where(eq(users.id, userId))
  .limit(1);

  const userData = user[0];
  
  // If user registered more than 7 days ago and hasn't provided source, ask them
  const needsToProvide = !userData.howDidYouFindUs && 
  new Date(userData.createdAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

res.json({
  needsToProvide, // true only for old users without source
  hasProvided: !!userData.howDidYouFindUs,
  source: userData.howDidYouFindUs,
  createdAt: userData.createdAt
});
});

  app.get("/api/competitions/:id", async (req, res) => {
    try {
      const competition = await db
        .select()
        .from(competitions)
        .where(
          and(
            eq(competitions.id, req.params.id),
            eq(competitions.status, "active")
          )
        )
        .limit(1);

      if (!competition.length) {
        return res.status(404).json({ message: "Competition not found" });
      }

      res.json(competition[0]);
    } catch (error) {
      console.error("Error fetching competition:", error);
      res.status(500).json({ message: "Failed to fetch competition" });
    }
  });

  app.post(
    "/api/create-payment-intent",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const {
          orderId,
          quantity,
          useWalletBalance = false,
          useRingtonePoints = false,
        } = req.body;
        const userId = req.user.id;

        if (!orderId || typeof orderId !== "string") {
          return res
            .status(400)
            .json({ message: "Invalid or missing order ID" });
        }

        console.log("📋 Creating payment for orderId:", orderId);

        const order = await storage.getOrder(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.userId !== userId) {
          return res
            .status(403)
            .json({ message: "Not authorized for this order" });
        }

        const competition = await storage.getCompetition(order.competitionId);
        if (!competition)
          return res.status(404).json({ message: "Competition not found" });

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
        const session = await cashflows.createCompetitionPaymentSession(
          remainingAmount,
          {
            orderId,
            competitionId: competition.id,
            userId,
            quantity: (quantity || order.quantity || 1).toString(),
            paymentBreakdown: JSON.stringify(paymentBreakdown),
          }
        );

        if (!session.hostedPageUrl) {
          // If Cashflows fails, refund wallet + points
          if (walletUsed > 0) {
            await storage.updateUserBalance(
              userId,
              (walletBalance + walletUsed).toFixed(2)
            );
          }
          if (pointsUsed > 0) {
            await storage.updateUserRingtonePoints(
              userId,
              ringtonePoints + pointsUsed
            );
          }

          return res
            .status(500)
            .json({ message: "Failed to get Cashflows checkout URL" });
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
    }
  );

  // Update the payment success route (IDEMPOTENT)
  app.post(
    "/api/payment-success/competition",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { paymentJobRef, paymentRef, orderId } = req.body;
        const userId = req.user.id;
  
        if (!paymentJobRef || !paymentRef || !orderId) {
          return res
            .status(400)
            .json({ message: "Missing paymentJobRef, paymentRef or orderId" });
        }
  
        console.log("🔍 Confirming Cashflows payment:", {
          paymentJobRef,
          paymentRef,
          orderId,
        });
  
        // Verify payment with Cashflows
        const payment = await cashflows.getPaymentStatus(
          paymentJobRef,
          paymentRef
        );
  
        const paymentStatus =
          payment?.status ||
          payment?.data?.status ||
          payment?.data?.paymentStatus ||
          payment?.paymentStatus;
  
        console.log("📊 Payment Status:", paymentStatus);
  
        const successStatuses = ["SUCCESS", "COMPLETED", "PAID", "Paid"];
  
        const user = await storage.getUser(userId);
        const balance = parseFloat(user?.balance || "0");
  
        // ❌ Payment failed
        if (!successStatuses.includes(paymentStatus)) {
          await db.insert(auditLogs).values({
            userId,
            userName:
              `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
              "Customer",
            email: user?.email || "",
            action: "payment_failed",
            description: `Payment failed for order ${orderId}. Status: ${paymentStatus}`,
            startBalance: balance,
            endBalance: balance,
            createdAt: new Date(),
          });
  
          return res.status(400).json({
            message: `Payment not completed. Status: ${paymentStatus}`,
          });
        }
  
        // Get order
        const order = await storage.getOrder(orderId);
        console.log(order)
        if (!order || order.userId !== userId) {
          await db.insert(auditLogs).values({
            userId,
            userName:
              `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
              "Customer",
            email: user?.email || "",
            action: "order_not_found",
            description: `Order ${orderId} not found or belongs to wrong user`,
            startBalance: balance,
            endBalance: balance,
            createdAt: new Date(),
          });
  
          return res
            .status(404)
            .json({ message: "Order not found or belongs to wrong user" });
        }
  
        // Get competition
        const competition = await storage.getCompetition(order.competitionId);
  
        // Check if order is already completed
        if (order.status === "completed") {
          console.log("⚠️ Order already completed");
          
          // Get the tickets for this order
          const orderTickets = await db
            .select()
            .from(tickets)
            .where(eq(tickets.orderId, orderId));
  
          return res.json({
            success: true,
            orderId,
            competitionId: order.competitionId,
            competitionType: competition?.type || "competition",
            tickets: orderTickets.map(t => ({ ticketNumber: t.ticketNumber })),
            cardsPurchased: order.quantity,
            quantity: order.quantity,
            totalAmount: order.totalAmount,
          });
        }
  
        // For instant play payments, generate tickets immediately
        if (order.paymentMethod === "instaplay") {
          // Check if there's a pending payment record or create one
          let pending = await db.query.pendingPayments.findFirst({
            where: (p, { eq, and }) => and(
              eq(p.paymentJobReference, paymentJobRef),
              eq(p.status, "pending")
            ),
          });
  
          // Create pending payment if it doesn't exist
          // if (!pending) {
          //   const [newPending] = await db.insert(pendingPayments).values({
          //     userId,
          //     orderId,
          //     paymentType: "instant_play",
          //     paymentJobReference: paymentJobRef,
          //     paymentReference: paymentRef,
          //     amount: parseFloat(order.totalAmount),
          //     status: "pending",
          //     metadata: {
          //       gameType: competition?.type || 'scratch',
          //       competitionType: competition?.type,
          //     },
          //     createdAt: new Date(),
          //   }).returning();
            
          //   pending = newPending;
          // }

          if (!pending) {
            console.warn("No pending payment found in success route");

            return res.json({
              success: true,
              waitingForWebhook: true,
              message: "Payment received, processing shortly",
            });
          }
  
          if (pending) {
            // Process the instant play purchase IMMEDIATELY
            // This creates tickets right away without waiting for webhook
            const tickets = await processInstantPlayPurchase(
              userId,
              orderId,
              pending.id,
              paymentRef,
              order.quantity,
              parseFloat(order.totalAmount),
              competition?.type || 'scratch'
            );
  
            // Update pending payment status to completed
            await db.update(pendingPayments)
              .set({ 
                status: "completed",
                updatedAt: new Date()
              })
              .where(eq(pendingPayments.id, pending.id));
  
            // Log success
            await db.insert(auditLogs).values({
              userId,
              userName:
                `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                "Customer",
              email: user?.email || "",
              action: "instant_play_completed",
              competitionId: order.competitionId,
              description: `Instant play purchase completed immediately: ${order.quantity} tickets for £${order.totalAmount}`,
              startBalance: balance,
              endBalance: balance,
              createdAt: new Date(),
            });
  
            console.log("✅ Instant play tickets generated immediately:", {
              orderId,
              ticketCount: tickets.length,
              gameType: competition?.type
            });
  
            return res.json({
              success: true,
              orderId,
              competitionId: order.competitionId,
              competitionType: competition?.type || "competition",
              tickets: tickets.map(t => ({ ticketNumber: t.ticketNumber })),
              cardsPurchased: order.quantity,
              quantity: order.quantity,
              totalAmount: order.totalAmount,
              generatedImmediately: true
            });
          }
        }
  
        // For non-instant play or fallback, wait for webhook
        await db.insert(auditLogs).values({
          userId,
          userName:
            `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
            "Customer",
          email: user?.email || "",
          action: "payment_verified_waiting_webhook",
          competitionId: order.competitionId,
          description: `Payment verified for order ${orderId}, waiting for webhook processing`,
          startBalance: balance,
          endBalance: balance,
          createdAt: new Date(),
        });
  
        console.log("✅ Payment verified — webhook will process order");
  
        return res.json({
          success: true,
          orderId,
          competitionId: order.competitionId,
          competitionType: competition?.type || "competition",
          waitingForWebhook: true,
        });
      } catch (error: any) {
        console.error("❌ Error confirming competition payment:", error);
  
        try {
          const user = await storage.getUser(req.user.id);
          const balance = parseFloat(user?.balance || "0");
  
          await db.insert(auditLogs).values({
            userId: req.user.id,
            userName:
              `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
              "Customer",
            email: user?.email || "",
            action: "payment_error",
            description: `Error processing payment: ${error.message}`,
            startBalance: balance,
            endBalance: balance,
            createdAt: new Date(),
          });
        } catch (auditError) {
          console.error("Failed to log audit error:", auditError);
        }
  
        return res
          .status(500)
          .json({ message: "Failed to confirm competition payment" });
      }
    }
  );
  

  app.get(
    "/api/admin/users/audit/:id",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
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
    }
  );

  app.post("/api/cashflows/webhook", async (req, res) => {
    console.log("WEBHOOK HIT", req.body);
  
    const { paymentJobReference, paymentReference } = req.body;
  
    // Always reply immediately
    res.status(200).json({ received: true });
  
    try {
      // Add small delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 100));
  
      // Find pending payment - REMOVED quantity from SELECT
      const pendingResult = await db.execute<{
        rows: Array<{
          id: string;
          userId: string;
          status: string;
          paymentType: string;
          orderId: string | null;
          metadata: any;
        }>
      }>(sql`
        SELECT id, user_id as "userId", status, payment_type as "paymentType", 
               order_id as "orderId", metadata
        FROM pending_payments 
        WHERE payment_job_reference = ${paymentJobReference}
        LIMIT 1
      `);
      
      const pending = Array.isArray(pendingResult) ? pendingResult[0] : pendingResult.rows?.[0];
  
      if (!pending) {
        console.warn("No pending payment found:", paymentJobReference);
        return;
      }

      // 🛑 GLOBAL IDEMPOTENCY CHECK (VERY IMPORTANT)
        const [existingTx] = await db
          .select()
          .from(transactions)
          .where(eq(transactions.paymentRef, paymentReference ?? paymentJobReference))
          .limit(1);

        if (existingTx) {
          console.log("⚠️ Already processed (webhook/success):", paymentReference);
          return;
        }
  
      // 🚫 Hard stop if not pending
      if (pending.status !== "pending") {
        console.log("Blocked non-pending payment:", pending.status);
        return;
      }
  
      // Save payment reference once
      if (!pending.paymentReference && paymentReference) {
        await db.execute(sql`
          UPDATE pending_payments 
          SET payment_reference = ${paymentReference}
          WHERE id = ${pending.id}
        `);
      }
  
      // 🔍 Ask Cashflows for truth
      const payment = await cashflows.getPaymentStatus(
        paymentJobReference,
        paymentReference ?? undefined
      );
  
      const { status, paidAmount } = normalizeCashflowsStatus(payment);
  
      console.log("Normalized status:", { 
        status, 
        paidAmount, 
        paymentType: pending.paymentType,
        metadata: pending.metadata 
      });
  
      // ⏳ Still waiting
      if (status === "PENDING") return;
  
      // ❌ Handle failures
      if (status === "FAILED") {
        await db.execute(sql`
          UPDATE pending_payments 
          SET status = 'failed', updated_at = NOW()
          WHERE id = ${pending.id}
        `);
  
        if (pending.orderId && pending.paymentType === 'instant_play') {
          await db.execute(sql`
            UPDATE orders 
            SET status = 'failed', updated_at = NOW()
            WHERE id = ${pending.orderId}
          `);
        }
  
        console.warn("Payment failed", {
          paymentJobReference,
          status,
          paidAmount,
          paymentType: pending.paymentType,
        });
        return;
      }
  
      // ⏳ Still waiting for PAID status
      if (status !== "PAID" || paidAmount <= 0) {
        return;
      }
  
      // ✅ Payment is successful - handle based on payment type
      if (pending.paymentType === 'wallet_topup') {
        await processWalletTopup(
          pending.userId,
          pending.id,
          paymentReference ?? paymentJobReference,
          paidAmount
        );
      } else if (pending.paymentType === 'instant_play') {
        // Get quantity from orders table since it's not in pending_payments
        if (pending.orderId) {
          const orderResult = await db.execute<{
            rows: Array<{ quantity: number }>
          }>(sql`
            SELECT quantity 
            FROM orders 
            WHERE id = ${pending.orderId}
          `);
          
          const order = Array.isArray(orderResult) ? orderResult[0] : orderResult.rows?.[0];
          const quantity = order?.quantity || 1;
          
          const gameType = pending.metadata?.gameType || 
                           pending.metadata?.competitionType || 
                           'unknown';
          
          await processInstantPlayPurchase(
            pending.userId,
            pending.orderId,
            pending.id,
            paymentReference ?? paymentJobReference,
            quantity,
            paidAmount,
            gameType
          );
        }
      } else {
        console.warn("Unknown payment type:", pending.paymentType);
        return;
      }
  
      console.log(`✅ ${pending.paymentType} processed successfully:`, paymentJobReference);
    } catch (err) {
      console.error("Webhook error:", err);
    }
  });
  
  // Updated function to handle all game types

  async function processInstantPlayPurchase(
    userId: string,
    orderId: string,
    pendingPaymentId: string,
    paymentRef: string,
    quantity: number,
    amount: number,
    gameType: string,
    tx?: any // Make transaction optional for webhook usage
  ) {
    if (amount <= 0) {
      throw new Error("Invalid payment amount");
    }
  
    // If tx is provided, use it (for webhook), otherwise create new transaction
    const executeInTx = async (transaction: any) => {
      // 🛑 Idempotency guard
      const [existing] = await transaction
        .select()
        .from(transactions)
          .where(eq(transactions.paymentRef, paymentRef))
        .limit(1);
  
      if (existing) {
        console.warn("Duplicate instant play transaction blocked:", pendingPaymentId);
        return;
      }
  
      // Get the order details
      const [order] = await transaction
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
  
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }
  
      // Get competition
      const [competition] = await transaction
        .select()
        .from(competitions)
        .where(eq(competitions.id, order.competitionId));
  
      // Create transaction record
      await transaction.insert(transactions).values({
        userId,
        type: "purchase",
        amount: Math.round(amount * 100) / 100,
        paymentRef,
        pendingPaymentId,
        orderId,
        description: `Instant play purchase: ${competition?.title || gameType} - £${amount}`,
        status: "completed",
        createdAt: new Date(),
      });
  
      // Update order status
      await transaction.update(orders)
        .set({
          status: "completed",
          updatedAt: new Date(),
          paymentMethod: "instaplay",
        })
        .where(eq(orders.id, orderId));
  
      // Update competition sold tickets count
      if (competition) {
        await transaction.update(competitions)
          .set({ 
            soldTickets: (competition.soldTickets || 0) + order.quantity,
            updatedAt: new Date()
          })
          .where(eq(competitions.id, order.competitionId));
      }
  
      // Generate tickets for the game (these are the entries/plays)
      const generatedTickets = [];
      for (let i = 0; i < order.quantity; i++) {
        // Generate appropriate ticket number format based on game type
        let ticketNumber;
        switch (gameType) {
          case 'scratch':
            ticketNumber = `SCRATCH-${nanoid(8).toUpperCase()}`;
            break;
          case 'spin':
            ticketNumber = `SPIN-${nanoid(8).toUpperCase()}`;
            break;
          case 'pop':
            ticketNumber = `POP-${nanoid(8).toUpperCase()}`;
            break;
          case 'plinko':
            ticketNumber = `PLINKO-${nanoid(8).toUpperCase()}`;
            break;
          default:
            ticketNumber = `GAME-${nanoid(8).toUpperCase()}`;
        }
        
        const [ticket] = await transaction.insert(tickets).values({
          userId,
          competitionId: order.competitionId,
          orderId: orderId,
          ticketNumber,
          isWinner: false,
          createdAt: new Date(),
        }).returning();
        
        generatedTickets.push(ticket);
      }
  
      return { order, competition, generatedTickets };
    };
  
    try {
      let result;
      if (tx) {
        // Use provided transaction (for webhook)
        result = await executeInTx(tx);
      } else {
        // Create new transaction (for direct calls)
        result = await db.transaction(async (transaction) => {
          return await executeInTx(transaction);
        });
      }
  
      // Send confirmation email (non-blocking) - do this outside transaction
      if (result) {
        const { order, competition, generatedTickets } = result;
        
        // Get user for email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));
  
        if (user?.email) {
          const ticketNumbers = generatedTickets.map(t => t.ticketNumber);
          
          sendOrderConfirmationEmail(user.email, {
            orderId: order.id,
            userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer",
            orderType: gameType,
            itemName: competition?.title || `${gameType} Game`,
            quantity: order.quantity,
            totalAmount: order.totalAmount,
            orderDate: new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            paymentMethod: "Instant Play (Card)",
            ticketNumbers: ticketNumbers.length > 0 ? ticketNumbers : undefined,
          }).catch((err) =>
            console.error(`Failed to send ${gameType} confirmation email:`, err)
          );
        }
      }
  
      console.log("Instant play purchase processed successfully", {
        userId,
        orderId,
        gameType,
        quantity,
        amount,
      });
  
      return result?.generatedTickets || [];
    } catch (err) {
      console.error("processInstantPlayPurchase FAILED", err);
      throw err;
    }
  }
  
  // Updated helper to handle all game types
  async function createGameUsageRecord(
    tx: any,
    { userId, orderId, gameType, quantity }: any
  ) {
    const usageRecords = [];
    
    for (let i = 0; i < quantity; i++) {
      switch (gameType) {
        case 'pop':
          await tx.insert(popUsage).values({
            orderId,
            userId,
            usedAt: new Date(),
          });
          break;
        case 'plinko':
          await tx.insert(plinkoUsage).values({
            orderId,
            userId,
            usedAt: new Date(),
          });
          break;
        case 'scratch':
          await tx.insert(scratchCardUsage).values({
            orderId,
            userId,
            usedAt: new Date(),
          });
          break;
        case 'spin':
          await tx.insert(spinUsage).values({
            orderId,
            userId,
            usedAt: new Date(),
          });
          break;
      }
    }
  }
  
  // Helper to generate ticket numbers
  function generateTicketNumber(orderId: string, index: number, gameType: string): string {
    const prefix = gameType.toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}-${index + 1}`;
  }
  

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
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      if (order.status !== "pending") {
        return res.status(400).json({ message: "Order already processed" });
      }
  
      // Load the competition
      const [competition] = await db.select().from(competitions).where(eq(competitions.id, competitionId));
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
  
      const compType = competition.type;
      
      // -------------------------
      // 2️⃣ CHECK 24-HOUR TICKET CAP (INSTANT ONLY)
      // -------------------------
      if (compType === "instant") {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Count tickets purchased by this user in the last 24 hours for this competition
        const recentTickets = await db
          .select({ count: sql<number>`count(*)` })
          .from(tickets)
          .where(
            and(
              eq(tickets.userId, userId),
              eq(tickets.competitionId, competitionId),
              sql`${tickets.createdAt} >= ${twentyFourHoursAgo}`
            )
          );
        
        const ticketsInLast24h = Number(recentTickets[0]?.count || 0);
        const DAILY_TICKET_CAP = 250;
        
        // Check if this purchase would exceed the cap
        if (ticketsInLast24h + quantity > DAILY_TICKET_CAP) {
          const remainingTickets = DAILY_TICKET_CAP - ticketsInLast24h;
          return res.status(400).json({
            message: `Daily ticket limit reached. You can only purchase ${remainingTickets} more ticket(s) in the next 24 hours. You've already purchased ${ticketsInLast24h} tickets for this competition.`,
            dailyLimit: DAILY_TICKET_CAP,
            purchasedToday: ticketsInLast24h,
            remainingToday: Math.max(0, remainingTickets)
          });
        }
      }
      
      // Total already includes discount if applied
      const totalAmount = Number(order.totalAmount);
  
      // -------------------------
      // 3️⃣ SOLD-OUT LOGIC (INSTANT ONLY)
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
      // 4️⃣ USER BALANCE + POINTS
      // -------------------------
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      const walletBalance = Number(user?.balance || "0");
      const ringtonePoints = user?.ringtonePoints || 0;
  
      let remainingAmount = totalAmount;
      let walletUsed = 0;
      let pointsUsed = 0;
      let cashflowsUsed = 0;
  
      const paymentBreakdown = [];
  
      // -------------------------
      // 5️⃣ APPLY WALLET
      // -------------------------
      if (useWalletBalance) {
        walletUsed = Math.min(walletBalance, remainingAmount);
        if (walletUsed > 0) {
          const newBalance = walletBalance - walletUsed;
          
          await db.update(users)
            .set({ balance: newBalance.toString() })
            .where(eq(users.id, userId));
  
          await db.insert(transactions).values({
            userId,
            type: "purchase",
            amount: `-${walletUsed.toFixed(2)}`,
            description: `Wallet payment for ${competition.title}`,
            orderId,
            createdAt: new Date(),
          });
  
          remainingAmount -= walletUsed;
          paymentBreakdown.push({
            method: "wallet",
            amount: walletUsed,
            description: `Wallet: £${walletUsed.toFixed(2)}`,
          });
        }
      }
  
      // -------------------------
      // 6️⃣ APPLY POINTS - SIMPLE, NO DISCOUNT LOGIC
      // -------------------------
      if (useRingtonePoints && remainingAmount > 0) {
        const availablePoints = ringtonePoints;
        
        // Calculate points needed for remaining amount (100 points = £1.00)
        const pointsNeeded = Math.ceil(remainingAmount * 100);
        
        // Check if user has enough points
        if (availablePoints < pointsNeeded) {
          // Refund wallet if used
          if (walletUsed > 0) {
            const currentBalance = Number(user?.balance || "0");
            await db.update(users)
              .set({ balance: (currentBalance + walletUsed).toString() })
              .where(eq(users.id, userId));
          }
          
          return res.status(400).json({ 
            message: `Insufficient points. You need ${pointsNeeded} points. You have ${availablePoints} points.`,
            remainingAmount,
            pointsNeeded
          });
        }
        
        // Calculate cash value of points used
        const pointsAmount = pointsNeeded * 0.01;
        
        // Update user points
        const newPoints = availablePoints - pointsNeeded;
        await db.update(users)
          .set({ ringtonePoints: newPoints })
          .where(eq(users.id, userId));
  
        await db.insert(transactions).values({
          userId,
          type: "purchase",
          amount: `-${pointsNeeded}`,
          description: `Ringtone Points payment for ${competition.title}`,
          orderId,
          createdAt: new Date(),
        });
  
        pointsUsed = pointsNeeded;
        remainingAmount -= pointsAmount;
        
        paymentBreakdown.push({
          method: "ringtone_points",
          amount: pointsAmount,
          pointsUsed: pointsNeeded,
          description: `Ringtone Points: £${pointsAmount.toFixed(2)} (${pointsNeeded} points)`,
        });
      }
  
      // -------------------------
      // 7️⃣ CASHFLOWS NEEDED?
      // -------------------------
      if (remainingAmount > 0) {
        cashflowsUsed = remainingAmount;
  
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
          if (walletUsed > 0) {
            await db.update(users)
              .set({ balance: (walletBalance + walletUsed).toString() })
              .where(eq(users.id, userId));
          }
          if (pointsUsed > 0) {
            await db.update(users)
              .set({ ringtonePoints: ringtonePoints + pointsUsed })
              .where(eq(users.id, userId));
          }
  
          return res
            .status(500)
            .json({ message: "Failed to create payment session" });
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
  
        // Save partial payment info
        await db.update(orders)
          .set({ 
            status: "processing",
            paymentMethod: paymentMethodText,
            walletAmount: walletUsed.toString(),
            pointsAmount: pointsUsed.toString(),
            cashflowsAmount: remainingAmount.toString(),
            paymentBreakdown: JSON.stringify(paymentBreakdown),
            updatedAt: new Date()
          })
          .where(eq(orders.id, orderId));
  
        return res.json({
          success: true,
          redirectUrl: session.hostedPageUrl,
          sessionId: session.paymentJobReference,
        });
      }
  
      // -------------------------
      // 8️⃣ FULLY PAID — COMPLETE ORDER
      // -------------------------
      let paymentMethodText = "Discount";
      if (walletUsed > 0 && pointsUsed > 0) {
        paymentMethodText = "Wallet+Points";
      } else if (walletUsed > 0) {
        paymentMethodText = "Wallet Credit";
      } else if (pointsUsed > 0) {
        paymentMethodText = "Points";
      }
  
      // Update order with correct payment method
      await db.update(orders)
        .set({ 
          status: "completed",
          paymentMethod: paymentMethodText,
          walletAmount: walletUsed.toString(),
          pointsAmount: pointsUsed.toString(),
          cashflowsAmount: "0",
          paymentBreakdown: JSON.stringify(paymentBreakdown),
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));
  
      // Create tickets
      const createdTickets = [];

      for (let i = 0; i < quantity; i++) {
        const ticketNumber = nanoid(8).toUpperCase();
      
        const [ticket] = await db.insert(tickets).values({
          userId,
          competitionId,
          orderId: order.id,
          ticketNumber,
          isWinner: false,
          createdAt: new Date(),
        }).returning();
      
        createdTickets.push(ticket);
      }
      
  
      // Update sold tickets for instant competitions
      if (compType === "instant") {
        await db.update(competitions)
          .set({ 
            soldTickets: (competition.soldTickets || 0) + quantity,
            updatedAt: new Date()
          })
          .where(eq(competitions.id, competition.id));
      }
  
      // Send confirmation email
      if (user?.email) {
        const ticketNumbers = createdTickets.map((t) => t.ticketNumber);
  
        await sendOrderConfirmationEmail(user.email, {
          orderId: order.id,
          userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer",
          orderType: "competition",
          itemName: competition.title,
          quantity: quantity,
          totalAmount: order.totalAmount,
          orderDate: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          paymentMethod: paymentMethodText,
          ticketNumbers: ticketNumbers.length > 0 ? ticketNumbers : undefined,
        }).catch(err => {
          console.error("Failed to send order confirmation email for competition:", err);
        });
      }
  
    
  
      // -------------------------
      // 9️⃣ AUDIT LOG
      // -------------------------
      const startBalance = Number(user.balance) + Number(totalAmount);
      const endBalance = Number(user.balance);
  
      // Get discount info for audit log
      let discountInfo = '';
      if (order.discountCodeId) {
        const [discount] = await db.select().from(discountCodes).where(eq(discountCodes.id, order.discountCodeId));
        if (discount) {
          discountInfo = ` with discount code ${discount.code} (${discount.type === 'cash' ? `£${discount.value} off` : `${discount.value} points`})`;
        }
      }
  
      await db.insert(auditLogs).values({
        userId,
        userName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        action: "buy_competition",
        competitionId: competition.id,
        description: `Bought ${quantity} ticket(s) for ${competition.title}${discountInfo}`,
        startBalance,
        endBalance,
        createdAt: new Date(),
      });
  
      // -------------------------
      // 🔟 RESPONSE
      // -------------------------
      return res.json({
        success: true,
        message: "Competition entry purchased successfully",
        orderId,
        competitionId,
        tickets: createdTickets.map(t => ({ ticketNumber: t.ticketNumber })),
        paymentMethod: paymentMethodText,
        paymentBreakdown,
      });
    } catch (error) {
      console.error("Error purchasing ticket:", error);
      res.status(500).json({ message: "Failed to complete purchase" });
    }
  });


  app.post("/api/create-spin-order", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { competitionId, quantity = 1 } = req.body;

    const competition = await storage.getCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    const spinCostPerTicket = parseFloat(competition.ticketPrice);
    
    // Calculate discount
    const { originalTotal, discountPercent, discountedTotal, savings } = 
      calculateDiscountedTotal(spinCostPerTicket, quantity);

    const user = await storage.getUser(userId);
    const userBalance = parseFloat(user?.balance || "0");
    const userPoints = user?.ringtonePoints || 0;
    const pointsValue = userPoints * 0.01;

    const order = await storage.createOrder({
      userId,
      competitionId,
      quantity,
      totalAmount: discountedTotal.toString(),
      paymentMethod: "pending",
      status: "pending",
    });

    res.json({
      success: true,
      orderId: order.id,
      totalAmount: discountedTotal,
      originalAmount: originalTotal,
      discountPercent,
      savings,
      quantity,
      userBalance: {
        wallet: userBalance,
        ringtonePoints: userPoints,
        pointsValue: pointsValue,
      },
      spinCost: spinCostPerTicket,
      competition: {
        title: competition.title,
        type: competition.type,
      },
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
      const { orderId, useWalletBalance = false, useRingtonePoints = false,  useInstaplay = false } = req.body;
  
      // Fetch order from database
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      if (order.status !== "pending") {
        return res.status(400).json({ message: "Order already processed" });
      }
  
      // Get competition
      const [competition] = await db.select().from(competitions).where(eq(competitions.id, order.competitionId));
      
      if (!competition || competition.type !== "spin") {
        return res.status(400).json({ message: "Invalid competition type" });
      }
  
      // Get user
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      // Handle Instaplay - direct card payment without wallet
    if (useInstaplay) {
      const totalAmount = Number(order.totalAmount);
      
      // Create Cashflows session for instant play
      const session = await cashflows.createCompetitionPaymentSession(
        totalAmount,
        {
          orderId,
          competitionId: order.competitionId,
          userId,
          quantity: order.quantity.toString(),
          paymentType: 'instant_play', // Mark as instant play
          gameType: 'spin'
        }
      );

      if (!session.hostedPageUrl) {
        return res.status(500).json({ message: "Failed to create payment session" });
      }

      // Create pending payment record for instant play
      await db.insert(pendingPayments).values({
        userId,
        orderId: order.id,
        paymentJobReference: session.paymentJobReference,
        paymentType: 'instant_play',
        amount: totalAmount.toString(),
        metadata: {
          competitionId: competition.id,
          competitionTitle: competition.title,
          gameType: 'spin',
          quantity: order.quantity
        },
        status: 'pending',
        createdAt: new Date()
      });

      // Update order with payment info
      await db.update(orders)
        .set({ 
          paymentMethod: "instaplay",
          cashflowsAmount: totalAmount.toString(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

      return res.json({
        success: true,
        redirectUrl: session.hostedPageUrl,
        sessionId: session.paymentJobReference,
        paymentType: 'instaplay',
        message: "Redirecting to payment..."
      });
    }
  
      const totalAmount = Number(order.totalAmount); // This already includes discount if applied!
      let remainingAmount = totalAmount;
      let walletUsed = 0;
      let pointsUsed = 0;
      let cashflowsUsed = 0;
  
      const paymentBreakdown = [];
  
      // Process wallet balance if selected
      if (useWalletBalance) {
        const walletBalance = Number(user?.balance) || 0;
        const walletAmount = Math.min(walletBalance, remainingAmount);
  
        if (walletAmount > 0) {
          const newBalance = walletBalance - walletAmount;
          
          // Update user balance
          await db.update(users)
            .set({ balance: newBalance.toString() })
            .where(eq(users.id, userId));
  
          // Create transaction
          await db.insert(transactions).values({
            userId,
            type: "purchase",
            amount: `-${walletAmount.toFixed(2)}`,
            description: `Wallet payment for ${order.quantity} spin(s) - ${competition.title}`,
            orderId,
            createdAt: new Date(),
          });
  
          walletUsed = walletAmount;
          remainingAmount -= walletAmount;
          paymentBreakdown.push({
            method: "wallet",
            amount: walletAmount,
            description: `Site Credit: £${walletAmount.toFixed(2)}`,
          });
        }
      }
  
      // Process ringtone points if selected - SIMPLE, NO DISCOUNT LOGIC HERE
      if (useRingtonePoints && remainingAmount > 0) {
        const availablePoints = user?.ringtonePoints || 0;
        
        // Calculate points needed for remaining amount (100 points = £1.00)
        const pointsNeeded = Math.ceil(remainingAmount * 100);
        
        // Check if user has enough points
        if (availablePoints < pointsNeeded) {
          // Refund wallet if used
          if (walletUsed > 0) {
            const currentBalance = Number(user?.balance) || 0;
            await db.update(users)
              .set({ balance: (currentBalance + walletUsed).toString() })
              .where(eq(users.id, userId));
          }
          
          return res.status(400).json({ 
            message: `Insufficient points. You need ${pointsNeeded} points. You have ${availablePoints} points.`,
            remainingAmount,
            pointsNeeded
          });
        }
        
        // Calculate cash value of points used
        const pointsAmount = pointsNeeded * 0.01;
        
        // Update user points
        const newPoints = availablePoints - pointsNeeded;
        await db.update(users)
          .set({ ringtonePoints: newPoints })
          .where(eq(users.id, userId));
  
        // Create transaction
        await db.insert(transactions).values({
          userId,
          type: "purchase",
          amount: `-${pointsAmount.toFixed(2)}`,
          description: `Ringtone points payment for ${order.quantity} spin(s) - ${competition.title} (Used ${pointsNeeded} points)`,
          orderId,
          createdAt: new Date(),
        });
  
        pointsUsed = pointsNeeded;
        remainingAmount -= pointsAmount;
        
        paymentBreakdown.push({
          method: "ringtone_points",
          amount: pointsAmount,
          pointsUsed: pointsNeeded,
          description: `Ringtone Points: £${pointsAmount.toFixed(2)} (${pointsNeeded} points)`,
        });
      }
  
      // Process remaining amount through Cashflows
      if (remainingAmount > 0) {
        cashflowsUsed = remainingAmount;
  
        const session = await cashflows.createCompetitionPaymentSession(
          remainingAmount,
          {
            orderId,
            competitionId: order.competitionId,
            userId,
            quantity: order.quantity.toString(),
            paymentBreakdown: JSON.stringify(paymentBreakdown),
          }
        );
  
        if (!session.hostedPageUrl) {
          // Refund wallet and points if Cashflows fails
          if (walletUsed > 0) {
            const currentBalance = Number(user?.balance) || 0;
            await db.update(users)
              .set({ balance: (currentBalance + walletUsed).toString() })
              .where(eq(users.id, userId));
          }
          if (pointsUsed > 0) {
            const currentPoints = user?.ringtonePoints || 0;
            await db.update(users)
              .set({ ringtonePoints: currentPoints + pointsUsed })
              .where(eq(users.id, userId));
          }
  
          return res.status(500).json({ message: "Failed to create Cashflows session" });
        }
  
        // Determine payment method text for mixed payment
        let paymentMethodText = "Discount";
        if (walletUsed > 0 && pointsUsed > 0 && remainingAmount > 0) {
          paymentMethodText = "Wallet+Points+Cashflow";
        } else if (walletUsed > 0 && remainingAmount > 0) {
          paymentMethodText = "Wallet+Cashflow";
        } else if (pointsUsed > 0 && remainingAmount > 0) {
          paymentMethodText = "Points+Cashflow";
        }
  
        // Update order with payment info
        await db.update(orders)
          .set({ 
            status: "processing",
            paymentMethod: paymentMethodText,
            walletAmount: walletUsed.toString(),
            pointsAmount: pointsUsed.toString(),
            cashflowsAmount: cashflowsUsed.toString(),
            paymentBreakdown: JSON.stringify(paymentBreakdown),
            updatedAt: new Date()
          })
          .where(eq(orders.id, orderId));
  
        return res.json({
          success: true,
          redirectUrl: session.hostedPageUrl,
          sessionId: session.paymentJobReference,
          paymentBreakdown: {
            walletUsed,
            pointsUsed,
            cashflowsUsed,
            remainingAmount,
          },
          remainingAmount,
        });
      } else {
        // Full payment completed with wallet/points only
        let paymentMethodText = "Discount";
        if (walletUsed > 0 && pointsUsed > 0) {
          paymentMethodText = "Wallet+Points";
        } else if (walletUsed > 0) {
          paymentMethodText = "Wallet Credit";
        } else if (pointsUsed > 0) {
          paymentMethodText = "Points";
        }
  
        // Update order with payment info and mark as completed
        await db.update(orders)
          .set({ 
            status: "completed",
            paymentMethod: paymentMethodText,
            walletAmount: walletUsed.toString(),
            pointsAmount: pointsUsed.toString(),
            cashflowsAmount: "0",
            paymentBreakdown: JSON.stringify(paymentBreakdown),
            updatedAt: new Date()
          })
          .where(eq(orders.id, orderId));
  
        // Create spin entries
        const spinEntries  = [];
        for (let i = 0; i < order.quantity; i++) {
          const ticketNumber = `SPIN-${nanoid(8).toUpperCase()}`;
          const [ticket] = await db.insert(tickets).values({
            userId,
            competitionId: order.competitionId,
            orderId: order.id,
            ticketNumber,
            isUsed: false,
            result: null,
            createdAt: new Date(),
          }).returning();
          spinEntries .push(ticket);
        }
  
        // Update competition sold tickets count
        await db.update(competitions)
          .set({ 
            soldTickets: (competition.soldTickets || 0) + order.quantity,
            updatedAt: new Date()
          })
          .where(eq(competitions.id, competition.id));
  
        // Get discount info for audit log
        let discountInfo = '';
        if (order.discountCodeId) {
          const [discount] = await db.select().from(discountCodes).where(eq(discountCodes.id, order.discountCodeId));
          if (discount) {
            discountInfo = ` with discount code ${discount.code} (${discount.type === 'cash' ? `£${discount.value} off` : `${discount.value} points`})`;
          }
        }
  
        // Audit log
        const startBalance = Number(user.balance) + totalAmount;
        const endBalance = Number(user.balance);
  
        await db.insert(auditLogs).values({
          userId,
          userName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          action: "buy_spin",
          competitionId: competition.id,
          description: `Bought ${order.quantity} spin(s) for ${competition.title}${discountInfo}`,
          startBalance,
          endBalance,
          createdAt: new Date(),
        });
  
        // Send confirmation email
        if (user?.email) {
          const spinNumbers = spinEntries.map((s) => s.spinNumber);
          
          sendOrderConfirmationEmail(user.email, {
            orderId: order.id,
            userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer",
            orderType: "spin",
            itemName: competition.title,
            quantity: order.quantity,
            totalAmount: order.totalAmount,
            orderDate: new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            paymentMethod: paymentMethodText,
            skillQuestion: competition.skillQuestion || undefined,
            skillAnswer: order.skillAnswer || undefined,
            spinNumbers: spinNumbers.length > 0 ? spinNumbers : undefined,
          }).catch((err) =>
            console.error("Failed to send order confirmation email:", err)
          );
        }
  
        return res.json({
          success: true,
          competitionId: order.competitionId,
          message: "Payment completed successfully",
          orderId: order.id,
          spins: spinEntries.map((s) => ({ ticketNumber: s.ticketNumber })),

          spinsPurchased: order.quantity,
          paymentMethod: paymentMethodText,
          paymentBreakdown,
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
// SERVER-SIDE: Spin wheel play route with probability and max wins enforcement
app.post("/api/play-spin-wheel", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId, competitionId } = req.body;

    if (!orderId || !competitionId) {
      return res.status(400).json({
        success: false,
        message: "Order ID and Competition ID are required",
      });
    }

    // 🛡️ CRITICAL: Prevent rapid-fire spins
    const cooldownKey = `${userId}-${orderId}`;
    const lastSpinTime = spinCooldowns.get(cooldownKey) || 0;
    const now = Date.now();
    const timeSinceLastSpin = now - lastSpinTime;

    if (timeSinceLastSpin < SPIN_COOLDOWN_MS) {
      console.warn(
        `⚠️ Spin blocked for user ${userId}: Too fast (${timeSinceLastSpin}ms)`
      );
      return res.status(429).json({
        success: false,
        message: "Please wait a moment before spinning again",
        cooldownRemaining: SPIN_COOLDOWN_MS - timeSinceLastSpin,
      });
    }

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

    // Get competition to know which wheel type
    const competition = await storage.getCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    const wheelType = competition.wheelType || "wheel1";

    // Fetch correct wheel configuration based on wheel type
    let wheelConfig;
    if (wheelType === "wheel2") {
      const [config] = await db
        .select()
        .from(spinWheel2Configs)
        .where(eq(spinWheel2Configs.id, "active"));
      wheelConfig = config || DEFAULT_SPIN_WHEEL_2_CONFIG;
      console.log(`🎡 Using Wheel 2 configuration for competition ${competitionId}`);
    } else {
      const [config] = await db
        .select()
        .from(gameSpinConfig)
        .where(eq(gameSpinConfig.id, "active"));
      wheelConfig = config || DEFAULT_SPIN_WHEEL_CONFIG;
      console.log(`🎡 Using Wheel 1 configuration for competition ${competitionId}`);
    }

    const segments = wheelConfig.segments as any[];

    // Filter out segments that reached maxWins limit AND have zero probability
    console.log("🔍 Checking segment eligibility:");
    const eligibleSegments = [];
    for (const segment of segments) {
      console.log(`\nChecking segment ${segment.id} (${segment.label}):`);
      
      // Check probability
      if (!segment.probability || segment.probability <= 0) {
        console.log(`  ❌ Skipped - probability ${segment.probability} <= 0`);
        continue;
      }
      console.log(`  ✓ Probability: ${segment.probability}`);

      // Check maxWins - Read from config's currentWins
      if (segment.maxWins !== null && segment.maxWins !== undefined) {
        const winCount = segment.currentWins || 0;
        console.log(`  MaxWins: ${segment.maxWins}, Current Wins: ${winCount}`);
        
        if (winCount >= segment.maxWins) {
          console.log(`  ❌ Skipped - reached maxWins (${winCount}/${segment.maxWins})`);
          continue;
        }
        console.log(`  ✓ Under maxWins (${winCount}/${segment.maxWins})`);
      } else {
        console.log(`  ✓ No maxWins limit`);
      }

      eligibleSegments.push(segment);
      console.log(`  ✅ Added to eligible segments`);
    }

    console.log(`\n📊 Total eligible segments: ${eligibleSegments.length}`);
    console.log(`Eligible segments:`, eligibleSegments.map(s => `${s.id}: ${s.label}`));

    if (eligibleSegments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No prizes available at this time",
      });
    }

    // Weighted random selection
    const totalWeight = eligibleSegments.reduce(
      (sum, seg) => sum + seg.probability,
      0
    );

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
      wheelType: wheelType,
    });

    // ✅ UPDATE: Increment currentWins in config
    await updateSegmentWinCount(selectedSegment.id, wheelType);
    console.log(`✅ Updated currentWins for segment ${selectedSegment.id} in ${wheelType} config`);

    // Validate and award prize based on type
    if (
      selectedSegment.rewardType === "cash" &&
      selectedSegment.rewardValue
    ) {
      const amount =
        typeof selectedSegment.rewardValue === "number"
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
        competitionId,
        prizeDescription: selectedSegment.label,
        prizeValue: `£${amount}`,
        imageUrl: null,
        isShowcase: false,
      });

      // 🚀 AUTO-SYNC PRIZE TO PRIZE TABLE
      const maxWins = selectedSegment.maxWins !== undefined && 
                      selectedSegment.maxWins !== null && 
                      selectedSegment.maxWins !== "" 
                        ? Number(selectedSegment.maxWins) 
                        : null;
      
      await syncSpinPrize(
        competitionId,
        selectedSegment.id,
        selectedSegment.label,
        amount,
        'cash',     // ✅ ADD rewardType
        maxWins     // ✅ ADD maxWins
      );
      
    } else if (
      selectedSegment.rewardType === "points" &&
      selectedSegment.rewardValue
    ) {
      const points =
        typeof selectedSegment.rewardValue === "number"
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
        type: "ringtone_points",
        amount: points.toString(),
        description: `Spin Wheel ${wheelType} Prize - ${points} Ringtones`,
      });

      await storage.createWinner({
        userId,
        competitionId,
        prizeDescription: selectedSegment.label,
        prizeValue: `${points} Ringtones`,
        imageUrl: null,
        isShowcase: false,
      });

      // 🚀 AUTO-SYNC PRIZE TO PRIZE TABLE
      const maxWins = selectedSegment.maxWins !== undefined && 
                      selectedSegment.maxWins !== null && 
                      selectedSegment.maxWins !== "" 
                        ? Number(selectedSegment.maxWins) 
                        : null;
      
      await syncSpinPrize(
        competitionId,
        selectedSegment.id,
        selectedSegment.label,
        points,
        'points',   // ✅ ADD rewardType
        maxWins     // ✅ ADD maxWins
      );
    } else if (
      selectedSegment.rewardType === "physical" &&
      selectedSegment.rewardValue
    ) {
      // 🚀 Handle physical prizes too
      await storage.createTransaction({
        userId,
        type: "prize",
        amount: "0",
        description: `Physical Prize Won: ${selectedSegment.label} - Contact support`,
      });

      await storage.createWinner({
        userId,
        competitionId,
        prizeDescription: `Physical Prize: ${selectedSegment.label}`,
        prizeValue: selectedSegment.label,
        imageUrl: null,
        isShowcase: false,
      });

      const maxWins = selectedSegment.maxWins !== undefined && 
                      selectedSegment.maxWins !== null && 
                      selectedSegment.maxWins !== "" 
                        ? Number(selectedSegment.maxWins) 
                        : null;
      
      await syncSpinPrize(
        competitionId,
        selectedSegment.id,
        selectedSegment.label,
        0,           // Physical prizes have no monetary value
        'physical',  // ✅ ADD rewardType
        maxWins      // ✅ ADD maxWins
      );
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
        amount:
          selectedSegment.rewardType === "cash"
            ? parseFloat(String(selectedSegment.rewardValue))
            : selectedSegment.rewardType === "points"
            ? `${selectedSegment.rewardValue} Ringtones`
            : selectedSegment.rewardType === "physical"
            ? selectedSegment.label
            : 0,
        type:
          selectedSegment.rewardType === "lose"
            ? "none"
            : selectedSegment.rewardType,
      },
      spinsRemaining: spinsRemaining - 1,
      orderId: order.id,
      wheelType: wheelType,
    });
  } catch (error) {
    console.error("Error playing spin wheel:", error);
    res.status(500).json({ message: "Failed to play spin wheel" });
  }
});


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
    const prizeSyncs: Array<{
      competitionId: string;
      segmentId: string;
      label: string;
      value: number;
      rewardType: string;
      maxWins: number | null;
    }> = []; // ✅ Updated type

    await db.transaction(async (tx) => {
      // ✅ LOAD WHEEL CONFIG BASED ON TYPE
      let wheelConfig;
      let configTable;
      let configId;

      if (wheelType === "wheel2") {
        configTable = spinWheel2Configs;
        configId = "active";
        const [cfg] = await tx
          .select()
          .from(spinWheel2Configs)
          .where(eq(spinWheel2Configs.id, "active"));
        wheelConfig = cfg || DEFAULT_SPIN_WHEEL_2_CONFIG;
      } else {
        configTable = gameSpinConfig;
        configId = "active";
        const [cfg] = await tx
          .select()
          .from(gameSpinConfig)
          .where(eq(gameSpinConfig.id, "active"));
        wheelConfig = cfg || DEFAULT_SPIN_WHEEL_CONFIG;
      }

      const segments = wheelConfig.segments as any[];

      // Keep track of segment win increments for batch update
      const segmentWinIncrements: Record<string, number> = {};

      // --------------------------------------
      // 🚀 PROCESS SPINS
      // --------------------------------------
      for (let i = 0; i < spinsToProcess; i++) {
        // Filter eligible segments - READ FROM CONFIG'S currentWins
        const eligibleSegments = [];
        for (const segment of segments) {
          if (!segment.probability || segment.probability <= 0) continue;

          if (segment.maxWins !== null) {
            const winCount = segment.currentWins || 0;
            if (winCount >= segment.maxWins) continue;
          }

          eligibleSegments.push(segment);
        }

        if (eligibleSegments.length === 0) break;

        // Weighted random
        const totalWeight = eligibleSegments.reduce(
          (sum, seg) => sum + seg.probability,
          0
        );
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
          wheelType: wheelType, 
        });

        // Track segment win increment for batch update
        segmentWinIncrements[selectedSegment.id] = 
          (segmentWinIncrements[selectedSegment.id] || 0) + 1;

        // Award prize
        let prizeAmount: number | string = 0;
        let prizeType = "none";

        if (
          selectedSegment.rewardType === "cash" &&
          selectedSegment.rewardValue
        ) {
          const amount =
            typeof selectedSegment.rewardValue === "number"
              ? selectedSegment.rewardValue
              : parseFloat(String(selectedSegment.rewardValue));

          totalCash += amount;

          const currentBalance = parseFloat(user.balance || "0");
          user.balance = (currentBalance + amount).toFixed(2);

          await tx
            .update(users)
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
            competitionId,
            prizeDescription: selectedSegment.label,
            prizeValue: `£${amount}`,
            imageUrl: null,
            isShowcase: false,
            createdAt: new Date(),
          });

          prizeAmount = amount;
          prizeType = "cash";

          // ✅ Track for auto-sync with full params
          prizeSyncs.push({
            competitionId,
            segmentId: selectedSegment.id,
            label: selectedSegment.label,
            value: amount,
            rewardType: 'cash',
            maxWins: selectedSegment.maxWins !== undefined && 
                     selectedSegment.maxWins !== null && 
                     selectedSegment.maxWins !== "" 
                       ? Number(selectedSegment.maxWins) 
                       : null
          });

        } else if (
          selectedSegment.rewardType === "points" &&
          selectedSegment.rewardValue
        ) {
          const points =
            typeof selectedSegment.rewardValue === "number"
              ? Math.floor(selectedSegment.rewardValue)
              : parseInt(String(selectedSegment.rewardValue));
          totalPoints += points;

          const currentPoints = user.ringtonePoints || 0;
          user.ringtonePoints = currentPoints + points;

          await tx
            .update(users)
            .set({ ringtonePoints: user.ringtonePoints })
            .where(eq(users.id, userId));

          await tx.insert(transactions).values({
            id: crypto.randomUUID(),
            userId,
            type: "ringtone_points",
            amount: points.toString(),
            description: `Spin Wheel Prize - ${points} Ringtones`,
            createdAt: new Date(),
          });

          await tx.insert(winners).values({
            id: crypto.randomUUID(),
            userId,
            competitionId,
            prizeDescription: selectedSegment.label,
            prizeValue: `${points} Ringtones`,
            imageUrl: null,
            isShowcase: false,
            createdAt: new Date(),
          });

          prizeAmount = `${points} Ringtones`;
          prizeType = "points";

          // ✅ Track for auto-sync with full params
          prizeSyncs.push({
            competitionId,
            segmentId: selectedSegment.id,
            label: selectedSegment.label,
            value: points,
            rewardType: 'points',
            maxWins: selectedSegment.maxWins !== undefined && 
                     selectedSegment.maxWins !== null && 
                     selectedSegment.maxWins !== "" 
                       ? Number(selectedSegment.maxWins) 
                       : null
          });

        } else if (
          selectedSegment.rewardType === "physical" &&
          selectedSegment.rewardValue
        ) {
          // ✅ Handle physical prizes
          await tx.insert(transactions).values({
            id: crypto.randomUUID(),
            userId,
            type: "prize",
            amount: "0",
            description: `Physical Prize Won: ${selectedSegment.label} - Contact support`,
            createdAt: new Date(),
          });

          await tx.insert(winners).values({
            id: crypto.randomUUID(),
            userId,
            competitionId,
            prizeDescription: `Physical Prize: ${selectedSegment.label}`,
            prizeValue: selectedSegment.label,
            imageUrl: null,
            isShowcase: false,
            createdAt: new Date(),
          });

          prizeAmount = selectedSegment.label;
          prizeType = "physical";

          // ✅ Track for auto-sync with full params
          prizeSyncs.push({
            competitionId,
            segmentId: selectedSegment.id,
            label: selectedSegment.label,
            value: 0,
            rewardType: 'physical',
            maxWins: selectedSegment.maxWins !== undefined && 
                     selectedSegment.maxWins !== null && 
                     selectedSegment.maxWins !== "" 
                       ? Number(selectedSegment.maxWins) 
                       : null
          });
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

      // ✅ BATCH UPDATE: Update currentWins in config for all segments at once
      if (Object.keys(segmentWinIncrements).length > 0) {
        // Reload config to get fresh data
        const [currentConfig] = await tx
          .select()
          .from(configTable)
          .where(eq(configTable.id, configId));
        
        if (currentConfig && currentConfig.segments) {
          const updatedSegments = currentConfig.segments.map((segment: any) => {
            const increment = segmentWinIncrements[segment.id] || 0;
            if (increment > 0) {
              return {
                ...segment,
                currentWins: (segment.currentWins || 0) + increment
              };
            }
            return segment;
          });
          
          await tx
            .update(configTable)
            .set({ 
              segments: updatedSegments,
              updated_at: new Date()
            })
            .where(eq(configTable.id, configId));
          
          console.log(`✅ Batch updated ${Object.keys(segmentWinIncrements).length} segments in ${wheelType} config`);
        }
      }
    });

    // --------------------------------------
    // 🚀 AUTO-SYNC PRIZES (Outside transaction)
    // --------------------------------------
    if (prizeSyncs.length > 0) {
      for (const sync of prizeSyncs) {
        try {
          await syncSpinPrize(
            sync.competitionId,
            sync.segmentId,
            sync.label,
            sync.value,
            sync.rewardType,  // ✅ Pass rewardType
            sync.maxWins       // ✅ Pass maxWins
          );
          console.log(`✅ Synced prize: ${sync.label} (${sync.rewardType})`);
        } catch (err) {
          console.error(`Failed to sync prize ${sync.label}:`, err);
          // Continue - don't fail the whole batch
        }
      }
    }

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
        prizesSynced: prizeSyncs.length,
      },
      spinsRemaining: spinsRemaining - results.length,
    });
  } catch (error) {
    console.error("Error revealing all spins:", error);
    res.status(500).json({ message: "Failed to reveal all spins" });
  }
});

  // Get spin order details for billing page
  app.get(
    "/api/spin-order/:orderId",
    isAuthenticated,
    async (req: any, res) => {
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
            used: used,
            discountAmount: order.discountAmount || 0,
            discountType: order.discountType || null,
            percentageDiscount: order.percentageDiscount || 0, 

          },
          user: {
            balance: user?.balance || "0",
            ringtonePoints: user?.ringtonePoints || 0,
          },
          spinCost: 2, // £2 per spin
        });
      } catch (error) {
        console.error("Error fetching spin order:", error);
        res.status(500).json({ message: "Failed to fetch spin order" });
      }
    }
  );

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
          message: "Use appropriate endpoint for this order type",
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
          discountAmount: order.discountAmount || 0,
    discountType: order.discountType || null,
    percentageDiscount: order.percentageDiscount || 0, 
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
  app.post(
    "/api/create-competition-order",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { competitionId, quantity = 1 } = req.body;

        const competition = await storage.getCompetition(competitionId);
        if (!competition) {
          return res.status(404).json({ message: "Competition not found" });
        }

        // Verify it's a regular competition, not spin or scratch
        if (competition.type === "spin" || competition.type === "scratch") {
          return res
            .status(400)
            .json({
              message: "Use appropriate endpoint for this competition type",
            });
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
    }
  );

  app.post("/api/create-scratch-order", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { competitionId, quantity = 1 } = req.body;

    const competition = await storage.getCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    const scratchCostPerCard = parseFloat(competition.ticketPrice);
    
    // Calculate discount
    const { originalTotal, discountPercent, discountedTotal, savings } = 
      calculateDiscountedTotal(scratchCostPerCard, quantity);

    const user = await storage.getUser(userId);
    const userBalance = parseFloat(user?.balance || "0");
    const userPoints = user?.ringtonePoints || 0;
    const pointsValue = userPoints * 0.01;

    const order = await storage.createOrder({
      userId,
      competitionId,
      quantity,
      totalAmount: discountedTotal.toString(),
      paymentMethod: "pending",
      status: "pending",
    });

    res.json({
      success: true,
      orderId: order.id,
      competitionId: competitionId,
      totalAmount: discountedTotal,
      originalAmount: originalTotal,
      discountPercent,
      savings,
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

app.post("/api/create-pop-order", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { competitionId, quantity = 1 } = req.body;

    const competition = await storage.getCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    const popCostPerGame = parseFloat(competition.ticketPrice);
    
    // Calculate discount
    const { originalTotal, discountPercent, discountedTotal, savings } = 
      calculateDiscountedTotal(popCostPerGame, quantity);

    const user = await storage.getUser(userId);
    const userBalance = parseFloat(user?.balance || "0");
    const userPoints = user?.ringtonePoints || 0;
    const pointsValue = userPoints * 0.01;

    const order = await storage.createOrder({
      userId,
      competitionId,
      quantity,
      totalAmount: discountedTotal.toString(),
      paymentMethod: "pending",
      status: "pending",
    });

    res.json({
      success: true,
      orderId: order.id,
      competitionId: competitionId,
      totalAmount: discountedTotal,
      originalAmount: originalTotal,
      discountPercent,
      savings,
      quantity,
      userBalance: {
        wallet: userBalance,
        ringtonePoints: userPoints,
        pointsValue,
      },
      popCost: popCostPerGame,
      competition: {
        title: competition.title,
        type: competition.type,
      },
    });
  } catch (error) {
    console.error("Error creating pop order:", error);
    res.status(500).json({ message: "Failed to create pop order" });
  }
});

// ==========================================
// VOLTZ ORDER - Updated with Discount
// ==========================================
app.post("/api/create-voltz-order", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { competitionId, quantity = 1 } = req.body;

    const competition = await storage.getCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    const voltzCostPerGame = parseFloat(competition.ticketPrice);
    
    // Calculate discount
    const { originalTotal, discountPercent, discountedTotal, savings } = 
      calculateDiscountedTotal(voltzCostPerGame, quantity);

    const user = await storage.getUser(userId);
    const userBalance = parseFloat(user?.balance || "0");
    const userPoints = user?.ringtonePoints || 0;
    const pointsValue = userPoints * 0.01;

    const order = await storage.createOrder({
      userId,
      competitionId,
      quantity,
      totalAmount: discountedTotal.toString(),
      paymentMethod: "pending",
      status: "pending",
    });

    res.json({
      success: true,
      orderId: order.id,
      competitionId: competitionId,
      totalAmount: discountedTotal,
      originalAmount: originalTotal,
      discountPercent,
      savings,
      quantity,
      userBalance: {
        wallet: userBalance,
        ringtonePoints: userPoints,
        pointsValue,
      },
      voltzCost: voltzCostPerGame,
      competition: {
        title: competition.title,
        type: competition.type,
      },
    });
  } catch (error) {
    console.error("Error creating voltz order:", error);
    res.status(500).json({ message: "Failed to create voltz order" });
  }
});


  app.post("/api/process-scratch-payment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId, useWalletBalance = false, useRingtonePoints = false ,  useInstaplay = false} = req.body;
  
      // Fetch order from database
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      if (order.status !== "pending") {
        return res.status(400).json({ message: "Order already processed" });
      }
  
      // Get competition
      const [competition] = await db.select().from(competitions).where(eq(competitions.id, order.competitionId));
      
      if (!competition || competition.type !== "scratch") {
        return res.status(400).json({ message: "Invalid competition type" });
      }
  
      // Get user
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      // Handle Instaplay - direct card payment without wallet
    if (useInstaplay) {
      const totalAmount = Number(order.totalAmount);
      
      // Create Cashflows session for instant play
      const session = await cashflows.createCompetitionPaymentSession(
        totalAmount,
        {
          orderId,
          competitionId: order.competitionId,
          userId,
          quantity: order.quantity.toString(),
          paymentType: 'instant_play', // Mark as instant play
          gameType: 'scratch'
        }
      );

      if (!session.hostedPageUrl) {
        return res.status(500).json({ message: "Failed to create payment session" });
      }

      // Create pending payment record for instant play
      await db.insert(pendingPayments).values({
        userId,
        orderId: order.id,
        paymentJobReference: session.paymentJobReference,
        paymentType: 'instant_play',
        amount: totalAmount.toString(),
        metadata: {
          competitionId: competition.id,
          competitionTitle: competition.title,
          gameType: 'scratch',
          quantity: order.quantity
        },
        status: 'pending',
        createdAt: new Date()
      });

      // Update order with payment info
      await db.update(orders)
        .set({ 
          paymentMethod: "instaplay",
          cashflowsAmount: totalAmount.toString(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

      return res.json({
        success: true,
        redirectUrl: session.hostedPageUrl,
        sessionId: session.paymentJobReference,
        paymentType: 'instaplay',
        message: "Redirecting to payment..."
      });
    }
  
      // Total already includes discount if applied (handled by apply-discount endpoint)
      const totalAmount = Number(order.totalAmount);
      let remainingAmount = totalAmount;
      let walletUsed = 0;
      let pointsUsed = 0;
      let cashflowsUsed = 0;
  
      const paymentBreakdown = [];
  
      // Process wallet balance if selected
      if (useWalletBalance) {
        const walletBalance = Number(user?.balance) || 0;
        const walletAmount = Math.min(walletBalance, remainingAmount);
  
        if (walletAmount > 0) {
          const newBalance = walletBalance - walletAmount;
          
          // Update user balance
          await db.update(users)
            .set({ balance: newBalance.toString() })
            .where(eq(users.id, userId));
  
          // Create transaction
          await db.insert(transactions).values({
            userId,
            type: "purchase",
            amount: `-${walletAmount.toFixed(2)}`,
            description: `Wallet payment for ${order.quantity} scratch card(s) - ${competition.title}`,
            orderId,
            createdAt: new Date(),
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
  
      // Process ringtone points if selected - SIMPLE, NO DISCOUNT LOGIC
      if (useRingtonePoints && remainingAmount > 0) {
        const availablePoints = user?.ringtonePoints || 0;
        
        // Calculate points needed for remaining amount (100 points = £1.00)
        const pointsNeeded = Math.ceil(remainingAmount * 100);
        
        // Check if user has enough points
        if (availablePoints < pointsNeeded) {
          // Refund wallet if used
          if (walletUsed > 0) {
            const currentBalance = Number(user?.balance) || 0;
            await db.update(users)
              .set({ balance: (currentBalance + walletUsed).toString() })
              .where(eq(users.id, userId));
          }
          
          return res.status(400).json({ 
            message: `Insufficient points. You need ${pointsNeeded} points. You have ${availablePoints} points.`,
            remainingAmount,
            pointsNeeded
          });
        }
        
        // Calculate cash value of points used
        const pointsAmount = pointsNeeded * 0.01;
        
        // Update user points
        const newPoints = availablePoints - pointsNeeded;
        await db.update(users)
          .set({ ringtonePoints: newPoints })
          .where(eq(users.id, userId));
  
        // Create transaction
        await db.insert(transactions).values({
          userId,
          type: "ringtone_points",
          amount: `-${pointsNeeded}`,
          description: `Ringtone points payment for ${order.quantity} scratch card(s) - ${competition.title}`,
          orderId,
          createdAt: new Date(),
        });
  
        pointsUsed = pointsNeeded;
        remainingAmount -= pointsAmount;
        
        paymentBreakdown.push({
          method: "ringtone_points",
          amount: pointsAmount,
          pointsUsed: pointsNeeded,
          description: `Ringtone Points: £${pointsAmount.toFixed(2)} (${pointsNeeded} points)`,
        });
      }
  
      // Process remaining amount through Cashflows
      if (remainingAmount > 0) {
        cashflowsUsed = remainingAmount;
  
        const session = await cashflows.createCompetitionPaymentSession(
          remainingAmount,
          {
            orderId,
            competitionId: order.competitionId,
            userId,
            quantity: order.quantity.toString(),
            paymentBreakdown: JSON.stringify(paymentBreakdown),
          }
        );
  
        if (!session.hostedPageUrl) {
          // Refund wallet and points if Cashflows fails
          if (walletUsed > 0) {
            const currentBalance = Number(user?.balance) || 0;
            await db.update(users)
              .set({ balance: (currentBalance + walletUsed).toString() })
              .where(eq(users.id, userId));
          }
          if (pointsUsed > 0) {
            const currentPoints = user?.ringtonePoints || 0;
            await db.update(users)
              .set({ ringtonePoints: currentPoints + pointsUsed })
              .where(eq(users.id, userId));
          }
  
          return res.status(500).json({ message: "Failed to create Cashflows session" });
        }
  
        // Determine payment method text for mixed payment
        let paymentMethodText = "Discount";
        if (walletUsed > 0 && pointsUsed > 0 && remainingAmount > 0) {
          paymentMethodText = "Wallet+Points+Cashflow";
        } else if (walletUsed > 0 && remainingAmount > 0) {
          paymentMethodText = "Wallet+Cashflow";
        } else if (pointsUsed > 0 && remainingAmount > 0) {
          paymentMethodText = "Points+Cashflow";
        }
  
        // Update order with payment info
        await db.update(orders)
          .set({ 
            status: "processing",
            paymentMethod: paymentMethodText,
            walletAmount: walletUsed.toString(),
            pointsAmount: pointsUsed.toString(),
            cashflowsAmount: cashflowsUsed.toString(),
            paymentBreakdown: JSON.stringify(paymentBreakdown),
            updatedAt: new Date()
          })
          .where(eq(orders.id, orderId));
  
        return res.json({
          success: true,
          redirectUrl: session.hostedPageUrl,
          sessionId: session.paymentJobReference,
          paymentBreakdown: {
            walletUsed,
            pointsUsed,
            cashflowsUsed,
            remainingAmount,
          },
          remainingAmount,
        });
      } else {
        // Full payment completed with wallet/points only
        let paymentMethodText = "Discount";
        if (walletUsed > 0 && pointsUsed > 0) {
          paymentMethodText = "Wallet+Points";
        } else if (walletUsed > 0) {
          paymentMethodText = "Wallet Credit";
        } else if (pointsUsed > 0) {
          paymentMethodText = "Points";
        }
  
        // Update order with payment info and mark as completed
        await db.update(orders)
          .set({ 
            status: "completed",
            paymentMethod: paymentMethodText,
            walletAmount: walletUsed.toString(),
            pointsAmount: pointsUsed.toString(),
            cashflowsAmount: "0",
            paymentBreakdown: JSON.stringify(paymentBreakdown),
            updatedAt: new Date()
          })
          .where(eq(orders.id, orderId));
  
        // Create scratch card entries
        const scratchTickets = []; // <-- renamed from tickets
          for (let i = 0; i < order.quantity; i++) {
            const ticketNumber = `SCRATCH-${nanoid(8).toUpperCase()}`;
            const [ticket] = await db.insert(tickets).values({ // <-- tickets table
              userId,
              competitionId: order.competitionId,
              orderId: order.id,
              ticketNumber,
              isWinner: false,
              createdAt: new Date(),
            }).returning();
            scratchTickets.push(ticket);
          }
  
        // Update competition sold tickets count
        await db.update(competitions)
          .set({ 
            soldTickets: (competition.soldTickets || 0) + order.quantity,
            updatedAt: new Date()
          })
          .where(eq(competitions.id, competition.id));
  
        // Get discount info for audit log
        let discountInfo = '';
        if (order.discountCodeId) {
          const [discount] = await db.select().from(discountCodes).where(eq(discountCodes.id, order.discountCodeId));
          if (discount) {
            discountInfo = ` with discount code ${discount.code} (${discount.type === 'cash' ? `£${discount.value} off` : `${discount.value} points`})`;
          }
        }
  
        // Audit log
        const startBalance = Number(user.balance) + totalAmount;
        const endBalance = Number(user.balance);
  
        await db.insert(auditLogs).values({
          userId,
          userName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          action: "buy_scratch",
          competitionId: competition.id,
          description: `Bought ${order.quantity} scratch card(s) for ${competition.title}${discountInfo}`,
          startBalance,
          endBalance,
          createdAt: new Date(),
        });
  
        // Send confirmation email
        if (user?.email) {
          const ticketNumbers = scratchTickets.map((t) => t.ticketNumber);
          
          sendOrderConfirmationEmail(user.email, {
            orderId: order.id,
            userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer",
            orderType: "scratch",
            itemName: competition.title,
            quantity: order.quantity,
            totalAmount: order.totalAmount,
            orderDate: new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            paymentMethod: paymentMethodText,
            skillQuestion: competition.skillQuestion || undefined,
            skillAnswer: order.skillAnswer || undefined,
            ticketNumbers: ticketNumbers.length > 0 ? ticketNumbers : undefined,
          }).catch((err) =>
            console.error("Failed to send order confirmation email:", err)
          );
        }
  
        return res.json({
          success: true,
          competitionId: order.competitionId,
          message: "Scratch card purchase completed",
          orderId: order.id,
          tickets: scratchTickets.map((t) => ({ ticketNumber: t.ticketNumber })),
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

 app.post(
  "/api/play-scratch-carddd",
  isAuthenticated,
  async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId, competitionId } = req.body;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order ID is required",
        });
      }

      if (!competitionId) {
        return res.status(400).json({
          success: false,
          message: "Competition ID is required",
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
            .for("update");

          if (!allPrizes || allPrizes.length === 0) {
            throw new Error("No prizes configured");
          }

          // Filter prizes that haven't reached maxWins
          const eligiblePrizes = allPrizes.filter((prize) => {
            if (!prize.weight || prize.weight <= 0) return false;
            if (prize.maxWins !== null && prize.quantityWon >= prize.maxWins)
              return false;
            return true;
          });

          if (eligiblePrizes.length === 0) {
            throw new Error("No prizes available");
          }

          // Weighted random selection
          const totalWeight = eligiblePrizes.reduce(
            (sum, prize) => sum + prize.weight,
            0
          );
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
            usedAt: new Date(),
          });

          // ✅ Only update win count and record win for ACTUAL prizes (not try_again or lose)
          if (
            selectedPrize.rewardType !== "try_again" &&
            selectedPrize.rewardType !== "lose"
          ) {
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

      // Get maxWins from selected prize
      const maxWins = selectedPrize.maxWins !== undefined && 
                      selectedPrize.maxWins !== null && 
                      selectedPrize.maxWins !== "" 
                        ? Number(selectedPrize.maxWins) 
                        : null;

      // 🎯 Award prize based on type (outside transaction for non-critical updates)
      if (selectedPrize.rewardType === "cash" && selectedPrize.rewardValue) {
        const amount =
          typeof selectedPrize.rewardValue === "number"
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
          competitionId,
          prizeDescription: "Scratch Card Prize",
          prizeValue: `£${amount}`,
          imageUrl: null,
          isShowcase: false,
        });

        prizeResponse = { type: "cash", value: amount.toFixed(2) };

        // 🚀 AUTO-SYNC PRIZE TO PRIZE TABLE
        await syncScratchPrize(
          competitionId,
          selectedPrize.id,
          selectedPrize.label || "Scratch Prize",
          amount,
          'cash',     // ✅ ADD rewardType
          maxWins     // ✅ ADD maxWins
        );

      } else if (
        selectedPrize.rewardType === "points" &&
        selectedPrize.rewardValue
      ) {
        const points =
          typeof selectedPrize.rewardValue === "number"
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
          type: "ringtone_points",
          amount: points.toString(),
          description: `Scratch Card Prize - ${points} Ringtones`,
        });

        await storage.createWinner({
          userId,
          competitionId,
          prizeDescription: "Scratch Card Prize",
          prizeValue: `${points} Ringtones`,
          imageUrl: null,
          isShowcase: false,
        });

        prizeResponse = { type: "points", value: points.toString() };

        // 🚀 AUTO-SYNC PRIZE TO PRIZE TABLE
        await syncScratchPrize(
          competitionId,
          selectedPrize.id,
          selectedPrize.label || "Scratch Prize",
          points,
          'points',   // ✅ ADD rewardType
          maxWins     // ✅ ADD maxWins
        );

      } else if (selectedPrize.rewardType === "physical") {
        // Physical prize - just record the win
        await storage.createWinner({
          userId,
          competitionId,
          prizeDescription: `Scratch Card Prize - ${selectedPrize.label}`,
          prizeValue: selectedPrize.label,
          imageUrl: null,
          isShowcase: false,
        });

        prizeResponse = { type: "physical", value: selectedPrize.label };

        // 🚀 AUTO-SYNC PHYSICAL PRIZE TO PRIZE TABLE
        await syncScratchPrize(
          competitionId,
          selectedPrize.id,
          selectedPrize.label || "Physical Prize",
          0,           // Physical prizes have no monetary value
          'physical',  // ✅ ADD rewardType
          maxWins      // ✅ ADD maxWins
        );
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
  }
);


app.post(
  "/api/reveal-all-scratch-cards",
  isAuthenticated,
  async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId, count, competitionId } = req.body;

      if (!orderId || !count || count <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid orderId and count are required",
        });
      }

      if (!competitionId) {
        return res.status(400).json({
          success: false,
          message: "Competition ID is required",
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
      const cardsUsed = await storage.getScratchCardsUsed(orderId);
      const cardsRemaining = order.quantity - cardsUsed;

      if (cardsRemaining <= 0) {
        return res.status(400).json({
          success: false,
          message: "No scratch cards remaining in this purchase",
        });
      }

      // Actual cards to process
      const cardsToProcess = Math.min(count, cardsRemaining);

      if (cardsToProcess <= 0) {
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

      // STEP 1: ATOMIC TRANSACTION - Only for prize selection and scratch card usage
      let selectedPrizes: any[] = [];
      
      try {
        await db.transaction(async (tx) => {
          // Fetch all active prizes with lock
          const allPrizes = await tx
            .select()
            .from(scratchCardImages)
            .where(eq(scratchCardImages.isActive, true))
            .for("update");

          if (!allPrizes || allPrizes.length === 0) {
            throw new Error("No prizes configured");
          }

          // Track win counts during this batch
          const prizeWinCounts = new Map<string, number>();
          allPrizes.forEach((prize) => {
            prizeWinCounts.set(prize.id, prize.quantityWon || 0);
          });

          // Pre-select all prizes using weighted random selection
          selectedPrizes = [];
          for (let i = 0; i < cardsToProcess; i++) {
            const eligiblePrizes = allPrizes.filter((prize) => {
              if (!prize.weight || prize.weight <= 0) return false;
              const currentWins = prizeWinCounts.get(prize.id) || 0;
              if (prize.maxWins !== null && currentWins >= prize.maxWins)
                return false;
              return true;
            });

            if (eligiblePrizes.length === 0) {
              selectedPrizes.push(null);
              continue;
            }

            // Weighted random selection
            const totalWeight = eligiblePrizes.reduce(
              (sum, prize) => sum + prize.weight,
              0
            );
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
            if (selectedPrize && selectedPrize.rewardType !== "try_again") {
              prizeWinCounts.set(
                selectedPrize.id,
                (prizeWinCounts.get(selectedPrize.id) || 0) + 1
              );
            }
          }

          // Batch insert all scratch card usages
          const usageValues = selectedPrizes.map(() => ({
            orderId,
            userId,
            usedAt: new Date(),
          }));
          
          if (usageValues.length > 0) {
            await tx.insert(scratchCardUsage).values(usageValues);
          }

          // Update prize win counts
          const prizeUpdates = new Map<string, number>();
          
          for (const prize of selectedPrizes) {
            if (!prize || prize.rewardType === "try_again") continue;
            prizeUpdates.set(
              prize.id,
              (prizeUpdates.get(prize.id) || 0) + 1
            );
          }

          // Update all prize win counts in batch
          for (const [prizeId, increment] of prizeUpdates.entries()) {
            await tx
              .update(scratchCardImages)
              .set({ 
                quantityWon: sql`${scratchCardImages.quantityWon} + ${increment}` 
              })
              .where(eq(scratchCardImages.id, prizeId));
          }

          // Record wins in scratchCardWins table
          const winRecords = [];
          for (const prize of selectedPrizes) {
            if (!prize || prize.rewardType === "try_again") continue;
            
            winRecords.push({
              userId,
              prizeId: prize.id,
              rewardType: prize.rewardType,
              rewardValue: String(prize.rewardValue || '0'),
            });
          }

          if (winRecords.length > 0) {
            await tx.insert(scratchCardWins).values(winRecords);
          }
        });
      } catch (error: any) {
        console.error("Transaction error in reveal-all:", error);
        return res.status(400).json({
          success: false,
          message: error.message || "Failed to process scratch cards",
        });
      }

      // STEP 2: PROCESS REWARDS (Outside transaction - matching single card pattern)
      const results: Array<{ prize: { type: string; value: string } }> = [];
      let totalCash = 0;
      let totalPoints = 0;
      let currentBalance = parseFloat(user.balance || "0");
      let currentPoints = user.ringtonePoints || 0;

      for (const selectedPrize of selectedPrizes) {
        let prizeResponse = { type: "none", value: "0" };

        if (!selectedPrize) {
          results.push({ prize: prizeResponse });
          continue;
        }

        const maxWins = selectedPrize.maxWins !== undefined && 
                        selectedPrize.maxWins !== null && 
                        selectedPrize.maxWins !== "" 
                          ? Number(selectedPrize.maxWins) 
                          : null;

        if (selectedPrize.rewardType === "cash" && selectedPrize.rewardValue) {
          const amount = parseFloat(String(selectedPrize.rewardValue));
          
          if (!isNaN(amount) && amount > 0) {
            totalCash += amount;
            currentBalance += amount;

            // Update user balance using storage (matching single card pattern)
            await storage.updateUserBalance(userId, currentBalance.toFixed(2));

            await storage.createTransaction({
              userId,
              type: "prize",
              amount: amount.toFixed(2),
              description: `Scratch Card Prize - £${amount}`,
            });

            await storage.createWinner({
              userId,
              competitionId,
              prizeDescription: "Scratch Card Prize",
              prizeValue: `£${amount}`,
              imageUrl: null,
              isShowcase: false,
            });

            prizeResponse = { type: "cash", value: amount.toFixed(2) };

            // Sync prize
            try {
              await syncScratchPrize(
                competitionId,
                selectedPrize.id,
                selectedPrize.label || "Scratch Prize",
                amount,
                'cash',
                maxWins
              );
            } catch (err) {
              console.error(`Failed to sync cash prize:`, err);
            }
          }

        } else if (selectedPrize.rewardType === "points" && selectedPrize.rewardValue) {
          const points = parseInt(String(selectedPrize.rewardValue));
          
          if (!isNaN(points) && points > 0) {
            totalPoints += points;
            currentPoints += points;

            await storage.updateUserRingtonePoints(userId, currentPoints);

            await storage.createTransaction({
              userId,
              type: "ringtone_points",
              amount: points.toString(),
              description: `Scratch Card Prize - ${points} Ringtones`,
            });

            await storage.createWinner({
              userId,
              competitionId,
              prizeDescription: "Scratch Card Prize",
              prizeValue: `${points} Ringtones`,
              imageUrl: null,
              isShowcase: false,
            });

            prizeResponse = { type: "points", value: points.toString() };

            try {
              await syncScratchPrize(
                competitionId,
                selectedPrize.id,
                selectedPrize.label || "Scratch Prize",
                points,
                'points',
                maxWins
              );
            } catch (err) {
              console.error(`Failed to sync points prize:`, err);
            }
          }

        } else if (selectedPrize.rewardType === "physical") {
          await storage.createWinner({
            userId,
            competitionId,
            prizeDescription: `Scratch Card Prize - ${selectedPrize.imageName || selectedPrize.label}`,
            prizeValue: selectedPrize.imageName || selectedPrize.label,
            imageUrl: null,
            isShowcase: false,
          });

          prizeResponse = {
            type: "physical",
            value: selectedPrize.imageName || selectedPrize.label,
          };

          try {
            await syncScratchPrize(
              competitionId,
              selectedPrize.id,
              selectedPrize.label || "Physical Prize",
              0,
              'physical',
              maxWins
            );
          } catch (err) {
            console.error(`Failed to sync physical prize:`, err);
          }
        }

        results.push({ prize: prizeResponse });
      }

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
      res.status(500).json({ 
        success: false,
        message: "Failed to reveal all scratch cards" 
      });
    }
  }
);

  app.post(
    "/api/scratch-session/start",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { orderId } = req.body;

        if (!orderId) {
          return res
            .status(400)
            .json({ success: false, message: "Order ID is required" });
        }

        // Verify valid completed order
        const order = await storage.getOrder(orderId);
        if (!order || order.userId !== userId || order.status !== "completed") {
          return res
            .status(400)
            .json({
              success: false,
              message: "No valid scratch card purchase found",
            });
        }

        // Check cards remaining
        const used = await storage.getScratchCardsUsed(orderId);
        const remaining = order.quantity - used;
        if (remaining <= 0) {
          return res
            .status(400)
            .json({
              success: false,
              message: "No scratch cards remaining in this purchase",
            });
        }

        // Get user
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

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

            if (!allPrizes || allPrizes.length === 0)
              throw new Error("No prizes configured");

            // Filter prizes that haven't reached maxWins
            const eligiblePrizes = allPrizes.filter((prize) => {
              if (!prize.weight || prize.weight <= 0) return false;
              if (prize.maxWins !== null && prize.quantityWon >= prize.maxWins)
                return false;
              return true;
            });

            if (eligiblePrizes.length === 0)
              throw new Error("No prizes available");

            // Weighted random selection
            const totalWeight = eligiblePrizes.reduce(
              (sum, prize) => sum + prize.weight,
              0
            );
            if (totalWeight <= 0) throw new Error("Invalid prize weights");

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

          // Determine winner strictly based on prize type
          const isWinner = ["cash", "points", "physical"].includes(
            selectedPrize.rewardType
          );

          // Define 2x3 winning patterns
          const winningPatterns = [
            [0, 1, 2],
            [3, 4, 5],
            [0, 2, 4],
            [1, 3, 5],
          ];

          // Get active images for tile layout
          const activePrizes = await db
            .select()
            .from(scratchCardImages)
            .where(eq(scratchCardImages.isActive, true));
          const activeImages = activePrizes
            .filter(
              (p) =>
                p.imageName &&
                p.imageName.trim() !== "" &&
                p.weight &&
                p.weight > 0
            )
            .map((p) => p.imageName as string);

          if (activeImages.length < 3)
            throw new Error("Not enough active images - need at least 3");

          if (isWinner && selectedPrize.imageName) {
            // ✅ WINNER: exactly 3 matching images
            const winningImage = selectedPrize.imageName;

            if (!activeImages.includes(winningImage)) {
              throw new Error(
                `Winning image "${winningImage}" is not active or has weight = 0`
              );
            }

            const winPositions =
              winningPatterns[
                Math.floor(Math.random() * winningPatterns.length)
              ];
            tileLayout = Array(6).fill("");

            winPositions.forEach((pos) => (tileLayout[pos] = winningImage));

            const otherImages = activeImages.filter(
              (img) => img !== winningImage
            );
            const shuffledOthers = [...otherImages].sort(
              () => Math.random() - 0.5
            );

            let nonWinIndex = 0;
            for (let i = 0; i < 6; i++) {
              if (tileLayout[i] === "") {
                tileLayout[i] =
                  shuffledOthers[nonWinIndex % shuffledOthers.length];
                nonWinIndex++;
              }
            }
          } else {
            // 🔴 LOSER: ensure NO winning pattern exists
            let tilesOk = false;
            let attempt = 0;

            while (!tilesOk && attempt < 20) {
              const shuffled = [...activeImages].sort(
                () => Math.random() - 0.5
              );
              tileLayout = shuffled.slice(0, 6);
              tilesOk = !winningPatterns.some((pattern) => {
                const [a, b, c] = pattern;
                return (
                  tileLayout[a] === tileLayout[b] &&
                  tileLayout[b] === tileLayout[c]
                );
              });
              attempt++;
            }

            if (!tilesOk) {
              // Safety fallback
              tileLayout = activeImages
                .slice(0, 3)
                .flatMap((img) => [img, img])
                .slice(0, 6);
            }
          }

          const sessionId = nanoid();

          // Prepare prize response
          let prizeInfo: any = {
            type: "none",
            value: "0",
            label: selectedPrize.label || "Try Again",
          };
          if (isWinner) {
            if (selectedPrize.rewardType === "cash") {
              prizeInfo = {
                type: "cash",
                value: parseFloat(String(selectedPrize.rewardValue)).toFixed(2),
                label: selectedPrize.label,
              };
            } else if (selectedPrize.rewardType === "points") {
              prizeInfo = {
                type: "points",
                value: String(selectedPrize.rewardValue),
                label: selectedPrize.label,
              };
            } else if (selectedPrize.rewardType === "physical") {
              prizeInfo = {
                type: "physical",
                value: selectedPrize.label,
                label: selectedPrize.label,
              };
            }
          }

          res.json({
            success: true,
            sessionId,
            isWinner,
            prize: prizeInfo,
            tileLayout,
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
    }
  );

  // Step 2: Complete scratch session - record usage and award prize
  app.post(
    "/api/scratch-session/:sessionId/complete",
    isAuthenticated,
    async (req: any, res) => {
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
            usedAt: new Date(),
          });

          // Award prize if winner
          if (
            isWinner &&
            selectedPrize.rewardType !== "try_again" &&
            selectedPrize.rewardType !== "lose"
          ) {
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
              wonAt: new Date(),
            });

            // Award cash prize
            if (
              selectedPrize.rewardType === "cash" &&
              selectedPrize.rewardValue
            ) {
              const amount = parseFloat(String(selectedPrize.rewardValue));
              const finalBalance = parseFloat(user.balance || "0") + amount;

              // Update balance using transaction context
              await tx
                .update(users)
                .set({
                  balance: finalBalance.toFixed(2),
                  updatedAt: new Date(),
                })
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
            else if (
              selectedPrize.rewardType === "points" &&
              selectedPrize.rewardValue
            ) {
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
            else if (selectedPrize.rewardType === "physical") {
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

              prizeResponse = {
                type: "physical",
                value: selectedPrize.imageName,
              };
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
    }
  );

  app.get(
    "/api/scratch-order/:orderId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { orderId } = req.params;

        const order = await storage.getOrder(orderId);
        if (!order || order.userId !== userId) {
          return res.status(404).json({ message: "Order not found" });
        }

        const user = await storage.getUser(userId);
        const used = await storage.getScratchCardsUsed(orderId);
        const remaining = order.quantity - used;
        res.json({
          order: {
            id: order.id,
            competitionId: order.competitionId,
            quantity: order.quantity,
            totalAmount: order.totalAmount,
            status: order.status,
            remainingPlays: remaining,
            used: used,
            discountAmount: order.discountAmount || 0,
    discountType: order.discountType || null,
    percentageDiscount: order.percentageDiscount || 0, 

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
    }
  );

  // Get Pop order details for billing and game page
  app.get("/api/pop-order/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;

      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }

      const user = await storage.getUser(userId);
      const competition = await storage.getCompetition(order.competitionId);
      const popCost = parseFloat(competition?.ticketPrice || "2");

      // Get usage for game page
      const used = await storage.getPopGamesUsed(orderId);
      const remaining = order.quantity - used;
      const history = await storage.getPopGameHistory(orderId);

      res.json({
        order: {
          id: order.id,
          competitionId: order.competitionId,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          status: order.status,
          discountAmount: order.discountAmount || 0,
    discountType: order.discountType || null,
    percentageDiscount: order.percentageDiscount || 0, 

        },
        user: {
          balance: user?.balance || "0",
          ringtonePoints: user?.ringtonePoints || 0,
        },
        competition: competition,
        popCost: popCost,
        playsRemaining: remaining,
        history: history,
      });
    } catch (error) {
      console.error("Error fetching pop order:", error);
      res.status(500).json({ message: "Failed to fetch pop order" });
    }
  });

  // Process Pop Game payment
  app.post("/api/process-pop-payment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId, useWalletBalance = false, useRingtonePoints = false, useInstaplay = false } = req.body;
  
      // Fetch order from database
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      if (order.status !== "pending") {
        return res.status(400).json({ message: "Order already processed" });
      }
  
      // Get competition
      const [competition] = await db.select().from(competitions).where(eq(competitions.id, order.competitionId));
      
      if (!competition || competition.type !== "pop") {
        return res.status(400).json({ message: "Invalid competition type" });
      }
  
      // Get user
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      // Handle Instaplay - direct card payment without wallet
    if (useInstaplay) {
      const totalAmount = Number(order.totalAmount);
      
      // Create Cashflows session for instant play
      const session = await cashflows.createCompetitionPaymentSession(
        totalAmount,
        {
          orderId,
          competitionId: order.competitionId,
          userId,
          quantity: order.quantity.toString(),
          paymentType: 'instant_play', // Mark as instant play
          gameType: 'pop'
        }
      );

      if (!session.hostedPageUrl) {
        return res.status(500).json({ message: "Failed to create payment session" });
      }

      // Create pending payment record for instant play
      await db.insert(pendingPayments).values({
        userId,
        orderId: order.id,
        paymentJobReference: session.paymentJobReference,
        paymentType: 'instant_play',
        amount: totalAmount.toString(),
        metadata: {
          competitionId: competition.id,
          competitionTitle: competition.title,
          gameType: 'pop',
          quantity: order.quantity
        },
        status: 'pending',
        createdAt: new Date()
      });

      // Update order with payment info
      await db.update(orders)
        .set({ 
          paymentMethod: "instaplay",
          cashflowsAmount: totalAmount.toString(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

      return res.json({
        success: true,
        redirectUrl: session.hostedPageUrl,
        sessionId: session.paymentJobReference,
        paymentType: 'instaplay',
        message: "Redirecting to payment..."
      });
    }
  
      // Total already includes discount if applied
      const totalAmount = Number(order.totalAmount);
      let remainingAmount = totalAmount;
      let walletUsed = 0;
      let pointsUsed = 0;
  
      const paymentBreakdown = [];
  
      // Process wallet balance if selected
      if (useWalletBalance) {
        const walletBalance = Number(user?.balance) || 0;
        const walletAmount = Math.min(walletBalance, remainingAmount);
  
        if (walletAmount > 0) {
          walletUsed = walletAmount;
          remainingAmount -= walletUsed;
          
          paymentBreakdown.push({ 
            method: "wallet", 
            amount: walletUsed,
            description: `Wallet: £${walletUsed.toFixed(2)}`
          });
        }
      }
  
      // Process ringtone points if selected - SIMPLE, NO DISCOUNT LOGIC
      if (useRingtonePoints && remainingAmount > 0) {
        const availablePoints = user?.ringtonePoints || 0;
        
        // Calculate points needed for remaining amount (100 points = £1.00)
        const pointsNeeded = Math.ceil(remainingAmount * 100);
        
        // Check if user has enough points
        if (availablePoints < pointsNeeded) {
          // Refund wallet if used
          if (walletUsed > 0) {
            const currentBalance = Number(user?.balance) || 0;
            await db.update(users)
              .set({ balance: (currentBalance + walletUsed).toString() })
              .where(eq(users.id, userId));
          }
          
          return res.status(400).json({ 
            message: `Insufficient points. You need ${pointsNeeded} points. You have ${availablePoints} points.`,
            remainingAmount,
            pointsNeeded
          });
        }
        
        // Calculate cash value of points used
        const pointsAmount = pointsNeeded * 0.01;
        
        pointsUsed = pointsNeeded;
        remainingAmount -= pointsAmount;
        
        if (pointsUsed > 0) {
          paymentBreakdown.push({
            method: "ringtone_points",
            amount: pointsAmount,
            pointsUsed: pointsNeeded,
            description: `Ringtone Points: £${pointsAmount.toFixed(2)} (${pointsNeeded} points)`,
          });
        }
      }
  
      // If remaining, need Cashflows
      if (remainingAmount > 0.01) {
        return res.json({
          success: false,
          message: "Card payment required for remaining balance",
          remainingAmount,
          requiresCashflows: true,
        });
      }
  
      // Complete payment with wallet/points only
      if (walletUsed > 0) {
        const newBalance = Number(user?.balance || "0") - walletUsed;
        await db.update(users)
          .set({ balance: newBalance.toString() })
          .where(eq(users.id, userId));
      }
  
      if (pointsUsed > 0) {
        const newPoints = (user?.ringtonePoints || 0) - pointsUsed;
        await db.update(users)
          .set({ ringtonePoints: newPoints })
          .where(eq(users.id, userId));
      }
  
      // Update order status and payment info
      let paymentMethodText = "Discount";
      if (walletUsed > 0 && pointsUsed > 0) {
        paymentMethodText = "Wallet+Points";
      } else if (walletUsed > 0) {
        paymentMethodText = "Wallet";
      } else if (pointsUsed > 0) {
        paymentMethodText = "Points";
      }
      
      await db.update(orders)
        .set({ 
          status: "completed",
          paymentMethod: paymentMethodText,
          walletAmount: walletUsed.toString(),
          pointsAmount: pointsUsed.toString(),
          cashflowsAmount: "0",
          paymentBreakdown: JSON.stringify(paymentBreakdown),
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));
  
      // Update competition sold tickets count
      await db.update(competitions)
        .set({ 
          soldTickets: (competition.soldTickets || 0) + order.quantity,
          updatedAt: new Date()
        })
        .where(eq(competitions.id, competition.id));
  
      // Create transaction record
      await db.insert(transactions).values({
        userId,
        type: "pop_purchase",
        amount: totalAmount.toFixed(2),
        description: `Pop Game Purchase - ${order.quantity} games`,
        orderId: orderId,
        createdAt: new Date(),
      });
  
      // Create tickets for pop game entries
      const popTickets = [];
      for (let i = 0; i < order.quantity; i++) {
        const ticketNumber = `POP-${orderId.slice(0, 8).toUpperCase()}-${(i + 1).toString().padStart(3, "0")}`;
        const [ticket] = await db.insert(tickets).values({
          userId,
          competitionId: order.competitionId,
          orderId: order.id,
          ticketNumber,
          isWinner: false,
          createdAt: new Date(),
        }).returning();
        popTickets.push(ticket);
      }
  
      // Send confirmation email
      if (user?.email) {
        const ticketNumbers = popTickets.map((t) => t.ticketNumber);
        
        sendOrderConfirmationEmail(user.email, {
          orderId: order.id,
          userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer",
          orderType: "pop",
          itemName: competition.title,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          orderDate: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          paymentMethod: paymentMethodText,
          ticketNumbers: ticketNumbers.length > 0 ? ticketNumbers : undefined,
        }).catch((err) =>
          console.error("Failed to send POP confirmation email:", err)
        );
      }
  
      res.json({
        success: true,
        message: "Pop game purchase complete!",
        competitionId: order.competitionId,
        orderId: order.id,
        quantity: order.quantity,
        paymentBreakdown,
      });
    } catch (error) {
      console.error("Error processing pop payment:", error);
      res.status(500).json({ message: "Failed to process pop payment" });
    }
  });

 // Process Voltz payment
  app.post("/api/process-voltz-payment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId, useWalletBalance = false, useRingtonePoints = false, useInstaplay = false } = req.body;

      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (order.status !== "pending") {
        return res.status(400).json({ message: "Order already processed" });
      }

      const [competition] = await db.select().from(competitions).where(eq(competitions.id, order.competitionId));
      if (!competition || competition.type !== "voltz") {
        return res.status(400).json({ message: "Invalid competition type" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (useInstaplay) {
        const totalAmount = Number(order.totalAmount);
        const session = await cashflows.createCompetitionPaymentSession(
          totalAmount,
          { orderId, competitionId: order.competitionId, userId, quantity: order.quantity.toString(), paymentType: 'instant_play', gameType: 'voltz' }
        );
        if (!session.hostedPageUrl) {
          return res.status(500).json({ message: "Failed to create payment session" });
        }
        await db.insert(pendingPayments).values({
          userId, orderId: order.id, paymentJobReference: session.paymentJobReference,
          paymentType: 'instant_play', amount: totalAmount.toString(),
          metadata: { competitionId: competition.id, competitionTitle: competition.title, gameType: 'voltz', quantity: order.quantity },
          status: 'pending', createdAt: new Date()
        });
        await db.update(orders).set({ paymentMethod: "instaplay", cashflowsAmount: totalAmount.toString(), updatedAt: new Date() }).where(eq(orders.id, orderId));
        return res.json({ success: true, redirectUrl: session.hostedPageUrl, sessionId: session.paymentJobReference, paymentType: 'instaplay', message: "Redirecting to payment..." });
      }

      const totalAmount = Number(order.totalAmount);
      let remainingAmount = totalAmount;
      let walletUsed = 0;
      let pointsUsed = 0;
      const paymentBreakdown: any[] = [];

      if (useWalletBalance) {
        const walletBalance = Number(user?.balance) || 0;
        const walletAmount = Math.min(walletBalance, remainingAmount);
        if (walletAmount > 0) {
          walletUsed = walletAmount;
          remainingAmount -= walletUsed;
          paymentBreakdown.push({ method: "wallet", amount: walletUsed, description: `Wallet: £${walletUsed.toFixed(2)}` });
        }
      }

      if (useRingtonePoints && remainingAmount > 0) {
        const availablePoints = user?.ringtonePoints || 0;
        const pointsNeeded = Math.ceil(remainingAmount * 100);
        if (availablePoints < pointsNeeded) {
          if (walletUsed > 0) {
            const currentBalance = Number(user?.balance) || 0;
            await db.update(users).set({ balance: (currentBalance + walletUsed).toString() }).where(eq(users.id, userId));
          }
          return res.status(400).json({ message: `Insufficient points. You need ${pointsNeeded} points. You have ${availablePoints} points.`, remainingAmount, pointsNeeded });
        }
        const pointsAmount = pointsNeeded * 0.01;
        pointsUsed = pointsNeeded;
        remainingAmount -= pointsAmount;
        if (pointsUsed > 0) {
          paymentBreakdown.push({ method: "ringtone_points", amount: pointsAmount, pointsUsed: pointsNeeded, description: `Ringtone Points: £${pointsAmount.toFixed(2)} (${pointsNeeded} points)` });
        }
      }

      if (remainingAmount > 0.01) {
        return res.json({ success: false, message: "Card payment required for remaining balance", remainingAmount, requiresCashflows: true });
      }

      if (walletUsed > 0) {
        const newBalance = Number(user?.balance || "0") - walletUsed;
        await db.update(users).set({ balance: newBalance.toString() }).where(eq(users.id, userId));
      }
      if (pointsUsed > 0) {
        const newPoints = (user?.ringtonePoints || 0) - pointsUsed;
        await db.update(users).set({ ringtonePoints: newPoints }).where(eq(users.id, userId));
      }

      let paymentMethodText = "Discount";
      if (walletUsed > 0 && pointsUsed > 0) paymentMethodText = "Wallet+Points";
      else if (walletUsed > 0) paymentMethodText = "Wallet";
      else if (pointsUsed > 0) paymentMethodText = "Points";

      await db.update(orders).set({
        status: "completed", paymentMethod: paymentMethodText, walletAmount: walletUsed.toString(),
        pointsAmount: pointsUsed.toString(), cashflowsAmount: "0", paymentBreakdown: JSON.stringify(paymentBreakdown), updatedAt: new Date()
      }).where(eq(orders.id, orderId));

      await db.update(competitions).set({ soldTickets: (competition.soldTickets || 0) + order.quantity, updatedAt: new Date() }).where(eq(competitions.id, competition.id));

      await db.insert(transactions).values({ userId, type: "voltz_purchase", amount: totalAmount.toFixed(2), description: `Voltz Game Purchase - ${order.quantity} games`, orderId: orderId, createdAt: new Date() });

      const voltzTickets = [];
      for (let i = 0; i < order.quantity; i++) {
        const ticketNumber = `VLT-${orderId.slice(0, 8).toUpperCase()}-${(i + 1).toString().padStart(3, "0")}`;
        const [ticket] = await db.insert(tickets).values({ userId, competitionId: order.competitionId, orderId: order.id, ticketNumber, isWinner: false, createdAt: new Date() }).returning();
        voltzTickets.push(ticket);
      }

      if (user?.email) {
        const ticketNumbers = voltzTickets.map((t) => t.ticketNumber);
        sendOrderConfirmationEmail(user.email, {
          orderId: order.id, userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer",
          orderType: "voltz", itemName: competition.title, quantity: order.quantity,
          totalAmount: order.totalAmount, orderDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          paymentMethod: paymentMethodText, ticketNumbers: ticketNumbers.length > 0 ? ticketNumbers : undefined,
        }).catch((err) => console.error("Failed to send Voltz confirmation email:", err));
      }

      res.json({ success: true, message: "Voltz game purchase complete!", competitionId: order.competitionId, orderId: order.id, quantity: order.quantity, paymentBreakdown });
    } catch (error) {
      console.error("Error processing voltz payment:", error);
      res.status(500).json({ message: "Failed to process voltz payment" });
    }
  });

  // Convert ringtone points to wallet balance
  app.post(
    "/api/convert-ringtone-points",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { points } = req.body;

        if (!points || points <= 0) {
          return res.status(400).json({ message: "Invalid points amount" });
        }

        const user = await storage.getUser(userId);
        const currentPoints = user?.ringtonePoints || 0;

        if (points > currentPoints) {
          return res
            .status(400)
            .json({ message: "Not enough ringtone points" });
        }

        if (points < 100) {
          return res
            .status(400)
            .json({ message: "Minimum conversion is 100 points" });
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
          description: `Received £${euroAmount.toFixed(
            2
          )} from ringtone points conversion`,
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
    }
  );

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

  app.get(
    "/api/user/cashflow-transactions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;

        const cashflowDeposits = await db
          .select({
            id: transactions.id,
            amount: transactions.amount,
            description: transactions.description,
            createdAt: transactions.createdAt,
            type: transactions.type,
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
    }
  );

  app.get(
    "/api/admin/users/cashflow-transactions",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
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
          .leftJoin(
            transactions,
            and(
              eq(transactions.userId, users.id),
              eq(transactions.type, "deposit")
            )
          )
          .groupBy(users.id);

        res.json(usersCashflow);
      } catch (error) {
        console.error("Error fetching users cashflow transactions:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch users cashflow transactions" });
      }
    }
  );


  // discount routes
  // CREATE DISCOUNT CODE
  app.post(
    "/api/admin/discount-codes",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const { code, type, value, maxUses, expiresAt } = req.body;
  
        if (!["cash", "points", "percentage"].includes(type))
          return res.status(400).json({ error: "Invalid type" });
        if (!code || typeof code !== "string")
          return res.status(400).json({ error: "Code is required" });
        if (value <= 0) return res.status(400).json({ error: "Value must be > 0" });
        if (type === "percentage" && value > 100) 
          return res.status(400).json({ error: "Percentage cannot exceed 100" });
        if (maxUses <= 0) return res.status(400).json({ error: "Max uses >= 1" });
  
        const formattedCode = code.trim().toUpperCase();
  
        const [newCode] = await db.insert(discountCodes).values({
          code: formattedCode,
          type,
          value,
          maxUses,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          usesCount: 0,
          isActive: true,
        }).returning();
  
        res.json(newCode);
      } catch (err) {
        console.error("Error creating discount code:", err);
        res.status(500).json({ error: "Failed to create discount code" });
      }
    }
  );

  // BULK CREATE DISCOUNT CODES
app.post(
  "/api/admin/discount-codes/bulk",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const { codes } = req.body;

      if (!codes || !Array.isArray(codes) || codes.length === 0) {
        return res.status(400).json({ error: "Codes array is required" });
      }

      if (codes.length > 100) {
        return res.status(400).json({ error: "Maximum 100 codes per bulk creation" });
      }

      const results = {
        successful: [],
        failed: [],
        total: codes.length,
      };

      // Validate all codes first
      const validationErrors = [];
      codes.forEach((code, index) => {
        const errors = [];
        if (!code.code || typeof code.code !== "string") {
          errors.push("Code is required");
        }
        if (!["cash", "points", "percentage"].includes(code.type)) {
          errors.push("Invalid type");
        }
        if (!code.value || code.value <= 0) {
          errors.push("Value must be greater than 0");
        }
        if (code.type === "percentage" && code.value > 100) {
          errors.push("Percentage cannot exceed 100");
        }
        if (!code.maxUses || code.maxUses <= 0) {
          errors.push("Max uses must be at least 1");
        }

        if (errors.length > 0) {
          validationErrors.push({ index, code: code.code, errors });
        }
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: "Validation failed",
          validationErrors,
        });
      }

      // Process codes in batches
      for (const codeData of codes) {
        try {
          const formattedCode = codeData.code.trim().toUpperCase();

          // Check if code already exists
          const existing = await db
            .select()
            .from(discountCodes)
            .where(eq(discountCodes.code, formattedCode))
            .limit(1);

          if (existing.length > 0) {
            results.failed.push({
              code: formattedCode,
              reason: "Code already exists",
            });
            continue;
          }

          const [newCode] = await db
            .insert(discountCodes)
            .values({
              code: formattedCode,
              type: codeData.type,
              value: codeData.value,
              maxUses: codeData.maxUses,
              expiresAt: codeData.expiresAt ? new Date(codeData.expiresAt) : null,
              usesCount: 0,
              isActive: codeData.isActive ?? true,
            })
            .returning();

          results.successful.push(newCode);
        } catch (error) {
          console.error(`Error creating code ${codeData.code}:`, error);
          results.failed.push({
            code: codeData.code,
            reason: "Database error",
          });
        }
      }

      res.json(results);
    } catch (err) {
      console.error("Error in bulk creation:", err);
      res.status(500).json({ error: "Failed to create discount codes" });
    }
  }
);
  
  // GET ALL DISCOUNT CODES
  app.get(
    "/api/admin/discount-codes",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const codes = await db
          .select()
          .from(discountCodes)
          .orderBy(desc(discountCodes.createdAt)); 
  
        res.json(codes);
      } catch (err) {
        console.error("Error fetching discount codes:", err);
        res.status(500).json({ error: "Failed to fetch discount codes" });
      }
    }
  );
  
  // UPDATE DISCOUNT CODE
  app.patch(
    "/api/admin/discount-codes/:id",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { isActive, value, maxUses, expiresAt } = req.body;
  
        const [updated] = await db
          .update(discountCodes)
          .set({
            isActive,
            value,
            maxUses,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          })
          .where(eq(discountCodes.id, id)) // use eq() helper
          .returning();
  
        res.json(updated);
      } catch (err) {
        console.error("Error updating discount code:", err);
        res.status(500).json({ error: "Failed to update discount code" });
      }
    }
  );
  

  // ADD THIS ENDPOINT FOR TOGGLE ACTIVE
app.patch(
  "/api/admin/discount-codes/:id/toggle-active",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const [updated] = await db
        .update(discountCodes)
        .set({ isActive })
        .where(eq(discountCodes.id, id))
        .returning();

      res.json(updated);
    } catch (err) {
      console.error("Error toggling discount code active status:", err);
      res.status(500).json({ error: "Failed to toggle active status" });
    }
  }
);


app.delete(
  "/api/admin/discount-codes/:id",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate id
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Invalid discount code ID" });
      }

      console.log("Deleting discount code with ID:", id);

      // Optional: Check if discount code exists
      const existingCode = await db
        .select()
        .from(discountCodes)
        .where(eq(discountCodes.id, id))
        .limit(1);

      if (existingCode.length === 0) {
        return res.status(404).json({ error: "Discount code not found" });
      }

      // Step 1: Remove discount code references from orders table
      // Option A: Set discount_code_id to NULL in orders (preserves order data)
      await db.update(orders)
        .set({ discountCodeId: null })
        .where(eq(orders.discountCodeId, id));

      // OR Option B: Delete the orders that reference this discount code
      // (if you want to completely remove orders using this discount)
      // await db.delete(orders).where(eq(orders.discountCodeId, id));

      // Step 2: Delete all usages from discount_code_usages table
      await db.delete(discountCodeUsages).where(eq(discountCodeUsages.discountCodeId, id));

      // Step 3: Finally delete the discount code
      await db.delete(discountCodes).where(eq(discountCodes.id, id));

      res.json({ 
        success: true, 
        message: "Discount code deleted successfully" 
      });
    } catch (err) {
      console.error("Error deleting discount code:", err);
      res.status(500).json({ error: "Failed to delete discount code" });
    }
  }
);




// In your apply-discount endpoint, update the discount logic:
app.post("/api/checkout/apply-discount", isAuthenticated, async (req, res) => {
  try {
    const { orderId, code } = req.body;
    const userId = req.user.id;

    if (!code || !orderId) {
      return res.status(400).json({ error: "Code and order ID are required" });
    }

    // Fetch discount
    const [discount] = await db
      .select()
      .from(discountCodes)
      .where(
        and(
          eq(discountCodes.code, code.toUpperCase()),
          eq(discountCodes.isActive, true),
          sql`(discount_codes.expires_at IS NULL OR discount_codes.expires_at > NOW())`
        )
      );

    if (!discount) return res.status(400).json({ error: "Invalid or expired code" });

    // Check usage
    const usage = await db
      .select()
      .from(discountCodeUsages)
      .where(
        and(
          eq(discountCodeUsages.discountCodeId, discount.id),
          eq(discountCodeUsages.userId, userId)
        )
      );

    if (usage.length > 0) return res.status(400).json({ error: "Code already used" });
    if (discount.usesCount >= discount.maxUses) return res.status(400).json({ error: "Usage limit reached" });

    // Fetch order
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.discountCodeId) return res.status(400).json({ error: "Discount already applied" });

    // Get competition details for original price calculation
    const [competition] = await db
      .select()
      .from(competitions)
      .where(eq(competitions.id, order.competitionId));

    if (!competition) return res.status(404).json({ error: "Competition not found" });

    // Calculate original amount
    const originalAmount = Number(competition.ticketPrice) * order.quantity;
    
    // Prepare discount values
    let discountAmount = Number(discount.value);
    let newTotalAmount = Number(order.totalAmount);
    let discountValue = discountAmount; // Store the actual discount value
    let pointsDiscountCashValue = 0;
    let percentageDiscount = 0;

    switch (discount.type) {
      case "cash":
        // Cash discount: subtract fixed amount
        newTotalAmount -= discountAmount;
        if (newTotalAmount < 0) newTotalAmount = 0;
        break;
        
      case "points":
        // Points discount: convert points to cash (100 points = £1)
        pointsDiscountCashValue = discountAmount * 0.01;
        discountValue = pointsDiscountCashValue;
        newTotalAmount -= pointsDiscountCashValue;
        if (newTotalAmount < 0) newTotalAmount = 0;
        break;
        
      case "percentage":
        // Percentage discount: calculate percentage of original amount
        // Ensure percentage is between 0 and 100
        if (discountAmount < 0 || discountAmount > 100) {
          return res.status(400).json({ error: "Invalid percentage value" });
        }
        
        percentageDiscount = discountAmount;
        // FIX: Use a different variable name or don't redeclare
        const calculatedDiscount = (originalAmount * discountAmount) / 100;
        
        // Apply minimum cash flow requirement (e.g., £1.50 for 2 spins)
        const minimumAmount = 1.50; // Minimum amount after discount
        newTotalAmount = originalAmount - calculatedDiscount;
        
        if (newTotalAmount < minimumAmount) {
          newTotalAmount = minimumAmount;
        }
        
        // Store the actual discount applied
        discountValue = originalAmount - newTotalAmount;
        break;
    }

    // Apply discount in a transaction
    await db.transaction(async (tx) => {
      // Update discount code usage count
      await tx.update(discountCodes)
        .set({
          usesCount: discount.usesCount + 1,
          isActive: discount.usesCount + 1 >= discount.maxUses ? false : discount.isActive,
        })
        .where(eq(discountCodes.id, discount.id));

      // Update order
      await tx.update(orders)
        .set({ 
          totalAmount: newTotalAmount,
          discountCodeId: discount.id,
          discountAmount: discountValue,
          discountType: discount.type,
          pointsDiscountAmount: discount.type === "points" ? discountAmount : null,
          percentageDiscount: discount.type === "percentage" ? discountAmount : null
        })
        .where(eq(orders.id, orderId));

      // Record usage
      await tx.insert(discountCodeUsages).values({
        discountCodeId: discount.id,
        userId,
        orderId,
      });
    });

    let message = "";
    switch (discount.type) {
      case "cash":
        message = `Discount applied: £${discountValue.toFixed(2)} off`;
        break;
      case "points":
        message = `Discount applied: ${discountAmount} points (worth £${discountValue.toFixed(2)})`;
        break;
      case "percentage":
        message = `Discount applied: ${discountAmount}% off (saved £${discountValue.toFixed(2)})`;
        break;
    }

    res.json({ 
      success: true,
      newTotalAmount: newTotalAmount,
      discountAmount: discountValue,
      discountType: discount.type,
      pointsDiscountCashValue: discount.type === "points" ? discountValue : 0,
      percentageDiscount: discount.type === "percentage" ? discountAmount : 0,
      message: message,
      discountCode: discount.code,
    });
  } catch (err) {
    console.error("Error applying discount code:", err);
    res.status(500).json({ error: "Failed to apply discount code" });
  }
});



app.post(
  "/api/checkout/remove-discount",
  isAuthenticated,
  async (req, res) => {
    try {
      const { orderId } = req.body;
      const userId = req.user.id;

      if (!orderId) {
        return res.status(400).json({ error: "Order ID is required" });
      }

      // Get current order
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      if (!order.discountCodeId) {
        return res.status(400).json({ error: "No discount applied to this order" });
      }

      // Get discount code
      const [discount] = await db
        .select()
        .from(discountCodes)
        .where(eq(discountCodes.id, order.discountCodeId));

      if (!discount) {
        return res.status(404).json({ error: "Discount code not found" });
      }

      // Remove discount using transaction
      await db.transaction(async (tx) => {
        // Revert discount code usage count
        await tx.update(discountCodes)
          .set({
            usesCount: discount.usesCount - 1,
            isActive: discount.usesCount - 1 < discount.maxUses ? true : discount.isActive,
          })
          .where(eq(discountCodes.id, discount.id));

        // Get original order amount (before discount)
        const competitionId = order.competitionId;
        const [competition] = await tx.select()
          .from(competitions)
          .where(eq(competitions.id, competitionId));

        const originalAmount = Number(competition?.ticketPrice || 0) * order.quantity;

        // Update order to remove discount
        await tx.update(orders)
          .set({ 
            totalAmount: originalAmount, 
            discountCodeId: null, 
            discountAmount: null,
            discountType: null,
            pointsDiscountAmount: null,
            percentageDiscount: null
          })
          .where(eq(orders.id, orderId));

        // Remove usage record
        await tx.delete(discountCodeUsages)
          .where(
            and(
              eq(discountCodeUsages.discountCodeId, discount.id),
              eq(discountCodeUsages.orderId, orderId)
            )
          );
      });

      // Get updated order
      const [updatedOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      res.json({ 
        success: true, 
        message: "Discount removed successfully",
        newTotalAmount: Number(updatedOrder.totalAmount)
      });
    } catch (err) {
      console.error("Error removing discount code:", err);
      res.status(500).json({ error: "Failed to remove discount code" });
    }
  }
);

// Get user's used discount codes
app.get(
  "/api/user/discount-codes/used",
  isAuthenticated,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const usedCodes = await db
        .select({
          code: discountCodes.code,
          type: discountCodes.type,
          value: discountCodes.value,
          usedAt: discountCodeUsages.createdAt,
          orderId: discountCodeUsages.orderId
        })
        .from(discountCodeUsages)
        .innerJoin(discountCodes, eq(discountCodeUsages.discountCodeId, discountCodes.id))
        .where(eq(discountCodeUsages.userId, userId))
        .orderBy(desc(discountCodeUsages.createdAt));

      res.json(usedCodes);
    } catch (err) {
      console.error("Error fetching used discount codes:", err);
      res.status(500).json({ error: "Failed to fetch used discount codes" });
    }
  }
);



// USER VERIFICATION ROUTES
 // Get verification status for current user
app.get("/api/verification/status", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [verification] = await db
      .select()
      .from(userVerifications)
      .where(eq(userVerifications.userId, userId))
      .orderBy(desc(userVerifications.createdAt))
      .limit(1);
    
    const user = await db
      .select({ isVerified: users.isVerified })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    res.json({
      verification,
      isVerified: user[0]?.isVerified || false,
    });
  } catch (error) {
    console.error("Error fetching verification status:", error);
    res.status(500).json({ error: "Failed to fetch verification status" });
  }
});

// Submit verification document with file upload
app.post(
  "/api/verification/submit",
  isAuthenticated,
  verificationUpload.single("documentImage"),
  async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { documentType } = req.body;
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ 
          error: "Document image is required" 
        });
      }
      
      // Construct the document image URL
      const documentImageUrl = `${process.env.R2_PUBLIC_URL}/${req.file.key}`;
      
      // Check if user already has a pending verification
      const existing = await db
        .select()
        .from(userVerifications)
        .where(
          and(
            eq(userVerifications.userId, userId),
            eq(userVerifications.status, "pending")
          )
        );
      
      if (existing.length > 0) {
        // Delete the uploaded file if verification already exists
        await deleteR2Object(req.file.key);
        
        return res.status(400).json({ 
          error: "You already have a pending verification request" 
        });
      }
      
      // Create verification request
      const [verification] = await db
        .insert(userVerifications)
        .values({
          userId,
          documentType,
          documentImageUrl,
          status: "pending",
          adminHasUnread: true, 
        })
        .returning();
      
      res.json({ 
        success: true, 
        message: "Verification submitted successfully",
        verification 
      });
    } catch (error) {
      console.error("Error submitting verification:", error);
      
      // Cleanup: Delete uploaded file if error occurs
      if (req.file) {
        await deleteR2Object(req.file.key);
      }
      
      res.status(500).json({ error: "Failed to submit verification" });
    }
  }
);


// Admin: Get all pending verifications
app.get("/api/admin/verifications", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { status = "all" } = req.query;
    
    let query = db
    .select({
      id: userVerifications.id,
      status: userVerifications.status,
      documentType: userVerifications.documentType,
      documentImageUrl: userVerifications.documentImageUrl,
      adminNotes: userVerifications.adminNotes,
      createdAt: userVerifications.createdAt,
      reviewedAt: userVerifications.reviewedAt,
      userId: userVerifications.userId,
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userDateOfBirth: users.dateOfBirth,
    })
    .from(userVerifications)
    .innerJoin(users, eq(userVerifications.userId, users.id));
  
    
    // Apply status filter if not "all"
    if (status !== "all") {
      query = query.where(eq(userVerifications.status, status));
    }
    
    // Execute query
    const results = await query.orderBy(desc(userVerifications.createdAt));
    
    const formattedResults = results.map(result => ({
      id: result.id,
      status: result.status,
      documentType: result.documentType,
      documentImageUrl: result.documentImageUrl,
      adminNotes: result.adminNotes,
      createdAt: result.createdAt,
      reviewedAt: result.reviewedAt,
      user: {
        id: result.userId,
        email: result.userEmail,
        name: `${result.userFirstName || ""} ${result.userLastName || ""}`.trim(),
        dateOfBirth: result.userDateOfBirth,
      },
    }));
    
    
    res.json(formattedResults);
  } catch (error) {
    console.error("Error fetching verifications:", error);
    res.status(500).json({ error: "Failed to fetch verifications" });
  }
});

// Admin: Delete a user's verification
app.delete(
  "/api/admin/verifications/:id",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const verificationId = req.params.id;

      // Fetch the verification first (to delete R2 object if needed)
      const [verification] = await db
        .select()
        .from(userVerifications)
        .where(eq(userVerifications.id, verificationId));

      if (!verification) {
        return res.status(404).json({ error: "Verification not found" });
      }

      // Delete the document from R2 (if you store the file in R2)
      if (verification.documentImageUrl) {
        const key = verification.documentImageUrl.split("/").pop(); // extract key
        if (key) await deleteR2Object(key);
      }

      // Delete verification from database
      await db
        .delete(userVerifications)
        .where(eq(userVerifications.id, verificationId));

      res.json({ success: true, message: "Verification deleted successfully" });
    } catch (error) {
      console.error("Error deleting verification:", error);
      res.status(500).json({ error: "Failed to delete verification" });
    }
  }
);


// Admin: Get single verification
app.get("/api/admin/verifications/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [verification] = await db
      .select({
        id: userVerifications.id,
        status: userVerifications.status,
        documentType: userVerifications.documentType,
        documentImageUrl: userVerifications.documentImageUrl,
        adminNotes: userVerifications.adminNotes,
        createdAt: userVerifications.createdAt,
        reviewedAt: userVerifications.reviewedAt,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          dateOfBirth: users.dateOfBirth,
          phoneNumber: users.phoneNumber,
          address: users.address,
        },
      })
      .from(userVerifications)
      .innerJoin(users, eq(userVerifications.userId, users.id))
      .where(eq(userVerifications.id, id));
    
    if (!verification) {
      return res.status(404).json({ error: "Verification not found" });
    }
    
    res.json(verification);
  } catch (error) {
    console.error("Error fetching verification:", error);
    res.status(500).json({ error: "Failed to fetch verification" });
  }
});

// Admin: Update verification status
app.post("/api/admin/verifications/:id/review", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
       status, 
        adminNotes,
        ageVerified,
        idDobMatch,
        idNameMatch,
        minimumAgeMet

     } = req.body;
    const adminId = req.user.id;
    
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (status === "approved") {
      if (!ageVerified || !idDobMatch || !idNameMatch || !minimumAgeMet) {
        return res.status(400).json({ 
          error: "Age verification checks are required for approval" 
        });
      }
    }
    
    // Start transaction
    await db.transaction(async (tx) => {
      // Update verification
      const [verification] = await tx
        .update(userVerifications)
        .set({
          status,
          adminNotes,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          ageVerified: status === "approved" ? true : false,
          idDobMatch: status === "approved" ? true : false,
          idNameMatch: status === "approved" ? true : false,
          minimumAgeMet: status === "approved" ? true : false,
          // extractedDob: extractedDob || null,
          ageVerifiedAt: status === "approved" ? new Date() : null,
        })
        .where(eq(userVerifications.id, id))
        .returning();
      
      if (!verification) {
        throw new Error("Verification not found");
      }
      
      // If approved, update user verification status
      if (status === "approved") {
        await tx
          .update(users)
          .set({ 
            isVerified: true,
            // ...(extractedDob && !req.user.dateOfBirth ? { dateOfBirth: extractedDob } : {})
           })
          .where(eq(users.id, verification.userId));
      } else if (status === "rejected") {
        // If rejected, ensure user is not verified
        await tx
          .update(users)
          .set({ isVerified: false })
          .where(eq(users.id, verification.userId));
      }
    });
    
    res.json({ 
      success: true, 
      message: `Verification ${status} with age verification`  
    });
  } catch (error) {
    console.error("Error reviewing verification:", error);
    res.status(500).json({ error: "Failed to review verification" });
  }
});

// Check if user can withdraw
app.get("/api/verification/can-withdraw", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [user] = await db
      .select({ isVerified: users.isVerified })
      .from(users)
      .where(eq(users.id, userId));
    
    // Check if user has any withdrawal requests
    const UserithdrawalRequests = await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .limit(1);
    
    const canWithdraw = user?.isVerified === true;
    
    res.json({
      canWithdraw,
      isVerified: user?.isVerified || false,
      hasPreviousWithdrawals: UserithdrawalRequests.length > 0,
    });
  } catch (error) {
    console.error("Error checking withdrawal eligibility:", error);
    res.status(500).json({ error: "Failed to check withdrawal eligibility" });
  }
});



  // app.get("/api/admin/cashflow-transactions", isAuthenticated, isAdmin, async (req, res) => {
  //   try {
  //     //
  //     // 1️⃣ CASHFLOW DEPOSITS (Wallet top-ups)
  //     //
  //     const cashflowDeposits = await db
  //       .select({
  //         id: transactions.id,
  //         userId: transactions.userId,
  //         userName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
  //         userEmail: users.email,
  //         type: transactions.type,
  //         amount: transactions.amount,
  //         description: transactions.description,
  //         createdAt: transactions.createdAt,
  //         source: sql`'transaction'`,
  //       })
  //       .from(transactions)
  //       .leftJoin(users, eq(transactions.userId, users.id))
  //       .where(sql`${transactions.type} = 'deposit'`);

  //     //
  //     // 2️⃣ CASHFLOW USED IN ORDERS (cashflowsAmount > 0)
  //     //
  //     const cashflowOrders = await db
  //       .select({
  //         id: orders.id,
  //         userId: orders.userId,
  //         userName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
  //         userEmail: users.email,
  //         competitionId: orders.competitionId,
  //         competitionTitle: competitions.title,
  //         type: sql`'cashflow_spent'`,
  //         amount: orders.cashflowsAmount,
  //         description: sql`COALESCE(${competitions.title}, ${orders.paymentBreakdown}, 'Competition Purchase')`,
  //         createdAt: orders.createdAt,
  //         source: sql`'order'`,
  //       })
  //       .from(orders)
  //       .leftJoin(users, eq(orders.userId, users.id))
  //       .leftJoin(competitions, eq(orders.competitionId, competitions.id))
  //       .where(sql`${orders.cashflowsAmount} > 0`);

  //     //
  //     // 3️⃣ MERGE RESULTS
  //     //
  //     const allCashflowTx = [...cashflowDeposits, ...cashflowOrders];

  //     //
  //     // 4️⃣ SORT NEWEST FIRST
  //     //
  //     allCashflowTx.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  //     res.json(allCashflowTx);

  //   } catch (error) {
  //     console.error("Error fetching cashflow transactions:", error);
  //     res.status(500).json({ message: "Failed to fetch cashflow transactions" });
  //   }
  // });

// API endpoint: /api/admin/cashflow-transactions
app.get(
  "/api/admin/cashflow-transactions",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      const { dateFrom, dateTo, search } = req.query;
      
      // Get Cashflows transactions:
      // 1. All deposits (Cashflows top-ups)
      // 2. All purchases with "Instant play purchase" in description AND has paymentRef
      // 3. Everything else with a 260-prefixed paymentRef
      let cashflowTransactions = await db
        .select({
          id: transactions.id,
          userId: transactions.userId,
          userName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          userEmail: users.email,
          type: transactions.type,
          amount: transactions.amount,
          description: transactions.description,
          createdAt: transactions.createdAt,
          source: sql`'cashflows'`,
          paymentRef: transactions.paymentRef,
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.userId, users.id))
        .where(
          sql`(
            ${transactions.type} = 'deposit'
          ) OR (
            ${transactions.type} = 'purchase' 
            AND ${transactions.paymentRef} IS NOT NULL 
            AND ${transactions.paymentRef} != '' 
            AND ${transactions.paymentRef} != 'N/A'
            AND ${transactions.description} LIKE '%Instant play purchase%'
          ) OR (
            ${transactions.paymentRef} LIKE '260%'
          )`
        );
      
      // Apply filters in JavaScript
      let filtered = [...cashflowTransactions];
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom as string);
        filtered = filtered.filter(tx => new Date(tx.createdAt) >= fromDate);
      }
      if (dateTo) {
        const toDate = new Date(dateTo as string);
        toDate.setHours(23, 59, 59, 999); // End of day
        filtered = filtered.filter(tx => new Date(tx.createdAt) <= toDate);
      }
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filtered = filtered.filter(tx => 
          (tx.userName || '').toLowerCase().includes(searchLower) ||
          (tx.userEmail || '').toLowerCase().includes(searchLower) ||
          (tx.description || '').toLowerCase().includes(searchLower) ||
          (tx.paymentRef || '').toLowerCase().includes(searchLower) ||
          String(Math.abs(parseFloat(String(tx.amount)) || 0)).includes(searchLower)
        );
      }
      
      // Sort newest first
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Apply pagination
      const total = filtered.length;
      const paginated = filtered.slice(offset, offset + limit).map(tx => ({
        ...tx,
        amount: Math.abs(parseFloat(String(tx.amount)) || 0) // Always show positive
      }));
      
      console.log(`Cashflows query: ${total} total transactions, showing page ${page} (${paginated.length} items)`);
      
      res.json({
        transactions: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + limit < total
        }
      });
      
    } catch (error) {
      console.error("Error fetching cashflow transactions:", error);
      res.status(500).json({ 
        message: "Failed to fetch cashflow transactions",
        error: (error as Error).message 
      });
    }
  }
);



// API endpoint: /api/admin/cashflow-transactions/stats
app.get(
  "/api/admin/cashflow-transactions/stats",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const { dateFrom, dateTo, search } = req.query;
      
      // Get Cashflows transactions with same inclusive filter
      let allTransactions = await db
        .select({
          id: transactions.id,
          userId: transactions.userId,
          userName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          userEmail: users.email,
          type: transactions.type,
          amount: transactions.amount,
          description: transactions.description,
          createdAt: transactions.createdAt,
          source: sql`'cashflows'`,
          paymentRef: transactions.paymentRef,
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.userId, users.id))
        .where(
          sql`(
            ${transactions.type} = 'deposit'
          ) OR (
            ${transactions.type} = 'purchase' 
            AND ${transactions.paymentRef} IS NOT NULL 
            AND ${transactions.paymentRef} != '' 
            AND ${transactions.paymentRef} != 'N/A'
            AND ${transactions.description} LIKE '%Instant play purchase%'
          ) OR (
            ${transactions.paymentRef} LIKE '260%'
          )`
        );
      
      // Apply filters
      let filtered = [...allTransactions];
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom as string);
        filtered = filtered.filter(tx => new Date(tx.createdAt) >= fromDate);
      }
      if (dateTo) {
        const toDate = new Date(dateTo as string);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(tx => new Date(tx.createdAt) <= toDate);
      }
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filtered = filtered.filter(tx => 
          (tx.userName || '').toLowerCase().includes(searchLower) ||
          (tx.userEmail || '').toLowerCase().includes(searchLower) ||
          (tx.description || '').toLowerCase().includes(searchLower) ||
          (tx.paymentRef || '').toLowerCase().includes(searchLower) ||
          String(Math.abs(parseFloat(String(tx.amount)) || 0)).includes(searchLower)
        );
      }
      
      // Calculate deposit total
      const depositTotal = filtered
        .filter(tx => tx.type === "deposit")
        .reduce((sum, tx) => {
          const amount = Math.abs(parseFloat(String(tx.amount)) || 0);
          return sum + amount;
        }, 0);
      
      // Calculate instant play purchase total
      const instantPlayTotal = filtered
        .filter(tx => tx.type !== "deposit")
        .reduce((sum, tx) => {
          const amount = Math.abs(parseFloat(String(tx.amount)) || 0);
          return sum + amount;
        }, 0);
      
      // Total revenue
      const totalAmount = depositTotal + instantPlayTotal;
      
      // Unique users
      const uniqueUsers = new Set(
        filtered
          .map(tx => tx.userEmail || tx.userId)
          .filter(Boolean)
      );
      
      console.log('Cashflows Stats:', {
        totalFiltered: filtered.length,
        depositCount: filtered.filter(tx => tx.type === 'deposit').length,
        purchaseCount: filtered.filter(tx => tx.type !== 'deposit').length,
        depositTotal: depositTotal.toFixed(2),
        instantPlayTotal: instantPlayTotal.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        uniqueUsers: uniqueUsers.size
      });
      
      res.json({
        totalAmount: Number(totalAmount.toFixed(2)),
        depositTotal: Number(depositTotal.toFixed(2)),
        instantPlayTotal: Number(instantPlayTotal.toFixed(2)),
        transactionCount: filtered.length,
        uniqueUsers: uniqueUsers.size,
      });
      
    } catch (error) {
      console.error("Error fetching cashflow stats:", error);
      res.status(500).json({ 
        message: "Failed to fetch cashflow stats",
        error: (error as Error).message 
      });
    }
  }
);

app.get(
  "/api/admin/cashflow-transactions/debug-null-ref",
  
  async (req, res) => {
    try {
      // Get ALL deposits with NULL paymentRef
      const nullRefDeposits = await db
        .select({
          id: transactions.id,
          type: transactions.type,
          description: transactions.description,
          paymentRef: transactions.paymentRef,
          amount: transactions.amount,
          createdAt: transactions.createdAt,
        })
        .from(transactions)
        .where(
          sql`${transactions.type} = 'deposit'
          AND (${transactions.paymentRef} IS NULL 
               OR ${transactions.paymentRef} = '' 
               OR ${transactions.paymentRef} = 'N/A')`
        );
      
      // Check which ones have "Ref" or reference pattern in description
      const withRefInDesc = nullRefDeposits.filter(tx => {
        const desc = tx.description || '';
        return desc.includes('Ref') || 
               desc.includes('ref') ||
               desc.match(/\d{15,}/) || // Has a long number (like payment ref)
               desc.toLowerCase().includes('cashflows');
      });
      
      // Extract reference from description where possible
      const extractedRefs = withRefInDesc.map(tx => {
        const desc = tx.description || '';
        // Try to extract patterns like "Ref 260621..." or "Ref 251121..."
        const refMatch = desc.match(/Ref\s*(\d+)/i);
        return {
          description: desc,
          extractedRef: refMatch ? refMatch[1] : null,
          amount: tx.amount,
          createdAt: tx.createdAt,
        };
      });
      
      // Group by description pattern
      const descPatterns = {};
      nullRefDeposits.forEach(tx => {
        const desc = tx.description || 'N/A';
        descPatterns[desc] = (descPatterns[desc] || 0) + 1;
      });
      
      // Sort patterns by count
      const sortedPatterns = Object.entries(descPatterns)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30);
      
      // Count how many have Cashflows-like descriptions
      const cashflowsLike = nullRefDeposits.filter(tx => 
        (tx.description || '').toLowerCase().includes('cashflows') ||
        (tx.description || '').toLowerCase().includes('top-up') ||
        (tx.description || '').toLowerCase().includes('top up') ||
        (tx.description || '').match(/Ref\s*\d{15,}/i)
      );
      
      res.json({
        totalNullRefDeposits: nullRefDeposits.length,
        withRefInDesc: withRefInDesc.length,
        cashflowsLikeCount: cashflowsLike.length,
        totalAmountOfCashflowsLike: cashflowsLike.reduce((sum, tx) => sum + Math.abs(parseFloat(String(tx.amount)) || 0), 0).toFixed(2),
        sampleCashflowsLike: cashflowsLike.slice(0, 20),
        extractedRefs: extractedRefs.filter(r => r.extractedRef).slice(0, 20),
        topDescriptionPatterns: sortedPatterns,
        // What would be added to your current total
        wouldAddToTransactions: cashflowsLike.length,
        wouldAddToRevenue: cashflowsLike.reduce((sum, tx) => sum + Math.abs(parseFloat(String(tx.amount)) || 0), 0).toFixed(2),
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

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
      res.json(
        referrals.map((r) => ({
          id: r.id,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          createdAt: r.createdAt,
        }))
      );
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  app.get(
    "/api/user/referral-stats",
    isAuthenticated,
    async (req: any, res) => {
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
    }
  );

  // Newsletter subscription endpoint
  app.post(
    "/api/user/newsletter/subscribe",
    isAuthenticated,
    async (req: any, res) => {
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
            message:
              "Email doesn't match your registered email. Please use the email you signed up with.",
          });
        }

        // Check if already subscribed
        if (user.receiveNewsletter) {
          return res.status(409).json({
            message: "You have already subscribed to our newsletter!",
          });
        }

        // Subscribe user to newsletter
        await db
          .update(users)
          .set({ receiveNewsletter: true })
          .where(eq(users.id, userId));

        res.json({
          success: true,
          message:
            "Successfully subscribed to newsletter! You'll receive exclusive offers and updates.",
        });
      } catch (error) {
        console.error("Error subscribing to newsletter:", error);
        res.status(500).json({ message: "Failed to subscribe to newsletter" });
      }
    }
  );

  // Newsletter unsubscribe endpoint
  app.post(
    "/api/user/newsletter/unsubscribe",
    isAuthenticated,
    async (req: any, res) => {
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
            message: "You are not subscribed to our newsletter",
          });
        }

        // Unsubscribe user from newsletter
        await db
          .update(users)
          .set({ receiveNewsletter: false })
          .where(eq(users.id, userId));

        res.json({
          success: true,
          message: "Successfully unsubscribed from newsletter",
        });
      } catch (error) {
        console.error("Error unsubscribing from newsletter:", error);
        res
          .status(500)
          .json({ message: "Failed to unsubscribe from newsletter" });
      }
    }
  );

  app.post("/api/wallet/topup", isAuthenticated, async (req: any, res) => {
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
        const newBalance = (
          parseFloat(user?.balance || "0") + parseFloat(amount)
        ).toString();
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
          message: "Payment processing not configured. Please contact admin.",
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

      // ✅ ADD DAILY LIMIT CHECK HERE
      const dailySpend = await getTodaysCashSpend(userId);
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (user[0]?.dailySpendLimit) {
        const limit = Number(user[0].dailySpendLimit);
        const spent = dailySpend;
        const requestedAmount = Number(amount);
        
        if (spent + requestedAmount > limit) {
          return res.status(400).json({
            code: "DAILY_LIMIT_EXCEEDED",
            message: `Daily spending limit of £${limit.toFixed(2)} exceeded. You've already spent £${spent.toFixed(2)} today.`,
            spent: spent.toFixed(2),
            limit: limit.toFixed(2)
          });
        }
      }

      const session = await cashflows.createPaymentSession(amount, userId);

      if (!session?.hostedPageUrl || !session?.paymentJobReference) {
        return res.status(500).json({ message: "Failed to create payment" });
      }

      // 👇 Add this
      await db.insert(pendingPayments).values({
        paymentJobReference: session.paymentJobReference,
        userId,
        amount: Number(amount),
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.json({
        redirectUrl: session.hostedPageUrl,
        paymentJobRef: session.paymentJobReference,
      });
    } catch (err) {
      console.error("Checkout error:", err);
      res.status(500).json({ message: "Checkout failed" });
    }
  }
);

app.post("/api/wallet/confirm-topup", isAuthenticated, async (req: any, res) => {
  try {
    const { paymentJobRef, paymentRef } = req.body;
    const userId = req.user.id;

    if (!paymentJobRef) {
      return res.status(400).json({
        message: "Missing paymentJobRef"
      });
    }

    // Check if already processed
    const existingResult = await db.execute<{
      rows: Array<{ id: string }>
    }>(sql`
      SELECT id 
      FROM transactions 
      WHERE payment_ref = ${paymentRef ?? paymentJobRef} 
      AND user_id = ${userId}
      LIMIT 1
    `);
    
    const existingTx = Array.isArray(existingResult) ? existingResult[0] : existingResult.rows?.[0];

    if (existingTx) {
      return res.json({
        status: "PAID",
        message: "Payment already processed.",
      });
    }

    const payment = await cashflows.getPaymentStatus(
      paymentJobRef,
      paymentRef ?? undefined
    );

    const { status, paidAmount } = normalizeCashflowsStatus(payment);

    if (status === "PAID" && paidAmount > 0) {
      // Find pending payment
      const pendingResult = await db.execute<{
        rows: Array<{ id: string; userId: string; status: string }>
      }>(sql`
        SELECT id, user_id as "userId", status 
        FROM pending_payments 
        WHERE payment_job_reference = ${paymentJobRef}
        LIMIT 1
      `);
      
      const pending = Array.isArray(pendingResult) ? pendingResult[0] : pendingResult.rows?.[0];

      if (pending && pending.status === "pending") {
        // ✅ This will now handle referral bonus internally
        await processWalletTopup(
          pending.userId,
          pending.id,
          paymentRef ?? paymentJobRef,
          paidAmount
        );

        return res.json({
          status: "PAID",
          message: "Payment received. Wallet updated.",
        });
      } else {
        return res.json({
          status: "PAID",
          message: "Payment already processed.",
        });
      }
    }

    return res.json({
      status,
      message: "Payment not completed. Please try again manually.",
    });
  } catch (err: any) {
    console.error("Confirm top-up error:", err);
    return res.status(500).json({
      message: "Failed to confirm wallet top-up",
      error: err.message
    });
  }
});



  


// POST endpoint - 24 hour cooldown (PRODUCTION)
app.post("/api/wellbeing/daily-limit", isAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.isAdmin === true;

  const { limit } = req.body;

  const parsed = Number(limit);
  
  // PRODUCTION: 24 hours = 24 * 60 * 60 * 1000 milliseconds
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;

  // First, check if user has changed their limit in the last 24 hours
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const userData = user[0];
  
  // Check if user has dailyLimitLastUpdatedAt and it's within 24 hours
 if (!isAdmin && userData.dailyLimitLastUpdatedAt) {
  const lastUpdated = new Date(userData.dailyLimitLastUpdatedAt);
  const now = new Date();
  const msSinceUpdate = now.getTime() - lastUpdated.getTime();

  if (msSinceUpdate < COOLDOWN_MS) {
    const remainingMs = COOLDOWN_MS - msSinceUpdate;
    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
    const nextUpdateTime = new Date(lastUpdated.getTime() + COOLDOWN_MS);

    return res.status(400).json({
      code: "COOLDOWN_ACTIVE",
      error: `Daily limit can only be changed once every 24 hours.`,
      nextUpdateAvailable: nextUpdateTime.toISOString(),
      remainingHours,
      remainingMinutes,
    });
  }
}

  // If limit is 0, treat it as removing the limit (set to null)
  if (parsed === 0) {
    await db
      .update(users)
      .set({
        dailySpendLimit: null,
        dailyLimitLastUpdatedAt: new Date(),
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
      cooldownUntil: new Date(Date.now() + COOLDOWN_MS).toISOString(),
      message: "Daily spending limit removed. You can set a new limit in 24 hours."
    });
  }

  // Existing validation for non-zero values
  if (isNaN(parsed) || parsed < 0) {
    return res.status(400).json({ error: "Invalid limit" });
  }

  await db
    .update(users)
    .set({
      dailySpendLimit: parsed.toFixed(2),
      dailyLimitLastUpdatedAt: new Date(),
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
    cooldownUntil: new Date(Date.now() + COOLDOWN_MS).toISOString(),
    message: "Daily spending limit updated. You can change it again in 24 hours."
  });
});


// PUT endpoint - 24 hour cooldown (PRODUCTION)
// PUT endpoint - with admin bypass
app.put("/api/wellbeing/daily-limit", isAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.isAdmin === true;
  const { limit } = req.body;

  const parsed = Number(limit);
  
  // PRODUCTION: 24 hours
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;

  // Skip cooldown check for admins
  if (!isAdmin) {
    // Check cooldown first for regular users
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const userData = user[0];
    
    if (userData.dailyLimitLastUpdatedAt) {
      const lastUpdated = new Date(userData.dailyLimitLastUpdatedAt);
      const now = new Date();
      const msSinceUpdate = now.getTime() - lastUpdated.getTime();
      
      if (msSinceUpdate < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - msSinceUpdate;
        const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
        const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
        const nextUpdateTime = new Date(lastUpdated.getTime() + COOLDOWN_MS);
        
        return res.status(400).json({
          code: "COOLDOWN_ACTIVE",
          error: `Daily limit can only be changed once every 24 hours.`,
          nextUpdateAvailable: nextUpdateTime.toISOString(),
          lastUpdated: userData.dailyLimitLastUpdatedAt,
          remainingHours: remainingHours,
          remainingMinutes: remainingMinutes
        });
      }
    }
  }

  // If limit is 0, treat it as removing the limit
  if (parsed === 0) {
    await db
      .update(users)
      .set({
        dailySpendLimit: null,
        dailyLimitLastUpdatedAt: isAdmin ? null : new Date(), // Don't set cooldown for admins
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Audit (important for compliance)
    const actionType = isAdmin ? "admin_daily_spend_updated" : "daily_spend_updated";
    await db.insert(auditLogs).values({
      userId,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      email: req.user.email,
      action: actionType,
      description: isAdmin ? "Admin removed daily spend limit" : "Daily spend limit removed",
      createdAt: new Date(),
    });

    return res.json({
      success: true,
      dailySpendLimit: null,
      cooldownUntil: isAdmin ? null : new Date(Date.now() + COOLDOWN_MS).toISOString(),
      message: "Daily spending limit removed." + (isAdmin ? "" : " You can set a new limit in 24 hours.")
    });
  }

  // Existing validation for non-zero values
  if (isNaN(parsed) || parsed < 0) {
    return res.status(400).json({ error: "Invalid limit" });
  }

  await db
    .update(users)
    .set({
      dailySpendLimit: parsed.toFixed(2),
      dailyLimitLastUpdatedAt: isAdmin ? null : new Date(), // Don't set cooldown for admins
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Audit (important for compliance)
  const actionType = isAdmin ? "admin_daily_spend_updated" : "daily_spend_updated";
  await db.insert(auditLogs).values({
    userId,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    email: req.user.email,
    action: actionType,
    description: `${isAdmin ? 'Admin ' : ''}Daily spend limit updated to £${parsed.toFixed(2)}`,
    createdAt: new Date(),
  });

  res.json({
    success: true,
    dailySpendLimit: parsed.toFixed(2),
    cooldownUntil: isAdmin ? null : new Date(Date.now() + COOLDOWN_MS).toISOString(),
    message: "Daily spending limit updated." + (isAdmin ? "" : " You can change it again in 24 hours.")
  });
});

// Update GET endpoint for testing
app.get("/api/wellbeing", isAuthenticated, async (req, res) => {
  const spentToday = await getTodaysCashSpend(req.user.id);
  const user = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
  const userData = user[0];
  const limit = userData.dailySpendLimit;

  // PRODUCTION: 24 hours cooldown
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;
  
  // Calculate cooldown info
  let cooldownInfo = null;
  const isAdmin =  req.user.isAdmin === true;


if (!isAdmin && userData.dailyLimitLastUpdatedAt) {
  const lastUpdated = new Date(userData.dailyLimitLastUpdatedAt);
  const now = new Date();
  const msSinceUpdate = now.getTime() - lastUpdated.getTime();

  if (msSinceUpdate < COOLDOWN_MS) {
    const remainingMs = COOLDOWN_MS - msSinceUpdate;
    const totalMinutes = Math.floor(remainingMs / (1000 * 60));

    cooldownInfo = {
      active: true,
      remainingHours: Math.floor(totalMinutes / 60),
      remainingMinutes: totalMinutes % 60,
      nextUpdateAvailable: new Date(lastUpdated.getTime() + COOLDOWN_MS).toISOString(),
    };
  } else {
    cooldownInfo = { active: false, canUpdate: true };
  }
}


  if (limit === null) {
    return res.json({
      dailySpendLimit: null,
      spentToday: spentToday.toFixed(2),
      remaining: null,
      cooldown: cooldownInfo
    });
  }

  const limitNum = Number(limit);

  res.json({
    dailySpendLimit: limit,
    spentToday: spentToday.toFixed(2),
    remaining: Math.max(0, limitNum - spentToday).toFixed(2),
    cooldown: cooldownInfo
  });
});

 async function getTodaysCashSpend(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        // ✅ Track both deposits AND top-ups for daily spend limit
        or(
          eq(transactions.type, "deposit"), // For competition entries
          eq(transactions.type, "topup")    // For wallet top-ups
        ),
        gte(transactions.createdAt, startOfDay),
        lte(transactions.createdAt, endOfDay)
      )
    );

  return Number(result[0]?.total || 0);
}

  async function enforceDailySpendLimit(
    userId: string,
    newSpendAmount: number
  ) {
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

    if (isNaN(parsedDays) || parsedDays <= 0 || parsedDays > 365) {
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
    await db
      .update(users)
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
      await db
        .update(users)
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
        },
      });
    } catch (err) {
      console.error("Unsuspend error:", err);
      res.status(500).json({ success: false, message: "Failed to unsuspend" });
    }
  });

  app.post(
    "/api/wellbeing/close-account",
    isAuthenticated,
    async (req, res) => {
      const userId = req.user.id;

      try {
        // 1️⃣ Disable the account
        await db
          .update(users)
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
            message:
              "Your account has been disabled and you have been logged out.",
          });
        });
      } catch (err) {
        console.error("Account closure error:", err);
        res
          .status(500)
          .json({ success: false, message: "Failed to close account" });
      }
    }
  );

  app.post("/api/wellbeing/undo-close-account", async (req, res) => {
    const { userId, secret } = req.body;

    if (secret !== process.env.UNDO_CLOSE_SECRET) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      await db
        .update(users)
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
      res
        .status(500)
        .json({ success: false, message: "Failed to re-enable account" });
    }
  });

  // ================================================================================
// RINGTONE PLINKO GAME ROUTES - MAIN GAME ENDPOINTS
// ================================================================================
// This section contains all the gameplay endpoints for the Plinko game.
// Developers should copy this entire section to implement Plinko functionality.
// 
// ENDPOINTS IN THIS SECTION:
// 1. POST /api/create-plinko-order      - Creates a pending order for Plinko games
// 2. POST /api/play-plinko              - Plays a single Plinko drop (with physics result)
// 3. GET  /api/plinko-order/:orderId    - Gets order info and play history
// 4. POST /api/process-plinko-payment   - Processes payment for Plinko order
// 5. GET  /api/plinko-config            - Gets public Plinko config (prizes, settings)
// 6. POST /api/reveal-all-plinko        - Batch reveals all remaining plays at once
//
// REQUIRED TABLES (from schema.ts):
// - gamePlinkoConfig: Global settings (isActive, rows, freeReplayProbability)
// - plinkoPrizes: 8 prize slots with probability, maxWins, rewardType, rewardValue
// - plinkoUsage: Tracks how many plays used per order
// - plinkoWins: Records each play result (win/loss, prize, slot index)
// ================================================================================

// Plinko cooldown tracking - prevents rapid-fire plays (spam protection)
const plinkoCooldowns = new Map<string, number>();
const PLINKO_COOLDOWN_MS = 2000; // 2 second cooldown between plays

// ----------------------------------------
// ENDPOINT 1: Create Plinko Order
// ----------------------------------------
// POST /api/create-plinko-order
// Creates a pending order for the specified quantity of Plinko games.
// User must complete payment separately via /api/process-plinko-payment.
// Request body: { competitionId: string, quantity: number }
// Returns: { success: true, orderId: string, totalAmount: string, quantity: number }
app.post("/api/create-plinko-order", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { competitionId, quantity } = req.body;

    if (!competitionId || !quantity || quantity < 1) {
      return res.status(400).json({ message: "Competition ID and quantity are required" });
    }

    const competition = await storage.getCompetition(competitionId);
    if (!competition || competition.type !== "plinko") {
      return res.status(404).json({ message: "Plinko competition not found" });
    }

    const ticketPrice = parseFloat(competition.ticketPrice);
    
    // Calculate discount
    const { originalTotal, discountPercent, discountedTotal, savings } = 
      calculateDiscountedTotal(ticketPrice, quantity);

    const order = await storage.createOrder({
      userId,
      competitionId,
      quantity,
      totalAmount: discountedTotal.toFixed(2),
      paymentMethod: "pending",
      status: "pending",
    });

    res.json({
      success: true,
      orderId: order.id,
      totalAmount: discountedTotal.toFixed(2),
      originalAmount: originalTotal.toFixed(2),
      discountPercent,
      savings: savings.toFixed(2),
      quantity,
    });
  } catch (error) {
    console.error("Error creating Plinko order:", error);
    res.status(500).json({ message: "Failed to create Plinko order" });
  }
});

// ----------------------------------------
// ENDPOINT 2: Play Plinko (Single Drop)
// ----------------------------------------
// POST /api/play-plinko
// Executes a single Plinko ball drop. Server-side determines the winning slot
// based on prize probabilities and maxWins limits. Credits prizes to user wallet.
// Includes cooldown protection (2 seconds between plays).
// Request body: { orderId: string, competitionId: string }
// Returns: { success: true, slotIndex: number, prizeName: string, rewardType: string,
//           rewardValue: string, isWin: boolean, freeReplayGranted: boolean, ... }
// --- Add caches at the top ---
let cachedPlinkoConfig: any = null;
let cachedPlinkoPrizes: any[] = [];
let lastPlinkoCacheRefresh = 0;
const PLINKO_CACHE_TTL = 30000;

// Cache for play counts
const plinkoPlayCountCache = new Map<string, { count: number, expires: number }>();
const plinkoPrizeWinCache = new Map<string, Map<string, number>>();

async function getPlinkoConfigWithCache() {
  const now = Date.now();
  if (!cachedPlinkoConfig || now - lastPlinkoCacheRefresh > PLINKO_CACHE_TTL) {
    const [config] = await db.select().from(gamePlinkoConfig).where(eq(gamePlinkoConfig.id, "active"));
    cachedPlinkoConfig = config || { rows: 12, freeReplayProbability: "5.00", isActive: true };
    lastPlinkoCacheRefresh = now;
  }
  return cachedPlinkoConfig;
}

async function getPlinkoPrizesWithCache() {
  const now = Date.now();
  if (!cachedPlinkoPrizes.length || now - lastPlinkoCacheRefresh > PLINKO_CACHE_TTL) {
    cachedPlinkoPrizes = await db
      .select()
      .from(plinkoPrizes)
      .where(eq(plinkoPrizes.isActive, true))
      .orderBy(asc(plinkoPrizes.slotIndex));
    lastPlinkoCacheRefresh = now;
  }
  return cachedPlinkoPrizes;
}

app.post("/api/play-plinko", isAuthenticated, async (req: any, res) => {
  const requestStart = Date.now();
  
  try {
    const userId = req.user.id;
    const { orderId, competitionId } = req.body;

    if (!orderId || !competitionId) {
      return res.status(400).json({ success: false, message: "Order ID and Competition ID are required" });
    }

    // 1. Cooldown check
    const cooldownKey = `${userId}-${orderId}`;
    const lastPlayTime = plinkoCooldowns.get(cooldownKey) || 0;
    const now = Date.now();
    if (now - lastPlayTime < PLINKO_COOLDOWN_MS) {
      return res.status(429).json({ success: false, message: "Please wait a moment before playing again" });
    }

    // 2. PARALLELIZE all initial queries
    const [order, user, config, allPrizes] = await Promise.all([
      storage.getOrder(orderId),
      storage.getUser(userId),
      getPlinkoConfigWithCache(),
      getPlinkoPrizesWithCache()
    ]);

    // Validation checks
    if (!order || order.userId !== userId || order.status !== "completed") {
      return res.status(400).json({ success: false, message: "No valid Plinko game purchase found" });
    }
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!config.isActive) {
      return res.status(400).json({ success: false, message: "Ringtone Plinko is currently unavailable" });
    }
    if (!allPrizes.length) {
      return res.status(400).json({ success: false, message: "No prizes available" });
    }

    // 3. Get plays remaining (CACHED)
    let usedCount: number;
    const cachedCount = plinkoPlayCountCache.get(orderId);
    if (cachedCount && cachedCount.expires > now) {
      usedCount = cachedCount.count;
    } else {
      const playsUsed = await db.select({ count: sql<number>`count(*)` }).from(plinkoUsage).where(eq(plinkoUsage.orderId, orderId));
      usedCount = Number(playsUsed[0]?.count || 0);
      plinkoPlayCountCache.set(orderId, { count: usedCount, expires: now + 10000 });
    }

    const playsRemaining = order.quantity - usedCount;
    if (playsRemaining <= 0) {
      return res.status(400).json({ success: false, message: "No plays remaining in this purchase" });
    }

    // 4. Filter eligible prizes (check maxWins from cache)
    const eligiblePrizes = allPrizes.filter(prize => {
      if (prize.maxWins !== null && prize.quantityWon !== null && prize.quantityWon >= prize.maxWins) {
        return false;
      }
      return true;
    });

    if (!eligiblePrizes.length) {
      return res.status(400).json({ success: false, message: "No prizes available at this time" });
    }

    // 5. Weighted random selection
    const totalProbability = eligiblePrizes.reduce((sum, prize) => sum + parseFloat(prize.probability || "0"), 0);
    let random = Math.random() * totalProbability;
    let selectedPrize = eligiblePrizes[0];
    
    for (const prize of eligiblePrizes) {
      random -= parseFloat(prize.probability || "0");
      if (random <= 0) {
        selectedPrize = prize;
        break;
      }
    }

    const slotIndex = selectedPrize.slotIndex;
    const rewardType = selectedPrize.rewardType;
    const prizeValue = parseFloat(selectedPrize.prizeValue || "0");
    const prizeName = selectedPrize.prizeName || "Plinko Prize";
    const isWin = rewardType === "cash" || rewardType === "points" || rewardType === "physical";
    const isFreePlay = rewardType === "free_play";
    
    let rewardValueStr = "0";
    let segmentFreePlay = false;
    let totalFreePlays = 0;

    // 🚀 Get maxWins for sync (matching Pop pattern)
    const maxWins = selectedPrize.maxWins !== undefined && 
                    selectedPrize.maxWins !== null && 
                    selectedPrize.maxWins !== "" 
                      ? Number(selectedPrize.maxWins) 
                      : null;

    // 6. Record usage (fire-and-forget)
    db.insert(plinkoUsage).values({ orderId, userId })
      .catch(err => console.error("Failed to record plinko usage:", err));

    // 7. Process prize (matching Pop pattern)
    if (isWin) {
      rewardValueStr = prizeValue.toString();
      
      // CASH WIN
      if (rewardType === "cash") {
        const finalBalance = parseFloat(user.balance || "0") + prizeValue;
        storage.updateUserBalance(userId, finalBalance.toFixed(2)).catch(e => console.error(e));
        storage.createTransaction({
          userId, type: "prize", amount: prizeValue.toFixed(2),
          description: `Ringtone Plinko Win - £${prizeValue}`, status: "completed"
        }).catch(e => console.error(e));
        
        // 🚀 AUTO-SYNC CASH PRIZE (matching Pop pattern)
        syncPlinkoPrize(
          competitionId,
          selectedPrize.id || "unknown",
          prizeName,
          prizeValue,
          'cash',     // ✅ rewardType
          maxWins     // ✅ maxWins
        ).catch(e => console.error("Failed to sync plinko prize:", e));
        
      } 
      // POINTS WIN
      else if (rewardType === "points") {
        const newPoints = (user.ringtonePoints || 0) + prizeValue;
        db.update(users).set({ ringtonePoints: newPoints }).where(eq(users.id, userId))
          .catch(e => console.error(e));
        storage.createTransaction({
          userId, type: "ringtone_points", amount: `${prizeValue}.00`,
          description: `Ringtone Plinko Win - ${prizeValue} Points`, status: "completed"
        }).catch(e => console.error(e));
        
        // 🚀 AUTO-SYNC POINTS PRIZE (matching Pop pattern)
        syncPlinkoPrize(
          competitionId,
          selectedPrize.id || "unknown",
          prizeName,
          prizeValue,
          'points',   // ✅ rewardType
          maxWins     // ✅ maxWins
        ).catch(e => console.error("Failed to sync plinko prize:", e));
        
      } 
      // PHYSICAL WIN
      else if (rewardType === "physical") {
        storage.createTransaction({
          userId, type: "prize", amount: "0",
          description: `Physical Prize Won: ${prizeName} - Contact support`, status: "completed"
        }).catch(e => console.error(e));
        
        // 🚀 AUTO-SYNC PHYSICAL PRIZE (matching Pop pattern)
        syncPlinkoPrize(
          competitionId,
          selectedPrize.id || "unknown",
          prizeName,
          0,           // ✅ Physical prizes have no monetary value
          'physical',  // ✅ rewardType
          maxWins      // ✅ maxWins
        ).catch(e => console.error("Failed to sync plinko prize:", e));
      }
      
      // Increment quantityWon (fire-and-forget)
      db.update(plinkoPrizes)
        .set({ quantityWon: (selectedPrize.quantityWon || 0) + 1 })
        .where(eq(plinkoPrizes.id, selectedPrize.id))
        .catch(e => console.error(e));
        
    } else if (isFreePlay) {
      segmentFreePlay = true;
      rewardValueStr = "1";
      totalFreePlays++;
      
      db.update(orders).set({ quantity: order.quantity + 1 }).where(eq(orders.id, orderId))
        .catch(e => console.error(e));
      
      db.update(plinkoPrizes)
        .set({ quantityWon: (selectedPrize.quantityWon || 0) + 1 })
        .where(eq(plinkoPrizes.id, selectedPrize.id))
        .catch(e => console.error(e));
    } else {
      rewardValueStr = "0";
      db.update(plinkoPrizes)
        .set({ quantityWon: (selectedPrize.quantityWon || 0) + 1 })
        .where(eq(plinkoPrizes.id, selectedPrize.id))
        .catch(e => console.error(e));
    }

    // 8. Record win (fire-and-forget)
    db.insert(plinkoWins).values({
      orderId, userId, prizeId: selectedPrize.id, slotIndex,
      rewardType, rewardValue: rewardValueStr, isWin
    }).catch(e => console.error(e));

    // 9. Add to winners table (fire-and-forget)
    if (isWin) {
      let displayPrizeValue = "";
      if (rewardType === "cash") {
        displayPrizeValue = `£${prizeValue}`;
      } else if (rewardType === "points") {
        displayPrizeValue = `${prizeValue} Points`;
      } else if (rewardType === "physical") {
        displayPrizeValue = prizeName;
      }
      
      db.insert(winners).values({
        userId, competitionId,
        prizeDescription: `Plinko: ${prizeName}`,
        prizeValue: displayPrizeValue,
        prizeType: rewardType,
        createdAt: new Date(), updatedAt: new Date()
      }).catch(e => console.error(e));
    }

    // 10. Random Free Replay (configurable chance)
    const freeReplayChance = parseFloat(config.freeReplayProbability || "5.00") / 100;
    const gotFreeReplay = Math.random() < freeReplayChance;
    
    if (gotFreeReplay) {
      totalFreePlays++;
      db.update(orders).set({ quantity: order.quantity + 1 }).where(eq(orders.id, orderId))
        .catch(e => console.error(e));
    }

    // 11. Update cache
    plinkoPlayCountCache.set(orderId, { count: usedCount + 1, expires: now + 10000 });
    
    // 12. Set cooldown and send response
    plinkoCooldowns.set(cooldownKey, now);
    
    // Get fresh balance for response
    const [updatedUser] = await Promise.all([
      storage.getUser(userId),
    ]);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] /api/play-plinko took ${Date.now() - requestStart}ms`);
    }
    
    res.json({
      success: true,
      slotIndex,
      prizeName: prizeName,
      prizeValue: rewardValueStr,
      rewardType,
      isWin: isWin || isFreePlay,
      color: selectedPrize.color,
      freeReplay: gotFreeReplay,
      segmentFreePlay,
      playsRemaining: playsRemaining - 1 + totalFreePlays,
      newBalance: updatedUser?.balance || user.balance,
      newPoints: updatedUser?.ringtonePoints || user.ringtonePoints,
    });
    
  } catch (error) {
    console.error("Error playing Plinko:", error);
    res.status(500).json({ message: "Failed to play Plinko" });
  }
});

// --- Optimized Route ---
app.post("/api/reveal-all-plinko", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId, count, competitionId } = req.body;

    if (!orderId || !count || count <= 0 || !competitionId) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid orderId, count, and competitionId are required" 
      });
    }

    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId || order.status !== "completed") {
      return res.status(400).json({ 
        success: false, 
        message: "No valid Plinko game purchase found" 
      });
    }

    const playsUsed = await db.select({ count: sql<number>`count(*)` })
      .from(plinkoUsage)
      .where(eq(plinkoUsage.orderId, orderId));
    const usedCount = Number(playsUsed[0]?.count || 0);
    const playsRemaining = order.quantity - usedCount;

    if (playsRemaining <= 0) {
      return res.status(400).json({ success: false, message: "No plays remaining" });
    }

    const playsToProcess = Math.min(count, playsRemaining);
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const [config, allPrizes] = await Promise.all([
      getPlinkoConfigWithCache(),
      getPlinkoPrizesWithCache()
    ]);

    if (!config.isActive) {
      return res.status(400).json({ success: false, message: "Plinko is currently unavailable" });
    }

    let totalCash = 0;
    let totalPoints = 0;
    let totalFreePlays = 0;
    const results: any[] = [];
    const prizeSyncs: Array<{
      competitionId: string;
      prizeId: string;
      name: string;
      value: number;
      rewardType: string;
      maxWins: number | null;
    }> = [];

    await db.transaction(async (tx) => {
      const prizeWinCounts = new Map<string, number>();
      allPrizes.forEach(p => prizeWinCounts.set(p.id, p.quantityWon || 0));

      for (let i = 0; i < playsToProcess; i++) {
        // Filter eligible prizes
        const eligiblePrizes = allPrizes.filter(prize => {
          const currentWins = prizeWinCounts.get(prize.id) || 0;
          if (prize.maxWins !== null && currentWins >= prize.maxWins) return false;
          return true;
        });

        if (eligiblePrizes.length === 0) break;

        // Weighted random selection
        const totalProbability = eligiblePrizes.reduce(
          (sum, p) => sum + parseFloat(p.probability || "0"), 0
        );
        let random = Math.random() * totalProbability;
        let selectedPrize = eligiblePrizes[0];

        for (const prize of eligiblePrizes) {
          random -= parseFloat(prize.probability || "0");
          if (random <= 0) {
            selectedPrize = prize;
            break;
          }
        }

        const rewardType = selectedPrize.rewardType;
        const prizeValue = parseFloat(selectedPrize.prizeValue || "0");
        const isWin = rewardType === "cash" || rewardType === "points" || rewardType === "physical";
        const isFreePlay = rewardType === "free_play";

        // Record usage
        await tx.insert(plinkoUsage).values({ orderId, userId });

        if (isWin) {
          // Update win count
          prizeWinCounts.set(selectedPrize.id, (prizeWinCounts.get(selectedPrize.id) || 0) + 1);

          if (rewardType === "cash") {
            totalCash += prizeValue;
            
            await tx.insert(winners).values({
              userId, competitionId,
              prizeDescription: `Plinko: ${selectedPrize.prizeName}`,
              prizeValue: `£${prizeValue}`,
              prizeType: 'cash',
              createdAt: new Date(), updatedAt: new Date()
            });

          } else if (rewardType === "points") {
            totalPoints += prizeValue;
            
            await tx.insert(winners).values({
              userId, competitionId,
              prizeDescription: `Plinko: ${selectedPrize.prizeName}`,
              prizeValue: `${prizeValue} Points`,
              prizeType: 'points',
              createdAt: new Date(), updatedAt: new Date()
            });

          } else if (rewardType === "physical") {
            await tx.insert(winners).values({
              userId, competitionId,
              prizeDescription: `Plinko: ${selectedPrize.prizeName}`,
              prizeValue: selectedPrize.prizeName,
              prizeType: 'physical',
              createdAt: new Date(), updatedAt: new Date()
            });
          }

          // Track for sync
          const maxWins = selectedPrize.maxWins !== undefined && 
                          selectedPrize.maxWins !== null && 
                          selectedPrize.maxWins !== "" 
                            ? Number(selectedPrize.maxWins) 
                            : null;

          prizeSyncs.push({
            competitionId,
            prizeId: selectedPrize.id,
            name: selectedPrize.prizeName,
            value: rewardType === "physical" ? 0 : prizeValue,
            rewardType,
            maxWins
          });

        } else if (isFreePlay) {
          totalFreePlays++;
        }

        // Record win
        await tx.insert(plinkoWins).values({
          orderId, userId,
          prizeId: selectedPrize.id,
          slotIndex: selectedPrize.slotIndex,
          rewardType,
          rewardValue: isWin ? prizeValue.toString() : isFreePlay ? "1" : "0",
          isWin
        });

        results.push({
          slotIndex: selectedPrize.slotIndex,
          prizeName: selectedPrize.prizeName,
          prizeValue: isWin ? prizeValue : 0,
          rewardType,
          isWin: isWin || isFreePlay,
        });
      }

      // Update all prize win counts
      for (const [prizeId, count] of prizeWinCounts) {
        const originalPrize = allPrizes.find(p => p.id === prizeId);
        if (originalPrize && count > (originalPrize.quantityWon || 0)) {
          await tx.update(plinkoPrizes)
            .set({ quantityWon: count })
            .where(eq(plinkoPrizes.id, prizeId));
        }
      }

      // Update user balance
      if (totalCash > 0) {
        const finalBalance = parseFloat(user.balance || "0") + totalCash;
        await tx.update(users)
          .set({ balance: finalBalance.toFixed(2), updatedAt: new Date() })
          .where(eq(users.id, userId));
        
        await tx.insert(transactions).values({
          userId, type: "prize",
          amount: totalCash.toFixed(2),
          description: `Plinko Batch Win - £${totalCash.toFixed(2)}`,
          createdAt: new Date()
        });
      }

      // Update user points
      if (totalPoints > 0) {
        const newPoints = (user.ringtonePoints || 0) + totalPoints;
        await tx.update(users)
          .set({ ringtonePoints: newPoints })
          .where(eq(users.id, userId));
        
        await tx.insert(transactions).values({
          userId, type: "ringtone_points",
          amount: totalPoints.toString(),
          description: `Plinko Batch Win - ${totalPoints} pts`,
          createdAt: new Date()
        });
      }

      // Apply free replays
      if (totalFreePlays > 0) {
        await tx.update(orders)
          .set({ quantity: order.quantity + totalFreePlays })
          .where(eq(orders.id, orderId));
      }
    });

    // 🚀 AUTO-SYNC PRIZES (Outside transaction)
    if (prizeSyncs.length > 0) {
      for (const sync of prizeSyncs) {
        try {
          await syncPlinkoPrize(
            sync.competitionId,
            sync.prizeId,
            sync.name,
            sync.value,
            sync.rewardType,
            sync.maxWins
          );
          console.log(`✅ Synced plinko prize: ${sync.name} (${sync.rewardType})`);
        } catch (err) {
          console.error(`Failed to sync plinko prize ${sync.name}:`, err);
        }
      }
    }

    res.json({
      success: true,
      processed: playsToProcess,
      results,
      totalWon: totalCash,
      totalPoints,
      totalFreePlays,
      prizesSynced: prizeSyncs.length,
      playsRemaining: playsRemaining - playsToProcess + totalFreePlays,
    });

  } catch (error) {
    console.error("Error revealing all plinko games:", error);
    res.status(500).json({ message: "Failed to reveal all plinko games" });
  }
});
// ----------------------------------------
// ENDPOINT 3: Get Plinko Order Info
// ----------------------------------------
// GET /api/plinko-order/:orderId
// Retrieves order details including total plays purchased, plays used,
// plays remaining, play history with results, and total winnings.
// Used by frontend to display game state and progress.
// Returns: { order, totalPlays, playsUsed, playsRemaining, playHistory, totalCashWon, totalPointsWon }
app.get("/api/plinko-order/:orderId", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order not found" });
    }

    const user = await storage.getUser(userId);
    const competition = await storage.getCompetition(order.competitionId);
    const plinkoCost = parseFloat(competition?.ticketPrice || "2");

    // Get plays used
    const playsUsed = await db
      .select({ count: sql<number>`count(*)` })
      .from(plinkoUsage)
      .where(eq(plinkoUsage.orderId, orderId));
    
    const usedCount = Number(playsUsed[0]?.count || 0);

    // Get play history
    const history = await db
      .select()
      .from(plinkoWins)
      .where(eq(plinkoWins.orderId, orderId))
      .orderBy(desc(plinkoWins.wonAt));

    res.json({
      success: true,
      order: {
        id: order.id,
        competitionId: order.competitionId,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        status: order.status,
        discountAmount: order.discountAmount || 0,
    discountType: order.discountType || null,
    percentageDiscount: order.percentageDiscount || 0, 

      },
      user: {
        balance: user?.balance || "0",
        ringtonePoints: user?.ringtonePoints || 0,
      },
      competition: competition,
      plinkoCost: plinkoCost,
      playsUsed: usedCount,
      playsRemaining: order.quantity - usedCount,
      history,
    });
  } catch (error) {
    console.error("Error fetching Plinko order:", error);
    res.status(500).json({ message: "Failed to fetch Plinko order" });
  }
});

// ----------------------------------------
// ENDPOINT 4: Process Plinko Payment
// ----------------------------------------
// POST /api/process-plinko-payment
// Completes payment for a pending Plinko order using wallet balance and/or points.
// Deducts from user wallet/points, marks order as completed, creates transaction
// records, and generates ticket entries for the order.
// Request body: { orderId: string, useWalletBalance?: boolean, useRingtonePoints?: boolean }
// Returns: { success: true, message: string, competitionId, orderId }
app.post("/api/process-plinko-payment", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId, useWalletBalance = false, useRingtonePoints = false, useInstaplay = false } = req.body;

    // Fetch order from database
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    
    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order already processed" });
    }

    // Get competition
    const [competition] = await db.select().from(competitions).where(eq(competitions.id, order.competitionId));
    
    if (!competition || competition.type !== "plinko") {
      return res.status(400).json({ message: "Invalid competition type" });
    }

    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    // Handle Instaplay - direct card payment without wallet
    if (useInstaplay) {
      const totalAmount = Number(order.totalAmount);
      
      // Create Cashflows session for instant play
      const session = await cashflows.createCompetitionPaymentSession(
        totalAmount,
        {
          orderId,
          competitionId: order.competitionId,
          userId,
          quantity: order.quantity.toString(),
          paymentType: 'instant_play', // Mark as instant play
          gameType: 'plinko'
        }
      );

      if (!session.hostedPageUrl) {
        return res.status(500).json({ message: "Failed to create payment session" });
      }

      // Create pending payment record for instant play
      await db.insert(pendingPayments).values({
        userId,
        orderId: order.id,
        paymentJobReference: session.paymentJobReference,
        paymentType: 'instant_play',
        amount: totalAmount.toString(),
        metadata: {
          competitionId: competition.id,
          competitionTitle: competition.title,
          gameType: 'plinko',
          quantity: order.quantity
        },
        status: 'pending',
        createdAt: new Date()
      });

      // Update order with payment info
      await db.update(orders)
        .set({ 
          paymentMethod: "instaplay",
          cashflowsAmount: totalAmount.toString(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

      return res.json({
        success: true,
        redirectUrl: session.hostedPageUrl,
        sessionId: session.paymentJobReference,
        paymentType: 'instaplay',
        message: "Redirecting to payment..."
      });
    }

    // Total already includes discount if applied
    const totalAmount = Number(order.totalAmount);
    let remainingAmount = totalAmount;
    let walletUsed = 0;
    let pointsUsed = 0;

    const paymentBreakdown = [];

    // Process wallet balance if selected
    if (useWalletBalance) {
      const walletBalance = Number(user?.balance) || 0;
      const walletAmount = Math.min(walletBalance, remainingAmount);

      if (walletAmount > 0) {
        walletUsed = walletAmount;
        remainingAmount -= walletUsed;
        paymentBreakdown.push({ 
          method: "wallet", 
          amount: walletAmount,
          description: `Wallet: £${walletAmount.toFixed(2)}`
        });
      }
    }

    // Process ringtone points if selected - SIMPLE, NO DISCOUNT LOGIC
    if (useRingtonePoints && remainingAmount > 0) {
      const availablePoints = user?.ringtonePoints || 0;
      
      // Calculate points needed for remaining amount (100 points = £1.00)
      const pointsNeeded = Math.ceil(remainingAmount * 100);
      
      // Check if user has enough points
      if (availablePoints < pointsNeeded) {
        // Refund wallet if used
        if (walletUsed > 0) {
          const currentBalance = Number(user?.balance) || 0;
          await db.update(users)
            .set({ balance: (currentBalance + walletUsed).toString() })
            .where(eq(users.id, userId));
        }
        
        return res.status(400).json({ 
          message: `Insufficient points. You need ${pointsNeeded} points. You have ${availablePoints} points.`,
          remainingAmount,
          pointsNeeded
        });
      }
      
      // Calculate cash value of points used
      const pointsAmount = pointsNeeded * 0.01;
      
      pointsUsed = pointsNeeded;
      remainingAmount -= pointsAmount;
      
      if (pointsUsed > 0) {
        paymentBreakdown.push({
          method: "ringtone_points",
          amount: pointsAmount,
          pointsUsed: pointsNeeded,
          description: `Ringtone Points: £${pointsAmount.toFixed(2)} (${pointsNeeded} points)`,
        });
      }
    }

    // If remaining, need Cashflows
    if (remainingAmount > 0.01) {
      return res.json({
        success: false,
        message: "Card payment required for remaining balance",
        remainingAmount,
        requiresCashflows: true,
      });
    }

    // Complete payment with wallet/points only
    if (walletUsed > 0) {
      const newBalance = Number(user?.balance || "0") - walletUsed;
      await db.update(users)
        .set({ balance: newBalance.toString() })
        .where(eq(users.id, userId));
    }

    if (pointsUsed > 0) {
      const newPoints = (user?.ringtonePoints || 0) - pointsUsed;
      await db.update(users)
        .set({ ringtonePoints: newPoints })
        .where(eq(users.id, userId));
    }

    // Update order status and payment info
    let paymentMethodText = "Discount";
    if (walletUsed > 0 && pointsUsed > 0) {
      paymentMethodText = "Wallet+Points";
    } else if (walletUsed > 0) {
      paymentMethodText = "Wallet";
    } else if (pointsUsed > 0) {
      paymentMethodText = "Points";
    }
    
    await db.update(orders)
      .set({ 
        status: "completed",
        paymentMethod: paymentMethodText,
        walletAmount: walletUsed.toString(),
        pointsAmount: pointsUsed.toString(),
        cashflowsAmount: "0",
        paymentBreakdown: JSON.stringify(paymentBreakdown),
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));

    // Create transaction record
    await db.insert(transactions).values({
      userId,
      type: "plinko_purchase",
      amount: totalAmount.toFixed(2),
      description: `Plinko Game Purchase - ${order.quantity} games`,
      orderId: orderId,
      createdAt: new Date(),
    });

    // Update competition sold tickets count
    const newSoldTickets = (competition.soldTickets || 0) + order.quantity;
    
    await db.update(competitions)
      .set({ 
        soldTickets: newSoldTickets,
        updatedAt: new Date()
      })
      .where(eq(competitions.id, competition.id));

    // Create tickets for plinko game entries
    const plinkoTickets = [];
    for (let i = 0; i < order.quantity; i++) {
      const ticketNumber = `PLINKO-${orderId.slice(0, 8).toUpperCase()}-${(i + 1).toString().padStart(3, '0')}`;
      const [ticket] = await db.insert(tickets).values({
        userId,
        competitionId: order.competitionId,
        orderId: order.id,
        ticketNumber,
        isWinner: false,
        createdAt: new Date(),
      }).returning();
      plinkoTickets.push(ticket);
    }

    res.json({
      success: true,
      message: "Plinko game purchase complete!",
      competitionId: order.competitionId,
      orderId: order.id,
      quantity: order.quantity,
      soldTickets: newSoldTickets,
      paymentBreakdown,
    });
  } catch (error) {
    console.error("Error processing Plinko payment:", error);
    res.status(500).json({ message: "Failed to process Plinko payment" });
  }
});

// ----------------------------------------
// ENDPOINT 5: Get Plinko Config (Public)
// ----------------------------------------
// GET /api/plinko-config
// Public endpoint - returns Plinko game configuration for the frontend.
// Used to display prize slots, probabilities, and game settings.
// No authentication required.
// Returns: { config: { isActive, rows, freeReplayProbability }, prizes: [...] }
app.get("/api/plinko-config", async (req, res) => {
  try {
    const [config] = await db.select().from(gamePlinkoConfig).where(eq(gamePlinkoConfig.id, "active"));
    const prizes = await db
      .select()
      .from(plinkoPrizes)
      .where(eq(plinkoPrizes.isActive, true))
      .orderBy(asc(plinkoPrizes.slotIndex));
    
    res.json({
      isVisible: config?.isVisible ?? true,
      isActive: config?.isActive ?? true,
      rows: config?.rows ?? 12,
      prizes: prizes.map(p => ({
        slotIndex: p.slotIndex,
        prizeName: p.prizeName,
        prizeValue: p.prizeValue,
        rewardType: p.rewardType,
        color: p.color,
      })),
    });
  } catch (error) {
    console.error("Error fetching Plinko config:", error);
    res.status(500).json({ message: "Failed to fetch Plinko configuration" });
  }
});

// ----------------------------------------
// ENDPOINT 6: Reveal All Remaining Plinko Plays
// ----------------------------------------
// POST /api/reveal-all-plinko
// Batch processes all remaining plays for an order at once.
// Determines results for each play, credits winnings, checks for free replays,
// and returns a summary of all results.
// Request body: { orderId: string, competitionId: string }
// Returns: { success: true, results: [...], totalCashWon, totalPointsWon, freeReplaysGranted }

app.post("/api/reveal-all-plinko", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId, competitionId } = req.body;

    if (!orderId || !competitionId) {
      return res.status(400).json({
        success: false,
        message: "Order ID and Competition ID are required",
      });
    }

    // Verify valid completed order
    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId || order.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "No valid Plinko game purchase found",
      });
    }

    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get plays remaining
    const playsUsed = await db
      .select({ count: sql<number>`count(*)` })
      .from(plinkoUsage)
      .where(eq(plinkoUsage.orderId, orderId));
    
    const usedCount = Number(playsUsed[0]?.count || 0);
    let playsRemaining = order.quantity - usedCount;

    if (playsRemaining <= 0) {
      return res.status(400).json({
        success: false,
        message: "No plays remaining",
      });
    }

    // Get Plinko config
    const [config] = await db.select().from(gamePlinkoConfig).where(eq(gamePlinkoConfig.id, "active"));
    const freeReplayChance = parseFloat(config?.freeReplayProbability || "5.00") / 100;

    // Get all prizes
    const allPrizes = await db
      .select()
      .from(plinkoPrizes)
      .where(eq(plinkoPrizes.isActive, true))
      .orderBy(asc(plinkoPrizes.slotIndex));

    const results: any[] = [];
    let totalCashWon = 0;
    let totalPointsWon = 0;
    let freeReplaysGranted = 0;
    const prizeSyncs = []; // Track prizes to sync

    // Process all remaining plays
    while (playsRemaining > 0) {
      // Filter eligible prizes
      const eligiblePrizes = allPrizes.filter(prize => {
        if (prize.maxWins !== null && prize.quantityWon !== null && prize.quantityWon >= prize.maxWins) {
          return false;
        }
        return true;
      });

      if (eligiblePrizes.length === 0) break;

      // Weighted random selection
      const totalProbability = eligiblePrizes.reduce((sum, prize) => sum + parseFloat(prize.probability || "0"), 0);
      let random = Math.random() * totalProbability;
      let selectedPrize = eligiblePrizes[0];

      for (const prize of eligiblePrizes) {
        random -= parseFloat(prize.probability || "0");
        if (random <= 0) {
          selectedPrize = prize;
          break;
        }
      }

      const prizeValue = parseFloat(selectedPrize.prizeValue || "0");
      const isWin = selectedPrize.rewardType === "cash" || selectedPrize.rewardType === "points";

      // Record usage
      await db.insert(plinkoUsage).values({ orderId, userId });

      // Process prize
      if (isWin) {
        if (selectedPrize.rewardType === "cash") {
          totalCashWon += prizeValue;
        } else if (selectedPrize.rewardType === "points") {
          totalPointsWon += prizeValue;
        }

        // Increment quantityWon
        selectedPrize.quantityWon = (selectedPrize.quantityWon || 0) + 1;
        await db
          .update(plinkoPrizes)
          .set({ quantityWon: selectedPrize.quantityWon })
          .where(eq(plinkoPrizes.id, selectedPrize.id));

        // Track for auto-sync
        prizeSyncs.push({
          competitionId,
          prizeId: selectedPrize.id,
          name: selectedPrize.prizeName,
          value: prizeValue
        });
      }

      // Record win/loss
      await db.insert(plinkoWins).values({
        orderId,
        userId,
        prizeId: selectedPrize.id,
        slotIndex: selectedPrize.slotIndex,
        rewardType: selectedPrize.rewardType,
        rewardValue: prizeValue.toString(),
        isWin,
      });

      // Record win in main winners table for admin visibility
      if (isWin && selectedPrize.rewardType !== "try_again") {
        await db.insert(winners).values({
          userId,
          competitionId,
          prizeDescription: `Plinko: ${selectedPrize.prizeName}`,
          prizeValue: prizeValue.toString(),
        });
      }

      // Check for free replay
      if (Math.random() < freeReplayChance) {
        freeReplaysGranted++;
        playsRemaining++; // Add the free replay
      }

      results.push({
        slotIndex: selectedPrize.slotIndex,
        prizeName: selectedPrize.prizeName,
        prizeValue: prizeValue.toString(),
        rewardType: selectedPrize.rewardType,
        isWin,
        color: selectedPrize.color,
      });

      playsRemaining--;
    }

    // Award accumulated prizes
    if (totalCashWon > 0) {
      const finalBalance = parseFloat(user.balance || "0") + totalCashWon;
      await storage.updateUserBalance(userId, finalBalance.toFixed(2));
      await storage.createTransaction({
        userId,
        type: "prize",
        amount: totalCashWon.toFixed(2),
        description: `Ringtone Plinko Reveal All - £${totalCashWon}`,
        status: "completed",
      });
    }

    if (totalPointsWon > 0) {
      const currentPoints = user.ringtonePoints || 0;
      await db.update(users).set({ ringtonePoints: currentPoints + totalPointsWon }).where(eq(users.id, userId));
      await storage.createTransaction({
        userId,
        type: "ringtone_points",
        amount: totalPointsWon.toString(),
        description: `Ringtone Plinko Reveal All - ${totalPointsWon} Points`,
        status: "completed",
      });
    }

    // --------------------------------------
    // 🚀 AUTO-SYNC PRIZES (Outside transaction)
    // --------------------------------------
    if (prizeSyncs.length > 0) {
      // Sync each prize
      for (const sync of prizeSyncs) {
        try {
          await syncPlinkoPrize(
            sync.competitionId,
            sync.prizeId,
            sync.name,
            sync.value
          );
          console.log(`✅ Synced plinko prize: ${sync.name}`);
        } catch (err) {
          console.error(`Failed to sync plinko prize ${sync.name}:`, err);
          // Continue - don't fail the whole batch
        }
      }
    }

    // Get updated user
    const updatedUser = await storage.getUser(userId);

    res.json({
      success: true,
      results,
      totalCashWon,
      totalPointsWon,
      freeReplaysGranted,
      prizesSynced: prizeSyncs.length,
      newBalance: updatedUser?.balance || user.balance,
      newPoints: updatedUser?.ringtonePoints || user.ringtonePoints,
    });
  } catch (error) {
    console.error("Error revealing all Plinko:", error);
    res.status(500).json({ message: "Failed to reveal all Plinko plays" });
  }
});



 // Update your withdrawal request schema


const withdrawalRequestInputSchema = z
  .object({
    amount: z
      .string()
      .refine((val) => !isNaN(Number(val)), "Amount must be a number")
      .refine((val) => Number(val) >= 5, {
        message: "Minimum withdrawal amount is £5",
      }),

    // Manual details (optional)
    accountName: z.string().trim().min(1).optional(),
    accountNumber: z
      .string()
      .trim()
      .regex(/^\d{8}$/, "Account number must be 8 digits")
      .optional(),
    sortCode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Sort code must be 6 digits")
      .optional(),

    // Saved account option
    savedAccountId: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      const hasSaved = !!data.savedAccountId;
      const hasManual =
        !!data.accountName && !!data.accountNumber && !!data.sortCode;

      return (hasSaved && !hasManual) || (!hasSaved && hasManual);
    },
    {
      message: "Either provide a saved account ID OR all account details",
      path: ["savedAccountId"],
    }
  );



// Update the withdrawal endpoint - COMPLETE VERSION
app.post("/api/withdrawal-requests", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ VALIDATE RAW REQUEST
    const parsed = withdrawalRequestInputSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid withdrawal request data",
        errors: parsed.error.issues,
      });
    }
    
    const [verifiedUser] = await db
      .select({ isVerified: users.isVerified, balance: users.balance })
      .from(users)
      .where(eq(users.id, userId));

    if (!verifiedUser?.isVerified) {
      return res.status(400).json({
        error: "Account verification required",
        message: "Please complete ID verification before withdrawing funds. Visit the Verification tab.",
        code: "VERIFICATION_REQUIRED"
      });
    }

    const {
      amount,
      savedAccountId,
      accountName,
      accountNumber,
      sortCode,
    } = parsed.data;

    // 2️⃣ RESOLVE ACCOUNT DETAILS
    let finalAccountName: string;
    let finalAccountNumber: string;
    let finalSortCode: string;

    if (savedAccountId) {
      const [savedAccount] = await db
        .select()
        .from(savedBankAccounts)
        .where(
          and(
            eq(savedBankAccounts.id, savedAccountId),
            eq(savedBankAccounts.userId, userId),
            eq(savedBankAccounts.isActive, true)
          )
        );

      if (!savedAccount) {
        return res
          .status(404)
          .json({ message: "Saved bank account not found" });
      }

      finalAccountName = savedAccount.accountName;
      finalAccountNumber = savedAccount.accountNumber;
      finalSortCode = savedAccount.sortCode;
    } else {
      finalAccountName = accountName!;
      finalAccountNumber = accountNumber!;
      finalSortCode = sortCode!;
    }

    // 3️⃣ CHECK USER & BALANCE
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentBalance = Number(user.balance);
    const withdrawalAmount = Number(amount);

    if (currentBalance < withdrawalAmount) {
      return res.status(400).json({
        message: "Insufficient balance for this withdrawal request",
      });
    }

    // 4️⃣ DEDUCT BALANCE
    const newBalance = (currentBalance - withdrawalAmount).toFixed(2);
    await storage.updateUserBalance(userId, newBalance);

    // 5️⃣ CREATE WITHDRAWAL REQUEST
    await storage.createWithdrawalRequest({
      userId,
      amount,
      accountName: finalAccountName,
      accountNumber: finalAccountNumber,
      sortCode: finalSortCode,
      status: "pending",
      adminHasUnread: true,
    });

    // 6️⃣ CREATE TRANSACTION
    await storage.createTransaction({
      userId,
      type: "withdrawal",
      amount: `-${withdrawalAmount}`,
      description: `Withdrawal request to ${finalAccountName}`,
    });

    // 7️⃣ RESPONSE
    res.status(201).json({
      message:
        "Withdrawal request submitted successfully. The amount has been deducted from your balance.",
      newBalance,
    });
  } catch (error: any) {
    console.error("Withdrawal error:", error);
    res.status(500).json({
      message: error.message || "Failed to create withdrawal request",
    });
  }
});


  app.post(
  "/api/admin/withdrawals/mark-read",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      await storage.markAdminWithdrawalsAsRead();
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to mark withdrawals read:", err);
      res.status(500).json({ message: "Failed to mark withdrawals read" });
    }
  }
);
  app.post(
  "/api/admin/verification/mark-read",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      await storage.markAdminVerificationAsRead();
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to mark verification read:", err);
      res.status(500).json({ message: "Failed to mark verification read" });
    }
  }
);


  app.get(
    "/api/withdrawal-requests/me",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const requests = await storage.getUserWithdrawalRequests(userId);
        res.json(requests);
      } catch (error) {
        console.error("Error fetching user withdrawal requests:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch withdrawal requests" });
      }
    }
  );

  app.get(
    "/api/admin/withdrawal-requests",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const requests = await storage.getWithdrawalRequests();

        // Enrich with user details
        const enrichedRequests = await Promise.all(
          requests.map(async (request) => {
            const user = await storage.getUser(request.userId);
            return {
              ...request,
              user: user
                ? {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    balance: user.balance,
                    ringtonePoints: user.ringtonePoints,
                  }
                : null,
            };
          })
        );

        res.json(enrichedRequests);
      } catch (error) {
        console.error("Error fetching withdrawal requests:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch withdrawal requests" });
      }
    }
  );

  app.patch(
    "/api/admin/withdrawal-requests/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        const processedBy = req.user.id;

        if (
          !status ||
          !["approved", "rejected", "processed"].includes(status)
        ) {
          return res
            .status(400)
            .json({
              message:
                "Invalid status. Must be 'approved', 'rejected', or 'processed'",
            });
        }

        // Get the withdrawal request
        const request = await storage.getWithdrawalRequest(id);
        if (!request) {
          return res
            .status(404)
            .json({ message: "Withdrawal request not found" });
        }

        if (request.status !== "pending") {
          return res
            .status(400)
            .json({ message: "This request has already been processed" });
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
          request: updated,
        });
      } catch (error) {
        console.error("Error updating withdrawal request:", error);
        res
          .status(500)
          .json({ message: "Failed to update withdrawal request" });
      }
    }
  );

// bank details user


// Get user's saved bank accounts
app.get("/api/saved-bank-accounts", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const accounts = await db
      .select()
      .from(savedBankAccounts)
      .where(and(
        eq(savedBankAccounts.userId, userId),
        eq(savedBankAccounts.isActive, true)
      ))
      .orderBy(desc(savedBankAccounts.isDefault), desc(savedBankAccounts.createdAt));
    
    // Mask account number for security
    const maskedAccounts = accounts.map(account => ({
      ...account,
      accountNumber: `****${account.accountNumber.slice(-4)}`,
      sortCode: account.sortCode // You might want to mask this too
    }));
    
    res.json(maskedAccounts);
  } catch (error) {
    console.error("Error fetching saved bank accounts:", error);
    res.status(500).json({ message: "Failed to fetch saved bank accounts" });
  }
});

// Save a new bank account
app.post("/api/saved-bank-accounts", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { accountName, accountNumber, sortCode, isDefault = false } = req.body;
    
    // Validate input
    if (!accountName || !accountNumber || !sortCode) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Validate account number (8 digits)
    if (!/^\d{8}$/.test(accountNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ message: "Account number must be 8 digits" });
    }
    
    // Validate sort code (6 digits)
    if (!/^\d{6}$/.test(sortCode.replace(/-/g, ''))) {
      return res.status(400).json({ message: "Sort code must be 6 digits" });
    }
    
    // Clean the inputs
    const cleanAccountNumber = accountNumber.replace(/\s/g, '');
    const cleanSortCode = sortCode.replace(/-/g, '');
    
    // Check if this account already exists
    const existing = await db
      .select()
      .from(savedBankAccounts)
      .where(and(
        eq(savedBankAccounts.userId, userId),
        eq(savedBankAccounts.accountNumber, cleanAccountNumber),
        eq(savedBankAccounts.sortCode, cleanSortCode),
        eq(savedBankAccounts.isActive, true)
      ));
    
    if (existing.length > 0) {
      return res.status(400).json({ message: "This bank account is already saved" });
    }
    
    // If this is set as default, unset any existing default
    if (isDefault) {
      await db
        .update(savedBankAccounts)
        .set({ isDefault: false })
        .where(and(
          eq(savedBankAccounts.userId, userId),
          eq(savedBankAccounts.isActive, true)
        ));
    }
    
    // Save the new account
    const [savedAccount] = await db
      .insert(savedBankAccounts)
      .values({
        userId,
        accountName,
        accountNumber: cleanAccountNumber,
        sortCode: cleanSortCode,
        isDefault
      })
      .returning();
    
    // Return masked version
    res.json({
      ...savedAccount,
      accountNumber: `****${cleanAccountNumber.slice(-4)}`
    });
  } catch (error) {
    console.error("Error saving bank account:", error);
    res.status(500).json({ message: "Failed to save bank account" });
  }
});

// Delete a saved bank account (soft delete)
app.delete("/api/saved-bank-accounts/:id", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Verify the account belongs to the user
    const account = await db
      .select()
      .from(savedBankAccounts)
      .where(and(
        eq(savedBankAccounts.id, id),
        eq(savedBankAccounts.userId, userId),
        eq(savedBankAccounts.isActive, true)
      ));
    
    if (account.length === 0) {
      return res.status(404).json({ message: "Bank account not found" });
    }
    
    // Soft delete
    await db
      .update(savedBankAccounts)
      .set({ isActive: false })
      .where(eq(savedBankAccounts.id, id));
    
    res.json({ success: true, message: "Bank account removed" });
  } catch (error) {
    console.error("Error deleting bank account:", error);
    res.status(500).json({ message: "Failed to delete bank account" });
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
      
      // Filter out archived competitions at the database level
      conditions.push(eq(competitions.isActive, true));
      
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

      res.json(
        allEntries.map((entry) => ({
          id: entry.tickets.id,
          ticketNumber: entry.tickets.ticketNumber,
          user: entry.users
            ? {
                id: entry.users.id,
                firstName: entry.users.firstName,
                lastName: entry.users.lastName,
                email: entry.users.email,
              }
            : null,
          competition: entry.competitions
            ? {
                id: entry.competitions.id,
                title: entry.competitions.title,
                type: entry.competitions.type,
                isActive: entry.competitions.isActive, // Add this line
              }
            : null,
          isWinner: entry.tickets.isWinner,
          prizeAmount: entry.tickets.prizeAmount,
          createdAt: entry.tickets.createdAt,
        }))
      );
    } catch (error) {
      console.error("Error fetching entries:", error);
      res.status(500).json({ message: "Failed to fetch entries" });
    }
  });

  // Delete entry
  app.delete(
    "/api/admin/entries/:id",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
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
    }
  );

  app.get(
    "/api/admin/entries/download/:competitionId",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
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
          return res
            .status(404)
            .json({ message: "No entries found for this competition" });
        }

        // Helper function to properly escape CSV cells
        const escapeCSV = (value: any): string => {
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          // Escape quotes by doubling them and wrap in quotes if contains comma, newline, or quote
          if (
            stringValue.includes('"') ||
            stringValue.includes(",") ||
            stringValue.includes("\n")
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return `"${stringValue}"`;
        };

        // Generate CSV content
        const headers = [
          "Ticket Number",
          "User Name",
          "User Email",
          "Is Winner",
          "Prize Amount",
          "Entry Date",
        ];
        const rows = entries.map((entry) => [
          escapeCSV(entry.tickets.ticketNumber),
          escapeCSV(
            `${entry.users?.firstName || ""} ${
              entry.users?.lastName || ""
            }`.trim()
          ),
          escapeCSV(entry.users?.email || ""),
          escapeCSV(entry.tickets.isWinner ? "Yes" : "No"),
          escapeCSV(entry.tickets.prizeAmount || "0.00"),
          escapeCSV(
            entry.tickets.createdAt
              ? new Date(entry.tickets.createdAt).toLocaleString()
              : ""
          ),
        ]);

        // Create CSV string
        const csvContent = [
          headers.map((h) => escapeCSV(h)).join(","),
          ...rows.map((row) => row.join(",")),
        ].join("\n");

        const competitionTitle =
          entries[0].competitions?.title || "competition";
        const sanitizedTitle = competitionTitle
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase();

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${sanitizedTitle}_entries.csv"`
        );
        res.send(csvContent);
      } catch (error) {
        console.error("Error downloading entries CSV:", error);
        res.status(500).json({ message: "Failed to download entries CSV" });
      }
    }
  );

  // ====== WINNERS PUBLIC ENDPOINTS ======
  app.get("/api/winners", async (req, res) => {
    try {
      // Check if showcase parameter is provided
      const showcaseOnly = req.query.showcase === "true";
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;

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
    const { firstName, lastName, competitionId, prizeDescription, prizeValue, imageUrl } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !prizeDescription || !prizeValue) {
      return res.status(400).json({
        message: "firstName, lastName, prizeDescription, and prizeValue are required",
      });
    }

    // Step 1: Create a temporary user
    const tempEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}@temp.com`;
    const tempPassword = "temporary123";
    
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Check if user already exists with this email
    let user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, tempEmail),
    });

    if (!user) {
      // Create new user
      const newUser = await db.insert(users).values({
        firstName,
        lastName,
        email: tempEmail,
        password: hashedPassword,
        isAdmin: false,
        createdAt: new Date(),
        balance: 0,
        ringtonePoints: 0,
      }).returning();
      
      user = newUser[0];
    }

    // Step 2: Create the winner linked to the user
    const winner = await storage.createWinner({
      userId: user.id,
      competitionId: competitionId || null,
      prizeDescription,
      prizeValue,
      imageUrl: imageUrl || null,
      isShowcase: true,
    });

    res.json(winner);
  } catch (error) {
    console.error("Error creating winner:", error);
    res.status(500).json({ message: "Failed to create winner" });
  }
});

  app.patch(
    "/api/admin/winners/:id",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const {
          userId,
          competitionId,
          prizeDescription,
          prizeValue,
          imageUrl,
          isShowcase,
        } = req.body;

        const existingWinner = await storage.getWinner(id);
        if (!existingWinner) {
          return res.status(404).json({ message: "Winner not found" });
        }

        const updateData: any = {};
        if (userId !== undefined) updateData.userId = userId;
        if (competitionId !== undefined)
          updateData.competitionId =
            competitionId === null || competitionId === ""
              ? null
              : competitionId;
        if (prizeDescription !== undefined)
          updateData.prizeDescription = prizeDescription;
        if (prizeValue !== undefined) updateData.prizeValue = prizeValue;
        if (imageUrl !== undefined)
          updateData.imageUrl =
            imageUrl === null || imageUrl === "" ? null : imageUrl;
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
    }
  );

  app.delete(
    "/api/admin/winners/:id",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
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
    }
  );

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

  app.delete("/api/delete", async (req, res) => {
    try {
      console.log("🗑️ Deleting all competitions...");
      await db.delete(transactions).execute();
      // 1. Delete tickets linked to competitions
      await db.delete(tickets).execute();
      // 2. Delete orders linked to competitions
      await db.delete(orders).execute();
      const result = await db.delete(competitions).execute();
      console.log("✅ Delete result:", result);
      res.status(200).json({ message: "all competitions deleted" });
    } catch (error) {
      console.error("❌ Delete failed:", error);
      res.status(500).json({ message: "Failed to delete competitions" });
    }
  });

  app.delete("/api/test-delete", (req, res) => {
    res.json({ message: "Delete route works!" });
  });

  // Admin routes would go here (protected by isAdmin middleware)
  // Admin Routes

  // Get admin dashboard stats
  app.get(
    "/api/admin/dashboard",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        // Get total users
        const totalUsers = await db
          .select({ count: sql<number>`count(*)` })
          .from(users);

        // Get total competitions
        const totalCompetitions = await db
          .select({ count: sql<number>`count(*)` })
          .from(competitions);

        // Get total revenue
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        
        // Daily revenue (today)
        const dailyRevenueResult  = await db
        .select({
          total: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, "deposit"),
            gte(transactions.createdAt, today)
          )
        );
      

        // 👉 NEW: Total site credit across all users
        const totalSiteCreditResult = await db
          .select({
            total: sql<number>`coalesce(sum(${users.balance}), 0)`,
          })
          .from(users);

        // 👉 NEW: Total approved withdrawals
        const totalApprovedWithdrawalsResult = await db
          .select({
            total: sql<number>`coalesce(sum(${withdrawalRequests.amount}), 0)`,
          })
          .from(withdrawalRequests)
          .where(inArray(withdrawalRequests.status, ["approved", "processed"]));

           // 👉 NEW: Daily approved withdrawals (today)
      const dailyApprovedWithdrawalsResult = await db
      .select({
        total: sql<number>`coalesce(sum(${withdrawalRequests.amount}), 0)`,
      })
      .from(withdrawalRequests)
      .where(
        and(
          inArray(withdrawalRequests.status, ["approved", "processed"]),
          gte(withdrawalRequests.updatedAt, today)
        )
      );

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
            dailyRevenue: dailyRevenueResult[0]?.total || 0,

            // ⭐ Added fields
            totalSiteCredit: totalSiteCreditResult[0]?.total || 0,
            totalApprovedWithdrawals:
            totalApprovedWithdrawalsResult[0]?.total || 0,
            dailyApprovedWithdrawals: dailyApprovedWithdrawalsResult[0]?.total || 0,
          },

          recentOrders: recentOrders.map((order) => ({
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
          })),
        });
      } catch (error) {
        console.error("Error fetching admin dashboard:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data" });
      }
    }
  );

  app.get("/api/admin/intelligence/registration-source",isAuthenticated, isAdmin, async (req, res) => {
    const result = await db.execute(sql`
      SELECT 
        how_did_you_find_us AS source,
        COUNT(*)::int AS total
      FROM users
      WHERE how_did_you_find_us IS NOT NULL
      GROUP BY how_did_you_find_us
      ORDER BY total DESC
    `);
  
    res.json(result.rows);
  });


  app.post("/api/admin/wellbeing/daily-limit-reset", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { targetUserId } = req.body;
      const adminUserId = req.user.id; // Get admin's ID for audit log
  
      if (!targetUserId) {
        return res.status(400).json({ 
          success: false, 
          message: "targetUserId is required" 
        });
      }
  
      // Check if target user exists - NEED AWAIT
      const targetUser = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
  
      if (!targetUser || targetUser.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
  
      const userData = targetUser[0];
  
      // Reset the target user's daily limit and clear cooldown
      await db.update(users).set({
        dailySpendLimit: null,
        dailyLimitLastUpdatedAt: null, // Clear cooldown so user can set new limit immediately
        updatedAt: new Date(),
      }).where(eq(users.id, targetUserId));
  
      // Create audit log - IMPORTANT for compliance
      await db.insert(auditLogs).values({
        userId: adminUserId, // Admin who performed the action
        userName: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
        action: "admin_daily_limit_reset",
        description: `Admin ${req.user.email} reset daily spend limit for user ${userData.email}`,
        createdAt: new Date(),
      });
  
      return res.status(200).json({
        success: true,
        message: "Daily limit reset successfully",
        resetUser: {
          id: userData.id,
          email: userData.email,
          name: `${userData.firstName} ${userData.lastName}`,
          dailySpendLimit: null,
          dailyLimitLastUpdatedAt: null
        }
      });
  
    } catch (error) {
      console.error("Error resetting daily limit:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to reset daily limit",
        error: error.message 
      });
    }
  });

  app.get(
    "/api/admin/wellbeing/daily-top-users",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
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
          .groupBy(
            transactions.userId,
            users.email,
            users.firstName,
            users.lastName
          )
          .orderBy(sql`SUM(${transactions.amount})`, "desc");

        res.json({ success: true, topDailyCashflowUsers });
      } catch (err) {
        console.error("Admin daily top users error:", err);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch daily top users" });
      }
    }
  );

  app.get(
    "/api/admin/wellbeing/requests",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const now = new Date();

        const requests = await db
          .select({
            id: wellbeingRequests.id,
            userId: wellbeingRequests.userId,
            email: users.email,
            type: wellbeingRequests.type,
            daysRequested: wellbeingRequests.daysRequested,
            processed: wellbeingRequests.processed,
            createdAt: wellbeingRequests.createdAt,
          })
          .from(wellbeingRequests)
          .leftJoin(users, eq(users.id, wellbeingRequests.userId))
          .orderBy(wellbeingRequests.createdAt, "desc");

        // ⏳ Apply cooling-off calculation
        const requestsWithCoolingOff = requests.map((req) => {
          const coolingOffUntil = new Date(req.createdAt);
          coolingOffUntil.setHours(coolingOffUntil.getHours() + 24);

          const isCoolingOff = now < coolingOffUntil;

          return {
            ...req,
            coolingOffUntil,
            isCoolingOff,
            canBeProcessed: !req.processed && !isCoolingOff,
          };
        });

        res.json({
          success: true,
          requests: requestsWithCoolingOff,
        });
      } catch (err) {
        console.error("Admin wellbeing requests error:", err);
        res.status(500).json({
          success: false,
          message: "Failed to fetch requests",
        });
      }
    }
  );

  app.post(
    "/api/admin/users/:id/disable",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      const { id } = req.params;
      const { days } = req.body;

      try {
        const now = new Date();
        let disabledUntil = null;

        if (days && days > 0) {
          disabledUntil = new Date();
          disabledUntil.setDate(disabledUntil.getDate() + Number(days));
        }

        await db
          .update(users)
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
        res
          .status(500)
          .json({ success: false, message: "Failed to disable user" });
      }
    }
  );

  app.post(
    "/api/admin/users/:userId/enable",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { userId } = req.params;

        // Update user in database
        await db
          .update(users)
          .set({
            disabled: false,
            disabledAt: null,
            disabledUntil: null,
          })
          .where(eq(users.id, userId));

        res.json({
          success: true,
          message: "User enabled successfully",
        });
      } catch (error) {
        console.error("Error enabling user:", error);
        res.status(500).json({ message: "Failed to enable user" });
      }
    }
  );

  // Add this route to your admin routes
app.post(
  "/api/admin/users/:id/unsuspend",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    const { id } = req.params;

    try {
      // First, check if the user exists and is actually suspended
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      if (!user.selfSuspended) {
        return res.status(400).json({ 
          success: false, 
          message: "User is not currently suspended" 
        });
      }

      const now = new Date();

      // Update user to remove suspension
      await db
        .update(users)
        .set({
          selfSuspended: false,
          selfSuspensionEndsAt: null,
          updatedAt: now,
        })
        .where(eq(users.id, id));

      // Audit log for the unsuspension
      await db.insert(auditLogs).values({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        action: "admin_unsuspended_user",
        description: `User was unsuspended by admin ${req.user.email} (${req.user.id})`,
        createdAt: now,
      });

      res.json({
        success: true,
        message: "User has been unsuspended successfully",
        user: {
          id: user.id,
          email: user.email,
          selfSuspended: false,
          selfSuspensionEndsAt: null,
        },
      });
    } catch (err) {
      console.error("Admin unsuspend error:", err);
      res.status(500).json({ 
        success: false, 
        message: "Failed to unsuspend user" 
      });
    }
  }
);

// Optional: Get all suspended users (useful for admin dashboard)
app.get(
  "/api/admin/users/suspended",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const now = new Date();
      
      const suspendedUsers = await db.query.users.findMany({
        where: and(
          eq(users.selfSuspended, true),
          sql`${users.selfSuspensionEndsAt} > ${now}`
        ),
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          selfSuspensionEndsAt: true,
          createdAt: true,
        },
        orderBy: (users, { desc }) => [desc(users.selfSuspensionEndsAt)],
      });

      res.json({
        success: true,
        users: suspendedUsers,
      });
    } catch (err) {
      console.error("Error fetching suspended users:", err);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch suspended users" 
      });
    }
  }
);
  // Add this route to your routes.ts
  // In your cleanup route, change 'withdrawals' to 'withdrawalRequests'
  app.post(
    "/api/admin/cleanup-rejected-withdrawals",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        console.log("🧹 Starting cleanup of rejected withdrawals...");

        // 1. Get all rejected withdrawals - FIXED TABLE NAME
        const rejectedWithdrawals = await db
          .select()
          .from(withdrawalRequests) // Changed from 'withdrawals' to 'withdrawalRequests'
          .where(eq(withdrawalRequests.status, "rejected")); // Fixed

        console.log(`Found ${rejectedWithdrawals.length} rejected withdrawals`);

        if (rejectedWithdrawals.length === 0) {
          return res.json({
            success: true,
            message: "No rejected withdrawals found to cleanup",
            summary: {
              deletedWithdrawals: 0,
              deletedSpinWins: 0,
              deletedScratchWins: 0,
            },
          });
        }

        let deletedSpinWins = 0;
        let deletedScratchWins = 0;

        // 2. For each rejected withdrawal, delete associated wins
        for (const withdrawal of rejectedWithdrawals) {
          const userId = withdrawal.userId;

          // Delete spin wins for this user
          const spinWinsResult = await db
            .delete(spinWins)
            .where(eq(spinWins.userId, userId));

          if (spinWinsResult.rowCount > 0) {
            deletedSpinWins += spinWinsResult.rowCount;
            console.log(
              `🗑️ Deleted ${spinWinsResult.rowCount} spin wins for user ${userId}`
            );
          }

          // Delete scratch card wins for this user
          const scratchWinsResult = await db
            .delete(scratchCardWins)
            .where(eq(scratchCardWins.userId, userId));

          if (scratchWinsResult.rowCount > 0) {
            deletedScratchWins += scratchWinsResult.rowCount;
            console.log(
              `🗑️ Deleted ${scratchWinsResult.rowCount} scratch wins for user ${userId}`
            );
          }
        }

        // 3. Delete all rejected withdrawals - FIXED TABLE NAME
        const deleteResult = await db
          .delete(withdrawalRequests) // Changed from 'withdrawals' to 'withdrawalRequests'
          .where(eq(withdrawalRequests.status, "rejected")); // Fixed

        const deletedWithdrawals = deleteResult.rowCount || 0;

        console.log(`✅ Cleanup completed:`);
        console.log(`   - Deleted ${deletedWithdrawals} rejected withdrawals`);
        console.log(`   - Deleted ${deletedSpinWins} spin wins`);
        console.log(`   - Deleted ${deletedScratchWins} scratch card wins`);

        res.json({
          success: true,
          message: "Cleanup completed successfully",
          summary: {
            deletedWithdrawals,
            deletedSpinWins,
            deletedScratchWins,
          },
        });
      } catch (error) {
        console.error("Cleanup error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to cleanup rejected withdrawals",
          error: error.message,
        });
      }
    }
  );

  app.get(
    "/api/admin/users/search",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      const { email } = req.query;

      if (!email || typeof email !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "Email is required" });
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
          .then((res) => res[0] || null);

        if (!user) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }

        res.json({ success: true, user });
      } catch (err) {
        console.error("Search user error:", err);
        res
          .status(500)
          .json({ success: false, message: "Failed to search user" });
      }
    }
  );

  // Manage competitions
  app.get(
    "/api/admin/competitions",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const allCompetitions = await db
          .select()
          .from(competitions)
          .orderBy(
            asc(competitions.displayOrder),
            desc(competitions.createdAt)
          );

        res.json(allCompetitions);
      } catch (error) {
        console.error("Error fetching competitions:", error);
        res.status(500).json({ message: "Failed to fetch competitions" });
      }
    }
  );

  // Create competition
  app.post(
    "/api/admin/competitions",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
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
    }
  );

  // Update competition
  app.put(
    "/api/admin/competitions/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;

        // 1️⃣ Get existing competition first
        const existing = await db
          .select()
          .from(competitions)
          .where(eq(competitions.id, id))
          .limit(1);
        const oldCompetition = existing[0];
        if (!oldCompetition)
          return res.status(404).json({ message: "Competition not found" });

        const formattedUpdateData: any = { ...req.body };
        formattedUpdateData.updatedAt = new Date();
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
            const timestampFields = [
              "endDate",
              "end_date",
              "updatedAt",
              "updated_at",
            ];

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

        // sanitize timestamps as before...
        sanitizeTimestamps(formattedUpdateData);

        // 2️⃣ Delete old image if a new one is uploaded
        if (
          formattedUpdateData.imageUrl &&
          oldCompetition.imageUrl &&
          oldCompetition.imageUrl !== formattedUpdateData.imageUrl
        ) {
          // extract key from old URL
          const oldKey = oldCompetition.imageUrl.replace(
            `${process.env.R2_PUBLIC_URL}/`,
            ""
          );
          await deleteR2Object(oldKey);
        }

        const [updatedCompetition] = await db
          .update(competitions)
          .set(formattedUpdateData)
          .where(eq(competitions.id, id))
          .returning();

        wsManager.broadcast({ type: "competition_updated", competitionId: id });
        res.json(updatedCompetition);
      } catch (error) {
        console.error("Error updating competition:", error);
        res.status(500).json({ message: "Failed to update competition" });
      }
    }
  );

  // Update competition display order
  app.patch(
    "/api/admin/competitions/:id/display-order",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const { displayOrder } = req.body;

        // Validate display order
        if (typeof displayOrder !== "number" || displayOrder < 0) {
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
    }
  );

  // Delete competition
  // In your backend routes file (e.g., routes.ts or server.ts)

  // Archive endpoint (replaces delete)
  app.post(
    "/api/admin/competitions/:id/archive",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;

        const [competition] = await db
          .select()
          .from(competitions)
          .where(eq(competitions.id, id))
          .limit(1);

        if (!competition) {
          return res.status(404).json({ message: "Competition not found" });
        }

        // Archive the competition by setting isActive to false
        await db
          .update(competitions)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(competitions.id, id));

        // Broadcast to WebSocket if needed
        wsManager.broadcast({
          type: "competition_archived",
          competitionId: id,
        });

        res.json({ message: "Competition archived successfully" });
      } catch (error) {
        console.error("Error archiving competition:", error);
        res.status(500).json({ message: "Failed to archive competition" });
      }
    }
  );

  // Unarchive endpoint
  app.post(
    "/api/admin/competitions/:id/unarchive",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;

        const [competition] = await db
          .select()
          .from(competitions)
          .where(eq(competitions.id, id))
          .limit(1);

        if (!competition) {
          return res.status(404).json({ message: "Competition not found" });
        }

        // Unarchive the competition by setting isActive to true
        await db
          .update(competitions)
          .set({
            isActive: true,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(competitions.id, id));

        // Broadcast to WebSocket if needed
        wsManager.broadcast({
          type: "competition_unarchived",
          competitionId: id,
        });

        res.json({ message: "Competition unarchived successfully" });
      } catch (error) {
        console.error("Error unarchiving competition:", error);
        res.status(500).json({ message: "Failed to unarchive competition" });
      }
    }
  );

  // Get tickets for a competition
  app.get(
    "/api/admin/competitions/:id/tickets",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;

        const competitionTickets = await db
          .select()
          .from(tickets)
          .where(eq(tickets.competitionId, id));

        res.json(competitionTickets);
      } catch (error) {
        console.error("Error fetching competition tickets:", error);
        res.status(500).json({ message: "Failed to fetch tickets" });
      }
    }
  );

  // Add this route to your admin routes file

// Update only total tickets for active and unarchived competitions
// Update tickets for a competition (max tickets and sold tickets)
app.patch(
  "/api/admin/competitions/:id/tickets",
  isAuthenticated,
  isAdmin,
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const { maxTickets, soldTickets } = req.body;

      // Get existing competition
      const existing = await db
        .select()
        .from(competitions)
        .where(eq(competitions.id, id))
        .limit(1);

      const competition = existing[0];
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }

      // Check if competition is active and not archived
      if (!competition.isActive) {
        return res.status(400).json({ 
          message: "Cannot update tickets for inactive competitions" 
        });
      }

      if (competition.isArchived) {
        return res.status(400).json({ 
          message: "Cannot update tickets for archived competitions" 
        });
      }

      // Build update object
      const updateData: any = {
        updatedAt: new Date()
      };

      // Validate and add maxTickets if provided
      if (maxTickets !== undefined && maxTickets !== null) {
        if (typeof maxTickets !== "number" || maxTickets < 0) {
          return res.status(400).json({ 
            message: "maxTickets must be a positive number or 0 for unlimited" 
          });
        }
        
        // If changing maxTickets, ensure it's not less than current or new sold tickets
        const relevantSoldTickets = soldTickets !== undefined ? soldTickets : (competition.soldTickets || 0);
        if (maxTickets > 0 && maxTickets < relevantSoldTickets) {
          return res.status(400).json({ 
            message: `Cannot reduce max tickets below sold tickets (${relevantSoldTickets})` 
          });
        }
        
        updateData.maxTickets = maxTickets;
      }

      // Validate and add soldTickets if provided
      if (soldTickets !== undefined && soldTickets !== null) {
        if (typeof soldTickets !== "number" || soldTickets < 0) {
          return res.status(400).json({ 
            message: "soldTickets must be a positive number" 
          });
        }

        const relevantMaxTickets = maxTickets !== undefined ? maxTickets : (competition.maxTickets || 0);
        
        // If maxTickets is set (not unlimited), sold tickets can't exceed it
        if (relevantMaxTickets > 0 && soldTickets > relevantMaxTickets) {
          return res.status(400).json({ 
            message: `soldTickets (${soldTickets}) cannot exceed maxTickets (${relevantMaxTickets})` 
          });
        }

        updateData.soldTickets = soldTickets;
      }

      // If nothing to update
      if (Object.keys(updateData).length === 1) { // only updatedAt
        return res.status(400).json({ 
          message: "No valid fields to update" 
        });
      }

      // Update the competition
      const [updatedCompetition] = await db
        .update(competitions)
        .set(updateData)
        .where(eq(competitions.id, id))
        .returning();

      // Build success message
      let message = "Tickets updated: ";
      const changes = [];
      if (maxTickets !== undefined) {
        changes.push(`max tickets = ${maxTickets === 0 ? 'Unlimited' : maxTickets.toLocaleString()}`);
      }
      if (soldTickets !== undefined) {
        changes.push(`sold tickets = ${soldTickets.toLocaleString()}`);
      }
      message += changes.join(", ");

      // Broadcast real-time update
      wsManager.broadcast({ 
        type: "competition_tickets_updated", 
        competitionId: id,
        maxTickets: updatedCompetition.maxTickets,
        soldTickets: updatedCompetition.soldTickets
      });

      res.json({
        success: true,
        competition: updatedCompetition,
        message
      });

    } catch (error) {
      console.error("Error updating competition tickets:", error);
      res.status(500).json({ 
        message: "Failed to update competition tickets" 
      });
    }
  }
);

  // Draw a winner for a competition
  app.post(
    "/api/admin/competitions/:id/draw-winner",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;

        // Get all tickets for this competition
        const competitionTickets = await db
          .select()
          .from(tickets)
          .where(eq(tickets.competitionId, id));

        if (competitionTickets.length === 0) {
          return res
            .status(400)
            .json({ message: "No tickets found for this competition" });
        }

        // Randomly select a winning ticket
        const randomIndex = Math.floor(
          Math.random() * competitionTickets.length
        );
        const winningTicket = competitionTickets[randomIndex];

        // Get user and competition details
        const user = await storage.getUser(winningTicket.userId);
        const competition = await storage.getCompetition(id);

        if (!user || !competition) {
          return res
            .status(404)
            .json({ message: "User or competition not found" });
        }

        // Create winner record
        const userName =
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.email;

        const [dbWinner] = await db
          .insert(winners)
          .values({
            userId: user.id,
            competitionId: competition.id,
            prizeDescription: `Winner of ${competition.title}`,
            prizeValue: competition.ticketPrice,
          })
          .returning();

        // Broadcast real-time update
        wsManager.broadcast({ type: "winner_drawn", competitionId: id });

        // Return enriched winner data for frontend
        res.json({
          winner: {
            ...dbWinner,
            userName,
            userEmail: user.email,
            competitionTitle: competition.title,
            prizeDetails: dbWinner.prizeDescription,
          },
        });
      } catch (error) {
        console.error("Error drawing winner:", error);
        res.status(500).json({ message: "Failed to draw winner" });
      }
    }
  );

  // Game Spin Wheel Configuration Routes

  // Update the existing game-spin-config endpoint
// --- Wheel 1 config ---
app.get(
  "/api/admin/game-spin-config",
  isAuthenticated,
  async (req: any, res) => {
    try {
      const { gameSpinConfig, spinWins } = await import("@shared/schema");
      const [config] = await db
        .select()
        .from(gameSpinConfig)
        .where(eq(gameSpinConfig.id, "active"));

      if (!config) return res.json(DEFAULT_SPIN_WHEEL_CONFIG);

      const winStats: Record<string, number> = {};

      const segments = config.segments || [];
      segments.forEach((segment: any) => {
        if (segment.id) winStats[segment.id] = 0;
      });

      // ✅ Only get wins for Wheel 1
      const spinWinsData = await db
        .select({
          segmentId: spinWins.segmentId,
          winCount: sql<number>`count(*)`,
        })
        .from(spinWins)
        .where(eq(spinWins.wheelType, "wheel1"))
        .groupBy(spinWins.segmentId);

      spinWinsData.forEach((win) => {
        if (win.segmentId && winStats[win.segmentId] !== undefined) {
          winStats[win.segmentId] = Number(win.winCount);
        }
      });

      const segmentsWithWins = segments.map((segment: any) => ({
        ...segment,
        currentWins: winStats[segment.id] || 0,
      }));

      res.json({
        ...config,
        segments: segmentsWithWins,
      });
    } catch (error) {
      console.error("Error fetching spin config:", error);
      res.status(500).json({ message: "Failed to fetch spin configuration" });
    }
  }
);

// --- Wheel 1 update ---
app.put(
  "/api/admin/game-spin-config",
  isAuthenticated,
  isAdmin,
  async (req: any, res) => {
    try {
      const { gameSpinConfig } = await import("@shared/schema");
      const validationResult = spinConfigSchema.safeParse(req.body);
      if (!validationResult.success)
        return res.status(400).json({
          message: "Invalid spin configuration",
          errors: validationResult.error.issues,
        });

      const { segments, maxSpinsPerUser, mysteryPrize, isVisible } =
        validationResult.data;

      const totalProbability = segments.reduce((sum, seg) => sum + seg.probability, 0);
      if (Math.abs(totalProbability - 100) >= 0.01)
        return res.status(400).json({
          message: "Total probability must equal 100% (within 0.01% tolerance)",
          currentTotal: totalProbability.toFixed(2),
        });

      const [existing] = await db
        .select()
        .from(gameSpinConfig)
        .where(eq(gameSpinConfig.id, "active"));

      if (existing) {
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
  }
);

// --- Wheel 2 config ---
app.get(
  "/api/admin/game-spin-2-config",
  isAuthenticated,
  async (req: any, res) => {
    try {
      const { spinWheel2Configs, spinWins } = await import("@shared/schema");
      const [config] = await db
        .select()
        .from(spinWheel2Configs)
        .where(eq(spinWheel2Configs.id, "active"));
      // console.log("Fetched wheel 2 config:", config);
      if (!config) return res.json(DEFAULT_SPIN_WHEEL_2_CONFIG);

      const winStats: Record<string, number> = {};
      const segments = config.segments || [];
      segments.forEach((segment: any) => {
        if (segment.id) winStats[segment.id] = 0;
      });

      // ✅ Only get wins for Wheel 2
      const spinWinsData = await db
        .select({
          segmentId: spinWins.segmentId,
          winCount: sql<number>`count(*)`,
        })
        .from(spinWins)
        .where(eq(spinWins.wheelType, "wheel2"))
        .groupBy(spinWins.segmentId);

      spinWinsData.forEach((win) => {
        if (win.segmentId && winStats[win.segmentId] !== undefined) {
          winStats[win.segmentId] = Number(win.winCount);
        }
      });

      const segmentsWithWins = segments.map((segment: any) => ({
        ...segment,
        currentWins: winStats[segment.id] || 0,
      }));

      res.json({
        ...config,
        isVisible: config?.isVisible ?? true,
        segments: segmentsWithWins,
      });
    } catch (error) {
      console.error("Error fetching spin config:", error);
      res.status(500).json({ message: "Failed to fetch spin configuration" });
    }
  }
);

// --- Wheel 2 update ---
app.put(
  "/api/admin/game-spin-2-config",
  isAuthenticated,
  isAdmin,
  async (req: any, res) => {
    try {
      const { spinWheel2Configs, spinWins } = await import("@shared/schema");
      const { segments, maxSpinsPerUser, isVisible } = req.body;

      if (!Array.isArray(segments) || segments.length !== 12) {
        return res.status(400).json({
          message: "Arcade Spin must have exactly 12 segments",
        });
      }

      // Get current wins from database for wheel2
      const spinWinsData = await db
        .select({
          segmentId: spinWins.segmentId,
          winCount: sql<number>`count(*)`,
        })
        .from(spinWins)
        .where(eq(spinWins.wheelType, "wheel2"))
        .groupBy(spinWins.segmentId);

      const winStats: Record<string, number> = {};
      spinWinsData.forEach((win) => {
        winStats[win.segmentId] = Number(win.winCount);
      });

      // Add currentWins to segments
      const segmentsWithWins = segments.map((segment: any) => ({
        ...segment,
        currentWins: winStats[segment.id] || 0,
      }));

      const [existing] = await db
        .select()
        .from(spinWheel2Configs)
        .where(eq(spinWheel2Configs.id, "active"));

      if (existing) {
        const [updated] = await db
          .update(spinWheel2Configs)
          .set({
            segments: segmentsWithWins,
            maxSpinsPerUser: maxSpinsPerUser ?? null,
            isVisible: isVisible ?? existing.isVisible,
            updatedAt: new Date(),
          })
          .where(eq(spinWheel2Configs.id, "active"))
          .returning();

        res.json(updated);
      } else {
        const [created] = await db
          .insert(spinWheel2Configs)
          .values({
            id: "active",
            segments: segmentsWithWins,
            maxSpinsPerUser: maxSpinsPerUser ?? null,
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
  }
);

// --- Wheel 2 reset wins ---
app.post(
  "/api/admin/game-spin-2-reset-wins",
  isAuthenticated,
  isAdmin,
  async (_req, res) => {
    try {
      // 1. Delete Wheel 2 win records
      await db.delete(spinWins).where(eq(spinWins.wheelType, "wheel2"));
      
      // 2. ALSO reset currentWins in the wheel configuration
      const [currentConfig] = await db
        .select()
        .from(spinWheel2Configs)
        .where(eq(spinWheel2Configs.id, "active"));
      
      if (currentConfig && currentConfig.segments) {
        // Reset all currentWins to 0
        const updatedSegments = currentConfig.segments.map(segment => ({
          ...segment,
          currentWins: 0
        }));
        
        // Update the configuration
        await db
          .update(spinWheel2Configs)
          .set({ 
            segments: updatedSegments,
            updated_at: new Date()
          })
          .where(eq(spinWheel2Configs.id, "active"));
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error("Reset wheel 2 wins failed:", err);
      res.status(500).json({ message: "Failed to reset wins" });
    }
  }
);




  // Add a test endpoint to check spin_wins data
  app.get(
    "/api/admin/test-spin-wins",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const spinWinsData = await db
          .select({
            segmentId: spinWins.segmentId,
            winCount: sql<number>`count(*)`,
          })
          .from(spinWins)
          .groupBy(spinWins.segmentId);

        const allWins = await db.select().from(spinWins).limit(10);

        res.json({
          totalWins: spinWinsData.reduce(
            (sum, w) => sum + Number(w.winCount),
            0
          ),
          winsBySegment: spinWinsData,
          recentWins: allWins,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Game Scratch Card Configuration Routes
  app.get(
    "/api/admin/game-scratch-config",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { gameScratchConfig } = await import("@shared/schema");
        const [config] = await db
          .select()
          .from(gameScratchConfig)
          .where(eq(gameScratchConfig.id, "active"));

        if (!config) {
          return res.json({ isVisible: true });
        }

        res.json(config);
      } catch (error) {
        console.error("Error fetching scratch config:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch scratch configuration" });
      }
    }
  );

  app.put(
    "/api/admin/game-scratch-config",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { gameScratchConfig } = await import("@shared/schema");

        const validationResult = scratchConfigSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({
            message: "Invalid scratch configuration",
            errors: validationResult.error.issues,
          });
        }

        const { isVisible } = validationResult.data;

        const [existing] = await db
          .select()
          .from(gameScratchConfig)
          .where(eq(gameScratchConfig.id, "active"));

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
        res
          .status(500)
          .json({ message: "Failed to update scratch configuration" });
      }
    }
  );

  // ========== RINGTONE POP GAME ROUTES ==========

 // Get Ringtone Pop configuration (admin)
  app.get(
    "/api/admin/game-pop-config",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const [config] = await db
          .select()
          .from(gamePopConfig)
          .where(eq(gamePopConfig.id, "active"));

        const baseConfig = config || DEFAULT_POP_CONFIG;

        const segments =
          (baseConfig as any).segments ||
          (baseConfig as any).prizes ||
          DEFAULT_POP_CONFIG.segments;

        // SOURCE OF TRUTH: popWins table
        const winStats = await db
          .select({
            prizeId: popWins.prizeId,
            winCount: sql<number>`count(*)`,
          })
          .from(popWins)
          .groupBy(popWins.prizeId);

        const segmentsWithWins = segments.map((seg: any) => {
          const stat = winStats.find((w) => w.prizeId === seg.id);
          return {
            ...seg,
            currentWins: Number(stat?.winCount ?? 0),
          };
        });

        res.json({
          ...baseConfig,
          segments: segmentsWithWins,
        });
      } catch (err) {
        console.error("GET pop config error:", err);
        res.status(500).json({ message: "Failed to load pop config" });
      }
    }
  );


  // Update Ringtone Pop configuration (admin)
  app.put(
  "/api/admin/game-pop-config",
  isAuthenticated,
  isAdmin,
  async (req: any, res) => {
    try {
      const { segments, isVisible, isActive } = req.body;

      if (!Array.isArray(segments)) {
        return res.status(400).json({ message: "Invalid segments data" });
      }

      // ✅ Normalize segments (VERY IMPORTANT)
      const normalizedSegments = segments.map((s: any) => ({
        ...s,
        probability:
          s.isActive === false ? 0 : Number(s.probability) || 0,
        rewardValue:
          s.rewardValue === "" || s.rewardValue === null
            ? 0
            : Number(s.rewardValue) || 0,
        isActive: s.isActive !== false, // default true
      }));

      // ✅ Only ACTIVE segments for validation
      const activeSegments = normalizedSegments.filter(
        (s: any) => s.isActive !== false
      );

      // 🚨 Ensure at least 2 active segments
      if (activeSegments.length < 2) {
        return res.status(400).json({
          message: "At least 2 active segments required",
        });
      }

      // ✅ Calculate total probability (ONLY active)
      const total = activeSegments.reduce(
        (sum: number, s: any) => sum + s.probability,
        0
      );

      if (Math.abs(total - 100) > 0.01) {
        return res.status(400).json({
          message: `Total probability must be 100% (currently ${total.toFixed(
            2
          )}%)`,
        });
      }

      // ✅ Remove currentWins before saving
      const cleanSegments = normalizedSegments.map(
        ({ currentWins, ...rest }: any) => rest
      );

      // 🔍 Check existing config
      const [existing] = await db
        .select()
        .from(gamePopConfig)
        .where(eq(gamePopConfig.id, "active"));

      let saved;

      if (existing) {
        [saved] = await db
          .update(gamePopConfig)
          .set({
            prizes: cleanSegments,
            isVisible,
            isActive,
            updatedAt: new Date(),
          })
          .where(eq(gamePopConfig.id, "active"))
          .returning();
      } else {
        [saved] = await db
          .insert(gamePopConfig)
          .values({
            id: "active",
            prizes: cleanSegments,
            isVisible: isVisible ?? true,
            isActive: isActive ?? true,
          })
          .returning();
      }

      return res.json({
        ...saved,
        segments: cleanSegments,
      });

    } catch (err) {
      console.error("PUT pop config error:", err);
      return res.status(500).json({
        message: "Failed to save pop config",
      });
    }
  }
);

  // Get pop prizes (admin)
  app.get(
    "/api/admin/pop-prizes",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const prizes = await db
          .select()
          .from(popPrizes)
          .orderBy(asc(popPrizes.displayOrder));

        res.json(prizes);
      } catch (error) {
        console.error("Error fetching pop prizes:", error);
        res.status(500).json({ message: "Failed to fetch pop prizes" });
      }
    }
  );

  // Create pop prize (admin)
  app.post(
    "/api/admin/pop-prizes",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const {
          prizeName,
          prizeValue,
          rewardType,
          weight,
          maxWins,
          isActive,
          displayOrder,
        } = req.body;

        const [created] = await db
          .insert(popPrizes)
          .values({
            prizeName,
            prizeValue: prizeValue.toString(),
            rewardType,
            weight: weight || 10,
            maxWins: maxWins || null,
            isActive: isActive ?? true,
            displayOrder: displayOrder || 0,
          })
          .returning();

        res.json(created);
      } catch (error) {
        console.error("Error creating pop prize:", error);
        res.status(500).json({ message: "Failed to create pop prize" });
      }
    }
  );

  // Update pop prize (admin)
  app.put(
    "/api/admin/pop-prizes/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const {
          prizeName,
          prizeValue,
          rewardType,
          weight,
          maxWins,
          isActive,
          displayOrder,
        } = req.body;

        const [updated] = await db
          .update(popPrizes)
          .set({
            prizeName,
            prizeValue: prizeValue?.toString(),
            rewardType,
            weight,
            maxWins,
            isActive,
            displayOrder,
            updatedAt: new Date(),
          })
          .where(eq(popPrizes.id, id))
          .returning();

        if (!updated) {
          return res.status(404).json({ message: "Prize not found" });
        }

        res.json(updated);
      } catch (error) {
        console.error("Error updating pop prize:", error);
        res.status(500).json({ message: "Failed to update pop prize" });
      }
    }
  );

  // Delete pop prize (admin)
  app.delete(
    "/api/admin/pop-prizes/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;

        await db.delete(popPrizes).where(eq(popPrizes.id, id));

        res.json({ message: "Prize deleted successfully" });
      } catch (error) {
        console.error("Error deleting pop prize:", error);
        res.status(500).json({ message: "Failed to delete pop prize" });
      }
    }
  );

  // Reset pop prize win counts (admin)
  app.post(
    "/api/admin/pop-prizes/reset-wins",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        // Reset quantityWon in pop prizes
        await db.update(popPrizes).set({ quantityWon: 0 });

        // Also update the prizes in config
        const [config] = await db
          .select()
          .from(gamePopConfig)
          .where(eq(gamePopConfig.id, "active"));
        if (config) {
          const resetPrizes = (config.prizes as any[]).map((p) => ({
            ...p,
            quantityWon: 0,
          }));
          await db
            .update(gamePopConfig)
            .set({ prizes: resetPrizes, updatedAt: new Date() })
            .where(eq(gamePopConfig.id, "active"));
        }

        res.json({ message: "Pop prize win counts reset successfully" });
      } catch (error) {
        console.error("Error resetting pop wins:", error);
        res.status(500).json({ message: "Failed to reset pop wins" });
      }
    }
  );
const popCooldowns = new Map<string, number>();
  const POP_COOLDOWN_MS = 3000;


app.post("/api/play-pop", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId, competitionId } = req.body;

    if (!orderId || !competitionId) {
      return res.status(400).json({
        success: false,
        message: "Order ID and Competition ID are required",
      });
    }

    // Cooldown
    const cooldownKey = `${userId}-${orderId}`;
    const lastPlayTime = popCooldowns.get(cooldownKey) || 0;
    const now = Date.now();

    if (now - lastPlayTime < POP_COOLDOWN_MS) {
      return res.status(429).json({
        success: false,
        message: "Please wait a moment before playing again",
      });
    }

    popCooldowns.set(cooldownKey, now);

    // Verify order
    const order = await storage.getOrder(orderId);

    if (
      !order ||
      order.userId !== userId ||
      order.status !== "completed"
    ) {
      return res.status(400).json({
        success: false,
        message: "No valid pop game purchase found",
      });
    }

    // Check remaining plays
    const playsUsed = await db
      .select({ count: sql<number>`count(*)` })
      .from(popUsage)
      .where(eq(popUsage.orderId, orderId));

    const usedCount = Number(playsUsed[0]?.count || 0);
    const playsRemaining = order.quantity - usedCount;

    if (playsRemaining <= 0) {
      return res.status(400).json({
        success: false,
        message: "No plays remaining in this purchase",
      });
    }

    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Load config
    const [config] = await db
      .select()
      .from(gamePopConfig)
      .where(eq(gamePopConfig.id, "active"));

    const popConfig = config || DEFAULT_POP_CONFIG;

    if (!popConfig.isActive) {
      return res.status(400).json({
        success: false,
        message: "Ringtone Pop is currently unavailable",
      });
    }

    // Segments
    const segments =
      (popConfig as any).segments ||
      (popConfig as any).prizes ||
      DEFAULT_POP_CONFIG.segments;

    if (!segments || segments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No prizes configured for Pop game",
      });
    }

    // ✅ FILTER 1: Only ACTIVE segments (isActive !== false)
    const activeSegments = segments.filter((seg: any) => seg.isActive !== false);

    if (activeSegments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active prizes configured",
      });
    }

    // Count wins INCLUDING try_again
    const counts = await db
      .select({
        prizeId: popWins.prizeId,
        count: sql<number>`count(*)`,
      })
      .from(popWins)
      .where(
        sql`(${popWins.isWin} = true OR ${popWins.rewardType} = 'try_again')`
      )
      .groupBy(popWins.prizeId);

    const segmentWinCounts = new Map<string, number>();

    counts.forEach((c) => {
      segmentWinCounts.set(c.prizeId, Number(c.count));
    });

    // Initialize missing segments
    activeSegments.forEach((seg: any) => {
      if (!segmentWinCounts.has(seg.id)) {
        segmentWinCounts.set(seg.id, 0);
      }
    });

    // Find lose segment
    const loseSegment = activeSegments.find(
      (s: any) => s.rewardType === "lose"
    );

    // ✅ FILTER 2: Eligible segments based on maxWins
    const eligibleSegments = activeSegments.filter((seg: any) => {
      const wins = segmentWinCounts.get(seg.id) ?? 0;

      // Convert maxWins safely
      const maxWins =
        seg.maxWins !== undefined &&
        seg.maxWins !== null &&
        seg.maxWins !== ""
          ? Number(seg.maxWins)
          : null;

      // Unlimited prize
      if (maxWins === null) {
        return true;
      }

      // Prize exhausted
      if (wins >= maxWins) {
        console.log(
          `Prize ${seg.label || seg.id} exhausted (${wins}/${maxWins})`
        );
        return false;
      }

      return true;
    });

    // Fallback
    let finalEligible;

    if (eligibleSegments.length > 0) {
      finalEligible = eligibleSegments;
    } else {
      finalEligible = loseSegment ? [loseSegment] : activeSegments;
    }

    if (!finalEligible.length) {
      console.error("No eligible segments found");

      return res.status(500).json({
        success: false,
        message: "Game configuration error",
      });
    }

    // Weighted random selection
    const totalProbability = finalEligible.reduce(
      (sum: number, seg: any) =>
        sum + Number(seg.probability || 0),
      0
    );

    let random = Math.random() * totalProbability;

    let selectedSegment = finalEligible[0];

    for (const seg of finalEligible) {
      random -= Number(seg.probability || 0);

      if (random <= 0) {
        selectedSegment = seg;
        break;
      }
    }

    if (!selectedSegment) {
      return res.status(500).json({
        success: false,
        message: "Selection failed",
      });
    }

    // RESULT LOGIC
    let balloonValues: number[] = [];

    const rewardType = selectedSegment.rewardType || "lose";

    const prizeName =
      selectedSegment.label ||
      selectedSegment.prizeName ||
      (selectedSegment.rewardType === "physical"
        ? selectedSegment.rewardValue
        : null) ||
      "Prize";

    let rewardValue = "0";

    const isRPrize = rewardType === "try_again";

    const isWin =
      rewardType === "cash" ||
      rewardType === "points" ||
      rewardType === "physical";

    // TRY AGAIN
    if (isRPrize) {
      const cashSegments = activeSegments.filter(
        (s: any) => s.rewardType === "cash"
      );

      const vals = cashSegments.map((s: any) =>
        parseFloat(s.rewardValue?.toString() || "1")
      );

      let val1 =
        vals[Math.floor(Math.random() * vals.length)] || 1;

      let val2 =
        vals.length > 1
          ? vals[Math.floor(Math.random() * vals.length)]
          : val1 + 1;

      while (val2 === val1 && vals.length > 1) {
        val2 =
          vals[Math.floor(Math.random() * vals.length)];
      }

      const rPos = Math.floor(Math.random() * 3);

      balloonValues =
        rPos === 0
          ? [-1, val1, val2]
          : rPos === 1
          ? [val1, -1, val2]
          : [val1, val2, -1];

      rewardValue = "0";
    }

    // WIN
    else if (isWin) {
      const value = parseFloat(
        selectedSegment.rewardValue?.toString() || "0"
      );

      if (rewardType === "physical") {
        balloonValues = [0, 0, 0];
        rewardValue = value.toString();
      } else {
        balloonValues = [value, value, value];
        rewardValue = value.toString();
      }

      // CASH
      if (rewardType === "cash") {
        const finalBalance =
          parseFloat(user.balance || "0") + value;

        await storage.updateUserBalance(
          userId,
          finalBalance.toFixed(2)
        );

        await storage.createTransaction({
          userId,
          type: "prize",
          amount: value.toFixed(2),
          description: `Ringtone Pop Win - £${value}`,
        });

       const maxWins = selectedSegment.maxWins !== undefined && 
                  selectedSegment.maxWins !== null && 
                  selectedSegment.maxWins !== "" 
                    ? Number(selectedSegment.maxWins) 
                    : null;
  
  await syncPopPrize(
    competitionId,
    selectedSegment.id || "unknown",
    prizeName,
    value,
    'cash',  // ← ADD rewardType
    maxWins
  );
}

      // POINTS
      else if (rewardType === "points") {
        const pointsValue = Math.floor(value);

        const newPoints =
          (user.ringtonePoints || 0) + pointsValue;

        await db
          .update(users)
          .set({
            ringtonePoints: newPoints,
          })
          .where(eq(users.id, userId));

        await storage.createTransaction({
          userId,
          type: "ringtone_points",
          amount: pointsValue.toString(),
          description: `Ringtone Pop Win - ${pointsValue} pts`,
        });

         const maxWins = selectedSegment.maxWins !== undefined && 
                  selectedSegment.maxWins !== null && 
                  selectedSegment.maxWins !== "" 
                    ? Number(selectedSegment.maxWins) 
                    : null;
  
  await syncPopPrize(
    competitionId,
    selectedSegment.id || "unknown",
    prizeName,
    pointsValue,
    'points',  // ← ADD rewardType
    maxWins
  );
}

      // PHYSICAL
      else if (rewardType === "physical") {
        await storage.createTransaction({
          userId,
          type: "prize",
          amount: "0",
          description: `Physical Prize Won: ${prizeName} - Contact support`,
        });

      const maxWins = selectedSegment.maxWins !== undefined && 
                  selectedSegment.maxWins !== null && 
                  selectedSegment.maxWins !== "" 
                    ? Number(selectedSegment.maxWins) 
                    : null;
  
  await syncPopPrize(
    competitionId,
    selectedSegment.id || "unknown",
    prizeName,
    0,
    'physical',  // ← ADD rewardType
    maxWins
  );
}

      // Winners table
      let prizeDescriptionText = "";
      let prizeValueText = "";

      if (rewardType === "cash") {
        prizeDescriptionText = "Ringtone Pop Win";
        prizeValueText = `£${rewardValue} Cash`;
      } else if (rewardType === "points") {
        prizeDescriptionText = "Ringtone Pop Win";
        prizeValueText = `${rewardValue} Points`;
      } else if (rewardType === "physical") {
        prizeDescriptionText = `Physical Prize: ${prizeName}`;
        prizeValueText = prizeName;
      }

      await db.insert(winners).values({
        userId,
        competitionId,
        prizeDescription: prizeDescriptionText,
        prizeValue: prizeValueText,
        imageUrl: selectedSegment.imageUrl || null,
        isShowcase: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // LOSE
    else {
      const cashVals = activeSegments
        .filter((s: any) => s.rewardType === "cash")
        .map((s: any) =>
          parseFloat(s.rewardValue?.toString() || "1")
        );

      if (cashVals.length >= 2) {
        let v1 =
          cashVals[Math.floor(Math.random() * cashVals.length)];

        let v2 =
          cashVals[Math.floor(Math.random() * cashVals.length)];

        let v3 =
          cashVals[Math.floor(Math.random() * cashVals.length)];

        if (v1 === v2 && v2 === v3) {
          v3 = cashVals.find((v) => v !== v1) || v1 + 1;
        }

        balloonValues = [v1, v2, v3];
      } else {
        balloonValues = [1, 5, 10];
      }
    }

    // SAVE USAGE
    // try_again does NOT consume play
    if (!isRPrize) {
      await db.insert(popUsage).values({
        orderId,
        userId,
        usedAt: new Date(),
      });
    }

    // SAVE WIN RECORD
    await db.insert(popWins).values({
      orderId,
      userId,
      competitionId,
      prizeId: selectedSegment.id || "none",
      balloonValues,
      prizeName,
      rewardType,
      rewardValue,
      isWin,
      wonAt: new Date(),
    });

    // Remaining plays
    const newPlaysRemaining = isRPrize
      ? playsRemaining
      : playsRemaining - 1;

    // Response
    res.json({
      success: true,
      result: {
        balloonValues:
          rewardType === "physical"
            ? [0, 0, 0]
            : balloonValues,

        isWin,
        isRPrize,
        rewardType,

        rewardValue:
          rewardType === "physical"
            ? selectedSegment.label ||
              selectedSegment.prizeName
            : rewardValue,

        prizeName:
          rewardType === "physical"
            ? selectedSegment.label ||
              selectedSegment.prizeName
            : undefined,

        prizeDescription:
          rewardType === "physical"
            ? selectedSegment.prizeDescription ||
              selectedSegment.label
            : undefined,

        isPhysical: rewardType === "physical",
      },

      playsRemaining: newPlaysRemaining,
    });
  } catch (error) {
    console.error("Error playing pop game:", error);

    res.status(500).json({
      success: false,
      message: "Failed to play pop game",
    });
  }
});

// Reveal all pop games (batch processing)
app.post("/api/reveal-all-pop", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId, count, competitionId } = req.body;

    if (!orderId || !count || count <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid orderId and count are required",
      });
    }

    if (!competitionId) {
      return res.status(400).json({
        success: false,
        message: "competitionId is required",
      });
    }

    const competition = await db
      .select()
      .from(competitions)
      .where(eq(competitions.id, competitionId))
      .limit(1);

    if (!competition.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid competition",
      });
    }

    // Verify completed order
    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId || order.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "No valid pop game purchase found",
      });
    }

    // Check remaining plays
    const playsUsed = await db
      .select({ count: sql<number>`count(*)` })
      .from(popUsage)
      .where(eq(popUsage.orderId, orderId));
    const usedCount = Number(playsUsed[0]?.count || 0);
    const playsRemaining = order.quantity - usedCount;

    if (playsRemaining <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "No plays remaining" });
    }

    const playsToProcess = Math.min(count, playsRemaining);

    // Get user and active pop config
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const [config] = await db
      .select()
      .from(gamePopConfig)
      .where(eq(gamePopConfig.id, "active"));
    const popConfig = config || DEFAULT_POP_CONFIG;
    const segments =
      (popConfig as any).segments ||
      (popConfig as any).prizes ||
      DEFAULT_POP_CONFIG.segments;

    // ✅ FILTER 1: Only ACTIVE segments
    const activeSegments = segments.filter((seg: any) => seg.isActive !== false);

    if (activeSegments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active prizes configured",
      });
    }

    let totalCash = 0;
    let totalPoints = 0;
    let freeReplaysWon = 0;
    const results: any[] = [];
    const prizeSyncs = []; // Track prizes to sync

    // Count existing wins for all segments from popWins table
    const counts = await db
      .select({ prizeId: popWins.prizeId, count: sql<number>`count(*)` })
      .from(popWins)
      .where(eq(popWins.isWin, true))
      .groupBy(popWins.prizeId);
    const segmentWinCounts = new Map<string, number>();
    counts.forEach((c) => segmentWinCounts.set(c.prizeId, Number(c.count)));

    // Initialize segment counts if missing (only for active segments)
    activeSegments.forEach((seg) => {
      if (!segmentWinCounts.has(seg.id)) segmentWinCounts.set(seg.id, 0);
    });

    // Find a "lose" segment to use as fallback (from active segments only)
    const loseSegment = activeSegments.find((s) => s.rewardType === "lose");

    // Transaction to process all plays
    await db.transaction(async (tx) => {
      for (let i = 0; i < playsToProcess; i++) {
        let selectedSegment;
        let isRPrize = false;
        let isWin = false;

        // ✅ FILTER 2: Eligible segments based on maxWins (only from active segments)
        const eligibleSegments = activeSegments.filter((seg) => {
          const wins = segmentWinCounts.get(seg.id) ?? 0;
          if (
            seg.maxWins !== null &&
            (seg.rewardType === "cash" || seg.rewardType === "points" || seg.rewardType === "physical" || seg.rewardType === "try_again") 
          ) {
            if (wins >= seg.maxWins) return false;
          }
          return true;
        });

        // If there are eligible segments, do weighted random selection
        if (eligibleSegments.length > 0) {
          const totalProbability = eligibleSegments.reduce(
            (sum, seg) => sum + (seg.probability || 0),
            0
          );
          let random = Math.random() * totalProbability;
          selectedSegment = eligibleSegments[0];

          for (const seg of eligibleSegments) {
            random -= seg.probability || 0;
            if (random <= 0) {
              selectedSegment = seg;
              break;
            }
          }
        } else {
          // If no eligible segments (all maxWins reached), use lose segment from active segments
          selectedSegment = loseSegment || activeSegments[0];
        }

        let balloonValues: number[] = [];
        const rewardType = selectedSegment.rewardType || "lose";
        const prizeName = selectedSegment.label || 
                        selectedSegment.prizeName || 
                        (selectedSegment.rewardType === "physical" ? selectedSegment.rewardValue : null) ||
                        "Prize";
        let rewardValue = "0";
        isRPrize = rewardType === "try_again";
        isWin = rewardType === "cash" || rewardType === "points" || rewardType === "physical";

        if (isRPrize) {
          // Free Replay - one R symbol + 2 random cash values
          const cashSegments = activeSegments.filter(
            (s) => s.rewardType === "cash"
          );
          const availableValues = cashSegments.map((s) =>
            parseFloat(s.rewardValue?.toString() || "1")
          );
          let val1 =
            availableValues[
              Math.floor(Math.random() * availableValues.length)
            ] || 1;
          let val2 =
            availableValues.length > 1
              ? availableValues[
                  Math.floor(Math.random() * availableValues.length)
                ]
              : val1 + 1;
          while (val2 === val1 && availableValues.length > 1) {
            val2 =
              availableValues[
                Math.floor(Math.random() * availableValues.length)
              ];
          }
          const rPosition = Math.floor(Math.random() * 3);
          balloonValues =
            rPosition === 0
              ? [-1, val1, val2]
              : rPosition === 1
              ? [val1, -1, val2]
              : [val1, val2, -1];
          rewardValue = "0";
          freeReplaysWon++;
          segmentWinCounts.set(
            selectedSegment.id,
            (segmentWinCounts.get(selectedSegment.id) || 0) + 1
          );
        } else if (isWin) {
          const value = parseFloat(
            selectedSegment.rewardValue?.toString() || "0"
          );
          
          if (rewardType === "physical") {
            balloonValues = [0, 0, 0];
            rewardValue = value.toString();
          } else {
            balloonValues = [value, value, value];
            rewardValue = value.toString();
          }
          
          if (rewardType === "cash") totalCash += value;
          if (rewardType === "points") totalPoints += Math.floor(value);
          
          segmentWinCounts.set(
            selectedSegment.id,
            (segmentWinCounts.get(selectedSegment.id) || 0) + 1
          );

          // Track for auto-sync
        prizeSyncs.push({
  competitionId,
  segmentId: selectedSegment.id || "unknown",
  name: prizeName,
  value: rewardType === "physical" ? 0 : value,
  rewardType: rewardType,  // ← ADD rewardType
  maxWins: selectedSegment.maxWins !== undefined && 
           selectedSegment.maxWins !== null && 
           selectedSegment.maxWins !== "" 
             ? Number(selectedSegment.maxWins) 
             : null
});

          // Create winner entry with proper physical prize info
          let prizeDescriptionText = "";
          let prizeValueText = "";

          if (rewardType === "cash") {
            prizeDescriptionText = "Ringtone Pop Win";
            prizeValueText = `£${rewardValue} Cash`;
          } else if (rewardType === "points") {
            prizeDescriptionText = "Ringtone Pop Win";
            prizeValueText = `${rewardValue} Points`;
          } else if (rewardType === "physical") {
            prizeDescriptionText = `Physical Prize: ${prizeName}`;
            prizeValueText = prizeName;
          }

          await tx.insert(winners).values({
            userId,
            competitionId,
            prizeDescription: prizeDescriptionText,
            prizeValue: prizeValueText,
            imageUrl: selectedSegment.imageUrl || null,
            isShowcase: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          // Lose: generate random non-matching balloon values using ONLY active cash segments
          const cashValues = activeSegments
            .filter((s) => s.rewardType === "cash")
            .map((s) => parseFloat(s.rewardValue?.toString() || "1"));
          if (cashValues.length >= 2) {
            let val1 =
              cashValues[Math.floor(Math.random() * cashValues.length)];
            let val2 =
              cashValues[Math.floor(Math.random() * cashValues.length)];
            let val3 =
              cashValues[Math.floor(Math.random() * cashValues.length)];
            if (val1 === val2 && val2 === val3)
              val3 = cashValues.find((v) => v !== val1) || val1 + 1;
            balloonValues = [val1, val2, val3];
          } else {
            balloonValues = [1, 5, 10];
          }
        }

        // Record pop usage
        await tx
          .insert(popUsage)
          .values({ orderId, userId, usedAt: new Date() });

        // Record result
        await tx.insert(popWins).values({
          orderId,
          userId,
          prizeId: selectedSegment.id || "none",
          balloonValues,
          prizeName,
          rewardType,
          rewardValue,
          isWin,
          wonAt: new Date(),
        });

        // Push result with physical prize info
        results.push({
          balloonValues: rewardType === "physical" ? [0, 0, 0] : balloonValues,
          isWin,
          isRPrize,
          rewardType,
          rewardValue: rewardType === "physical" ? prizeName : rewardValue,
          prizeName: rewardType === "physical" ? prizeName : undefined,
          isPhysical: rewardType === "physical",
        });
      }

      // Update user balance
      if (totalCash > 0) {
        const finalBalance = parseFloat(user.balance || "0") + totalCash;
        await tx
          .update(users)
          .set({ balance: finalBalance.toFixed(2), updatedAt: new Date() })
          .where(eq(users.id, userId));
        await tx.insert(transactions).values({
          userId,
          type: "prize",
          amount: totalCash.toFixed(2),
          description: `Ringtone Pop Batch Win - £${totalCash.toFixed(2)}`,
          createdAt: new Date(),
        });
      }

      // Update points
      if (totalPoints > 0) {
        const newPoints = (user.ringtonePoints || 0) + totalPoints;
        await tx
          .update(users)
          .set({ ringtonePoints: newPoints })
          .where(eq(users.id, userId));
        await tx.insert(transactions).values({
          userId,
          type: "ringtone_points",
          amount: totalPoints.toString(),
          description: `Ringtone Pop Batch Win - ${totalPoints} pts`,
          createdAt: new Date(),
        });
      }

      // Grant free replays
      if (freeReplaysWon > 0) {
        await tx
          .update(orders)
          .set({ quantity: order.quantity + freeReplaysWon })
          .where(eq(orders.id, orderId));
      }
    });

    // --------------------------------------
    // 🚀 AUTO-SYNC PRIZES (Outside transaction)
    // --------------------------------------
    if (prizeSyncs.length > 0) {
      // Sync each prize
    for (const sync of prizeSyncs) {
  try {
    await syncPopPrize(
      sync.competitionId,
      sync.segmentId,
      sync.name,
      sync.value,
      sync.rewardType,  // ← Pass rewardType
      sync.maxWins
    );
    console.log(`✅ Synced pop prize: ${sync.name}`);
  } catch (err) {
    console.error(`Failed to sync pop prize ${sync.name}:`, err);
  }
}
    }

    res.json({
      success: true,
      processed: playsToProcess,
      results,
      totalWon: totalCash,
      totalPoints: totalPoints,
      freeReplaysWon,
      prizesSynced: prizeSyncs.length,
      playsRemaining: playsRemaining - playsToProcess + freeReplaysWon,
    });
  } catch (error) {
    console.error("Error revealing all pop games:", error);
    res.status(500).json({ message: "Failed to reveal all pop games" });
  }
});

  // Get pop order info (user)
  app.get("/api/pop-order/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;

      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }

      const playsUsed = await db
        .select({ count: sql<number>`count(*)` })
        .from(popUsage)
        .where(eq(popUsage.orderId, orderId));

      const usedCount = Number(playsUsed[0]?.count || 0);

      // Get play history for this order
      const history = await db
        .select()
        .from(popWins)
        .where(eq(popWins.userId, userId))
        .orderBy(desc(popWins.wonAt))
        .limit(order.quantity);

      res.json({
        order,
        playsUsed: usedCount,
        playsRemaining: order.quantity - usedCount,
        history,
      });
    } catch (error) {
      console.error("Error fetching pop order:", error);
      res.status(500).json({ message: "Failed to fetch pop order" });
    }
  });

  // Get pop config visibility (public)
  app.get("/api/pop-config", async (req, res) => {
    try {
      const [config] = await db
        .select()
        .from(gamePopConfig)
        .where(eq(gamePopConfig.id, "active"));

      res.json({
        isVisible: config?.isVisible ?? true,
        isActive: config?.isActive ?? true,
      });
    } catch (error) {
      console.error("Error fetching pop config:", error);
      res.status(500).json({ message: "Failed to fetch pop configuration" });
    }
  });

  // RESET ALL POP WINS (ADMIN ONLY)
  app.post(
    "/api/admin/game-pop-reset-wins",
    isAuthenticated,
    isAdmin,
    async (_req, res) => {
      try {
        await db.delete(popWins);

        res.json({ success: true });
      } catch (err) {
        console.error("Reset pop wins error:", err);
        res.status(500).json({ message: "Failed to reset pop wins" });
      }
    }
  );

  app.get("/api/admin/plinko-config", isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const [config] = await db.select().from(gamePlinkoConfig).where(eq(gamePlinkoConfig.id, "active"));
    let prizes = await db
      .select()
      .from(plinkoPrizes)
      .where(eq(plinkoPrizes.isActive, true))
      .orderBy(asc(plinkoPrizes.displayOrder));
    
    // If no prizes in DB, return default configuration
    if (prizes.length === 0) {
      return res.json({
        id: config?.id || "active",
        isVisible: config?.isVisible ?? true,
        isActive: config?.isActive ?? true,
        rows: config?.rows ?? 12,
        freeReplayProbability: config?.freeReplayProbability || "5.00",
        prizes: DEFAULT_PLINKO_CONFIG.prizes
      });
    }
    
    // Use quantityWon directly from prizes table for accurate tracking
    const prizesWithStats = prizes.map(prize => ({
      ...prize,
      currentWins: prize.quantityWon || 0
    }));
    
    res.json({
      id: config?.id || "active",
      isVisible: config?.isVisible ?? true,
      isActive: config?.isActive ?? true,
      rows: config?.rows ?? 12,
      freeReplayProbability: config?.freeReplayProbability || "5.00",
      prizes: prizesWithStats
    });
  } catch (error) {
    console.error("Error fetching plinko config:", error);
    res.status(500).json({ message: "Failed to fetch plinko configuration" });
  }
});
  
  // PUT /api/admin/plinko-config
  // Updates Plinko game settings (visibility, active status, free replay probability).
  // Also updates all 8 prize slot configurations (prize name, type, value, probability, maxWins).
  // Validates that total probability equals 100% before saving.
  app.put("/api/admin/plinko-config", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { prizes, isVisible, isActive, freeReplayProbability } = req.body;
      
      // Validate probability totals to 100%
      if (prizes) {
        const totalProbability = prizes.reduce((sum: number, p: any) => sum + (Number(p.probability) || 0), 0);
        if (Math.abs(totalProbability - 100) > 0.01) {
          return res.status(400).json({ message: `Total probability must equal 100%. Current: ${totalProbability.toFixed(2)}%` });
        }
      }
      
      // Update config
      const [existing] = await db.select().from(gamePlinkoConfig).where(eq(gamePlinkoConfig.id, "active"));
      
      if (existing) {
        await db
          .update(gamePlinkoConfig)
          .set({
            isVisible: isVisible ?? existing.isVisible,
            isActive: isActive ?? existing.isActive,
            freeReplayProbability: freeReplayProbability ?? existing.freeReplayProbability,
            updatedAt: new Date(),
          })
          .where(eq(gamePlinkoConfig.id, "active"));
      } else {
        await db.insert(gamePlinkoConfig).values({
          id: "active",
          isVisible: isVisible ?? true,
          isActive: isActive ?? true,
          freeReplayProbability: freeReplayProbability ?? "5.00",
        });
      }
      
      // Update or INSERT prizes
      if (prizes) {
        for (const prize of prizes) {
          // Check if prize exists for this slotIndex
          const [existingPrize] = await db
            .select()
            .from(plinkoPrizes)
            .where(eq(plinkoPrizes.id, prize.id));
          
          if (existingPrize) {
            // Update existing prize
            await db
              .update(plinkoPrizes)
              .set({
                prizeName: prize.prizeName,
                prizeValue: prize.prizeValue,
                probability: prize.probability.toString(),
                maxWins: prize.maxWins,
                quantityWon: prize.currentWins ?? 0,
                displayOrder: prize.displayOrder,
                updatedAt: new Date(),
              })
              .where(eq(plinkoPrizes.id, prize.id));
          } else {
            // INSERT new prize
            await db.insert(plinkoPrizes).values({
              slotIndex: prize.slotIndex,
              prizeName: prize.prizeName,
              prizeValue: prize.prizeValue,
              rewardType: prize.rewardType,
              probability: prize.probability.toString(),
              color: prize.color || "#FFD700",
              maxWins: prize.maxWins,
              quantityWon: prize.currentWins ?? 0,
              isActive: true,
              displayOrder: prize.displayOrder ?? prize.slotIndex,

            });
          }
        }
      }
      
      res.json({ success: true, message: "Plinko configuration updated" });
    } catch (error) {
      console.error("Error updating plinko config:", error);
      res.status(500).json({ message: "Failed to update plinko configuration" });
    }
  });

  app.delete(
    "/api/admin/users/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      const { id } = req.params;
      const adminId = req.user.id;
  
      // 🚫 Prevent admin deleting themselves
      if (id === adminId) {
        return res
          .status(400)
          .json({ message: "Admin cannot delete their own account" });
      }
  
      try {
        await db.transaction(async (tx) => {
          // 🔍 Check user exists
          const user = await tx.query.users.findFirst({
            where: eq(users.id, id),
          });
  
          if (!user) {
            throw new Error("USER_NOT_FOUND");
          }
          
           await tx
          .delete(userIpLogs)
          .where(eq(userIpLogs.userId, id));


           await tx
          .delete(redeemCodeRedemptions)
          .where(eq(redeemCodeRedemptions.userId, id));

           await tx
          .update(redeemCodes)
          .set({ usedByUserId: null })
          .where(eq(redeemCodes.usedByUserId, id));

          // 1️⃣ Get all order IDs for this user
          const ordersList = await tx
            .select({ id: orders.id })
            .from(orders)
            .where(eq(orders.userId, id));
  
          const orderIds = ordersList.map((o) => o.id);
  
          // 2️⃣ Delete ALL order-dependent tables FIRST
          if (orderIds.length > 0) {
            await tx
              .delete(spinUsage)
              .where(inArray(spinUsage.orderId, orderIds));
  
            await tx
              .delete(scratchCardUsage)
              .where(inArray(scratchCardUsage.orderId, orderIds));
  
            await tx
              .delete(popUsage)
              .where(inArray(popUsage.orderId, orderIds));
  
            await tx
              .delete(popWins)
              .where(inArray(popWins.orderId, orderIds));
  
            await tx
              .delete(transactions)
              .where(inArray(transactions.orderId, orderIds));
          }

          
          // 🔹 Delete all transactions for this user
          await tx.delete(transactions).where(eq(transactions.userId, id));

          // 3️⃣ Delete tickets (user-owned)
          await tx.delete(tickets).where(eq(tickets.userId, id));
  
          // 4️⃣ Delete orders
          if (orderIds.length > 0) {
            await tx.delete(orders).where(inArray(orders.id, orderIds));
          }
          // 🔹 Delete winners linked to this user
          await tx.delete(winners).where(eq(winners.userId, id));

          // 5️⃣ Remove this user as referrer
          await tx
            .update(users)
            .set({ referredBy: null })
            .where(eq(users.referredBy, id));
  
          // 6️⃣ Finally delete user
          await tx.delete(users).where(eq(users.id, id));
        });
  
        res.json({ message: "User deleted successfully" });
      } catch (error: any) {
        if (error.message === "USER_NOT_FOUND") {
          return res.status(404).json({ message: "User not found" });
        }
  
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Failed to delete user" });
      }
    }
  );
  

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
          minimumTopUp: "10.00",
        });

        res.json({
          message:
            "Platform successfully reset. All data wiped except admin accounts.",
        });
      } catch (error) {
        console.error("FULL RESET ERROR:", error);
        res.status(500).json({
          message: "Failed to reset platform",
        });
      }
    }
  );

  app.post(
    "/api/admin/users/restrict/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;

        const user = await storage.getUser(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.isRestricted)
          return res
            .status(400)
            .json({ message: "User is already restricted" });

        await storage.updateUser(id, {
          isRestricted: true,
          updatedAt: new Date().toISOString(),
        });

        res.json({ message: "User restricted successfully", userId: id });
      } catch (error) {
        console.error("Error restricting user:", error);
        res.status(500).json({ message: "Failed to restrict user" });
      }
    }
  );

  app.post(
    "/api/admin/users/unrestrict/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;

        const user = await storage.getUser(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.isRestricted)
          return res.status(400).json({ message: "User is not restricted" });

        await storage.updateUser(id, {
          isRestricted: false,
          updatedAt: new Date().toISOString(),
        });

        res.json({ message: "User unrestricted", userId: id });
      } catch (error) {
        console.error("Error unrestricting user:", error);
        res.status(500).json({ message: "Failed to unrestrict user" });
      }
    }
  );

  // Deactivate user
  app.delete(
    "/api/admin/users/deactivate/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const userId = req.user.id;

        if (id === userId) {
          return res
            .status(400)
            .json({ message: "admin cannnot deactivate own account" });
        }

        const user = await storage.getUser(id);

        if (!user) {
          return res.status(404).json({ message: "user not found" });
        }

        await storage.updateUser(id, {
          isActive: false,
          email: `deleted_${Date.now()}_${user.email}`, // Prevent email reuse
        });

        res.status(200).json({ message: "User deactivated successfully" });
      } catch (error) {
        console.error("Error deactivating user:", error);
        res.status(500).json({ message: "Failed to deactivate user" });
      }
    }
  );

  app.post(
  "/api/admin/users/bulk-add-points",
  isAuthenticated,
  isAdmin,
  async (req: any, res) => {
    try {
      const { userIds, points, reason } = req.body;

      // Validate inputs
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ 
          error: "Please select at least one user" 
        });
      }

      if (!points || typeof points !== 'number' || points <= 0) {
        return res.status(400).json({ 
          error: "Points must be a positive number" 
        });
      }

      if (points > 1000000) {
        return res.status(400).json({ 
          error: "Maximum 1,000,000 points per transaction" 
        });
      }

      const results = {
        successful: [] as any[],
        failed: [] as any[],
        total: userIds.length,
        pointsAdded: points,
      };

      // Process each user
      for (const userId of userIds) {
        try {
          // Get current user
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (!user) {
            results.failed.push({
              userId,
              reason: "User not found",
            });
            continue;
          }

          // Update ringtone points
          const newPoints = (user.ringtonePoints || 0) + points;

          const [updatedUser] = await db
            .update(users)
            .set({
              ringtonePoints: newPoints,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning();

          // Log the transaction (optional - create a points_transactions table if needed)
          // await db.insert(pointsTransactions).values({
          //   userId: userId,
          //   points: points,
          //   type: 'admin_add',
          //   reason: reason || 'Admin bulk addition',
          //   adminId: req.user.id,
          //   createdAt: new Date(),
          // });

          results.successful.push({
            userId: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            previousPoints: user.ringtonePoints || 0,
            newPoints: newPoints,
            pointsAdded: points,
          });

        } catch (error) {
          console.error(`Error adding points to user ${userId}:`, error);
          results.failed.push({
            userId,
            reason: "Database error",
          });
        }
      }

      console.log(
        `Admin ${req.user.email} added ${points} ringtone points to ${results.successful.length} users`
      );

      res.json(results);

    } catch (error) {
      console.error("Error in bulk add points:", error);
      res.status(500).json({ 
        error: "Failed to add points",
        message: error.message 
      });
    }
  }
);

// GET ALL USERS FOR BULK POINTS
app.get(
  "/api/admin/users/bulk-points-list",
  isAuthenticated,
  isAdmin,
  async (req: any, res) => {
    try {
      const { search } = req.query;
      
      console.log("Bulk points API called. Search:", search);
      
      // Simple query - get ALL users first
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          ringtonePoints: users.ringtonePoints,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));
      
      console.log(`Total users found in database: ${allUsers.length}`);
      
      // Filter by search if provided
      let filteredUsers = allUsers;
      if (search && typeof search === 'string' && search.trim()) {
        const searchTerm = search.toLowerCase().trim();
        filteredUsers = allUsers.filter(user => {
          const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
          const email = (user.email || '').toLowerCase();
          
          return fullName.includes(searchTerm) || email.includes(searchTerm);
        });
        console.log(`Filtered to ${filteredUsers.length} users matching "${searchTerm}"`);
      }
      
      // Send response
      res.json({
        users: filteredUsers,
        total: filteredUsers.length
      });
      
    } catch (error: any) {
      console.error("Error in bulk-points-list:", error);
      res.status(500).json({ 
        message: "Failed to fetch users",
        error: error.message || "Unknown error"
      });
    }
  }
);

// Optional: Get points transaction history for a user
app.get(
  "/api/admin/users/:id/points-history",
  isAuthenticated,
  isAdmin,
  async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // If you create a points_transactions table, query it here
      // For now, return empty array
      res.json({
        userId: id,
        transactions: [],
      });
    } catch (error) {
      console.error("Error fetching points history:", error);
      res.status(500).json({ error: "Failed to fetch points history" });
    }
  }
);

app.get(
  "/api/admin/users",
  isAuthenticated,
  isAdmin,
  async (req: any, res) => {
    try {
      // Pagination params
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 30;
      const offset = (page - 1) * limit;
      
      // Filters
      const { dateFrom, dateTo, search, role } = req.query;
      
      // 1️⃣ Get ALL users first (like your original working code)
      let query = db.select().from(users);
      
      // Apply date filters to the query
      const conditions = [];
      if (dateFrom) {
        conditions.push(gte(users.createdAt, new Date(dateFrom as string)));
      }
      if (dateTo) {
        const endDate = new Date(dateTo as string);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(lte(users.createdAt, endDate));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      let allUsers = await query.orderBy(desc(users.createdAt));
      
      // 2️⃣ Apply search filter in JavaScript (supports "Travis Rawlings" style searches)
if (search) {
  const searchTerm = (search as string).toLowerCase().trim();
  
  // Split search into words for partial matching (e.g., "Travis Rawlings" → ["travis", "rawlings"])
  const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
  
  allUsers = allUsers.filter(user => {
    // Check if full search term matches any single field
    const fullMatch = 
      user.email?.toLowerCase().includes(searchTerm) ||
      user.firstName?.toLowerCase().includes(searchTerm) ||
      user.lastName?.toLowerCase().includes(searchTerm) ||
      user.phoneNumber?.toLowerCase().includes(searchTerm);
    
    if (fullMatch) return true;
    
    // For multi-word searches, check if ALL words match across firstName + lastName
    if (searchWords.length > 1) {
      const fullName = `${(user.firstName || '').toLowerCase()} ${(user.lastName || '').toLowerCase()}`;
      return searchWords.every(word => fullName.includes(word));
    }
    
    return false;
  });
}
      
      // 3️⃣ Apply role filter
      if (role === 'admin') {
        allUsers = allUsers.filter(user => user.isAdmin === true);
      } else if (role === 'user') {
        allUsers = allUsers.filter(user => user.isAdmin !== true);
      }
      
      // 4️⃣ Apply pagination
      const total = allUsers.length;
      const paginatedUsers = allUsers.slice(offset, offset + limit);
      
      // 5️⃣ Get IP addresses for paginated users
      const usersWithIp = await Promise.all(
        paginatedUsers.map(async (user) => {
          const latestIp = await db.query.userIpLogs.findFirst({
            where: (l, { eq }) => eq(l.userId, user.id),
            orderBy: (l, { desc }) => desc(l.createdAt),
          });
          
          return {
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
            selfSuspended: user.selfSuspended,
            selfSuspensionEndsAt: user.selfSuspensionEndsAt,
            disabled: user.disabled,
            disabledAt: user.disabledAt,
            disabledUntil: user.disabledUntil,
            dailySpendLimit: user.dailySpendLimit,
            dailyLimitLastUpdatedAt: user.dailyLimitLastUpdatedAt,
            lastIpAddress: latestIp?.ipAddress || null,
          };
        })
      );
      
      res.json({
        users: usersWithIp,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + limit < total
        }
      });
      
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ 
        message: "Failed to fetch users",
        error: error.message 
      });
    }
  }
);

app.get(
  "/api/admin/users-notification",
  isAuthenticated,
  isAdmin,
  async (req: any, res) => {
    try {
      const { search, role } = req.query;
      let allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      
      // 2️⃣ Apply search filter in JavaScript (supports "Travis Rawlings" style searches)
      if (search) {
        const searchTerm = (search as string).toLowerCase().trim();
        
        // Split search into words for partial matching (e.g., "Travis Rawlings" → ["travis", "rawlings"])
        const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
        
        allUsers = allUsers.filter(user => {
          // Check if full search term matches any single field
          const fullMatch = 
            user.email?.toLowerCase().includes(searchTerm) ||
            user.firstName?.toLowerCase().includes(searchTerm) ||
            user.lastName?.toLowerCase().includes(searchTerm) ||
            user.phoneNumber?.toLowerCase().includes(searchTerm);
          
          if (fullMatch) return true;
          
          // For multi-word searches, check if ALL words match across firstName + lastName
          if (searchWords.length > 1) {
            const fullName = `${(user.firstName || '').toLowerCase()} ${(user.lastName || '').toLowerCase()}`;
            return searchWords.every(word => fullName.includes(word));
          }
          
          return false;
        });
      }
      
      // 3️⃣ Apply role filter
      if (role === 'admin') {
        allUsers = allUsers.filter(user => user.isAdmin === true);
      } else if (role === 'user') {
        allUsers = allUsers.filter(user => user.isAdmin !== true);
      }
      
      // 5️⃣ Get IP addresses for all users
      const usersWithIp = await Promise.all(
        allUsers.map(async (user) => {
          const latestIp = await db.query.userIpLogs.findFirst({
            where: (l, { eq }) => eq(l.userId, user.id),
            orderBy: (l, { desc }) => desc(l.createdAt),
          });
          
          return {
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
            selfSuspended: user.selfSuspended,
            selfSuspensionEndsAt: user.selfSuspensionEndsAt,
            disabled: user.disabled,
            disabledAt: user.disabledAt,
            disabledUntil: user.disabledUntil,
            dailySpendLimit: user.dailySpendLimit,
            dailyLimitLastUpdatedAt: user.dailyLimitLastUpdatedAt,
            lastIpAddress: latestIp?.ipAddress || null,
          };
        })
      );
      
      res.json({
        users: usersWithIp
      });
      
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ 
        message: "Failed to fetch users",
        error: error.message 
      });
    }
  }
);

  // Get single user by ID (simple version)
  app.get(
    "/api/admin/users/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
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
    }
  );

  // Update user
  app.put(
    "/api/admin/users/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
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
          phoneNumber: updatedUser.phoneNumber,
          balance: updatedUser.balance,
          ringtonePoints: updatedUser.ringtonePoints,
          isAdmin: updatedUser.isAdmin,
          notes: updatedUser.notes,
        });
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user" });
      }
    }
  );

  // Reset user password (admin only)
  app.post(
    "/api/admin/users/:id/reset-password",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
          return res
            .status(400)
            .json({ message: "Password must be at least 6 characters" });
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

        console.log(
          `Admin ${req.user.email} reset password for user ${updatedUser.email}`
        );

        res.json({ message: "Password reset successfully" });
      } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Failed to reset password" });
      }
    }
  );

  // Get all orders
  app.get(
    "/api/admin/orders",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
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

        res.json(
          allOrders.map((order) => ({
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
            walletAmount: order.orders.walletAmount, // ✅ add this
            pointsAmount: order.orders.pointsAmount, // ✅ add this
            cashflowsAmount: order.orders.cashflowsAmount, // ✅ add this
          }))
        );
      } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
      }
    }
  );

  // Delete order
  app.delete(
    "/api/admin/orders/:id",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
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

        if (!deleted)
          return res.status(404).json({ message: "Order not found" });

        res.json({ message: "Order deleted successfully" });
      } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).json({ message: "Failed to delete order" });
      }
    }
  );

  // Get system analytics
  app.get(
    "/api/admin/analytics",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
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
          .groupBy(
            competitions.id,
            competitions.title,
            competitions.ticketPrice,
            competitions.soldTickets,
            competitions.maxTickets
          )
          .orderBy(sql`coalesce(sum(${orders.totalAmount}), 0) DESC`);

        res.json({
          revenueByDay,
          competitionPerformance,
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ message: "Failed to fetch analytics" });
      }
    }
  );

app.get("/api/public/max-tickets", async (req, res) => {
  try {
    const settings = await storage.getPlatformSettings();
    res.json({
      maxTicketsPerOrder: settings?.maxTicketsPerOrder ,
    });
  } catch (err) {
    console.error("Error fetching max tickets:", err);
    res.json({ maxTicketsPerOrder: 250 });
  }
});

  // Platform settings endpoints
  app.get(
    "/api/admin/settings",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const settings = await storage.getPlatformSettings();
        res.json(settings);
      } catch (error) {
        console.error("Error fetching platform settings:", error);
        res.status(500).json({ message: "Failed to fetch platform settings" });
      }
    }
  );

  app.put(
    "/api/admin/settings",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const updates = req.body;
        const updatedSettings = await storage.updatePlatformSettings(updates);
        res.json(updatedSettings);
      } catch (error) {
        console.error("Error updating platform settings:", error);
        res.status(500).json({ message: "Failed to update platform settings" });
      }
    }
  );

  // Admin credential management endpoints
  app.post(
    "/api/admin/change-username",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { changeAdminUsernameSchema } = await import("@shared/schema");

        // Validate request body
        const validationResult = changeAdminUsernameSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({
            message:
              validationResult.error.errors[0]?.message || "Invalid username",
          });
        }

        const { newUsername } = validationResult.data;
        const adminId = req.user.id;

        // Update admin's firstName (username)
        await storage.updateUser(adminId, { firstName: newUsername });

        // Audit log
        console.log(
          `[INFO] Admin username changed - AdminID: ${adminId}, Action: username_change, Timestamp: ${new Date().toISOString()}`
        );

        res.json({
          success: true,
          message: "Username updated successfully",
        });
      } catch (error) {
        console.error("[WARN] Failed to change admin username:", error);
        res.status(500).json({ message: "Failed to update username" });
      }
    }
  );

  app.post(
    "/api/admin/change-password",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { changeAdminPasswordSchema } = await import("@shared/schema");

        // Validate request body
        const validationResult = changeAdminPasswordSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({
            message:
              validationResult.error.errors[0]?.message || "Invalid password",
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
        const isCurrentPasswordValid = await verifyPassword(
          currentPassword,
          admin.password
        );
        if (!isCurrentPasswordValid) {
          console.log(
            `[WARN] Failed password change attempt - AdminID: ${adminId}, Reason: incorrect_current_password, Timestamp: ${new Date().toISOString()}`
          );
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check if new password is same as current (optional security check)
        const isSamePassword = await verifyPassword(
          newPassword,
          admin.password
        );
        if (isSamePassword) {
          return res
            .status(400)
            .json({
              message: "New password must be different from current password",
            });
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        await storage.updateUser(adminId, { password: hashedPassword });

        // Audit log (never log passwords)
        console.log(
          `[INFO] Admin password changed successfully - AdminID: ${adminId}, Action: password_change, Timestamp: ${new Date().toISOString()}`
        );

        res.json({
          success: true,
          message: "Password updated successfully",
        });
      } catch (error) {
        console.error("[WARN] Failed to change admin password:", error);
        res.status(500).json({ message: "Failed to update password" });
      }
    }
  );

  // Scratch card image configuration endpoints
  // GET endpoint is accessible to all authenticated users (they need to see the cards to play)
  app.get(
    "/api/admin/scratch-images",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const images = await storage.getScratchCardImages();
        res.json(images);
      } catch (error) {
        console.error("Error fetching scratch card images:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch scratch card images" });
      }
    }
  );

  app.post(
    "/api/admin/scratch-images",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const imageData = req.body;
        const created = await storage.createScratchCardImage(imageData);
        res.json(created);
      } catch (error) {
        console.error("Error creating scratch card image:", error);
        res
          .status(500)
          .json({ message: "Failed to create scratch card image" });
      }
    }
  );

  app.put(
    "/api/admin/scratch-images/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;
        const updated = await storage.updateScratchCardImage(id, updates);
        res.json(updated);
      } catch (error) {
        console.error("Error updating scratch card image:", error);
        res
          .status(500)
          .json({ message: "Failed to update scratch card image" });
      }
    }
  );

  app.delete(
    "/api/admin/scratch-images/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        await storage.deleteScratchCardImage(id);
        res.json({ message: "Scratch card image deleted successfully" });
      } catch (error) {
        console.error("Error deleting scratch card image:", error);
        res
          .status(500)
          .json({ message: "Failed to delete scratch card image" });
      }
    }
  );

  // Marketing routes
  app.get(
    "/api/admin/marketing/subscribers",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const subscribers = await storage.getNewsletterSubscribers();
        res.json(subscribers);
      } catch (error) {
        console.error("Error fetching newsletter subscribers:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch newsletter subscribers" });
      }
    }
  );

  app.get(
    "/api/admin/marketing/campaigns",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const campaigns = await storage.getPromotionalCampaigns();
        res.json(campaigns);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        res.status(500).json({ message: "Failed to fetch campaigns" });
      }
    }
  );

  app.get(
    "/api/admin/marketing/campaigns/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
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
    }
  );

  app.post(
    "/api/admin/marketing/campaigns",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const campaignData = {
          ...req.body,
          createdBy: req.user.id,
          status: "draft",
          // Convert expiryDate string to Date object if provided
          expiryDate: req.body.expiryDate
            ? new Date(req.body.expiryDate)
            : null,
        };
        const campaign = await storage.createPromotionalCampaign(campaignData);
        res.json(campaign);
      } catch (error) {
        console.error("Error creating campaign:", error);
        res.status(500).json({ message: "Failed to create campaign" });
      }
    }
  );

  app.post(
    "/api/admin/marketing/campaigns/:id/send",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const campaign = await storage.getPromotionalCampaignById(id);

        if (!campaign) {
          return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.status === "sent") {
          return res
            .status(400)
            .json({ message: "Campaign has already been sent" });
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
            console.error(
              `Failed to send email to ${subscriber.email}:`,
              emailError
            );
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
    }
  );

  app.delete(
    "/api/admin/marketing/campaigns/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        await storage.deletePromotionalCampaign(id);
        res.json({ message: "Campaign deleted successfully" });
      } catch (error) {
        console.error("Error deleting campaign:", error);
        res.status(500).json({ message: "Failed to delete campaign" });
      }
    }
  );

  app.get(
    "/api/admin/marketing/stats",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const subscribers = await storage.getNewsletterSubscribers();
        const campaigns = await storage.getPromotionalCampaigns();

        const stats = {
          totalSubscribers: subscribers.length,
          totalCampaigns: campaigns.length,
          sentCampaigns: campaigns.filter((c) => c.status === "sent").length,
          draftCampaigns: campaigns.filter((c) => c.status === "draft").length,
        };

        res.json(stats);
      } catch (error) {
        console.error("Error fetching marketing stats:", error);
        res.status(500).json({ message: "Failed to fetch marketing stats" });
      }
    }
  );

  app.get("/api/maintenance", async (req, res) => {
    try {
      const [settings] = await db.select().from(platformSettings).limit(1);
      console.log("Maintenance check - settings:", settings);
      res.json({
        maintenanceMode: settings?.maintenanceMode || false,
      });
    } catch (err) {
      console.error("Error fetching maintenance:", err);
      res.json({ maintenanceMode: false });
    }
  });
// Fix the maintenance endpoints
app.post(
  "/api/admin/maintenance/on",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      // Check if settings exist first
      const [existingSettings] = await db.select().from(platformSettings).limit(1);
      
      let updated;
      if (existingSettings) {
        [updated] = await db
          .update(platformSettings)
          .set({ maintenanceMode: true, updatedAt: new Date() })
          .where(eq(platformSettings.id, existingSettings.id))
          .returning();
      } else {
        // Create initial settings if none exist
        [updated] = await db
          .insert(platformSettings)
          .values({ maintenanceMode: true, updatedAt: new Date() })
          .returning();
      }

      res.json({ message: "Maintenance mode enabled", settings: updated });
    } catch (err) {
      console.error("Error enabling maintenance:", err);
      res.status(500).json({ message: "Failed to enable maintenance mode" });
    }
  }
);

app.post(
  "/api/admin/maintenance/off",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const [existingSettings] = await db.select().from(platformSettings).limit(1);
      
      let updated;
      if (existingSettings) {
        [updated] = await db
          .update(platformSettings)
          .set({ maintenanceMode: false, updatedAt: new Date() })
          .where(eq(platformSettings.id, existingSettings.id))
          .returning();
      } else {
        [updated] = await db
          .insert(platformSettings)
          .values({ maintenanceMode: false, updatedAt: new Date() })
          .returning();
      }

      res.json({ message: "Maintenance mode disabled", settings: updated });
    } catch (err) {
      console.error("Error disabling maintenance:", err);
      res.status(500).json({ message: "Failed to disable maintenance mode" });
    }
  }
);

  // ==================== SUPPORT TICKET ROUTES ====================

  // User: Get unread ticket count
  app.get(
    "/api/support/unread-count",
    isAuthenticated,
    async (req: any, res) => {
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
    }
  );

  // Admin: Get unread ticket count
  app.get(
    "/api/admin/support/unread-count",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const count = await storage.getAdminUnreadTicketCount();
        res.json({ count });
      } catch (error) {
        console.error("Error getting admin unread count:", error);
        res.status(500).json({ message: "Failed to get unread count" });
      }
    }
  );

  app.get(
  "/api/admin/withdrawals/unread-count",
  isAuthenticated,
  isAdmin,
  async (req: any, res) => {
    try {
      const count = await storage.getAdminUnreadWithdrawalCount();
      res.json({ count });
    } catch (error) {
      console.error("Error getting withdrawal unread count:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  }
);
  app.get(
  "/api/admin/verification/unread-count",
  isAuthenticated,
  isAdmin,
  async (req: any, res) => {
    try {
      const count = await storage.getAdminUnreadVerificationCount();
      res.json({ count });
    } catch (error) {
      console.error("Error getting verification unread count:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  }
);


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
        return res
          .status(400)
          .json({ message: "Subject and description are required" });
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
  app.get(
    "/api/support/tickets/:id",
    isAuthenticated,
    async (req: any, res) => {
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
          await storage.updateSupportTicket(ticket.id, {
            userHasUnread: false,
          });
        }

        res.json(ticket);
      } catch (error) {
        console.error("Error getting ticket:", error);
        res.status(500).json({ message: "Failed to get ticket" });
      }
    }
  );

  // Admin: Get all support tickets
  app.get(
    "/api/admin/support/tickets",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const tickets = await storage.getSupportTickets();

        // Get user info for each ticket
        const ticketsWithUsers = await Promise.all(
          tickets.map(async (ticket) => {
            const user = await storage.getUser(ticket.userId);
            return {
              ...ticket,
              user: user
                ? {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                  }
                : null,
            };
          })
        );

        res.json(ticketsWithUsers);
      } catch (error) {
        console.error("Error getting admin tickets:", error);
        res.status(500).json({ message: "Failed to get tickets" });
      }
    }
  );

  // Admin: Get single ticket
  app.get(
    "/api/admin/support/tickets/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
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
          user: user
            ? {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
              }
            : null,
        });
      } catch (error) {
        console.error("Error getting ticket:", error);
        res.status(500).json({ message: "Failed to get ticket" });
      }
    }
  );

  // Admin: Update ticket status/response
  app.patch(
    "/api/admin/support/tickets/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
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

        const updated = await storage.updateSupportTicket(
          req.params.id,
          updateData
        );
        res.json(updated);
      } catch (error) {
        console.error("Error updating ticket:", error);
        res.status(500).json({ message: "Failed to update ticket" });
      }
    }
  );

  // Admin: Delete ticket
  app.delete(
    "/api/admin/support/tickets/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const ticket = await storage.getSupportTicket(req.params.id);
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }

        // 1️⃣ Combine all image arrays safely
        const parseArray = (arr: any) => {
          if (!arr) return [];
          if (Array.isArray(arr)) return arr;
          try {
            const parsed = JSON.parse(arr);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        };

        const allImages = [
          ...parseArray(ticket.imageUrls),
          ...parseArray(ticket.adminImageUrls),
        ];

        console.log("Deleting images:", allImages);

        // 2️⃣ Delete each image from R2
        for (const url of allImages) {
          if (!url) continue;
          const key = url
            .replace(`${process.env.R2_PUBLIC_URL}/`, "")
            .replace(/^\/+/, ""); // remove leading slash
          if (key) await deleteR2Object(key);
        }

        // 3️⃣ Delete messages for this ticket
        await db
          .delete(supportMessages)
          .where(eq(supportMessages.ticketId, ticket.id));

        // 4️⃣ Delete ticket itself
        await storage.deleteSupportTicket(req.params.id);

        res.json({
          message: "Ticket, messages, and all images deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting ticket:", error);
        res.status(500).json({ message: "Failed to delete ticket" });
      }
    }
  );

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

  app.post(
    "/api/support/upload",
    isAuthenticated,
    supportUpload.array("images", 5),
    async (req: any, res) => {
      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: "No files uploaded" });
        }

        const imageUrls = (req.files as any[]).map((file) => {
          const fileKey = file.key; // e.g., support/12345.png
          return `${process.env.R2_PUBLIC_URL}/${fileKey}`; // use your public URL
        });

        res.json({ imageUrls });
      } catch (error) {
        console.error("Error uploading images:", error);
        res.status(500).json({ message: "Failed to upload images" });
      }
    }
  );

  // Get messages for a ticket (user)
  app.get(
    "/api/support/tickets/:id/messages",
    isAuthenticated,
    async (req: any, res) => {
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
    }
  );

  // User: Add a message to their ticket
  app.post(
    "/api/support/tickets/:id/messages",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const ticket = await storage.getSupportTicket(req.params.id);
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }
        if (ticket.userId !== req.user!.id) {
          return res.status(403).json({ message: "Access denied" });
        }
        if (ticket.status === "closed") {
          return res
            .status(400)
            .json({ message: "Cannot add messages to a closed ticket" });
        }

        const parsed = insertSupportMessageSchema.safeParse({
          ticketId: req.params.id,
          senderId: req.user!.id,
          senderType: "user",
          message: req.body.message,
          imageUrls: req.body.imageUrls || [],
        });

        if (!parsed.success) {
          return res
            .status(400)
            .json({
              message: "Invalid message data",
              errors: parsed.error.errors,
            });
        }

        const message = await storage.createSupportMessage(parsed.data);

        // Mark ticket as unread for admin
        await storage.updateSupportTicket(req.params.id, {
          adminHasUnread: true,
          updatedAt: new Date(),
        });

        res.json(message);
      } catch (error) {
        console.error("Error adding message:", error);
        res.status(500).json({ message: "Failed to add message" });
      }
    }
  );

  // Admin: Get messages for a ticket
  app.get(
    "/api/admin/support/tickets/:id/messages",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const messages = await storage.getMessagesByTicketId(req.params.id);
        res.json(messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Failed to fetch messages" });
      }
    }
  );

  // Admin: Add a message to a ticket
  app.post(
    "/api/admin/support/tickets/:id/messages",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
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
          return res
            .status(400)
            .json({
              message: "Invalid message data",
              errors: parsed.error.errors,
            });
        }

        const message = await storage.createSupportMessage(parsed.data);

        // Mark ticket as unread for user and update status
        await storage.updateSupportTicket(req.params.id, {
          userHasUnread: true,
          status: "in_progress",
          updatedAt: new Date(),
        });

        res.json(message);
      } catch (error) {
        console.error("Error adding message:", error);
        res.status(500).json({ message: "Failed to add message" });
      }
    }
  );

  app.patch(
    "/api/admin/support/tickets/:id/mark-as-read",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { id } = req.params;

        // Use the correct method name
        await storage.markTicketAsReadByAdmin(id);

        // Fetch the updated ticket
        const updatedTicket = await storage.getSupportTicket(id);

        res.json(updatedTicket);
      } catch (error) {
        console.error("Error marking ticket as read:", error);
        res.status(500).json({ message: "Failed to mark ticket as read" });
      }
    }
  );

   // ==================== RINGTONE VOLTZ GAME ROUTES ====================

  const voltzCooldowns = new Map<string, number>();
  const VOLTZ_COOLDOWN_MS = 3000;

  // Play Ringtone Voltz game
app.post("/api/play-voltz", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId, competitionId, switchChosen } = req.body;

    if (!orderId || !competitionId) {
      return res.status(400).json({ success: false, message: "Order ID and Competition ID are required" });
    }

    const cooldownKey = `${userId}-${orderId}`;
    const lastPlayTime = voltzCooldowns.get(cooldownKey) || 0;
    const now = Date.now();
    if (now - lastPlayTime < VOLTZ_COOLDOWN_MS) {
      return res.status(429).json({ success: false, message: "Please wait a moment before playing again" });
    }
    voltzCooldowns.set(cooldownKey, now);

    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId || order.status !== "completed") {
      return res.status(400).json({ success: false, message: "No valid Voltz game purchase found" });
    }

    const playsUsed = await db.select({ count: sql<number>`count(*)` }).from(voltzUsage).where(eq(voltzUsage.orderId, orderId));
    const usedCount = Number(playsUsed[0]?.count || 0);
    const playsRemaining = order.quantity - usedCount;
    if (playsRemaining <= 0) {
      return res.status(400).json({ success: false, message: "No plays remaining in this purchase" });
    }

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const [config] = await db.select().from(gameVoltzConfig).where(eq(gameVoltzConfig.id, "active"));
    const voltzConfig = config || DEFAULT_VOLTZ_CONFIG;
    if (!voltzConfig.isActive) {
      return res.status(400).json({ success: false, message: "Ringtone Voltz is currently unavailable" });
    }

    // --- GET ALL ACTIVE PRIZES ---
    const prizes = await db.select().from(voltzPrizes).where(eq(voltzPrizes.isActive, true)).orderBy(asc(voltzPrizes.displayOrder));

    if (prizes.length === 0) {
      return res.status(400).json({ success: false, message: "No prizes configured for Voltz game" });
    }

    // --- FIX: PROPER WEIGHTED SELECTION ---
    // Step 1: Determine if player wins based on winProbability
    const winProbability = parseFloat(voltzConfig.winProbability) || 10;
    const winRoll = Math.random() * 100;
    const isWinner = winRoll < winProbability;

    let selectedPrize = null;
    let outcome: "noWin" | "win" | "freeReplay" = "noWin";
    let rewardType = "no_win";
    let rewardValue = "0";
    let isWin = false;
    let isFreeReplay = false;
    let isNoWin = true;

    if (isWinner) {
      // --- WINNING PRIZES (cash, points, physical) ---
      // Filter to winning prizes and check maxWins
      const winPrizes = prizes.filter(p => 
        (p.rewardType === "cash" || p.rewardType === "points" || p.rewardType === "physical") &&
        (p.maxWins === null || (p.quantityWon || 0) < p.maxWins)
      );

      if (winPrizes.length > 0) {
        // --- WEIGHTED RANDOM SELECTION (THIS IS THE FIX) ---
        const totalWeight = winPrizes.reduce((sum, p) => sum + p.weight, 0);
        let randomWeight = Math.random() * totalWeight;
        
        for (const prize of winPrizes) {
          randomWeight -= prize.weight;
          if (randomWeight <= 0) {
            selectedPrize = prize;
            break;
          }
        }
        
        // Fallback if selection failed
        if (!selectedPrize) {
          selectedPrize = winPrizes[0];
        }

        // --- SET WIN VALUES ---
        isWin = true;
        isNoWin = false;
        outcome = "win";
        rewardType = selectedPrize.rewardType;
        rewardValue = selectedPrize.prizeValue || "0";
        
        // For physical, use prize name as value display
        if (rewardType === "physical") {
          rewardValue = selectedPrize.prizeName || "Physical Prize";
        }
      } else {
        // No winning prizes available
        isNoWin = true;
        outcome = "noWin";
        rewardType = "no_win";
        rewardValue = "0";
        
        // Check if there's a "no_win" prize
        const noWinPrizes = prizes.filter(p => p.rewardType === "no_win");
        if (noWinPrizes.length > 0) {
          selectedPrize = noWinPrizes[0];
        }
      }
    } else {
      // --- LOST THE WIN ROLL - Check for free replay or no win ---
      const freeReplayProbability = parseFloat(voltzConfig.freeReplayProbability) || 5;
      const freeRoll = Math.random() * 100;
      
      const freeReplayPrizes = prizes.filter(p => 
        p.rewardType === "try_again" &&
        (p.maxWins === null || (p.quantityWon || 0) < p.maxWins)
      );

      if (freeRoll < freeReplayProbability && freeReplayPrizes.length > 0) {
        // --- WEIGHTED SELECTION FOR FREE REPLAY ---
        const totalWeight = freeReplayPrizes.reduce((sum, p) => sum + p.weight, 0);
        let randomWeight = Math.random() * totalWeight;
        
        for (const prize of freeReplayPrizes) {
          randomWeight -= prize.weight;
          if (randomWeight <= 0) {
            selectedPrize = prize;
            break;
          }
        }
        
        if (!selectedPrize) {
          selectedPrize = freeReplayPrizes[0];
        }

        isFreeReplay = true;
        isNoWin = false;
        outcome = "freeReplay";
        rewardType = "try_again";
        rewardValue = "0";
      } else {
        // --- NO WIN ---
        isNoWin = true;
        outcome = "noWin";
        rewardType = "no_win";
        rewardValue = "0";
        
        // Check if there's a "no_win" prize
        const noWinPrizes = prizes.filter(p => p.rewardType === "no_win");
        if (noWinPrizes.length > 0) {
          selectedPrize = noWinPrizes[0];
        }
      }
    }

    // --- FALLBACK: If no prize selected, create a default ---
    if (!selectedPrize) {
      isNoWin = true;
      outcome = "noWin";
      rewardType = "no_win";
      rewardValue = "0";
      selectedPrize = {
        id: "no-win",
        prizeName: "No Win",
        prizeValue: "0",
        rewardType: "no_win",
        weight: 0,
        maxWins: null,
        quantityWon: 0,
        isActive: true,
        displayOrder: 999,
        imageUrl: null,
      };
    }

    // --- GET ALL PRIZE DISPLAY VALUES FOR THE SWITCHES ---
    const getPrizeDisplay = (p: typeof prizes[0]) => {
      if (p.rewardType === "cash") return `£${parseFloat(p.prizeValue || "0").toFixed(2)}`;
      if (p.rewardType === "points") return `${Math.floor(parseFloat(p.prizeValue || "0"))} PTS`;
      if (p.rewardType === "physical") {
        const prizeName = p.prizeName || "Prize";
        if (prizeName.length > 12) {
          return prizeName.substring(0, 10) + "…";
        }
        return prizeName;
      }
      return "REPLAY";
    };

    const shuffleArray = <T,>(arr: T[]): T[] => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // --- BUILD SWITCH TEXTS ---
    let switchTexts: string[] = [];
    const realPrizes = prizes.filter(p => p.rewardType === "cash" || p.rewardType === "points");
    const physicalPrizes = prizes.filter(p => p.rewardType === "physical");
    const allDisplayValues = [...realPrizes.map(getPrizeDisplay), ...physicalPrizes.map(getPrizeDisplay)];

    if (isWin && selectedPrize) {
      // WIN: Show the winning value on all switches
      const displayVal = getPrizeDisplay(selectedPrize);
      switchTexts = [displayVal, displayVal, displayVal];
    } else if (isFreeReplay) {
      // FREE REPLAY: Mix real prizes with "REPLAY"
      if (allDisplayValues.length > 0) {
        const matchVal = allDisplayValues[Math.floor(Math.random() * allDisplayValues.length)];
        switchTexts = shuffleArray([matchVal, matchVal, "REPLAY"]);
      } else {
        switchTexts = ["REPLAY", "REPLAY", "REPLAY"];
      }
    } else {
      // NO WIN: Show 3 different values that don't match
      if (allDisplayValues.length >= 3) {
        const shuffled = shuffleArray([...allDisplayValues]);
        switchTexts = [shuffled[0], shuffled[1], shuffled[2]];
      } else if (allDisplayValues.length === 2) {
        switchTexts = shuffleArray([allDisplayValues[0], allDisplayValues[0], allDisplayValues[1]]);
      } else if (allDisplayValues.length === 1) {
        switchTexts = shuffleArray([allDisplayValues[0], allDisplayValues[0], "NO MATCH"]);
      } else {
        switchTexts = shuffleArray(["£5", "£10", "£25"]);
      }
    }

    // --- RETURN IMMEDIATE RESULT (NO CONFIRMATION NEEDED) ---
    res.json({
      success: true,
      result: { 
        outcome, 
        isWin, 
        isFreeReplay, 
        rewardType: rewardType, 
        rewardValue: rewardValue,
        prizeName: selectedPrize?.prizeName || null,
        prizeId: selectedPrize?.id || null,
        isPhysical: rewardType === "physical",
        switchTexts,
        // Debug info - remove in production
        _debug: {
          winProbability,
          winRoll,
          isWinner,
          totalWeight: prizes.reduce((sum, p) => sum + p.weight, 0),
          selectedWeight: selectedPrize?.weight || 0,
        }
      },
      playsRemaining: playsRemaining - 1,
      // Note: Free replay will add a play in the confirmation step
    });
  } catch (error) {
    console.error("Error playing voltz game:", error);
    res.status(500).json({ message: "Failed to play voltz game" });
  }
});

app.post("/api/confirm-voltz-result", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId, result, switchChosen } = req.body;

    if (!orderId || !result) {
      return res.status(400).json({ success: false, message: "Order ID and result are required" });
    }

    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId) {
      return res.status(400).json({ success: false, message: "Order not found" });
    }

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Start a transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // Record the usage
      await tx.insert(voltzUsage).values({ 
        orderId, 
        userId, 
        usedAt: new Date() 
      });

      if (result.outcome === "win") {
        // --- HANDLE WIN ---
        if (result.rewardType === "cash") {
          const cashValue = parseFloat(result.rewardValue);
          const finalBalance = parseFloat(user.balance || "0") + cashValue;
          await tx.update(users).set({ balance: finalBalance.toFixed(2) }).where(eq(users.id, userId));
          
          await storage.createTransaction({
            userId,
            type: "prize",
            amount: cashValue.toFixed(2),
            description: `Ringtone Voltz Win - £${cashValue.toFixed(2)}`,
          });
          
          // Record winner
          await tx.insert(winners).values({
            userId, 
            competitionId: order.competitionId, 
            prizeDescription: "Ringtone Voltz Win",
            prizeValue: `£${cashValue.toFixed(2)} Cash`,
            isShowcase: false, 
            createdAt: new Date(), 
            updatedAt: new Date(),
          });

          // 🚀 AUTO-SYNC PRIZE
          const prizeToSync = await db.select().from(voltzPrizes).where(eq(voltzPrizes.id, result.prizeId)).limit(1);
          if (prizeToSync.length > 0) {
            await syncVoltzPrize(
              order.competitionId,
              result.prizeId,
              prizeToSync[0].prizeName || `Cash Prize`,
              cashValue,
              'cash',
              prizeToSync[0].maxWins
            );
          }

        } else if (result.rewardType === "points") {
          const pointsValue = Math.floor(parseFloat(result.rewardValue));
          const newPoints = (user.ringtonePoints || 0) + pointsValue;
          await tx.update(users).set({ ringtonePoints: newPoints }).where(eq(users.id, userId));
          
          await storage.createTransaction({
            userId,
            type: "ringtone_points",
            amount: pointsValue.toString(),
            description: `Ringtone Voltz Win - ${pointsValue} pts`,
          });
          
          // Record winner
          await tx.insert(winners).values({
            userId, 
            competitionId: order.competitionId, 
            prizeDescription: "Ringtone Voltz Win",
            prizeValue: `${pointsValue} Points`,
            isShowcase: false, 
            createdAt: new Date(), 
            updatedAt: new Date(),
          });

          // 🚀 AUTO-SYNC PRIZE
          const prizeToSync = await db.select().from(voltzPrizes).where(eq(voltzPrizes.id, result.prizeId)).limit(1);
          if (prizeToSync.length > 0) {
            await syncVoltzPrize(
              order.competitionId,
              result.prizeId,
              prizeToSync[0].prizeName || `Points Prize`,
              pointsValue,
              'points',
              prizeToSync[0].maxWins
            );
          }

        } else if (result.rewardType === "physical") {
          // Physical prize
          await storage.createTransaction({
            userId,
            type: "prize",
            amount: "0",
            description: `Physical Prize Won: ${result.prizeName} - Contact support`,
          });
          
          // Record winner
          await tx.insert(winners).values({
            userId, 
            competitionId: order.competitionId, 
            prizeDescription: `Physical Prize: ${result.prizeName}`,
            prizeValue: result.prizeName,
            isShowcase: false, 
            createdAt: new Date(), 
            updatedAt: new Date(),
          });

          // 🚀 AUTO-SYNC PRIZE
          const prizeToSync = await db.select().from(voltzPrizes).where(eq(voltzPrizes.id, result.prizeId)).limit(1);
          if (prizeToSync.length > 0) {
            await syncVoltzPrize(
              order.competitionId,
              result.prizeId,
              prizeToSync[0].prizeName || result.prizeName,
              0,
              'physical',
              prizeToSync[0].maxWins
            );
          }
        }

        // Update prize count
        if (result.prizeId && result.prizeId !== "no-win") {
          await tx.update(voltzPrizes)
            .set({ quantityWon: sql`${voltzPrizes.quantityWon} + 1` })
            .where(eq(voltzPrizes.id, result.prizeId));
        }

      } else if (result.outcome === "freeReplay") {
        // --- FREE REPLAY: Add an extra play to the order ---
        await tx.update(orders)
          .set({ quantity: order.quantity + 1 })
          .where(eq(orders.id, orderId));
      }

      // --- RECORD THE WIN IN voltzWins ---
      await tx.insert(voltzWins).values({
        orderId, 
        userId, 
        prizeId: result.prizeId || null,
        switchChosen: switchChosen || 1,
        rewardType: result.outcome === "win" ? result.rewardType : 
                    result.outcome === "freeReplay" ? "try_again" : "no_win",
        rewardValue: result.outcome === "win" ? result.rewardValue : "0",
        isWin: result.outcome === "win",
        wonAt: new Date(),
      });
    });

    // Get updated order to return correct plays remaining
    const updatedOrder = await storage.getOrder(orderId);
    const playsUsed = await db.select({ count: sql<number>`count(*)` }).from(voltzUsage).where(eq(voltzUsage.orderId, orderId));
    const usedCount = Number(playsUsed[0]?.count || 0);
    const newPlaysRemaining = updatedOrder!.quantity - usedCount;

    res.json({ 
      success: true,
      playsRemaining: newPlaysRemaining 
    });
  } catch (error) {
    console.error("Error confirming voltz result:", error);
    res.status(500).json({ message: "Failed to confirm voltz result" });
  }
});

 // Reveal all Voltz games (batch)
app.post("/api/reveal-all-voltz", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId, count, competitionId } = req.body;

    if (!orderId || !count || count <= 0 || !competitionId) {
      return res.status(400).json({ success: false, message: "Valid orderId, count, and competitionId are required" });
    }

    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId || order.status !== "completed") {
      return res.status(400).json({ success: false, message: "No valid Voltz game purchase found" });
    }

    const playsUsed = await db.select({ count: sql<number>`count(*)` }).from(voltzUsage).where(eq(voltzUsage.orderId, orderId));
    const usedCount = Number(playsUsed[0]?.count || 0);
    const playsRemaining = order.quantity - usedCount;
    if (playsRemaining <= 0) {
      return res.status(400).json({ success: false, message: "No plays remaining" });
    }

    const playsToProcess = Math.min(count, playsRemaining);
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const [config] = await db.select().from(gameVoltzConfig).where(eq(gameVoltzConfig.id, "active"));
    const voltzConfig = config || DEFAULT_VOLTZ_CONFIG;
    if (!voltzConfig.isActive) {
      return res.status(400).json({ success: false, message: "Ringtone Voltz is currently unavailable" });
    }

    const prizes = await db.select().from(voltzPrizes).where(eq(voltzPrizes.isActive, true)).orderBy(asc(voltzPrizes.displayOrder));

    if (prizes.length === 0) {
      return res.status(400).json({ success: false, message: "No prizes configured for Voltz game" });
    }

    let totalCash = 0;
    let totalPoints = 0;
    let freeReplaysWon = 0;
    const results: any[] = [];
    const prizeWinCounts = new Map<string, number>();
    const prizeSyncs: any[] = []; // 🚀 Track prizes to sync
    prizes.forEach((p) => prizeWinCounts.set(p.id, p.quantityWon || 0));

    // Helper functions for switch text generation
    const getPrizeDisplay = (p: typeof prizes[0]) => {
      if (p.rewardType === "cash") return `£${parseFloat(p.prizeValue || "0").toFixed(2)}`;
      if (p.rewardType === "points") return `${Math.floor(parseFloat(p.prizeValue || "0"))} PTS`;
      if (p.rewardType === "physical") {
        const prizeName = p.prizeName || "Prize";
        if (prizeName.length > 12) {
          return prizeName.substring(0, 10) + "…";
        }
        return prizeName;
      }
      return "REPLAY";
    };

    const shuffleArray = <T,>(arr: T[]): T[] => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const realPrizes = prizes.filter(p => p.rewardType === "cash" || p.rewardType === "points");
    const realDisplayValues = [...new Set(realPrizes.map(getPrizeDisplay))];
    
    const physicalPrizes = prizes.filter(p => p.rewardType === "physical");
    const physicalDisplayValues = physicalPrizes.map(p => getPrizeDisplay(p));

    const allDisplayValues = [...realDisplayValues, ...physicalDisplayValues];

    await db.transaction(async (tx) => {
      for (let i = 0; i < playsToProcess; i++) {
        // Filter eligible prizes including physical prizes
        const eligiblePrizes = prizes.filter((p) => {
          if (p.maxWins !== null && (p.rewardType === "cash" || p.rewardType === "points" || p.rewardType === "physical")) {
            const wins = prizeWinCounts.get(p.id) ?? 0;
            if (wins >= p.maxWins!) return false;
          }
          return true;
        });

        const finalEligible = eligiblePrizes.length ? eligiblePrizes : prizes.filter((p) => p.rewardType !== "cash" && p.rewardType !== "points" && p.rewardType !== "physical");
        const totalWeight = finalEligible.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedPrize = finalEligible[0] || prizes[0];
        for (const prize of finalEligible) {
          random -= prize.weight;
          if (random <= 0) { 
            selectedPrize = prize; 
            break; 
          }
        }

        const rewardType = selectedPrize.rewardType;
        const isWin = rewardType === "cash" || rewardType === "points" || rewardType === "physical";
        const isFreeReplay = rewardType === "try_again";
        const isNoWin = rewardType === "no_win";
        let rewardValue = "0";
        let outcome: string = "noWin";

        if (isNoWin) {
          outcome = "noWin";
          rewardValue = "0";
        } else if (isFreeReplay) {
          outcome = "freeReplay";
          rewardValue = "0";
          freeReplaysWon++;
        } else if (isWin) {
          outcome = "win";
          if (rewardType === "physical") {
            rewardValue = selectedPrize.prizeName || "Physical Prize";
          } else {
            const value = parseFloat(selectedPrize.prizeValue || "0");
            rewardValue = value.toString();
            if (rewardType === "cash") totalCash += value;
            if (rewardType === "points") totalPoints += Math.floor(value);
          }
          prizeWinCounts.set(selectedPrize.id, (prizeWinCounts.get(selectedPrize.id) || 0) + 1);

          // 🚀 Track for sync
          prizeSyncs.push({
            competitionId,
            prizeId: selectedPrize.id,
            prizeName: selectedPrize.prizeName,
            prizeValue: rewardType === "physical" ? 0 : parseFloat(selectedPrize.prizeValue || "0"),
            rewardType: rewardType,
            maxWins: selectedPrize.maxWins
          });
        }

        // Generate switch texts
        let switchTexts: string[] = [];
        if (isWin) {
          const displayVal = getPrizeDisplay(selectedPrize);
          switchTexts = [displayVal, displayVal, displayVal];
        } else if (isFreeReplay) {
          if (allDisplayValues.length > 0) {
            const matchVal = allDisplayValues[Math.floor(Math.random() * allDisplayValues.length)];
            switchTexts = shuffleArray([matchVal, matchVal, "REPLAY"]);
          } else {
            switchTexts = ["REPLAY", "REPLAY", "REPLAY"];
          }
        } else {
          if (allDisplayValues.length >= 3) {
            const pattern = Math.random();
            if (pattern < 0.5) {
              const idx1 = Math.floor(Math.random() * allDisplayValues.length);
              let idx2 = Math.floor(Math.random() * (allDisplayValues.length - 1));
              if (idx2 >= idx1) idx2++;
              switchTexts = shuffleArray([allDisplayValues[idx1], allDisplayValues[idx1], allDisplayValues[idx2]]);
            } else {
              const shuffled = shuffleArray([...allDisplayValues]);
              switchTexts = [shuffled[0], shuffled[1], shuffled[2]];
            }
          } else if (allDisplayValues.length === 2) {
            const idx1 = Math.floor(Math.random() * 2);
            const idx2 = idx1 === 0 ? 1 : 0;
            switchTexts = shuffleArray([allDisplayValues[idx1], allDisplayValues[idx1], allDisplayValues[idx2]]);
          } else if (allDisplayValues.length === 1) {
            switchTexts = shuffleArray([allDisplayValues[0], allDisplayValues[0], "NO MATCH"]);
          } else {
            switchTexts = shuffleArray(["NO MATCH", "STATIC", "OVERLOAD"]);
          }
        }

        const switchChosen = Math.floor(Math.random() * 3) + 1;
        
        // Record usage
        await tx.insert(voltzUsage).values({ 
          orderId, 
          userId, 
          usedAt: new Date() 
        });

        // Record win/loss
        await tx.insert(voltzWins).values({
          orderId, 
          userId, 
          prizeId: selectedPrize.id, 
          switchChosen,
          rewardType: isWin ? rewardType : isFreeReplay ? "try_again" : isNoWin ? "no_win" : "lose",
          rewardValue: rewardType === "physical" ? selectedPrize.prizeName : rewardValue,
          isWin, 
          wonAt: new Date(),
        });

        // Handle win payouts and records
        if (isWin) {
          if (rewardType === "cash") {
            const value = parseFloat(selectedPrize.prizeValue || "0");
            await tx.insert(winners).values({
              userId, 
              competitionId, 
              prizeDescription: "Ringtone Voltz Win",
              prizeValue: `£${value.toFixed(2)} Cash`,
              isShowcase: false, 
              createdAt: new Date(), 
              updatedAt: new Date(),
            });
          } else if (rewardType === "points") {
            const pointsValue = Math.floor(parseFloat(selectedPrize.prizeValue || "0"));
            await tx.insert(winners).values({
              userId, 
              competitionId, 
              prizeDescription: "Ringtone Voltz Win",
              prizeValue: `${pointsValue} Points`,
              isShowcase: false, 
              createdAt: new Date(), 
              updatedAt: new Date(),
            });
          } else if (rewardType === "physical") {
            // Physical prize winner record
            await storage.createTransaction({
              userId,
              type: "prize",
              amount: "0",
              description: `Physical Prize Won: ${selectedPrize.prizeName} - Contact support`,
            });
            
            await tx.insert(winners).values({
              userId, 
              competitionId, 
              prizeDescription: `Physical Prize: ${selectedPrize.prizeName}`,
              prizeValue: selectedPrize.prizeName,
              isShowcase: false, 
              createdAt: new Date(), 
              updatedAt: new Date(),
            });
          }
        }

        // Add to results array with full details
        results.push({ 
          outcome, 
          isWin, 
          isFreeReplay, 
          rewardType: isWin ? rewardType : isFreeReplay ? "try_again" : "no_win",
          rewardValue: rewardType === "physical" ? selectedPrize.prizeName : rewardValue,
          prizeName: selectedPrize.prizeName,
          prizeId: selectedPrize.id,
          switchChosen,
          switchTexts,
        });
      }

      // Apply cash winnings to user balance
      if (totalCash > 0) {
        const finalBalance = parseFloat(user.balance || "0") + totalCash;
        await tx.update(users).set({ 
          balance: finalBalance.toFixed(2), 
          updatedAt: new Date() 
        }).where(eq(users.id, userId));
        
        await storage.createTransaction({
          userId,
          type: "prize",
          amount: totalCash.toFixed(2),
          description: `Ringtone Voltz Batch Win - £${totalCash.toFixed(2)}`,
        });
      }

      // Apply points winnings
      if (totalPoints > 0) {
        const newPoints = (user.ringtonePoints || 0) + totalPoints;
        await tx.update(users).set({ 
          ringtonePoints: newPoints 
        }).where(eq(users.id, userId));
        
        await storage.createTransaction({
          userId,
          type: "ringtone_points",
          amount: totalPoints.toString(),
          description: `Ringtone Voltz Batch Win - ${totalPoints} pts`,
        });
      }

      // Apply free replays
      if (freeReplaysWon > 0) {
        await tx.update(orders).set({ 
          quantity: order.quantity + freeReplaysWon 
        }).where(eq(orders.id, orderId));
      }

      // Update prize win counts
      for (const [prizeId, count] of prizeWinCounts) {
        const originalPrize = prizes.find((p) => p.id === prizeId);
        if (originalPrize && count > (originalPrize.quantityWon || 0)) {
          await tx.update(voltzPrizes).set({ 
            quantityWon: count 
          }).where(eq(voltzPrizes.id, prizeId));
        }
      }
    });

    // 🚀 AUTO-SYNC PRIZES (Outside transaction)
    if (prizeSyncs.length > 0) {
      for (const sync of prizeSyncs) {
        try {
          await syncVoltzPrize(
            sync.competitionId,
            sync.prizeId,
            sync.prizeName,
            sync.prizeValue,
            sync.rewardType,
            sync.maxWins
          );
          console.log(`✅ Synced voltz prize: ${sync.prizeName}`);
        } catch (err) {
          console.error(`Failed to sync voltz prize ${sync.prizeName}:`, err);
        }
      }
    }

    // Calculate final plays remaining
    const updatedOrder = await storage.getOrder(orderId);
    const finalPlaysUsed = await db.select({ count: sql<number>`count(*)` }).from(voltzUsage).where(eq(voltzUsage.orderId, orderId));
    const finalUsedCount = Number(finalPlaysUsed[0]?.count || 0);
    const finalPlaysRemaining = (updatedOrder?.quantity || order.quantity) - finalUsedCount;

    res.json({ 
      success: true, 
      processed: playsToProcess, 
      results,
      totalWon: totalCash,
      totalPoints,
      freeReplaysWon,
      prizesSynced: prizeSyncs.length, // 🚀 Show sync count
      playsRemaining: finalPlaysRemaining 
    });
  } catch (error) {
    console.error("Error revealing all voltz games:", error);
    res.status(500).json({ message: "Failed to reveal all voltz games" });
  }
});

  // Get Voltz order info
  app.get("/api/voltz-order/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;
      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }

      const user = await storage.getUser(userId);
      const competition = await storage.getCompetition(order.competitionId);
      const voltzCost = parseFloat(competition?.ticketPrice || "1");

      const playsUsed = await db.select({ count: sql<number>`count(*)` }).from(voltzUsage).where(eq(voltzUsage.orderId, orderId));
      const usedCount = Number(playsUsed[0]?.count || 0);
      const history = await db.select().from(voltzWins).where(eq(voltzWins.orderId, orderId)).orderBy(desc(voltzWins.wonAt));

      res.json({
        order: {
          id: order.id,
          competitionId: order.competitionId,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          status: order.status,
          discountAmount: order.discountAmount || 0,
          discountType: order.discountType || null,
          percentageDiscount: order.percentageDiscount || 0,
        },
        user: {
          balance: user?.balance || "0",
          ringtonePoints: user?.ringtonePoints || 0,
        },
        competition,
        voltzCost,
        playsUsed: usedCount,
        playsRemaining: order.quantity - usedCount,
        history,
      });
    } catch (error) {
      console.error("Error fetching voltz order:", error);
      res.status(500).json({ message: "Failed to fetch voltz order" });
    }
  });

  // Get Voltz config (public)
  app.get("/api/voltz-config", async (req, res) => {
    try {
      const [config] = await db.select().from(gameVoltzConfig).where(eq(gameVoltzConfig.id, "active"));
      res.json({ isVisible: config?.isVisible ?? true, isActive: config?.isActive ?? true });
    } catch (error) {
      console.error("Error fetching voltz config:", error);
      res.status(500).json({ message: "Failed to fetch voltz configuration" });
    }
  });

  // Admin: Get Voltz config
  app.get("/api/admin/voltz-config", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const [config] = await db.select().from(gameVoltzConfig).where(eq(gameVoltzConfig.id, "active"));
      const prizes = await db.select().from(voltzPrizes).where(eq(voltzPrizes.isActive, true)).orderBy(asc(voltzPrizes.displayOrder));

      res.json({
        id: config?.id || "active",
        isVisible: config?.isVisible ?? true,
        isActive: config?.isActive ?? true,
        winProbability: config?.winProbability || "10.00",
        freeReplayProbability: config?.freeReplayProbability || "5.00",
        prizes,
      });
    } catch (error) {
      console.error("Error fetching admin voltz config:", error);
      res.status(500).json({ message: "Failed to fetch voltz configuration" });
    }
  });

  // Admin: Update Voltz config
  app.put("/api/admin/voltz-config", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { isVisible, isActive, winProbability, freeReplayProbability } = req.body;
      const [existing] = await db.select().from(gameVoltzConfig).where(eq(gameVoltzConfig.id, "active"));

      if (existing) {
        await db.update(gameVoltzConfig).set({
          isVisible: isVisible ?? existing.isVisible,
          isActive: isActive ?? existing.isActive,
          winProbability: winProbability || existing.winProbability,
          freeReplayProbability: freeReplayProbability || existing.freeReplayProbability,
          updatedAt: new Date(),
        }).where(eq(gameVoltzConfig.id, "active"));
      } else {
        await db.insert(gameVoltzConfig).values({
          id: "active",
          prizes: [],
          isVisible: isVisible ?? true,
          isActive: isActive ?? true,
          winProbability: winProbability || "10.00",
          freeReplayProbability: freeReplayProbability || "5.00",
        });
      }

      res.json({ success: true, message: "Voltz configuration updated" });
    } catch (error) {
      console.error("Error updating voltz config:", error);
      res.status(500).json({ message: "Failed to update voltz configuration" });
    }
  });

  // Admin: Get all Voltz prizes
  app.get("/api/admin/voltz-prizes", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const prizes = await db.select().from(voltzPrizes).orderBy(asc(voltzPrizes.displayOrder));
      res.json(prizes);
    } catch (error) {
      console.error("Error fetching voltz prizes:", error);
      res.status(500).json({ message: "Failed to fetch voltz prizes" });
    }
  });

  // Admin: Create Voltz prize
  app.post("/api/admin/voltz-prizes", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { prizeName, prizeValue, rewardType, weight, maxWins, displayOrder } = req.body;
      const [newPrize] = await db.insert(voltzPrizes).values({
        prizeName, prizeValue: prizeValue.toString(), rewardType,
        weight: weight || 10, maxWins: maxWins || null,
        displayOrder: displayOrder || 0,
      }).returning();
      res.json(newPrize);
    } catch (error) {
      console.error("Error creating voltz prize:", error);
      res.status(500).json({ message: "Failed to create voltz prize" });
    }
  });

  // Admin: Update Voltz prize
  app.put("/api/admin/voltz-prizes/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { prizeName, prizeValue, rewardType, weight, maxWins, isActive, displayOrder } = req.body;
      console.log(`🔧 [Voltz] Updating prize ${id}:`, JSON.stringify(req.body));
      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (prizeName !== undefined) updateData.prizeName = prizeName;
      if (prizeValue !== undefined) updateData.prizeValue = prizeValue.toString();
      if (rewardType !== undefined) updateData.rewardType = rewardType;
      if (weight !== undefined) updateData.weight = weight;
      if (maxWins !== undefined) updateData.maxWins = maxWins;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
      console.log(`🔧 [Voltz] Update data:`, JSON.stringify(updateData));
      const [updated] = await db.update(voltzPrizes).set(updateData).where(eq(voltzPrizes.id, id)).returning();
      console.log(`✅ [Voltz] Prize updated successfully:`, updated?.id);
      res.json(updated);
    } catch (error) {
      console.error("Error updating voltz prize:", error);
      res.status(500).json({ message: "Failed to update voltz prize" });
    }
  });

  // Admin: Delete Voltz prize
  app.delete("/api/admin/voltz-prizes/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await db.delete(voltzPrizes).where(eq(voltzPrizes.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting voltz prize:", error);
      res.status(500).json({ message: "Failed to delete voltz prize" });
    }
  });

  // Admin: Reset Voltz wins
  app.post("/api/admin/game-voltz-reset-wins", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      await db.delete(voltzWins);
      await db.update(voltzPrizes).set({ quantityWon: 0 });
      res.json({ success: true });
    } catch (err) {
      console.error("Reset voltz wins error:", err);
      res.status(500).json({ message: "Failed to reset voltz wins" });
    }
  });

  // Admin: Get Voltz wins stats
  app.get("/api/admin/voltz-wins", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const wins = await db.select().from(voltzWins).orderBy(desc(voltzWins.wonAt)).limit(100);
      const totalWins = await db.select({ count: sql<number>`count(*)` }).from(voltzWins).where(eq(voltzWins.isWin, true));
      const totalPlays = await db.select({ count: sql<number>`count(*)` }).from(voltzWins);
      res.json({ wins, totalWins: Number(totalWins[0]?.count || 0), totalPlays: Number(totalPlays[0]?.count || 0) });
    } catch (error) {
      console.error("Error fetching voltz wins:", error);
      res.status(500).json({ message: "Failed to fetch voltz wins" });
    }
  });


// CREATE GUEST ORDER
app.post("/api/guest/create-order", async (req: any, res) => {
  try {
    const { 
      guestName, 
      guestEmail, 
      guestPhone, 
      competitionId, 
      gameType, 
      quantity 
    } = req.body;

    // Validate required fields
    if (!guestName || !guestEmail || !competitionId || !gameType || !quantity) {
      return res.status(400).json({ 
        message: "Missing required fields" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      return res.status(400).json({ 
        message: "Invalid email address" 
      });
    }

    // Get competition
    const [competition] = await db
      .select()
      .from(competitions)
      .where(eq(competitions.id, competitionId));

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    // Calculate total amount
    const ticketPrice = Number(competition.ticketPrice);
    const totalAmount = ticketPrice * quantity;

    // Generate order reference
    const orderRef = `GSTR-${nanoid(8).toUpperCase()}`;

    // Create guest order
    const [guestOrder] = await db.insert(guestOrders).values({
      guestName,
      guestEmail,
      guestPhone,
      competitionId,
      gameType,
      quantity,
      totalAmount: totalAmount.toFixed(2),
      orderReference: orderRef,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "instaplay",
      createdAt: new Date(),
    }).returning();

    res.json({
      success: true,
      orderId: guestOrder.id,
      orderReference: orderRef,
      totalAmount: totalAmount.toFixed(2),
      message: "Guest order created successfully"
    });

  } catch (error) {
    console.error("Error creating guest order:", error);
    res.status(500).json({ 
      message: "Failed to create guest order",
      error: error.message 
    });
  }
});

// PROCESS GUEST PAYMENT (Instaplay)
app.post("/api/guest/process-payment", async (req: any, res) => {
  try {
    const { orderId } = req.body;

    // Get guest order
    const [guestOrder] = await db
      .select()
      .from(guestOrders)
      .where(eq(guestOrders.id, orderId));

    if (!guestOrder) {
      return res.status(404).json({ message: "Guest order not found" });
    }

    if (guestOrder.status !== "pending") {
      return res.status(400).json({ message: "Order already processed" });
    }

    // Create Cashflows payment session
    const session = await cashflows.createCompetitionPaymentSession(
      Number(guestOrder.totalAmount),
      {
        orderId: guestOrder.id,
        competitionId: guestOrder.competitionId,
        isGuest: 'true',
        guestEmail: guestOrder.guestEmail,
        guestName: guestOrder.guestName,
        quantity: guestOrder.quantity.toString(),
        paymentType: 'guest_instant_play',
        gameType: guestOrder.gameType
      }
    );

    if (!session.hostedPageUrl) {
      return res.status(500).json({ message: "Failed to create payment session" });
    }

    // Create pending payment
    await db.insert(guestPendingPayments).values({
      guestOrderId: guestOrder.id,
      paymentJobReference: session.paymentJobReference,
      amount: guestOrder.totalAmount.toString(),
      metadata: {
        competitionId: guestOrder.competitionId,
        gameType: guestOrder.gameType,
        quantity: guestOrder.quantity,
        guestEmail: guestOrder.guestEmail,
        guestName: guestOrder.guestName,
      },
      status: 'pending',
      createdAt: new Date()
    });

    res.json({
      success: true,
      redirectUrl: session.hostedPageUrl,
      sessionId: session.paymentJobReference,
      message: "Redirecting to payment..."
    });

  } catch (error) {
    console.error("Error processing guest payment:", error);
    res.status(500).json({ 
      message: "Failed to process guest payment",
      error: error.message 
    });
  }
});

// GUEST PAYMENT WEBHOOK HANDLER
app.post("/api/guest/webhook", async (req, res) => {
  console.log("GUEST WEBHOOK HIT", req.body);

  const { paymentJobReference, paymentReference } = req.body;

  // Always reply immediately
  res.status(200).json({ received: true });

  try {
    await new Promise(resolve => setTimeout(resolve, 100));

    // Find pending payment
    const [pendingPayment] = await db
      .select()
      .from(guestPendingPayments)
      .where(eq(guestPendingPayments.paymentJobReference, paymentJobReference));

    if (!pendingPayment) {
      console.warn("No guest pending payment found:", paymentJobReference);
      return;
    }

    if (pendingPayment.status !== "pending") {
      console.log("Guest payment already processed:", pendingPayment.status);
      return;
    }

    // Check payment status
    const payment = await cashflows.getPaymentStatus(
      paymentJobReference,
      paymentReference ?? undefined
    );

    const { status, paidAmount } = normalizeCashflowsStatus(payment);

    if (status === "PENDING") return;

    if (status === "FAILED") {
      await db.update(guestPendingPayments)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(guestPendingPayments.id, pendingPayment.id));

      await db.update(guestOrders)
        .set({ status: 'failed', paymentStatus: 'failed', updatedAt: new Date() })
        .where(eq(guestOrders.id, pendingPayment.guestOrderId));

      return;
    }

    if (status === "PAID" && paidAmount > 0) {
      // Process the guest order
      await processGuestOrder(
        pendingPayment.guestOrderId,
        paymentReference ?? paymentJobReference,
        paidAmount
      );
    }

  } catch (err) {
    console.error("Guest webhook error:", err);
  }
});

// Process guest order after successful payment
async function processGuestOrder(
  guestOrderId: string, 
  paymentRef: string, 
  paidAmount: number
) {
  return await db.transaction(async (tx) => {
    // Get guest order
    const [guestOrder] = await tx
      .select()
      .from(guestOrders)
      .where(eq(guestOrders.id, guestOrderId));

    if (!guestOrder) {
      throw new Error("Guest order not found");
    }

    // Update guest order
    await tx.update(guestOrders)
      .set({
        status: 'completed',
        paymentStatus: 'paid',
        paymentReference: paymentRef,
        updatedAt: new Date()
      })
      .where(eq(guestOrders.id, guestOrderId));

    // Update pending payment
    await tx.update(guestPendingPayments)
      .set({
        status: 'completed',
        paymentReference: paymentRef,
        updatedAt: new Date()
      })
      .where(eq(guestPendingPayments.guestOrderId, guestOrderId));

    // Get competition
    const [competition] = await tx
      .select()
      .from(competitions)
      .where(eq(competitions.id, guestOrder.competitionId));

    // Update competition sold tickets
    if (competition) {
      await tx.update(competitions)
        .set({ 
          soldTickets: (competition.soldTickets || 0) + guestOrder.quantity,
          updatedAt: new Date()
        })
        .where(eq(competitions.id, guestOrder.competitionId));
    }

    // Generate tickets
    const ticketNumbers = [];
    for (let i = 0; i < guestOrder.quantity; i++) {
      let ticketNumber;
      switch (guestOrder.gameType) {
        case 'pop':
          ticketNumber = `POP-G-${nanoid(8).toUpperCase()}`;
          break;
        case 'scratch':
          ticketNumber = `SCR-G-${nanoid(8).toUpperCase()}`;
          break;
        case 'spin':
          ticketNumber = `SPN-G-${nanoid(8).toUpperCase()}`;
          break;
        default:
          ticketNumber = `GST-G-${nanoid(8).toUpperCase()}`;
      }

      const [ticket] = await tx.insert(guestTickets).values({
        guestOrderId: guestOrder.id,
        ticketNumber,
        competitionId: guestOrder.competitionId,
        isWinner: false,
        createdAt: new Date(),
      }).returning();

      ticketNumbers.push(ticket.ticketNumber);
    }

    // Update order with ticket numbers
    await tx.update(guestOrders)
      .set({ ticketNumbers: JSON.stringify(ticketNumbers) })
      .where(eq(guestOrders.id, guestOrderId));

    // Send confirmation email (non-blocking)
    if (guestOrder.guestEmail) {
      sendGuestOrderConfirmation(guestOrder.guestEmail, {
        orderId: guestOrder.id,
        orderReference: guestOrder.orderReference,
        guestName: guestOrder.guestName,
        gameType: guestOrder.gameType,
        itemName: competition?.title || `${guestOrder.gameType} Game`,
        quantity: guestOrder.quantity,
        totalAmount: guestOrder.totalAmount,
        orderDate: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        paymentMethod: "Card Payment",
        ticketNumbers: ticketNumbers,
      }).catch(err => 
        console.error("Failed to send guest confirmation email:", err)
      );
    }

    return { success: true, ticketNumbers };
  });
}

// Email helper for guest orders
async function sendGuestOrderConfirmation(
  email: string, 
  orderDetails: {
    orderId: string;
    orderReference: string;
    guestName: string;
    gameType: string;
    itemName: string;
    quantity: number;
    totalAmount: string;
    orderDate: string;
    paymentMethod: string;
    ticketNumbers: string[];
  }
) {
  // Use your existing email service
  // This is a placeholder - integrate with your email provider
  console.log("Sending guest order confirmation to:", email);
  console.log("Order details:", orderDetails);
  
  // You can use your existing sendOrderConfirmationEmail function
  // with a flag for guest orders
}

// ADMIN: Get all guest orders
app.get(
  "/api/admin/guest-orders",
  isAuthenticated,
  isAdmin,
  async (req: any, res) => {
    try {
      const { search, status, dateFrom, dateTo } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 30;
      const offset = (page - 1) * limit;

      let query = db
        .select()
        .from(guestOrders)
        .orderBy(desc(guestOrders.createdAt));

      // Apply filters
      const conditions = [];
      
      if (status) {
        conditions.push(eq(guestOrders.status, status as string));
      }
      
      if (dateFrom) {
        conditions.push(gte(guestOrders.createdAt, new Date(dateFrom as string)));
      }
      
      if (dateTo) {
        const endDate = new Date(dateTo as string);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(lte(guestOrders.createdAt, endDate));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      let allOrders = await query;

      // Apply search filter
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        allOrders = allOrders.filter(order => 
          order.guestName?.toLowerCase().includes(searchTerm) ||
          order.guestEmail?.toLowerCase().includes(searchTerm) ||
          order.orderReference?.toLowerCase().includes(searchTerm) ||
          order.guestPhone?.toLowerCase().includes(searchTerm)
        );
      }

      const total = allOrders.length;
      const paginatedOrders = allOrders.slice(offset, offset + limit);

      res.json({
        orders: paginatedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + limit < total
        }
      });

    } catch (error) {
      console.error("Error fetching guest orders:", error);
      res.status(500).json({ 
        message: "Failed to fetch guest orders",
        error: error.message 
      });
    }
  }
);

// ADMIN: Get single guest order
app.get(
  "/api/admin/guest-orders/:id",
  isAuthenticated,
  isAdmin,
  async (req: any, res) => {
    try {
      const { id } = req.params;

      const [order] = await db
        .select()
        .from(guestOrders)
        .where(eq(guestOrders.id, id));

      if (!order) {
        return res.status(404).json({ message: "Guest order not found" });
      }

      // Get tickets
      const tickets = await db
        .select()
        .from(guestTickets)
        .where(eq(guestTickets.guestOrderId, id));

      res.json({
        order,
        tickets
      });

    } catch (error) {
      console.error("Error fetching guest order:", error);
      res.status(500).json({ 
        message: "Failed to fetch guest order",
        error: error.message 
      });
    }
  }
);



// <------ FAQ ROUTES ------>

// Change from /admin/faqs to /api/admin/faqs
app.post("/api/admin/faqs", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "Question and answer required" });
    }

    const result = await db
      .insert(faqs)
      .values({
        question,
        answer
      })
      .returning();

    res.json(result[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/faqs", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await db
      .select()
      .from(faqs)
      .orderBy(desc(faqs.id));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Keep public endpoint as is or also move to /api
app.get("/api/faqs", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(faqs)
      .orderBy(desc(faqs.id));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/admin/faqs/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;

    const result = await db
      .update(faqs)
      .set({
        question,
        answer
      })
      .where(eq(faqs.id, Number(id)))
      .returning();

    res.json(result[0]);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/admin/faqs/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db
      .delete(faqs)
      .where(eq(faqs.id, Number(id)));

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});



// prize table 

app.get("/api/competitions/:competitionId/prize-table",  async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    const prizes = await db
      .select()
      .from(competitionPrizes)
      .where(
        and(
          eq(competitionPrizes.competitionId, competitionId),  
        )
      )
    
    res.json(prizes);
  } catch (error) {
    console.error("Error fetching prizes:", error);
    res.status(500).json({ error: "Failed to fetch prizes" });
  }
});

app.get("/api/competitions/:competitionId/prizes", isAuthenticated, isAdmin , async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    const prizes = await db
      .select()
      .from(competitionPrizes)
      .where(
        and(
          eq(competitionPrizes.competitionId, competitionId),  
        )
      )
    
    res.json(prizes);
  } catch (error) {
    console.error("Error fetching prizes:", error);
    res.status(500).json({ error: "Failed to fetch prizes" });
  }
});

// CREATE a new prize
app.post("/api/competitions/:competitionId/prizes", isAuthenticated, isAdmin , async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { prizeName, prizeValue, totalQuantity, remainingQuantity  } = req.body;
    
   
   
    
    const [newPrize] = await db
      .insert(competitionPrizes)
      .values({
        competitionId,
        prizeName,
        prizeValue,
        totalQuantity,
        remainingQuantity,
      })
      .returning();
    
    res.json(newPrize);
  } catch (error) {
    console.error("Error creating prize:", error);
    res.status(500).json({ error: "Failed to create prize" });
  }
});

// UPDATE a prize
app.put("/api/prizes/:prizeId", isAuthenticated, isAdmin , async (req, res) => {
  try {
    const { prizeId } = req.params;
    const { prizeName, prizeValue, totalQuantity, remainingQuantity } = req.body;
    
    
    const [updatedPrize] = await db
      .update(competitionPrizes)
      .set({
        prizeName,
        prizeValue,
        totalQuantity,
        remainingQuantity,
        updatedAt: new Date(),
      })
      .where(eq(competitionPrizes.id, prizeId))
      .returning();
    
    res.json(updatedPrize);
  } catch (error) {
    console.error("Error updating prize:", error);
    res.status(500).json({ error: "Failed to update prize" });
  }
});

// DELETE a prize
app.delete("/api/prizes/:prizeId", isAuthenticated, isAdmin , async (req, res) => {
  try {
    const { prizeId } = req.params;
  
    
    await db
      .delete(competitionPrizes)
      .where(eq(competitionPrizes.id, prizeId));
    
    res.json({ message: "Prize deleted successfully" });
  } catch (error) {
    console.error("Error deleting prize:", error);
    res.status(500).json({ error: "Failed to delete prize" });
  }
});

// UPDATE prize quantity when a prize is won
app.patch("/api/prizes/:prizeId/reduce-quantity", isAuthenticated, isAdmin , async (req, res) => {
  try {
    const { prizeId } = req.params;
    const { quantity = 1 } = req.body;
    
    const [prize] = await db
      .select()
      .from(competitionPrizes)
      .where(eq(competitionPrizes.id, prizeId));
    
    if (!prize) {
      return res.status(404).json({ error: "Prize not found" });
    }
    
    if (prize.remainingQuantity < quantity) {
      return res.status(400).json({ error: "Not enough prizes remaining" });
    }
    
    const [updatedPrize] = await db
      .update(competitionPrizes)
      .set({
        remainingQuantity: prize.remainingQuantity - quantity,
        updatedAt: new Date(),
      })
      .where(eq(competitionPrizes.id, prizeId))
      .returning();
    
    res.json(updatedPrize);
  } catch (error) {
    console.error("Error reducing prize quantity:", error);
    res.status(500).json({ error: "Failed to update prize quantity" });
  }
});


// Add these routes to your server file

// GET ticket settings for a competition
app.get("/api/competitions/:competitionId/ticket-settings", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    const [settings] = await db
      .select()
      .from(competitionTicketSettings)
      .where(eq(competitionTicketSettings.competitionId, competitionId));
    
    if (!settings) {
      // Return default settings if none exist
      return res.json({
        competitionId,
        winPercentage: 30,
        ticketCost: 1,
        isActive: true
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error("Error fetching ticket settings:", error);
    res.status(500).json({ error: "Failed to fetch ticket settings" });
  }
});

// CREATE or UPDATE ticket settings
app.post("/api/competitions/:competitionId/ticket-settings", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { winPercentage, ticketCost, isActive } = req.body;
    
    // Check if settings already exist
    const [existing] = await db
      .select()
      .from(competitionTicketSettings)
      .where(eq(competitionTicketSettings.competitionId, competitionId));
    
    let result;
    
    if (existing) {
      // Update existing settings
      [result] = await db
        .update(competitionTicketSettings)
        .set({
          winPercentage,
          ticketCost,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(competitionTicketSettings.competitionId, competitionId))
        .returning();
    } else {
      // Create new settings
      [result] = await db
        .insert(competitionTicketSettings)
        .values({
          competitionId,
          winPercentage,
          ticketCost,
          isActive,
        })
        .returning();
    }
    
    res.json(result);
  } catch (error) {
    console.error("Error saving ticket settings:", error);
    res.status(500).json({ error: "Failed to save ticket settings" });
  }
});

// Get current ticket availability and win rate for users
app.get("/api/competitions/:competitionId/ticket-info", async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    // Get ticket settings
    const [settings] = await db
      .select()
      .from(competitionTicketSettings)
      .where(eq(competitionTicketSettings.competitionId, competitionId));
    
    // Get total remaining prizes
    const prizes = await db
      .select()
      .from(competitionPrizes)
      .where(eq(competitionPrizes.competitionId, competitionId));
    
    const totalRemaining = prizes.reduce((sum, prize) => sum + prize.remainingQuantity, 0);
    const totalPrizes = prizes.reduce((sum, prize) => sum + prize.totalQuantity, 0);
    
    res.json({
      winPercentage: settings?.winPercentage || 30,
      ticketCost: settings?.ticketCost || 1,
      isActive: settings?.isActive ?? true,
      totalRemainingPrizes: totalRemaining,
      totalPrizes: totalPrizes,
      prizesAvailable: totalRemaining > 0
    });
  } catch (error) {
    console.error("Error fetching ticket info:", error);
    res.status(500).json({ error: "Failed to fetch ticket info" });
  }
});

const uploadCompetitionVideo = createVideoUploader('competition-videos');

// Get all competitions that have videos (Public route - no auth needed)
// In your backend route
app.get('/api/promo-competitions/with-videos', isAuthenticated, isAdmin, async (req, res) => {
  try {
  
    
    const competitionsWithVideos = await db.select({
      id: competitions.id,
      title: competitions.title,
      type: competitions.type,
      videoUrl: competitions.videoUrl,
      videoKey: competitions.videoKey,
      videoMimeType: competitions.videoMimeType,
      videoUpdatedAt: competitions.videoUpdatedAt,
    })
    .from(competitions)
    .where(sql`${competitions.videoUrl} IS NOT NULL`)
    .orderBy(desc(competitions.videoUpdatedAt));
    
   
    
    return res.status(200).json(competitionsWithVideos);
  } catch (error) {
    console.error('Error fetching competitions with videos:', error);
    return res.status(500).json({ error: 'Failed to fetch competitions with videos' });
  }
});

app.post('/api/promo-competitions/:id/video', uploadCompetitionVideo.single('video'), isAuthenticated, isAdmin,  async (req, res) => {
  try {
    const competitionId = req.params.id;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Get the S3 key from the uploaded file
    const videoKey = (file as any).key; // multer-s3 adds the key property
    const videoUrl = `${process.env.R2_PUBLIC_URL}/${videoKey}`;

    // Check if competition exists
    const competition = await db.select().from(competitions).where(eq(competitions.id, competitionId)).limit(1);
   
      if (!competition.length) {
        await deleteR2Object(videoKey);
        return res.status(404).json({ error: 'Competition not found' });
      }

      if (competition[0].type !== "instant") {
        await deleteR2Object(videoKey);
        return res.status(400).json({
          error: "Videos are only allowed for instant competitions",
        });
      }
    
    // Delete existing video if any
    if (competition[0].videoKey) {
      await deleteR2Object(competition[0].videoKey);
    }
    
    // Update competition record with video info
    await db.update(competitions)
      .set({
        videoUrl: videoUrl,
        videoKey: videoKey,
        videoMimeType: file.mimetype,
        videoUpdatedAt: new Date(),
      })
      .where(eq(competitions.id, competitionId));
    
    res.json({
      success: true,
      video: {
        url: videoUrl,
        key: videoKey,
      }
    });
  } catch (error) {
    console.error('Error uploading competition video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Delete competition video
app.delete('/api/promo-competitions/:id/video', isAuthenticated, isAdmin , async (req, res) => {
  try {
    const competitionId = req.params.id;
    
    const competition = await db.select().from(competitions).where(eq(competitions.id, competitionId)).limit(1);
    
    if (!competition.length) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    if (competition[0].videoKey) {
      // Delete from R2
      await deleteR2Object(competition[0].videoKey);
      
      // Clear video fields in database
      await db.update(competitions)
        .set({
          videoUrl: null,
          videoKey: null,
          videoMimeType: null,
          videoUpdatedAt: null,
        })
        .where(eq(competitions.id, competitionId));
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting competition video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});


app.get('/api/promo-competitions/:id/video', async (req, res) => {
  try {
    const competitionId = req.params.id;
    
    const competition = await db.select({
      id: competitions.id,
      title: competitions.title,
      videoUrl: competitions.videoUrl,
      videoKey: competitions.videoKey,
      videoMimeType: competitions.videoMimeType,
      videoUpdatedAt: competitions.videoUpdatedAt,
    }).from(competitions).where(eq(competitions.id, competitionId)).limit(1);
    
    if (!competition.length) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    if (!competition[0].videoUrl) {
      return res.status(404).json({ error: 'No video available for this competition' });
    }
    
    // Return video info (but not the key for security)
    res.json({
      success: true,
      video: {
        url: competition[0].videoUrl,
        mimeType: competition[0].videoMimeType,
        updatedAt: competition[0].videoUpdatedAt,
      }
    });
  } catch (error) {
    console.error('Error fetching competition video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});





  // ═══════════════════ SLOT MACHINE ROUTES ═══════════════════

  app.post("/api/create-slot-order", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { competitionId, quantity = 1 } = req.body;
      const competition = await storage.getCompetition(competitionId);
      if (!competition) return res.status(404).json({ message: "Competition not found" });
      const slotCostPerSpin = parseFloat(competition.ticketPrice);
      const { originalTotal, discountPercent, discountedTotal, savings } = calculateDiscountedTotal(slotCostPerSpin, quantity);
      const user = await storage.getUser(userId);
      const userBalance = parseFloat(user?.balance || "0");
      const userPoints = user?.ringtonePoints || 0;
      const order = await storage.createOrder({
        userId, competitionId, quantity,
        totalAmount: discountedTotal.toString(),
        paymentMethod: "pending", status: "pending",
      });
      res.json({
        success: true, orderId: order.id, competitionId,
        totalAmount: discountedTotal, originalAmount: originalTotal,
        discountPercent, savings, quantity,
        userBalance: { wallet: userBalance, ringtonePoints: userPoints, pointsValue: userPoints * 0.01 },
        slotCost: slotCostPerSpin,
        competition: { title: competition.title, type: competition.type },
      });
    } catch (error) {
      console.error("Error creating slot order:", error);
      res.status(500).json({ message: "Failed to create slot order" });
    }
  });

  app.post("/api/process-slot-payment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId, useWalletBalance = false, useRingtonePoints = false, useInstaplay = false } = req.body;
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (!order || order.userId !== userId) return res.status(404).json({ message: "Order not found" });
      if (order.status !== "pending") return res.status(400).json({ message: "Order already processed" });
      const [competition] = await db.select().from(competitions).where(eq(competitions.id, order.competitionId));
      if (!competition || competition.type !== "slot") return res.status(400).json({ message: "Invalid competition type" });
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (useInstaplay) {
        const totalAmount = Number(order.totalAmount);
        const session = await cashflows.createCompetitionPaymentSession(totalAmount, {
          orderId, competitionId: order.competitionId, userId,
          quantity: order.quantity.toString(), paymentType: "instant_play", gameType: "slot",
        });
        if (!session.hostedPageUrl) return res.status(500).json({ message: "Failed to create payment session" });
        await db.insert(pendingPayments).values({
          userId, orderId: order.id, paymentJobReference: session.paymentJobReference,
          paymentType: "instant_play", amount: totalAmount.toString(),
          metadata: { competitionId: competition.id, competitionTitle: competition.title, gameType: "slot", quantity: order.quantity },
          status: "pending", createdAt: new Date(),
        });
        await db.update(orders).set({ paymentMethod: "instaplay", cashflowsAmount: totalAmount.toString(), updatedAt: new Date() }).where(eq(orders.id, orderId));
        return res.json({ success: true, redirectUrl: session.hostedPageUrl, sessionId: session.paymentJobReference, paymentType: "instaplay" });
      }

      const totalAmount = Number(order.totalAmount);
      let remainingAmount = totalAmount;
      let walletUsed = 0, pointsUsed = 0;
      const paymentBreakdown: any[] = [];

      if (useWalletBalance) {
        const walletBalance = Number(user?.balance) || 0;
        const walletAmount = Math.min(walletBalance, remainingAmount);
        if (walletAmount > 0) {
          walletUsed = walletAmount;
          remainingAmount -= walletUsed;
          paymentBreakdown.push({ method: "wallet", amount: walletUsed, description: `Wallet: £${walletUsed.toFixed(2)}` });
        }
      }
      if (useRingtonePoints && remainingAmount > 0) {
        const availablePoints = user?.ringtonePoints || 0;
        const pointsNeeded = Math.ceil(remainingAmount * 100);
        if (availablePoints < pointsNeeded) {
          if (walletUsed > 0) {
            const curr = Number(user?.balance) || 0;
            await db.update(users).set({ balance: (curr + walletUsed).toString() }).where(eq(users.id, userId));
          }
          return res.status(400).json({ message: `Insufficient points. You need ${pointsNeeded} points.`, remainingAmount, pointsNeeded });
        }
        const pointsAmount = pointsNeeded * 0.01;
        pointsUsed = pointsNeeded;
        remainingAmount -= pointsAmount;
        paymentBreakdown.push({ method: "ringtone_points", amount: pointsAmount, pointsUsed: pointsNeeded, description: `Points: £${pointsAmount.toFixed(2)} (${pointsNeeded} pts)` });
      }
      if (remainingAmount > 0.01) return res.json({ success: false, message: "Card payment required", remainingAmount, requiresCashflows: true });

      if (walletUsed > 0) await db.update(users).set({ balance: (Number(user?.balance || "0") - walletUsed).toString() }).where(eq(users.id, userId));
      if (pointsUsed > 0) await db.update(users).set({ ringtonePoints: (user?.ringtonePoints || 0) - pointsUsed }).where(eq(users.id, userId));

      let paymentMethodText = "Discount";
      if (walletUsed > 0 && pointsUsed > 0) paymentMethodText = "Wallet+Points";
      else if (walletUsed > 0) paymentMethodText = "Wallet";
      else if (pointsUsed > 0) paymentMethodText = "Points";

      await db.update(orders).set({
        status: "completed", paymentMethod: paymentMethodText,
        walletAmount: walletUsed.toString(), pointsAmount: pointsUsed.toString(),
        cashflowsAmount: "0", paymentBreakdown: JSON.stringify(paymentBreakdown), updatedAt: new Date(),
      }).where(eq(orders.id, orderId));
      await db.update(competitions).set({ soldTickets: (competition.soldTickets || 0) + order.quantity, updatedAt: new Date() }).where(eq(competitions.id, competition.id));
      await db.insert(transactions).values({ userId, type: "purchase", amount: totalAmount.toFixed(2), description: `Slot Machine Purchase - ${order.quantity} spins`, orderId, createdAt: new Date() });

      const slotTickets = [];
      for (let i = 0; i < order.quantity; i++) {
        const ticketNumber = `SLT-${orderId.slice(0, 8).toUpperCase()}-${(i + 1).toString().padStart(3, "0")}`;
        const [ticket] = await db.insert(tickets).values({ userId, competitionId: order.competitionId, orderId: order.id, ticketNumber, isWinner: false, createdAt: new Date() }).returning();
        slotTickets.push(ticket);
      }

      if (user?.email) {
        sendOrderConfirmationEmail(user.email, {
          orderId: order.id, userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer",
          orderType: "slot", itemName: competition.title, quantity: order.quantity,
          totalAmount: order.totalAmount, orderDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          paymentMethod: paymentMethodText, ticketNumbers: slotTickets.map(t => t.ticketNumber),
        }).catch(err => console.error("Failed to send Slot confirmation email:", err));
      }

      res.json({ success: true, message: "Slot machine purchase complete!", competitionId: order.competitionId, orderId: order.id, quantity: order.quantity, paymentBreakdown });
    } catch (error) {
      console.error("Error processing slot payment:", error);
      res.status(500).json({ message: "Failed to process slot payment" });
    }
  });

  app.get("/api/slot-order/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;
      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== userId) return res.status(404).json({ message: "Order not found" });
      const user = await storage.getUser(userId);
      const competition = await storage.getCompetition(order.competitionId);
      const slotCost = parseFloat(competition?.ticketPrice || "1");
      const [slotCfg] = await db.select().from(gameSlotConfig).where(eq(gameSlotConfig.id, "active"));
      const creditsPerSpin = slotCfg?.creditsPerSpin || 20;
      const totalCredits = order.quantity * creditsPerSpin;
      const history = await db.select().from(slotUsage).where(eq(slotUsage.orderId, orderId)).orderBy(desc(slotUsage.usedAt));
      res.json({
        order: { id: order.id, competitionId: order.competitionId, quantity: order.quantity, totalAmount: order.totalAmount, status: order.status },
        user: { balance: user?.balance || "0", ringtonePoints: user?.ringtonePoints || 0 },
        competition, slotCost, totalCredits, creditsPerSpin, history,
      });
    } catch (error) {
      console.error("Error fetching slot order:", error);
      res.status(500).json({ message: "Failed to fetch slot order" });
    }
  });

  // ─── play-slot: server determines result BEFORE spin animation ─────────
  // Called by slotGamePage when Phaser requests a spin (slotSpinRequest).
  // Mirrors the Voltz pattern: server is source of truth, client animates result.


app.post("/api/play-slot", isAuthenticated, async (req: any, res) => {
  try {
    console.log("[API] 🎰 Play slot request received:", {
      userId: req.user.id,
      orderId: req.body.orderId,
      coinsSpent: req.body.coinsSpent,
      timestamp: new Date().toISOString()
    });

    const userId = req.user.id;
    const { orderId, coinsSpent } = req.body;
    
    if (!orderId) {
      console.log("[API] ❌ Missing orderId");
      return res.status(400).json({ message: "Order ID required" });
    }

    // Get order
    const order = await storage.getOrder(orderId);
    console.log("[API] Order found:", { 
      orderId: order?.id, 
      userId: order?.userId, 
      status: order?.status,
      quantity: order?.quantity 
    });

    if (!order || order.userId !== userId || order.status !== "completed") {
      console.log("[API] ❌ Invalid order:", { 
        exists: !!order, 
        userIdMatch: order?.userId === userId, 
        status: order?.status 
      });
      return res.status(400).json({ message: "No valid slot order found" });
    }

    // ── Enforce spin limit ───────────────────────────────────────────────
    const existingSpins = await db.select({ id: slotUsage.id }).from(slotUsage).where(eq(slotUsage.orderId, orderId));
    console.log("[API] Existing spins:", existingSpins.length, "of", order.quantity);
    
    if (existingSpins.length >= order.quantity) {
      console.log("[API] ⚠️ All spins used");
      return res.status(403).json({ 
        message: "All spins used", 
        spinsUsed: existingSpins.length, 
        spinsAllowed: order.quantity 
      });
    }
    const spinNumber = existingSpins.length + 1;

    // ── Get competition ID ──────────────────────────────────────────────
    let competitionId = "slot-default";
    try {
      const activeCompetition = await db
        .select({ id: competitions.id })
        .from(competitions)
        .where(eq(competitions.isActive, true))
        .limit(1);
      
      if (activeCompetition.length > 0) {
        competitionId = activeCompetition[0].id;
      }
    } catch (compError) {
      console.log("[API] ⚠️ Could not get competition, using default");
    }

    // ── Server-side prize determination ─────────────────────────────────
    let selectedPrize: any = null;
    let config;
    
    try {
      const configs = await db.select().from(gameSlotConfig);
      console.log("[API] Configs found:", configs.length);
      
      config = configs.length > 0 ? configs[0] : null;
      
      if (!config) {
        console.log("[API] ⚠️ No slot config found, using default");
        selectedPrize = { id: "default", symbol: "Win", isEuro: true, pay: 1 };
      } else {
        console.log("[API] Config found:", { id: config.id });
        
        let allPrizes: any[] = [];
        try {
          allPrizes = config?.prizesConfig ? JSON.parse(config.prizesConfig) : [];
          console.log("[API] Prizes loaded:", allPrizes.length);
        } catch (parseError) {
          console.error("[API] ❌ Failed to parse prizesConfig:", parseError);
          allPrizes = [];
        }

        // Count per-prize wins
        let winsMap: Record<string, number> = {};
        try {
          const perPrizeWins = await db
            .select({ prizeId: slotUsage.prizeId, count: sql<number>`count(*)` })
            .from(slotUsage)
            .where(eq(slotUsage.isWin, true))
            .groupBy(slotUsage.prizeId);
          
          for (const row of perPrizeWins) {
            if (row.prizeId) winsMap[row.prizeId] = Number(row.count);
          }
          console.log("[API] Wins map:", winsMap);
        } catch (winsError) {
          console.error("[API] ❌ Failed to get wins map:", winsError);
          winsMap = {};
        }

        const eligible = allPrizes.filter((p: any) => {
          if (p.enabled === false) return false;
          if (Number(p.probability || 0) <= 0) return false;
          if (p.maxWins !== null && p.maxWins !== undefined) {
            if ((winsMap[p.id] || 0) >= Number(p.maxWins)) return false;
          }
          return true;
        });

        console.log("[API] Eligible prizes:", eligible.length);

        if (eligible.length > 0) {
          const rand = Math.random() * 100;
          let cumulative = 0;
          for (const prize of eligible) {
            cumulative += Number(prize.probability);
            if (rand < cumulative) { 
              selectedPrize = prize; 
              break; 
            }
          }
          console.log("[API] Random roll:", rand, "Selected prize:", selectedPrize?.id || "none");
        } else {
          console.log("[API] ⚠️ No eligible prizes");
        }
      }
      
      if (!selectedPrize && config) {
        console.log("[API] ⚠️ No prize selected, using fallback");
        selectedPrize = { id: "fallback", symbol: "Try Again", isEuro: false, pay: 0 };
      }
    } catch (configError) {
      console.error("[API] ❌ Error processing config:", configError);
      selectedPrize = { id: "default", symbol: "Win", isEuro: true, pay: 1 };
    }

    const isWin = selectedPrize !== null && Number(selectedPrize.pay || 0) > 0;
    let coinsWon = 0;
    let prizeId: string | null = null;
    let prizeName: string | null = null;
    let prizeType: string | null = null;
    let prizeImage: string | null = null;

    if (isWin && selectedPrize) {
      prizeId = selectedPrize.id;
      prizeName = selectedPrize.symbol;
      prizeType = selectedPrize.isEuro ? "cash" : "points";
      prizeImage = selectedPrize.image || null;
      coinsWon = Number(selectedPrize.pay || 0);

      console.log("[API] 🎉 WIN! Prize:", { prizeId, prizeName, prizeType, coinsWon });

      try {
        const user = await storage.getUser(userId);
        if (selectedPrize.isEuro && coinsWon > 0) {
          const newBalance = parseFloat(user?.balance || "0") + coinsWon;
          await db.update(users).set({ balance: newBalance.toFixed(2) }).where(eq(users.id, userId));
          await storage.createTransaction({ 
            userId, 
            type: "prize", 
            amount: coinsWon.toFixed(2), 
            description: `Slot Machine Win - £${coinsWon.toFixed(2)}` 
          });
          console.log("[API] 💰 Cash prize added:", coinsWon, "New balance:", newBalance);
        } else if (!selectedPrize.isEuro && coinsWon > 0) {
          const newPoints = (user?.ringtonePoints || 0) + coinsWon;
          await db.update(users).set({ ringtonePoints: newPoints }).where(eq(users.id, userId));
          await storage.createTransaction({ 
            userId, 
            type: "prize", 
            amount: "0.00", 
            description: `Slot Machine Win - ${coinsWon} Ringtone Points` 
          });
          console.log("[API] 🎯 Points prize added:", coinsWon, "New points:", newPoints);
        }

        // ─── ✅ SYNC WITH COMPETITION PRIZES ───
        // This decrements the prize in the competition_prizes table
        const syncResult = await syncSlotPrize(
          competitionId,
          prizeId || "unknown",
          prizeName || "Prize",
          coinsWon,
          selectedPrize.isEuro ? "cash" : "points",
          selectedPrize.maxWins || null
        );

        console.log("[API] Slot prize sync result:", syncResult);

        // ─── ✅ RECORD IN WINNERS TABLE ───
        let prizeDescriptionText = "";
        let prizeValueText = "";

        if (selectedPrize.isEuro) {
          prizeDescriptionText = "Slot Machine Win";
          prizeValueText = `£${coinsWon} Cash`;
        } else {
          prizeDescriptionText = "Slot Machine Win";
          prizeValueText = `${coinsWon} Points`;
        }

        await db.insert(winners).values({
          userId,
          competitionId: competitionId,
          prizeDescription: prizeDescriptionText,
          prizeValue: prizeValueText,
          imageUrl: selectedPrize.image || null,
          isShowcase: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log("[API] ✅ Winner recorded in winners table");

      } catch (prizeError) {
        console.error("[API] ❌ Error processing prize:", prizeError);
        // Don't fail the whole request - the spin still happened
      }
    } else {
      console.log("[API] ❌ No win this spin");
    }

    // ── Record spin usage ──
    try {
      await db.insert(slotUsage).values({
        orderId, 
        userId, 
        isWin,
        coinsWon, 
        coinsSpent: coinsSpent || 0,
        spinNumber, 
        prizeId, 
        prizeName,
      } as any);
      console.log("[API] ✅ Spin recorded:", { spinNumber, isWin, coinsWon });
    } catch (dbError) {
      console.error("[API] ❌ Error recording spin:", dbError);
      // Don't return error - the spin was processed, we just failed to save
    }

    const response = { 
      success: true, 
      isWin, 
      coinsWon, 
      prizeId, 
      prizeName, 
      prizeType, 
      prizeImage, 
      spinNumber, 
      spinsUsed: spinNumber, 
      spinsAllowed: order.quantity 
    };
    
    console.log("[API] ✅ Response:", response);
    res.json(response);

  } catch (error) {
    console.error("[API] 💥 Error in play-slot:", error);
    res.status(500).json({ message: "Failed to process spin", error: String(error) });
  }
});

  app.post("/api/record-slot-spin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId, coinsSpent, spinNumber, gameIsWin } = req.body;
      if (!orderId) return res.status(400).json({ message: "Order ID required" });
      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== userId || order.status !== "completed")
        return res.status(400).json({ message: "No valid slot order found" });

      // ── Enforce spin limit ───────────────────────────────────────────────
      // Count how many spins have already been recorded for this order.
      // order.quantity = number of spins purchased; reject if exceeded.
      const existingSpins = await db.select({ id: slotUsage.id }).from(slotUsage).where(eq(slotUsage.orderId, orderId));
      if (existingSpins.length >= order.quantity) {
        return res.status(403).json({ message: "All spins used", spinsUsed: existingSpins.length, spinsAllowed: order.quantity });
      }

      // ── Server-side prize determination ─────────────────────────────────
      // The server independently determines win/lose on every spin.
      // Each prize's "probability" field is a per-spin win PERCENTAGE (0–100).
      // We roll a random number [0, 100); if it lands within a prize's cumulative
      // range the player wins that prize. If the roll exceeds the sum of all prize
      // probabilities the spin is a loss.  The game's visual reel result is ignored
      // for prize purposes — it is purely decorative.
      let selectedPrize: any = null;

      {
        const [config] = await db.select().from(gameSlotConfig).where(eq(gameSlotConfig.id, "active"));
        const allPrizes: any[] = config?.prizesConfig ? JSON.parse(config.prizesConfig) : [];

        // Only enabled prizes with probability > 0 are eligible
        const eligible = allPrizes.filter((p: any) => p.enabled !== false && Number(p.probability || 0) > 0);

        if (eligible.length > 0) {
          const rand = Math.random() * 100; // roll in [0, 100)
          let cumulative = 0;
          for (const prize of eligible) {
            cumulative += Number(prize.probability);
            if (rand < cumulative) { selectedPrize = prize; break; }
          }
          // selectedPrize stays null when rand >= total (i.e. a loss — no prize awarded)
        }
        // If no prizes are configured at all, fall back to a guaranteed £1 win so
        // the overlay always works during initial setup.
        if (allPrizes.length === 0) {
          selectedPrize = { id: "default", symbol: "Win", isEuro: true, pay: 1 };
        }
      }

      const isWin = selectedPrize !== null;
      let coinsWon = 0;
      let prizeId: string | null = null;
      let prizeName: string | null = null;
      let prizeType: string | null = null;

      if (isWin && selectedPrize) {
        prizeId = selectedPrize.id;
        prizeName = selectedPrize.symbol;
        prizeType = selectedPrize.isEuro ? "cash" : "points";
        coinsWon = Number(selectedPrize.pay || 0);

        const user = await storage.getUser(userId);
        if (selectedPrize.isEuro && coinsWon > 0) {
          // Cash prize → add to wallet balance
          const newBalance = parseFloat(user?.balance || "0") + coinsWon;
          await db.update(users).set({ balance: newBalance.toFixed(2) }).where(eq(users.id, userId));
          await storage.createTransaction({ userId, type: "prize", amount: coinsWon.toFixed(2), description: `Slot Machine Win - £${coinsWon.toFixed(2)}` });
        } else if (!selectedPrize.isEuro && coinsWon > 0) {
          // Points prize → add to ringtonePoints
          const newPoints = (user?.ringtonePoints || 0) + coinsWon;
          await db.update(users).set({ ringtonePoints: newPoints }).where(eq(users.id, userId));
          await storage.createTransaction({ userId, type: "prize", amount: "0.00", description: `Slot Machine Win - ${coinsWon} Ringtone Points` });
        }
      }

      await db.insert(slotUsage).values({
        orderId, userId, isWin,
        coinsWon, coinsSpent: coinsSpent || 0,
        spinNumber: spinNumber || 1,
      });

      res.json({ success: true, isWin, coinsWon, prizeId, prizeName, prizeType });
    } catch (error) {
      console.error("Error recording slot spin:", error);
      res.status(500).json({ message: "Failed to record spin" });
    }
  });

  app.get("/api/slot-config", async (req, res) => {
    try {
      const [config] = await db.select().from(gameSlotConfig).where(eq(gameSlotConfig.id, "active"));
      res.json({ isVisible: config?.isVisible ?? true, isActive: config?.isActive ?? true, creditsPerSpin: config?.creditsPerSpin || 20, pricePerSpin: config?.pricePerSpin || "0.20" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch slot config" });
    }
  });

  app.put("/api/admin/slot-config", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { isVisible, isActive, creditsPerSpin, pricePerSpin } = req.body;
      const [existing] = await db.select().from(gameSlotConfig).where(eq(gameSlotConfig.id, "active"));
      if (existing) {
        await db.update(gameSlotConfig).set({
          isVisible: isVisible ?? existing.isVisible,
          isActive: isActive ?? existing.isActive,
          creditsPerSpin: creditsPerSpin ?? existing.creditsPerSpin,
          pricePerSpin: pricePerSpin ?? existing.pricePerSpin,
          updatedAt: new Date(),
        }).where(eq(gameSlotConfig.id, "active"));
      } else {
        await db.insert(gameSlotConfig).values({
          id: "active", isVisible: isVisible ?? true, isActive: isActive ?? true,
          creditsPerSpin: creditsPerSpin ?? 20, pricePerSpin: pricePerSpin ?? "0.20",
        });
      }
      const [updated] = await db.select().from(gameSlotConfig).where(eq(gameSlotConfig.id, "active"));
      res.json({ success: true, isVisible: updated.isVisible, isActive: updated.isActive, creditsPerSpin: updated.creditsPerSpin, pricePerSpin: updated.pricePerSpin });
    } catch (error) {
      console.error("Error updating slot config:", error);
      res.status(500).json({ message: "Failed to update slot config" });
    }
  });

  app.get("/api/admin/slot-stats", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const totalSpins = await db.select({ count: sql<number>`count(*)` }).from(slotUsage);
      const wins = await db.select({ count: sql<number>`count(*)` }).from(slotUsage).where(eq(slotUsage.isWin, true));
      const totalCoinsWon = await db.select({ sum: sql<number>`coalesce(sum(coins_won), 0)` }).from(slotUsage);
      const totalCoinsSpent = await db.select({ sum: sql<number>`coalesce(sum(coins_spent), 0)` }).from(slotUsage);
      const recentSpins = await db.select({ id: slotUsage.id, isWin: slotUsage.isWin, coinsWon: slotUsage.coinsWon, coinsSpent: slotUsage.coinsSpent, spinNumber: slotUsage.spinNumber, usedAt: slotUsage.usedAt })
        .from(slotUsage).orderBy(desc(slotUsage.usedAt)).limit(20);
      // Per-prize win counts for maxWins tracking
      const prizeWinCounts = await db
        .select({ prizeId: slotUsage.prizeId, count: sql<number>`count(*)` })
        .from(slotUsage)
        .where(eq(slotUsage.isWin, true))
        .groupBy(slotUsage.prizeId);
      const winsPerPrize: Record<string, number> = {};
      for (const row of prizeWinCounts) {
        if (row.prizeId) winsPerPrize[row.prizeId] = Number(row.count);
      }
      res.json({
        totalSpins: Number(totalSpins[0]?.count || 0),
        totalWins: Number(wins[0]?.count || 0),
        totalCoinsWon: Number(totalCoinsWon[0]?.sum || 0),
        totalCoinsSpent: Number(totalCoinsSpent[0]?.sum || 0),
        recentSpins,
        winsPerPrize,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch slot stats" });
    }
  });

  // ─── Prize config routes ────────────────────────────────────────────────
  const DEFAULT_SLOT_PRIZES = [
    { id: "coin",        symbol: "Coin",        pay: 1,    isEuro: true,  maxWins: null, enabled: true },
    { id: "tomato",      symbol: "Tomato",      pay: 2,    isEuro: true,  maxWins: null, enabled: true },
    { id: "apple",       symbol: "Apple",       pay: 3,    isEuro: true,  maxWins: null, enabled: true },
    { id: "bell",        symbol: "Bell",        pay: 4,    isEuro: true,  maxWins: null, enabled: true },
    { id: "grape",       symbol: "Grape",       pay: 5,    isEuro: true,  maxWins: null, enabled: true },
    { id: "banana",      symbol: "Banana",      pay: 25,   isEuro: true,  maxWins: null, enabled: true },
    { id: "cherry",      symbol: "Cherry",      pay: 50,   isEuro: true,  maxWins: null, enabled: true },
    { id: "strawberry",  symbol: "Strawberry",  pay: 50,   isEuro: true,  maxWins: null, enabled: true },
    { id: "orange",      symbol: "Orange",      pay: 80,   isEuro: true,  maxWins: null, enabled: true },
    { id: "star",        symbol: "Star",        pay: 100,  isEuro: true,  maxWins: null, enabled: true },
    { id: "dice",        symbol: "Dice",        pay: 250,  isEuro: true,  maxWins: null, enabled: true },
    { id: "seven",       symbol: "Seven (7)",   pay: 500,  isEuro: true,  maxWins: null, enabled: true },
    { id: "bar",         symbol: "BAR",         pay: 750,  isEuro: true,  maxWins: null, enabled: true },
    { id: "diamond",     symbol: "Diamond",     pay: 1000, isEuro: true,  maxWins: null, enabled: true },
    { id: "trophy",      symbol: "Trophy",      pay: 2500, isEuro: true,  maxWins: null, enabled: true },
    { id: "crown",       symbol: "Crown",       pay: 5000, isEuro: true,  maxWins: null, enabled: true },
    { id: "pts100",      symbol: "100 Points",  pay: 100,  isEuro: false, maxWins: null, enabled: true },
    { id: "pts500",      symbol: "500 Points",  pay: 500,  isEuro: false, maxWins: null, enabled: true },
    { id: "pts750",      symbol: "750 Points",  pay: 750,  isEuro: false, maxWins: null, enabled: true },
    { id: "pts1000",     symbol: "1000 Points", pay: 1000, isEuro: false, maxWins: null, enabled: true },
  ];

  app.get("/api/slot-prizes", async (_req, res) => {
    try {
      const [config] = await db.select().from(gameSlotConfig).where(eq(gameSlotConfig.id, "active"));
      if (config?.prizesConfig) {
        res.json(JSON.parse(config.prizesConfig));
      } else {
        res.json(DEFAULT_SLOT_PRIZES);
      }
    } catch {
      res.json(DEFAULT_SLOT_PRIZES);
    }
  });

  app.put("/api/admin/slot-prizes", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { prizes } = req.body;
      if (!Array.isArray(prizes)) return res.status(400).json({ message: "prizes must be an array" });
      const prizesConfig = JSON.stringify(prizes);
      const [existing] = await db.select().from(gameSlotConfig).where(eq(gameSlotConfig.id, "active"));
      if (existing) {
        await db.update(gameSlotConfig).set({ prizesConfig, updatedAt: new Date() }).where(eq(gameSlotConfig.id, "active"));
      } else {
        await db.insert(gameSlotConfig).values({ id: "active", prizesConfig });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving slot prizes:", error);
      res.status(500).json({ message: "Failed to save prizes" });
    }
  });

  // ═══════════════════ END SLOT MACHINE ROUTES ═══════════════════

  // ════════════════════ ROYAL REELS ROUTES ════════════════════

  const ROYAL_SYMBOLS_ALL = [
    "crown","trophy","diamond","bar","seven","dice","star",
    "orange","cherry","strawberry","banana","grape","bell","apple","tomato","coin",
    "points1000","points500","points100"
  ];

  const DEFAULT_ROYAL_PRIZES = [
    { prizeName:"Crown Jackpot", symbolKey:"crown",     prizeValue:"5000.00", rewardType:"cash" as const, weight:1,  maxWins:1,    displayOrder:1  },
    { prizeName:"Trophy",        symbolKey:"trophy",    prizeValue:"2500.00", rewardType:"cash" as const, weight:2,  maxWins:2,    displayOrder:2  },
    { prizeName:"Diamond",       symbolKey:"diamond",   prizeValue:"1000.00", rewardType:"cash" as const, weight:3,  maxWins:5,    displayOrder:3  },
    { prizeName:"Bar",           symbolKey:"bar",       prizeValue:"750.00",  rewardType:"cash" as const, weight:4,  maxWins:5,    displayOrder:4  },
    { prizeName:"Lucky 7",       symbolKey:"seven",     prizeValue:"500.00",  rewardType:"cash" as const, weight:5,  maxWins:10,   displayOrder:5  },
    { prizeName:"Dice",          symbolKey:"dice",      prizeValue:"250.00",  rewardType:"cash" as const, weight:8,  maxWins:20,   displayOrder:6  },
    { prizeName:"Star",          symbolKey:"star",      prizeValue:"100.00",  rewardType:"cash" as const, weight:12, maxWins:50,   displayOrder:7  },
    { prizeName:"Orange",        symbolKey:"orange",    prizeValue:"80.00",   rewardType:"cash" as const, weight:15, maxWins:null, displayOrder:8  },
    { prizeName:"Cherry",        symbolKey:"cherry",    prizeValue:"50.00",   rewardType:"cash" as const, weight:20, maxWins:null, displayOrder:9  },
    { prizeName:"Strawberry",    symbolKey:"strawberry",prizeValue:"50.00",   rewardType:"cash" as const, weight:20, maxWins:null, displayOrder:10 },
    { prizeName:"Banana",        symbolKey:"banana",    prizeValue:"25.00",   rewardType:"cash" as const, weight:25, maxWins:null, displayOrder:11 },
    { prizeName:"Grape",         symbolKey:"grape",     prizeValue:"5.00",    rewardType:"cash" as const, weight:35, maxWins:null, displayOrder:12 },
    { prizeName:"Bell",          symbolKey:"bell",      prizeValue:"4.00",    rewardType:"cash" as const, weight:40, maxWins:null, displayOrder:13 },
    { prizeName:"Apple",         symbolKey:"apple",     prizeValue:"3.00",    rewardType:"cash" as const, weight:45, maxWins:null, displayOrder:14 },
    { prizeName:"Tomato",        symbolKey:"tomato",    prizeValue:"2.00",    rewardType:"cash" as const, weight:50, maxWins:null, displayOrder:15 },
    { prizeName:"Coin",          symbolKey:"coin",      prizeValue:"1.00",    rewardType:"cash" as const, weight:60, maxWins:null, displayOrder:16 },
    { prizeName:"1000 Points",   symbolKey:"points1000",prizeValue:"1000.00", rewardType:"points" as const,weight:5, maxWins:null,displayOrder:17 },
    { prizeName:"500 Points",    symbolKey:"points500", prizeValue:"500.00",  rewardType:"points" as const,weight:10,maxWins:null,displayOrder:18 },
    { prizeName:"100 Points",    symbolKey:"points100", prizeValue:"100.00",  rewardType:"points" as const,weight:20,maxWins:null,displayOrder:19 },
    { prizeName:"No Win",        symbolKey:"no_win",    prizeValue:"0.00",    rewardType:"no_win" as const,weight:2000,maxWins:null,displayOrder:20},
  ];

  const buildRoyalGrid = (winSymbol: string | null, isWin: boolean, allSymbols: string[]) => {
    const grid: string[] = [];
    if (isWin && winSymbol) {
      const positions = [0,1,2,3,4,5,6,7,8];
      const shuffled = positions.sort(() => Math.random() - 0.5);
      const winPositions = shuffled.slice(0,3);
      const losers = allSymbols.filter(s => s !== winSymbol && s !== "no_win");
      for (let i = 0; i < 9; i++) {
        if (winPositions.includes(i)) {
          grid[i] = winSymbol;
        } else {
          grid[i] = losers[Math.floor(Math.random() * losers.length)] || "coin";
        }
      }
    } else {
      // No 3-of-a-kind — pick 9 symbols with max 2 of any kind
      const pool = [...allSymbols.filter(s => s !== "no_win")];
      const usedCounts: Record<string,number> = {};
      let attempts = 0;
      while (grid.length < 9 && attempts < 100) {
        attempts++;
        const sym = pool[Math.floor(Math.random() * pool.length)];
        if ((usedCounts[sym] || 0) < 2) {
          grid.push(sym);
          usedCounts[sym] = (usedCounts[sym] || 0) + 1;
        }
      }
      while (grid.length < 9) grid.push("coin");
    }
    return grid;
  };

  app.get("/api/royal-config", async (req, res) => {
    try {
      const [config] = await db.select().from(gameRoyalConfig).where(eq(gameRoyalConfig.id, "active"));
      res.json({ isVisible: config?.isVisible ?? true, isActive: config?.isActive ?? true, replayChance: config?.replayChance ?? "5.00" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch royal config" });
    }
  });

  app.post("/api/create-royal-order", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { competitionId, quantity = 1 } = req.body;
      const competition = await storage.getCompetition(competitionId);
      if (!competition) return res.status(404).json({ message: "Competition not found" });
      const costPerPlay = parseFloat(competition.ticketPrice);
      const { originalTotal, discountPercent, discountedTotal, savings } = calculateDiscountedTotal(costPerPlay, quantity);
      const user = await storage.getUser(userId);
      const order = await storage.createOrder({
        userId, competitionId, quantity,
        totalAmount: discountedTotal.toString(),
        paymentMethod: "pending", status: "pending",
      });
      res.json({
        success: true, orderId: order.id, competitionId,
        totalAmount: discountedTotal, originalAmount: originalTotal,
        discountPercent, savings, quantity,
        userBalance: { wallet: parseFloat(user?.balance || "0"), ringtonePoints: user?.ringtonePoints || 0, pointsValue: (user?.ringtonePoints || 0) * 0.01 },
        royalCost: costPerPlay,
        competition: { title: competition.title, type: competition.type },
      });
    } catch (error) {
      console.error("Error creating royal order:", error);
      res.status(500).json({ message: "Failed to create royal order" });
    }
  });

  app.post("/api/process-royal-payment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId, useWalletBalance = false, useRingtonePoints = false, useInstaplay = false } = req.body;
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (!order || order.userId !== userId) return res.status(404).json({ message: "Order not found" });
      if (order.status !== "pending") return res.status(400).json({ message: "Order already processed" });
      const [competition] = await db.select().from(competitions).where(eq(competitions.id, order.competitionId));
      if (!competition || competition.type !== "royal") return res.status(400).json({ message: "Invalid competition type" });
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (useInstaplay) {
        const totalAmount = Number(order.totalAmount);
        const session = await cashflows.createCompetitionPaymentSession(totalAmount, {
          orderId, competitionId: order.competitionId, userId,
          quantity: order.quantity.toString(), paymentType: "instant_play", gameType: "royal",
        });
        if (!session.hostedPageUrl) return res.status(500).json({ message: "Failed to create payment session" });
        await db.insert(pendingPayments).values({
          userId, orderId: order.id, paymentJobReference: session.paymentJobReference,
          paymentType: "instant_play", amount: totalAmount.toString(),
          metadata: { competitionId: competition.id, competitionTitle: competition.title, gameType: "royal", quantity: order.quantity },
          status: "pending", createdAt: new Date(),
        });
        await db.update(orders).set({ paymentMethod: "instaplay", cashflowsAmount: totalAmount.toString(), updatedAt: new Date() }).where(eq(orders.id, orderId));
        return res.json({ success: true, redirectUrl: session.hostedPageUrl, sessionId: session.paymentJobReference, paymentType: "instaplay" });
      }

      const totalAmount = Number(order.totalAmount);
      let remainingAmount = totalAmount;
      let walletUsed = 0, pointsUsed = 0;
      const paymentBreakdown: any[] = [];

      if (useWalletBalance) {
        const walletBalance = Number(user?.balance) || 0;
        const walletAmount = Math.min(walletBalance, remainingAmount);
        if (walletAmount > 0) {
          walletUsed = walletAmount;
          remainingAmount -= walletUsed;
          paymentBreakdown.push({ method: "wallet", amount: walletUsed, description: `Wallet: £${walletUsed.toFixed(2)}` });
        }
      }
      if (useRingtonePoints && remainingAmount > 0) {
        const availablePoints = user?.ringtonePoints || 0;
        const pointsNeeded = Math.ceil(remainingAmount * 100);
        if (availablePoints < pointsNeeded) {
          if (walletUsed > 0) {
            const curr = Number(user?.balance) || 0;
            await db.update(users).set({ balance: (curr + walletUsed).toString() }).where(eq(users.id, userId));
          }
          return res.status(400).json({ message: `Insufficient points. You need ${pointsNeeded} points.`, remainingAmount, pointsNeeded });
        }
        const pointsAmount = pointsNeeded * 0.01;
        pointsUsed = pointsNeeded;
        remainingAmount -= pointsAmount;
        paymentBreakdown.push({ method: "ringtone_points", amount: pointsAmount, pointsUsed: pointsNeeded, description: `Points: £${pointsAmount.toFixed(2)} (${pointsNeeded} pts)` });
      }
      if (remainingAmount > 0.01) return res.json({ success: false, message: "Card payment required", remainingAmount, requiresCashflows: true });

      if (walletUsed > 0) await db.update(users).set({ balance: (Number(user?.balance || "0") - walletUsed).toString() }).where(eq(users.id, userId));
      if (pointsUsed > 0) await db.update(users).set({ ringtonePoints: (user?.ringtonePoints || 0) - pointsUsed }).where(eq(users.id, userId));

      let paymentMethodText = "Discount";
      if (walletUsed > 0 && pointsUsed > 0) paymentMethodText = "Wallet+Points";
      else if (walletUsed > 0) paymentMethodText = "Wallet";
      else if (pointsUsed > 0) paymentMethodText = "Points";

      await db.update(orders).set({
        status: "completed", paymentMethod: paymentMethodText,
        walletAmount: walletUsed.toString(), pointsAmount: pointsUsed.toString(),
        cashflowsAmount: "0", paymentBreakdown: JSON.stringify(paymentBreakdown), updatedAt: new Date(),
      }).where(eq(orders.id, orderId));
      await db.update(competitions).set({ soldTickets: (competition.soldTickets || 0) + order.quantity, updatedAt: new Date() }).where(eq(competitions.id, competition.id));
      await db.insert(transactions).values({ userId, type: "purchase", amount: totalAmount.toFixed(2), description: `Royal Reels Purchase - ${order.quantity} games`, orderId, createdAt: new Date() });

      const royalTickets = [];
      for (let i = 0; i < order.quantity; i++) {
        const ticketNumber = `RYL-${orderId.slice(0,8).toUpperCase()}-${(i+1).toString().padStart(3,"0")}`;
        const [ticket] = await db.insert(tickets).values({ userId, competitionId: order.competitionId, orderId: order.id, ticketNumber, isWinner: false, createdAt: new Date() }).returning();
        royalTickets.push(ticket);
      }

      if (user?.email) {
        sendOrderConfirmationEmail(user.email, {
          orderId: order.id, userName: `${user.firstName||""} ${user.lastName||""}`.trim() || "Customer",
          orderType: "royal", itemName: competition.title, quantity: order.quantity,
          totalAmount: order.totalAmount, orderDate: new Date().toLocaleDateString("en-GB", { day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit" }),
          paymentMethod: paymentMethodText, ticketNumbers: royalTickets.map(t => t.ticketNumber),
        }).catch(err => console.error("Failed to send Royal confirmation email:", err));
      }

      res.json({ success: true, message: "Royal Reels purchase complete!", competitionId: order.competitionId, orderId: order.id, quantity: order.quantity, paymentBreakdown });
    } catch (error) {
      console.error("Error processing royal payment:", error);
      res.status(500).json({ message: "Failed to process royal payment" });
    }
  });

  app.get("/api/royal-order/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;
      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== userId) return res.status(404).json({ message: "Order not found" });
      const user = await storage.getUser(userId);
      const competition = await storage.getCompetition(order.competitionId);
      const usageRows = await db.select({ count: sql<number>`count(*)` }).from(royalUsage).where(eq(royalUsage.orderId, orderId));
      const usedCount = Number(usageRows[0]?.count || 0);
      const playsRemaining = order.quantity - usedCount;
      const history = await db.select().from(royalUsage).where(eq(royalUsage.orderId, orderId)).orderBy(desc(royalUsage.usedAt));
      const creditsPerGame = 100;
      const totalCredits = order.quantity * creditsPerGame;
      const mappedHistory = history.map(h => ({
        id: h.id,
        isWin: h.isWin,
        isRoyalReplay: h.isRoyalReplay,
        coinsWon: h.isWin ? Math.round(parseFloat(h.rewardValue || "0") * 100) : 0,
        coinsSpent: creditsPerGame,
        usedAt: h.usedAt,
      }));
      res.json({ order: { id: order.id, competitionId: order.competitionId, quantity: order.quantity, totalAmount: order.totalAmount, status: order.status }, user: { balance: user?.balance || "0", ringtonePoints: user?.ringtonePoints || 0 }, competition, playsRemaining, creditsPerGame, totalCredits, history: mappedHistory });
    } catch (error) {
      console.error("Error fetching royal order:", error);
      res.status(500).json({ message: "Failed to fetch royal order" });
    }
  });

  app.post("/api/record-royal-spin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId, isWin, coinsWon, coinsSpent, spinNumber, isRoyalReplay } = req.body;
      if (!orderId) return res.status(400).json({ message: "Order ID required" });
      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== userId || order.status !== "completed") return res.status(400).json({ message: "No valid Royal Reels order found" });
      const cashValue = isWin && coinsWon > 0 ? parseFloat((coinsWon * 0.01).toFixed(2)) : 0;
      await db.insert(royalUsage).values({
        orderId,
        userId,
        isWin: !!isWin,
        isRoyalReplay: !!isRoyalReplay,
        rewardType: isWin ? "cash" : "no_win",
        rewardValue: cashValue.toFixed(2),
      });
      if (isWin && cashValue >= 1) {
        const user = await storage.getUser(userId);
        const newBalance = parseFloat(user?.balance || "0") + cashValue;
        await db.update(users).set({ balance: newBalance.toFixed(2) }).where(eq(users.id, userId));
        await storage.createTransaction({ userId, type: "prize", amount: cashValue.toFixed(2), description: `Royal Reels Win - £${cashValue.toFixed(2)}` });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording royal spin:", error);
      res.status(500).json({ message: "Failed to record royal spin" });
    }
  });

  const royalCooldowns = new Map<string, number>();
  const ROYAL_COOLDOWN_MS = 2000;

  app.post("/api/play-royal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId, competitionId } = req.body;
      if (!orderId || !competitionId) return res.status(400).json({ success: false, message: "Order ID and Competition ID are required" });

      const cooldownKey = `${userId}-${orderId}`;
      const lastPlay = royalCooldowns.get(cooldownKey) || 0;
      if (Date.now() - lastPlay < ROYAL_COOLDOWN_MS) return res.status(429).json({ success: false, message: "Please wait before playing again" });
      royalCooldowns.set(cooldownKey, Date.now());

      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== userId || order.status !== "completed") return res.status(400).json({ success: false, message: "No valid Royal Reels purchase found" });

      const usageRows = await db.select({ count: sql<number>`count(*)` }).from(royalUsage).where(eq(royalUsage.orderId, orderId));
      const usedCount = Number(usageRows[0]?.count || 0);
      if (usedCount >= order.quantity) return res.status(400).json({ success: false, message: "No plays remaining" });
      const playsRemaining = order.quantity - usedCount;

      const [config] = await db.select().from(gameRoyalConfig).where(eq(gameRoyalConfig.id, "active"));
      if (config && !config.isActive) return res.status(400).json({ success: false, message: "Royal Reels is currently unavailable" });

      // Ensure prizes exist
      let prizes = await db.select().from(royalPrizes).where(eq(royalPrizes.isActive, true)).orderBy(asc(royalPrizes.displayOrder));
      if (prizes.length === 0) {
        await db.insert(royalPrizes).values(DEFAULT_ROYAL_PRIZES);
        prizes = await db.select().from(royalPrizes).where(eq(royalPrizes.isActive, true)).orderBy(asc(royalPrizes.displayOrder));
      }

      const eligiblePrizes = prizes.filter(p => {
        if (p.maxWins !== null && p.rewardType !== "no_win") {
          if ((p.quantityWon || 0) >= p.maxWins!) return false;
        }
        return true;
      });

      const totalWeight = eligiblePrizes.reduce((s, p) => s + p.weight, 0);
      let rand = Math.random() * totalWeight;
      let selectedPrize = eligiblePrizes[0] || prizes[prizes.length - 1];
      for (const p of eligiblePrizes) {
        rand -= p.weight;
        if (rand <= 0) { selectedPrize = p; break; }
      }

      const isWin = selectedPrize.rewardType === "cash" || selectedPrize.rewardType === "points";
      const rewardValue = isWin ? selectedPrize.prizeValue : "0";
      const winSymbol = isWin ? selectedPrize.symbolKey : null;

      // Royal Replay check (separate from prize outcome)
      const replayChancePct = parseFloat(config?.replayChance?.toString() || "5.00");
      const royalReplay = Math.random() * 100 < replayChancePct;

      const symbols = buildRoyalGrid(winSymbol, isWin, ROYAL_SYMBOLS_ALL);
      const newPlaysRemaining = playsRemaining - 1 + (royalReplay ? 1 : 0);

      res.json({
        success: true,
        result: { isWin, rewardType: selectedPrize.rewardType, rewardValue, prizeId: selectedPrize.id, prizeName: selectedPrize.prizeName, winSymbol, symbols, royalReplay },
        playsRemaining: newPlaysRemaining,
      });
    } catch (error) {
      console.error("Error playing Royal Reels:", error);
      res.status(500).json({ message: "Failed to play Royal Reels" });
    }
  });

  app.post("/api/confirm-royal-result", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId, result } = req.body;
      if (!orderId || !result) return res.status(400).json({ success: false, message: "Order ID and result are required" });

      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== userId) return res.status(400).json({ success: false, message: "Order not found" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      await db.transaction(async (tx) => {
        await tx.insert(royalUsage).values({
          orderId, userId,
          isWin: result.isWin || false,
          isRoyalReplay: result.royalReplay || false,
          prizeId: result.prizeId || null,
          rewardType: result.rewardType || "no_win",
          rewardValue: result.rewardValue || "0",
          symbols: result.symbols || [],
          usedAt: new Date(),
        });

        if (result.royalReplay) {
          await tx.insert(royalUsage).values({
            orderId, userId,
            isWin: false, isRoyalReplay: true,
            prizeId: null, rewardType: "replay",
            rewardValue: "0", symbols: [],
            usedAt: new Date(Date.now() - 1),
          });
        }

        if (result.isWin && result.rewardValue && parseFloat(result.rewardValue) > 0) {
          if (result.rewardType === "cash") {
            const winAmount = parseFloat(result.rewardValue);
            const newBal = parseFloat(user.balance || "0") + winAmount;
            await tx.update(users).set({ balance: newBal.toFixed(2) }).where(eq(users.id, userId));
            await tx.insert(transactions).values({ userId, type: "prize", amount: winAmount.toFixed(2), description: `Royal Reels Win - ${result.prizeName || "£"+winAmount.toFixed(2)}`, orderId, createdAt: new Date() });
          } else if (result.rewardType === "points") {
            const pts = Math.floor(parseFloat(result.rewardValue));
            await tx.update(users).set({ ringtonePoints: (user.ringtonePoints || 0) + pts }).where(eq(users.id, userId));
          }
          if (result.prizeId) {
            await tx.update(royalPrizes).set({ quantityWon: sql`quantity_won + 1`, updatedAt: new Date() }).where(eq(royalPrizes.id, result.prizeId));
          }
          await tx.insert(royalWins).values({
            orderId, userId, prizeId: result.prizeId || "unknown",
            rewardType: result.rewardType, rewardValue: result.rewardValue,
            symbolKey: result.winSymbol || "coin", isWin: true, wonAt: new Date(),
          });
        }
      });

      const historyEntry = {
        id: `${orderId}-${Date.now()}`,
        isWin: result.isWin || false,
        isRoyalReplay: result.royalReplay || false,
        rewardType: result.rewardType || "no_win",
        rewardValue: result.rewardValue || "0",
        prizeName: result.prizeName || null,
        symbolKey: result.winSymbol || null,
        usedAt: new Date().toISOString(),
      };

      res.json({ success: true, historyEntry });
    } catch (error) {
      console.error("Error confirming Royal result:", error);
      res.status(500).json({ message: "Failed to confirm Royal result" });
    }
  });

  // ════════════════════ END ROYAL REELS ROUTES ════════════════════


  const httpServer = createServer(app);
  return httpServer;
}


