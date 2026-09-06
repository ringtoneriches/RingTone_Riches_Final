import { Minus, Plus } from "lucide-react";

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function QuantitySelector({
  value,
  min = 1,
  max = 20,
  onChange,
  disabled = false,
  size = "sm",
  className = "",
}: Props) {
  const box =
    size === "lg"
      ? "h-12 sm:h-14"
      : size === "md"
        ? "h-11"
        : "h-9";
  const hit =
    size === "lg"
      ? "w-11 sm:w-12 h-12 sm:h-14"
      : size === "md"
        ? "w-10 h-11"
        : "w-8 h-9";
  const icon = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const valueClass = size === "sm" ? "text-sm" : "text-base";

  return (
    <div
      className={`inline-flex shrink-0 items-center rounded-lg border border-white/10 bg-black/50 ${box} ${className}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={(e) => {
          e.stopPropagation();
          onChange(Math.max(min, value - 1));
        }}
        className={`flex items-center justify-center text-[#F1D47A] transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent ${hit}`}
        data-testid="button-decrease-qty"
      >
        <Minus className={icon} />
      </button>
      <span
        className={`min-w-[1.75rem] text-center font-black text-white tabular-nums ${valueClass}`}
        data-testid="text-quantity"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={(e) => {
          e.stopPropagation();
          onChange(Math.min(max, value + 1));
        }}
        className={`flex items-center justify-center text-[#F1D47A] transition-colors hover:bg-[#C8102E]/30 disabled:opacity-30 disabled:hover:bg-transparent ${hit}`}
        data-testid="button-increase-qty"
      >
        <Plus className={icon} />
      </button>
    </div>
  );
}
