import { useEffect } from "react";
import { useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

export default function WalletSuccess() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const confirmPayment = async () => {
      const searchParams = new URLSearchParams(window.location.search);

        const paymentJobRef = searchParams.get("paymentjobref");
        const paymentRef = searchParams.get("paymentref");

        if (!paymentJobRef || !paymentRef) {
            return <p>Missing payment confirmation information.</p>;
        }


      try {
        const res = await apiRequest("/api/wallet/confirm-topup", "POST", {  
          paymentJobRef,
          paymentRef, 
        });
        if (res.ok) {
          toast({
            title: "Payment Confirmed",
            description: "Your wallet has been updated.",
          });
          // ✅ Refresh user + transactions data
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
          // Redirect back to main wallet page
          setTimeout(() => (window.location.href = "/wallet"), 1500);
        } else {
          const data = await res.json();
          toast({
            title: "Error",
            description: data.message || "Could not confirm payment",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to confirm payment",
          variant: "destructive",
        });
      }
    };

    confirmPayment();
  }, [queryClient, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Processing your payment...</h1>
        <p>Please wait a moment while we confirm your wallet top-up.</p>
      </div>
    </div>
  );
}
