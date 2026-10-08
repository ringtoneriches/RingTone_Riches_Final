import { eq } from "drizzle-orm";
import { db } from "../db";
import { transactions } from "@shared/schema";
import { incrementUserBalance } from "../payment-settlement";
import { CARD_CASHBACK_REF_PREFIX, cardCashbackAmount } from "@shared/card-cashback";

/** The transaction handle Drizzle hands a db.transaction callback. */
type CashbackTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Credit 1% of a card payment back to the wallet.
 *
 * Takes the caller's transaction when there is one. It used to open its own
 * unconditionally, and it is awaited from inside cart settlement, which runs
 * in the caller's transaction -- so a second connection was asked for from
 * inside the first, and the second then tried to update a row the first was
 * already holding. The first sat idle in transaction until Postgres closed it
 * sixty seconds later, and the customer watched "Confirming your payment" for
 * every one of them before the request failed with a 500 and settled only on
 * the retry, sending a second confirmation email.
 */
export async function creditCardCashback(opts: {
  userId?: string | null;
  cardAmount: number;
  paymentRef?: string | null;
  orderId?: string | null;
  tx?: CashbackTx;
}) {
  const userId = opts.userId || "";
  const credit = cardCashbackAmount(opts.cardAmount);
  const sourceRef = String(opts.paymentRef || "").trim();
  if (!userId || !sourceRef || credit < 0.01) return { credited: 0 };

  const paymentRef = `${CARD_CASHBACK_REF_PREFIX}${sourceRef}`.slice(0, 120);
  const spent = Math.round(Number(opts.cardAmount) * 100) / 100;

  const run = async (tx: CashbackTx) => {
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
  };

  try {
    // Reuse the caller's transaction rather than opening a second one beside it.
    if (opts.tx) await run(opts.tx);
    else await db.transaction(run);
    return { credited: credit };
  } catch (error) {
    console.error("[cashback] could not credit card cashback", error);
    return { credited: 0 };
  }
}
