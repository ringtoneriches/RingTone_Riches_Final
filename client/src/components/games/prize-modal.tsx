import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import money from "../../../../attached_assets/money.png";
// import congrats from "../../../../attached_assets/sounds/congrats.mp3"


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
  spinWheelType?: string
  congratsAudioRef: React.RefObject<HTMLAudioElement>;
}

export function PrizeModal({ isOpen, onClose, isWinner, prize, gameType ,congratsAudioRef, spinWheelType }: PrizeModalProps) {
  //  const congratsAudioRef = useRef<HTMLAudioElement | null>(null);
//    useEffect(() => {
//   if (isOpen && isWinner) {
//     if (!congratsAudioRef.current) {
//       congratsAudioRef.current = new Audio(congrats);
//     }

//     congratsAudioRef.current.currentTime = 0;
//     congratsAudioRef.current.play().catch(() => {});
//   }
// }, [isOpen, isWinner]);
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
          colors: ['#C8102E', '#FF263D', '#F1D47A', '#B98928', '#fff8ee']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#C8102E', '#FF263D', '#F1D47A', '#B98928', '#fff8ee']
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, isWinner]);

  if (!isOpen) return null;

  const getPrizeDisplay = () => {
  if (!prize) return { icon: '😔', text: 'No prize', subtext: 'Better luck next time!' };
  
  if (prize.type === 'cash') {
    // Format cash value to always show 2 decimal places
    const value = prize.value;
    let formattedValue;
    
    // Check if value is a string or number
    if (typeof value === 'string') {
      const numValue = parseFloat(value);
      formattedValue = !isNaN(numValue) ? numValue.toFixed(2) : "0.00";
    } else {
      // If it's already a number
      formattedValue = typeof value === 'number' ? (value as number).toFixed(2) : "0.00";
    }
    
    return {
      icon: money,
      text: `£${formattedValue}`,
      subtext: 'Cash Prize!'
    };
  } else if (prize.type === 'points') {
    const cleanValue = prize.value.replace(/Ringtones/gi, "Ringtone");

    // If scratch → always show Ringtone tag too
    const extraRingtoneText = gameType === "scratch" ? " Ringtone" : "";

    return {
      icon: '⭐',
      text: `${cleanValue} ${extraRingtoneText} Points`,
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

  const renderPrizeIcon = () => {
  if (!isWinner) return "😔";

  // If icon is an image path, render image
  if (typeof prizeInfo.icon === "string" && prizeInfo.icon.includes(".")) {
    return (
      <img
        src={prizeInfo.icon}
        alt="Prize Icon"
        className="w-16 h-16 object-contain"
      />
    );
  }

  // Otherwise assume emoji
  return prizeInfo.icon;
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
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md">
        {/* Glow effect */}
        <div className={`absolute -inset-4 rounded-3xl blur-2xl ${
          isWinner 
            ? 'bg-gradient-to-r from-[#C8102E]/40 via-[#F1D47A]/30 to-[#C8102E]/40 animate-pulse' 
            : 'bg-gradient-to-r from-white/5 via-white/10 to-white/5'
        }`}></div>
        
        {/* Modal content */}
        <div className={`relative overflow-hidden rounded-2xl border-2 bg-[#0A0A0D] shadow-2xl ${
          isWinner 
            ? 'border-[#C8102E]/60' 
            : 'border-white/10'
        }`}>
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/15"
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5 text-white/50" />
          </button>

          {/* Header with gradient */}
          <div className={`px-8 pt-12 pb-8 ${
            isWinner 
              ? 'bg-gradient-to-br from-[#C8102E]/20 via-[#F1D47A]/10 to-transparent' 
              : 'bg-gradient-to-br from-white/[0.04] to-transparent'
          }`}>
            {/* Icon */}
            <div className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full text-5xl ${
              isWinner 
                ? 'border-2 border-[#F1D47A]/40 bg-[#F1D47A]/15 shadow-lg shadow-[#C8102E]/20' 
                : 'border-2 border-white/10 bg-white/[0.04]'
            } ${isWinner ? 'animate-bounce' : ''}`}>
             {renderPrizeIcon()}

            </div>

            {/* Title */}
            <h2 className={`small-congrats mb-2 text-center font-prize text-3xl sm:text-4xl ${
              isWinner 
                ? 'text-[#F1D47A]' 
                : 'text-white/80'
            }`} data-testid="text-modal-title">
              {isWinner ? 'CONGRATULATIONS!' : 'UNLUCKY!'}
            </h2>

            {/* Subtitle */}
            <p className="mb-6 text-center text-sm text-white/50 sm:text-base">
              {isWinner 
                ? `You won in this ${gameType === 'scratch' ? 'scratch card' : 'spin wheel'} game!` 
                : `No luck this time on ${gameType === 'scratch' ? 'scratch card' : 'spin wheel'}`}
            </p>

            {/* Prize display */}
            {isWinner && (
              <div className="rounded-xl border border-[#F1D47A]/30 bg-[#F1D47A]/5 p-6 backdrop-blur-sm">
                <div className="text-center">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                    Your Prize
                  </p>
                  <p className="mb-1 font-prize text-3xl text-[#F1D47A] sm:text-4xl" data-testid="text-prize-value">
                    {prizeInfo.text}
                  </p>
                  <p className="text-sm font-semibold text-[#FF263D] sm:text-base">
                    {prizeInfo.subtext}
                  </p>
                </div>
              </div>
            )}

            {!isWinner && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
                <p className="text-center text-sm text-white/50 sm:text-base">
                  {gameType === "scratch" ?
                     `Better luck next time! Keep playing for more chances to win amazing prizes.` :
                     spinWheelType === "wheel2" ?
                      `You didn't win this time but the next retro ringtone spin could be your moment.`
                     :
                     `You didn't win this time but the next luxury car spin could be your moment.`
                  }
                  
                </p>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="px-8 pb-8">
            <Button
              onClick={handleClose}
              className={`h-12 w-full rounded-xl text-base font-bold sm:h-14 sm:text-lg ${
                isWinner 
                  ? 'rr-cta' 
                  : 'border border-white/15 bg-white/10 text-white hover:bg-white/15'
              }`}
              data-testid="button-continue"
            >
              {isWinner ? '🏆 Get in!' : 'Try Again'}
            </Button>
          </div>
        </div>
      </div>
    
    </div>
  );
}
