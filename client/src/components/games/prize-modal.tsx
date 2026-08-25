import { useEffect } from "react";
import confetti from "canvas-confetti";
import { RotateCw, Sparkles, Trophy, X } from "lucide-react";
import ChaserBorder from "@/components/home/ChaserBorder";
import money from "../../../../attached_assets/money.png";

interface PrizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isWinner: boolean;
  prize?: {
    type: string;
    value: string;
    brand?: string;
    description?: string;
  };
  gameType: "scratch" | "spin";
  spinWheelType?: string;
  congratsAudioRef: React.RefObject<HTMLAudioElement>;
}

export function PrizeModal({
  isOpen,
  onClose,
  isWinner,
  prize,
  gameType,
  congratsAudioRef,
  spinWheelType,
}: PrizeModalProps) {
  useEffect(() => {
    if (isOpen && isWinner) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: NodeJS.Timeout = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ["#C8102E", "#FF263D", "#F1D47A", "#B98928", "#fff8ee"],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#C8102E", "#FF263D", "#F1D47A", "#B98928", "#fff8ee"],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, isWinner]);

  if (!isOpen) return null;

  const getPrizeDisplay = () => {
    if (!prize) return { icon: "😔", text: "No prize", subtext: "Better luck next time!" };

    if (prize.type === "cash") {
      const value = prize.value;
      let formattedValue;

      if (typeof value === "string") {
        const numValue = parseFloat(value);
        formattedValue = !isNaN(numValue) ? numValue.toFixed(2) : "0.00";
      } else {
        formattedValue = typeof value === "number" ? (value as number).toFixed(2) : "0.00";
      }

      return {
        icon: money,
        text: `£${formattedValue}`,
        subtext: "Cash Prize!",
      };
    } else if (prize.type === "points") {
      const cleanValue = prize.value.replace(/Ringtones/gi, "Ringtone");
      const extraRingtoneText = gameType === "scratch" ? " Ringtone" : "";

      return {
        icon: "⭐",
        text: `${cleanValue} ${extraRingtoneText} Points`,
      };
    } else if (prize.type === "car") {
      return {
        icon: "🏆",
        text: prize.brand || prize.value,
        subtext: prize.description || "Amazing Prize!",
      };
    } else if (prize.type === "prize") {
      return {
        icon: "🎁",
        text: prize.value,
        subtext: prize.description || "Congratulations!",
      };
    }

    return { icon: "🎁", text: prize.value, subtext: "You won!" };
  };

  const prizeInfo = getPrizeDisplay();
  const isSpin = gameType === "spin";
  const gameLabel = isSpin ? "spin wheel" : "scratch card";
  const loseBody =
    gameType === "scratch"
      ? "Better luck next time! Keep playing for more chances to win amazing prizes."
      : spinWheelType === "wheel2"
        ? "You didn't win this time but the next retro ringtone spin could be your moment."
        : "You didn't win this time but the next luxury car spin could be your moment.";

  const renderPrizeIcon = () => {
    if (!isWinner) {
      return isSpin ? (
        <RotateCw className="h-8 w-8 text-white/45" strokeWidth={2.2} />
      ) : (
        <Sparkles className="h-8 w-8 text-white/45" strokeWidth={2.2} />
      );
    }

    if (typeof prizeInfo.icon === "string" && prizeInfo.icon.includes(".")) {
      return (
        <img src={prizeInfo.icon} alt="Prize Icon" className="h-16 w-16 object-contain" />
      );
    }

    if (prize?.type === "points") {
      return <Sparkles className="h-9 w-9 text-[#F1D47A]" />;
    }

    if (typeof prizeInfo.icon === "string") {
      return <span className="text-4xl leading-none">{prizeInfo.icon}</span>;
    }

    return <Trophy className="h-9 w-9 text-[#F1D47A]" />;
  };

  const stopCongratsSound = () => {
    if (congratsAudioRef.current) {
      congratsAudioRef.current.pause();
      congratsAudioRef.current.currentTime = 0;
    }
  };

  const handleClose = () => {
    stopCongratsSound();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: "rgba(5,5,5,0.88)", backdropFilter: "blur(10px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prize-modal-title"
    >
      <div className="relative w-full max-w-[400px] animate-bounce-in">
        {isWinner ? (
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

        <ChaserBorder variant={isWinner ? "featured" : "card"}>
          <div className="relative bg-gradient-to-b from-[#111115] via-[#0A0A0D] to-[#050505] px-6 pb-6 pt-8 text-center sm:px-8 sm:pb-7 sm:pt-9">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#050505]/80 text-white/55 transition-colors hover:border-[#F1D47A]/40 hover:text-[#F1D47A]"
              aria-label="Close"
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div
              className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 ${
                isWinner
                  ? "border border-[#C8102E]/40 bg-[#C8102E]/10"
                  : "border border-white/10 bg-white/[0.04]"
              }`}
            >
              {isWinner ? (
                <Trophy className="h-3.5 w-3.5 text-[#F1D47A]" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF263D]" />
              )}
              <span
                className={`text-[10px] font-black uppercase tracking-[0.22em] ${
                  isWinner ? "text-[#FF263D]" : "text-white/45"
                }`}
              >
                {isWinner ? "Congratulations" : "No win"}
              </span>
            </div>

            <div
              className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${
                isWinner
                  ? "border border-[#F1D47A]/35 bg-[#F1D47A]/10 shadow-[0_0_28px_rgba(241,212,122,0.22)]"
                  : "border border-white/10 bg-white/[0.04]"
              }`}
            >
              {renderPrizeIcon()}
            </div>

            <h2
              id="prize-modal-title"
              className={`small-congrats font-prize leading-none ${
                isWinner ? "text-4xl text-white sm:text-5xl" : "text-4xl text-white sm:text-[2.75rem]"
              }`}
              data-testid="text-modal-title"
            >
              {isWinner ? "YOU WON" : "UNLUCKY"}
            </h2>

            <p className="mt-3 text-sm text-white/50">
              {isWinner
                ? `You won in this ${gameLabel} game!`
                : `No luck this time on ${gameLabel}`}
            </p>

            {isWinner ? (
              <div className="mt-5 rounded-2xl border border-[#F1D47A]/25 bg-[#F1D47A]/[0.06] px-4 py-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                  Your Prize
                </p>
                <p
                  className="mt-2 font-prize text-4xl leading-none text-[#F1D47A] sm:text-5xl"
                  data-testid="text-prize-value"
                >
                  {prizeInfo.text}
                </p>
                {prizeInfo.subtext ? (
                  <p className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#FF263D]">
                    {prizeInfo.subtext}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
                <p className="text-sm leading-relaxed text-white/55">{loseBody}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleClose}
              data-testid="button-continue"
              className={
                isWinner
                  ? "rr-cta mt-6 h-12 w-full rounded-xl text-sm font-black uppercase tracking-[0.16em]"
                  : "mt-6 h-12 w-full rounded-xl border border-[#F1D47A]/35 bg-[#F1D47A]/10 text-sm font-black uppercase tracking-[0.16em] text-[#F1D47A] transition-colors hover:border-[#F1D47A]/55 hover:bg-[#F1D47A]/16"
              }
            >
              {isWinner ? "Get in!" : "Try Again"}
            </button>
          </div>
        </ChaserBorder>
      </div>
    </div>
  );
}
