import { and, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { cashflows } from "./cashflows";
import { orders, pendingPayments, transactions, users } from "@shared/schema";

export function firstQueryRow<T = any>(result: any): T | undefined {
  if (!result) return undefined;
  if (Array.isArray(result)) {
    const first = result[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return first as T;
    }
  }
  if (Array.isArray(result.rows) && result.rows[0]) {
    return result.rows[0] as T;
  }
  return undefined;
}

export function parseCashAmount(...candidates: unknown[]): number {
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return Math.round(n * 100) / 100;
  }
  return 0;
}

export function normalizeCashflowsStatus(payment: any): {
  status: "PAID" | "PENDING" | "FAILED" | "UNKNOWN";
  paidAmount: number;
} {
  const raw =
    payment?.status ||
    payment?.data?.status ||
    payment?.data?.paymentStatus ||
    payment?.data?.payments?.[0]?.status ||
    payment?.data?.paymentJob?.status ||
    "";

  const status = String(raw).toUpperCase();
  const paidAmount = parseCashAmount(
    payment?.data?.paidAmount,
    payment?.data?.amountCollected,
    payment?.data?.amountToCollect,
    payment?.data?.payments?.[0]?.paidAmount,
    payment?.data?.payments?.[0]?.amount,
    payment?.amountToCollect,
    payment?.paidAmount,
  );

  if (
    status.includes("PAID") ||
    status.includes("SUCCESS") ||
    status.includes("CAPTURE") ||
    status === "COMPLETED"
  ) {
    return { status: "PAID", paidAmount };
  }

  if (
    status.includes("FAIL") ||
    status.includes("CANCEL") ||
    status.includes("EXPIRE") ||
    status.includes("DECLIN")
  ) {
    return { status: "FAILED", paidAmount: 0 };
  }

  if (
    status.includes("PENDING") ||
    status.includes("PROCESS") ||
    status.includes("AUTHOR")
  ) {
    return { status: "PENDING", paidAmount };
  }

  return { status: "UNKNOWN", paidAmount };
}

export async function incrementUserBalance(
  userId: string,
  delta: number,
  executor: { execute: typeof db.execute } = db,
) {
  const amount = Math.round(delta * 100) / 100;
  if (!amount) return;
  await executor.execute(sql`
    UPDATE users
    SET balance = balance + ${amount}, updated_at = NOW()
    WHERE id = ${userId}
  `);
}

export async function incrementUserPoints(
  userId: string,
  delta: number,
  executor: { execute: typeof db.execute } = db,
) {
  const amount = Math.round(delta);
  if (!amount) return;
  await executor.execute(sql`
    UPDATE users
    SET ringtone_points = COALESCE(ringtone_points, 0) + ${amount}, updated_at = NOW()
    WHERE id = ${userId}
  `);
}

export function paymentMethodLabel(walletUsed: number, pointsUsed: number, cardAmount: number) {
  const parts: string[] = [];
  if (walletUsed > 0) parts.push("Wallet");
  if (pointsUsed > 0) parts.push("Points");
  if (cardAmount > 0.01) parts.push("Cashflow");
  if (!parts.length) return "pending";
  if (parts.length === 1 && parts[0] === "Wallet") return "Wallet Credit";
  if (parts.length === 1 && parts[0] === "Points") return "Points";
  if (parts.length === 1) return "instaplay";
  return parts.join("+");
}

export async function beginReservedCardCheckout(opts: {
  userId: string;
  orderId: string;
  competitionId: string;
  quantity: number;
  cardAmount: number;
  walletAmount: number;
  pointsAmount: number;
  gameType: string;
  paymentBreakdown: unknown[];
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}) {
  const cardAmount = Math.round(opts.cardAmount * 100) / 100;
  const session = await cashflows.createCompetitionPaymentSession(cardAmount, {
    orderId: opts.orderId,
    competitionId: opts.competitionId,
    userId: opts.userId,
    quantity: String(opts.quantity),
    paymentType: "instant_play",
    gameType: opts.gameType,
    firstName: opts.firstName || "",
    lastName: opts.lastName || "",
    email: opts.email || "",
  });

  if (!session?.hostedPageUrl || !session.paymentJobReference) {
    return { ok: false as const };
  }

  const method = paymentMethodLabel(opts.walletAmount, opts.pointsAmount, cardAmount);

  await db.insert(pendingPayments).values({
    paymentJobReference: session.paymentJobReference,
    userId: opts.userId,
    orderId: opts.orderId,
    paymentType: "instant_play",
    amount: String(cardAmount),
    status: "pending",
    metadata: {
      gameType: opts.gameType,
      competitionType: opts.gameType,
      reservedWallet: opts.walletAmount,
      reservedPoints: opts.pointsAmount,
      orderId: opts.orderId,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db
    .update(orders)
    .set({
      status: "pending",
      paymentMethod: method === "Cashflow" ? "instaplay" : method,
      walletAmount: String(opts.walletAmount || 0),
      pointsAmount: String(opts.pointsAmount || 0),
      cashflowsAmount: String(cardAmount),
      paymentBreakdown: JSON.stringify(opts.paymentBreakdown || []),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, opts.orderId));

  return {
    ok: true as const,
    redirectUrl: session.hostedPageUrl,
    sessionId: session.paymentJobReference,
  };
}

export async function applyReservedTender(opts: {
  tx: any;
  userId: string;
  orderId: string;
  reservedWallet: number;
  reservedPoints: number;
}) {
  if (opts.reservedWallet > 0) {
    const [existing] = await opts.tx
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.orderId, opts.orderId),
          eq(transactions.userId, opts.userId),
          eq(transactions.type, "purchase"),
        ),
      )
      .limit(8);

    const alreadyDebited = existing.some(
      (row: any) =>
        String(row.description || "").toLowerCase().includes("wallet") &&
        Number(row.amount) < 0,
    );

    if (!alreadyDebited) {
      await incrementUserBalance(opts.userId, -opts.reservedWallet, opts.tx);
      await opts.tx.insert(transactions).values({
        userId: opts.userId,
        type: "purchase",
        amount: `-${opts.reservedWallet.toFixed(2)}`,
        description: `Wallet payment for order ${opts.orderId}`,
        orderId: opts.orderId,
        createdAt: new Date(),
      });
    }
  }

  if (opts.reservedPoints > 0) {
    await incrementUserPoints(opts.userId, -opts.reservedPoints, opts.tx);
  }
}

export async function refundEarlyTender(opts: {
  userId: string;
  orderId: string;
  walletUsed: number;
  pointsUsed: number;
}) {
  if (opts.walletUsed > 0) {
    await incrementUserBalance(opts.userId, opts.walletUsed);
  }
  if (opts.pointsUsed > 0) {
    await incrementUserPoints(opts.userId, opts.pointsUsed);
  }
  if (opts.walletUsed > 0 || opts.pointsUsed > 0) {
    await db
      .delete(transactions)
      .where(and(eq(transactions.orderId, opts.orderId), eq(transactions.userId, opts.userId)));
  }
}
