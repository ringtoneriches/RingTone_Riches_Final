/**
 * Whether a pending order's quantity may still be changed.
 *
 * The checkout had no quantity control: the number was printed as text, with
 * no way back except the browser button, and pressing Buy again created a
 * second order. 71% of "abandoned" orders turned out to be that -- the same
 * customer's discarded first attempt -- and 61% of those came back with FEWER
 * plays, an average of 5.7 down to 2.1. The round trip was not neutral; it
 * talked people out of two thirds of their basket.
 *
 * Worse, when a card order fell under the £3 minimum the page said "Add 2 more
 * play(s) to reach £3 minimum" and gave no control to do it.
 *
 * This decides only the things particular to editing an order that already
 * exists. Everything about whether the COMPETITION can sell that many -- per
 * account caps, remaining tickets, sold out, the per-order maximum -- stays in
 * assertCanPurchaseTickets, so a change of quantity and a fresh purchase can
 * never disagree about the rules.
 */

export type OrderEditState = {
  exists: boolean;
  /** The order belongs to the person asking. */
  ownedByRequester: boolean;
  status: string | null;
  /** A discount code is attached; its value was quoted against the old total. */
  hasDiscountCode: boolean;
  /** A payment has been started -- the customer may be at the card page now. */
  paymentInFlight: boolean;
  /** Tickets already exist for it, whatever the status says. */
  alreadyIssued: boolean;
  currentQuantity: number;
};

export type EditRefusal =
  | "not_found"
  | "not_yours"
  | "not_pending"
  | "already_issued"
  | "payment_in_flight"
  | "discount_applied"
  | "invalid_quantity"
  | "unchanged";

export type EditDecision = { ok: true; quantity: number } | { ok: false; reason: EditRefusal };

export function canChangeOrderQuantity(
  state: OrderEditState,
  requested: unknown,
): EditDecision {
  if (!state.exists) return { ok: false, reason: "not_found" };

  // Checked before anything else: someone else's order should not even reveal
  // whether it is editable.
  if (!state.ownedByRequester) return { ok: false, reason: "not_yours" };

  // A number, or the string a form sends. Nothing else: Number(true) is 1,
  // which would otherwise arrive as a perfectly valid order for one entry.
  if (typeof requested !== "number" && typeof requested !== "string") {
    return { ok: false, reason: "invalid_quantity" };
  }
  const qty = Number(requested);
  if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty < 1) {
    return { ok: false, reason: "invalid_quantity" };
  }

  if (state.status !== "pending") return { ok: false, reason: "not_pending" };

  // Belt and braces. A pending order should have no tickets, but if it somehow
  // does, repricing it would change what was charged for what was issued.
  if (state.alreadyIssued) return { ok: false, reason: "already_issued" };

  // The customer may be on the card page right now, paying the old amount.
  // Settlement matches on the payment's amount, so moving the total under it
  // would strand the payment.
  if (state.paymentInFlight) return { ok: false, reason: "payment_in_flight" };

  // The code was quoted against the old total and its cap applied to that
  // figure. Repricing underneath it would silently change what the prize is
  // worth, so the customer takes it off first -- the checkout has a control
  // for exactly that.
  if (state.hasDiscountCode) return { ok: false, reason: "discount_applied" };

  if (qty === state.currentQuantity) return { ok: false, reason: "unchanged" };

  return { ok: true, quantity: qty };
}

/** What to tell the customer. Reasons they cannot act on stay vague. */
export function editRefusalMessage(reason: EditRefusal): string {
  switch (reason) {
    case "not_found":
    case "not_yours":
      return "Order not found";
    case "not_pending":
      return "This order has already been paid for";
    case "already_issued":
      return "This order already has entries";
    case "payment_in_flight":
      return "A payment is already in progress for this order";
    case "discount_applied":
      return "Remove your discount code first, then change the quantity";
    case "invalid_quantity":
      return "Choose at least 1 entry";
    case "unchanged":
      return "That is already the quantity";
  }
}

/** HTTP status for each refusal. */
export function editRefusalStatus(reason: EditRefusal): number {
  if (reason === "not_found" || reason === "not_yours") return 404;
  return 400;
}
