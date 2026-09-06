export type BasketItem = {
  competitionId: string;
  type: string;
  title: string;
  imageUrl?: string;
  ticketPrice: string;
  quantity: number;
  wheelType?: string | null;
};

const STORAGE_KEY = "rr-basket-v1";
const EVENT = "rr-basket-changed";
export const CART_CHECKOUT_FLAG = "rr-cart-checkout";

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

export function readBasket(): BasketItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBasket(items: BasketItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  emit();
}

export function basketCount(items = readBasket()) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function addToBasket(item: BasketItem, maxQty = 500) {
  const items = readBasket();
  const existing = items.find((row) => row.competitionId === item.competitionId);
  if (existing) {
    existing.quantity = Math.min(maxQty, existing.quantity + item.quantity);
    existing.title = item.title;
    existing.imageUrl = item.imageUrl;
    existing.ticketPrice = item.ticketPrice;
    existing.type = item.type;
    existing.wheelType = item.wheelType;
  } else {
    items.push({ ...item, quantity: Math.min(maxQty, Math.max(1, item.quantity)) });
  }
  writeBasket(items);
  return items;
}

export function setBasketQty(competitionId: string, quantity: number) {
  const items = readBasket()
    .map((item) =>
      item.competitionId === competitionId
        ? { ...item, quantity: Math.max(1, quantity) }
        : item
    )
    .filter((item) => item.quantity > 0);
  writeBasket(items);
  return items;
}

export function removeFromBasket(competitionId: string) {
  writeBasket(readBasket().filter((item) => item.competitionId !== competitionId));
}

export function clearBasket() {
  writeBasket([]);
}

export function subscribeBasket(listener: () => void) {
  const onChange = () => listener();
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function markCartCheckout() {
  localStorage.setItem(CART_CHECKOUT_FLAG, "1");
}

export function takeCartCheckoutFlag() {
  const flagged = localStorage.getItem(CART_CHECKOUT_FLAG) === "1";
  if (flagged) localStorage.removeItem(CART_CHECKOUT_FLAG);
  return flagged;
}
