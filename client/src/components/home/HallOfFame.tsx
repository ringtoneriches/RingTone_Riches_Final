import { Link } from "wouter";
import { Trophy } from "lucide-react";
import { getWinnerCardModel, useLiveWinners } from "@/hooks/useLiveWinners";

export default function HallOfFame() {
  const { data: winners = [], isLoading } = useLiveWinners(24);

  return (
    <section className="relative py-12 sm:py-20" data-testid="section-hall-of-fame">
      <div className="relative z-10">
        <div className="mx-auto mb-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF263D] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF263D]" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">Live</span>
              </div>
              <h2 className="font-prize text-[2rem] sm:text-5xl text-white">HALL OF FAME</h2>
              <p className="mt-2 text-sm text-white/50">People are winning on Ringtone Riches right now.</p>
            </div>
            <Link href="/winners">
              <span className="rr-hof-all text-xs font-bold uppercase tracking-widest">
                View all winners →
              </span>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="px-4 text-center text-sm text-white/40">Loading winners…</div>
        ) : winners.length === 0 ? (
          <div className="mx-auto max-w-7xl px-4 text-center">
            <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-10">
              <Trophy className="mx-auto mb-3 h-8 w-8 text-[#D4AF37]" />
              <p className="text-sm text-white/50">
                Winners will appear here as prizes are claimed.
              </p>
            </div>
          </div>
        ) : (
          <div className="rr-ticker overflow-hidden" data-testid="live-winner-ticker">
            <div
              className="rr-ticker-track gap-3 px-3"
              style={{ ["--rr-ticker-duration" as string]: `${Math.max(winners.length, 1) * 1.97}s` }}
            >
              {[...winners, ...winners].map((winner, i) => {
                const card = getWinnerCardModel(winner);
                return (
                  <article
                    key={`${winner.id}-${i}`}
                    className="w-[260px] shrink-0 rounded-xl border border-[#D4AF37]/25 bg-[#0A0A0D] px-4 py-3 shadow-[0_0_24px_rgba(200,16,46,0.12)]"
                    data-testid={`winner-card-${i}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C8102E] to-[#8e0b20] font-black text-white">
                        {card.initial}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-black uppercase tracking-wider text-white/80">
                          {card.name}
                        </p>
                        <p className="font-prize truncate text-lg leading-tight text-[#F1D47A]">
                          {card.prize}
                        </p>
                        <p className="truncate text-[11px] text-white/45">{card.game}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                          {card.whenLabel}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
