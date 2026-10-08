const TICKET_DISCOUNTS: Record<number, number> = {
  5: 0.05,
  10: 0.1,
  15: 0.15,
};

const GAME_TYPES = ["spin", "scratch", "pop", "plinko", "voltz", "slot", "royal"];

export function isPlayableGameType(type?: string) {
  return GAME_TYPES.includes((type || "").toLowerCase());
}

export function lineTotal(ticketPrice: string | number, quantity: number, type?: string) {
  const price = typeof ticketPrice === "number" ? ticketPrice : parseFloat(ticketPrice || "0");
  const qty = Math.max(1, quantity);
  if (!isPlayableGameType(type)) {
    const total = price * qty;
    return { originalPrice: total, discountedPrice: total, discountPercent: 0, savings: 0 };
  }

  const originalPrice = price * qty;
  const cappedQuantity = Math.min(qty, 15);
  const sortedTiers = Object.keys(TICKET_DISCOUNTS).map(Number).sort((a, b) => b - a);
  let discountPercent = 0;
  for (const tier of sortedTiers) {
    if (cappedQuantity >= tier) {
      discountPercent = TICKET_DISCOUNTS[tier];
      break;
    }
  }

  const discountedPlaysPrice = price * Math.min(qty, 15) * (1 - discountPercent);
  const fullPricePlays = qty > 15 ? price * (qty - 15) : 0;
  const discountedPrice = discountedPlaysPrice + fullPricePlays;

  return {
    originalPrice: parseFloat(originalPrice.toFixed(2)),
    discountedPrice: parseFloat(discountedPrice.toFixed(2)),
    discountPercent: discountPercent * 100,
    savings: parseFloat((originalPrice - discountedPrice).toFixed(2)),
  };
}

/**
 * The next bundle tier worth nudging someone towards, or null.
 *
 * The buy box used to open on a single play with the bundles hidden below the
 * fold, and single-play purchases doubled to 37.6% of orders while baskets of
 * 15+ halved. Telling someone they are two entries away from a better rate is
 * worth more than a discount they never see.
 *
 * Returns null once the tiers run out, which currently means any quantity at
 * or above the largest tier -- there is nothing truthful left to offer.
 */
export function nextBundleTier(
  quantity: number,
  pricePerTicket: number,
): { at: number; add: number; percent: number; saves: number } | null {
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));
  const price = Number(pricePerTicket) || 0;
  if (price <= 0) return null;

  const tiers = Object.keys(TICKET_DISCOUNTS)
    .map(Number)
    .sort((a, b) => a - b);

  const next = tiers.find((t) => t > qty);
  if (next === undefined) return null;

  // What they would save at the tier, against paying full price for it.
  const percent = TICKET_DISCOUNTS[next] * 100;
  const saves = Math.round(price * next * TICKET_DISCOUNTS[next] * 100) / 100;
  if (saves <= 0) return null;

  return { at: next, add: next - qty, percent, saves };
}
