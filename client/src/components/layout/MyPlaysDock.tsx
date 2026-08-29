import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Gamepad2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { readyToPlayOrders, type UnplayedOrder } from "@/lib/unplayed-orders";

const HIDDEN = [
  "/my-plays",
  "/basket",
  "/guest-checkout",
  "/create-password",
  "/admin",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
];

function shouldHide(path: string) {
  if (HIDDEN.some((route) => path === route || path.startsWith(`${route}/`))) return true;
  return /\/(spin|scratch|pop|plinko|voltz|slot|royal)\/|\/play\//.test(path);
}

export default function MyPlaysDock({ hidden = false }: { hidden?: boolean }) {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: playOrders = [] } = useQuery<UnplayedOrder[]>({
    queryKey: ["/api/user/orders"],
    enabled: isAuthenticated && !hidden && !shouldHide(location),
    staleTime: 30000,
  });

  const readyPlayCount = readyToPlayOrders(playOrders).filter((order) => {
    const created = new Date(order.orders.createdAt).getTime();
    const type = (order.competitions?.type || "").toLowerCase();
    if (!["spin", "scratch", "pop", "plinko", "voltz"].includes(type)) return true;
    return Date.now() < created + 2 * 60 * 60 * 1000;
  }).length;

  if (hidden || shouldHide(location)) return null;

  return (
    <Link href="/my-plays" aria-label="My Plays — games you bought and have not finished">
      <div className="rr-plays-dock" data-testid="dock-my-plays">
        <span className="rr-plays-fab">
          <span className="rr-plays-fab-icon">
            <Gamepad2 className="h-5 w-5" />
            {readyPlayCount > 0 && (
              <span className="rr-plays-fab-badge">{readyPlayCount > 99 ? "99+" : readyPlayCount}</span>
            )}
          </span>
          <span className="rr-plays-fab-copy">
            <span className="rr-plays-fab-kicker">Ready to play</span>
            <span className="rr-plays-fab-title">My Plays</span>
          </span>
        </span>
      </div>
    </Link>
  );
}
