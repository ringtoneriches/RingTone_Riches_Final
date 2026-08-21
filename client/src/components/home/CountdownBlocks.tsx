import { CountdownParts } from "@/hooks/useCountdown";

type Props = {
  time: CountdownParts;
  size?: "sm" | "lg";
  ended?: boolean;
};

export default function CountdownBlocks({ time, size = "sm", ended = false }: Props) {
  const units = [
    { v: time.d, l: size === "lg" ? "Days" : "D" },
    { v: time.h, l: size === "lg" ? "Hours" : "H" },
    { v: time.m, l: size === "lg" ? "Mins" : "M" },
    { v: time.s, l: size === "lg" ? "Secs" : "S" },
  ];

  if (ended) {
    return (
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
        Draw complete
      </span>
    );
  }

  return (
    <div className={`rr-countdown flex items-end ${size === "lg" ? "gap-2 sm:gap-3" : "gap-1"}`}>
      {units.map((u) => (
        <div key={u.l} className="text-center">
          <div
            className={`rr-tick rounded-md border border-[#C8102E]/35 bg-black/70 font-black text-white tabular-nums ${
              size === "lg"
                ? "min-w-[2.45rem] sm:min-w-[3.1rem] lg:min-w-[3.6rem] px-1.5 sm:px-2 py-1.5 sm:py-2 text-lg sm:text-xl lg:text-2xl"
                : "min-w-[1.55rem] px-1 py-0.5 text-[11px] sm:text-xs"
            }`}
            style={{ color: "#F1D47A" }}
          >
            {String(u.v).padStart(2, "0")}
          </div>
          <div
            className={`mt-0.5 font-bold uppercase tracking-wider text-white/40 ${
              size === "lg" ? "text-[8px] sm:text-[10px]" : "text-[8px]"
            }`}
          >
            {size === "lg" ? (
              <>
                <span className="sm:hidden">{u.l.charAt(0)}</span>
                <span className="hidden sm:inline">{u.l}</span>
              </>
            ) : (
              u.l
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
