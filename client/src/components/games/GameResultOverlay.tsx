import { ReactNode } from "react";
import { Gift, RotateCcw, Trophy, X, Zap } from "lucide-react";
import ChaserBorder from "@/components/home/ChaserBorder";

export type GameResultKind = "win" | "lose" | "physical" | "extra" | "empty";

type Props = {
  open: boolean;
  kind: GameResultKind;
  onClose: () => void;
  kicker?: string;
  title: string;
  subtitle?: string;
  prizeText?: string;
  prizeSub?: string;
  extra?: ReactNode;
  icon?: ReactNode;
  body?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  contained?: boolean;
  overlayTestId?: string;
  closeTestId?: string;
  primaryTestId?: string;
  secondaryTestId?: string;
  titleTestId?: string;
  prizeTestId?: string;
  kickerTestId?: string;
  prizeSubTestId?: string;
};

export default function GameResultOverlay({
  open,
  kind,
  onClose,
  kicker,
  title,
  subtitle,
  prizeText,
  prizeSub,
  extra,
  icon,
  body,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
  contained,
  overlayTestId,
  closeTestId = "button-close-result",
  primaryTestId = "button-continue",
  secondaryTestId,
  titleTestId = "text-modal-title",
  prizeTestId = "text-prize-value",
  kickerTestId,
  prizeSubTestId,
}: Props) {
  if (!open) return null;

  const isWin = kind === "win" || kind === "physical";
  const featured = isWin || kind === "extra";
  const brandCta = featured || kind === "empty";
  const defaultIcon = isWin ? (
    kind === "physical" ? (
      <Gift className="h-9 w-9 text-[#F1D47A]" />
    ) : (
      <Trophy className="h-9 w-9 text-[#F1D47A]" />
    )
  ) : kind === "extra" ? (
    <RotateCcw className="h-8 w-8 text-[#F1D47A]" />
  ) : kind === "empty" ? (
    <Zap className="h-8 w-8 text-[#F1D47A]" />
  ) : (
    <X className="h-7 w-7 text-white/40" />
  );

  return (
    <div
      className={`${contained ? "absolute inset-0 z-20 rounded-2xl" : "fixed inset-0 z-[9998]"} flex items-center justify-center overflow-y-auto p-4`}
      style={{ background: "rgba(5,5,5,0.88)", backdropFilter: "blur(10px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-result-title"
      data-testid={overlayTestId}
    >
      <div className="relative w-full max-w-[400px] animate-bounce-in">
        {featured ? (
          <div
            className="pointer-events-none absolute -inset-8 rounded-[2rem] blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgba(200,16,46,0.28), rgba(241,212,122,0.08) 46%, transparent 72%)",
            }}
          />
        ) : (
          <div
            className="pointer-events-none absolute -inset-6 rounded-[2rem] blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 30%, rgba(200,16,46,0.16), rgba(241,212,122,0.05) 48%, transparent 74%)",
            }}
          />
        )}

        <ChaserBorder variant={featured ? "featured" : "card"}>
          <div className="relative bg-gradient-to-b from-[#111115] via-[#0A0A0D] to-[#050505] px-6 pb-6 pt-8 text-center sm:px-8 sm:pb-7 sm:pt-9">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#050505]/80 text-white/55 transition-colors hover:border-[#F1D47A]/40 hover:text-[#F1D47A]"
              aria-label="Close"
              data-testid={closeTestId}
            >
              <X className="h-4 w-4" />
            </button>

            {extra ? <div className="pr-8">{extra}</div> : null}

            <div
              className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 ${
                featured
                  ? "border border-[#C8102E]/40 bg-[#C8102E]/10"
                  : "border border-white/10 bg-white/[0.04]"
              }`}
            >
              {featured ? (
                <Trophy className="h-3.5 w-3.5 text-[#F1D47A]" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF263D]" />
              )}
              <span
                className={`text-[10px] font-black uppercase tracking-[0.22em] ${
                  featured ? "text-[#FF263D]" : "text-white/45"
                }`}
                data-testid={kickerTestId}
              >
                {kicker || (isWin ? "Congratulations" : kind === "extra" ? "Bonus" : kind === "empty" ? "No plays left" : "No win")}
              </span>
            </div>

            <div
              className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${
                featured
                  ? "border border-[#F1D47A]/35 bg-[#F1D47A]/10 shadow-[0_0_28px_rgba(241,212,122,0.22)]"
                  : "border border-white/10 bg-white/[0.04]"
              }`}
            >
              {icon || defaultIcon}
            </div>

            <h2
              id="game-result-title"
              className="font-prize text-4xl leading-none text-white sm:text-5xl"
              data-testid={titleTestId}
            >
              {title}
            </h2>

            {subtitle ? <p className="mt-3 text-sm text-white/50">{subtitle}</p> : null}

            {prizeText ? (
              <div className="mt-5 rounded-2xl border border-[#F1D47A]/25 bg-[#F1D47A]/[0.06] px-4 py-5">
                <p
                  className="font-prize text-4xl leading-none text-[#F1D47A] sm:text-5xl"
                  data-testid={prizeTestId}
                >
                  {prizeText}
                </p>
                {prizeSub ? (
                  <p
                    className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#FF263D]"
                    data-testid={prizeSubTestId}
                  >
                    {prizeSub}
                  </p>
                ) : null}
              </div>
            ) : body ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
                <p className="text-sm leading-relaxed text-white/55">{body}</p>
              </div>
            ) : null}

            {primaryLabel && onPrimary ? (
              <button
                type="button"
                onClick={onPrimary}
                disabled={primaryDisabled}
                data-testid={primaryTestId}
                className={
                  brandCta
                    ? "rr-cta mt-6 h-12 w-full rounded-xl text-sm font-black uppercase tracking-[0.16em] disabled:opacity-50"
                    : "mt-6 h-12 w-full rounded-xl border border-[#F1D47A]/35 bg-[#F1D47A]/10 text-sm font-black uppercase tracking-[0.16em] text-[#F1D47A] transition-colors hover:border-[#F1D47A]/55 hover:bg-[#F1D47A]/16 disabled:opacity-50"
                }
              >
                {primaryLabel}
              </button>
            ) : null}

            {secondaryLabel && onSecondary ? (
              <button
                type="button"
                onClick={onSecondary}
                data-testid={secondaryTestId}
                className="mt-2 h-10 w-full rounded-xl text-sm font-semibold text-white/45 transition-colors hover:bg-white/5 hover:text-white"
              >
                {secondaryLabel}
              </button>
            ) : null}
          </div>
        </ChaserBorder>
      </div>
    </div>
  );
}
