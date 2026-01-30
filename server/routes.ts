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
import { count, gt } from "drizzle-orm/sql";
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
  deleteR2Object,
} from "./cloudeflare/cloudeflareHelper";
import { OTPGenerator } from "./otp";
import { sendVerificationEmail } from "./emails/verification-email";

const supportUpload = createS3Uploader("support");
const competitionUpload = createS3Uploader("competitions");
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
// export async function recheckPendingPayments() {
//   // ⏱️ Time window
//   const minAge = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
//   const maxAge = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

//   const pendings = await db.query.pendingPayments.findMany({
//     where: (p, { and, eq, gte, lte }) =>
//       and(
//         eq(p.status, "pending"),
//         gte(p.createdAt, maxAge), // newer than 24h
//         lte(p.createdAt, minAge) // older than 5m
//       ),
//   });

//   console.log(`🔎 Rechecking ${pendings.length} eligible pending payments`);

//   for (const p of pendings) {
//     try {
//       if (!p.paymentReference) {
//         console.log(
//           "⚠️ Skipping pending without paymentReference:",
//           p.paymentJobReference
//         );
//         continue;
//       }

//       let payment;
//       try {
//         payment = await cashflows.getPaymentStatus(
//           p.paymentJobReference,
//           p.paymentReference
//         );
//       } catch (err) {
//         // Handle 404 - payment might be completed and archived
//         if (err.response?.status === 404) {
//           console.log(
//             `📭 Payment ${p.paymentJobReference} not found (likely completed)`
//           );

//           // Check if we have a transaction for this payment
//           const existingTransaction = await db.query.transactions.findFirst({
//             where: (t, { eq }) => eq(t.paymentRef, p.paymentReference),
//           });

//           if (existingTransaction) {
//             console.log(
//               `✅ Found existing transaction, marking as completed: ${p.paymentJobReference}`
//             );
//             await db
//               .update(pendingPayments)
//               .set({
//                 status: "completed",
//                 updatedAt: new Date(),
//               })
//               .where(eq(pendingPayments.id, p.id));
//           } else {
//             console.log(
//               `❓ Payment ${p.paymentJobReference} not found and no transaction exists`
//             );
//           }
//           continue;
//         }
//         throw err;
//       }

//       const { status, paidAmount } = normalizeCashflowsStatus(payment);

//       if (status !== "PAID") continue;

//       // 🔒 SAFETY CHECKS
//       if (!paidAmount || paidAmount <= 0) {
//         console.warn("❌ Invalid paid amount (cron)", p.paymentJobReference);
//         continue;
//       }

//       if (paidAmount !== Number(p.amount)) {
//         console.error("❌ Amount mismatch (cron)", {
//           expected: p.amount,
//           paid: paidAmount,
//         });
//         continue;
//       }

//       await processWalletTopup(p.userId, p.paymentReference, paidAmount);

//       await db
//         .update(pendingPayments)
//         .set({
//           status: "completed",
//           updatedAt: new Date(),
//         })
//         .where(eq(pendingPayments.id, p.id));

//       console.log("♻️ Recovered payment:", p.paymentJobReference);
//     } catch (err) {
//       console.error("❌ Recheck error:", p.paymentJobReference, err.message);
//     }
//   }
// }

// export async function cleanup404Payments() {
//   // Find payments that are pending but keep getting 404s
//   // Mark them as "archived" after 7 days
//   const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

//   const oldPending = await db.query.pendingPayments.findMany({
//     where: (p, { and, eq, lte }) =>
//       and(
//         eq(p.status, "pending"),
//         lte(p.createdAt, cutoff),
//         // Optional: only those with paymentReference
//         sql`${p.paymentReference} IS NOT NULL`
//       ),
//   });

//   console.log(`🧹 Found ${oldPending.length} old pending payments to cleanup`);

//   for (const p of oldPending) {
//     // Check if transaction exists (payment was processed)
//     const transaction = await db.query.transactions.findFirst({
//       where: (t, { eq }) => eq(t.paymentRef, p.paymentReference),
//     });

