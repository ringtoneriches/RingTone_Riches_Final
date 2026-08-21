import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import UnifiedBilling from "@/components/unified-billing";
import BillingChrome from "@/components/billing/BillingChrome";
import { Gift } from "lucide-react";

const PopBilling = () => {
  const { orderId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: popConfig } = useQuery<{ isVisible: boolean }>({
    queryKey: ["/api/admin/game-pop-config"],
  });

  useEffect(() => {
    if (popConfig && popConfig.isVisible === false) {
      toast({
        title: "Ringtone Pop Unavailable",
        description: "Ringtone Pop is currently not available.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [popConfig?.isVisible]);

  return (
    <BillingChrome
      kicker="Balloon pop · checkout"
      title="RINGTONE POP"
      subtitle="Pay here, then pop. Match three to win."
      facts={["Pop 3 balloons", "Match to win"]}
      Icon={Gift}
    >
      {orderId && <UnifiedBilling orderId={orderId} orderType="pop" />}
    </BillingChrome>
  );
};

export default PopBilling;
