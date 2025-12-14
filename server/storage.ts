import {
  users,
  competitions,
  tickets,
  orders,
  transactions,
  winners,
  spinUsage,
  spinWins,
  scratchCardWins,
  scratchCardUsage,
  platformSettings,
  scratchCardImages,
  withdrawalRequests,
  promotionalCampaigns,
  campaignEmails,
  supportTickets,
  supportMessages,
  type User,
  type UpsertUser,
  type Competition,
  type InsertCompetition,
  type Ticket,
  type InsertTicket,
  type Order,
  type InsertOrder,
  type Transaction,
  type InsertTransaction,
  type Winner,
  type SpinUsage,
  type SpinWin,
  type InsertSpinWin,
  type ScratchCardWin,
  type InsertScratchCardWin,
  type PlatformSettings,
  type InsertPlatformSettings,
  type ScratchCardImage,
  type InsertScratchCardImage,
  type WithdrawalRequest,
  type InsertWithdrawalRequest,
  type PromotionalCampaign,
  type InsertPromotionalCampaign,
  type CampaignEmail,
  type InsertCampaignEmail,
  type SupportTicket,
  type InsertSupportTicket,
  type SupportMessage,
  type InsertSupportMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sum, sql, notInArray } from "drizzle-orm";
import { hashPassword } from "./customAuth";

export interface IStorage {
  // User operations (custom email/password auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserBalance(userId: string, amount: string): Promise<User>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User>;
  updateUser(userId: string, data: Partial<UpsertUser>): Promise<User>;

  // Competition operations
  getCompetitions(): Promise<Competition[]>;
  getCompetition(id: string): Promise<Competition | undefined>;
  createCompetition(competition: InsertCompetition): Promise<Competition>;
  updateCompetitionSoldTickets(id: string, increment: number): Promise<void>;
  
  // Ticket operations
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getUserTickets(userId: string): Promise<Ticket[]>;
  getCompetitionTickets(competitionId: string): Promise<Ticket[]>;
  getTicketsByOrderId(orderId: string): Promise<Ticket[]>;
  deleteTicket(ticketId: string): Promise<void>;

  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getUserOrders(userId: string): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
   // NEW: Update order payment information
  updateOrderPaymentInfo(
    id: string, 
    paymentInfo: {
      paymentMethod: string;
      walletAmount?: string;
      pointsAmount?: string;
      cashflowsAmount?: string;
      paymentBreakdown?: string;
    }
  ): Promise<Order>;


  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
  
  // Winner operations
  getRecentWinners(limit: number, showcaseOnly?: boolean): Promise<Winner[]>;
  getWinner(id: string): Promise<Winner | undefined>;
  createWinner(winner: Omit<Winner, 'id' | 'createdAt'>): Promise<Winner>;
  updateWinner(id: string, data: Partial<Omit<Winner, 'id' | 'createdAt'>>): Promise<Winner>;
  deleteWinner(id: string): Promise<void>;

   recordSpinUsage(orderId: string, userId: string): Promise<void>;
   getSpinsUsed(orderId: string): Promise<number>;
   
   // Spin wins tracking (for maxWins enforcement)
   getSegmentWinCount(segmentId: string): Promise<number>;
   recordSpinWin(data: InsertSpinWin): Promise<SpinWin>;

    recordScratchCardUsage(orderId: string, userId: string): Promise<void>;
  getScratchCardsUsed(orderId: string): Promise<number>;

   // Scratch card wins tracking (for maxWins enforcement)
   getScratchCardPrizeWinCount(prizeId: string): Promise<number>;
   recordScratchCardWin(data: InsertScratchCardWin): Promise<ScratchCardWin>;

  // Referral operations
  getUserReferralCode(userId: string): Promise<string>;
  getUserReferrals(userId: string): Promise<User[]>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
saveUserReferral(data: { userId: string; referrerId: string }): Promise<void>;

  // Platform settings operations
  getPlatformSettings(): Promise<PlatformSettings | undefined>;
  updatePlatformSettings(settings: Partial<InsertPlatformSettings>): Promise<PlatformSettings>;

