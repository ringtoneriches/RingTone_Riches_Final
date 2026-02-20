// components/game-prizes-display.tsx
import { useQuery } from "@tanstack/react-query";
import { Gift, Star, Trophy, Award, ChevronDown } from "lucide-react";
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

  // Get icon based on prize value/position
  const getPrizeIcon = (index: number) => {
    switch(index) {
      case 0: return <Trophy className="w-8 h-8 text-yellow-400" />;
      case 1: return <Award className="w-8 h-8 text-gray-300" />;
      case 2: return <Award className="w-8 h-8 text-amber-600" />;
      default: return <Star className="w-6 h-6 text-yellow-400/60" />;
    }
  };

  // Get badge color based on remaining quantity
  const getBadgeColor = (prize: GamePrize) => {
    if (prize.remainingQty === 0) return "bg-red-500/20 text-red-400 border-red-500/30";
    if (prize.remainingQty < 5) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    if (prize.remainingQty < prize.totalQty * 0.2) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    if (prize.remainingQty < prize.totalQty * 0.5) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-green-500/20 text-green-400 border-green-500/30";
  };

  // Get status text
  const getStatusText = (prize: GamePrize) => {
    if (prize.remainingQty === 0) return 'Sold Out';
    if (prize.remainingQty < 5) return 'Last Few!';
    if (prize.remainingQty < prize.totalQty * 0.2) return 'Limited';
    if (prize.remainingQty < prize.totalQty * 0.5) return 'Selling Fast';
    return 'Available';
  };

  // Calculate totals
  const totalValue = sortedPrizes.reduce((sum, p) => sum + (p.value || 0), 0);
  const totalItems = sortedPrizes.reduce((sum, p) => sum + p.totalQty, 0);
  const totalRemaining = sortedPrizes.reduce((sum, p) => sum + p.remainingQty, 0);
  const totalSold = totalItems - totalRemaining;

  return (

    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <button
  onClick={() => setIsOpen(!isOpen)}
  className="w-full flex justify-center items-center gap-2 mb-5 group"
>
  <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
    <Gift className="w-6 h-6" />
    Prize Table
  </h2>

  <ChevronDown
    className={`w-6 h-6 text-yellow-400 transition-transform duration-300 ${
      isOpen ? "rotate-180" : ""
    }`}
  />
</button>

      
<div
  className={`transition-all duration-500 ease-in-out overflow-hidden ${
    isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
  }`}
>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {sortedPrizes.map((prize, index) => {
          const sold = prize.totalQty - prize.remainingQty;
          const soldPercentage = prize.totalQty > 0 
            ? Math.round((sold / prize.totalQty) * 100) 
            : 0;
          
          const remainingPercentage = prize.totalQty > 0
            ? Math.round((prize.remainingQty / prize.totalQty) * 100)
            : 0;

          return (
            <div
              key={prize.id}
              className="group relative bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border-2 border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/10"
            >
              {/* Prize Icon - Top right */}
              {/* <div className="absolute top-4 right-4">
                {getPrizeIcon(index)}
              </div> */}

              {/* Prize Content */}
              <div className="space-y-4">
                {/* Prize Title & Value */}
                <div className="pr-12">
                  <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">
                    {prize.title}
                  </h3>
                  {prize.value ? (() => {
  const isPointsPrize = /points?|pts?/i.test(prize.title);

  return (
    <p className="text-3xl font-black text-yellow-400">
      {isPointsPrize
        ? `${prize.value.toLocaleString()} pts`
        : `£${prize.value.toLocaleString()}`}
    </p>
  );
})() : (
  <p className="text-sm text-gray-400 italic">Non-monetary prize</p>
)}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Available:</span>
                    <span className="font-semibold text-white">
                      {prize.remainingQty} / {prize.totalQty}
                    </span>
                  </div>
                  
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-500"
                      style={{ width: `${remainingPercentage}%` }}
                    />
                  </div>

                  {/* Stats Row */}
                  <div className="flex justify-between items-center pt-2">
                    {/* Sold Count */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Sold:</span>
                      <span className="text-sm font-bold text-white">{sold}</span>
                      {soldPercentage > 0 && (
                        <span className="text-xs text-gray-500">({soldPercentage}%)</span>
                      )}
                    </div>

                    {/* Status Badge */}
                    {/* <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getBadgeColor(prize)}`}>
                      {getStatusText(prize)}
                    </span> */}
                  </div>

                  {/* Urgency Message */}
                  {/* {prize.remainingQty > 0 && prize.remainingQty < 10 && (
                    <p className="text-xs text-orange-400 font-medium animate-pulse">
                      ⚡ Only {prize.remainingQty} left! Don't miss out
                    </p>
                  )} */}
                </div>

                {/* Value Category Badge */}
                {/* {prize.value && (
                  <div className="absolute bottom-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="text-xs font-bold text-yellow-400/60">
                      {prize.value >= 10000 ? '🏆 JACKPOT' : 
                       prize.value >= 5000 ? '⭐ GRAND PRIZE' : 
                       prize.value >= 1000 ? '✨ HIGH VALUE' : 
                       prize.value >= 500 ? '💎 PREMIUM' : 
                       prize.value >= 100 ? '🎁 GREAT PRIZE' : '🎈 PRIZE'}
                    </div>
                  </div>
                )} */}
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full transform" />
            </div>
          );
        })}
      </div>
      </div>

      {/* Prize Pool Summary */}
      {/* {sortedPrizes.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl p-4 border border-yellow-500/20 mt-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300">Total Prizes:</span>
              <span className="font-bold text-white">{sortedPrizes.length}</span>
            </div>
            
            {totalValue > 0 && (
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-300">Total Value:</span>
                <span className="font-bold text-yellow-400">
                  £{totalValue.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300">Remaining:</span>
              <span className="font-bold text-white">
                {totalRemaining} / {totalItems}
              </span>
            </div>

            {totalSold > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-300">Sold:</span>
                <span className="font-bold text-green-400">{totalSold}</span>
              </div>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
}