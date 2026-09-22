import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

/**
 * The Winner's Circle — photographic proof that people actually get paid.
 *
 * Source of truth is the same public feed the Hall of Fame ticker uses:
 * GET /api/winners?showcase=true (admin-approved records only). This section
 * is photo-led, so it only shows winners that actually have a picture — a
 * cheque photo is the whole point, and a placeholder would undercut it.
 *
 * SEED_WINNERS below is the set the owner supplied, used only while no
 * photo-backed winner exists in the database. Add winners through
 * Admin → Winners (name, amount, photo) and they take over automatically.
 * Delete the constant once there are enough real records.
 */

type ApiWinner = {
  id: string;
  prizeDescription: string;
  prizeValue: string;
  imageUrl: string | null;
  isCircle?: boolean;
  createdAt: string;
  user: { firstName?: string | null; lastName?: string | null } | null;
  competition: { id: string; title: string } | null;
};

type CardModel = {
  id: string;
  name: string;
  amount: number;
  caption: string;
  image: string;
};

const SEED_WINNERS: CardModel[] = [
  { id: "seed-billy", name: "Billy L.", amount: 2500, caption: "", image: "/attached_assets/winners/billy-luther.webp" },
  { id: "seed-rachael", name: "Rachael M.", amount: 2500, caption: "", image: "/attached_assets/winners/rachael-metcalf.webp" },
  { id: "seed-louise", name: "Louise M.", amount: 1000, caption: "", image: "/attached_assets/winners/louise-myhill.webp" },
  { id: "seed-chelsea", name: "Chelsea R.", amount: 1000, caption: "Scratch Into Summer", image: "/attached_assets/winners/chelsea-robson.webp" },
  { id: "seed-jackie", name: "Jackie R.", amount: 1000, caption: "", image: "/attached_assets/winners/jackie-ridge.webp" },
  { id: "seed-jade", name: "Jade E.", amount: 950, caption: "", image: "/attached_assets/winners/jade-edminson.webp" },
  { id: "seed-charlotte", name: "Charlotte F.", amount: 550, caption: "", image: "/attached_assets/winners/charlotte-forster.webp" },
];

/** prizeValue is free text ("£1,000", "1000", "£1000 cash"), so be forgiving. */
function parseAmount(value: string | null | undefined) {
  if (!value) return 0;
  const digits = String(value).replace(/[^0-9.]/g, "");
  const n = Number.parseFloat(digits);
  return Number.isFinite(n) ? n : 0;
}

/** Matches the Hall of Fame ticker: first name plus a last initial. */
function publicName(first?: string | null, last?: string | null) {
  const f = (first || "").trim();
  const l = (last || "").trim();
  if (!f && !l) return "A Winner";
  return [f, l ? `${l.charAt(0).toUpperCase()}.` : ""].filter(Boolean).join(" ");
}

