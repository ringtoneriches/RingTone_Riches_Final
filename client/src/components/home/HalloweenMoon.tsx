import moonImg from "@assets/halloween-moon.webp";

/**
 * The moon.
 *
 * This is a photograph, not a drawing. Earlier attempts built the surface out
 * of gradients and then out of noise plus hand-placed craters, and both read
 * as fake for the same reason: a drawn moon has whatever features someone
 * thought to put there, and the eye knows the real arrangement even when it
 * cannot name it.
 *
 * So it is the real near side — NASA's CGI Moon Kit colour map, projected
 * from the equirectangular original onto a disc. Mare Tranquillitatis,
 * Copernicus and Tycho's rays are all where they belong, because they are
 * photographed rather than invented.
 *
 * Deliberately not lazy-loaded: it sits in a position:fixed layer, which the
 * lazy-loading heuristics treat as off-screen, and it is part of the first
 * thing anyone sees.
 *
 * 59 KB, public domain, credited in attached_assets/halloween-moon.CREDIT.txt.
 * No 3D runtime: the moon never turns, so a sphere would cost a WebGL
 * renderer to show one fixed face that an image already shows perfectly.
 */

type Props = { className?: string };

export default function HalloweenMoon({ className = "" }: Props) {
  return (
    <div className={`rr-hw-moon-stack ${className}`}>
      <img
        src={moonImg}
        alt=""
        aria-hidden
        draggable={false}
        decoding="async"
        className="rr-hw-moon-img"
      />
      <MoonShroud />
    </div>
  );
}

/**
 * The cloud bank crossing the moon.
 *
 * Not a veil over the whole disc — that just dims it, and a dimmed moon reads
 * as a weak moon rather than a covered one. This eats into the disc: dense
 * black cloud with a torn, turbulent edge, leaving roughly 60% of the body
 * showing and the rest genuinely gone.
 *
 * It drifts slowly across, so how much is covered breathes between about half
 * and two thirds instead of sitting still like a shape cut out of paper.
 */
function MoonShroud() {
  return (
    <svg className="rr-hw-moon-shroud" viewBox="0 0 200 200" aria-hidden focusable="false">
      <defs>
        {/* A torn edge, not a smooth one. The displacement is what stops it
            looking like a gradient laid over the disc. */}
        <filter id="rr-hw-shroud-edge" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.03" numOctaves="4" seed="9" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="34" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="2.2" />
        </filter>

        {/* Dense at the core, fraying out — cloud is thickest in the middle
            of a bank and ragged at its edges. */}
        <radialGradient id="rr-hw-shroud-body" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#05040a" stopOpacity="0.99" />
          <stop offset="58%" stopColor="#07050d" stopOpacity="0.96" />
          <stop offset="82%" stopColor="#0a0712" stopOpacity="0.62" />
          <stop offset="100%" stopColor="#0c0916" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Two overlapping lobes read as one bank with depth, where a single
          ellipse reads as a thumbprint. */}
      {/* The disc sits at (100,100) with a radius of about 69 in these
          coordinates, so the lobes ride along its lower left and take roughly
          a third of it — leaving about 60% of the body in the clear. */}
      <g filter="url(#rr-hw-shroud-edge)" className="rr-hw-moon-shroud-drift">
        <ellipse cx="28" cy="138" rx="100" ry="56" fill="url(#rr-hw-shroud-body)" />
        <ellipse cx="96" cy="176" rx="92" ry="50" fill="url(#rr-hw-shroud-body)" />
      </g>
    </svg>
  );
}
