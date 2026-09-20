import { useSeason } from "@/hooks/useSeason";

const SEASON_TAGLINE: Record<string, string> = {
  halloween: "Spooky season is live",
  christmas: "It's the season to win",
};

export default function BrandIntro() {
  const { season } = useSeason();
  const tagline = season ? SEASON_TAGLINE[season] : null;

  return (
    <section className="rr-brand-intro" data-testid="section-brand-intro">
      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="rr-brand-kicker">Welcome to Ringtone Riches</p>
        <h1 className="rr-brand-title">
          <span className="rr-brand-title-lead">THE PLACE YOU BECOME</span>
          <span>RINGTONE RICHER</span>
        </h1>
        <p className="rr-brand-sub">
          Prize Competitions. Instant Wins. Real Rewards.
        </p>
        {tagline && (
          <p className="rr-hw-tagline" data-testid="text-season-tagline">
            {tagline}
          </p>
        )}
      </div>
    </section>
  );
}
