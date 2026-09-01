import { useEffect } from "react";
import { Sparkles, Trophy, X } from "lucide-react";
import confetti from "canvas-confetti";
import {
  formatResultTicket,
  prizeFromReward,
  type PlayResultRow,
} from "@/components/games/PlayResultsTable";

export type RevealBatchRow = PlayResultRow & {
  detail?: string;
};

type Props = {
  open: boolean;
  rows: RevealBatchRow[];
  playNoun?: string;
  cashWon?: number;
  pointsWon?: number;
  variant?: "modal" | "overlay";
  dismissLabel?: string;
  onDismiss: () => void;
};

function TableBlock({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: RevealBatchRow[];
  empty: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="border-b border-white/10 px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#F1D47A]/80">
          {title}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="px-3 py-4 text-center text-xs text-white/40">{empty}</p>
      ) : (
        <div className="max-h-[22vh] overflow-y-auto">
          <div className="grid grid-cols-[36px_minmax(0,1fr)_minmax(4.5rem,auto)_minmax(4.5rem,auto)] border-b border-white/8 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/35">
            <span>#</span>
            <span>Status</span>
            <span>Ticket</span>
            <span className="text-right">Prize</span>
          </div>
          {rows.map((row, i) => {
            const ticket =
              row.tone === "win" || row.tone === "replay"
                ? formatResultTicket(row.ticketNumber)
                : null;
            return (
              <div
                key={row.id ?? `${row.number}-${i}`}
                className="grid grid-cols-[36px_minmax(0,1fr)_minmax(4.5rem,auto)_minmax(4.5rem,auto)] items-center gap-1 border-b border-white/6 px-3 py-2 last:border-b-0"
                style={{
                  background:
                    row.tone === "win" || row.tone === "replay"
                      ? "rgba(241,212,122,0.06)"
                      : "transparent",
                }}
              >
                <span className="text-[11px] font-black tabular-nums text-[#F1D47A]/80">
                  #{row.number}
                </span>
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${
                      row.tone === "lose" ? "text-white/45" : "text-white"
                    }`}
                  >
                    {row.status}
                  </p>
                  {row.detail && (
                    <p className="truncate text-[10px] text-white/35">{row.detail}</p>
                  )}
                </div>
                <span className="truncate text-[11px] font-bold tabular-nums text-white/50">
                  {ticket || "—"}
                </span>
                <span
                  className={`truncate text-right text-sm font-black tabular-nums ${
                    row.tone === "win" || row.tone === "replay"
                      ? "text-[#F1D47A]"
                      : "text-white/30"
                  }`}
                >
                  {row.prize}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RevealAllBatchSummary({
  open,
  rows,
  playNoun = "play",
  cashWon = 0,
  pointsWon = 0,
  variant = "modal",
  dismissLabel = "View your results",
  onDismiss,
}: Props) {
  const hadWin = rows.some((r) => r.tone === "win") || cashWon > 0 || pointsWon > 0;

  useEffect(() => {
    if (!open || rows.length === 0 || !hadWin) return;
    const colors = ["#F1D47A", "#D4AF37", "#C8102E", "#FF263D", "#fff8ee"];
    confetti({ particleCount: 80, spread: 76, origin: { y: 0.62 }, colors, startVelocity: 46 });
  }, [open, rows.length, hadWin]);

  if (!open || rows.length === 0) return null;

  const wins = rows.filter((r) => r.tone === "win");
  const replays = rows.filter((r) => r.tone === "replay");
  const losses = rows.filter((r) => r.tone === "lose");
  const noun = rows.length === 1 ? playNoun : `${playNoun}s`;
  const prizeLabel =
    cashWon > 0
      ? `£${cashWon.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : pointsWon > 0
        ? `${pointsWon.toLocaleString()} pts`
        : "—";

  const shellClass =
    variant === "overlay"
      ? "absolute inset-0 z-30 flex items-center justify-center p-3"
      : "fixed inset-0 z-[9998] flex items-center justify-center overflow-y-auto p-4";

  return (
    <div
      className={shellClass}
      style={{ background: "rgba(5,5,5,0.92)", backdropFilter: "blur(10px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reveal-batch-title"
    >
      <div className="relative w-full max-w-[460px]">
        <div
          className="max-h-[88vh] overflow-hidden rounded-2xl border border-[#F1D47A]/30 bg-[#050505] shadow-[0_0_60px_rgba(241,212,122,0.12)]"
        >
          <div className="sticky top-0 z-10 border-b border-[#F1D47A]/20 bg-[#050505] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#F1D47A]" />
                <h2 id="reveal-batch-title" className="font-prize text-xl text-[#F1D47A] sm:text-2xl">
                  BATCH COMPLETE
                </h2>
              </div>
              <button
                type="button"
                onClick={onDismiss}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#F1D47A]/30 text-[#F1D47A]/70"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-white/50">
              {rows.length} {noun} settled instantly. Outcomes first, then any prizes won.
            </p>

            <div className="mt-3 grid grid-cols-4 gap-2">
              <div className="rounded-lg border border-[#F1D47A]/15 bg-[#F1D47A]/5 p-2 text-center">
                <div className="font-prize text-lg text-[#F1D47A]">{rows.length}</div>
                <div className="text-[9px] font-black uppercase tracking-wider text-[#F1D47A]/50">Plays</div>
              </div>
              <div className="rounded-lg border border-[#F1D47A]/15 bg-[#F1D47A]/5 p-2 text-center">
                <div className="font-prize text-lg text-[#F1D47A]">{wins.length}</div>
                <div className="text-[9px] font-black uppercase tracking-wider text-[#F1D47A]/50">Wins</div>
              </div>
              <div className="rounded-lg border border-[#F1D47A]/15 bg-[#F1D47A]/5 p-2 text-center">
                <div className="font-prize text-lg text-[#F1D47A]">{replays.length}</div>
                <div className="text-[9px] font-black uppercase tracking-wider text-[#F1D47A]/50">Replays</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                <div className="font-prize text-lg text-[#fff8ee]">{losses.length}</div>
                <div className="text-[9px] font-black uppercase tracking-wider text-white/40">No win</div>
              </div>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto px-4 py-3">
            <TableBlock title="Every play" rows={rows} empty="No plays in this batch." />
            <TableBlock
              title="Prizes won"
              rows={wins}
              empty="No prizes in this batch."
            />
          </div>

          <div className="sticky bottom-0 border-t border-[#F1D47A]/20 bg-[#050505] px-5 py-4">
            {(cashWon > 0 || pointsWon > 0) && (
              <div className="mb-3 flex items-center justify-center gap-4 rounded-xl border border-[#F1D47A]/15 bg-[#F1D47A]/5 p-3">
                {cashWon > 0 && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-[#F1D47A]" />
                    <span className="text-xs text-[#F1D47A]/60">CASH</span>
                    <span className="font-prize text-lg text-[#F1D47A]">{prizeLabel}</span>
                  </div>
                )}
                {pointsWon > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#F1D47A]/60">POINTS</span>
                    <span className="font-prize text-lg text-[#F1D47A]">
                      {pointsWon.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
            <p className="mb-3 text-center text-xs text-white/40">
              {hadWin
                ? "Prizes are already on your account. The results table below keeps every play."
                : "No wins this batch — every outcome is listed below when you continue."}
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="rr-cta h-12 w-full rounded-xl text-sm font-black uppercase tracking-[0.16em]"
            >
              {dismissLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function batchRowsFromRewards(
  results: Array<{
    isWin?: boolean;
    isRPrize?: boolean;
    rewardType?: string | null;
    rewardValue?: string | number | null;
    prizeName?: string | null;
    ticketNumber?: string | number | null;
    detail?: string;
  }>,
): RevealBatchRow[] {
  return results.map((r, i) => ({
    id: i,
    number: i + 1,
    ticketNumber: r.ticketNumber,
    detail: r.detail,
    ...prizeFromReward({
      isWin: Boolean(r.isWin || r.isRPrize),
      rewardType: r.isRPrize ? "try_again" : r.rewardType,
      rewardValue: r.rewardValue,
      prizeName: r.prizeName,
    }),
  }));
}
