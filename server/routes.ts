import type { Express } from "express";
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
} from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import {stripe} from "./stripe";
import { cashflows } from "./cashflows";
import { and, asc, desc, eq, inArray, sql, like, gte, lte, or } from "drizzle-orm";
import { count } from "drizzle-orm/sql";
import { z } from "zod";
import { sendOrderConfirmationEmail, sendWelcomeEmail, sendPromotionalEmail, sendPasswordResetEmail } from "./email";
import { wsManager } from "./websocket";
import { upload } from "./cloudinary";

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
      return res
        .status(400)
        .json({
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
    } = req.body;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password || "");

    // Create date of birth string if provided
    const dobString =
      birthMonth && birthYear
        ? `${birthYear}-${String(birthMonth).padStart(2, "0")}-01`
        : undefined;

    // Create user
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      dateOfBirth: dobString,
      phoneNumber,
      receiveNewsletter: receiveNewsletter || false,
 
    });

    // Check if signup bonus is enabled and credit new user
    let bonusCashCredited = 0;
    let bonusPointsCredited = 0;
    
    try {
      const settings = await storage.getPlatformSettings();
      if (settings?.signupBonusEnabled) {
        const bonusCash = parseFloat(settings.signupBonusCash || "0");
        const bonusPoints = settings.signupBonusPoints || 0;

        // Credit wallet balance if bonus cash is set
        if (bonusCash > 0) {
          await storage.updateUserBalance(user.id, bonusCash);
          console.log(`Credited ${bonusCash} cash to user ${user.id}`);
          bonusCashCredited = bonusCash;
          
          // Record transaction for signup bonus cash
          await storage.createTransaction({
            userId: user.id,
            amount: bonusCash.toFixed(2),
            type: "deposit",
            status: "completed",
            description: "Signup bonus - Welcome cash",
            paymentMethod: "bonus",
          });
        }

        // Credit ringtone points if bonus points are set
        if (bonusPoints > 0) {
          await storage.updateUserRingtonePoints(user.id, bonusPoints);
          console.log(`Credited ${bonusPoints} points to user ${user.id}`);
          bonusPointsCredited = bonusPoints;
          
          // Record transaction for signup bonus points
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
      // Log error but don't fail registration if bonus credit fails
      console.error('Failed to credit signup bonus:', bonusError);
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, {
      userName: `${firstName} ${lastName}`.trim() || 'there',
      email: email
    }).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    res
      .status(201)
      .json({ 
        message: "User registered successfully", 
        userId: user.id,
        bonusCash: bonusCashCredited,
        bonusPoints: bonusPointsCredited,
        userName: `${firstName} ${lastName}`.trim() || firstName
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

    const { email, password } = result.data;

    // Get user by email
    const user = await storage.getUserByEmail(email);
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Store user ID in session
    (req as any).session.userId = user.id;

   res.json({
  message: "Login successful",
  user: { 
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    balance: user.balance,
    ringtonePoints: user.ringtonePoints,
    isAdmin: user.isAdmin || false
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
    const { orderId, quantity } = req.body;
    const userId = req.user.id;

    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ message: "Invalid or missing order ID" });
    }

    const order = await storage.getOrder(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const competition = await storage.getCompetition(order.competitionId);
    if (!competition) return res.status(404).json({ message: "Competition not found" });

    const totalAmount = parseFloat(competition.ticketPrice) * (quantity || 1);

    const session = await cashflows.createCompetitionPaymentSession(totalAmount, {
      orderId,
      competitionId: competition.id,
      userId,
      quantity: quantity.toString(),
    });

    if (!session.hostedPageUrl) {
      return res.status(500).json({ message: "Failed to get Cashflows checkout URL" });
    }

    res.json({
      success: true,
      redirectUrl: session.hostedPageUrl,
      sessionId: session.paymentJobReference,
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
    if (!successStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: `Payment not completed. Status: ${paymentStatus}` });
    }

    // Retrieve order
    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order not found or belongs to wrong user" });
    }

    // Get competition type
    const competition = await storage.getCompetition(order.competitionId);
    const competitionType = competition?.type || "competition";

    // Idempotency: avoid duplicates
    if (order.status === "completed") {
      return res.json({
        success: true,
        orderId,
        competitionId: order.competitionId,
        competitionType,
        alreadyProcessed: true
      });
    }

    const ticketCount = order.quantity;
    const competitionId = order.competitionId;

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

    return res.json({
      success: true,
      ticketsCreated,
      competitionId,
      orderId,
      competitionType
    });

  } catch (error) {
    console.error("❌ Error confirming competition payment:", error);
    return res.status(500).json({ message: "Failed to confirm competition payment" });
  }
}); 



// Add webhook handler for Cashflows notifications
app.post("/api/cashflows/webhook", async (req, res) => {
  try {
    const event = req.body;
    
    // Verify webhook signature if available
    // Cashflows may provide signature verification
    
    switch (event.type) {
      case "PAYMENT_COMPLETED":
        // Handle completed payment with idempotency guard
        const { orderId, userId, competitionId, quantity } = event.metadata;
        
        // Idempotency check: verify order exists and is not already completed
        const order = await storage.getOrder(orderId);
        if (!order) {
          console.log(`⚠️ Webhook: Order ${orderId} not found, skipping`);
          break;
        }
        
        if (order.status === "completed") {
          console.log(`⚠️ Webhook: Order ${orderId} already completed, skipping duplicate webhook`);
          break; // Already processed, ignore retry
        }
        
        // Mark order as completed
        await storage.updateOrderStatus(orderId, "completed");
        
        // Create tickets (one per item purchased)
        const ticketQuantity = parseInt(quantity) || 1;
        for (let i = 0; i < ticketQuantity; i++) {
          await storage.createTicket({
            userId,
            competitionId,
            orderId,
            ticketNumber: nanoid(8).toUpperCase(),
          });
        }

        // Send order confirmation email (non-blocking) - only sent once
        try {
          const user = await storage.getUser(userId);
          const competition = await storage.getCompetition(competitionId);
          
          if (user?.email && order && competition) {
            const orderType = competition.type === 'spin' ? 'spin' : 
                            competition.type === 'scratch' ? 'scratch' : 'competition';
            
            // Fetch ticket numbers for the email
            let ticketNumbers: string[] = [];
            try {
              const orderTickets = await storage.getTicketsByOrderId(order.id);
              ticketNumbers = orderTickets.map(t => t.ticketNumber);
            } catch (ticketError) {
              console.error('Failed to fetch tickets for email:', ticketError);
              // Continue without ticket numbers - graceful degradation
            }
            
            sendOrderConfirmationEmail(user.email, {
              orderId: order.id,
              userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
              orderType: orderType as 'competition' | 'spin' | 'scratch',
              itemName: competition.title,
              quantity: ticketQuantity,
              totalAmount: order.totalAmount,
              orderDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              paymentMethod: 'Card Payment (Cashflows)',
              skillQuestion: competition.skillQuestion || undefined,
              skillAnswer: order.skillAnswer || undefined,
              ticketNumbers: ticketNumbers.length > 0 ? ticketNumbers : undefined,
            }).catch(err => console.error('Failed to send order confirmation email:', err));
          }
        } catch (emailError) {
          console.error('Error sending confirmation email from webhook:', emailError);
        }
        
        console.log(`✅ Webhook: Successfully processed order ${orderId}`);
        break;
        
      case "PAYMENT_FAILED":
        // Handle failed payment
        await storage.updateOrderStatus(event.metadata.orderId, "failed");
        break;
        
      case "PAYMENT_CANCELLED":
        // Handle cancelled payment
        await storage.updateOrderStatus(event.metadata.orderId, "failed");
        break;
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

  // Ticket purchase route
app.post("/api/purchase-ticket", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { competitionId, quantity = 1 } = req.body;

    const competition = await storage.getCompetition(competitionId);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    const totalAmount = parseFloat(competition.ticketPrice) * quantity;
    const compType = competition.type;

    // ✅ Skip sold-out checks for SPIN and SCRATCH
    if (compType === "instant") {
      const soldTickets = Number(competition.soldTickets || 0);
      const maxTickets = Number(competition.maxTickets || 0);

      if (maxTickets > 0 && soldTickets >= maxTickets) {
        return res.status(400).json({ message: "Competition sold out" });
      }

      const remainingTickets = maxTickets - soldTickets;
      if (maxTickets > 0 && quantity > remainingTickets) {
        return res.status(400).json({
          message: `Only ${remainingTickets} ticket${
            remainingTickets > 1 ? "s" : ""
          } remaining`,
        });
      }
    } else {
      // 🌀 For spin or scratch, make sure soldTickets/maxTickets don’t cause errors
      competition.soldTickets = 0;
      competition.maxTickets = null;
    }

    // --- continue purchase logic below ---
    const user = await storage.getUser(userId);
    const userBalance = parseFloat(user?.balance || "0");

    const order = await storage.createOrder({
      userId,
      competitionId,
      quantity,
      totalAmount: totalAmount.toString(),
      paymentMethod: userBalance >= totalAmount ? "wallet" : "cashflows",
      status: "pending",
    });

    if (userBalance >= totalAmount) {
      const newBalance = (userBalance - totalAmount).toString();

      await storage.updateUserBalance(userId, newBalance);
      await storage.createTransaction({
        userId,
        type: "purchase",
        amount: `-${totalAmount}`,
        description: `Ticket purchase for ${competition.title}`,
        orderId: order.id,
      });

      const tickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticketNumber = nanoid(8).toUpperCase();
        const ticket = await storage.createTicket({
          userId,
          competitionId,
          orderId: order.id,
          ticketNumber,
          isWinner: false,
        });
        tickets.push(ticket);
      }

      if (compType === "instant") {
        await storage.updateCompetitionSoldTickets(competitionId, quantity);
      }

      await storage.updateOrderStatus(order.id, "completed");

      // Send order confirmation email (non-blocking)
      if (user?.email) {
        // Use already-created tickets array to avoid extra database query
        const ticketNumbers = tickets.map(t => t.ticketNumber);
        
        sendOrderConfirmationEmail(user.email, {
          orderId: order.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
          orderType: 'competition',
          itemName: competition.title,
          quantity,
          totalAmount: totalAmount.toFixed(2),
          orderDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          paymentMethod: 'Wallet Balance',
          skillQuestion: competition.skillQuestion || undefined,
          skillAnswer: order.skillAnswer || undefined,
          ticketNumbers: ticketNumbers.length > 0 ? ticketNumbers : undefined,
        }).catch(err => console.error('Failed to send order confirmation email:', err));
      }

      return res.json({
        success: true,
        message: "Tickets purchased via wallet",
        orderId: order.id,
        tickets,
        paymentMethod: "wallet",
      });
    }

    return res.json({
      success: true,
      message: "Proceed to Cashflows payment",
      orderId: order.id,
      paymentMethod: "cashflows",
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

      // Update order with partial payment info
      await storage.updateOrderPaymentInfo(orderId, {
        paymentMethod: "mixed",
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

      await storage.updateOrderPaymentInfo(orderId, {
        paymentMethod: "wallet_points_only",
        walletAmount: walletUsed.toString(),
        pointsAmount: pointsUsed.toString(),
        cashflowsAmount: "0",
        paymentBreakdown: JSON.stringify(paymentBreakdown)
      });

      // Send order confirmation email (non-blocking)
      if (user?.email) {
        const paymentMethodText = walletUsed > 0 && pointsUsed > 0 
          ? 'Wallet + Ringtone Points' 
          : walletUsed > 0 ? 'Wallet Balance' : 'Ringtone Points';
        
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
        paymentMethod: "wallet_points_only",
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
app.post("/api/play-spin-wheel", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
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

    // Fetch active wheel configuration
    const [config] = await db.select().from(gameSpinConfig).where(eq(gameSpinConfig.id, "active"));
    const wheelConfig = config || DEFAULT_SPIN_WHEEL_CONFIG;
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

    // Record the win
    await storage.recordSpinWin({
      userId,
      segmentId: selectedSegment.id,
      rewardType: selectedSegment.rewardType,
      rewardValue: String(selectedSegment.rewardValue),
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
        description: `Spin Wheel Prize - £${amount}`,
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
        description: `Spin Wheel Prize - ${points} Ringtones`,
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
    const { orderId, count } = req.body;

    if (!orderId || !count || count <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid orderId and count are required",
      });
    }

    // Process all remaining spins (no cap)
    const batchSize = count;

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

    // Actual spins to process
    const spinsToProcess = Math.min(batchSize, spinsRemaining);

    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔒 CRITICAL: Use database transaction for atomic operations
    const results = [];
    let totalCash = 0;
    let totalPoints = 0;

    await db.transaction(async (tx) => {
      // Fetch active wheel configuration once
      const [config] = await tx.select().from(gameSpinConfig).where(eq(gameSpinConfig.id, "active"));
      const wheelConfig = config || DEFAULT_SPIN_WHEEL_CONFIG;
      const segments = wheelConfig.segments as any[];

      for (let i = 0; i < spinsToProcess; i++) {
        // Filter eligible segments for this spin
        const eligibleSegments = [];
        for (const segment of segments) {
          if (!segment.probability || segment.probability <= 0) {
            continue;
          }
          
          if (segment.maxWins !== null) {
            const [winData] = await tx
              .select({ count: sql<number>`count(*)` })
              .from(spinWins)
              .where(eq(spinWins.segmentId, segment.id));
            const winCount = winData?.count || 0;
            
            if (winCount >= segment.maxWins) {
              continue;
            }
          }
          
          eligibleSegments.push(segment);
        }

        if (eligibleSegments.length === 0) {
          break; // No more prizes available
        }

        // Weighted random selection
        const totalWeight = eligibleSegments.reduce((sum, seg) => sum + seg.probability, 0);
        let random = Math.random() * totalWeight;
        let selectedSegment = eligibleSegments[0];

        for (const segment of eligibleSegments) {
          random -= segment.probability;
          if (random <= 0) {
            selectedSegment = segment;
            break;
          }
        }

        // Record spin usage using tx
        await tx.insert(spinUsage).values({
          orderId,
          userId,
          usedAt: new Date(),
        });

        // Record the win using tx
        await tx.insert(spinWins).values({
          userId,
          segmentId: selectedSegment.id,
          rewardType: selectedSegment.rewardType as any,
          rewardValue: String(selectedSegment.rewardValue),
        });

        // Award prize and track totals
        let prizeAmount: number | string = 0;
        let prizeType = "none";

        if (selectedSegment.rewardType === "cash" && selectedSegment.rewardValue) {
          const amount = typeof selectedSegment.rewardValue === 'number' 
            ? selectedSegment.rewardValue 
            : parseFloat(String(selectedSegment.rewardValue));
          
          // 🔒 CRITICAL: Update balance using tx (not global db)
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
            competitionId: null,
            prizeDescription: selectedSegment.label,
            prizeValue: `£${amount}`,
            imageUrl: null,
            isShowcase: false,
            createdAt: new Date(),
          });

          prizeAmount = amount;
          prizeType = "cash";
        } else if (selectedSegment.rewardType === "points" && selectedSegment.rewardValue) {
          const points = typeof selectedSegment.rewardValue === 'number'
            ? Math.floor(selectedSegment.rewardValue)
            : parseInt(String(selectedSegment.rewardValue));
          
          // 🔒 CRITICAL: Update points using tx (not global db)
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

      await storage.updateOrderPaymentInfo(orderId, {
        paymentMethod: "mixed",
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
      
      await storage.updateOrderPaymentInfo(orderId, {
        paymentMethod: "wallet_points_only",
        walletAmount: walletUsed.toString(),
        pointsAmount: pointsUsed.toString(),
        cashflowsAmount: "0",
        paymentBreakdown: JSON.stringify(paymentBreakdown),
      });

      // Send order confirmation email (non-blocking)
      if (user?.email) {
        const paymentMethodText = walletUsed > 0 && pointsUsed > 0 
          ? 'Wallet + Ringtone Points' 
          : walletUsed > 0 ? 'Wallet Balance' : 'Ringtone Points';
        
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
        paymentMethod: "wallet_points_only",
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

      // Filter only active prizes with valid weights (global, unlimited wins)
       const eligiblePrizes = allPrizes.filter(prize => {
  return prize.weight && prize.weight > 0;
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
      
      if (isWinner && selectedPrize.imageName) {
        // ✅ WINNER: Show EXACTLY 3 matching images, 3 different non-matching images
        const winningImage = selectedPrize.imageName;
        const winPositions = winningPatterns[Math.floor(Math.random() * winningPatterns.length)];
        
        // Get all other images (excluding winning image)
        const otherPrizes = await db
          .select()
          .from(scratchCardImages)
          .where(eq(scratchCardImages.isActive, true));
        
        const otherImages = otherPrizes
          .filter(p => p.imageName !== winningImage && p.imageName)
          .map(p => p.imageName as string);
        
        if (otherImages.length < 3) {
          throw new Error("Not enough different images configured - need at least 4 total images");
        }
        
        // Build 2x3 grid (6 tiles)
        tileLayout = Array(6).fill('');
        
        // Place EXACTLY 3 winning images in winning positions
        winPositions.forEach(pos => {
          tileLayout[pos] = winningImage;
        });
        
        // 🛡️ CRITICAL: Fill remaining 3 positions with 3 DIFFERENT images (no duplicates)
        // This ensures we never accidentally create a 4th or 5th matching image
        const shuffledOthers = [...otherImages].sort(() => Math.random() - 0.5);
        const nonWinningPositions = [0, 1, 2, 3, 4, 5].filter(pos => !winPositions.includes(pos));
        
        // Pick 3 different images for the 3 non-winning positions
        nonWinningPositions.forEach((pos, index) => {
          tileLayout[pos] = shuffledOthers[index % shuffledOthers.length];
        });
        
        // 🔒 Final safety check: Ensure only ONE set of 3 matching exists
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
        // 🔴 LOSER: Create layout ensuring NO 3 matching images
        const allPrizes = await db
          .select()
          .from(scratchCardImages)
          .where(eq(scratchCardImages.isActive, true));
        
        const allImages = allPrizes
          .filter(p => p.imageName)
          .map(p => p.imageName as string);
        
        if (allImages.length < 3) {
          throw new Error("Not enough images configured - need at least 3 different images");
        }
        
        // 🎯 Strategy: Create pairs (2 of each image) to ensure max 2 same, never 3
        // This guarantees the game cannot be won
        tileLayout = [];
        
        // Pick 3 different images randomly
        const shuffled = [...allImages].sort(() => Math.random() - 0.5);
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
        tileLayout, // 9-element array of image names
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
    const referrals = await storage.getUserReferrals(userId);
    const referralTransactions = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, "referral")
      ));
    
    const totalEarned = referralTransactions.reduce((sum, tx) => 
      sum + parseFloat(tx.amount || "0"), 0
    );
    
    res.json({
      totalReferrals: referrals.length,
      totalEarned: totalEarned.toFixed(2),
      referrals: referrals.map(r => ({
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

app.post("/api/wallet/topup", isAuthenticated, async (req: any, res) => {
  try {
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

app.post("/api/wallet/topup-checkout", isAuthenticated, async (req: any, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id; // Get from authenticated session
    
    if (!amount) return res.status(400).json({ message: "Missing amount" });

    console.log("➡️ Creating Cashflows payment session for amount:", amount, "userId:", userId);

    const session = await cashflows.createPaymentSession(amount, userId);

    if (!session.hostedPageUrl) {
      console.error("❌ No hosted page URL found in response");
      return res.status(500).json({
        message: "Payment session created but no redirect URL found",
        fullResponse: session.fullResponse,
      });
    }

    res.json({
      success: true,
      redirectUrl: session.hostedPageUrl,
      sessionId: session.paymentJobReference,
      message: "Payment session created successfully",
    });
  } catch (error: any) {
    console.error("❌ Error creating payment session:", error.message);
    res.status(500).json({
      message: "Failed to create payment session",
      error: error.response?.data || error.message,
    });
  }
});

 app.post("/api/wallet/confirm-topup", isAuthenticated, async (req: any, res) => {
  try {
    const { paymentJobRef , paymentRef } = req.body;
    if (!paymentJobRef || !paymentRef) return res.status(400).json({ message: "Missing paymentJobRef or paymentRef" });

    console.log("🔍 Confirming Cashflows top-up:", { paymentJobRef, paymentRef });

    const payment = await cashflows.getPaymentStatus(paymentJobRef, paymentRef);
    const status =
      payment?.status || payment?.checkout?.status || payment?.data?.status;
    
    console.log(`📊 Payment status: ${status}`, payment.metadata);
    
   const successStatuses = ["SUCCESS", "COMPLETED", "PAID", "Paid"];
    if (successStatuses.includes(status)) {
      // Extract user ID (metadata may be nested)
      const userId =
        payment?.metadata?.userId ||
        payment?.data?.metadata?.userId ||
        req.user.id;

      // Extract payment amount from multiple potential locations
      const amount =
        parseFloat(payment?.amount) ||
        parseFloat(payment?.amountToCollect) ||
        parseFloat(payment?.data?.amountToCollect) ||
        0;


      if (!userId) {
        console.error("❌ No userId found in payment metadata or session");
        return res.status(400).json({ message: "Invalid payment metadata" });
      }

      // ✅ IDEMPOTENCY CHECK: Check if transaction already exists for this session
      const existingTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.type, "deposit"),
            eq(transactions.amount, amount.toString()),
            like(transactions.description, `%${paymentRef}%`)
          )
        )
        .limit(1);

      if (existingTransactions.length > 0) {
                console.log("✓ Already processed");
        return res.json({ success: true, alreadyProcessed: true });

      }

      const user = await storage.getUser(userId);
      const newBalance = (
        parseFloat(user?.balance || "0") + amount
      ).toString();
      await storage.updateUserBalance(userId, newBalance);

      await storage.createTransaction({
        userId,
        type: "deposit",
        amount: amount.toString(),
        description: `Cashflows top-up £${amount} (Ref ${paymentRef})`,
      });

      console.log(`✓ Successfully processed wallet top-up for user ${userId}: £${amount}`);

      return res.json({ success: true, newBalance, amount });
    }

    res.status(400).json({ message: `Payment not completed. Status: ${status}` });
  } catch (error) {
    console.error("❌ Error confirming Cashflows top-up:", error);
    res.status(500).json({ message: "Failed to confirm top-up" });
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

    // Just update the status - admin will manually process the payment
    const updated = await storage.updateWithdrawalRequestStatus(
      id,
      status,
      adminNotes,
      processedBy
    );

    res.json({ message: `Withdrawal request ${status} successfully`, request: updated });
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
  try{
    const winners = await storage.getRecentWinners(50, true); // Only showcase winners for public
    console.log("🧩 Winners from storage:", winners);
    res.json(winners);
  } catch (error) {
    console.error("Error fetching winners:", error);
    res.status(500).json({ message: "Failed to fetch winners" });
  }
});

// ====== WINNERS ADMIN ENDPOINTS ======
app.get("/api/admin/winners", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const winners = await storage.getRecentWinners(100);
    res.json(winners);
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
    const { userId, competitionId, prizeDescription, prizeValue, imageUrl } = req.body;

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
    const revenueResult = await db.select({ total: sql<number>`coalesce(sum(${orders.totalAmount}), 0)` })
      .from(orders)
      .where(eq(orders.status, "completed"));
    
    // Get recent orders
    const recentOrders = await db
      .select()
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(competitions, eq(orders.competitionId, competitions.id))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    res.json({
      stats: {
        totalUsers: totalUsers[0]?.count || 0,
        totalCompetitions: totalCompetitions[0]?.count || 0,
        totalRevenue: revenueResult[0]?.total || 0,
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
    const competitionData = req.body;
    
    const competition = await storage.createCompetition({
      ...competitionData,
      isActive: true,
    });
    
    // Broadcast real-time update
    wsManager.broadcast({ type: 'competition_created' });
    
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

    // ✅ 1. Delete all transactions related to orders for this competition
    await db
      .delete(transactions)
      .where(inArray(transactions.orderId, db.select({ id: orders.id }).from(orders).where(eq(orders.competitionId, id))));

    // ✅ 2. Delete all tickets related to this competition
    await db.delete(tickets).where(eq(tickets.competitionId, id));

    // ✅ 3. Delete all orders related to this competition
    await db.delete(orders).where(eq(orders.competitionId, id));

    // ✅ 4. Finally, delete the competition itself
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
// GET endpoint is accessible to all authenticated users (they need to see the wheel to play)
app.get("/api/admin/game-spin-config", isAuthenticated, async (req: any, res) => {
  try {
    const { gameSpinConfig } = await import("@shared/schema");
    const [config] = await db.select().from(gameSpinConfig).where(eq(gameSpinConfig.id, "active"));
    
    if (!config) {
      // Return default configuration if none exists in database
      return res.json(DEFAULT_SPIN_WHEEL_CONFIG);
    }
    
    res.json(config);
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

//  Delete user
app.delete("/api/admin/users/:id", isAuthenticated , isAdmin , async (req: any , res) =>{
  try {
      const { id } = req.params;
      const userId = req.user.id;
      if(id === userId){
        return res.status(400).json({ message : "admin cannot delete own account"})
      }

      const user = await storage.getUser(id);
      if(!user){
        return res.status(404).json({ message : "user not found"})
      }

      const userOrders = await db.select().from(orders).where(eq(orders.userId , id)).limit(1);
      const userTickets =  await db.select().from(tickets).where(eq(tickets.userId , id)).limit(1);
      
      if(userOrders.length > 0 || userTickets.length > 0){
        return res.status(400).json({ message : "cannot delete user with existing orders or tickets"})
      }

      await db.delete(transactions).where(eq(transactions.userId, id));

      await db.delete(users).where(eq(users.id , id))
      res.status(200).json({ message : "user deleted successfully"})
  } catch (error) {
      console.error("Error deleting user:" , error);
      res.status(500).json({ message : "failed to delete user"})
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
      phoneNumber:user.phoneNumber,
      ringtonePoints: user.ringtonePoints,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      addressStreet: user.addressStreet,
      addressCity: user.addressCity,
      addressPostcode: user.addressPostcode,
      addressCountry: user.addressCountry,
    })));
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
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
    
    // First, delete associated tickets
    await db.delete(tickets).where(eq(tickets.orderId, id));
    
    // Then delete the order
    const [deleted] = await db
      .delete(orders)
      .where(eq(orders.id, id))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({ message: "Order not found" });
    }
    
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

const httpServer = createServer(app);
return httpServer;
}