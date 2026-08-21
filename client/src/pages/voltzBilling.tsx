import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import UnifiedBilling from "@/components/unified-billing";
import BillingChrome from "@/components/billing/BillingChrome";
import { Zap } from "lucide-react";

const VoltzBilling = () => {
  const { orderId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: voltzConfig } = useQuery<{ isVisible: boolean }>({
    queryKey: ["/api/voltz-config"],
  });

  useEffect(() => {
    if (voltzConfig && voltzConfig.isVisible === false) {
      toast({
        title: "Ringtone Voltz Unavailable",
        description: "Ringtone Voltz is currently not available.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [voltzConfig?.isVisible]);

  return (
    <BillingChrome
      kicker="Voltz · checkout"
      title="RINGTONE VOLTZ"
      titleTestId="text-voltz-billing-title"
      subtitle="Pay here, then hit a switch and surge the power."
      facts={["3 switches", "Instant prizes"]}
      Icon={Zap}
    >
      {orderId && <UnifiedBilling orderId={orderId} orderType="voltz" />}
    </BillingChrome>
  );
};

export default VoltzBilling;
