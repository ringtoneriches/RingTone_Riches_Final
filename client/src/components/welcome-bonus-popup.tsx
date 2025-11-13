import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles, Coins } from "lucide-react";
import confetti from "canvas-confetti";

interface WelcomeBonusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  bonusCash?: number;
  bonusPoints?: number;
  userName?: string;
}

export function WelcomeBonusPopup({
  isOpen,
  onClose,
  bonusCash = 0,
  bonusPoints = 0,
  userName = "there",
}: WelcomeBonusPopupProps) {
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  const hasCashBonus = bonusCash > 0;
  const hasPointsBonus = bonusPoints > 0;
  const hasAnyBonus = hasCashBonus || hasPointsBonus;

  useEffect(() => {
    if (isOpen && hasAnyBonus && !hasShownConfetti) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FACC15', '#FDE047', '#FEF08A', '#F59E0B', '#EAB308'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FACC15', '#FDE047', '#FEF08A', '#F59E0B', '#EAB308'],
        });
      }, 250);

      setHasShownConfetti(true);

      return () => clearInterval(interval);
    }
  }, [isOpen, hasAnyBonus, hasShownConfetti]);

  if (!hasAnyBonus) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md border-yellow-400/30 bg-gradient-to-br from-card via-card to-yellow-400/5"
        data-testid="dialog-welcome-bonus"
      >
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full animate-pulse" />
              <Gift className="w-16 h-16 text-yellow-400 relative z-10 animate-bounce" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            Welcome, {userName}!
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Your account has been created successfully!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground mb-4">
              🎉 You've received a welcome bonus!
            </p>
          </div>

          <div className="space-y-3">
            {hasCashBonus && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-400/10 border border-yellow-400/30">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-400/20 p-2 rounded-full">
                    <Coins className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="font-medium text-foreground">Bonus Cash</span>
                </div>
                <span className="text-2xl font-bold text-yellow-400" data-testid="text-bonus-cash">
                  £{bonusCash.toFixed(2)}
                </span>
              </div>
            )}

            {hasPointsBonus && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-400/10 border border-yellow-400/30">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-400/20 p-2 rounded-full">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="font-medium text-foreground">RingTone Points</span>
                </div>
                <span className="text-2xl font-bold text-yellow-400" data-testid="text-bonus-points">
                  {bonusPoints}
                </span>
              </div>
            )}
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Your bonus has been added to your wallet.
              <br />
              Start competing now to win amazing prizes!
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            data-testid="button-close-welcome-bonus"
          >
            Let's Get Started! 🎯
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