function money(n: number) {
  return `£${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

export default function WinnersCircle() {
  // A stale or deleted image would otherwise leave a black rectangle where a
  // photo should be, which looks worse than showing one fewer winner.
  const [broken, setBroken] = useState<Set<string>>(() => new Set());
  const trackRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery<ApiWinner[]>({
    queryKey: ["/api/winners", "circle"],
    queryFn: async () => {
      const res = await fetch("/api/winners?showcase=true&limit=24");
      if (!res.ok) throw new Error("Failed to load winners");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const winners = useMemo<CardModel[]>(() => {
    const withPhotos = (data ?? [])
      .filter((w) => w.isCircle && Boolean(w.imageUrl) && !broken.has(w.id))
      .map((w) => ({
        id: w.id,
        name: publicName(w.user?.firstName, w.user?.lastName),
        amount: parseAmount(w.prizeValue),
        caption: w.competition?.title || w.prizeDescription || "Prize Draw",
        image: w.imageUrl as string,
      }));

    // Six fills both the 2-column and 3-column grids exactly. Seven or eight
    // would leave a single card stranded on the last row.
    return (withPhotos.length ? withPhotos : SEED_WINNERS).slice(0, 6);
  }, [data, broken]);

  // Auto-advance the phone carousel. It scrolls card to card so it keeps the
  // swipe feel rather than drifting like a marquee, and it defers to the
  // person: any touch or wheel pauses it, and it resumes a few seconds later.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || winners.length < 2) return;

    // Only below Tailwind's sm breakpoint, where the track is a carousel
    // rather than a grid.
    const isCarousel = window.matchMedia("(max-width: 639px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let tick: number | undefined;
    let resumeAfter: number | undefined;

    /** Distance between two cards, measured rather than assumed. */
    const stride = () => {
      const [first, second] = [el.children[0], el.children[1]] as (HTMLElement | undefined)[];
      if (!first) return 0;
      return second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
    };

    const advance = () => {
      const step = stride();
      if (!step) return;
      // Derive the index from scroll position so a manual swipe is respected.
      const current = Math.round(el.scrollLeft / step);
      // Snap-centring means the last card rests at the maximum scroll rather
      // than at its own offset, so check the end directly. Deriving it from
      // the index alone would stall there instead of wrapping.
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 8;
      const next = atEnd || current + 1 >= winners.length ? 0 : current + 1;
      el.scrollTo({ left: next * step, behavior: "smooth" });
    };

    const stop = () => {
      if (tick !== undefined) window.clearInterval(tick);
      tick = undefined;
    };

    const start = () => {
      stop();
      if (!isCarousel.matches || reduced.matches || document.hidden) return;
      tick = window.setInterval(advance, 3200);
    };

    const hold = () => {
      stop();
      if (resumeAfter !== undefined) window.clearTimeout(resumeAfter);
      resumeAfter = window.setTimeout(start, 6000);
    };

    start();
    el.addEventListener("pointerdown", hold, { passive: true });
    el.addEventListener("touchstart", hold, { passive: true });
    el.addEventListener("wheel", hold, { passive: true });
    document.addEventListener("visibilitychange", start);
    isCarousel.addEventListener("change", start);
    reduced.addEventListener("change", start);
    window.addEventListener("resize", start);

    return () => {
      stop();
      if (resumeAfter !== undefined) window.clearTimeout(resumeAfter);
      el.removeEventListener("pointerdown", hold);
      el.removeEventListener("touchstart", hold);
      el.removeEventListener("wheel", hold);
      document.removeEventListener("visibilitychange", start);
      isCarousel.removeEventListener("change", start);
      reduced.removeEventListener("change", start);
      window.removeEventListener("resize", start);
    };
  }, [winners.length]);

  if (!winners.length) return null;

  return (
    <section className="relative py-14 sm:py-24" data-testid="section-winners-circle">
      {/* Single soft glow. No blur filters — this section sits below the fold
          and must not cost anything to scroll past. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 0%, rgba(212,175,55,0.10) 0%, rgba(5,5,5,0) 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="text-center">
          <h2 className="font-prize text-[2.1rem] leading-[0.95] text-white sm:text-6xl">
            THE WINNER&rsquo;S CIRCLE
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
            Real people, real cheques. Some of the people who&rsquo;ve won with us.
          </p>

        </header>

        {/* Swipeable on phones, grid from sm up. */}
        <div
          ref={trackRef}
          className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-12 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3"
        >
          {winners.map((winner, i) => (
            <article
              key={winner.id}
              className="group relative w-[78%] shrink-0 snap-center overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-[#0A0A0D] sm:w-auto"
              data-testid={`winner-circle-card-${i}`}
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={winner.image}
                  alt={`${winner.name} with their ${money(winner.amount)} Ringtone Riches cheque`}
                  loading="lazy"
                  decoding="async"
                  onError={() =>
                    setBroken((prev) => (prev.has(winner.id) ? prev : new Set(prev).add(winner.id)))
                  }
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(5,5,5,0.94) 0%, rgba(5,5,5,0.55) 26%, rgba(5,5,5,0) 55%)",
                  }}
                />

                <div className="absolute right-3 top-3 rounded-lg border border-[#F1D47A]/45 bg-black/75 px-2.5 py-1.5 backdrop-blur-[2px]">
                  <span className="font-prize text-lg leading-none text-[#F1D47A] sm:text-xl">
                    {money(winner.amount)}
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="text-lg font-extrabold leading-tight text-white sm:text-xl">
                    {winner.name}
                  </h3>
                  {winner.caption && (
                    <p className="mt-0.5 truncate text-xs text-white/55">{winner.caption}</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center sm:mt-12">
          <Link href="/#competitions">
            <a className="rr-winners-cta group inline-flex items-center gap-2.5 rounded-xl border border-[#F1D47A] bg-[#F1D47A] px-8 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#050505] transition-transform duration-200 hover:-translate-y-0.5">
              You&rsquo;re next
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.6} />
            </a>
          </Link>

          <p className="mt-4 text-xs text-white/35">
            <Link href="/winners">
              <a className="underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/60">
                See every winner
              </a>
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
