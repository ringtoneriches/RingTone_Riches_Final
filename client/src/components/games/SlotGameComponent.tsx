// components/SlotGameComponent.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Coins } from "lucide-react";

interface SlotGameProps {
  orderId: string;
  competitionId: string;
  playsRemaining: number;
  competitionType?: 'slot' | 'royal'; // Add competition type prop
  onPlayComplete: (newPlaysRemaining: number) => void;
}

export default function SlotGameComponent({
  orderId,
  competitionId,
  playsRemaining,
  competitionType = 'slot', // Default to 'slot'
  onPlayComplete,
}: SlotGameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [playsRemainingState, setPlaysRemainingState] = useState(playsRemaining);

  useEffect(() => {
    setPlaysRemainingState(playsRemaining);
  }, [playsRemaining]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      console.log('Message received from iframe:', data);

      if (data.type === 'gameReady') {
        setIsLoading(false);
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'initGame',
            playsRemaining: playsRemainingState,
            orderId: orderId,
            competitionType: competitionType // Pass competition type to iframe
          }, '*');
        }
        return;
      }

      if (data.type === 'slotSpinResult') {
        const { isWin, coinsWon, outcome, prizeName, winSymbol, symbols, royalReplay } = data;
        
        try {
          // Determine which API endpoint to use based on competition type
          const endpoint = competitionType === 'royal' 
            ? "/api/play-royal" 
            : "/api/play-slot";
          
          const res = await apiRequest(endpoint, "POST", {
            orderId: orderId,
            competitionId: competitionId,
          });

          const result = await res.json();
          console.log(`${competitionType} result:`, result);
          
          if (result.success) {
            // Confirm the result
            const confirmEndpoint = competitionType === 'royal'
              ? "/api/confirm-royal-result"
              : "/api/confirm-slot-result";
              
            const confirmRes = await apiRequest(confirmEndpoint, "POST", {
              orderId: orderId,
              result: {
                isWin: result.result.isWin,
                rewardType: result.result.rewardType,
                rewardValue: result.result.rewardValue,
                prizeName: result.result.prizeName,
                prizeId: result.result.prizeId,
                winSymbol: result.result.winSymbol,
                symbols: result.result.symbols,
                royalReplay: result.result.royalReplay,
              }
            });

            const confirmData = await confirmRes.json();
            
            if (confirmData.success) {
              // Update plays remaining
              const newPlays = result.playsRemaining || 0;
              setPlaysRemainingState(newPlays);
              onPlayComplete(newPlays);
              
              // Show toast for win
              if (result.result.isWin && parseFloat(result.result.rewardValue) > 0) {
                toast({
                  title: `🎰 ${result.result.prizeName || 'WIN!'}`,
                  description: `You won £${result.result.rewardValue}!`,
                });
              }
              
              if (result.result.royalReplay) {
                toast({
                  title: "🔄 Free Replay!",
                  description: "You got a free replay!",
                });
              }

              const queryKey = competitionType === 'royal'
                ? ["/api/royal-order", orderId]
                : ["/api/slot-order", orderId];
              queryClient.invalidateQueries({ queryKey });
            }
          }
        } catch (error) {
          console.error(`Error processing ${competitionType} spin:`, error);
          toast({
            title: "Error",
            description: "Failed to process spin. Please try again.",
            variant: "destructive",
          });
        }
      }

      if (data.type === 'noPlaysRemaining') {
        toast({
          title: "No Plays Remaining",
          description: "You've used all your spins! Purchase more to keep playing.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [orderId, competitionId, competitionType, onPlayComplete, toast, playsRemainingState]);

  // Pass competition type as URL parameter to the iframe
  const iframeSrc = `/slotmachine/index.html?orderId=${orderId}&competitionId=${competitionId}&playsRemaining=${playsRemainingState}&type=${competitionType}`;

  // Different loading text based on competition type
  const loadingText = competitionType === 'royal' ? 'LOADING ROYAL REELS' : 'LOADING SLOT MACHINE';
  const loadingSubtext = competitionType === 'royal' ? 'INITIALISING ROYAL GAME' : 'INITIALISING SLOT GAME';

  return (
    <div className="relative w-full h-full" style={{ minHeight: '500px' }}>
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl z-10"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, #0f0a00 0%, #000000 100%)' }}
        >
          <div className="text-center px-8">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border border-yellow-500/10 animate-ping" />
              <div
                className="relative w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle at 40% 35%, rgba(234,179,8,0.25) 0%, rgba(234,179,8,0.05) 60%, transparent 100%)',
                  border: '1px solid rgba(234,179,8,0.3)',
                }}
              >
                <Coins className="w-11 h-11 text-yellow-400 animate-pulse" />
              </div>
            </div>
            <p
              className="text-3xl text-white mb-1"
              style={{ fontFamily: "'Bebas Neue', sans-serif", textShadow: '0 0 20px rgba(234,179,8,0.5)' }}
            >
              {loadingText}
            </p>
            <p className="text-yellow-500/50 text-xs tracking-[0.3em] mb-6 font-semibold">
              {loadingSubtext}
            </p>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={iframeSrc}
        className="w-full h-full"
        style={{ 
          border: 'none', 
          display: 'block',
          background: '#0a0800',
          borderRadius: '16px',
          minHeight: '500px',
        }}
        title={competitionType === 'royal' ? 'Royal Reels' : 'Slot Machine'}
        allow="autoplay"
        data-testid="iframe-slot-game"
      />
    </div>
  );
}