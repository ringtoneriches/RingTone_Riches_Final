import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";

export default function CheckoutSuccess() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const confirmPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");
      const orderId = urlParams.get("orderId");

      // If there's a session_id, it's a Cashflows payment that needs confirmation
      if (sessionId) {
        try {
          const res = await apiRequest("/api/payment-success/competition", "POST", { sessionId });
          const data = await res.json();

          if (data.success) {
            toast({
              title: "Payment Successful",
              description: "Your tickets have been issued!",
            });

            // 🔁 Refresh competition and user data
            queryClient.invalidateQueries({ queryKey: ["/api/user/tickets"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/competitions", data.competitionId] });

            const redirectUrl = data.competitionId
              ? `/competition/${data.competitionId}`
              : "/account";
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
      // If there's an orderId but no session_id, it's a wallet-only purchase (already complete)
      else if (orderId) {
        setIsProcessing(false);
        toast({
          title: "Purchase Successful! 🎉",
          description: "Your tickets have been added to your account!",
        });

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/user/tickets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

        // Redirect to account after showing success
        setTimeout(() => setLocation("/account"), 2500);
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
            <p className="text-gray-300">Please wait a moment while we confirm your ticket purchase.</p>
          </>
        ) : (
          <>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4 text-green-400">Payment Successful!</h1>
            <p className="text-gray-300 mb-4">Your tickets have been added to your account.</p>
            <p className="text-sm text-gray-400">Redirecting you to your account...</p>
          </>
        )}
      </div>
    </div>
  );
}
