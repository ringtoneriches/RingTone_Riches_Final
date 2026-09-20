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
    <img
      src={moonImg}
      alt=""
      aria-hidden
      draggable={false}
      decoding="async"
      className={`rr-hw-moon-img ${className}`}
    />
  );
}
