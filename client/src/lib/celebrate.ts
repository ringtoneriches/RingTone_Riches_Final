import confetti from "canvas-confetti";

/**
 * The house celebration burst, in brand colours.
 *
 * Pulled out so wins look the same wherever they happen rather than each game
 * inventing its own. Respects prefers-reduced-motion, and never throws: a
 * celebration failing must not take the page down with it.
 */
const BRAND = ["#C8102E", "#FF263D", "#F1D47A", "#D4AF37", "#FFF8EE"];

export function celebrateWin() {
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const shoot = (particleCount: number, spread: number, startVelocity: number, origin: { x: number; y: number }) =>
      confetti({
        particleCount,
        spread,
        startVelocity,
        origin,
        colors: BRAND,
        zIndex: 20000, // above the result overlay
        disableForReducedMotion: true,
        scalar: 0.95,
      });

    // An opening burst from the middle, then two side volleys so it fills the
    // screen on wide displays without burying a phone in confetti.
    shoot(70, 70, 45, { x: 0.5, y: 0.45 });
    setTimeout(() => shoot(35, 60, 35, { x: 0.2, y: 0.55 }), 140);
    setTimeout(() => shoot(35, 60, 35, { x: 0.8, y: 0.55 }), 260);
  } catch {
    /* a missing canvas or blocked animation must not break the win */
  }
}
