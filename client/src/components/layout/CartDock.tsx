import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart } from "lucide-react";
import { useBasket } from "@/hooks/useBasket";

const HIDDEN = [
  "/basket",
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

export default function CartDock({ hidden = false }: { hidden?: boolean }) {
  const [location] = useLocation();
  const { count } = useBasket();
  const prevCount = useRef(count);
  const [bump, setBump] = useState(false);
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    if (count > prevCount.current) {
      setDelta(count - prevCount.current);
      setBump(true);
      const timer = window.setTimeout(() => setBump(false), 1400);
      prevCount.current = count;
      return () => window.clearTimeout(timer);
    }
    prevCount.current = count;
  }, [count]);

  if (hidden || shouldHide(location)) return null;

  const label =
    count === 0
      ? "Cart — empty"
      : count === 1
        ? "Cart — 1 item"
        : `Cart — ${count} items`;

  return (
    <Link href="/basket" aria-label={label}>
      <div className="rr-cart-dock" data-testid="dock-cart">
        <span
          className={`rr-plays-fab rr-cart-fab${count > 0 ? " is-live" : ""}${bump ? " is-bump" : ""}`}
        >
          {bump && (
            <>
              <span className="rr-cart-ping" aria-hidden />
              <span className="rr-cart-ping rr-cart-ping--2" aria-hidden />
              <span className="rr-cart-added" aria-hidden>
                +{delta}
              </span>
            </>
          )}
          <span className="rr-plays-fab-icon">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className={`rr-plays-fab-badge${bump ? " is-pop" : ""}`}>
                {count > 99 ? "99+" : count}
              </span>
            )}
          </span>
          <span className="rr-plays-fab-copy">
            <span className="rr-plays-fab-kicker">{count > 0 ? "Ready to pay" : "Your cart"}</span>
            <span className="rr-plays-fab-title">Cart</span>
          </span>
        </span>
      </div>
    </Link>
  );
}
