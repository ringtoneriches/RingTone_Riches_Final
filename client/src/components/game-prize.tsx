// components/game-prizes-display.tsx
import { useQuery } from "@tanstack/react-query";
import { Gift, ChevronDown } from "lucide-react";
import { useState } from "react";

interface GamePrize {
  id: number;
  gameId: string;
  title: string;
  value: number | null;
  totalQty: number;
  remainingQty: number;
  createdAt: string;
}

interface GamePrizesDisplayProps {
  gameId: string
}

export function GamePrizesDisplay({ gameId }: GamePrizesDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: prizes, isLoading } = useQuery<GamePrize[]>({
    queryKey: [`/games/${gameId}/prizes`],
    enabled: !!gameId 
  });

  // Don't show for competition type or if no gameId
  if (!gameId) return null;
  
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-8 border border-yellow-500/20 shadow-xl">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }
  
  if (!prizes || prizes.length === 0) {
    return (
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-8 border border-yellow-500/20 shadow-xl text-center">
        <Gift className="w-16 h-16 mx-auto text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-yellow-400 mb-2">No Prizes Yet</h3>
        <p className="text-gray-400">Check back later for prize updates!</p>
      </div>
    );
  }

  // Sort prizes by value (highest first)
  const sortedPrizes = [...prizes].sort((a, b) => (b.value || 0) - (a.value || 0));

  // Calculate totals
  const totalItems = sortedPrizes.reduce((sum, p) => sum + p.totalQty, 0);
  const totalRemaining = sortedPrizes.reduce((sum, p) => sum + p.remainingQty, 0);
  const totalSold = totalItems - totalRemaining;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex flex-col items-center gap-2 mb-5 group"
      >
        {/* Heading centered */}
        <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
          <Gift className="w-6 h-6" />
          Prize Table
          <ChevronDown
            className={`w-6 h-6 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </h2>
        
        {/* Value below heading - big and bold */}
        {/* <div className="text-6xl font-black text-white">
          {totalSold} / {totalItems}
        </div> */}
      </button>

      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPrizes.map((prize) => {
            const sold = prize.totalQty - prize.remainingQty;

            return (
              <div
                key={prize.id}
                className="group text-center relative bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border-2 border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 shadow-xl"
              >
                {/* Prize Content */}
                <div className="space-y-3">
                  {/* Prize Title */}
                  <h3 className="text-xl font-bold text-white line-clamp-2">
                    {prize.title}
                  </h3>
                  
                  {/* Prize Value */}
                  {prize.value ? (() => {
                    const isPointsPrize = /points?|pts?/i.test(prize.title);
                    return (
                      <p className="text-2xl font-black text-yellow-400">
                        {isPointsPrize
                          ? `${prize.value.toLocaleString()} pts`
                          : `£${prize.value.toLocaleString()}`}
                      </p>
                    );
                  })() : (
                    <p className="text-sm text-gray-400 italic">Non-monetary prize</p>
                  )}

                  {/* Simple sold counter */}
                  <div className="pt-2">
                    <div className="text-3xl font-bold text-white">
                      {sold} / {prize.totalQty}
                    </div>
                    {/* <div className="text-sm text-gray-400">claimed</div> */}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}