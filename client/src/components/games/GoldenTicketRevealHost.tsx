import { useEffect, useRef, useState } from "react";
import GoldenTicketReveal, { type GoldenTicketAward } from "./GoldenTicketReveal";
import { subscribeGoldenTicket } from "@/lib/golden-ticket";

/**
 * Mounted once at the app root, and responsible for *when* a ticket appears.
 *
 * A fixed delay was not good enough. Games take different lengths of time to
 * settle and some open their result popup late, so the ticket sometimes landed
 * on top of "unlucky" and sometimes beat it to the screen. Either way it read
 * as part of the game, which is the opposite of the point.
 *
 * So the ticket waits for the screen to be genuinely clear, and then for it to
 * stay clear — if a game popup opens during the settle window, the countdown
 * starts again. The player dismisses their own result first, and only then
 * does the Golden Ticket arrive, on a blank screen, as its own event.
 */

/** Every GameResultOverlay carries this, whichever game rendered it. */
const GAME_RESULT = '[aria-labelledby="game-result-title"]';
const OPEN_DIALOG = '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]';

/** The screen has to stay clear this long before the ticket appears. */
const SETTLE_MS = 900;
/** Never hold a ticket back forever, whatever the page is doing. */
const MAX_WAIT_MS = 45_000;

function screenIsClear() {
  if (typeof document === "undefined") return false;
  if (document.documentElement.classList.contains("rr-reveal-summary-open")) return false;
  if (document.querySelector(GAME_RESULT)) return false;
  if (document.querySelector(OPEN_DIALOG)) return false;
  return true;
}

export default function GoldenTicketRevealHost() {
  const [award, setAward] = useState<GoldenTicketAward | null>(null);
  const pending = useRef<GoldenTicketAward | null>(null);

  useEffect(() => subscribeGoldenTicket((next) => { pending.current = next; }), []);

  useEffect(() => {
    let clearSince: number | null = null;
    const startedAt = Date.now();

    const timer = window.setInterval(() => {
      const next = pending.current;
      if (!next || award) return;

      if (!screenIsClear()) {
        // A popup opened, or is still open. Start the settle window again.
        clearSince = null;
        if (Date.now() - startedAt > MAX_WAIT_MS) {
          pending.current = null;
          setAward(next);
        }
        return;
      }

      if (clearSince === null) clearSince = Date.now();
      if (Date.now() - clearSince >= SETTLE_MS) {
        pending.current = null;
        setAward(next);
      }
    }, 150);

    return () => window.clearInterval(timer);
  }, [award]);

  return <GoldenTicketReveal award={award} onClose={() => setAward(null)} />;
}
