import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import PaymentResult from "@/components/billing/PaymentResult";

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
    <PaymentResult
      kicker="Wallet · checkout"
      title="PAYMENT CANCELLED"
      message="You cancelled your payment. No charges were made."
      variant="cancelled"
      actionLabel="Return to wallet"
      onAction={() => setLocation("/wallet")}
    />
  );
}
