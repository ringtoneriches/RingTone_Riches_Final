import { describe, expect, it } from "vitest";
import { effectiveTicketPrice, flashSaleState } from "../../shared/flash-sale";

const NOW = new Date("2026-09-12T12:00:00Z");
const comp = (overrides: Record<string, unknown> = {}) => ({
  ticketPrice: "0.99",
  flashSalePrice: "0.50",
  flashSaleStartsAt: "2026-09-12T11:00:00Z",
  flashSaleEndsAt: "2026-09-12T13:00:00Z",
  ...overrides,
});

describe("flashSaleState", () => {
  it("uses the sale price while the sale is running", () => {
    const state = flashSaleState(comp(), NOW);
    expect(state).toMatchObject({ price: 0.5, basePrice: 0.99, isLive: true, percentOff: 49 });
    expect(state.endsAt?.toISOString()).toBe("2026-09-12T13:00:00.000Z");
  });

  it("uses the normal price before the sale starts", () => {
    const state = flashSaleState(comp({ flashSaleStartsAt: "2026-09-12T18:00:00Z" }), NOW);
    expect(state.price).toBe(0.99);
    expect(state.isLive).toBe(false);
  });

  it("returns to the normal price the moment the sale ends", () => {
    const endsAt = "2026-09-12T12:00:00Z"; // exactly now
    expect(flashSaleState(comp({ flashSaleEndsAt: endsAt }), NOW).isLive).toBe(false);
    expect(effectiveTicketPrice(comp({ flashSaleEndsAt: endsAt }), NOW)).toBe(0.99);
    // one second earlier it is still live
    const stillLive = new Date("2026-09-12T11:59:59Z");
    expect(flashSaleState(comp({ flashSaleEndsAt: endsAt }), stillLive).isLive).toBe(true);
  });

  it("treats a missing end time as no sale, so pricing can never stick", () => {
    expect(flashSaleState(comp({ flashSaleEndsAt: null }), NOW).price).toBe(0.99);
  });

  it("starts immediately when no start time is set", () => {
    expect(flashSaleState(comp({ flashSaleStartsAt: null }), NOW).isLive).toBe(true);
  });

  it("ignores a sale price that is not cheaper, or is nonsense", () => {
    expect(flashSaleState(comp({ flashSalePrice: "0.99" }), NOW).price).toBe(0.99);
    expect(flashSaleState(comp({ flashSalePrice: "1.50" }), NOW).price).toBe(0.99);
    expect(flashSaleState(comp({ flashSalePrice: "-1" }), NOW).price).toBe(0.99);
    expect(flashSaleState(comp({ flashSalePrice: "abc" }), NOW).price).toBe(0.99);
    expect(flashSaleState(comp({ flashSaleEndsAt: "not-a-date" }), NOW).price).toBe(0.99);
  });

  it("allows a free sale price", () => {
    expect(flashSaleState(comp({ flashSalePrice: "0" }), NOW)).toMatchObject({ price: 0, isLive: true });
  });

  it("falls back safely for missing competitions or prices", () => {
    expect(effectiveTicketPrice(null, NOW)).toBe(0);
    expect(effectiveTicketPrice({ ticketPrice: null }, NOW)).toBe(0);
    expect(effectiveTicketPrice({ ticketPrice: "2.00" }, NOW)).toBe(2);
  });
});
