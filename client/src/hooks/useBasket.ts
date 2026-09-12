import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { effectiveTicketPrice, type FlashSaleFields } from "@shared/flash-sale";
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

type PricedCompetition = FlashSaleFields & { id: string };

export function useBasket() {
  const [items, setItems] = useState<BasketItem[]>(() =>
    typeof window === "undefined" ? [] : readBasket()
  );

  useEffect(() => subscribeBasket(() => setItems(readBasket())), []);

  // Prices are copied into the basket when an item is added, so a flash sale starting or
  // ending afterwards would leave a stale price on screen. The server always charges the
  // live price, so re-price against it here and the basket can never disagree with checkout.
  const { data: liveCompetitions } = useQuery<PricedCompetition[]>({
    queryKey: ["/api/competitions"],
    enabled: items.length > 0,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const pricedItems = useMemo(() => {
    if (!liveCompetitions?.length) return items;
    const live = new Map(liveCompetitions.map((competition) => [competition.id, competition]));

    return items.map((item) => {
      const competition = live.get(item.competitionId);
      if (!competition) return item;

      const price = effectiveTicketPrice(competition).toFixed(2);
      const basePrice = Number(competition.ticketPrice ?? 0).toFixed(2);
      const onSale = price !== basePrice;

      if (price === item.ticketPrice && (item.basePrice ?? undefined) === (onSale ? basePrice : undefined)) {
        return item;
      }
      return { ...item, ticketPrice: price, basePrice: onSale ? basePrice : undefined };
    });
  }, [items, liveCompetitions]);

  const count = basketCount(pricedItems);
  const totals = useMemo(() => {
    return pricedItems.reduce(
      (acc, item) => {
        const line = lineTotal(item.ticketPrice, item.quantity, item.type);
        acc.original += line.originalPrice;
        acc.pay += line.discountedPrice;
        acc.savings += line.savings;
        return acc;
      },
      { original: 0, pay: 0, savings: 0 }
    );
  }, [pricedItems]);

  return {
    items: pricedItems,
    count,
    totals,
    add: addToBasket,
    setQty: setBasketQty,
    remove: removeFromBasket,
    clear: clearBasket,
  };
}
