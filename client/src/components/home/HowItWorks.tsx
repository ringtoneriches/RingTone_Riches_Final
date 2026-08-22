import { Ticket, Trophy, Zap, ArrowRight } from "lucide-react";
import type { MouseEvent } from "react";

const STEPS = [
  {
    n: "01",
    title: "CHOOSE YOUR PRIZE",
    body: "Browse our live competitions and choose from cash, holidays, gadgets and more.",
    Icon: Trophy,
    accent: "red",
  },
  {
    n: "02",
    title: "SECURE YOUR ENTRY",
    body: "Choose your tickets and complete your entry securely in just a few simple steps.",
    Icon: Ticket,
    accent: "gold",
  },
  {
    n: "03",
    title: "SEE IF YOU’VE WON",
    body: "Instant Win results are revealed straight away. Draw winners are announced after the competition closes and contacted directly.",
    Icon: Zap,
    accent: "win",
  },
] as const;

export default function HowItWorks() {
  const goToCompetitions = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById("competitions")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="how-it-works" className="relative py-12 sm:py-20" data-testid="section-how-it-works">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF263D]" />
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
              Under a minute
            </span>
          </div>
          <h2 className="font-prize text-[2rem] sm:text-5xl text-white">HOW IT WORKS</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-white/50">
            Three simple steps could make you Ringtone Richer.
          </p>
        </div>

        <div className="relative grid gap-5 md:grid-cols-3 md:gap-6">
          <div className="rr-hiw-line pointer-events-none absolute left-[18%] right-[18%] top-[4.75rem] hidden h-px md:block" />
          {STEPS.map((step, index) => (
            <article
              key={step.n}
              className={`rr-hiw-card rr-hiw-card--${step.accent}`}
              data-testid={`how-it-works-step-${index + 1}`}
            >
              <span className="rr-hiw-watermark" aria-hidden>
                {step.n}
              </span>
              <div className="relative z-[1] flex items-start justify-between gap-3">
                <span className="inline-flex items-center rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                  Step {step.n}
                </span>
                <div className="rr-hiw-icon">
                  <step.Icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
              </div>
              <h3 className="relative z-[1] mt-6 font-prize text-2xl sm:text-[1.7rem] leading-none text-white">
                {step.title}
              </h3>
              <p className="relative z-[1] mt-3 text-sm leading-relaxed text-white/55">
                {step.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
            Real competitions. Real winners. Real rewards.
          </p>
          <a
            href="#competitions"
            onClick={goToCompetitions}
            className="rr-cta inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-7 text-sm font-black uppercase tracking-[0.12em] sm:tracking-[0.16em]"
            data-testid="button-how-it-works-cta"
          >
            Play live prizes
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
