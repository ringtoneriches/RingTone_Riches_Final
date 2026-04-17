import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";

export default function CheckoutSuccess() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const confirmPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);

      const paymentJobRef = urlParams.get("paymentjobref");
      const paymentRef = urlParams.get("paymentref");
      const orderId = urlParams.get("orderId");

      // ✅ Wallet-only case (no Cashflows redirect)
      if (orderId && !paymentJobRef && !paymentRef) {
        setIsProcessing(false);

        toast({
          title: "Purchase Successful! 🎉",
          description: "Your tickets have been added to your account!",
        });

        queryClient.invalidateQueries({ queryKey: ["/api/user/tickets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });

        setTimeout(() => setLocation("/wallet"), 2500);
        return;
      }

      // ✅ Cashflows redirect: include delay for FB in-app browser
      if (paymentJobRef && paymentRef && orderId) {
        // Delay to ensure webhook has time to process first
        setTimeout(async () => {
          try {
            const res = await apiRequest("/api/payment-success/competition", "POST", {
              paymentJobRef,
              paymentRef,
              orderId,
            });

            const data = await res.json();

            if (data.success) {
              toast({
                title: "Payment Successful",
                description: "Your tickets have been issued!",
              });

              // Refresh relevant queries
              queryClient.invalidateQueries({ queryKey: ["/api/user/tickets"] });
              queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });

              // Determine redirect URL based on competition type
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
                case "voltz":
                  redirectUrl = `/voltz/${data.competitionId}/${data.orderId}`;
                  break;
              }

              // Small delay before redirect for UX
              setTimeout(() => setLocation(redirectUrl), 2000);
            } else {
              toast({
                title: "Error",
                description: data.message || "Failed to confirm payment.",
                variant: "destructive",
              });
            }
          } catch (err: any) {
            toast({
              title: "Error",
              description: err.message || "Payment confirmation failed.",
              variant: "destructive",
            });
          }
        }, 5000); // 2s delay for webhook
      }
    };

    confirmPayment();
  }, [setLocation, toast, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-black to-zinc-900">
      <div className="text-center max-w-md mx-auto p-8">
        {isProcessing ? (
          <>
            <div className="animate-spin w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h1 className="text-3xl font-bold mb-4 text-yellow-400">Processing your payment...</h1>
            <p className="text-gray-300">Please wait while we confirm your purchase.</p>
          </>
        ) : (
          <>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4 text-green-400">Payment Successful!</h1>
            <p className="text-gray-300 mb-4">Your tickets have been added to your account.</p>
            <p className="text-sm text-gray-400">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}
