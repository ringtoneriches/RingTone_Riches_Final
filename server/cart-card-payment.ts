import type { Express, Request, Response } from "express";
import { eq, inArray, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "./db";
import { cashflows } from "./cashflows";
import { isAuthenticated } from "./customAuth";
import { issuePlayTickets } from "./services/instant-win-pool";
import { creditCardCashback } from "./services/card-cashback";
import { sendOrderConfirmationEmail, type OrderConfirmationPayload } from "./email";
import {
  auditLogs,
  competitions,
  orders,
  pendingPayments,
  tickets,
  transactions,
  users,
} from "@shared/schema";

const MIN_CARD_PURCHASE = 3;

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function parseMetadata(raw: unknown): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as Record<string, any>;
  return {};
}

export function cartOrderIdsFromMetadata(metadata: unknown): string[] {
  const meta = parseMetadata(metadata);
  const ids = meta.cartOrderIds;
  if (!Array.isArray(ids)) return [];
  return ids.filter((id): id is string => typeof id === "string" && id.length > 0);
}

function emailOrderType(gameType: string): OrderConfirmationPayload["orderType"] {
  switch (gameType) {
    case "spin":
    case "scratch":
    case "pop":
    case "royal":
    case "slot":
    case "voltz":
    case "plinko":
      return gameType;
    default:
      return "competition";
  }
}

function ticketPrefix(gameType: string) {
  switch (gameType) {
    case "scratch":
      return "SCRATCH";
    case "spin":
      return "SPIN";
    case "pop":
      return "POP";
    case "plinko":
      return "PLINKO";
    case "slot":
      return "SLOT";
    case "voltz":
      return "VOLTZ";
    case "royal":
      return "ROYAL";
    default:
      return "GAME";
  }
}

export async function fulfillCartCardPayment(opts: {
  userId: string;
  orderIds: string[];
  pendingPaymentId: string;
  paymentRef: string;
  paidAmount: number;
}) {
  const uniqueIds = Array.from(new Set(opts.orderIds));
  if (!uniqueIds.length) return [];

  const generatedByOrder = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(transactions)
      .where(eq(transactions.paymentRef, opts.paymentRef))
      .limit(1);

    const orderRows = await tx.select().from(orders).where(inArray(orders.id, uniqueIds));
    const byId = new Map(orderRows.map((row) => [row.id, row]));
    const issued: { orderId: string; tickets: { ticketNumber: string }[]; gameType: string; title: string; quantity: number; amount: string }[] = [];
    const newlyIssued: typeof issued = [];

    for (const orderId of uniqueIds) {
      const order = byId.get(orderId);
      if (!order || order.userId !== opts.userId) continue;

      const existingTickets = await tx.select().from(tickets).where(eq(tickets.orderId, orderId));
      const [competition] = await tx
        .select()
        .from(competitions)
        .where(eq(competitions.id, order.competitionId))
        .limit(1);
      const gameType = competition?.type || "competition";

      if (order.status !== "completed") {
        await tx
          .update(orders)
          .set({
            status: "completed",
            paymentMethod: "instaplay",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
      }

      let orderTickets = existingTickets;
      let didIssue = false;
      if (!orderTickets.length) {
        const issuedTickets = await issuePlayTickets({
          tx,
          competitionId: order.competitionId,
          quantity: order.quantity,
          userId: opts.userId,
          orderId,
          gameType,
          incrementSold: true,
          makeLegacyNumber: () => `${ticketPrefix(gameType)}-${nanoid(8).toUpperCase()}`,
        });
        orderTickets = issuedTickets.tickets;
        didIssue = true;
      }

      const row = {
        orderId,
        tickets: orderTickets.map((t) => ({ ticketNumber: t.ticketNumber })),
        gameType,
        title: competition?.title || gameType,
        quantity: order.quantity,
        amount: String(order.totalAmount),
      };
      issued.push(row);
      if (didIssue) newlyIssued.push(row);
    }

    if (!existing) {
      const [user] = await tx.select().from(users).where(eq(users.id, opts.userId)).limit(1);
      const oldBalance = Number(user?.balance || 0);
      await tx.insert(transactions).values({
        userId: opts.userId,
        type: "purchase",
        amount: money(opts.paidAmount).toFixed(2),
        paymentRef: opts.paymentRef,
        pendingPaymentId: opts.pendingPaymentId,
        orderId: uniqueIds[0],
        description: `Cart card payment: ${uniqueIds.length} game${uniqueIds.length === 1 ? "" : "s"} — £${money(opts.paidAmount).toFixed(2)}`,
        createdAt: new Date(),
      });
      await tx.insert(auditLogs).values({
        userId: opts.userId,
        userName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Customer",
        email: user?.email || "",
        action: "cart_card_completed",
        description: `Combined card payment completed: ${uniqueIds.length} order(s) for £${money(opts.paidAmount).toFixed(2)}`,
        startBalance: oldBalance.toFixed(2),
        endBalance: oldBalance.toFixed(2),
        createdAt: new Date(),
      });
    }

    return { issued, newlyIssued };
  });

  const [user] = await db.select().from(users).where(eq(users.id, opts.userId)).limit(1);
  const rowsToEmail = generatedByOrder.newlyIssued;
  if (user?.email && rowsToEmail.length) {
    const displayName =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email.split("@")[0] ||
      "there";
    const orderDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const cartTotal = money(
      rowsToEmail.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    ).toFixed(2);
    const first = rowsToEmail[0];
    sendOrderConfirmationEmail(user.email, {
      orderId: first.orderId,
      userName: displayName,
      orderType: emailOrderType(first.gameType),
      itemName: first.title,
      quantity: rowsToEmail.reduce((sum, row) => sum + row.quantity, 0),
      totalAmount: cartTotal,
      orderDate,
      paymentMethod: "Instant Play (Card)",
      ticketNumbers: first.tickets.map((t) => t.ticketNumber),
      cartLines:
        rowsToEmail.length > 1
          ? rowsToEmail.map((row) => ({
              itemName: row.title,
              orderType: emailOrderType(row.gameType),
              quantity: row.quantity,
              amount: Number(row.amount).toFixed(2),
              ticketNumbers: row.tickets.map((t) => t.ticketNumber),
            }))
          : undefined,
    }).catch((err) => console.error("Cart confirmation email failed:", err));
  }

  await creditCardCashback({
    userId: opts.userId,
    cardAmount: opts.paidAmount,
    paymentRef: opts.paymentRef,
    orderId: uniqueIds[0],
  });

  return generatedByOrder.issued;
}

