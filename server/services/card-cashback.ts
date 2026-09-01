import { eq } from "drizzle-orm";
import { db } from "../db";
import { transactions } from "@shared/schema";
import { incrementUserBalance } from "../payment-settlement";
import { CARD_CASHBACK_REF_PREFIX, cardCashbackAmount } from "@shared/card-cashback";

export async function creditCardCashback(opts: {
  userId?: string | null;
  cardAmount: number;
  paymentRef?: string | null;
  orderId?: string | null;
}) {
  const userId = opts.userId || "";
  const credit = cardCashbackAmount(opts.cardAmount);
  const sourceRef = String(opts.paymentRef || "").trim();
  if (!userId || !sourceRef || credit < 0.01) return { credited: 0 };

  const paymentRef = `${CARD_CASHBACK_REF_PREFIX}${sourceRef}`.slice(0, 120);
  const spent = Math.round(Number(opts.cardAmount) * 100) / 100;

  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: transactions.id })
        .from(transactions)
        .where(eq(transactions.paymentRef, paymentRef))
        .limit(1);
      if (existing) return;

      await incrementUserBalance(userId, credit, tx);
      await tx.insert(transactions).values({
        userId,
        type: "deposit",
        amount: credit.toFixed(2),
        paymentRef,
        orderId: opts.orderId || null,
        description: `Card cashback — 1% of £${spent.toFixed(2)} back to your wallet`,
        createdAt: new Date(),
      });
    });
    return { credited: credit };
  } catch (error) {
    console.error("[cashback] could not credit card cashback", error);
    return { credited: 0 };
  }
}
