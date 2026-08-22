import { useQuery } from "@tanstack/react-query";
import { Lock, Scale, Zap, Wallet, Star, ExternalLink } from "lucide-react";

const TRUSTPILOT_URL = "https://www.trustpilot.com/review/ringtoneriches.co.uk";

type TrustpilotPayload = {
  totalReviews?: string;
  averageRating?: string;
};

const BADGES = [
  {
    Icon: Lock,
    title: "Locked down",
    sub: "SSL on every payment",
  },
  {
    Icon: Scale,
    title: "Fair chance",
    sub: "Every valid ticket has a chance",
  },
  {
    Icon: Zap,
    title: "Instant results",
    sub: "You'll know right away",
  },
  {
    Icon: Wallet,
    title: "Fast payouts",
    sub: "Winners receive their cash quickly",
  },
] as const;

function parseReviewCount(raw?: string | null): string | null {
  if (!raw) return null;
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text || text === "0") return null;
  if (/in the last\s+12\s*$/i.test(text) || /last\s+12\s*$/i.test(text)) return null;

  const match = text.match(/([\d][\d,]*)/);
  if (!match) return null;
  if (/last\s+12/i.test(text) && match[1].replace(/,/g, "") === "12") return null;
  if (match[1] === "0") return null;
  return match[1];
}

export default function TrustStrip() {
  const { data, isError } = useQuery<TrustpilotPayload>({
    queryKey: ["/api/trustpilot-reviews"],
    queryFn: async () => {
      const res = await fetch("/api/trustpilot-reviews");
      if (!res.ok) throw new Error("Trustpilot unavailable");
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const rating = data?.averageRating && data.averageRating !== "N/A" ? data.averageRating : null;
  const count = isError ? null : parseReviewCount(data?.totalReviews);
  const numeric = rating ? parseFloat(rating) : NaN;
  const stars = Number.isFinite(numeric) ? Math.round(numeric) : 0;
  const reviewLine = rating
    ? count
      ? `${rating} · ${count} reviews`
      : `${rating} / 5`
    : count
      ? `${count} reviews`
      : null;

  return (
    <div className="rr-trust-row" data-testid="section-trust-strip">
      <a
        href={TRUSTPILOT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rr-trust-chip rr-trust-chip--pilot"
        data-testid="link-trustpilot-strip"
      >
        <span className="rr-trust-medal rr-trust-medal--pilot" aria-hidden>
          <Star className="h-4 w-4 fill-current" />
        </span>
        <div className="mb-1.5 flex items-center justify-center gap-0.5" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${
                i < stars ? "fill-[#00b67a] text-[#00b67a]" : "text-white/20"
              }`}
            />
          ))}
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white">Trustpilot</p>
        {reviewLine ? (
          <p className="mt-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-white/50">
            {reviewLine}
            <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-70" />
          </p>
        ) : (
          <p className="mt-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-white/50">
            See reviews
            <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-70" />
          </p>
        )}
      </a>

      {BADGES.map((badge) => (
        <div key={badge.title} className="rr-trust-chip">
          <span className="rr-trust-medal" aria-hidden>
            <badge.Icon className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white">{badge.title}</p>
          <p className="mt-1 text-[10px] font-semibold leading-snug text-white/50">{badge.sub}</p>
        </div>
      ))}
    </div>
  );
}
