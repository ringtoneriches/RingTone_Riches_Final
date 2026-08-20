import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";

type TrustpilotPayload = {
  totalReviews?: string;
  averageRating?: string;
};

export default function TrustpilotSignal() {
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
  const total = data?.totalReviews && data.totalReviews !== "0" ? data.totalReviews : null;
  const numeric = rating ? parseFloat(rating) : NaN;
  const stars = Number.isFinite(numeric) ? Math.round(numeric) : 0;

  return (
    <section className="py-6" data-testid="section-trustpilot">
      <a
        href="https://www.trustpilot.com/review/ringtoneriches.co.uk"
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto flex w-fit items-center gap-3 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 hover:border-[#D4AF37]/40 transition-colors"
      >
        <div className="flex items-center gap-0.5" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < stars ? "fill-[#00b67a] text-[#00b67a]" : "text-white/20"
              }`}
            />
          ))}
        </div>
        <div className="text-left">
          <p className="text-xs font-black uppercase tracking-widest text-white">Trustpilot</p>
          <p className="text-[11px] text-white/50">
            {isError || (!rating && !total)
              ? "Read our reviews"
              : [rating ? `${rating} / 5` : null, total ? `${total} reviews` : null]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
        </div>
      </a>
    </section>
  );
}
