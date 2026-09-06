import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import UnifiedBilling from "@/components/unified-billing";
import BillingChrome from "@/components/billing/BillingChrome";
import { Trophy } from "lucide-react";

const SlotBilling = () => {
  const { orderId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: slotConfig } = useQuery<{ isVisible: boolean }>({
    queryKey: ["/api/slot-config"],
  });

  useEffect(() => {
    if (slotConfig && slotConfig.isVisible === false) {
      toast({
        title: "Slot Machine Unavailable",
        description: "The Slot Machine is currently not available.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [slotConfig?.isVisible]);

  return (
    <BillingChrome
      kicker="Slot spin · checkout"
      title="SLOT MACHINE"
      titleTestId="text-slot-billing-title"
      subtitle="Spin the reels and match the symbols. Pay here, then play."
      facts={["3×3 reels", "20 paylines", "Wild symbols"]}
      Icon={Trophy}
    >
      {orderId && <UnifiedBilling orderId={orderId} orderType="slot" />}
    </BillingChrome>
  );
};

export default SlotBilling;
