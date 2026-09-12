/**
 * Flash sale pricing.
 *
 * Deliberately pure and dependency-free: the server charges with it and the client
 * displays with it, so the card price, checkout total and transaction can never
 * disagree. A sale needs an end time, so pricing always returns to normal on its own.
 */

export type FlashSaleFields = {
  ticketPrice: string | number | null;
  flashSalePrice?: string | number | null;
  flashSaleStartsAt?: Date | string | null;
  flashSaleEndsAt?: Date | string | null;
};

export type FlashSaleState = {
  /** Price to charge and show right now. */
  price: number;
  /** Normal price — shown struck through while a sale is live. */
  basePrice: number;
  isLive: boolean;
  /** When the live sale ends; null when no sale is running. */
  endsAt: Date | null;
  /** Rounded percentage off, for badges. 0 when no sale is live. */
  percentOff: number;
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function flashSaleState(
  competition: FlashSaleFields | null | undefined,
  now: Date = new Date(),
): FlashSaleState {
  const basePrice = Math.max(0, toNumber(competition?.ticketPrice) ?? 0);
  const salePrice = toNumber(competition?.flashSalePrice);
  const startsAt = toDate(competition?.flashSaleStartsAt);
  const endsAt = toDate(competition?.flashSaleEndsAt);

  const noSale: FlashSaleState = {
    price: basePrice,
    basePrice,
    isLive: false,
    endsAt: null,
    percentOff: 0,
  };

  // A sale must undercut the normal price and have an end time it can expire at.
  if (salePrice === null || salePrice < 0 || salePrice >= basePrice) return noSale;
  if (!endsAt || endsAt.getTime() <= now.getTime()) return noSale;
  if (startsAt && startsAt.getTime() > now.getTime()) return noSale;

  return {
    price: salePrice,
    basePrice,
    isLive: true,
    endsAt,
    percentOff: basePrice > 0 ? Math.round(((basePrice - salePrice) / basePrice) * 100) : 0,
  };
}

/** Price to charge right now, in pounds. */
export function effectiveTicketPrice(
  competition: FlashSaleFields | null | undefined,
  now: Date = new Date(),
): number {
  return flashSaleState(competition, now).price;
}
