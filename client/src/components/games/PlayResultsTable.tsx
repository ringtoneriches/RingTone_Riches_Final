import type { ReactNode } from "react";

export type PlayResultTone = "win" | "lose" | "replay" | "pending";

export type PlayResultRow = {
  id?: string | number;
  number: number;
  status: string;
  tone: PlayResultTone;
  prize: string;
};

type Props = {
  title?: string;
  rows: PlayResultRow[];
  emptyTitle?: string;
  emptyHint?: string;
  className?: string;
  headerRight?: ReactNode;
  testId?: string;
  emptyTestId?: string;
};

const STATUS_PILL: Record<PlayResultTone, string> = {
  win: "bg-[#F1D47A]/15 text-[#F1D47A] border-[#F1D47A]/35",
  lose: "bg-white/5 text-white/50 border-white/10",
  replay: "bg-[#F1D47A]/10 text-[#F1D47A] border-[#F1D47A]/30",
  pending: "bg-white/[0.03] text-white/35 border-white/10",
};

export default function PlayResultsTable({
  title = "Results",
  rows,
  emptyTitle = "NO RESULTS YET",
  emptyHint = "Play to see each result here.",
  className = "",
  headerRight,
  testId,
  emptyTestId,
}: Props) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0D] ${className}`}
      data-testid={testId}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
        <h2 className="font-prize text-lg leading-none tracking-wide text-white sm:text-xl">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {rows.length > 0 && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
              {rows.length} {rows.length === 1 ? "play" : "plays"}
            </span>
          )}
          {headerRight}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-10 text-center sm:py-12">
          <p className="font-prize text-xl text-white" data-testid={emptyTestId}>
            {emptyTitle}
          </p>
          <p className="mt-2 text-sm text-white/40">{emptyHint}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[40px_minmax(0,1fr)_minmax(5.5rem,auto)] border-b border-white/10 px-4 py-2 sm:grid-cols-[52px_1fr_8rem] sm:px-5">
            {["#", "Status", "Prize"].map((h) => (
              <div
                key={h}
                className={`text-[9px] font-black uppercase tracking-[0.16em] text-white/35 ${
                  h === "Prize" ? "text-right" : ""
                }`}
              >
                {h}
              </div>
            ))}
          </div>
          <div className="max-h-[min(52vh,420px)] overflow-y-auto">
            {rows.map((row, i) => (
              <div
                key={row.id ?? `${row.number}-${i}`}
                className="grid grid-cols-[40px_minmax(0,1fr)_minmax(5.5rem,auto)] items-center gap-2 border-b border-white/10 px-4 py-2.5 sm:grid-cols-[52px_1fr_8rem] sm:px-5"
                style={{
                  borderLeft: `3px solid ${
                    row.tone === "win" || row.tone === "replay"
                      ? "#F1D47A"
                      : row.tone === "lose"
                        ? "rgba(200,16,46,0.55)"
                        : "transparent"
                  }`,
                  background:
                    row.tone === "win" || row.tone === "replay"
                      ? "rgba(241,212,122,0.05)"
                      : "transparent",
                }}
              >
                <div className="font-prize text-sm tabular-nums text-[#F1D47A]/80">#{row.number}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${STATUS_PILL[row.tone]}`}
                  >
                    {row.status}
                  </span>
                </div>
                <div
                  className={`truncate text-right text-sm font-black tabular-nums ${
                    row.tone === "win" || row.tone === "replay" ? "text-[#F1D47A]" : "text-white/30"
                  }`}
                  title={row.prize}
                >
                  {row.prize}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function prizeFromReward(opts: {
  isWin?: boolean;
  rewardType?: string | null;
  rewardValue?: string | number | null;
  prizeName?: string | null;
}): { status: string; tone: PlayResultTone; prize: string } {
  const type = (opts.rewardType || "").toLowerCase();
  if (type === "try_again" || type === "free_play" || type === "freeplay") {
    return { status: "Replay", tone: "replay", prize: "Free play" };
  }
  if (opts.isWin && (type === "cash" || type === "euro")) {
    const n = Number(opts.rewardValue || 0);
    return { status: "Win", tone: "win", prize: Number.isFinite(n) && n ? `£${n.toFixed(2)}` : "Win" };
  }
  if (opts.isWin && type === "points") {
    const n = parseInt(String(opts.rewardValue || "0"), 10) || 0;
    return { status: "Win", tone: "win", prize: n ? `${n.toLocaleString()} pts` : "Points" };
  }
  if (opts.isWin && type === "physical") {
    return {
      status: "Win",
      tone: "win",
      prize: opts.prizeName || String(opts.rewardValue || "Prize"),
    };
  }
  if (opts.isWin) {
    const raw = opts.prizeName || opts.rewardValue;
    return { status: "Win", tone: "win", prize: raw != null && raw !== "" ? String(raw) : "Win" };
  }
  return { status: "Lose", tone: "lose", prize: "—" };
}
