/**
 * Whether a Cashflows webhook should keep processing a pending payment row.
 *
 * A single payment job can contain several attempts. A customer who fails 3D
 * Secure and then retries successfully produces two attempts under the same
 * payment job reference, each with its own webhook:
 *
 *   attempt 1 -> Failed (ThreeDSecureFailed)  -> row marked "failed"
 *   attempt 2 -> Paid                         -> webhook arrives seconds later
 *
 * Hard-stopping on anything that is not "pending" meant the second webhook was
 * discarded, so Cashflows collected the money and the customer got nothing.
 * A "failed" row therefore has to be re-checked against Cashflows rather than
 * treated as final — the provider is the source of truth, not our first
 * impression of it.
 *
 * "completed" still stops here: that payment has already been fulfilled and
 * must never be processed twice.
 */
export function shouldProcessPaymentWebhook(status: string | null | undefined): boolean {
  // Already fulfilled — never process a second time.
  if (status === "completed") return false;

  // "failed" is not final: a later attempt on the same job may have paid.
  return status === "pending" || status === "failed";
}
