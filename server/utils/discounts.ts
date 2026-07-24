// server/utils/discounts.ts

// NEW DISCOUNTS - Max 15 plays, 15% max discount
export const TICKET_DISCOUNTS: Record<number, number> = {
  5: 0.05,   // 5% off for 5 plays
  10: 0.10,  // 10% off for 10 plays
  15: 0.15,  // 15% off for 15 plays (maximum)
};

export function generateRandomCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateBulkCodes(
  count: number,
  options: {
    prefix?: string;
    suffix?: string;
    length?: number;
    type: "cash" | "points" | "percentage";
    value: number;
    maxUses: number;
    expiresAt?: string;
  }
): Array<{
  code: string;
  type: "cash" | "points" | "percentage";
  value: number;
  maxUses: number;
  expiresAt?: string;
}> {
  const codes = [];
  const usedCodes = new Set<string>();

  for (let i = 0; i < count; i++) {
    let code: string;
    let attempts = 0;
    
    do {
      const randomPart = generateRandomCode(options.length || 8);
      code = `${options.prefix || ''}${randomPart}${options.suffix || ''}`;
      attempts++;
      
      if (attempts > 100) {
        throw new Error('Unable to generate unique codes');
      }
    } while (usedCodes.has(code));

    usedCodes.add(code);
    codes.push({
      code,
      type: options.type,
      value: options.value,
      maxUses: options.maxUses,
      expiresAt: options.expiresAt,
    });
  }

  return codes;
}

export function calculateDiscount(quantity: number): {
  discountPercent: number;
  discountMultiplier: number;
} {
  // Cap quantity at 15 for discount eligibility
  const cappedQuantity = Math.min(quantity, 15);
  
  const sortedTiers = Object.keys(TICKET_DISCOUNTS)
    .map(Number)
    .sort((a, b) => b - a);
  
  let discountPercent = 0;
  for (const tier of sortedTiers) {
    if (cappedQuantity >= tier) {
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
  
  // Only apply discount to first 15 plays, rest at full price
  const discountedPlaysCount = Math.min(quantity, 15);
  const fullPricePlaysCount = Math.max(0, quantity - 15);
  
  const discountedPlaysTotal = (pricePerTicket * discountedPlaysCount) * discountMultiplier;
  const fullPricePlaysTotal = pricePerTicket * fullPricePlaysCount;
  
  const discountedTotal = discountedPlaysTotal + fullPricePlaysTotal;
  const savings = originalTotal - discountedTotal;
  
  return {
    originalTotal: parseFloat(originalTotal.toFixed(2)),
    discountPercent,
    discountedTotal: parseFloat(discountedTotal.toFixed(2)),
    savings: parseFloat(savings.toFixed(2)),
  };
}