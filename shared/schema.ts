import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  uuid,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (custom email/password auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // Make nullable to support migration
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  dateOfBirth: varchar("date_of_birth"), // Store as YYYY-MM-DD format
  profileImageUrl: varchar("profile_image_url"),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  emailVerified: boolean("email_verified").default(false),
  ringtonePoints: integer("ringtone_points").default(0),
  receiveNewsletter: boolean("receive_newsletter").default(false),
  isAdmin: boolean("is_admin").default(false),
  isActive: boolean("is_active").default(true),
  referralCode: varchar("referral_code").unique(),
  phoneNumber: varchar("phone_number"),
  referredBy: varchar("referred_by"),
  addressStreet: text("address_street"),
  addressCity: text("address_city"),
  addressPostcode: varchar("address_postcode"),
  addressCountry: varchar("address_country"),
  notes: text("notes"),
  isRestricted: boolean("is_restricted").default(false),
  restrictedAt: timestamp("restricted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Competition types
export const competitions = pgTable("competitions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  type: varchar("type", { enum: ["spin", "scratch", "instant"] }).notNull(),
  ticketPrice: decimal("ticket_price", { precision: 10, scale: 2 }).notNull(),
  maxTickets: integer("max_tickets"),
  soldTickets: integer("sold_tickets").default(0),
  prizeData: jsonb("prize_data"), // For storing wheel segments or scratch card prizes
  skillQuestion: text("skill_question"), // Optional skill question for compliance
  isActive: boolean("is_active").default(true),
  ringtonePoints: integer("ringtone_points").default(0),
  displayOrder: integer("display_order").default(999), // Lower numbers appear first
  endDate: timestamp("end_date"), // Optional countdown timer end date
  wheelType: varchar("wheel_type", { enum: ["wheel1", "wheel2"] }).default("wheel1"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User tickets/entries
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  competitionId: uuid("competition_id").notNull().references(() => competitions.id),
  orderId: uuid("order_id").references(() => orders.id),
  ticketNumber: varchar("ticket_number").notNull(),
  isWinner: boolean("is_winner").default(false),
  prizeAmount: decimal("prize_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders for tracking purchases
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  competitionId: uuid("competition_id").notNull().references(() => competitions.id),
  quantity: integer("quantity").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(),
  status: varchar("status", { enum: ["pending", "completed", "failed", "expired"] }).default("pending"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
   walletAmount: decimal("wallet_amount", { precision: 10, scale: 2 }).default("0.00"),
  pointsAmount: decimal("points_amount", { precision: 10, scale: 2 }).default("0.00"),
  cashflowsAmount: decimal("cashflows_amount", { precision: 10, scale: 2 }).default("0.00"),
  paymentBreakdown: text("payment_breakdown"),
  skillAnswer: text("skill_answer"), // User's answer to the skill question
  remainingPlays: integer("remaining_plays"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallet transactions
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type", { enum: ["deposit", "withdrawal", "purchase", "prize", "referral" , "referral_bonus"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  orderId: uuid("order_id").references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Withdrawal requests
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  accountName: text("account_name").notNull(),
  accountNumber: varchar("account_number").notNull(),
  sortCode: varchar("sort_code").notNull(),
  status: varchar("status", { enum: ["pending", "approved", "rejected", "processed"] }).default("pending"),
  adminNotes: text("admin_notes"),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Past winners for showcase
export const winners = pgTable("winners", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  competitionId: uuid("competition_id").references(() => competitions.id),
  prizeDescription: text("prize_description").notNull(),
  prizeValue: text("prize_value").notNull(),
  imageUrl: text("image_url"),
  isShowcase: boolean("is_showcase").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


export const spinUsage = pgTable("spin_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  usedAt: timestamp("used_at").defaultNow(),
});

// Track wins per segment for maxWins enforcement
export const spinWins = pgTable("spin_wins", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  segmentId: text("segment_id").notNull(), // References segment.id from config
  rewardType: varchar("reward_type", { enum: ["cash", "points", "lose"] }).notNull(),
  rewardValue: text("reward_value").notNull(), // Stringified value
  wonAt: timestamp("won_at").defaultNow(),
});

// Track scratch card wins per prize for maxWins enforcement
export const scratchCardWins = pgTable("scratch_card_wins", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  prizeId: text("prize_id").notNull(), // References prize.id from config
  rewardType: varchar("reward_type", { enum: ["cash", "points", "physical", "try_again"] }).notNull(),
  rewardValue: text("reward_value").notNull(), // Stringified value
  wonAt: timestamp("won_at").defaultNow(),
});

export const scratchCardUsage = pgTable("scratch_card_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  usedAt: timestamp("used_at").defaultNow(),
});

// Game spin wheel configuration - single active config
export const gameSpinConfig = pgTable("game_spin_config", {
  id: varchar("id").primaryKey().default("active"),
  segments: jsonb("segments").notNull(), // Array of 26 segment configurations
  maxSpinsPerUser: integer("max_spins_per_user"),
  mysteryPrize: jsonb("mystery_prize"), // Mystery prize configuration {rewardType, rewardValue, probability, maxWins, segmentId}
  isActive: boolean("is_active").default(true),
  isVisible: boolean("is_visible").default(true), // Controls whether wheel is visible on frontend
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const spinWheel2Configs = pgTable("spin_wheel_2_configs", {
  id: varchar("id").primaryKey().default("active"),
  segments: jsonb("segments").notNull(),             // Array of segment configurations
  maxSpinsPerUser: integer("max_spins_per_user"),    // Max spins per user
  mysteryPrize: jsonb("mystery_prize"),              // {rewardType, rewardValue, probability, maxWins, segmentId}
  isVisible: boolean("is_visible").default(true),    // Controls frontend visibility
  isActive: boolean("is_active").default(true),      // Whether wheel is active
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Game scratch card configuration - single active config
export const gameScratchConfig = pgTable("game_scratch_config", {
  id: varchar("id").primaryKey().default("active"),
  mode: varchar("mode", { enum: ["tight", "loose"] }).default("tight"),
  landmarkImages: jsonb("landmark_images").notNull(), // Array of landmark image keys
  cashPrizes: jsonb("cash_prizes").notNull(), // Array of cash prize amounts
  ringtunePrizes: jsonb("ringtune_prizes").notNull(), // Array of ringtune point amounts
  winProbability: decimal("win_probability", { precision: 3, scale: 2 }).default("0.20"), // 0.20 = 20%
  isActive: boolean("is_active").default(true),
  isVisible: boolean("is_visible").default(true), // Controls whether scratch card is visible on frontend
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scratch card image configurations - each landmark image with its prize
export const scratchCardImages = pgTable("scratch_card_images", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  imageName: varchar("image_name").notNull().unique(), // e.g., "Barrier Reef", "Big Ben"
  imageKey: varchar("image_key").notNull(), // e.g., "barrier_reef", "big_ben"
  rewardType: varchar("reward_type", { enum: ["cash", "points", "physical", "try_again"] }).notNull(),
  rewardValue: varchar("reward_value").notNull(), // Cash amount, points, or prize description
  weight: integer("weight").notNull().default(10), // For weighted random selection
  maxWins: integer("max_wins"), // null = unlimited
  quantityWon: integer("quantity_won").default(0),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Platform settings - single record for platform-wide configuration
export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default("active"),
  signupBonusEnabled: boolean("signup_bonus_enabled").default(false),
  signupBonusCash: decimal("signup_bonus_cash", { precision: 10, scale: 2 }).default("0.00"),
  signupBonusPoints: integer("signup_bonus_points").default(0),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0.00"),
  minimumTopUp: decimal("minimum_top_up", { precision: 10, scale: 2 }).default("10.00"),
  maintenanceMode: boolean("maintenance_mode").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Promotional campaigns for marketing
export const promotionalCampaigns = pgTable("promotional_campaigns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  offerType: varchar("offer_type", { enum: ["discount", "bonus", "announcement", "custom"] }).notNull(),
  discountCode: varchar("discount_code"),
  discountPercentage: integer("discount_percentage"),
  bonusAmount: decimal("bonus_amount", { precision: 10, scale: 2 }),
  bonusPoints: integer("bonus_points"),
  expiryDate: timestamp("expiry_date"),
  status: varchar("status", { enum: ["draft", "sent", "scheduled"] }).default("draft"),
  recipientCount: integer("recipient_count").default(0),
  sentAt: timestamp("sent_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Track individual email sends for campaigns
export const campaignEmails = pgTable("campaign_emails", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: uuid("campaign_id").notNull().references(() => promotionalCampaigns.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  email: varchar("email").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveryStatus: varchar("delivery_status", { enum: ["sent", "delivered", "failed", "bounced"] }).default("sent"),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  userName: text("user_name").notNull(),
  email: text("email").notNull(),
  action: text("action").notNull(),
  competitionId: uuid("competition_id").references(() => competitions.id),
  description: text("description"),
  startBalance: decimal("start_balance", { precision: 12, scale: 2 }),
  endBalance: decimal("end_balance", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Add indexes for common queries
  index("audit_logs_user_id_idx").on(table.userId),
  index("audit_logs_action_idx").on(table.action),
  index("audit_logs_created_at_idx").on(table.createdAt),
]);

// Insert schemas
export const insertCompetitionSchema = createInsertSchema(competitions);
export const insertTicketSchema = createInsertSchema(tickets);
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertGameSpinConfigSchema = createInsertSchema(gameSpinConfig);
export const insertSpinWheel2ConfigSchema = createInsertSchema(spinWheel2Configs);
export const insertGameScratchConfigSchema = createInsertSchema(gameScratchConfig);
export const insertScratchCardImageSchema = createInsertSchema(scratchCardImages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPlatformSettingsSchema = createInsertSchema(platformSettings);
export const insertSpinWinSchema = createInsertSchema(spinWins).omit({ id: true, wonAt: true });
export const insertScratchCardWinSchema = createInsertSchema(scratchCardWins).omit({ id: true, wonAt: true });
export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPromotionalCampaignSchema = createInsertSchema(promotionalCampaigns).omit({ id: true, createdAt: true, sentAt: true });
export const insertCampaignEmailSchema = createInsertSchema(campaignEmails).omit({ id: true, sentAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ 
  id: true, 
  createdAt: true 
});
// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Competition = typeof competitions.$inferSelect;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Winner = typeof winners.$inferSelect;
export type SpinUsage = typeof spinUsage.$inferInsert;
export type SpinWin = typeof spinWins.$inferSelect;
export type InsertSpinWin = z.infer<typeof insertSpinWinSchema>;
export type ScratchCardWin = typeof scratchCardWins.$inferSelect;
export type InsertScratchCardWin = z.infer<typeof insertScratchCardWinSchema>;
export type ScratchCardUsage = typeof scratchCardUsage.$inferInsert;
export type GameSpinConfig = typeof gameSpinConfig.$inferSelect;
export type InsertGameSpinConfig = z.infer<typeof insertGameSpinConfigSchema>;
export type SpinWheel2Config = typeof spinWheel2Configs.$inferSelect;
export type InsertSpinWheel2Config = z.infer<typeof insertSpinWheel2ConfigSchema>;
export type GameScratchConfig = typeof gameScratchConfig.$inferSelect;
export type InsertGameScratchConfig = z.infer<typeof insertGameScratchConfigSchema>;
export type ScratchCardImage = typeof scratchCardImages.$inferSelect;
export type InsertScratchCardImage = z.infer<typeof insertScratchCardImageSchema>;
export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type PromotionalCampaign = typeof promotionalCampaigns.$inferSelect;
export type InsertPromotionalCampaign = z.infer<typeof insertPromotionalCampaignSchema>;
export type CampaignEmail = typeof campaignEmails.$inferSelect;
export type InsertCampaignEmail = z.infer<typeof insertCampaignEmailSchema>;
// Type definitions
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Registration and login schemas
export const registerUserSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  email: true,
  password: true,
  phoneNumber:true,
  dateOfBirth: true,
  receiveNewsletter: true,
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;

// Admin credential change schemas
export const changeAdminUsernameSchema = z.object({
  newUsername: z.string().trim().min(1, "Username is required").max(100, "Username must be less than 100 characters"),
});

export const changeAdminPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type ChangeAdminUsername = z.infer<typeof changeAdminUsernameSchema>;
export type ChangeAdminPassword = z.infer<typeof changeAdminPasswordSchema>;

// Support tickets
export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: serial("ticket_number").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: varchar("status", { enum: ["open", "in_progress", "resolved", "closed"] }).default("open"),
  priority: varchar("priority", { enum: ["low", "medium", "high"] }).default("medium"),
  imageUrls: text("image_urls").array(),
  adminResponse: text("admin_response"),
  adminImageUrls: text("admin_image_urls").array(),
  userHasUnread: boolean("user_has_unread").default(false),
  adminHasUnread: boolean("admin_has_unread").default(true),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  ticketNumber: true,
  status: true,
  priority: true,
  adminResponse: true,
  adminImageUrls: true,
  userHasUnread: true,
  adminHasUnread: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

// Support ticket messages (chat thread)
export const supportMessages = pgTable("support_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: uuid("ticket_id").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull(),
  senderType: varchar("sender_type", { enum: ["user", "admin"] }).notNull(),
  message: text("message").notNull(),
  imageUrls: text("image_urls").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  createdAt: true,
});

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

