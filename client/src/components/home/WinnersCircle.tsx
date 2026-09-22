import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Camera, ArrowRight } from "lucide-react";

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
  date: string;
};

const SEED_WINNERS: CardModel[] = [
  { id: "seed-billy", name: "Billy L.", amount: 2500, caption: "Live Draw", image: "/attached_assets/winners/billy-luther.webp", date: "2026-01-01" },
  { id: "seed-rachael", name: "Rachael M.", amount: 2500, caption: "Live Draw", image: "/attached_assets/winners/rachael-metcalf.webp", date: "2026-01-01" },
  { id: "seed-louise", name: "Louise M.", amount: 1000, caption: "Live Draw", image: "/attached_assets/winners/louise-myhill.webp", date: "2026-01-09" },
  { id: "seed-chelsea", name: "Chelsea R.", amount: 1000, caption: "Scratch Into Summer", image: "/attached_assets/winners/chelsea-robson.webp", date: "2026-06-01" },
  { id: "seed-jackie", name: "Jackie R.", amount: 1000, caption: "Live Draw", image: "/attached_assets/winners/jackie-ridge.webp", date: "2026-01-27" },
  { id: "seed-jade", name: "Jade E.", amount: 950, caption: "Live Draw", image: "/attached_assets/winners/jade-edminson.webp", date: "2026-01-09" },
  { id: "seed-charlotte", name: "Charlotte F.", amount: 550, caption: "Live Draw", image: "/attached_assets/winners/charlotte-forster.webp", date: "2026-01-27" },
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

function shortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function WinnersCircle() {
  // A stale or deleted image would otherwise leave a black rectangle where a
  // photo should be, which looks worse than showing one fewer winner.
  const [broken, setBroken] = useState<Set<string>>(() => new Set());

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
        date: w.createdAt,
      }));

    // Six fills both the 2-column and 3-column grids exactly. Seven or eight
    // would leave a single card stranded on the last row.
    return (withPhotos.length ? withPhotos : SEED_WINNERS).slice(0, 6);
  }, [data, broken]);

  const stats = useMemo(() => {
    const total = winners.reduce((sum, w) => sum + w.amount, 0);
    const biggest = winners.reduce((max, w) => Math.max(max, w.amount), 0);
    return { total, biggest, count: winners.length };
  }, [winners]);

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
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3.5 py-1.5">
            <Camera className="h-3.5 w-3.5 text-[#F1D47A]" strokeWidth={2.4} />
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F1D47A]">
              Every winner photographed
            </span>
          </div>

          <h2 className="font-prize text-[2.1rem] leading-[0.95] text-white sm:text-6xl">
            THE WINNER&rsquo;S CIRCLE
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
            Real people. Real cheques. Real money in the bank — these are our winners
            on their own doorsteps.
          </p>

          <dl className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-2 sm:gap-4">
            {[
              { label: "Paid to winners", value: `${money(stats.total)}+` },
              { label: "Biggest cheque", value: money(stats.biggest) },
              { label: "Winners shown", value: String(stats.count) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3 sm:px-4 sm:py-4"
              >
                <dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 sm:text-[10px]">
                  {stat.label}
                </dt>
                <dd className="mt-1 font-prize text-xl text-[#F1D47A] sm:text-3xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        {/* Swipeable on phones, grid from sm up. */}
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-12 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
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
                  <p className="mt-0.5 truncate text-xs text-white/55">{winner.caption}</p>
                  <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#D4AF37]/80">
                    Paid {shortDate(winner.date)}
                  </p>
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