//     if (transaction) {
//       // Transaction exists, so payment was processed
//       await db
//         .update(pendingPayments)
//         .set({
//           status: "completed",
//           updatedAt: new Date(),
//         })
//         .where(eq(pendingPayments.id, p.id));
//       console.log(`✅ Cleaned up completed payment: ${p.paymentJobReference}`);
//     } else {
//       // No transaction, mark as expired
//       await db
//         .update(pendingPayments)
//         .set({
//           status: "expired",
//           updatedAt: new Date(),
//         })
//         .where(eq(pendingPayments.id, p.id));
//       console.log(`📭 Marked expired payment: ${p.paymentJobReference}`);
//     }
//   }
// }

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
  amount: number
) {
  if (amount <= 0) {
    throw new Error("Invalid wallet credit amount");
  }

  try {
    await db.transaction(async (tx) => {
      // 🛑 Idempotency guard
      const existing = await tx.query.transactions.findFirst({
        where: (t, { eq }) => eq(t.pendingPaymentId, pendingPaymentId),
      });

      if (existing) {
        console.warn("Duplicate wallet credit blocked:", pendingPaymentId);
        return;
      }

      await tx.insert(transactions).values({
        userId,
        type: "deposit",
        amount: Math.round(amount * 100) / 100,
        paymentRef,
        pendingPaymentId,
        description: `Cashflows wallet top-up £${amount}`,
      });

      await tx.execute(sql`
        UPDATE users
        SET balance = balance + ${amount}
        WHERE id = ${userId}
      `);
    });

    console.log("Wallet credited successfully", {
      userId,
      pendingPaymentId,
      amount,
    });
  } catch (err) {
    console.error("processWalletTopup FAILED", err);
    throw err;
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

  // Registration route
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("🚀 [register] Starting registration...");
      console.log("   Request body:", JSON.stringify(req.body, null, 2));
  
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
      } = req.body;
  
      console.log("   Email to register:", email);
      console.log("   Name:", firstName, lastName);
      console.log("   Referral code provided:", referralCode);
  
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log("❌ [register] User already exists:", email);
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }
  
      // ⭐⭐ FIX: Validate referral code if provided
      let referrerId = null;
      if (referralCode) {
        const referrer = await storage.getUserByReferralCode(referralCode);
        if (referrer) {
          referrerId = referrer.id;
          console.log("   ✅ Valid referral code found. Referrer:", referrer.email);
        } else {
          console.log("   ❌ Invalid referral code:", referralCode);
          // Optionally: return error or just ignore invalid codes
          // return res.status(400).json({ message: "Invalid referral code" });
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
  
      // Generate OTP
      const otp = OTPGenerator.generate();
      const expiresAt = OTPGenerator.getExpiryTime(10);
      console.log("   Generated OTP:", otp);
      console.log("   OTP expires at:", expiresAt);
  
      // Create new user
      console.log("   Creating user in database...");
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        dateOfBirth: dobString,
        phoneNumber,
        howDidYouFindUs,
        receiveNewsletter: receiveNewsletter || false,
        emailVerificationOtp: otp,
        emailVerificationOtpExpiresAt: expiresAt,
        verificationSentAt: new Date(),
        referredBy: referrerId, // ⭐ Store the referrer's ID, not the code
      });
  
      console.log("✅ [register] User created:", user.id);
  
      // Send verification email
      console.log("   Sending verification email...");
      const emailResult = await sendVerificationEmail(
        email,
        otp,
        `${firstName} ${lastName}`.trim() || firstName || "User"
      );
  
      if (!emailResult.success) {
        console.error("❌ [register] Email sending failed but user created");
        console.error("   User ID:", user.id);
        console.error("   Email error:", emailResult.error);
  
        return res.status(201).json({
          message:
            "Registration successful but we couldn't send the verification email. Please use 'Resend OTP' on the verification page.",
          userId: user.id,
          email: user.email,
          emailSent: false,
          requiresVerification: true,
          warning: "Email delivery failed - use Resend OTP",
        });
      }
  
      console.log("✅ [register] Registration complete!");
      res.status(201).json({
        message:
          "Registration successful! Please check your email for verification code.",
        userId: user.id,
        email: user.email,
        emailSent: true,
        expiresIn: "30 minutes",
        requiresVerification: true,
      });
    } catch (error: any) {
      console.error("🔥 [register] Registration error:", error);
      console.error("   Stack:", error.stack);
      res.status(500).json({
        message: "Failed to register user",
        error: error.message,
      });
    }
  });

  app.post("/api/test-email", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      console.log("🧪 Testing email sending to:", email);
      console.log("Resend API Key exists:", !!process.env.RESEND_API_KEY);
      console.log("FROM_EMAIL:", FROM_EMAIL);

      const testOtp = "123456";
      const result = await sendVerificationEmail(email, testOtp, "Test User");

      if (result.success) {
        res.json({
          success: true,
          message: "Test email sent successfully",
          emailId: result.data?.id,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to send test email",
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({
        success: false,
        message: "Test failed",
        error: error.message,
      });
    }
  });

  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { email, otp } = req.body;
  
      if (!email || !otp) {
        return res.status(400).json({
          message: "Email and OTP are required",
        });
      }
  
      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Check if already verified
      if (user.emailVerified) {
        return res.status(400).json({
          message: "Email already verified",
        });
      }
  
      // Check if OTP exists and matches
      if (!user.emailVerificationOtp || user.emailVerificationOtp !== otp) {
        return res.status(400).json({
          message: "Invalid OTP",
        });
      }
  
      // Check if OTP is expired
      if (
        !user.emailVerificationOtpExpiresAt ||
        new Date() > user.emailVerificationOtpExpiresAt
      ) {
        return res.status(400).json({
          message: "OTP has expired. Please request a new one.",
        });
      }
  
      // ⭐⭐ 1. First, verify the email in database
      await db
        .update(users)
        .set({
          emailVerified: true,
          emailVerificationOtp: null, // Clear OTP after verification
          emailVerificationOtpExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
  
      let bonusCashCredited = 0;
      let bonusPointsCredited = 0;
  
      // ⭐⭐ 2. Apply normal signup bonus
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
  
      // ⭐⭐ 3. Apply referral system
      try {
        if (user.referredBy) {
          const referrer = await storage.getUser(user.referredBy); // ⭐ Get referrer by ID now
  
          if (referrer && referrer.id !== user.id) {
            // ⭐ Save to referral tracking table (like your original code)
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
  
      // ⭐⭐ 4. Send welcome email
      sendWelcomeEmail(email, {
        userName: `${user.firstName} ${user.lastName}`.trim() || "there",
        email,
      }).catch((err) => console.error("Failed to send welcome email:", err));
  
      // Create session
      (req as any).session.userId = user.id;
  
      res.json({
        message: "Email verified successfully! Welcome bonuses applied.",
        verified: true,
        bonusesApplied: {
          cash: bonusCashCredited,
          points: bonusPointsCredited,
          referral: !!user.referredBy,
        },
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: true,
        },
      });
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  app.post("/api/auth/resend-otp", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Email is required",
        });
      }

      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already verified
      if (user.emailVerified) {
        return res.status(400).json({
          message: "Email already verified",
        });
      }

      // Check rate limiting (max 3 attempts per hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (
        user.verificationSentAt &&
        new Date(user.verificationSentAt) > oneHourAgo
      ) {
        // Simple check: if OTP was sent less than 20 minutes ago, limit resends
        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
        if (user.verificationSentAt > twentyMinutesAgo) {
          // Count how many times OTP was sent in last hour
          const sentCount = await db
            .select()
            .from(users)
            .where(
              and(
                eq(users.email, email),
                gt(users.verificationSentAt, oneHourAgo)
              )
            )
            .then((rows) => rows.length);

          if (sentCount >= 3) {
            return res.status(429).json({
              message: "Too many OTP requests. Please try again in 1 hour.",
              retryAfter: "1 hour",
            });
          }
        }
      }

      // Generate new OTP
      const newOtp = OTPGenerator.generate();
      const expiresAt = OTPGenerator.getExpiryTime(10);

      // Update user with new OTP
      await db
        .update(users)
        .set({
          emailVerificationOtp: newOtp,
          emailVerificationOtpExpiresAt: expiresAt,
          verificationSentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Send new verification email
      await sendVerificationEmail(
        email,
        newOtp,
        `${user.firstName} ${user.lastName}`.trim() || user.firstName || "User"
      );

      res.json({
        message: "New OTP sent successfully to your email",
        expiresIn: "30 minutes",
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ message: "Failed to resend OTP" });
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

      // ⭐⭐ CHECK IF EMAIL IS VERIFIED
      if (!user.emailVerified) {
        return res.status(403).json({
          code: "EMAIL_NOT_VERIFIED",
          message: "Please verify your email before logging in.",
          email: user.email,
          canResend: true,
          userId: user.id,
        });
      }

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
          emailVerified: freshUser.emailVerified,
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

      console.log(
        `⚙️ [API] Game configs - Spin: ${spinConfig?.isVisible}, Scratch: ${scratchConfig?.isVisible}, Pop: ${popConfig?.isVisible}`
      );

      const visibleCompetitions = competitionsList.filter((comp) => {
        if (comp.type === "spin" && spinConfig?.isVisible === false)
          return false;
        if (comp.type === "scratch" && scratchConfig?.isVisible === false)
          return false;
        if (comp.type === "pop" && popConfig?.isVisible === false) return false;
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

        // Fetch specific payment
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

        // AUDIT LOG: Payment attempt (before checking status)
        const user = await storage.getUser(userId);
        const balance = parseFloat(user?.balance || "0");

        if (!successStatuses.includes(paymentStatus)) {
          await db
            .insert(auditLogs)
            .values({
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
            })
            .execute();

          return res
            .status(400)
            .json({
              message: `Payment not completed. Status: ${paymentStatus}`,
            });
        }

        // Retrieve order
        const order = await storage.getOrder(orderId);
        if (!order || order.userId !== userId) {
          await db
            .insert(auditLogs)
            .values({
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
            })
            .execute();

          return res
            .status(404)
            .json({ message: "Order not found or belongs to wrong user" });
        }

        // Get competition type
        const competition = await storage.getCompetition(order.competitionId);
        if (!competition) {
          await db
            .insert(auditLogs)
            .values({
              userId,
              userName:
                `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                "Customer",
              email: user?.email || "",
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
          await db
            .insert(auditLogs)
            .values({
              userId,
              userName:
                `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                "Customer",
              email: user?.email || "",
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
            alreadyProcessed: true,
          });
        }

        const ticketCount = order.quantity;
        const totalAmount = parseFloat(order.totalAmount || "0");

        // AUDIT LOG: Start of competition purchase processing
        const startBalance = parseFloat(user?.balance || "0");

        // Log before creating tickets
        await db
          .insert(auditLogs)
          .values({
            userId,
            userName:
              `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
              "Customer",
            email: user?.email || "",
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
        await db
          .insert(auditLogs)
          .values({
            userId,
            userName:
              `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
              "Customer",
            email: user?.email || "",
            action: auditAction,
            competitionId,
            description: auditDescription,
            startBalance: startBalance,
            endBalance: endBalance,
            createdAt: new Date(),
          })
          .execute();

        console.log(
          `✅ AUDIT LOG: ${auditAction} recorded for order ${orderId}`
        );

        // -------------------------
        // SEND ORDER CONFIRMATION EMAIL
        // -------------------------
        try {
          const tickets = await storage.getTicketsByOrderId(order.id);
          const ticketNumbers = tickets.map((t) => t.ticketNumber);

          if (user?.email && tickets.length > 0) {
            const orderType =
              competition.type === "spin"
                ? "spin"
                : competition.type === "scratch"
                ? "scratch"
                : "competition";

            await sendOrderConfirmationEmail(user.email, {
              orderId: order.id,
              userName:
                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                "Customer",
              orderType,
              itemName: competition.title,
              quantity: tickets.length,
              totalAmount: order.totalAmount,
              orderDate: new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              paymentMethod: "Card Payment (Cashflows)",
              skillQuestion: competition.skillQuestion || undefined,
              skillAnswer: order.skillAnswer || undefined,
              ticketNumbers:
                ticketNumbers.length > 0 ? ticketNumbers : undefined,
            });
          }
        } catch (err) {
          console.error(
            "Failed to send order confirmation email for Cashflows payment:",
            err
          );

          // AUDIT LOG: Email failure
          await db
            .insert(auditLogs)
            .values({
              userId,
              userName:
                `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                "Customer",
              email: user?.email || "",
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
          order.pointsAmount > 0
            ? `-${order.pointsAmount}`
            : `-${order.totalAmount}`;

        await storage.createTransaction({
          userId,
          type: "purchase",
          amount,
          description: `Purchased ${ticketCount} ticket(s)`,
          orderId,
        });

        console.log("✅ Competition payment processed successfully!");

        // AUDIT LOG: Final success log
        await db
          .insert(auditLogs)
          .values({
            userId,
            userName:
              `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
              "Customer",
            email: user?.email || "",
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
          competitionType,
        });
      } catch (error) {
        console.error("❌ Error confirming competition payment:", error);

        // AUDIT LOG: General error
        try {
          const user = await storage.getUser(req.user.id);
          const balance = parseFloat(user?.balance || "0");

          await db
            .insert(auditLogs)
            .values({
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
            })
            .execute();
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

  // Add webhook handler for Cashflows notifications
  app.post("/api/cashflows/webhook", async (req, res) => {
    console.log("WEBHOOK HIT", req.body);
  
    const { paymentJobReference, paymentReference } = req.body;
  
    // Always reply immediately
    res.status(200).json({ received: true });
  
    try {
      const pending = await db.query.pendingPayments.findFirst({
        where: (p, { eq }) => eq(p.paymentJobReference, paymentJobReference),
      });
  
      if (!pending) {
        console.warn("No pending payment found:", paymentJobReference);
        return;
      }
  
      // 🚫 Hard stop if not pending
      if (pending.status !== "pending") {
        console.log("Blocked non-pending payment:", pending.status);
        return;
      }
  
      // Save payment reference once
      if (!pending.paymentReference && paymentReference) {
        await db.update(pendingPayments)
          .set({ paymentReference })
          .where(eq(pendingPayments.id, pending.id));
      }
  
      // 🔍 Ask Cashflows for truth
      const payment = await cashflows.getPaymentStatus(
        paymentJobReference,
        paymentReference ?? undefined
      );
  
      const { status, paidAmount } = normalizeCashflowsStatus(payment);
  
      console.log("Normalized status:", { status, paidAmount });
  
      // ⏳ Still waiting
      if (status === "PENDING") return;
  
      // ❌ Any non-paid = fail forever
      if (status !== "PAID" || paidAmount <= 0) {
        await db.update(pendingPayments)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(pendingPayments.id, pending.id));
  
        console.warn("Wallet credit blocked", {
          paymentJobReference,
          status,
          paidAmount,
        });
        return;
      }
  
      // ✅ ONLY HERE money is allowed
      await processWalletTopup(
        pending.userId,
        pending.id,
        paymentReference ?? paymentJobReference,
        paidAmount
      );
  
      await db.update(pendingPayments)
        .set({
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(pendingPayments.id, pending.id));
  
      console.log("✅ Wallet credited safely:", paymentJobReference);
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
            await storage.updateUserRingtonePoints(
              userId,
              ringtonePoints + pointsUsed
            );

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
          const ticketNumbers = tickets.map((t) => t.ticketNumber);

          await sendOrderConfirmationEmail(user.email, {
            orderId: order.id,
            userName:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              "Customer",
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
          });
        }
      } catch (err) {
        console.error(
          "Failed to send order confirmation email for competition:",
          err
        );
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
              const newBalance = parseFloat(referrer.balance || "0") + bonus;

              await storage.updateUserBalance(
                referrer.id,
                newBalance.toFixed(2)
              );

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
      await db
        .insert(auditLogs)
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
      const { orderId, useWalletBalance = false, useRingtonePoints = false } = req.body;
  
      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      if (order.status !== "pending") {
        return res.status(400).json({ message: "Order already processed" });
      }
  
      // Get competition
      const competition = await storage.getCompetition(order.competitionId);
      if (!competition || competition.type !== "spin") {
        return res.status(400).json({ message: "Invalid competition type" });
      }
  
      // Get discount info if applied
      let pointsDiscount = 0;
      if (order.discountCodeId) {
        const discount = await db
          .select()
          .from(discountCodes)
          .where(eq(discountCodes.id, order.discountCodeId))
          .then(rows => rows[0]);
        
        if (discount && discount.type === "points" && discount.isActive) {
          pointsDiscount = discount.value || 0;
        }
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
            description: `Site Credit: £${walletAmount.toFixed(2)}`,
          });
        }
      }
  
      // Process ringtone points if selected WITH DISCOUNT
      if (useRingtonePoints && remainingAmount > 0) {
        const availablePoints = user?.ringtonePoints || 0;
        
        // Calculate points needed for remaining amount (100 points = £1.00)
        const pointsNeededForRemaining = Math.ceil(remainingAmount * 100);
        
        // Apply points discount
        const pointsNeededAfterDiscount = Math.max(0, pointsNeededForRemaining - pointsDiscount);
        
        // Check if user has enough points
        if (availablePoints < pointsNeededAfterDiscount) {
          // Refund wallet if used
          if (walletUsed > 0) {
            const currentBalance = parseFloat(user?.balance || "0");
            await storage.updateUserBalance(userId, (currentBalance + walletUsed).toString());
          }
          
          return res.status(400).json({ 
            message: `Insufficient points. You need ${pointsNeededAfterDiscount} points (${pointsNeededForRemaining} - ${pointsDiscount} discount). You have ${availablePoints} points.` 
          });
        }
        
        // Calculate cash value of points used
        const pointsAmount = pointsNeededAfterDiscount * 0.01;
        
        // Update user points
        const newPoints = availablePoints - pointsNeededAfterDiscount;
        await storage.updateUserRingtonePoints(userId, newPoints);
  
        // Create transaction
        await storage.createTransaction({
          userId,
          type: "purchase",
          amount: `-${pointsAmount.toFixed(2)}`,
          description: `Ringtone points payment for ${order.quantity} spin(s) - ${competition.title} (Used ${pointsNeededAfterDiscount} points${pointsDiscount > 0 ? `, ${pointsDiscount} points discount applied` : ''})`,
          orderId,
        });
  
        pointsUsed = pointsNeededAfterDiscount;
        remainingAmount -= pointsAmount;
        
        paymentBreakdown.push({
          method: "ringtone_points",
          amount: pointsAmount,
          pointsUsed: pointsNeededAfterDiscount,
          discountPoints: pointsDiscount,
          description: `Ringtone Points: £${pointsAmount.toFixed(2)} (${pointsNeededAfterDiscount} points${pointsDiscount > 0 ? ` - ${pointsDiscount} discount points` : ''})`,
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
  
        // Update order with payment info
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
          paymentBreakdown: {
            walletUsed,
            pointsUsed,
            cashflowsUsed,
            remainingAmount,
            pointsDiscount,
          },
        });
      } else {
        // Full payment completed with wallet/points only
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
  
        await storage.incrementCompetitionSoldTickets(order.competitionId, order.quantity);
  
        // Audit log
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
  
        // Send confirmation email
        if (user?.email) {
          const ticketNumbers = tickets.map((t) => t.ticketNumber);
          
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
            ticketNumbers: ticketNumbers.length > 0 ? ticketNumbers : undefined,
          }).catch((err) =>
            console.error("Failed to send order confirmation email:", err)
          );
        }
  
        return res.json({
          success: true,
          competitionId: order.competitionId,
          message: "Payment completed successfully",
          orderId: order.id,
          tickets: tickets.map((t) => ({ ticketNumber: t.ticketNumber })),
          spinsPurchased: order.quantity,
          paymentMethod: paymentMethodText,
          paymentBreakdown,
          pointsDiscount,
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
   // In the points prize section of /api/play-spin-wheel:
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

  // FIX: Use "ringtone_points" type for points prizes, not "prize"
  await storage.createTransaction({
    userId,
    type: "ringtone_points", // Changed from "prize" to "ringtone_points"
    amount: points.toString(), // This is points amount (no decimal)
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

          await tx.update(users);

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
       // In the points prize section of /api/reveal-all-spins:
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

  // FIX: Use "ringtone_points" type instead of "prize"
  await tx.insert(transactions).values({
    id: crypto.randomUUID(),
    userId,
    type: "ringtone_points", // Changed from "prize" to "ringtone_points"
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

  app.post(
    "/api/create-scratch-order",
    isAuthenticated,
    async (req: any, res) => {
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
    }
  );

  // Create Pop Game order
  app.post("/api/create-pop-order", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { competitionId, quantity = 1 } = req.body;

      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }

      const popCostPerGame = parseFloat(competition.ticketPrice);
      const totalAmount = popCostPerGame * quantity;

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

  app.post("/api/process-scratch-payment", isAuthenticated, async (req: any, res) => {
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
  
      // Get discount info if applied
      let pointsDiscount = 0;
      if (order.discountCodeId) {
        const discount = await db
          .select()
          .from(discountCodes)
          .where(eq(discountCodes.id, order.discountCodeId))
          .then(rows => rows[0]);
        
        if (discount && discount.type === "points" && discount.isActive) {
          pointsDiscount = discount.value || 0;
        }
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
  
      // Ringtone Points WITH DISCOUNT
      if (useRingtonePoints && remainingAmount > 0) {
        const availablePoints = user?.ringtonePoints || 0;
        
        // Calculate points needed for remaining amount
        const pointsNeededForRemaining = Math.ceil(remainingAmount * 100);
        
        // Apply points discount
        const pointsNeededAfterDiscount = Math.max(0, pointsNeededForRemaining - pointsDiscount);
        
        // Check if user has enough points
        if (availablePoints < pointsNeededAfterDiscount) {
          // Refund wallet if used
          if (walletUsed > 0) {
            const currentBalance = parseFloat(user?.balance || "0");
            await storage.updateUserBalance(userId, (currentBalance + walletUsed).toString());
          }
          
          return res.status(400).json({ 
            message: `Insufficient points. You need ${pointsNeededAfterDiscount} points (${pointsNeededForRemaining} - ${pointsDiscount} discount). You have ${availablePoints} points.` 
          });
        }
        
        // Calculate cash value of points used
        const pointsAmount = pointsNeededAfterDiscount * 0.01;
        
        // Update user points
        const newPoints = availablePoints - pointsNeededAfterDiscount;
        await storage.updateUserRingtonePoints(userId, newPoints);
        
        await storage.createTransaction({
          userId,
          type: "ringtone_points",
          amount: `-${pointsNeededAfterDiscount}`,
          description: `Ringtone points payment for ${order.quantity} scratch card(s) - ${competition.title}${pointsDiscount > 0 ? ` (${pointsDiscount} points discount applied)` : ''}`,
          orderId,
        });
  
        pointsUsed = pointsNeededAfterDiscount;
        remainingAmount -= pointsAmount;
        paymentBreakdown.push({
          method: "ringtone_points",
          amount: pointsAmount,
          pointsUsed: pointsNeededAfterDiscount,
          discountPoints: pointsDiscount,
          description: `Ringtone Points: £${pointsAmount.toFixed(2)} (${pointsNeededAfterDiscount} points${pointsDiscount > 0 ? ` - ${pointsDiscount} discount points` : ''})`,
        });
      }
  
      // Cashflows (for remaining)
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
  
        // Audit log
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
  
        // Send confirmation email
        if (user?.email) {
          const ticketNumbers = tickets.map((t) => t.ticketNumber);
  
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
          tickets: tickets.map((t) => ({ ticketNumber: t.ticketNumber })),
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
            type: "prize",
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

  // Reveal All Scratch Cards - Batch process remaining scratch cards
  app.post(
    "/api/reveal-all-scratch-cards",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { orderId, count , competitionId} = req.body;

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
          const selectedPrizes = [];
          for (let i = 0; i < cardsToProcess; i++) {
            // Filter eligible prizes based on current win counts
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
            if (selectedPrize.rewardType !== "try_again") {
              prizeWinCounts.set(
                selectedPrize.id,
                (prizeWinCounts.get(selectedPrize.id) || 0) + 1
              );
            }
          }

          // Batch insert all scratch card usages
          const usageValues = Array.from({ length: cardsToProcess }, () => ({
            orderId,
            userId,
            usedAt: new Date(),
          }));
          await tx.insert(scratchCardUsage).values(usageValues);

          // Batch update prize win counts and batch insert win records
          const prizeUpdates = new Map<string, number>();
          const winRecords = [];

          for (const selectedPrize of selectedPrizes) {
            if (!selectedPrize || selectedPrize.rewardType === "try_again")
              continue;

            prizeUpdates.set(
              selectedPrize.id,
              (prizeUpdates.get(selectedPrize.id) || 0) + 1
            );

            winRecords.push({
              userId,
              prizeId: selectedPrize.id,
              rewardType: selectedPrize.rewardType as any,
              rewardValue: String(selectedPrize.rewardValue),
            });
          }

          // Update all prize win counts in batch
          for (const [prizeId, increment] of prizeUpdates.entries()) {
            const prize = allPrizes.find((p) => p.id === prizeId);
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
            if (
              selectedPrize.rewardType === "cash" &&
              selectedPrize.rewardValue
            ) {
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
                competitionId,
                prizeDescription: "Scratch Card Prize",
                prizeValue: `£${amount}`,
                imageUrl: null,
                isShowcase: false,
                createdAt: new Date(),
              });

              prizeResponse = { type: "cash", value: amount.toFixed(2) };
            } else if (
              selectedPrize.rewardType === "points" &&
              selectedPrize.rewardValue
            ) {
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
                competitionId,
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
                competitionId,
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
      const { orderId, useWalletBalance = false, useRingtonePoints = false } = req.body;
  
      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      if (order.status !== "pending") {
        return res.status(400).json({ message: "Order already processed" });
      }
  
      const competition = await storage.getCompetition(order.competitionId);
      if (!competition || competition.type !== "pop") {
        return res.status(400).json({ message: "Invalid competition type" });
      }
  
      // Get discount info if applied
      let pointsDiscount = 0;
      if (order.discountCodeId) {
        const discount = await db
          .select()
          .from(discountCodes)
          .where(eq(discountCodes.id, order.discountCodeId))
          .then(rows => rows[0]);
        
        if (discount && discount.type === "points" && discount.isActive) {
          pointsDiscount = discount.value || 0;
        }
      }
  
      const user = await storage.getUser(userId);
      const totalAmount = parseFloat(order.totalAmount);
      let remainingAmount = totalAmount;
      let walletUsed = 0;
      let pointsUsed = 0;
  
      const paymentBreakdown = [];
  
      // Wallet
      if (useWalletBalance) {
        const walletBalance = parseFloat(user?.balance || "0");
        walletUsed = Math.min(walletBalance, remainingAmount);
        remainingAmount -= walletUsed;
        if (walletUsed > 0) {
          paymentBreakdown.push({ 
            method: "wallet", 
            amount: walletUsed,
            description: `Wallet: £${walletUsed.toFixed(2)}`
          });
        }
      }
  
      // Points WITH DISCOUNT
      if (useRingtonePoints && remainingAmount > 0) {
        const availablePoints = user?.ringtonePoints || 0;
        
        // Calculate points needed for remaining amount
        const pointsNeededForRemaining = Math.ceil(remainingAmount * 100);
        
        // Apply points discount
        const pointsNeededAfterDiscount = Math.max(0, pointsNeededForRemaining - pointsDiscount);
        
        // Check if user has enough points
        if (availablePoints < pointsNeededAfterDiscount) {
          // Refund wallet if used
          if (walletUsed > 0) {
            const currentBalance = parseFloat(user?.balance || "0");
            await storage.updateUserBalance(userId, (currentBalance + walletUsed).toString());
          }
          
          return res.status(400).json({ 
            message: `Insufficient points. You need ${pointsNeededAfterDiscount} points (${pointsNeededForRemaining} - ${pointsDiscount} discount). You have ${availablePoints} points.` 
          });
        }
        
        // Calculate cash value of points used
        const pointsAmount = pointsNeededAfterDiscount * 0.01;
        
        pointsUsed = pointsNeededAfterDiscount;
        remainingAmount -= pointsAmount;
        
        if (pointsUsed > 0) {
          paymentBreakdown.push({
            method: "points",
            amount: pointsAmount,
            pointsUsed: pointsNeededAfterDiscount,
            discountPoints: pointsDiscount,
            description: `Points: £${pointsAmount.toFixed(2)} (${pointsNeededAfterDiscount} points${pointsDiscount > 0 ? ` - ${pointsDiscount} discount points` : ''})`,
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
        const newBalance = parseFloat(user?.balance || "0") - walletUsed;
        await storage.updateUserBalance(userId, newBalance.toFixed(2));
      }
  
      if (pointsUsed > 0) {
        const newPoints = (user?.ringtonePoints || 0) - pointsUsed;
        await storage.updateUserRingtonePoints(userId, newPoints);
      }
  
      // Update order status and payment info
      await storage.updateOrderStatus(orderId, "completed");
      
      // Create payment method text
      let paymentMethodText = "pending";
      const methods = paymentBreakdown.map(p => p.method);
      if (methods.includes("wallet") && methods.includes("points")) {
        paymentMethodText = "Wallet+Points";
      } else if (methods.includes("wallet")) {
        paymentMethodText = "Wallet";
      } else if (methods.includes("points")) {
        paymentMethodText = "Points";
      }
      
      await storage.updateOrderPaymentInfo(orderId, {
        paymentMethod: paymentMethodText,
        walletAmount: walletUsed.toString(),
        pointsAmount: pointsUsed.toString(),
        cashflowsAmount: "0",
        paymentBreakdown: JSON.stringify(paymentBreakdown),
      });
  
      // Increment soldTickets
      if (competition) {
        const newSoldTickets = (competition.soldTickets || 0) + order.quantity;
        await db
          .update(competitions)
          .set({ soldTickets: newSoldTickets })
          .where(eq(competitions.id, competition.id));
      }
  
      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "pop_purchase",
        amount: totalAmount.toFixed(2),
        description: `Pop Game Purchase - ${order.quantity} games${pointsDiscount > 0 ? ` (${pointsDiscount} points discount applied)` : ''}`,
        orderId: orderId,
      });
  
      // Create tickets for pop game entries
      for (let i = 0; i < order.quantity; i++) {
        await storage.createTicket({
          competitionId: order.competitionId,
          orderId: orderId,
          userId,
          ticketNumber: `POP-${orderId.slice(0, 8).toUpperCase()}-${(i + 1).toString().padStart(3, "0")}`,
          isWinner: false,
        });
      }
  
      if (user?.email) {
        try {
          const tickets = await storage.getTicketsByOrderId(order.id);
          const ticketNumbers = tickets.map((t) => t.ticketNumber);
  
          await sendOrderConfirmationEmail(user.email, {
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
          });
        } catch (err) {
          console.error("❌ Failed to send POP confirmation email:", err);
        }
      }
  
      res.json({
        success: true,
        message: "Pop game purchase complete!",
        competitionId: order.competitionId,
        orderId: order.id,
        quantity: order.quantity,
        paymentBreakdown,
        pointsDiscount,
      });
    } catch (error) {
      console.error("Error processing pop payment:", error);
      res.status(500).json({ message: "Failed to process pop payment" });
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
  
        if (!["cash", "points"].includes(type))
          return res.status(400).json({ error: "Invalid type" });
        if (!code || typeof code !== "string")
          return res.status(400).json({ error: "Code is required" });
        if (value <= 0) return res.status(400).json({ error: "Value must be > 0" });
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

    // Prepare discount values
    let discountAmount = Number(discount.value);
    let newTotalAmount = Number(order.totalAmount);
    let pointsDiscountAmount = 0;

    if (discount.type === "cash") {
      newTotalAmount -= discountAmount;
      if (newTotalAmount < 0) newTotalAmount = 0;
    } else if (discount.type === "points") {
      pointsDiscountAmount = discountAmount; // Just store points, no change to cash total
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
          totalAmount: discount.type === "cash" ? newTotalAmount : order.totalAmount,
          discountCodeId: discount.id,
          discountAmount: discountAmount,
          discountType: discount.type,
          pointsDiscountAmount: discount.type === "points" ? pointsDiscountAmount : null
        })
        .where(eq(orders.id, orderId));

      // Record usage
      await tx.insert(discountCodeUsages).values({
        discountCodeId: discount.id,
        userId,
        orderId,
      });
    });

    res.json({ 
      success: true,
      newTotalAmount: Number(order.totalAmount),
      discountAmount,
      discountType: discount.type,
      pointsDiscountAmount: discount.type === "points" ? pointsDiscountAmount : 0,
      message: discount.type === "cash"
        ? `Discount applied: £${discountAmount.toFixed(2)} off`
        : `Discount applied: ${discountAmount} points discount available`,
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
            pointsDiscountAmount: null
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

  app.get(
    "/api/admin/cashflow-transactions",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        // 1️⃣ CASHFLOW DEPOSITS ONLY (Wallet top-ups)
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
            paymentRef: transactions.paymentRef,
          })
          .from(transactions)
          .leftJoin(users, eq(transactions.userId, users.id))
          .where(sql`${transactions.type} = 'deposit'`);

        // 2️⃣ SORT NEWEST FIRST
        cashflowDeposits.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        // 3️⃣ RETURN ONLY DEPOSITS
        res.json(cashflowDeposits);
      } catch (error) {
        console.error("Error fetching cashflow transactions:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch cashflow transactions" });
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

  app.post("/api/wallet/confirm-topup", isAuthenticated, async (req, res) => {
    try {
      const { paymentJobRef, paymentRef } = req.body;
      const userId = req.user.id;
      const payment = await cashflows.getPaymentStatus(
        paymentJobRef,
        paymentRef ?? undefined
      );

      const { status , paidAmount } = normalizeCashflowsStatus(payment);

      // ✅ Save paymentReference for recovery job
      // if (paymentRef && status === "PAID") {
      //   await db
      //     .update(pendingPayments)
      //     .set({ paymentReference: paymentRef })
      //     .where(eq(pendingPayments.paymentJobReference, paymentJobRef));
      // }

      if (status === "PAID") {
        return res.json({
          status,
          message: "Payment received. Wallet will update shortly.",
        });
      }

      // If payment is still pending or failed
      return res.json({
        status,
        message: "Payment not completed. Please try again manually.",
      });
    } catch (err: any) {
      console.error("Confirm top-up error:", err);
      return res.status(500).json({ message: "Failed to confirm wallet top-up" });
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

    // Get competition
    const competition = await storage.getCompetition(competitionId);
    if (!competition || competition.type !== "plinko") {
      return res.status(404).json({ message: "Plinko competition not found" });
    }

    // Calculate total
    const ticketPrice = parseFloat(competition.ticketPrice);
    const totalAmount = ticketPrice * quantity;

    // Create pending order
    const order = await storage.createOrder({
      userId,
      competitionId,
      quantity,
      totalAmount: totalAmount.toFixed(2),
      paymentMethod: "pending",
      status: "pending",
    });

    res.json({
      success: true,
      orderId: order.id,
      totalAmount: totalAmount.toFixed(2),
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
app.post("/api/play-plinko", isAuthenticated, async (req: any, res) => {
  try {
    console.log("🔵 [Plinko Play] Starting play request");
    console.log("🔵 [Plinko Play] Request body:", req.body);
    
    const userId = req.user.id;
    const { orderId, competitionId } = req.body;

    if (!orderId || !competitionId) {
      console.log("🔴 [Plinko Play] Missing orderId or competitionId");
      return res.status(400).json({
        success: false,
        message: "Order ID and Competition ID are required",
      });
    }

    // Cooldown check
    const cooldownKey = `${userId}-${orderId}`;
    const lastPlayTime = plinkoCooldowns.get(cooldownKey) || 0;
    const now = Date.now();
    
    if (now - lastPlayTime < PLINKO_COOLDOWN_MS) {
      console.log("🔴 [Plinko Play] Cooldown active for user:", userId);
      return res.status(429).json({
        success: false,
        message: "Please wait a moment before playing again",
      });
    }
    
    plinkoCooldowns.set(cooldownKey, now);
    console.log("🟢 [Plinko Play] Cooldown check passed");

    // Verify valid completed order
    const order = await storage.getOrder(orderId);
    console.log("🔵 [Plinko Play] Retrieved order:", order ? {
      id: order.id,
      userId: order.userId,
      status: order.status,
      quantity: order.quantity
    } : "Order not found");
    
    if (!order || order.userId !== userId || order.status !== "completed") {
      console.log("🔴 [Plinko Play] Invalid order:", {
        orderExists: !!order,
        userIdMatches: order?.userId === userId,
        statusIsCompleted: order?.status === "completed"
      });
      return res.status(400).json({
        success: false,
        message: "No valid Plinko game purchase found",
      });
    }

    // Check plays remaining
    const playsUsed = await db
      .select({ count: sql<number>`count(*)` })
      .from(plinkoUsage)
      .where(eq(plinkoUsage.orderId, orderId));
    
    const usedCount = Number(playsUsed[0]?.count || 0);
    const playsRemaining = order.quantity - usedCount;
    
    console.log("🔵 [Plinko Play] Plays check:", {
      orderQuantity: order.quantity,
      usedCount,
      playsRemaining
    });

    if (playsRemaining <= 0) {
      console.log("🔴 [Plinko Play] No plays remaining");
      return res.status(400).json({
        success: false,
        message: "No plays remaining in this purchase",
      });
    }

    // Get user
    const user = await storage.getUser(userId);
    console.log("🔵 [Plinko Play] User found:", user ? "Yes" : "No");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get Plinko config
    const [config] = await db.select().from(gamePlinkoConfig).where(eq(gamePlinkoConfig.id, "active"));
    const plinkoConfig = config || { rows: 12, freeReplayProbability: "5.00", isActive: true };
    
    console.log("🔵 [Plinko Play] Config:", {
      configExists: !!config,
      isActive: plinkoConfig.isActive,
      rows: plinkoConfig.rows,
      freeReplayProbability: plinkoConfig.freeReplayProbability
    });
    
    if (!plinkoConfig.isActive) {
      console.log("🔴 [Plinko Play] Game is not active");
      return res.status(400).json({
        success: false,
        message: "Ringtone Plinko is currently unavailable",
      });
    }

    // Get all prizes
    const allPrizes = await db
      .select()
      .from(plinkoPrizes)
      .where(eq(plinkoPrizes.isActive, true))
      .orderBy(asc(plinkoPrizes.slotIndex));

    console.log("🔵 [Plinko Play] All prizes from DB:", {
      totalPrizes: allPrizes.length,
      prizes: allPrizes.map(p => ({
        slotIndex: p.slotIndex,
        prizeName: p.prizeName,
        rewardType: p.rewardType,
        probability: p.probability,
        maxWins: p.maxWins,
        quantityWon: p.quantityWon,
        isActive: p.isActive
      }))
    });

    if (!allPrizes || allPrizes.length === 0) {
      console.log("🔴 [Plinko Play] No active prizes found in database");
      return res.status(400).json({
        success: false,
        message: "No prizes available",
      });
    }

    // Filter eligible prizes (check maxWins)
    const eligiblePrizes = allPrizes.filter(prize => {
      if (prize.maxWins !== null && prize.quantityWon !== null && prize.quantityWon >= prize.maxWins) {
        console.log(`❌ Prize ${prize.prizeName} excluded - max wins reached: ${prize.quantityWon}/${prize.maxWins}`);
        return false;
      }
      return true;
    });

    console.log("🔵 [Plinko Play] Eligible prizes after maxWins filter:", {
      eligibleCount: eligiblePrizes.length,
      eligiblePrizes: eligiblePrizes.map(p => ({
        slotIndex: p.slotIndex,
        prizeName: p.prizeName,
        probability: p.probability,
        quantityWon: p.quantityWon,
        maxWins: p.maxWins
      }))
    });

    if (eligiblePrizes.length === 0) {
      console.log("🔴 [Plinko Play] No eligible prizes after maxWins filter");
      return res.status(400).json({
        success: false,
        message: "No prizes available at this time",
      });
    }

    // Weighted random selection based on probability
    const totalProbability = eligiblePrizes.reduce((sum, prize) => sum + parseFloat(prize.probability || "0"), 0);
    console.log("🔵 [Plinko Play] Total probability of eligible prizes:", totalProbability);
    
    let random = Math.random() * totalProbability;
    let selectedPrize = eligiblePrizes[0];
    console.log("🔵 [Plinko Play] Random number generated:", random, "out of", totalProbability);

    for (const prize of eligiblePrizes) {
      const prizeProb = parseFloat(prize.probability || "0");
      console.log(`🔵 [Plinko Play] Checking prize ${prize.prizeName} (prob: ${prizeProb}) - random before: ${random}`);
      random -= prizeProb;
      console.log(`🔵 [Plinko Play] Random after subtracting: ${random}`);
      
      if (random <= 0) {
        selectedPrize = prize;
        console.log(`🟢 [Plinko Play] Selected prize: ${prize.prizeName}`);
        break;
      }
    }

    console.log("🔵 [Plinko Play] Final selected prize:", {
      slotIndex: selectedPrize.slotIndex,
      prizeName: selectedPrize.prizeName,
      rewardType: selectedPrize.rewardType,
      prizeValue: selectedPrize.prizeValue,
      probability: selectedPrize.probability
    });

    const slotIndex = selectedPrize.slotIndex;
    const rewardType = selectedPrize.rewardType;
    const prizeValue = parseFloat(selectedPrize.prizeValue || "0");
    const isWin = rewardType === "cash" || rewardType === "points";
    const isFreePlay = rewardType === "free_play";
    let rewardValue = "0";
    let segmentFreePlay = false;

    console.log("🔵 [Plinko Play] Prize processing:", {
      isWin,
      isFreePlay,
      rewardType,
      prizeValue
    });

    // Record usage
    await db.insert(plinkoUsage).values({
      orderId,
      userId,
    });
    console.log("🟢 [Plinko Play] Usage recorded");

    // Process prize
    if (isWin) {
      rewardValue = prizeValue.toString();
      console.log(`🟢 [Plinko Play] Processing win: ${rewardType} - ${rewardValue}`);

      if (rewardType === "cash") {
        // Award cash prize
        const finalBalance = parseFloat(user.balance || "0") + prizeValue;
        console.log(`💰 [Plinko Play] Awarding cash: £${prizeValue}. Old balance: ${user.balance}, New balance: ${finalBalance}`);
        
        await storage.updateUserBalance(userId, finalBalance.toFixed(2));

        await storage.createTransaction({
          userId,
          type: "prize",
          amount: prizeValue.toFixed(2),
          description: `Ringtone Plinko Win - £${prizeValue}`,
          status: "completed",
        });
      } else if (rewardType === "points") {
        // Award points
        const currentPoints = user.ringtonePoints || 0;
        const newPoints = currentPoints + prizeValue;
        console.log(`🎯 [Plinko Play] Awarding points: ${prizeValue}. Old points: ${currentPoints}, New points: ${newPoints}`);
        
        await db.update(users).set({ ringtonePoints: newPoints }).where(eq(users.id, userId));

        await storage.createTransaction({
          userId,
          type: "prize",
          amount: `${prizeValue}.00`, // Store points as amount
          description: `Ringtone Plinko Win - ${prizeValue} Points`,
          status: "completed",
        });
      }

      // Increment quantityWon for the prize
      await db
        .update(plinkoPrizes)
        .set({ quantityWon: (selectedPrize.quantityWon || 0) + 1 })
        .where(eq(plinkoPrizes.id, selectedPrize.id));
      console.log(`📈 [Plinko Play] Incremented quantityWon for prize: ${selectedPrize.prizeName}`);
      
    } else if (isFreePlay) {
      // Grant free play from segment win
      segmentFreePlay = true;
      rewardValue = "1";
      console.log(`🎁 [Plinko Play] Processing free play prize`);
      
      // Increase order quantity for free play
      await db
        .update(orders)
        .set({ quantity: order.quantity + 1 })
        .where(eq(orders.id, orderId));
      
      // Increment quantityWon for free play segment
      await db
        .update(plinkoPrizes)
        .set({ quantityWon: (selectedPrize.quantityWon || 0) + 1 })
        .where(eq(plinkoPrizes.id, selectedPrize.id));
      console.log(`📈 [Plinko Play] Incremented quantityWon for free play prize`);
    } else {
      console.log(`🔵 [Plinko Play] Processing other prize type: ${rewardType}`);
      rewardValue = "0";
      // Still increment quantityWon for tracking
      await db
        .update(plinkoPrizes)
        .set({ quantityWon: (selectedPrize.quantityWon || 0) + 1 })
        .where(eq(plinkoPrizes.id, selectedPrize.id));
    }

    // Record win/loss
    await db.insert(plinkoWins).values({
      orderId,
      userId,
      prizeId: selectedPrize.id,
      slotIndex,
      rewardType,
      rewardValue,
      isWin,
    });
    console.log("📝 [Plinko Play] Win/loss recorded in plinkoWins table");

    // Record win in main winners table for admin visibility
    if (isWin && rewardType !== "try_again") {
      await db.insert(winners).values({
        userId,
        competitionId,
        prizeDescription: `Plinko: ${selectedPrize.prizeName}`,
        prizeValue: rewardValue,
      });
      console.log("🏆 [Plinko Play] Added to winners table");
    }

    // Check for Random Free Replay (independent of prize outcome)
    const freeReplayChance = parseFloat(plinkoConfig.freeReplayProbability || "5.00") / 100;
    const gotFreeReplay = Math.random() < freeReplayChance;
    
    console.log("🎲 [Plinko Play] Free replay check:", {
      freeReplayChance,
      gotFreeReplay,
      randomNumber: Math.random()
    });

    if (gotFreeReplay) {
      // Grant free replay by increasing order quantity
      await db
        .update(orders)
        .set({ quantity: order.quantity + 1 })
        .where(eq(orders.id, orderId));
      console.log("🎁 [Plinko Play] Granted random free replay!");
    }

    // Get updated balance
    const updatedUser = await storage.getUser(userId);

    // Calculate total free plays gained
    const totalFreePlays = (gotFreeReplay ? 1 : 0) + (segmentFreePlay ? 1 : 0);
    
    console.log("✅ [Plinko Play] Success! Returning result:", {
      slotIndex,
      prizeName: selectedPrize.prizeName,
      isWin,
      isFreePlay,
      freeReplay: gotFreeReplay,
      segmentFreePlay,
      playsRemaining: playsRemaining - 1 + totalFreePlays,
      totalFreePlays
    });
    

    console.log("✅ [Plinko Play] Success! Returning result:", {
      slotIndex,
      prizeName: selectedPrize.prizeName,
      isWin,
      isFreePlay,
      freeReplay: gotFreeReplay,
      segmentFreePlay,
      playsRemaining: playsRemaining - 1 + totalFreePlays,
      totalFreePlays,
      // Add these:
      userBalance: updatedUser?.balance,
      userPoints: updatedUser?.ringtonePoints,
      oldBalance: user.balance,
      oldPoints: user.ringtonePoints
    });
    res.json({
      success: true,
      slotIndex,
      prizeName: selectedPrize.prizeName,
      prizeValue: rewardValue,
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
    console.error("🔴 [Plinko Play] Error playing Plinko:", error);
    console.error("🔴 [Plinko Play] Error stack:", error.stack);
    res.status(500).json({ message: "Failed to play Plinko" });
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
    const { orderId, useWalletBalance = false, useRingtonePoints = false } = req.body;

    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order already processed" });
    }

    const competition = await storage.getCompetition(order.competitionId);
    if (!competition || competition.type !== "plinko") {
      return res.status(400).json({ message: "Invalid competition type" });
    }

    const user = await storage.getUser(userId);
    const totalAmount = parseFloat(order.totalAmount);
    let remainingAmount = totalAmount;
    let walletUsed = 0;
    let pointsUsed = 0;

    const paymentBreakdown = [];

    // Wallet
    if (useWalletBalance) {
      const walletBalance = parseFloat(user?.balance || "0");
      walletUsed = Math.min(walletBalance, remainingAmount);
      remainingAmount -= walletUsed;
      if (walletUsed > 0) {
        paymentBreakdown.push({ method: "wallet", amount: walletUsed });
      }
    }

    // Points
    if (useRingtonePoints && remainingAmount > 0) {
      const userPoints = user?.ringtonePoints || 0;
      const pointsValue = userPoints * 0.01;
      const pointsToUse = Math.min(pointsValue, remainingAmount);
      pointsUsed = Math.ceil(pointsToUse * 100);
      remainingAmount -= pointsToUse;
      if (pointsUsed > 0) {
        paymentBreakdown.push({ method: "points", amount: pointsToUse, pointsUsed });
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
      const newBalance = parseFloat(user?.balance || "0") - walletUsed;
      await storage.updateUserBalance(userId, newBalance.toFixed(2));
    }

    if (pointsUsed > 0) {
      const newPoints = (user?.ringtonePoints || 0) - pointsUsed;
      await storage.updateUserRingtonePoints(userId, newPoints);
    }

    // Update order status and payment info
    await storage.updateOrderStatus(orderId, "completed");
    await storage.updateOrderPaymentInfo(orderId, {
      paymentMethod: paymentBreakdown.map(p => p.method).join("+") || "free",
    });

    // Create transaction record
    await storage.createTransaction({
      userId,
      type: "plinko_purchase",
      amount: totalAmount.toFixed(2),
      description: `Plinko Game Purchase - ${order.quantity} games`,
      orderId: orderId,
    });

    // 🔥 CRITICAL FIX: Increment soldTickets for the competition
    const newSoldTickets = (competition.soldTickets || 0) + order.quantity;
    
    await db.update(competitions)
      .set({ 
        soldTickets: newSoldTickets,
        updatedAt: new Date()
      })
      .where(eq(competitions.id, competition.id));
    
    console.log(`📈 Updated soldTickets for competition ${competition.id}: ${competition.soldTickets || 0} → ${newSoldTickets}`);

    // Create tickets for plinko game entries (so they show in entries tab)
    for (let i = 0; i < order.quantity; i++) {
      await storage.createTicket({
        competitionId: order.competitionId,
        orderId: orderId,
        userId,
        ticketNumber: `PLINKO-${orderId.slice(0, 8).toUpperCase()}-${(i + 1).toString().padStart(3, '0')}`,
        isWinner: false,
      });
    }

    res.json({
      success: true,
      message: "Plinko game purchase complete!",
      competitionId: order.competitionId,
      orderId: order.id,
      soldTickets: newSoldTickets, // Return updated count for debugging
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
        type: "prize",
        amount: "0.00",
        description: `Ringtone Plinko Reveal All - ${totalPointsWon} Points`,
        status: "completed",
      });
    }

    // Get updated user
    const updatedUser = await storage.getUser(userId);

    res.json({
      success: true,
      results,
      totalCashWon,
      totalPointsWon,
      freeReplaysGranted,
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
      const { userId, competitionId, prizeDescription, prizeValue, imageUrl } =
        req.body;

      if (!userId || !prizeDescription || !prizeValue) {
        return res
          .status(400)
          .json({
            message: "userId, prizeDescription, and prizeValue are required",
          });
      }

      const winner = await storage.createWinner({
        userId,
        competitionId:
          competitionId === null || competitionId === "" ? null : competitionId,
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

        // Validate probability
        const total = segments.reduce(
          (sum: number, s: any) => sum + (Number(s.probability) || 0),
          0
        );

        if (Math.abs(total - 100) > 0.01) {
          return res
            .status(400)
            .json({ message: "Total probability must be 100%" });
        }

        // REMOVE currentWins before saving
        const cleanSegments = segments.map(
          ({ currentWins, ...rest }: any) => rest
        );

        const [existing] = await db
          .select()
          .from(gamePopConfig)
          .where(eq(gamePopConfig.id, "active"));

        const [saved] = existing
          ? await db
              .update(gamePopConfig)
              .set({
                prizes: cleanSegments,
                isVisible,
                isActive,
                updatedAt: new Date(),
              })
              .where(eq(gamePopConfig.id, "active"))
              .returning()
          : await db
              .insert(gamePopConfig)
              .values({
                id: "active",
                prizes: cleanSegments,
                isVisible: true,
                isActive: true,
              })
              .returning();

        res.json({
          ...saved,
          segments: cleanSegments,
        });
      } catch (err) {
        console.error("PUT pop config error:", err);
        res.status(500).json({ message: "Failed to save pop config" });
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

  // Pop game cooldown tracker
  const popCooldowns = new Map<string, number>();
  const POP_COOLDOWN_MS = 3000; // 3 seconds between plays

  // Play Ringtone Pop game (user)
  app.post("/api/play-pop", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId, competitionId } = req.body;

      if (!orderId || !competitionId) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Order ID and Competition ID are required",
          });
      }

      // Cooldown
      const cooldownKey = `${userId}-${orderId}`;
      const lastPlayTime = popCooldowns.get(cooldownKey) || 0;
      const now = Date.now();
      if (now - lastPlayTime < POP_COOLDOWN_MS) {
        return res
          .status(429)
          .json({
            success: false,
            message: "Please wait a moment before playing again",
          });
      }
      popCooldowns.set(cooldownKey, now);

      // Verify order
      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== userId || order.status !== "completed") {
        return res
          .status(400)
          .json({
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
      if (playsRemaining <= 0)
        return res
          .status(400)
          .json({
            success: false,
            message: "No plays remaining in this purchase",
          });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Load active pop config
      const [config] = await db
        .select()
        .from(gamePopConfig)
        .where(eq(gamePopConfig.id, "active"));
      const popConfig = config || DEFAULT_POP_CONFIG;
      if (!popConfig.isActive)
        return res
          .status(400)
          .json({
            success: false,
            message: "Ringtone Pop is currently unavailable",
          });

      const segments =
        (popConfig as any).segments ||
        (popConfig as any).prizes ||
        DEFAULT_POP_CONFIG.segments;

      // Count ALL previous pops (win + try_again + lose)
      const counts = await db
        .select({ prizeId: popWins.prizeId, count: sql<number>`count(*)` })
        .from(popWins)
        .groupBy(popWins.prizeId);
      const segmentWinCounts = new Map<string, number>();
      counts.forEach((c) => segmentWinCounts.set(c.prizeId, Number(c.count)));
      segments.forEach((seg) => {
        if (!segmentWinCounts.has(seg.id)) segmentWinCounts.set(seg.id, 0);
      });

      // Process a single play
      const eligibleSegments = segments.filter((seg) => {
        const wins = segmentWinCounts.get(seg.id) ?? 0;
        // maxWins only applies to real wins
        if (
          seg.maxWins !== null &&
          (seg.rewardType === "cash" || seg.rewardType === "points")
        ) {
          if (wins >= seg.maxWins) return false;
        }
        return true;
      });

      // Force "lose" if nothing left
      const finalEligible = eligibleSegments.length
        ? eligibleSegments
        : [segments.find((s) => s.rewardType === "lose")!];

      // Weighted random selection
      const totalProbability = finalEligible.reduce(
        (sum, seg) => sum + (seg.probability || 0),
        0
      );
      let random = Math.random() * totalProbability;
      let selectedSegment = finalEligible[0];
      for (const seg of finalEligible) {
        random -= seg.probability || 0;
        if (random <= 0) {
          selectedSegment = seg;
          break;
        }
      }

      let balloonValues: number[] = [];
      const rewardType = selectedSegment.rewardType || "lose";
      let rewardValue = "0";
      const isRPrize = rewardType === "try_again";
      const isWin = rewardType === "cash" || rewardType === "points";

      if (isRPrize) {
        const cashSegments = segments.filter((s) => s.rewardType === "cash");
        const vals = cashSegments.map((s) =>
          parseFloat(s.rewardValue?.toString() || "1")
        );
        let val1 = vals[Math.floor(Math.random() * vals.length)] || 1;
        let val2 =
          vals.length > 1
            ? vals[Math.floor(Math.random() * vals.length)]
            : val1 + 1;
        while (val2 === val1 && vals.length > 1)
          val2 = vals[Math.floor(Math.random() * vals.length)];
        const rPos = Math.floor(Math.random() * 3);
        balloonValues =
          rPos === 0
            ? [-1, val1, val2]
            : rPos === 1
            ? [val1, -1, val2]
            : [val1, val2, -1];
        rewardValue = "0";
        await db
          .update(orders)
          .set({ quantity: order.quantity + 1 })
          .where(eq(orders.id, orderId));
      } else if (isWin) {
        const value = parseFloat(
          selectedSegment.rewardValue?.toString() || "0"
        );
        balloonValues = [value, value, value];
        rewardValue = value.toString();
        if (rewardType === "cash") {
          const finalBalance = parseFloat(user.balance || "0") + value;
          await storage.updateUserBalance(userId, finalBalance.toFixed(2));
          await storage.createTransaction({
            userId,
            type: "prize",
            amount: value.toFixed(2),
            description: `Ringtone Pop Win - £${value}`,
          });
        } else if (rewardType === "points") {
          const pointsValue = Math.floor(value);
          const newPoints = (user.ringtonePoints || 0) + pointsValue;
          await db
            .update(users)
            .set({ ringtonePoints: newPoints })
            .where(eq(users.id, userId));
          await storage.createTransaction({
            userId,
            type: "ringtone_points",
            amount: pointsValue.toString(),
            description: `Ringtone Pop Win - ${pointsValue} pts`,
          });
        }
        await db.insert(winners).values({
          userId,
          competitionId,
          prizeDescription: "Ringtone Pop Win",
          prizeValue:
            rewardType === "cash"
              ? `£${rewardValue} Cash`
              : `${rewardValue} Points`,
          imageUrl: selectedSegment.imageUrl || null,
          isShowcase: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        const cashVals = segments
          .filter((s) => s.rewardType === "cash")
          .map((s) => parseFloat(s.rewardValue?.toString() || "1"));
        if (cashVals.length >= 2) {
          let v1 = cashVals[Math.floor(Math.random() * cashVals.length)];
          let v2 = cashVals[Math.floor(Math.random() * cashVals.length)];
          let v3 = cashVals[Math.floor(Math.random() * cashVals.length)];
          if (v1 === v2 && v2 === v3)
            v3 = cashVals.find((v) => v !== v1) || v1 + 1;
          balloonValues = [v1, v2, v3];
        } else balloonValues = [1, 5, 10];
      }
      console.log("Pop win inserted into winners table:", {
        userId,
        competitionId,
        rewardValue,
        isShowcase: false,
      });
      // Record usage and win
      await db.insert(popUsage).values({ orderId, userId, usedAt: new Date() });
      await db
        .insert(popWins)
        .values({
          orderId,
          userId,
          prizeId: selectedSegment.id || "none",
          balloonValues,
          rewardType,
          rewardValue,
          isWin,
          wonAt: new Date(),
        });

      res.json({
        success: true,
        result: { balloonValues, isWin, isRPrize, rewardType, rewardValue },
        playsRemaining: playsRemaining - 1,
      });
    } catch (error) {
      console.error("Error playing pop game:", error);
      res.status(500).json({ message: "Failed to play pop game" });
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

      let totalCash = 0;
      let totalPoints = 0;
      let freeReplaysWon = 0;
      const results: any[] = [];

      // Count existing wins for all segments from popWins table
      const counts = await db
        .select({ prizeId: popWins.prizeId, count: sql<number>`count(*)` })
        .from(popWins)
        .where(eq(popWins.isWin, true))
        .groupBy(popWins.prizeId);
      const segmentWinCounts = new Map<string, number>();
      counts.forEach((c) => segmentWinCounts.set(c.prizeId, Number(c.count)));

      // Initialize segment counts if missing
      segments.forEach((seg) => {
        if (!segmentWinCounts.has(seg.id)) segmentWinCounts.set(seg.id, 0);
      });

      // Find a "lose" segment to use as fallback
      const loseSegment = segments.find((s) => s.rewardType === "lose");

      // Transaction to process all plays
      await db.transaction(async (tx) => {
        for (let i = 0; i < playsToProcess; i++) {
          let selectedSegment;
          let isRPrize = false;
          let isWin = false;

          // Eligible segments: maxWins applies only to cash/points
          const eligibleSegments = segments.filter((seg) => {
            const wins = segmentWinCounts.get(seg.id) ?? 0;
            if (
              seg.maxWins !== null &&
              (seg.rewardType === "cash" || seg.rewardType === "points")
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
            // If no eligible segments (all maxWins reached), use lose segment
            selectedSegment = loseSegment || segments[0];
          }

          let balloonValues: number[] = [];
          const rewardType = selectedSegment.rewardType || "lose";
          let rewardValue = "0";
          isRPrize = rewardType === "try_again";
          isWin = rewardType === "cash" || rewardType === "points";

          if (isRPrize) {
            // Free Replay - one R symbol + 2 random cash values
            const cashSegments = segments.filter(
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
            balloonValues = [value, value, value];
            rewardValue = value.toString();
            if (rewardType === "cash") totalCash += value;
            if (rewardType === "points") totalPoints += Math.floor(value);
            segmentWinCounts.set(
              selectedSegment.id,
              (segmentWinCounts.get(selectedSegment.id) || 0) + 1
            );
            await tx.insert(winners).values({
              userId,
              competitionId,
              prizeDescription: "Ringtone Pop Win",
              prizeValue:
                rewardType === "cash"
                  ? `£${rewardValue} Cash`
                  : `${rewardValue} Points`,
              imageUrl: selectedSegment.imageUrl || null,
              isShowcase: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          } else {
            // Lose: generate random non-matching balloon values
            const cashValues = segments
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
            rewardType,
            rewardValue,
            isWin,
            wonAt: new Date(),
          });

          results.push({
            balloonValues,
            isWin,
            isRPrize,
            prize: { type: rewardType, value: rewardValue },
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

      res.json({
        success: true,
        processed: playsToProcess,
        results,
        totalWon: totalCash,
        freeReplaysWon,
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
      .orderBy(asc(plinkoPrizes.slotIndex));
    
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
            .where(eq(plinkoPrizes.slotIndex, prize.slotIndex));
          
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
                updatedAt: new Date(),
              })
              .where(eq(plinkoPrizes.slotIndex, prize.slotIndex));
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
              displayOrder: prize.slotIndex,
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

  // Manage users
  app.get(
    "/api/admin/users",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
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

        res.json(
          allUsers.map((user) => ({
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
            disabled: user.disabled, 
            disabledAt: user.disabledAt, 
            disabledUntil: user.disabledUntil, 
            dailySpendLimit: user.dailySpendLimit,     
            dailyLimitLastUpdatedAt: user.dailyLimitLastUpdatedAt
          }))
        );
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
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

      res.json({
        maintenanceMode: settings?.maintenanceMode || false,
      });
    } catch (err) {
      console.error("Error fetching maintenance:", err);
      res.json({ maintenanceMode: false });
    }
  });

  app.post(
    "/api/admin/maintenance/on",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      const [updated] = await db
        .update(platformSettings)
        .set({ maintenanceMode: true, updatedAt: new Date() })
        .returning();

      res.json({ message: "Maintenance mode enabled", settings: updated });
    }
  );

  app.post(
    "/api/admin/maintenance/off",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      const [updated] = await db
        .update(platformSettings)
        .set({ maintenanceMode: false, updatedAt: new Date() })
        .returning();

      res.json({ message: "Maintenance mode disabled", settings: updated });
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

  const httpServer = createServer(app);
  return httpServer;
}
