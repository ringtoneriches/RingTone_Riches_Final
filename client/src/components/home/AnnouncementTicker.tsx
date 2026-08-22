import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Competition } from "@shared/schema";

export default function AnnouncementTicker() {
  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
    staleTime: 30_000,
  });

  const items = useMemo(() => {
    const live = competitions.filter((c) => {
      const max = c.maxTickets ?? 0;
      const sold = c.soldTickets ?? 0;
      const closed = max > 0 && sold >= max;
      const expired = c.endDate ? new Date(c.endDate).getTime() < Date.now() : false;
      return !closed && !expired;
    }).length;

    const instantLive = competitions.filter((c) =>
      ["scratch", "pop", "plinko", "voltz", "slot", "royal", "spin", "instant"].includes(c.type)
    ).length;

    const line = (label: string, value?: string) => ({ label, value });

    return [
      line("Real winners. Real payouts."),
      live > 0 ? line("Live competitions") : line("Prize competitions live now"),
      instantLive > 0 ? line("Instant win prizes live now") : line("Instant wins on the floor"),
      line("Winners paid in cash"),
      line("UK based prize competitions"),
      line("Fair draws. Transparent results."),
    ];
  }, [competitions]);

  const loop = [...items, ...items];

  return (
    <div className="rr-announce" data-testid="announcement-ticker">
      <div className="rr-announce-fade" aria-hidden />
      <div className="rr-announce-track">
        {loop.map((item, i) => (
          <span key={`${item.label}-${i}`} className="rr-announce-item">
            <span className="rr-announce-dot" aria-hidden />
            <span className="rr-announce-label">{item.label}</span>
            {item.value ? <span className="rr-announce-value">{item.value}</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
