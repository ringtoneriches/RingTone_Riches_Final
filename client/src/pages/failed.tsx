import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import PaymentResult from "@/components/billing/PaymentResult";

export default function PaymentFailed() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    toast({
      title: "Payment Failed",
      description: "Something went wrong with your payment. Please try again.",
      variant: "destructive",
    });
  }, [toast]);

  return (
    <PaymentResult
      kicker="Wallet · checkout"
      title="PAYMENT FAILED"
      message="Unfortunately, your payment could not be processed."
      variant="failed"
      actionLabel="Back to wallet"
      onAction={() => setLocation("/wallet")}
    />
  );
}
