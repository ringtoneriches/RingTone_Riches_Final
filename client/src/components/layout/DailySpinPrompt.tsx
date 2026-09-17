import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Sparkles, X } from "lucide-react";
import { useDailySpin } from "@/hooks/useDailySpin";
import wheelImg from "@assets/daily-spin-wheel.svg";

/**
 * How members find the Daily Spin. There is no nav entry: a permanent link
 * would sit there greyed out most of the day, and would show the wheel to
 * guests who cannot use it.
 *
 * Instead both pieces here appear ONLY while a spin is actually waiting, and
 * both disappear for the rest of the day once it is taken:
 *
 *   - a floating button, always reachable
 *   - a popup, shown at most once per day so it invites rather than nags
 *
 * Guests never see either, because the hook does not even fetch for them.
 */

const HIDE_ON = [
  "/daily-spin",
  "/admin",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/create-password",
  "/guest-checkout",
  "/checkout",
  "/basket",
  "/success",
  "/failed",
];

function shouldHide(path: string) {
  return HIDE_ON.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Remembers the last UK day we showed the popup, so it appears once a day. */
const SEEN_KEY = "rr-daily-spin-prompt";

function alreadyPromptedToday(today: string) {
  try {
    return window.localStorage.getItem(SEEN_KEY) === today;
  } catch {
    // Private windows and blocked storage: fall back to showing it.
    return false;
  }
}

function markPromptedToday(today: string) {
  try {
    window.localStorage.setItem(SEEN_KEY, today);
  } catch {
    /* nothing to do */
  }
}

export default function DailySpinPrompt({ hidden = false }: { hidden?: boolean }) {
  const [location] = useLocation();
  const { state, available } = useDailySpin();
  const [showPopup, setShowPopup] = useState(false);

  // The server tells us when the next spin unlocks; the day before that is the
  // day this spin belongs to. Keying on it means the popup returns tomorrow
  // without needing the client's own idea of the date.
  const today = state?.nextSpinAt ? state.nextSpinAt.slice(0, 10) : "";
  const hide = hidden || shouldHide(location);

  useEffect(() => {
    if (!available || hide || !today) return;
    if (alreadyPromptedToday(today)) return;

    // Let the page settle first so it reads as an invitation, not an ambush.
    const timer = setTimeout(() => {
      setShowPopup(true);
      markPromptedToday(today);
    }, 2200);
    return () => clearTimeout(timer);
  }, [available, hide, today]);

  if (!available || hide) return null;

  return (
    <>
      <Link href="/daily-spin">
        <div className="rr-spin-dock" data-testid="dock-daily-spin">
          <span className="rr-spin-dock-fab">
            <span className="rr-spin-dock-icon">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="rr-spin-dock-copy">
              <span className="rr-spin-dock-kicker">Free spin ready</span>
              <span className="rr-spin-dock-label">Daily Spin</span>
            </span>
          </span>
        </div>
      </Link>

      {showPopup && (
        <div className="rr-spin-modal" role="dialog" aria-modal="true" aria-label="Your free daily spin">
          <button
            className="rr-spin-modal-scrim"
            aria-label="Close"
            onClick={() => setShowPopup(false)}
          />
          <div className="rr-spin-modal-card">
            <button
              className="rr-spin-modal-close"
              aria-label="Close"
              onClick={() => setShowPopup(false)}
            >
              <X className="h-4 w-4" />
            </button>

            <img src={wheelImg} alt="" aria-hidden="true" className="rr-spin-modal-wheel" />

            <p className="rr-spin-modal-kicker">Members only · free every day</p>
            <h2 className="rr-spin-modal-title">YOUR FREE SPIN IS READY</h2>
            <p className="rr-spin-modal-text">
              Win up to 500 Ringtone Points to spend on games. No purchase, one spin a day.
            </p>

            <Link href="/daily-spin">
              <button
                className="rr-cta rr-spin-modal-cta"
                onClick={() => setShowPopup(false)}
                data-testid="button-daily-spin-popup"
              >
                Spin now
              </button>
            </Link>
            <button className="rr-spin-modal-later" onClick={() => setShowPopup(false)}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
