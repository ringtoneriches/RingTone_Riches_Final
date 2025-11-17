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
      const orderId = urlParams.get("orderId"); // ✅ NEW

      console.log("🔍 Success Page Query:", {
        paymentJobRef,
        paymentRef,
        orderId,
      });

      // ⭐ Must include orderId when confirming:
      if (paymentJobRef && paymentRef && orderId) {
        try {
          const res = await apiRequest("/api/payment-success/competition", "POST", {
            paymentJobRef,
            paymentRef,
            orderId,   // ✅ SEND IT TO BACKEND
          });

          const data = await res.json();
          console.log(data)
          if (data.success) {
            toast({
              title: "Payment Successful",
              description: "Your tickets have been issued!",
            });

            // Refresh relevant data
            queryClient.invalidateQueries({ queryKey: ["/api/user/tickets"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });

           let redirectUrl = `/competition/${data.competitionId}`;

              if (data.competitionType === "spin") {
                redirectUrl = `/spin/${data.competitionId}/${data.orderId}`;
              } else if (data.competitionType === "scratch") {
                redirectUrl = `/scratch/${data.competitionId}/${data.orderId}`;
              }


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
      }

      // Wallet-only case: user is not redirected from Cashflows
      else if (orderId && !paymentJobRef && !paymentRef) {
        setIsProcessing(false);

        toast({
          title: "Purchase Successful! 🎉",
          description: "Your tickets have been added to your account!",
        });

        queryClient.invalidateQueries({ queryKey: ["/api/user/tickets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });

        setTimeout(() => setLocation("/wallet"), 2500);
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
