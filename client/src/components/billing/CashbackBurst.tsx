import { formatCashbackPounds } from "@shared/card-cashback";

type Props = {
  amount: number;
  variant?: "toast" | "hero";
};

export default function CashbackBurst({ amount, variant = "toast" }: Props) {
  const credit = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(credit) || credit < 0.01) return null;

  return (
    <div className={`rr-cashback rr-cashback--${variant}`} role="status">
      <span className="rr-cashback__shine" aria-hidden />
      <span className="rr-cashback__kicker">1% card reward</span>
      <p className="rr-cashback__amount">+{formatCashbackPounds(credit)}</p>
      <p className="rr-cashback__line">
        {variant === "hero" ? "Already in your wallet. Play it again." : "Already in your wallet"}
      </p>
    </div>
  );
}
