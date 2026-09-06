import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import UnifiedBilling from "@/components/unified-billing";
import BillingChrome from "@/components/billing/BillingChrome";
import { Target } from "lucide-react";

const PlinkoBilling = () => {
  const { orderId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: plinkoConfig } = useQuery<{ isVisible: boolean; isActive: boolean }>({
    queryKey: ["/api/plinko-config"],
  });

  useEffect(() => {
    if (plinkoConfig && (plinkoConfig.isVisible === false || plinkoConfig.isActive === false)) {
      toast({
        title: "Ringtone Plinko Unavailable",
        description: "Ringtone Plinko is currently not available.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [plinkoConfig?.isVisible, plinkoConfig?.isActive]);

  return (
    <BillingChrome
      kicker="Plinko drop · checkout"
      title="RINGTONE PLINKO"
      subtitle="Pay here, then drop. Bounce down and see where it lands."
      facts={["Drop · bounce · win", "Jackpot live"]}
      Icon={Target}
    >
      {orderId && <UnifiedBilling orderId={orderId} orderType="plinko" />}
    </BillingChrome>
  );
};

export default PlinkoBilling;
