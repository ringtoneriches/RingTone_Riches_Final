import { useParams } from "wouter";
import UnifiedBilling from "@/components/unified-billing";
import BillingChrome from "@/components/billing/BillingChrome";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Trophy } from "lucide-react";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import Header from "@/components/layout/header";

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
      <div className="rr-page relative min-h-screen overflow-hidden bg-[#050505] text-white">
        <DigitalAtmosphere />
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#C8102E] border-t-transparent" />
        </div>
      </div>
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
