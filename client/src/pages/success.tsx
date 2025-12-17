import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

export default function WalletSuccess() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState("Processing your payment...");

  useEffect(() => {
    const confirmPayment = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const paymentJobRef = searchParams.get("paymentjobref");
      const paymentRef = searchParams.get("paymentref");

      if (!paymentJobRef || !paymentRef) {
        setStatusMessage("Missing payment confirmation information.");
        return;
      }

      let attempts = 0;
      const maxAttempts = 10; // try for 10 times (~15s)
      const pollInterval = 1500; // 1.5 seconds

      while (attempts < maxAttempts) {
        attempts += 1;

        try {
          const res = await apiRequest("/api/wallet/confirm-topup", "POST", {
            paymentJobRef,
            paymentRef,
          });

          const data = await res.json();

          if (res.status === 200) {
            toast({
              title: "Payment Received",
              description: data.message || "Your wallet has been topped up!",
            });

            // Refresh user balance & transactions
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });

            setStatusMessage("Wallet successfully updated! Redirecting...");
            setTimeout(() => (window.location.href = "/wallet"), 1500);
            return;
          } else if (res.status === 202) {
            setStatusMessage(data.message || "Payment is processing. Please wait...");
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
          } else {
            toast({
              title: "Payment Error",
              description: data.message || "Could not confirm payment",
              variant: "destructive",
            });
            setStatusMessage("Payment failed or cancelled.");
            return;
          }
        } catch (err: any) {
          toast({
            title: "Error",
            description: err.message || "Failed to confirm payment",
            variant: "destructive",
          });
          setStatusMessage("Error confirming payment.");
          return;
        }
      }

      // If max attempts reached
      setStatusMessage("Payment is taking longer than expected. It will update shortly.");
    };

    confirmPayment();
  }, [queryClient, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">{statusMessage}</h1>
        <p>Please wait a moment while we confirm your wallet top-up.</p>
      </div>
    </div>
  );
}
