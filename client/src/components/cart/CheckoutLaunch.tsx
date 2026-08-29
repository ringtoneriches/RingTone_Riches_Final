import BrandWait, { CheckoutPulse } from "@/components/brand/BrandWait";

export { CheckoutPulse };

type Props = {
  headline?: string;
  subtitle?: string;
};

export default function CheckoutLaunch({
  headline = "Opening checkout",
  subtitle = "Preparing secure card payment. Stay on this page.",
}: Props) {
  return (
    <BrandWait
      mode="overlay"
      kicker="Secure payment"
      headline={headline}
      subtitle={subtitle}
      trust="SSL encrypted · Don’t close this tab"
    />
  );
}
