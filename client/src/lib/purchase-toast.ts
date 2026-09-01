import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { cardCashbackAmount } from "@shared/card-cashback";

type ToastFn = (opts: {
  variant?: "default" | "destructive" | "success";
  title?: string;
  description?: string;
  duration?: number;
  cashback?: number;
}) => unknown;

const QUEUE_KEY = "rr-purchase-toast";
const GENERIC_PURCHASE_COPY =
  /purchase (is )?complete|purchase completed|successful|instant play|tickets have been|tickets are ready|tickets have been issued/i;

function copyForType(orderType?: string, wheelType?: string) {
  switch (orderType) {
    case "scratch":
      return {
        title: "You're in",
        description: "Your cards are ready — scratch to reveal.",
      };
    case "pop":
      return {
        title: "You're in",
        description: "Your pops are live. Burst them.",
      };
    case "spin":
      return {
        title: "You're in",
        description:
          wheelType === "wheel2"
            ? "Your retro spins are live. Hit the wheel."
            : "Your spins are locked in. Take the wheel.",
      };
    case "plinko":
      return {
        title: "You're in",
        description: "Your drops are ready. Let it fall.",
      };
    case "voltz":
      return {
        title: "You're in",
        description: "You're charged up. Play now.",
      };
    case "slot":
      return {
        title: "You're in",
        description: "The reels are waiting. Spin now.",
      };
    case "royal":
      return {
        title: "You're in",
        description: "The reels are yours. Play now.",
      };
    case "competition":
      return {
        title: "You're entered",
        description: "Your tickets are locked in the draw.",
      };
    default:
      return {
        title: "You're in",
        description: "Your purchase is locked in. Play now.",
      };
  }
}

function queuePurchaseToast(orderType?: string, wheelType?: string, cardSpend?: number) {
  try {
    sessionStorage.setItem(
      QUEUE_KEY,
      JSON.stringify({
        orderType: orderType || "competition",
        wheelType: wheelType || null,
        cardSpend: cardSpend || 0,
        at: Date.now(),
      }),
    );
  } catch {
    // ignore
  }
}

function presentPurchaseToast(
  toast: ToastFn,
  orderType?: string,
  serverMessage?: string,
  wheelType?: string,
  cardSpend?: number,
) {
  const copy = copyForType(orderType, wheelType);
  const useServer =
    Boolean(serverMessage) && !GENERIC_PURCHASE_COPY.test(serverMessage || "");
  const cashback = cardCashbackAmount(cardSpend || 0);

  toast({
    variant: "success",
    title: copy.title,
    description: useServer ? serverMessage : copy.description,
    duration: cashback >= 0.01 ? 12000 : 9000,
    cashback,
  });
}

export function showPurchaseSuccessToast(
  toast: ToastFn,
  orderType?: string,
  serverMessage?: string,
  wheelType?: string,
  cardSpend?: number,
) {
  queuePurchaseToast(orderType, wheelType, cardSpend);
  presentPurchaseToast(toast, orderType, serverMessage, wheelType, cardSpend);
}

export function consumeQueuedPurchaseToast(
  toast: ToastFn,
  opts?: { wheelType?: string },
) {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    if (!raw) return false;
    sessionStorage.removeItem(QUEUE_KEY);
    const data = JSON.parse(raw) as {
      orderType?: string;
      wheelType?: string | null;
      cardSpend?: number;
      at?: number;
    };
    if (!data?.at || Date.now() - data.at > 10 * 60 * 1000) return false;
    presentPurchaseToast(
      toast,
      data.orderType,
      undefined,
      opts?.wheelType || data.wheelType || undefined,
      data.cardSpend,
    );
    return true;
  } catch {
    return false;
  }
}

export function usePurchaseArrivalToast(wheelType?: string, ready = true) {
  const { toast } = useToast();
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current || !ready) return;
    shownRef.current = consumeQueuedPurchaseToast(toast, { wheelType });
  }, [toast, wheelType, ready]);
}
