// server/utils/discounts.ts

export const TICKET_DISCOUNTS: Record<number, number> = {
  5: 0.10,  // 10% off for 5 tickets
  10: 0.15, // 15% off for 10 tickets
  15: 0.20, // 20% off for 15 tickets
};

export function calculateDiscount(quantity: number): {
  discountPercent: number;
  discountMultiplier: number;
} {
  const sortedTiers = Object.keys(TICKET_DISCOUNTS)
    .map(Number)
    .sort((a, b) => b - a);
  
  let discountPercent = 0;
  for (const tier of sortedTiers) {
    if (quantity >= tier) {
      discountPercent = TICKET_DISCOUNTS[tier];
      break;
    }
  }
  
  return {
    discountPercent: discountPercent * 100,
    discountMultiplier: 1 - discountPercent,
  };
}

export function calculateDiscountedTotal(
  pricePerTicket: number,
  quantity: number
): {
  originalTotal: number;
  discountPercent: number;
  discountedTotal: number;
  savings: number;
} {
  const originalTotal = pricePerTicket * quantity;
  const { discountPercent, discountMultiplier } = calculateDiscount(quantity);
  const discountedTotal = originalTotal * discountMultiplier;
  const savings = originalTotal - discountedTotal;
  
  return {
    originalTotal: parseFloat(originalTotal.toFixed(2)),
    discountPercent,
    discountedTotal: parseFloat(discountedTotal.toFixed(2)),
    savings: parseFloat(savings.toFixed(2)),
  };
}