  // Scratch card image operations
  getScratchCardImages(): Promise<ScratchCardImage[]>;
  getScratchCardImage(id: string): Promise<ScratchCardImage | undefined>;
  createScratchCardImage(image: InsertScratchCardImage): Promise<ScratchCardImage>;
  updateScratchCardImage(id: string, data: Partial<InsertScratchCardImage>): Promise<ScratchCardImage>;
  deleteScratchCardImage(id: string): Promise<void>;
  incrementScratchCardImageWins(id: string): Promise<void>;

  // Withdrawal request operations
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  getWithdrawalRequests(): Promise<WithdrawalRequest[]>;
  getUserWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]>;
  getWithdrawalRequest(id: string): Promise<WithdrawalRequest | undefined>;
  updateWithdrawalRequestStatus(
    id: string,
    status: string,
    adminNotes?: string,
    processedBy?: string
  ): Promise<WithdrawalRequest>;

  // Marketing operations
  getNewsletterSubscribers(): Promise<User[]>;
  getPromotionalCampaigns(): Promise<PromotionalCampaign[]>;
  getPromotionalCampaignById(id: string): Promise<PromotionalCampaign | undefined>;
  createPromotionalCampaign(campaign: InsertPromotionalCampaign): Promise<PromotionalCampaign>;
  updatePromotionalCampaign(id: string, data: Partial<PromotionalCampaign>): Promise<PromotionalCampaign>;
  deletePromotionalCampaign(id: string): Promise<void>;
  createCampaignEmail(email: InsertCampaignEmail): Promise<CampaignEmail>;

   // Support ticket operations
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTickets(): Promise<SupportTicket[]>;
  getUserSupportTickets(userId: string): Promise<SupportTicket[]>;
  getSupportTicket(id: string): Promise<SupportTicket | undefined>;
  updateSupportTicket(id: string, data: Partial<SupportTicket>): Promise<SupportTicket>;
  deleteSupportTicket(id: string): Promise<void>;
  getUserUnreadTicketCount(userId: string): Promise<number>;
  getAdminUnreadTicketCount(): Promise<number>;
  markTicketsAsReadByUser(userId: string): Promise<void>;
  markTicketAsReadByAdmin(ticketId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {


  // In storage.ts - add to DatabaseStorage class
async initializeAdminUser(): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    
    const existingAdmin = await this.getUserByEmail(adminEmail);
    
    if (!existingAdmin) {
      const hashedPassword = await hashPassword(adminPassword);
      
      await this.createUser({
        email: adminEmail,
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        emailVerified: true,
      });
      
      console.log("✅ Admin user created successfully");
    } else {
      // Ensure existing admin has admin privileges
      if (!existingAdmin.isAdmin) {
        await this.updateUser(existingAdmin.id, { isAdmin: true });
        console.log("✅ Existing user promoted to admin");
      }
    }
  } catch (error) {
    console.error("❌ Error initializing admin user:", error);
  }
}
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(userId: string, data: Partial<UpsertUser>): Promise<User> {
  const [user] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  return user;
}


  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

async updateUserBalance(userId: string, amount: string): Promise<User> {
  const [user] = await db
    .update(users)
    .set({ balance: amount, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return user;
}


  async updateStripeCustomerId(userId: string, customerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Competition operations
  async getCompetitions(): Promise<Competition[]> {
    return await db.select().from(competitions).where(eq(competitions.isActive, true)).orderBy(desc(competitions.createdAt));
  }

  async getCompetition(id: string): Promise<Competition | undefined> {
    const [competition] = await db.select().from(competitions).where(eq(competitions.id, id));
    return competition;
  }

  async createCompetition(competition: InsertCompetition): Promise<Competition> {
    const [created] = await db.insert(competitions).values(competition).returning();
    return created;
  }

  async updateCompetitionSoldTickets(id: string, increment: number): Promise<void> {
    await db
      .update(competitions)
      .set({ 
        soldTickets: sql`${competitions.soldTickets} + ${increment}`,
        updatedAt: new Date()
      })
      .where(eq(competitions.id, id));
  }

  // Ticket operations
  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [created] = await db.insert(tickets).values(ticket).returning();
    return created;
  }

  async getUserTickets(userId: string): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.userId, userId)).orderBy(desc(tickets.createdAt));
  }

  async getCompetitionTickets(competitionId: string): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.competitionId, competitionId));
  }

  async getTicketsByOrderId(orderId: string): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.orderId, orderId)).orderBy(desc(tickets.createdAt));
  }

  async deleteTicket(ticketId: string): Promise<void> {
  await db.delete(tickets).where(eq(tickets.id, ticketId));
}

