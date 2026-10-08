import { describe, expect, it } from "vitest";
import {
  canChangeOrderQuantity,
  editRefusalMessage,
  editRefusalStatus,
  type EditRefusal,
  type OrderEditState,
} from "./order-quantity-change";

const ok: OrderEditState = {
  exists: true,
  ownedByRequester: true,
  status: "pending",
  hasDiscountCode: false,
  paymentInFlight: false,
  alreadyIssued: false,
  currentQuantity: 5,
};

describe("canChangeOrderQuantity", () => {
  it("allows the owner to change a pending order", () => {
    expect(canChangeOrderQuantity(ok, 15)).toEqual({ ok: true, quantity: 15 });
    expect(canChangeOrderQuantity(ok, 1)).toEqual({ ok: true, quantity: 1 });
  });

  it("refuses an order that does not exist", () => {
    expect(canChangeOrderQuantity({ ...ok, exists: false }, 10)).toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("refuses somebody else's order, before anything else", () => {
    // Even a nonsense quantity on someone else's order answers "not found",
    // so the endpoint never confirms the order is editable.
    expect(canChangeOrderQuantity({ ...ok, ownedByRequester: false }, -4)).toEqual({
      ok: false,
      reason: "not_yours",
    });
  });

  it("refuses an order that is not pending", () => {
    for (const status of ["completed", "failed", "expired", "cancelled", null]) {
      expect(canChangeOrderQuantity({ ...ok, status }, 10)).toEqual({
        ok: false,
        reason: "not_pending",
      });
    }
  });

  it("refuses when tickets already exist, whatever the status says", () => {
    expect(canChangeOrderQuantity({ ...ok, alreadyIssued: true }, 10)).toEqual({
      ok: false,
      reason: "already_issued",
    });
  });

  it("refuses while a payment is in flight", () => {
    // The customer may be on the card page paying the old amount; settlement
    // matches on that figure.
    expect(canChangeOrderQuantity({ ...ok, paymentInFlight: true }, 10)).toEqual({
      ok: false,
      reason: "payment_in_flight",
    });
  });

  it("refuses while a discount code is attached", () => {
    // It was quoted against the old total, and its cap applied to that figure.
    expect(canChangeOrderQuantity({ ...ok, hasDiscountCode: true }, 10)).toEqual({
      ok: false,
      reason: "discount_applied",
    });
  });

  it("refuses a quantity that is not a whole number of entries", () => {
    for (const q of [0, -1, -100, 1.5, 0.9, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(canChangeOrderQuantity(ok, q)).toEqual({ ok: false, reason: "invalid_quantity" });
    }
  });

  it("refuses values that are not numbers at all", () => {
    for (const q of [null, undefined, "", "abc", {}, [], true]) {
      expect(canChangeOrderQuantity(ok, q)).toEqual({ ok: false, reason: "invalid_quantity" });
    }
  });

  it("accepts a numeric string, because that is what a form sends", () => {
    expect(canChangeOrderQuantity(ok, "20")).toEqual({ ok: true, quantity: 20 });
  });

  it("says so when the quantity has not actually changed", () => {
    // Saves a pointless write and a pointless reprice.
    expect(canChangeOrderQuantity(ok, 5)).toEqual({ ok: false, reason: "unchanged" });
    expect(canChangeOrderQuantity(ok, "5")).toEqual({ ok: false, reason: "unchanged" });
  });

  it("checks ownership before status, and status before the rest", () => {
    // An order that is someone else's AND completed AND code-locked still
    // answers "not yours": the least informative true answer.
    const hostile: OrderEditState = {
      ...ok,
      ownedByRequester: false,
      status: "completed",
      hasDiscountCode: true,
      paymentInFlight: true,
    };
    expect(canChangeOrderQuantity(hostile, 10)).toEqual({ ok: false, reason: "not_yours" });
  });

  it("reports payment in flight ahead of a discount, since it is the harder stop", () => {
    expect(
      canChangeOrderQuantity({ ...ok, paymentInFlight: true, hasDiscountCode: true }, 10),
    ).toEqual({ ok: false, reason: "payment_in_flight" });
  });

  it("does not let a large quantity through on its own say-so", () => {
    // Competition limits are assertCanPurchaseTickets' job; this only agrees
    // the order itself is editable.
    expect(canChangeOrderQuantity(ok, 100000)).toEqual({ ok: true, quantity: 100000 });
  });
});

describe("editRefusalMessage", () => {
  const reasons: EditRefusal[] = [
    "not_found", "not_yours", "not_pending", "already_issued",
    "payment_in_flight", "discount_applied", "invalid_quantity", "unchanged",
  ];

  it("has something to say for every reason", () => {
    for (const r of reasons) expect(editRefusalMessage(r).length).toBeGreaterThan(0);
  });

  it("does not tell a stranger whether the order exists", () => {
    expect(editRefusalMessage("not_yours")).toBe(editRefusalMessage("not_found"));
  });

  it("tells someone with a code what to do about it", () => {
    expect(editRefusalMessage("discount_applied")).toMatch(/remove/i);
  });
});

describe("editRefusalStatus", () => {
  it("answers 404 for anything the caller should not be able to see", () => {
    expect(editRefusalStatus("not_found")).toBe(404);
    expect(editRefusalStatus("not_yours")).toBe(404);
  });

  it("answers 400 for the rest", () => {
    for (const r of ["not_pending", "already_issued", "payment_in_flight",
                     "discount_applied", "invalid_quantity", "unchanged"] as EditRefusal[]) {
      expect(editRefusalStatus(r)).toBe(400);
    }
  });
});
