import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";
import ChaserBorder from "@/components/home/ChaserBorder";
import { prizeFromReward } from "@/components/games/PlayResultsTable";

export type PopRevealResult = {
  isWin?: boolean;
  isRPrize?: boolean;
  rewardType?: string | null;
  rewardValue?: string | number | null;
  prizeName?: string | null;
};

type Props = {
  open: boolean;
  results: PopRevealResult[];
  processed: number;
  totalWon: number;
  totalPoints: number;
  freeReplaysWon: number;
  onViewResults: () => void;
  onGetMore?: () => void;
};

function firePopConfetti() {
  const colors = ["#F1D47A", "#D4AF37", "#C8102E", "#FF263D", "#fff8ee"];
  const end = Date.now() + 1800;
  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.65 },
      colors,
      startVelocity: 48,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.65 },
      colors,
      startVelocity: 48,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

export default function PopRevealAllSummary({
  open,
  results,
  processed,
  totalWon,
  totalPoints,
  freeReplaysWon,
  onViewResults,
  onGetMore,
}: Props) {
  const rows = results.map((r) =>
    prizeFromReward({
      isWin: Boolean(r.isWin || r.isRPrize),
      rewardType: r.isRPrize ? "try_again" : r.rewardType,
      rewardValue: r.rewardValue,
      prizeName: r.prizeName,
    })
  );
  const winCount = rows.filter((r) => r.tone === "win").length;
  const replayCount = rows.filter((r) => r.tone === "replay").length || freeReplaysWon;
  const hadWin = winCount > 0 || totalWon > 0 || totalPoints > 0;

  useEffect(() => {
    if (!open || !hadWin) return;
    firePopConfetti();
  }, [open, hadWin]);

  if (!open || results.length === 0) return null;

  const prizeLabel =
    totalWon > 0
      ? `£${totalWon.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : totalPoints > 0
        ? `${totalPoints.toLocaleString()} pts`
        : "—";

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center overflow-y-auto p-4"
      style={{ background: "rgba(5,5,5,0.9)", backdropFilter: "blur(10px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pop-reveal-title"
    >
      <div className="relative w-full max-w-[440px] animate-bounce-in">
        <div
          className="pointer-events-none absolute -inset-8 rounded-[2rem] blur-3xl"
          style={{
            background: hadWin
              ? "radial-gradient(circle at 50% 40%, rgba(200,16,46,0.28), rgba(241,212,122,0.08) 46%, transparent 72%)"
              : "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.08), transparent 70%)",
          }}
        />
        <ChaserBorder variant="featured">
          <div className="relative max-h-[86vh] overflow-hidden bg-gradient-to-b from-[#111115] via-[#0A0A0D] to-[#050505]">
            <div className="px-6 pb-2 pt-8 text-center sm:px-8 sm:pt-9">
              <button
                type="button"
                onClick={onViewResults}
                className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#050505]/80 text-white/55 transition-colors hover:border-[#F1D47A]/40 hover:text-[#F1D47A]"
                aria-label="Close and view results"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-[#F1D47A]" />
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
                  All pops revealed
                </span>
              </div>

              <h2 id="pop-reveal-title" className="font-prize text-4xl leading-none text-white sm:text-5xl">
                {hadWin ? "NICE HAUL" : "REVEAL COMPLETE"}
              </h2>
              <p className="mt-3 text-sm text-white/50">
                {processed} pop{processed === 1 ? "" : "s"} settled instantly. Here’s every outcome.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3">
                  <div className="font-prize text-2xl leading-none tabular-nums text-white">{processed}</div>
                  <div className="mt-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/40">Pops</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3">
                  <div className={`font-prize text-2xl leading-none tabular-nums ${winCount ? "text-[#4ADE80]" : "text-white"}`}>
                    {winCount}
                  </div>
                  <div className="mt-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/40">Wins</div>
                </div>
                <div
                  className="rounded-xl border px-2 py-3"
                  style={{
                    background: hadWin ? "rgba(241,212,122,0.06)" : "rgba(255,255,255,0.04)",
                    borderColor: hadWin ? "rgba(241,212,122,0.28)" : "rgba(255,255,255,0.1)",
                  }}
                >
                  <div className={`font-prize text-lg leading-none tabular-nums sm:text-2xl ${hadWin ? "text-[#F1D47A]" : "text-white/40"}`}>
                    {prizeLabel}
                  </div>
                  <div className="mt-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/40">
                    {totalWon > 0 ? "Cash" : totalPoints > 0 ? "Points" : "Won"}
                  </div>
                </div>
              </div>

              {totalWon > 0 && totalPoints > 0 && (
                <p className="mt-3 text-sm text-[#F1D47A]">+{totalPoints.toLocaleString()} ringtone points</p>
              )}
              {replayCount > 0 && (
                <p className="mt-2 text-xs text-[#F1D47A]/80">
                  {replayCount} free play{replayCount === 1 ? "" : "s"} added
                </p>
              )}
              <p className="mt-3 text-xs text-white/40">
                {hadWin
                  ? "Prizes are already on your account. Scroll the list to review each pop."
                  : "No wins this batch — check every outcome below, then in your play results."}
              </p>
            </div>

            <div className="mx-4 mb-3 max-h-[32vh] overflow-y-auto rounded-xl border border-white/8 sm:mx-6">
              {rows.map((row, i) => (
                <div
                  key={`${row.status}-${i}`}
                  className="flex items-center justify-between gap-3 border-b border-white/6 px-3 py-2.5 last:border-b-0"
                  style={{
                    background: row.tone === "win" || row.tone === "replay" ? "rgba(16,80,40,0.16)" : "transparent",
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="w-8 shrink-0 text-[11px] font-black tabular-nums text-[#F1D47A]/80">
                      #{i + 1}
                    </span>
                    <span
                      className={`truncate text-sm font-semibold ${
                        row.tone === "lose" ? "text-white/45" : "text-white"
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-black tabular-nums ${
                      row.tone === "lose" ? "text-white/30" : "text-[#F1D47A]"
                    }`}
                  >
                    {row.prize}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 px-6 pb-6 sm:px-8 sm:pb-7">
              <button
                type="button"
                onClick={onViewResults}
                className="rr-cta h-12 w-full rounded-xl text-sm font-black uppercase tracking-[0.16em]"
                data-testid="button-view-pop-results"
              >
                View your results
              </button>
              {onGetMore && (
                <button
                  type="button"
                  onClick={onGetMore}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] text-[11px] font-black uppercase tracking-[0.16em] text-white/55 transition-colors hover:border-[#F1D47A]/30 hover:text-[#F1D47A]"
                >
                  Get more pops
                </button>
              )}
            </div>
          </div>
        </ChaserBorder>
      </div>
    </div>
  );
}
