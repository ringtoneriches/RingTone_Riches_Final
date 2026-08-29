import { useEffect } from "react";
import { Lock } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import Header from "@/components/layout/header";

export type BrandWaitMode = "overlay" | "page" | "embed";

type Props = {
  mode?: BrandWaitMode;
  kicker?: string;
  headline?: string;
  subtitle?: string;
  trust?: string | null;
  className?: string;
  /** Pulse + equalizer only — use inside a screen that already has a title. */
  quiet?: boolean;
};

export function CheckoutPulse({
  size = "md",
  force,
}: {
  size?: "sm" | "md" | "lg";
  force?: "night" | "day";
}) {
  return (
    <div className={`rr-wait-mark rr-wait-mark--${size}`} aria-hidden>
      <span className="rr-wait-rail rr-wait-rail--left">
        <i />
        <i />
      </span>
      <div className="rr-wait-mark__frame">
        <span className="rr-wait-mark__chase" />
        <BrandLogo force={force} className="rr-wait-mark__logo" />
      </div>
      <span className="rr-wait-rail rr-wait-rail--right">
        <i />
        <i />
      </span>
    </div>
  );
}

function SideRails() {
  return (
    <div className="rr-wait-sides" aria-hidden>
      <span className="rr-wait-side rr-wait-side--left">
        <i />
      </span>
      <span className="rr-wait-side rr-wait-side--right">
        <i />
      </span>
    </div>
  );
}

function WaitCard({
  showLogo,
  kicker,
  headline,
  subtitle,
  trust,
}: {
  showLogo: boolean;
  kicker: string;
  headline: string;
  subtitle?: string;
  trust?: string | null;
}) {
  return (
    <>
      <div className="rr-checkout-launch__glow" />
      <div className="rr-checkout-launch__card">
        <CheckoutPulse size={showLogo ? "lg" : "md"} />
        <p className="rr-checkout-launch__kicker">{kicker}</p>
        <h2 className="rr-checkout-launch__title">{headline}</h2>
        {subtitle ? <p className="rr-checkout-launch__copy">{subtitle}</p> : null}
        <div className="rr-checkout-launch__eq" aria-hidden>
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        {trust ? (
          <p className="rr-checkout-launch__trust">
            <Lock className="h-3 w-3 text-[#F1D47A]" />
            {trust}
          </p>
        ) : null}
      </div>
    </>
  );
}

export default function BrandWait({
  mode = "embed",
  kicker = "Please wait",
  headline = "Loading",
  subtitle,
  trust = null,
  className = "",
  quiet = false,
}: Props) {
  useEffect(() => {
    if (mode !== "overlay") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mode]);

  if (quiet) {
    return (
      <div
        className={`rr-checkout-launch rr-checkout-launch--embed rr-checkout-launch--quiet ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={headline}
      >
        <CheckoutPulse size="sm" />
        <div className="rr-checkout-launch__eq" aria-hidden>
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  const card = (
    <WaitCard
      showLogo={mode !== "embed"}
      kicker={kicker}
      headline={headline}
      subtitle={subtitle}
      trust={trust}
    />
  );

  if (mode === "page") {
    return (
      <div
        className={`rr-page rr-checkout-launch rr-checkout-launch--page ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={headline}
      >
        <DigitalAtmosphere className="rr-atmosphere--page" />
        <SideRails />
        {card}
      </div>
    );
  }

  return (
    <div
      className={`rr-checkout-launch rr-checkout-launch--${mode} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={headline}
    >
      {mode === "overlay" ? <SideRails /> : null}
      {card}
    </div>
  );
}

export function PageWait({
  kicker = "Please wait",
  headline = "Loading",
  subtitle,
  trust = null,
  className = "rr-page",
}: Omit<Props, "mode">) {
  return (
    <div className={`${className} relative min-h-screen overflow-hidden`}>
      <DigitalAtmosphere className="rr-atmosphere--page" />
      <Header />
      <SideRails />
      <BrandWait mode="embed" kicker={kicker} headline={headline} subtitle={subtitle} trust={trust} />
    </div>
  );
}
