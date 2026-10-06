/**
 * Which transactions belong on the admin Cashflow Transactions screen.
 *
 * The screen used to decide this with three hand-written clauses: every
 * deposit, plus purchases whose description contained "Instant play purchase",
 * plus anything whose payment reference began "260".
 *
 * Both of the last two were brittle in the same way -- they matched on the
 * shape of a string rather than on what the row is.
 *
 *   - The description test predates basket checkout, which writes "Cart card
 *     payment: ..." instead, so no basket purchase has ever matched it.
 *   - The "260" test is a Cashflows reference prefix. It was carrying every
 *     basket purchase on its own until Cashflows rolled the prefix to "261" on
 *     1 October 2026, at which point basket purchases stopped appearing at all.
 *
 * A customer rang about a payment that was taken, fulfilled, and simply not on
 * this screen. The money was never missing; the list was.
 *
 * So the rule is now about the row itself: a payment reference is written only
 * when Cashflows took the money, so having one IS the test. Nothing in the
 * database carries a reference except card purchases and deposits, which is
 * exactly the set this screen is for.
 */

/** The fields the decision needs. Deliberately minimal so it is easy to test. */
export type CashflowsTransactionRow = {
  type?: string | null;
  paymentRef?: string | null;
};

/**
 * A reference that actually names a Cashflows payment.
 *
 * Empty strings and the literal "N/A" have both been written here over the
 * years by code that had no reference to record, and neither means a payment.
 */
export function hasCashflowsReference(paymentRef: string | null | undefined): boolean {
  if (typeof paymentRef !== "string") return false;
  const ref = paymentRef.trim();
  return ref !== "" && ref.toUpperCase() !== "N/A";
}

/**
 * Whether this row belongs on the Cashflow Transactions screen.
 *
 * Deposits stay included whether or not they carry a reference, which is the
 * behaviour the screen already had: it shows cashback and bonuses too, and
 * labels them separately. The money totals on that page come from
 * `cashflows-revenue.ts` and are not affected by this.
 */
export function isCashflowsTransaction(tx: CashflowsTransactionRow): boolean {
  if (tx.type === "deposit") return true;
  return hasCashflowsReference(tx.paymentRef);
}

// ---------------------------------------------------------------------------
// The same rule as SQL, for the two screens that read it straight from the
// database. Kept beside the predicate above so the two can never drift: if one
// is changed without the other, the tests comparing them fail.
// ---------------------------------------------------------------------------

import { sql, type SQL } from "drizzle-orm";
import { transactions } from "@shared/schema";

/** The WHERE clause for the admin Cashflow Transactions list and its CSV export. */
export function cashflowsTransactionWhere(): SQL {
  return sql`(
    ${transactions.type} = 'deposit'
  ) OR (
    ${transactions.paymentRef} IS NOT NULL
    AND TRIM(${transactions.paymentRef}) <> ''
    AND UPPER(TRIM(${transactions.paymentRef})) <> 'N/A'
  )`;
}
