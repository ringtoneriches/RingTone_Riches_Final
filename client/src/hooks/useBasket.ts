import { useEffect, useMemo, useState } from "react";
import {
  addToBasket,
  basketCount,
  clearBasket,
  readBasket,
  removeFromBasket,
  setBasketQty,
  subscribeBasket,
  type BasketItem,
} from "@/lib/basket";
import { lineTotal } from "@/lib/ticket-price";

export function useBasket() {
  const [items, setItems] = useState<BasketItem[]>(() =>
    typeof window === "undefined" ? [] : readBasket()
  );

  useEffect(() => subscribeBasket(() => setItems(readBasket())), []);

  const count = basketCount(items);
  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const line = lineTotal(item.ticketPrice, item.quantity, item.type);
        acc.original += line.originalPrice;
        acc.pay += line.discountedPrice;
        acc.savings += line.savings;
        return acc;
      },
      { original: 0, pay: 0, savings: 0 }
    );
  }, [items]);

  return {
    items,
    count,
    totals,
    add: addToBasket,
    setQty: setBasketQty,
    remove: removeFromBasket,
    clear: clearBasket,
  };
}
