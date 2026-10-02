/**
 * Catching payments the webhook never settled.
 *
 * The success page used to verify a payment with Cashflows and fulfil the
 * order itself if the webhook had not arrived. That turned out to be the cause
 * of customers watching "Confirming your payment" for minutes: the page and
 * the webhook raced to do the same work, and issuing tickets locks the
 * competition row, so they blocked each other while every retry piled another
 * waiting transaction behind them.
 *
 * Settlement now belongs to the webhook alone and the page only reports. That
 * removes the contention, but it also removes the page's ability to rescue a
 * payment whose webhook never came -- so something has to. This is it.
 *
 * It verifies with Cashflows first and settles by replaying the webhook, so a
 * recovered payment goes down exactly the same path as a normal one, including
 * its idempotency check.
 */

export const RECOVERY_MIN_AGE_MINUTES = 2;
export const RECOVERY_MAX_AGE_HOURS = 24;

export interface RecoverablePayment {
  id: string;
  status: string | null;
  createdAt: Date | string | null;
}

function ageMinutes(createdAt: Date | string | null, now: Date): number {
  if (!createdAt) return Number.POSITIVE_INFINITY;
  const at = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const ms = at.getTime();
  if (!Number.isFinite(ms)) return Number.POSITIVE_INFINITY;
  return (now.getTime() - ms) / 60000;
}

/**
 * Whether a pending payment is worth asking Cashflows about.
 *
 * Young ones are left alone because the webhook is probably seconds away and
 * chasing them would recreate the stampede this was meant to end. Old ones are
 * left alone because a payment that never settled in a day is an abandoned
 * checkout, not a lost webhook, and re-checking the whole history every five
 * minutes would grow without limit.
 */
export function shouldAttemptRecovery(
  payment: RecoverablePayment,
  now: Date,
  opts?: { minAgeMinutes?: number; maxAgeHours?: number },
): boolean {
  if (payment.status !== "pending") return false;
  const minAge = opts?.minAgeMinutes ?? RECOVERY_MIN_AGE_MINUTES;
  const maxAge = (opts?.maxAgeHours ?? RECOVERY_MAX_AGE_HOURS) * 60;
  const age = ageMinutes(payment.createdAt, now);
  return age >= minAge && age <= maxAge;
}

/** The ones to chase, oldest first so a backlog drains in order. */
export function selectRecoverable(
  payments: RecoverablePayment[],
  now: Date,
  opts?: { minAgeMinutes?: number; maxAgeHours?: number; limit?: number },
): RecoverablePayment[] {
  const due = payments.filter((p) => shouldAttemptRecovery(p, now, opts));
  due.sort((a, b) => ageMinutes(b.createdAt, now) - ageMinutes(a.createdAt, now));
  const limit = opts?.limit ?? 25;
  return due.slice(0, limit);
}

// ---------------------------------------------------------------------------
// The job itself. Kept below the pure helpers above so the decision logic can
// be tested without a database or a network.
// ---------------------------------------------------------------------------

import { db } from "../db";
import { pendingPayments } from "@shared/schema";
import { eq } from "drizzle-orm";
import { cashflows } from "../cashflows";
import { normalizeCashflowsStatus } from "../payment-settlement";

/**
 * Finds payments the webhook seems to have missed, confirms them with
 * Cashflows, and settles the ones that really were paid.
 *
 * Settlement happens by replaying the webhook against our own server rather
 * than by reimplementing it. A recovered payment then takes exactly the same
 * path as a normal one -- same fulfilment, same idempotency check -- so there
 * is no second settlement implementation to drift out of step.
 */
export async function recoverStalePayments(): Promise<{ checked: number; settled: number }> {
  const rows = await db
    .select({
      id: pendingPayments.id,
      status: pendingPayments.status,
      createdAt: pendingPayments.createdAt,
      paymentJobReference: pendingPayments.paymentJobReference,
      paymentReference: pendingPayments.paymentReference,
    })
    .from(pendingPayments)
    .where(eq(pendingPayments.status, "pending"));

  const due = selectRecoverable(rows as any, new Date()) as typeof rows;
  let settled = 0;

  for (const row of due) {
    if (!row.paymentJobReference) continue;
    try {
      const payment = await cashflows.getPaymentStatus(
        row.paymentJobReference,
        row.paymentReference ?? undefined,
      );
      const { status } = normalizeCashflowsStatus(payment);
      if (status !== "PAID") continue;

      const port = process.env.PORT || "5000";
      const res = await fetch(`http://127.0.0.1:${port}/api/cashflows/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentJobReference: row.paymentJobReference,
          paymentReference: row.paymentReference,
        }),
      });
      if (res.ok) {
        settled += 1;
        console.log(`💸 Recovered payment ${row.paymentJobReference} the webhook missed`);
      }
    } catch (error) {
      // One bad payment must not stop the rest of the sweep.
      console.error(`Payment recovery failed for ${row.paymentJobReference}:`, error);
    }
  }

  return { checked: due.length, settled };
}
