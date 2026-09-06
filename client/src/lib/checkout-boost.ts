import type { BasketItem } from "@/lib/basket";
import { lineTotal } from "@/lib/ticket-price";
import { playUnitLabel } from "@/lib/play-paths";

export type CheckoutBoostOffer = {
  id: string;
  competitionId: string;
  type: string;
  title: string;
  imageUrl?: string;
  extraQty: number;
  newQty: number;
  extraCost: number;
  newTotal: number;
  unitLabel: string;
};

const MAX_QTY = 500;
const MAX_EXTRA = 6;
const MAX_EXTRA_COST = 6;

function money(value: number) {
  return Math.round(value * 100) / 100;
}

export function cartPayTotal(items: BasketItem[]) {
  return money(
    items.reduce((sum, item) => sum + lineTotal(item.ticketPrice, item.quantity, item.type).discountedPrice, 0),
  );
}

function pickBoostItem(items: BasketItem[]) {
  return (
    items.find((item) =>
      ["spin", "scratch", "pop", "plinko", "voltz", "slot", "royal"].includes((item.type || "").toLowerCase()),
    ) || items[0]
  );
}

export function buildCheckoutBoostOffers(items: BasketItem[], currentTotal = cartPayTotal(items)): CheckoutBoostOffer[] {
  if (!items.length) return [];
  const item = pickBoostItem(items);
  if (!item) return [];

  const currentLine = lineTotal(item.ticketPrice, item.quantity, item.type).discountedPrice;
  const candidates: CheckoutBoostOffer[] = [];

  for (let extra = 1; extra <= MAX_EXTRA; extra += 1) {
    const newQty = item.quantity + extra;
    if (newQty > MAX_QTY) break;
    const nextLine = lineTotal(item.ticketPrice, newQty, item.type).discountedPrice;
    const extraCost = money(nextLine - currentLine);
    if (extraCost < 0.01 || extraCost > MAX_EXTRA_COST) continue;
    candidates.push({
      id: `${item.competitionId}-${extra}`,
      competitionId: item.competitionId,
      type: item.type,
      title: item.title,
      imageUrl: item.imageUrl,
      extraQty: extra,
      newQty,
      extraCost,
      newTotal: money(currentTotal + extraCost),
      unitLabel: playUnitLabel(item.type, extra),
    });
  }

  if (candidates.length <= 3) return candidates;

  const picked: CheckoutBoostOffer[] = [];
  const take = (offer?: CheckoutBoostOffer) => {
    if (!offer || picked.some((row) => row.id === offer.id)) return;
    picked.push(offer);
  };

  take(candidates[0]);

  const nextPound = Math.ceil(currentTotal + 0.009);
  const rounded = candidates.find((offer) => Math.abs(offer.newTotal - nextPound) <= 0.02 && offer.extraQty > 1);
  take(rounded);

  const mid = candidates[Math.min(2, candidates.length - 1)];
  take(mid);
  take(candidates[candidates.length - 1]);

  return picked.slice(0, 3).sort((a, b) => a.extraQty - b.extraQty);
}
