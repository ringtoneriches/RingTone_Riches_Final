import { useParams } from "wouter";
import UnifiedBilling from "@/components/unified-billing";
import BillingChrome from "@/components/billing/BillingChrome";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Trophy } from "lucide-react";
import { PageWait } from "@/components/brand/BrandWait";

export default function Checkout() {
  const { orderId } = useParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 800);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <PageWait
        className="rr-page bg-[#050505] text-white"
        kicker="Prize draw · checkout"
        headline="Opening checkout"
        subtitle="Confirming your session before payment."
      />
    );
  }

  if (!isAuthenticated) return null;

  return (
    <BillingChrome
      kicker="Prize draw · checkout"
      title="CHECKOUT"
      subtitle="Confirm payment and lock in your tickets."
      facts={["Secure payment", "Fair draw"]}
      Icon={Trophy}
    >
      {orderId && <UnifiedBilling orderId={orderId} orderType="competition" />}
    </BillingChrome>
  );
}
