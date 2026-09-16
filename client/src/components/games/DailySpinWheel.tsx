import { useEffect, useRef, useState } from "react";
import wheelImg from "@assets/daily-spin-wheel.svg";
import glowImg from "@assets/daily-spin-wheel-glow.png";
import pointerImg from "@assets/daily-spin-pointer.png";

export type WheelSegment = { segmentIndex: number; pointsValue: number };

type Props = {
  segments: WheelSegment[];
  /** Segment the server already picked. Set this to start the spin. */
  landOn: number | null;
  spinning: boolean;
  onSettled: () => void;
};

const SPIN_MS = 4600;
const TURNS = 6;

/**
 * The supplied artwork already carries the prize labels, the gold rim and the
 * dividers, so the wheel is that image rotated rather than anything drawn.
 *
 * Segment 0 is the wedge at 12 o'clock and they run CLOCKWISE from there, which
 * is the order DEFAULT_PRIZE_TIERS uses. If the artwork is ever redrawn, that
 * order has to be updated to match or the pointer will stop on the wrong prize.
 *
 * The circle sits dead centre of the SVG's canvas and spans about 92.5% of the
 * image's WIDTH (the canvas is portrait, so there is empty margin above and
 * below). Scaling the image to ~106% of the square therefore makes the wheel
 * fill it with a sliver of margin left for the rim glow.
 */
const WHEEL_SCALE = 106;

/**
 * The glow layer was rendered from the artwork's red channel, framed tightly to
 * the circle. The wheel's own diameter is 92.5% of 106%, so matching that here
 * keeps the glow sitting exactly on the dividers as both rotate together.
 */
const GLOW_SCALE = WHEEL_SCALE * 0.925;

export default function DailySpinWheel({ segments, landOn, spinning, onSettled }: Props) {
  // Absolute rotation in degrees, always increasing so repeat spins keep turning.
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;

  useEffect(() => {
    if (!spinning || landOn === null || segments.length === 0) return;

    const step = 360 / segments.length;
    const position = segments.findIndex((s) => s.segmentIndex === landOn);
    const index = position >= 0 ? position : 0;

    // Bring that wedge back up to the pointer, plus whole extra turns.
    const current = rotationRef.current;
    const currentTurns = Math.ceil(current / 360);
    const target = (currentTurns + TURNS) * 360 - index * step;

    rotationRef.current = target;
    setRotation(target);

    // Fallback in case transitionend does not fire (tab backgrounded, reduced
    // motion), so the result is never left hidden behind a stuck animation.
    const timer = setTimeout(() => settledRef.current(), SPIN_MS + 250);
    return () => clearTimeout(timer);
  }, [spinning, landOn, segments]);

  const turn = {
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1)` : "none",
    willChange: "transform",
  } as const;

  return (
    <div
      className={`relative mx-auto aspect-square w-full max-w-[420px] ${
        spinning ? "rr-spin-is-spinning" : ""
      }`}
    >
      {/* Soft bloom behind the wheel. */}
      <div className="rr-spin-halo" aria-hidden />

      {/* Square clip: trims the SVG's transparent top/bottom margin only. */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={wheelImg}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute left-1/2 top-1/2 max-w-none select-none"
          style={{ width: `${WHEEL_SCALE}%`, ...turn }}
          onTransitionEnd={() => settledRef.current()}
        />

        {/* Divider glow, turning in lockstep with the wheel beneath it. */}
        <img
          src={glowImg}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="rr-spin-glow-layer absolute left-1/2 top-1/2 max-w-none select-none"
          style={{ width: `${GLOW_SCALE}%`, ...turn }}
        />
      </div>

      {/* Chaser beam around the rim, same sweep as the featured cards. */}
      <div className="rr-spin-chaser" aria-hidden />

      <img
        src={pointerImg}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-[-4%] z-10 w-[15%] -translate-x-1/2 select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)]"
      />
    </div>
  );
}