// In storage.ts
async updateUserRingtonePoints(userId: string, points: number): Promise<void> {
  await db.update(users)
     .set({ ringtonePoints: points })
    .where(eq(users.id, userId))
    .execute();
}
async getUserRingtonePoints(userId: string): Promise<number> {
  const user = await db.select({ ringtonePoints: users.ringtonePoints })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .execute();
  
  return user[0]?.ringtonePoints || 0;
}

  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getUserOrders(userId: string): Promise<any[]> {
    const ordersList = await db
      .select()
      .from(orders)
      .leftJoin(competitions, eq(orders.competitionId, competitions.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    // Fetch tickets and calculate remaining plays for each order
    const ordersWithTickets = await Promise.all(
      ordersList.map(async (order) => {
        const orderTickets = await db
          .select()
          .from(tickets)
          .where(and(
            eq(tickets.userId, userId),
            eq(tickets.orderId, order.orders.id)
          ))
          .orderBy(tickets.createdAt);

        // Calculate remaining plays for spin and scratch orders
        let remainingPlays = 0;
        const competitionType = order.competitions?.type;
        
        if (competitionType === 'spin' && order.orders.status === 'completed') {
          const used = await this.getSpinsUsed(order.orders.id);
          remainingPlays = order.orders.quantity - used;
        } else if (competitionType === 'scratch' && order.orders.status === 'completed') {
          const used = await this.getScratchCardsUsed(order.orders.id);
          remainingPlays = order.orders.quantity - used;
        }

        return {
          ...order,
          tickets: orderTickets,
          remainingPlays,
        };
      })
    );

    return ordersWithTickets;
  }

  async updateOrderStatus(id: string, status: "pending" | "completed" | "failed" | "expired"): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

   // NEW: Update order payment information
  async updateOrderPaymentInfo(
    id: string, 
    paymentInfo: {
      paymentMethod: string;
      walletAmount?: string;
      pointsAmount?: string;
      cashflowsAmount?: string;
      paymentBreakdown?: string;
    }
  ): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ 
        paymentMethod: paymentInfo.paymentMethod,
        walletAmount: paymentInfo.walletAmount || "0.00",
        pointsAmount: paymentInfo.pointsAmount || "0.00", 
        cashflowsAmount: paymentInfo.cashflowsAmount || "0.00",
        paymentBreakdown: paymentInfo.paymentBreakdown,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }

 async getUserTransactions(userId: string): Promise<Transaction[]> {
  return await db
    .select({
      ...transactions, 
      description: sql`
        COALESCE(
          ${competitions.title},
          ${transactions.description}
        )
      `,
    })
    .from(transactions)
    .leftJoin(orders, eq(transactions.orderId, orders.id))
    .leftJoin(competitions, eq(orders.competitionId, competitions.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt));
}


  // Winner operations
  async getRecentWinners(limit: number, showcaseOnly: boolean = false): Promise<any[]> {
  const query = db
    .select()
    .from(winners)
    .leftJoin(users, eq(winners.userId, users.id))
    .leftJoin(competitions, eq(winners.competitionId, competitions.id))
    .orderBy(desc(winners.createdAt))
    .limit(limit);
  
  if (showcaseOnly) {
    return await query.where(eq(winners.isShowcase, true));
  }
  
  return await query;
}

async getWinner(id: string): Promise<Winner | undefined> {
  const [winner] = await db
    .select()
    .from(winners)
    .where(eq(winners.id, id))
    .limit(1);
  return winner;
}

async createWinner(winner: Omit<Winner, "id" | "createdAt">): Promise<Winner> {
  const [created] = await db.insert(winners).values({
    ...winner,
    createdAt: new Date(),
  }).returning();
  return created;
}

async updateWinner(id: string, data: Partial<Omit<Winner, 'id' | 'createdAt'>>): Promise<Winner> {
  const [updated] = await db
    .update(winners)
    .set(data)
    .where(eq(winners.id, id))
    .returning();
  return updated;
}

async deleteWinner(id: string): Promise<void> {
  await db
    .delete(winners)
    .where(eq(winners.id, id));
}

async recordSpinUsage(orderId: string, userId: string): Promise<void> {
    await db.insert(spinUsage).values({
      orderId,
      userId,
      usedAt: new Date()
    });
  }

  async getSpinsUsed(orderId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(spinUsage)
      .where(eq(spinUsage.orderId, orderId));
    
    return result[0]?.count || 0;
  }

  async getSegmentWinCount(segmentId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(spinWins)
      .where(eq(spinWins.segmentId, segmentId));
    
    return result[0]?.count || 0;
  }

  async recordSpinWin(data: InsertSpinWin): Promise<SpinWin> {
    const [created] = await db.insert(spinWins).values(data).returning();
    return created;
  }

  async getScratchCardPrizeWinCount(prizeId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(scratchCardWins)
      .where(eq(scratchCardWins.prizeId, prizeId));
    
    return result[0]?.count || 0;
  }

  async recordScratchCardWin(data: InsertScratchCardWin): Promise<ScratchCardWin> {
    const [created] = await db.insert(scratchCardWins).values(data).returning();
    return created;
  }


   async recordScratchCardUsage(orderId: string, userId: string): Promise<void> {
    await db.insert(scratchCardUsage).values({
      orderId,
      userId,
      usedAt: new Date()
    });
  }

  async getScratchCardsUsed(orderId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(scratchCardUsage)
      .where(eq(scratchCardUsage.orderId, orderId));
    
    return result[0]?.count || 0;
  }

  // Referral operations
  async getUserReferralCode(userId: string): Promise<string> {
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Generate referral code if user doesn't have one
    if (!user.referralCode) {
      const code = this.generateReferralCode();
      await this.updateUser(userId, { referralCode: code });
      return code;
    }
    
    return user.referralCode;
  }


  async saveUserReferral(data: { userId: string; referrerId: string }): Promise<void> {
  await db
    .update(users)
    .set({
      referredBy: data.referrerId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, data.userId));
}

  async getUserReferrals(userId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.referredBy, userId))
      .orderBy(desc(users.createdAt));
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, code));
    return user;
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Platform settings operations
  async getPlatformSettings(): Promise<PlatformSettings | undefined> {
    const [settings] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, 'active'));
    
    // Create default settings if none exist
    if (!settings) {
      const [newSettings] = await db
        .insert(platformSettings)
        .values({
          id: 'active',
          commissionRate: '0.00',
          minimumTopUp: '10.00',
        })
        .returning();
      return newSettings;
    }
    
    return settings;
  }

  async updatePlatformSettings(settings: Partial<InsertPlatformSettings>): Promise<PlatformSettings> {
    // First ensure settings record exists
    await this.getPlatformSettings();
    
    // Update the settings
    const [updated] = await db
      .update(platformSettings)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.id, 'active'))
      .returning();
    
    return updated;
  }

  // Scratch card image operations
  async getScratchCardImages(): Promise<ScratchCardImage[]> {
    return await db
      .select()
      .from(scratchCardImages)
      .orderBy(scratchCardImages.displayOrder, scratchCardImages.imageName);
  }

  async getScratchCardImage(id: string): Promise<ScratchCardImage | undefined> {
    const [image] = await db
      .select()
      .from(scratchCardImages)
      .where(eq(scratchCardImages.id, id));
    return image;
  }

  async createScratchCardImage(image: InsertScratchCardImage): Promise<ScratchCardImage> {
    const [created] = await db
      .insert(scratchCardImages)
      .values(image)
      .returning();
    return created;
  }

  async updateScratchCardImage(id: string, data: Partial<InsertScratchCardImage>): Promise<ScratchCardImage> {
    const [updated] = await db
      .update(scratchCardImages)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(scratchCardImages.id, id))
      .returning();
    return updated;
  }

  async deleteScratchCardImage(id: string): Promise<void> {
    await db
      .delete(scratchCardImages)
      .where(eq(scratchCardImages.id, id));
  }

  async incrementScratchCardImageWins(id: string): Promise<void> {
    await db
      .update(scratchCardImages)
      .set({
        quantityWon: sql`${scratchCardImages.quantityWon} + 1`,
      })
      .where(eq(scratchCardImages.id, id));
  }

  // Withdrawal request operations
  async createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const [created] = await db
      .insert(withdrawalRequests)
      .values(request)
      .returning();
    return created;
  }

  async getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return await db
      .select()
      .from(withdrawalRequests)
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  async getUserWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]> {
    return await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  async getWithdrawalRequest(id: string): Promise<WithdrawalRequest | undefined> {
    const [request] = await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.id, id));
    return request;
  }

  async updateWithdrawalRequestStatus(
    id: string,
    status: 'pending' | 'approved' | 'rejected' | 'processed',
    adminNotes?: string,
    processedBy?: string
  ): Promise<WithdrawalRequest> {
    const [updated] = await db
      .update(withdrawalRequests)
      .set({
        status,
        adminNotes,
        processedBy,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return updated;
  }

  // Marketing operations
  async getNewsletterSubscribers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.receiveNewsletter, true))
      .orderBy(desc(users.createdAt));
  }

  async getPromotionalCampaigns(): Promise<PromotionalCampaign[]> {
    return await db
      .select()
      .from(promotionalCampaigns)
      .orderBy(desc(promotionalCampaigns.createdAt));
  }

  async getPromotionalCampaignById(id: string): Promise<PromotionalCampaign | undefined> {
    const [campaign] = await db
      .select()
      .from(promotionalCampaigns)
      .where(eq(promotionalCampaigns.id, id));
    return campaign;
  }

  async createPromotionalCampaign(campaign: InsertPromotionalCampaign): Promise<PromotionalCampaign> {
    const [created] = await db
      .insert(promotionalCampaigns)
      .values(campaign)
      .returning();
    return created;
  }

  async updatePromotionalCampaign(id: string, data: Partial<PromotionalCampaign>): Promise<PromotionalCampaign> {
    const [updated] = await db
      .update(promotionalCampaigns)
      .set(data)
      .where(eq(promotionalCampaigns.id, id))
      .returning();
    return updated;
  }

  async deletePromotionalCampaign(id: string): Promise<void> {
    await db
      .delete(promotionalCampaigns)
      .where(eq(promotionalCampaigns.id, id));
  }

  async createCampaignEmail(email: InsertCampaignEmail): Promise<CampaignEmail> {
    const [created] = await db
      .insert(campaignEmails)
      .values(email)
      .returning();
    return created;
  }

  // Support ticket operations
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const [created] = await db
      .insert(supportTickets)
      .values({
        ...ticket,
        adminHasUnread: true,
        userHasUnread: false,
      })
      .returning();
    return created;
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    return await db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt));
  }

  async getUserSupportTickets(userId: string): Promise<SupportTicket[]> {
    return await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id));
    return ticket;
  }

  async updateSupportTicket(id: string, data: Partial<SupportTicket>): Promise<SupportTicket> {
    const [updated] = await db
      .update(supportTickets)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, id))
      .returning();
    return updated;
  }

  async deleteSupportTicket(id: string): Promise<void> {
    await db
      .delete(supportTickets)
      .where(eq(supportTickets.id, id));
  }

  async getUserUnreadTicketCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportTickets)
      .where(and(
        eq(supportTickets.userId, userId),
        eq(supportTickets.userHasUnread, true),
        notInArray(supportTickets.status, ['resolved', 'closed'])
      ));
    return result[0]?.count || 0;
  }

  async getAdminUnreadTicketCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportTickets)
      .where(and(
        eq(supportTickets.adminHasUnread, true),
        notInArray(supportTickets.status, ['resolved', 'closed'])
      ));
    return result[0]?.count || 0;
  }

  async markTicketsAsReadByUser(userId: string): Promise<void> {
    await db
      .update(supportTickets)
      .set({ userHasUnread: false })
      .where(eq(supportTickets.userId, userId));
  }

  async markTicketAsReadByAdmin(ticketId: string): Promise<void> {
    await db
      .update(supportTickets)
      .set({ adminHasUnread: false })
      .where(eq(supportTickets.id, ticketId));
  }

  // Support Messages
  async createSupportMessage(data: InsertSupportMessage): Promise<SupportMessage> {
    const [message] = await db
      .insert(supportMessages)
      .values(data)
      .returning();
    return message;
  }

  async getMessagesByTicketId(ticketId: string): Promise<SupportMessage[]> {
    return await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.ticketId, ticketId))
      .orderBy(supportMessages.createdAt);
  }
}

export const storage = new DatabaseStorage();