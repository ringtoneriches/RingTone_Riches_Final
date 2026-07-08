// server/utils/discounts.ts

export const TICKET_DISCOUNTS: Record<number, number> = {
  5: 0.10,  // 10% off for 5 tickets
  10: 0.15, // 15% off for 10 tickets
  15: 0.20, // 20% off for 15 tickets
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