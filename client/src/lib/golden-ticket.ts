import type { GoldenTicketAward } from "@/components/games/GoldenTicketReveal";

/**
 * Carries a Golden Ticket from a game's response to the reveal overlay.
 *
 * The server returns the ticket alongside the play result, but the whole point
 * of the feature is that it arrives *after* the player thinks the game is
 * over. So a game publishes the ticket when its own animation has finished,
 * with a short delay on top, and the overlay is mounted once at the app root
 * rather than in every game.
 *
 * A single pending ticket at a time: a second publish replaces the first,
 * which is what should happen if someone starts another play.
 */
type Listener = (award: GoldenTicketAward) => void;

const listeners = new Set<Listener>();
let pending: ReturnType<typeof setTimeout> | undefined;

/** Default pause after the game settles, so the two moments read separately. */
export const GOLDEN_TICKET_DELAY_MS = 1600;

export function publishGoldenTicket(
  award: GoldenTicketAward | null | undefined,
  delayMs: number = GOLDEN_TICKET_DELAY_MS,
) {
  if (!award) return;
  if (pending) clearTimeout(pending);
  pending = setTimeout(() => {
    pending = undefined;
    listeners.forEach((listener) => {
      try {
        listener(award);
      } catch (error) {
        console.error("[golden-ticket] reveal listener failed:", error);
      }
    });
  }, Math.max(0, delayMs));
}

export function subscribeGoldenTicket(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Drop anything queued, e.g. when leaving the game mid-animation. */
export function cancelPendingGoldenTicket() {
  if (pending) clearTimeout(pending);
  pending = undefined;
}

/**
 * How long to wait after a game's response before revealing the ticket.
 *
 * Each game animates for a different length of time, and the reveal has to
 * land after the player has seen their own result — that gap is the feature.
 * These are deliberately generous; better a beat too late than on top of the
 * animation.
 */
export const GOLDEN_TICKET_DELAYS = {
  spin: 1600,
  pop: 2400,
  plinko: 4500,
  voltz: 3400,
  slot: 3600,
  royal: 3400,
  scratch: 2000,
  /** Bulk reveals animate a whole batch before settling. */
  batch: 2600,
} as const;
