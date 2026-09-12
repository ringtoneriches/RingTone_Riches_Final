import { flashSaleState, type FlashSaleFields } from "@shared/flash-sale";
import { useCountdown } from "@/hooks/useCountdown";
import "./flash-price.css";

type Props = {
  competition: FlashSaleFields;
  isFree?: boolean;
  /** "tag" = small pill over the artwork, "entry" = the Entry price block. */
  variant?: "tag" | "entry";
  showTimer?: boolean;
  className?: string;
};

function SaleTimer({ endsAt }: { endsAt: Date }) {
  const time = useCountdown(endsAt);
  const label = time.d
    ? `${time.d}d ${time.h}h left`
    : time.h
      ? `${time.h}h ${time.m}m left`
      : `${time.m}m ${String(time.s).padStart(2, "0")}s left`;

  return <span className="rr-flash-timer">{label}</span>;
}

/**
 * Price display that knows about flash sales: normal price struck through,
 * sale price beside it. The price itself comes from the shared rule the server
 * charges with, so what is shown is always what is charged.
 */
export default function FlashPrice({
  competition,
  isFree = false,
  variant = "entry",
  showTimer = false,
  className = "",
}: Props) {
  const sale = flashSaleState(competition);
  const priceText = isFree ? "FREE" : `£${sale.price.toFixed(2)}`;

  if (!sale.isLive) {
    return <span className={className}>{priceText}</span>;
  }

  return (
    <span className={`rr-flash ${variant === "tag" ? "rr-flash--tag" : "rr-flash--entry"} ${className}`}>
      <span className="rr-flash-row">
        <span className="rr-flash-was">£{sale.basePrice.toFixed(2)}</span>
        <span className="rr-flash-now">{priceText}</span>
      </span>
      {variant === "entry" && (
        <span className="rr-flash-meta">
          <span className="rr-flash-badge">Flash sale</span>
          {showTimer && sale.endsAt ? <SaleTimer endsAt={sale.endsAt} /> : null}
        </span>
      )}
    </span>
  );
}
