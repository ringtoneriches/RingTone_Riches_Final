import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  gameType: 'scratch' | 'spin';
}

export function PrizeModal({ isOpen, onClose, isWinner, prize, gameType }: PrizeModalProps) {
  useEffect(() => {
    if (isOpen && isWinner) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: NodeJS.Timeout = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FACC15', '#F59E0B', '#D97706', '#FDE047', '#FEF08A']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FACC15', '#F59E0B', '#D97706', '#FDE047', '#FEF08A']
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, isWinner]);

  if (!isOpen) return null;

  const getPrizeDisplay = () => {
    if (!prize) return { icon: '😔', text: 'No prize', subtext: 'Better luck next time!' };
    
    if (prize.type === 'cash') {
      return {
        icon: '💰',
        text: `£${prize.value}`,
        subtext: 'Cash Prize!'
      };
    } else if (prize.type === 'points') {
      return {
        icon: '⭐',
        text: `${prize.value} Points`,
        subtext: 'Ringtone Points!'
      };
    } else if (prize.type === 'car') {
      return {
        icon: '🏆',
        text: prize.brand || prize.value,
        subtext: prize.description || 'Amazing Prize!'
      };
    } else if (prize.type === 'prize') {
      return {
        icon: '🎁',
        text: prize.value,
        subtext: prize.description || 'Congratulations!'
      };
    }
    
    return { icon: '🎁', text: prize.value, subtext: 'You won!' };
  };

  const prizeInfo = getPrizeDisplay();

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md">
        {/* Glow effect */}
        <div className={`absolute -inset-4 rounded-3xl blur-2xl ${
          isWinner 
            ? 'bg-gradient-to-r from-[#FACC15]/40 via-[#F59E0B]/40 to-[#FACC15]/40 animate-pulse' 
            : 'bg-gradient-to-r from-gray-600/20 via-gray-500/20 to-gray-600/20'
        }`}></div>
        
        {/* Modal content */}
        <div className={`relative bg-gradient-to-br ${
          isWinner 
            ? 'from-gray-900 via-gray-800 to-gray-900' 
            : 'from-gray-900 via-gray-800 to-gray-900'
        } rounded-2xl border-2 ${
          isWinner 
            ? 'border-[#FACC15]/60' 
            : 'border-gray-700/60'
        } shadow-2xl overflow-hidden`}>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700/80 transition-colors"
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Header with gradient */}
          <div className={`px-8 pt-12 pb-8 bg-gradient-to-br ${
            isWinner 
              ? 'from-[#FACC15]/20 via-[#F59E0B]/10 to-transparent' 
              : 'from-gray-800/40 via-gray-700/20 to-transparent'
          }`}>
            {/* Icon */}
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-5xl ${
              isWinner 
                ? 'bg-gradient-to-br from-[#FACC15]/30 to-[#F59E0B]/30 border-2 border-[#FACC15]/40 shadow-lg shadow-[#FACC15]/20' 
                : 'bg-gray-800/60 border-2 border-gray-700/40'
            } ${isWinner ? 'animate-bounce' : ''}`}>
              {isWinner ? prizeInfo.icon : '😔'}
            </div>

            {/* Title */}
            <h2 className={`text-3xl sm:text-4xl font-black text-center mb-2 ${
              isWinner 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15]' 
                : 'text-gray-300'
            }`} data-testid="text-modal-title">
              {isWinner ? 'CONGRATULATIONS!' : 'UNLUCKY!'}
            </h2>

            {/* Subtitle */}
            <p className="text-center text-gray-400 text-sm sm:text-base mb-6">
              {isWinner 
                ? `You won in this ${gameType === 'scratch' ? 'scratch card' : 'spin wheel'} game!` 
                : `No luck this time on ${gameType === 'scratch' ? 'scratch card' : 'spin wheel'}`}
            </p>

            {/* Prize display */}
            {isWinner && (
              <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-6 border border-[#FACC15]/30 backdrop-blur-sm">
                <div className="text-center">
                  <p className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider mb-2 font-semibold">
                    Your Prize
                  </p>
                  <p className="text-3xl sm:text-4xl font-black text-[#FACC15] mb-1" data-testid="text-prize-value">
                    {prizeInfo.text}
                  </p>
                  <p className="text-[#F59E0B] text-sm sm:text-base font-semibold">
                    {prizeInfo.subtext}
                  </p>
                </div>
              </div>
            )}

            {!isWinner && (
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl p-6 border border-gray-700/30 backdrop-blur-sm">
                <p className="text-center text-gray-400 text-sm sm:text-base">
                  Better luck next time! Keep playing for more chances to win amazing prizes.
                </p>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="px-8 pb-8">
            <Button
              onClick={onClose}
              className={`w-full h-12 sm:h-14 text-base sm:text-lg font-bold rounded-xl ${
                isWinner 
                  ? 'bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] hover:from-[#F59E0B] hover:via-[#FACC15] hover:to-[#F59E0B] text-gray-900' 
                  : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white'
              } transition-all duration-300 shadow-lg`}
              data-testid="button-continue"
            >
              {isWinner ? '🎉 Awesome!' : 'Try Again'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
