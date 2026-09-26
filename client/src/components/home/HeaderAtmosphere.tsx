import { useSeason } from "@/hooks/useSeason";
import webCorner from "@assets/halloween-web-corner.webp";

/**
 * Seasonal atmosphere for the header bar.
 *
 * The owner asked for something either side of the logo. That space is smaller
 * than it looks: the bar is a three-column grid with the logo capped at 46vw,
 * so on a 390px phone the left gap is about 53px and the right one about 3px
 * once the wallet chip is in — and nothing at all when the balance reads
 * £1,234.56 rather than £0.00. Decorating the two gaps would look right on one
 * screenshot and broken on the next.
 *
 * So this lights the whole bar instead and sits behind the controls: two soft
 * beams angled down from the top edge, which fill exactly that dead space and
 * leave the logo looking picked out between them, plus a web tucked into each
 * far corner where there is genuinely room at every width.
 *
 * Nothing here animates. The header is fixed and on every page, so a drifting
 * fog would repaint continuously while scrolling — which is what made the
 * theme feel heavy on staging the first time round.
 *
 * Rendered conditionally rather than hidden with CSS: a hidden <img> is still
 * downloaded, and the clouds taught us that once already.
 */
export default function HeaderAtmosphere() {
  const { season } = useSeason();
  if (season !== "halloween") return null;

  return (
    <div className="rr-header-atmos" aria-hidden>
      <span className="rr-header-beam rr-header-beam--left" />
      <span className="rr-header-beam rr-header-beam--right" />
      <img src={webCorner} alt="" className="rr-header-web rr-header-web--left" loading="lazy" decoding="async" />
      <img src={webCorner} alt="" className="rr-header-web rr-header-web--right" loading="lazy" decoding="async" />
    </div>
  );
}
