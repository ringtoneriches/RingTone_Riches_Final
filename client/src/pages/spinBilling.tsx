import { useParams } from "wouter";
import UnifiedBilling from "@/components/unified-billing";
import BillingChrome from "@/components/billing/BillingChrome";
import { Target } from "lucide-react";
import { Competition } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

const SpinBilling = () => {
  const { orderId, wheelType } = useParams();

  const { data: orderData } = useQuery({
    queryKey: ["/api/spin-order", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await fetch(`/api/spin-order/${orderId}`);
      if (!res.ok) throw new Error("Failed to load spin order");
      return res.json();
    },
  });

  const competitionId = orderData?.order?.competitionId;

  useQuery<Competition>({
    queryKey: ["/api/competitions", competitionId],
    enabled: !!competitionId,
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${competitionId}`);
      if (!res.ok) throw new Error("Failed to load competition");
      return res.json();
    },
  });

  const isRetro = wheelType === "wheel2";

  return (
    <BillingChrome
      kicker="Spin · checkout"
      title={isRetro ? "RETRO RINGTONE SPIN" : "LUXURY CAR SPIN"}
      subtitle="Pay here, then spin. Every spin is a shot at the prize."
      facts={["Instant result", "Live wheel"]}
      Icon={Target}
    >
      {orderId && <UnifiedBilling orderId={orderId} orderType="spin" wheelType={wheelType} />}
    </BillingChrome>
  );
};

export default SpinBilling;
