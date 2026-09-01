import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { gameTypeLabel } from "@/lib/play-paths";
import type { CheckoutBoostOffer } from "@/lib/checkout-boost";

type Props = {
  open: boolean;
  currentTotal: number;
  offers: CheckoutBoostOffer[];
  onSkip: () => void;
  onConfirm: (offer: CheckoutBoostOffer) => void;
};

export default function CheckoutBoostModal({ open, currentTotal, offers, onSkip, onConfirm }: Props) {
  const [selectedId, setSelectedId] = useState(offers[Math.min(1, Math.max(offers.length - 1, 0))]?.id);

  useEffect(() => {
    if (!open || !offers.length) return;
    setSelectedId(offers[Math.min(1, offers.length - 1)].id);
  }, [open, offers]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onSkip]);

  if (!open || !offers.length) return null;

  const selected = offers.find((offer) => offer.id === selectedId) || offers[0];
  const hero = selected || offers[0];

  return (
    <div className="rr-boost" role="dialog" aria-modal="true" aria-labelledby="rr-boost-title">
      <div className="rr-boost__scrim" />
      <div className="rr-boost__card">
        <div className="rr-boost__top">
          <p className="rr-boost__kicker">Last look</p>
          <button type="button" className="rr-boost__close" onClick={onSkip} aria-label="Skip and checkout">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rr-boost__stage">
          <div className="rr-boost__stack" aria-hidden>
            <span />
            <span />
            <article>
              {hero.imageUrl ? <img src={hero.imageUrl} alt="" /> : <div className="rr-boost__fallback" />}
            </article>
          </div>
          <p className="rr-boost__game">{gameTypeLabel(hero.type)}</p>
          <h2 id="rr-boost-title" className="rr-boost__title">
            BOOST YOUR
            <span>PLAYS</span>
          </h2>
          <p className="rr-boost__copy">
            Add more of <strong>{hero.title}</strong> — same price as the cart. Skip anytime.
          </p>
        </div>

        <div className="rr-boost__picks">
          <p className="rr-boost__hint">
            Your cart is £{currentTotal.toFixed(2)}. Take it to:
          </p>
          <div className="rr-boost__pills">
            {offers.map((offer) => {
              const on = offer.id === selected.id;
              return (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => setSelectedId(offer.id)}
                  className={`rr-boost__pill ${on ? "is-on" : ""}`}
                  aria-pressed={on}
                >
                  £{offer.newTotal.toFixed(2)}
                </button>
              );
            })}
          </div>
          <p className="rr-boost__detail">
            +{selected.extraQty} {selected.unitLabel}
            <span> · extra £{selected.extraCost.toFixed(2)}</span>
          </p>
        </div>

        <div className="rr-boost__actions">
          <button type="button" className="rr-boost__skip" onClick={onSkip}>
            Skip
          </button>
          <button type="button" className="rr-cta rr-boost__go" onClick={() => onConfirm(selected)}>
            Add &amp; checkout
          </button>
        </div>
      </div>
    </div>
  );
}
