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
import {
  capFromLimit,
  overLimitLines,
  type TicketLimitInfo,
  type TicketLimitMap,
} from "@/lib/ticket-limit-info";

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

  // Per-person limits for everything in the basket, in one request rather
  // than one per line. Without these the basket's pickers would happily go to
  // 500 on a competition limited to 2, and the customer would only be told at
  // checkout.
  const ids = useMemo(
    () => Array.from(new Set(items.map((item) => item.competitionId))).sort(),
    [items],
  );

  const { data: limits } = useQuery<TicketLimitMap>({
    queryKey: ["/api/ticket-limits", ids.join(",")],
    queryFn: async () => {
      const response = await fetch(`/api/ticket-limits?ids=${encodeURIComponent(ids.join(","))}`, {
        credentials: "include",
      });
      if (!response.ok) return {};
      return response.json();
    },
    enabled: ids.length > 0,
    staleTime: 30_000,
  });

  const limitMap: TicketLimitMap = limits ?? {};

  const limitFor = (competitionId: string): TicketLimitInfo | undefined => limitMap[competitionId];
  const capFor = (competitionId: string, globalMax = 500) =>
    capFromLimit(limitMap[competitionId], globalMax);

  // A basket outlives the page it was filled on, so quantities can be stale:
  // an admin lowers a limit, or the account buys the same competition
  // elsewhere. Correct them here, once the limits are known, so the basket
  // never shows more than the customer can actually buy.
  const [clamped, setClamped] = useState<{ title?: string; to: number }[]>([]);

  useEffect(() => {
    const over = overLimitLines(items, limitMap);
    if (!over.length) return;
    for (const line of over) setBasketQty(line.competitionId, line.to);
    setClamped(over.map((line) => ({ title: line.title, to: line.to })));
  }, [items, limits]);

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
    limits: limitMap,
    limitFor,
    capFor,
    /** Lines the basket reduced by itself, so the page can explain why. */
    clamped,
    clearClamped: () => setClamped([]),
    add: addToBasket,
    setQty: setBasketQty,
    remove: removeFromBasket,
    clear: clearBasket,
  };
}
