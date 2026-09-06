import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import UnifiedBilling from "@/components/unified-billing";
import BillingChrome from "@/components/billing/BillingChrome";
import { Crown } from "lucide-react";

const RoyalBilling = () => {
  const { orderId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: royalConfig } = useQuery<{ isVisible: boolean }>({
    queryKey: ["/api/royal-config"],
    queryFn: async () => {
      const res = await fetch("/api/royal-config");
      return res.json();
    },
  });

  useEffect(() => {
    if (royalConfig && royalConfig.isVisible === false) {
      toast({
        title: "Royal Reels Unavailable",
        description: "Royal Reels is currently not available.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [royalConfig?.isVisible]);

  return (
    <BillingChrome
      kicker="Royal reels · checkout"
      title="ROYAL REELS"
      titleTestId="text-royal-billing-title"
      subtitle="Pay here, then match three royal symbols — plus a shot at a Royal Replay."
      facts={["3×3 grid", "15 prize tiers"]}
      Icon={Crown}
    >
      {orderId && <UnifiedBilling orderId={orderId} orderType="royal" />}
    </BillingChrome>
  );
};

export default RoyalBilling;
