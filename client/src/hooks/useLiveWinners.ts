import { useQuery } from "@tanstack/react-query";

/**
 * Live winners feed for Hall of Fame.
 *
 * Source: existing public GET /api/winners?showcase=true
 * (admin-approved public winner records only).
 *
 * Refreshes:
 * - React Query polling (30s)
 * - React Query invalidation of `/api/winners`
 *   including WebSocket `winner_drawn` in useWebSocket
 *
 * Backend-ready: if GET /api/winners/live is added later,
 * switch queryKey / queryFn here. Do not hardcode production winners.
 */
export type LiveWinner = {
  id: string;
  prizeDescription: string;
  prizeValue: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  } | null;
  competition: {
    id: string;
    title: string;
  } | null;
};

function formatPublicName(firstName?: string | null, lastName?: string | null) {
  const first = (firstName || "").trim();
  const last = (lastName || "").trim();
  if (!first && !last) return "A Winner";
  const lastInitial = last ? `${last.charAt(0).toUpperCase()}.` : "";
  return [first, lastInitial].filter(Boolean).join(" ");
}

function formatWinnerAgo(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days <= 30) return days === 1 ? "1 day ago" : `${days} days ago`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" as const } : {}),
  });
}

export function mapLiveWinner(item: any): LiveWinner {
  return {
    id: item.id,
    prizeDescription: item.prizeDescription,
    prizeValue: item.prizeValue || item.prizeDescription || "",
    createdAt: item.createdAt || item.updatedAt,
    user: item.user
      ? {
          firstName: item.user.firstName || "",
          lastName: item.user.lastName || "",
        }
      : null,
    competition: item.competition
      ? {
          id: item.competition.id,
          title: item.competition.title || "Prize Win",
        }
      : null,
  };
}

export function getWinnerCardModel(winner: LiveWinner) {
  const prize =
    winner.prizeValue && winner.prizeValue !== "0"
      ? winner.prizeValue
      : winner.prizeDescription;

  return {
    name: formatPublicName(winner.user?.firstName, winner.user?.lastName),
    prize,
    game: winner.competition?.title || "Ringtone Riches",
    whenLabel: formatWinnerAgo(winner.createdAt),
    initial: (winner.user?.firstName || "W").charAt(0).toUpperCase(),
  };
}

export function useLiveWinners(limit = 24) {
  return useQuery<LiveWinner[]>({
    queryKey: ["/api/winners", "showcase", "live", limit],
    queryFn: async () => {
      const res = await fetch(`/api/winners?showcase=true&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch winners");
      const json = await res.json();
      return (Array.isArray(json) ? json : [])
        .map(mapLiveWinner)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
