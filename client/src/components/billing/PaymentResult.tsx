import { ReactNode } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import { CheckCircle2, Clock, Loader2, XCircle, Ban, LucideIcon } from "lucide-react";

export type PaymentResultVariant = "processing" | "success" | "cancelled" | "failed" | "waiting";

const VARIANT: Record<
  PaymentResultVariant,
  { Icon: LucideIcon; iconClass: string; ring: string }
> = {
  processing: {
    Icon: Loader2,
    iconClass: "animate-spin text-[#C8102E]",
    ring: "border-[#C8102E]/35 bg-[#C8102E]/10",
  },
  waiting: {
    Icon: Clock,
    iconClass: "text-[#F1D47A]",
    ring: "border-[#F1D47A]/35 bg-[#F1D47A]/10",
  },
  success: {
    Icon: CheckCircle2,
    iconClass: "text-[#F1D47A]",
    ring: "border-[#F1D47A]/40 bg-[#F1D47A]/10",
  },
  cancelled: {
    Icon: Ban,
    iconClass: "text-[#F1D47A]",
    ring: "border-[#F1D47A]/30 bg-[#F1D47A]/8",
  },
  failed: {
    Icon: XCircle,
    iconClass: "text-[#FF263D]",
    ring: "border-[#C8102E]/40 bg-[#C8102E]/10",
  },
};

type Props = {
  kicker: string;
  title: string;
  message: string;
  variant: PaymentResultVariant;
  actionLabel?: string;
  onAction?: () => void;
  extra?: ReactNode;
};

export default function PaymentResult({
  kicker,
  title,
  message,
  variant,
  actionLabel,
  onAction,
  extra,
}: Props) {
  const { Icon, iconClass, ring } = VARIANT[variant];

  return (
    <div className="rr-page relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <DigitalAtmosphere />
      <Header />
      <main className="relative z-10 flex min-h-[70vh] items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
              {kicker}
            </span>
          </div>

          <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border ${ring}`}>
            <Icon className={`h-10 w-10 ${iconClass}`} />
          </div>

          <h1 className="font-prize text-4xl leading-tight text-white sm:text-5xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-white/50 sm:text-base">{message}</p>
          {extra}

          {actionLabel && onAction ? (
            <button type="button" onClick={onAction} className="rr-cta mt-8 px-8 py-3 text-sm">
              {actionLabel}
            </button>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
