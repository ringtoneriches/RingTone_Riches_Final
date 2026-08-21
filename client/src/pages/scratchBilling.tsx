import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import UnifiedBilling from "@/components/unified-billing";
import BillingChrome from "@/components/billing/BillingChrome";
import { Sparkles } from "lucide-react";

const ScratchBilling = () => {
  const { orderId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: scratchConfig } = useQuery<{ isVisible: boolean }>({
    queryKey: ["/api/admin/game-scratch-config"],
  });

  useEffect(() => {
    if (scratchConfig && scratchConfig.isVisible === false) {
      toast({
        title: "Scratch Cards Unavailable",
        description: "Scratch cards are currently not available.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [scratchConfig?.isVisible]);

  return (
    <BillingChrome
      kicker="Scratch & win · checkout"
      title="SCRATCH INTO SUMMER"
      subtitle="Pay here, then scratch. Instant prizes underneath."
      facts={["Instant results", "Reveal to win"]}
      Icon={Sparkles}
    >
      {orderId && <UnifiedBilling orderId={orderId} orderType="scratch" />}
    </BillingChrome>
  );
};

export default ScratchBilling;
