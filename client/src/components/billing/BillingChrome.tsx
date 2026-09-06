import { ReactNode } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import { Lock, LucideIcon } from "lucide-react";

type Props = {
  kicker: string;
  title: string;
  titleTestId?: string;
  subtitle: string;
  facts?: string[];
  Icon?: LucideIcon;
  children: ReactNode;
};

export default function BillingChrome({
  kicker,
  title,
  titleTestId,
  subtitle,
  facts = [],
  Icon,
  children,
}: Props) {
  return (
    <div className="rr-billing-page rr-page relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <DigitalAtmosphere />
      <Header />
      <main className="relative z-10 flex-1 pb-12 pt-5 sm:pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center sm:mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF263D] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF263D]" />
              </span>
              {Icon ? <Icon className="h-3.5 w-3.5 text-[#F1D47A]" /> : null}
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
                {kicker}
              </span>
            </div>
            <h1
              className="font-prize text-[2.1rem] leading-none text-white sm:text-5xl"
              data-testid={titleTestId}
            >
              {title}
            </h1>
            <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-[#F1D47A] to-transparent" />
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/50 sm:text-base">{subtitle}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
              {facts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-[#F1D47A]" />
                SSL checkout
              </span>
            </div>
          </div>
          <div className="rr-billing">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
