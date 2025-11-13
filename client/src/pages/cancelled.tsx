import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function PaymentCancelled() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    toast({
      title: "Payment Cancelled",
      description: "You cancelled your payment. No charges were made.",
    });
  }, [toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Payment Cancelled</h1>
        <p className="mb-6">You have cancelled your payment.</p>
        <button
          onClick={() => setLocation("/wallet")}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Return to Wallet
        </button>
      </div>
    </div>
  );
}
