import cloudHigh from "@assets/halloween-cloud-high.webp";
import cloudMid from "@assets/halloween-cloud-mid.webp";
import cloudLow from "@assets/halloween-cloud-low.webp";

/**
 * Dark cloud banks drifting across the sky.
 *
 * These were generated with SVG feTurbulence, computed live in the browser.
 * That was the right tool for making them and the wrong one for shipping
 * them: three full-width banks came to roughly five megapixels of four- and
 * five-octave Perlin noise, recomputed as the page ran, on top of three 46px
 * blurs over a similar area. On a modest machine that is the difference
 * between a smooth page and a page that stutters, which is exactly what was
 * reported on staging.
 *
 * So the noise is baked. Identical shaping — fractal noise, thresholded into
 * banks, flat dark tint, faded top and bottom — but done once, offline, and
 * shipped as three images totalling about 110 KB. The browser now scales a
 * picture and translates it, which it can do on the GPU.
 *
 * The parallax is unchanged and is still what gives the sky depth: the high
 * bank is thin, pale and slow, the low one heavy, dark and quick.
 */

const BANKS = [
  { src: cloudHigh, className: "rr-hw-cloud--high" },
  { src: cloudMid, className: "rr-hw-cloud--mid" },
  { src: cloudLow, className: "rr-hw-cloud--low" },
];

export default function HalloweenClouds() {
  return (
    <div className="rr-hw-clouds" aria-hidden>
      {BANKS.map((bank) => (
        <img
          key={bank.className}
          src={bank.src}
          alt=""
          aria-hidden
          draggable={false}
          decoding="async"
          className={`rr-hw-cloud ${bank.className}`}
        />
      ))}
    </div>
  );
}
