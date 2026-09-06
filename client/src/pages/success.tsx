import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PaymentResult, { PaymentResultVariant } from "@/components/billing/PaymentResult";

function variantFromMessage(message: string): PaymentResultVariant {
  if (message.toLowerCase().includes("successfully") || message.toLowerCase().includes("already updated")) {
    return "success";
  }
  if (
    message.toLowerCase().includes("failed") ||
    message.toLowerCase().includes("error") ||
    message.toLowerCase().includes("missing") ||
    message.toLowerCase().includes("cancelled")
  ) {
    return "failed";
  }
  if (message.toLowerCase().includes("taking longer") || message.toLowerCase().includes("still")) {
    return "waiting";
  }
  return "processing";
}

export default function WalletSuccess() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [statusMessage, setStatusMessage] = useState("Processing your payment...");
  const [cashback, setCashback] = useState(0);

  useEffect(() => {
    const confirmPayment = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const paymentJobRef = searchParams.get("paymentjobref");
      const paymentRef = searchParams.get("paymentref");

      if (!paymentJobRef) {
        setStatusMessage("Missing payment confirmation information.");
        return;
      }

      let attempts = 0;
      const maxAttempts = 12;
      const pollInterval = 1500;

      while (attempts < maxAttempts) {
        attempts += 1;

        try {
          const res = await apiRequest("/api/wallet/confirm-topup", "POST", {
            paymentJobRef,
            paymentRef,
          });

          const data = await res.json();

          if (res.status === 200 && data.credited) {
            const creditedBack = Number(data.cashback) || 0;
            setCashback(creditedBack);
            toast({
              variant: "success",
              title: "Wallet topped up",
              description: "Your balance is ready to play.",
              duration: creditedBack >= 0.01 ? 12000 : 9000,
              cashback: creditedBack,
            });

            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });

            setStatusMessage("Wallet successfully updated! Redirecting...");
            setTimeout(() => (window.location.href = "/wallet"), creditedBack >= 0.01 ? 3200 : 1500);
            return;
          }

          if (res.status === 202 || !data.credited) {
            setStatusMessage(data.message || "Payment is processing. Please wait...");
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            continue;
          }

          toast({
            title: "Payment Error",
            description: data.message || "Could not confirm payment",
            variant: "destructive",
          });
          setStatusMessage("Payment failed or cancelled.");
          return;
        } catch (err: any) {
          const text = String(err?.message || "");
          if (text.includes("402")) {
            setStatusMessage("Payment failed or cancelled.");
            toast({
              title: "Payment failed",
              description: "Your card was not charged.",
              variant: "destructive",
            });
            return;
          }
          if (attempts < maxAttempts) {
            setStatusMessage("Still confirming your payment...");
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            continue;
          }
          toast({
            title: "Error",
            description: err.message || "Failed to confirm payment",
            variant: "destructive",
          });
          setStatusMessage("Error confirming payment.");
          return;
        }
      }

      setStatusMessage("Payment is taking longer than expected. Check your wallet in a minute — if the balance is missing, contact support.");
    };

    confirmPayment();
  }, [queryClient, toast]);

  const variant = variantFromMessage(statusMessage);

  return (
    <PaymentResult
      kicker="Wallet · top-up"
      title={
        variant === "success"
          ? "PAYMENT RECEIVED"
          : variant === "failed"
            ? "PAYMENT ISSUE"
            : variant === "waiting"
              ? "STILL CONFIRMING"
              : "CONFIRMING"
      }
      message={statusMessage}
      variant={variant}
      cashback={variant === "success" ? cashback : 0}
      actionLabel={variant === "failed" || variant === "waiting" ? "Back to wallet" : undefined}
      onAction={
        variant === "failed" || variant === "waiting" ? () => setLocation("/wallet") : undefined
      }
    />
  );
}
