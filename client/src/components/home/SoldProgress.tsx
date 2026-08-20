type Props = {
  pct: number;
  remaining: number;
  maxT: number;
  compact?: boolean;
};

export default function SoldProgress({ pct, remaining, maxT, compact = false }: Props) {
  const rounded = Math.round(pct);

  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <div className="flex items-center justify-between gap-2">
        <span className={`font-black uppercase tracking-wider text-[#F1D47A] ${compact ? "text-[10px]" : "text-xs"}`}>
          {rounded}% Sold
        </span>
        <span className={`font-semibold text-white/55 ${compact ? "text-[10px]" : "text-xs"}`}>
          {remaining.toLocaleString()} / {maxT.toLocaleString()} left
        </span>
      </div>
      <div className={`w-full overflow-hidden rounded-full bg-white/10 ${compact ? "h-1.5" : "h-2"}`}>
        <div
          className="rr-progress-fill h-full rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
