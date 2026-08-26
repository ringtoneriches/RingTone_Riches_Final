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
