import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export type DailySpinState = {
  enabled: boolean;
  eligible?: boolean;
  reason?: string;
  message?: string;
  segments: { segmentIndex: number; pointsValue: number }[];
  hasSpunToday: boolean;
  lastResult?: { pointsValue: number; segmentIndex: number } | null;
  nextSpinAt: string;
};

/**
 * Shared source of truth for "does this member have a spin waiting?".
 *
 * The dock and the popup both read it so they can never disagree, and the
 * server decides eligibility — the client only reflects it. Guests never
 * request it at all, so the wheel is invisible to them.
 */
export function useDailySpin() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery<DailySpinState>({
    queryKey: ["/api/daily-spin"],
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const available = Boolean(
    isAuthenticated && data?.enabled && data?.eligible !== false && !data?.hasSpunToday,
  );

  return { state: data, isLoading, available, isAuthenticated };
}
