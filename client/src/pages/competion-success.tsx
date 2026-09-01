import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { takeCartCheckoutFlag, clearBasket } from "@/lib/basket";
import PaymentResult from "@/components/billing/PaymentResult";
import { showPurchaseSuccessToast } from "@/lib/purchase-toast";
import { waitConfirmScreen } from "@/lib/confirm-screen";
import { cardCashbackAmount } from "@shared/card-cashback";

export default function CheckoutSuccess() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(true);
  const [failed, setFailed] = useState(false);
  const [fromCart, setFromCart] = useState(false);
  const [cashback, setCashback] = useState(0);

  useEffect(() => {
    const confirmPayment = async () => {
      const shownAt = Date.now();
      const urlParams = new URLSearchParams(window.location.search);

      const paymentJobRef = urlParams.get("paymentjobref");
      const paymentRef = urlParams.get("paymentref");
      const orderId = urlParams.get("orderId");

      if (orderId && !paymentJobRef && !paymentRef) {
        setIsProcessing(false);
        showPurchaseSuccessToast(toast, "competition");
        queryClient.invalidateQueries({ queryKey: ["/api/user/tickets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
        setTimeout(() => setLocation("/wallet"), 2500);
        return;
      }

      if (!paymentJobRef || !orderId) {
        setFailed(true);
        setIsProcessing(false);
        return;
      }

      const finishSuccess = async (data: any) => {
        const cardSpend = Number(data.cardSpend || data.totalAmount) || 0;
        const creditedBack = cardCashbackAmount(cardSpend);
        setCashback(creditedBack);
        showPurchaseSuccessToast(toast, data.competitionType || "competition", undefined, data.wheelType, cardSpend || undefined);
        queryClient.invalidateQueries({ queryKey: ["/api/user/tickets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });

        let redirectUrl = `/competition/${data.competitionId}`;
        switch (data.competitionType) {
          case "spin":
            redirectUrl = `/spin/${data.competitionId}/${data.orderId}`;
            break;
          case "scratch":
            redirectUrl = `/scratch/${data.competitionId}/${data.orderId}`;
            break;
          case "pop":
            redirectUrl = `/pop/${data.competitionId}/${data.orderId}`;
            break;
          case "plinko":
            redirectUrl = `/plinko/${data.competitionId}/${data.orderId}`;
            break;
          case "slot":
            redirectUrl = `/slot/${data.competitionId}/${data.orderId}`;
            break;
          case "voltz":
            redirectUrl = `/voltz/${data.competitionId}/${data.orderId}`;
            break;
          case "royal":
            redirectUrl = `/royal/${data.competitionId}/${data.orderId}`;
            break;
        }

        const isCartCombo = urlParams.get("cart") === "1" || data.cart;
        const cartCheckout = takeCartCheckoutFlag() || isCartCombo;
        if (cartCheckout) clearBasket();
        setFromCart(Boolean(isCartCombo));
        await waitConfirmScreen(shownAt);
        setIsProcessing(false);
        setTimeout(() => setLocation(isCartCombo ? "/my-plays" : redirectUrl), creditedBack >= 0.01 ? 3200 : 1400);
      };

      for (let attempt = 0; attempt < 12; attempt += 1) {
        try {
          const res = await apiRequest("/api/payment-success/competition", "POST", {
            paymentJobRef,
            paymentRef,
            orderId,
          });
          const data = await res.json();
          if (res.status === 200 && data.success && !data.waitingForWebhook) {
            await finishSuccess(data);
            return;
          }
        } catch (err: any) {
          const message = String(err?.message || "");
          if (message.includes("401") || message.includes("Unauthorized")) {
            try {
              const guestRes = await apiRequest("/api/guest/confirm-payment", "POST", {
                paymentJobRef,
                paymentRef,
                orderId,
              });
              const guestData = await guestRes.json();
              if (guestRes.status === 200 && guestData.success) {
                showPurchaseSuccessToast(toast, guestData.competitionType || "competition", undefined, guestData.wheelType);
                await waitConfirmScreen(shownAt);
                setIsProcessing(false);
                setTimeout(() => setLocation(`/guest-billing/${orderId}`), 1400);
                return;
              }
            } catch {
              // keep polling
            }
          } else if (message.includes("400") || message.includes("402")) {
            setFailed(true);
            setIsProcessing(false);
            return;
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      setFailed(true);
      setIsProcessing(false);
    };

    confirmPayment();
  }, [setLocation, toast, queryClient]);

  if (failed) {
    return (
      <PaymentResult
        kicker="Checkout · confirm"
        title="COULD NOT CONFIRM"
        message="We could not confirm that payment yet. If you were charged, your tickets will still appear on My Plays shortly."
        variant="failed"
        actionLabel="Go to My Plays"
        onAction={() => setLocation("/my-plays")}
      />
    );
  }

  return isProcessing ? (
    <PaymentResult
      kicker="Checkout · confirm"
      title="CONFIRMING"
      message="Hold on — we’re locking in your tickets."
      variant="processing"
    />
  ) : (
    <PaymentResult
      kicker="Checkout · confirmed"
      title="CONFIRMED"
      message={
        fromCart
          ? "You’re in. Taking you to My Plays."
          : "Your tickets are ready. Taking you to play."
      }
      variant="success"
      cashback={cashback}
    />
  );
}