export async function failCartCardPayment(orderIds: string[]) {
  const uniqueIds = Array.from(new Set(orderIds));
  if (!uniqueIds.length) return;
  await db
    .update(orders)
    .set({ status: "failed", updatedAt: new Date() })
    .where(and(inArray(orders.id, uniqueIds), eq(orders.status, "pending")));
}

export function registerCartCardPaymentRoutes(app: Express) {
  app.post(
    "/api/cart/process-card-payment",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id as string;
        const orderIds: string[] = Array.isArray(req.body?.orderIds)
          ? req.body.orderIds.filter((id: unknown): id is string => typeof id === "string")
          : [];

        if (orderIds.length < 1) {
          return res.status(400).json({ message: "Add at least one game to pay." });
        }
        if (new Set(orderIds).size !== orderIds.length) {
          return res.status(400).json({ message: "Duplicate orders in checkout." });
        }

        const orderRows = await db.select().from(orders).where(inArray(orders.id, orderIds));
        if (orderRows.length !== orderIds.length) {
          return res.status(404).json({ message: "One of those orders could not be found." });
        }

        const ordered = orderIds.map((id: string) => orderRows.find((row) => row.id === id)!);
        for (const order of ordered) {
          if (order.userId !== userId) {
            return res.status(404).json({ message: "Order not found." });
          }
          if (order.status !== "pending") {
            return res.status(400).json({ message: "One of those orders was already processed." });
          }
        }

        const totalCents = ordered.reduce(
          (sum, order) => sum + Math.round(Number(order.totalAmount) * 100),
          0,
        );
        const totalAmount = totalCents / 100;
        if (totalAmount < MIN_CARD_PURCHASE) {
          return res.status(400).json({
            success: false,
            code: "MINIMUM_PURCHASE_REQUIRED",
            message: `Minimum purchase is £${MIN_CARD_PURCHASE}. Your total is £${totalAmount.toFixed(2)}. Please add more plays.`,
            minimumAmount: MIN_CARD_PURCHASE,
            currentAmount: totalAmount,
          });
        }

        const competitionIds = ordered.map((order) => order.competitionId);
        const comps = await db
          .select()
          .from(competitions)
          .where(inArray(competitions.id, competitionIds));
        const compById = new Map(comps.map((row) => [row.id, row]));
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        const orderLines = ordered.map((order, index) => {
          const competition = compById.get(order.competitionId);
          const lineAmount = money(Number(order.totalAmount));
          const qty = Math.max(1, order.quantity);
          return {
            lineNumber: index + 1,
            type: "DigitalItem",
            name: `${competition?.title || "Game"} × ${qty}`,
            description: `${qty} play${qty === 1 ? "" : "s"} — ${competition?.type || "game"}`,
            quantity: 1,
            unitPriceInclVat: lineAmount,
            totalLineAmount: lineAmount,
          };
        });

        const firstOrder = ordered[0];
        const isCartCheckout = ordered.length > 1;
        const session = await cashflows.createCompetitionPaymentSession(totalAmount, {
          orderId: firstOrder.id,
          userId,
          paymentType: "instant_play",
          cartCheckout: isCartCheckout,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.email || "",
          orderLines,
        });

        if (!session.hostedPageUrl || !session.paymentJobReference) {
          return res.status(500).json({ message: "Failed to create payment session" });
        }

        const breakdown = JSON.stringify({
          cartCharge: true,
          paymentJobReference: session.paymentJobReference,
          siblingOrderIds: orderIds,
        });

        for (const order of ordered) {
          await db
            .update(orders)
            .set({
              paymentMethod: "instaplay",
              cashflowsAmount: String(order.totalAmount),
              paymentBreakdown: breakdown,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));
        }

        await db.insert(pendingPayments).values({
          userId,
          orderId: firstOrder.id,
          paymentJobReference: session.paymentJobReference,
          paymentType: "instant_play",
          amount: totalAmount.toFixed(2),
          metadata: {
            cartOrderIds: orderIds,
            cartCharge: true,
            gameType: compById.get(firstOrder.competitionId)?.type || "competition",
            quantity: ordered.reduce((sum, order) => sum + order.quantity, 0),
            lines: ordered.map((order) => ({
              orderId: order.id,
              competitionId: order.competitionId,
              title: compById.get(order.competitionId)?.title,
              gameType: compById.get(order.competitionId)?.type,
              quantity: order.quantity,
              amount: order.totalAmount,
            })),
          },
          status: "pending",
          createdAt: new Date(),
        });

        return res.json({
          success: true,
          redirectUrl: session.hostedPageUrl,
          sessionId: session.paymentJobReference,
          paymentType: "instaplay",
          cart: isCartCheckout,
          orderIds,
          orderId: firstOrder.id,
          message: "Redirecting to payment...",
        });
      } catch (error: any) {
        console.error("cart card payment error:", error);
        return res.status(500).json({
          message: error.message || "Could not start card payment.",
        });
      }
    },
  );
}
