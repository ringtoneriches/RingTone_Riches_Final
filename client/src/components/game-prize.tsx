// components/game-prizes-display.tsx
import { useQuery } from "@tanstack/react-query";
import { 
  Gift, 
  ChevronDown, 
  Trophy, 
  Star, 
  Sparkles, 
  TrendingUp,
  Award,
  Gem,
  Crown,
  Flame,
  Timer,
  Package,
  Target,
  Zap
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  gameId: string;
  className?: string;
  variant?: 'compact' | 'detailed' | 'minimal';
  showStats?: boolean;
  onPrizeSelect?: (prize: GamePrize) => void;
}

// Prize category detection
const getPrizeCategory = (title: string, value: number | null): { 
  icon: JSX.Element; 
  color: string;
  bgGradient: string;
  borderColor: string;
  glowColor: string;
  label: string;
} => {
  const titleLower = title.toLowerCase();
  
  // Jackpot / Grand Prize
  if (titleLower.includes('jackpot') || titleLower.includes('grand') || (value && value >= 10000)) {
    return {
      icon: <Crown className="w-6 h-6" />,
      color: 'text-yellow-400',
      bgGradient: 'from-yellow-500/20 via-yellow-600/10 to-transparent',
      borderColor: 'border-yellow-500/40',
      glowColor: 'rgba(234, 179, 8, 0.3)',
      label: 'JACKPOT'
    };
  }
  
  // High Value
  if (value && value >= 1000) {
    return {
      icon: <Gem className="w-6 h-6" />,
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/20 via-purple-600/10 to-transparent',
      borderColor: 'border-purple-500/40',
      glowColor: 'rgba(168, 85, 247, 0.3)',
      label: 'PREMIUM'
    };
  }
  
  // Points / Currency
  if (titleLower.includes('point') || titleLower.includes('coin') || titleLower.includes('credit')) {
    return {
      icon: <Star className="w-6 h-6" />,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/20 via-blue-600/10 to-transparent',
      borderColor: 'border-blue-500/40',
      glowColor: 'rgba(59, 130, 246, 0.3)',
      label: 'POINTS'
    };
  }
  
  // Physical prizes / Merch
  if (titleLower.includes('merch') || titleLower.includes('physical') || titleLower.includes('box')) {
    return {
      icon: <Package className="w-6 h-6" />,
      color: 'text-green-400',
      bgGradient: 'from-green-500/20 via-green-600/10 to-transparent',
      borderColor: 'border-green-500/40',
      glowColor: 'rgba(34, 197, 94, 0.3)',
      label: 'PHYSICAL'
    };
  }
  
  // Limited / Rare
  if (titleLower.includes('limited') || titleLower.includes('rare') || titleLower.includes('exclusive')) {
    return {
      icon: <Flame className="w-6 h-6" />,
      color: 'text-orange-400',
      bgGradient: 'from-orange-500/20 via-orange-600/10 to-transparent',
      borderColor: 'border-orange-500/40',
      glowColor: 'rgba(249, 115, 22, 0.3)',
      label: 'LIMITED'
    };
  }
  
  // Default
  return {
    icon: <Award className="w-6 h-6" />,
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-500/10 via-yellow-600/5 to-transparent',
    borderColor: 'border-yellow-500/20',
    glowColor: 'rgba(234, 179, 8, 0.15)',
    label: 'PRIZE'
  };
};

// Calculate rarity based on remaining quantity
const getRarity = (remaining: number, total: number): {
  level: 'common' | 'rare' | 'epic' | 'legendary';
  percentage: number;
  color: string;
} => {
  const percentage = (remaining / total) * 100;
  
  if (percentage <= 10) {
    return { level: 'legendary', percentage, color: 'text-orange-400' };
  } else if (percentage <= 25) {
    return { level: 'epic', percentage, color: 'text-purple-400' };
  } else if (percentage <= 50) {
    return { level: 'rare', percentage, color: 'text-blue-400' };
  } else {
    return { level: 'common', percentage, color: 'text-gray-400' };
  }
};

export function GamePrizesDisplay({ 
  gameId, 
  className = '', 
  variant = 'detailed',
  showStats = true,
  onPrizeSelect 
}: GamePrizesDisplayProps) {
  const [isOpen, setIsOpen] = useState(true); // Default open for better UX
  const [hoveredPrize, setHoveredPrize] = useState<number | null>(null);
  const [animateStats, setAnimateStats] = useState(false);

  const { data: prizes, isLoading, error } = useQuery<GamePrize[]>({
    queryKey: [`/games/${gameId}/prizes`],
    enabled: !!gameId,
    refetchInterval: 30000 // Refresh every 30 seconds for real-time updates
  });

  // Trigger animation on data load
  useEffect(() => {
    if (prizes) {
      setAnimateStats(true);
      const timer = setTimeout(() => setAnimateStats(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [prizes]);

  // Memoized calculations
  const {
    sortedPrizes,
    totalItems,
    totalRemaining,
    totalSold,
    claimRate,
    mostValuablePrize,
    rarestPrize,
    categoryBreakdown
  } = useMemo(() => {
    if (!prizes) return {
      sortedPrizes: [],
      totalItems: 0,
      totalRemaining: 0,
      totalSold: 0,
      claimRate: 0,
      mostValuablePrize: null,
      rarestPrize: null,
      categoryBreakdown: {}
    };

    const sorted = [...prizes].sort((a, b) => (b.value || 0) - (a.value || 0));
    const total = sorted.reduce((sum, p) => sum + p.totalQty, 0);
    const remaining = sorted.reduce((sum, p) => sum + p.remainingQty, 0);
    const sold = total - remaining;
    const rate = total > 0 ? (sold / total) * 100 : 0;
    
    const mostValuable = sorted.reduce((max, prize) => 
      (prize.value || 0) > (max?.value || 0) ? prize : max, sorted[0]);
    
    const rarest = sorted.reduce((rarest, prize) => {
      const rarity = prize.remainingQty / prize.totalQty;
      const currentRarest = rarest ? rarest.remainingQty / rarest.totalQty : 1;
      return rarity < currentRarest ? prize : rarest;
    }, sorted[0]);

    // Category breakdown
    const categories: Record<string, number> = {};
    sorted.forEach(prize => {
      const category = getPrizeCategory(prize.title, prize.value).label;
      categories[category] = (categories[category] || 0) + prize.remainingQty;
    });

    return {
      sortedPrizes: sorted,
      totalItems: total,
      totalRemaining: remaining,
      totalSold: sold,
      claimRate: rate,
      mostValuablePrize: mostValuable,
      rarestPrize: rarest,
      categoryBreakdown: categories
    };
  }, [prizes]);

  if (!gameId) return null;
  
  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-3xl p-8 border border-yellow-500/20 shadow-2xl ${className}`}
      >
        <div className="flex flex-col items-center justify-center h-48 gap-4">
          <div className="relative">
            <div className="animate-spin w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full" />
            <div className="absolute inset-0 animate-pulse bg-yellow-500/20 rounded-full blur-xl" />
          </div>
          <p className="text-yellow-400 font-medium animate-pulse">Loading Prize Pool...</p>
        </div>
      </motion.div>
    );
  }
  
  if (error || !prizes || prizes.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-3xl p-12 border border-yellow-500/20 shadow-2xl text-center ${className}`}
      >
        <div className="relative">
          <Gift className="w-24 h-24 mx-auto text-gray-600 mb-6" />
          <div className="absolute inset-0 animate-pulse bg-yellow-500/5 rounded-full blur-2xl" />
        </div>
        <h3 className="text-2xl font-bold text-yellow-400 mb-3">No Prizes Yet</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          The prize pool is being prepared. Check back soon for amazing rewards!
        </p>
      </motion.div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto my-10 ${className}`}>
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full group relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-500 shadow-2xl"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <div className="relative p-8">
            <div className="flex flex-col items-center gap-4">
              {/* Title with icons */}
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400">
                  PRIZE POOL
                </h2>
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </div>

             
       

              {/* Toggle indicator */}
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="mt-2"
              >
                <ChevronDown className="w-6 h-6 text-yellow-400/60 group-hover:text-yellow-400 transition-colors" />
              </motion.div>
            </div>
          </div>
        </button>
      </motion.div>

      {/* Prizes Grid */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden"
          >
            {/* Category Stats */}
           

            {/* Prize Cards Grid */}
            <div className="grid grid-cols-1 px-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-5 gap-6">
              {sortedPrizes.map((prize, index) => {
                const sold = prize.totalQty - prize.remainingQty;
                const sellThroughRate = (sold / prize.totalQty) * 100;
                const category = getPrizeCategory(prize.title, prize.value);
                const rarity = getRarity(prize.remainingQty, prize.totalQty);
                const remainingPercentage = (prize.remainingQty / prize.totalQty) * 100; 
                const isHovered = hoveredPrize === prize.id;
                
                // Determine if it's hot (selling fast)
                const isHot = sellThroughRate > 70 && remainingPercentage < 30;

                return (
                  <motion.div
                    key={prize.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    onHoverStart={() => setHoveredPrize(prize.id)}
                    onHoverEnd={() => setHoveredPrize(null)}
                    onClick={() => onPrizeSelect?.(prize)}
                    className={`relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ${
                      isHovered ? 'shadow-2xl z-10' : 'shadow-xl'
                    }`}
                    style={{
                      boxShadow: isHovered ? `0 20px 40px -10px ${category.glowColor}` : undefined
                    }}
                  >
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    {/* Animated border */}
                    <div className={`absolute inset-0 border-2 ${category.borderColor} rounded-2xl group-hover:border-opacity-100 transition-all duration-300 ${
                      isHovered ? 'border-opacity-100' : 'border-opacity-0'
                    }`} />

                    {/* Hot badge */}
                    {isHot && rarity.level !== 'legendary' && (
                        <div className="absolute top-3 right-3 z-20">
                          <div className="relative">
                            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-50" />
                            <div className="relative bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                              <Flame className="w-3 h-3" />
                              HOT
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Legendary badge - takes priority over HOT */}
                      {rarity.level === 'legendary' && (
                        <div className="absolute top-3 right-3 z-20">
                          <div className="relative">
                            <div className="absolute inset-0 bg-orange-500 rounded-full animate-pulse opacity-30" />
                            <div className="relative bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-bold px-2 py-1 rounded-full flex items-center gap-1 text-xs">
                              <Crown className="w-3 h-3" />
                              LEGENDARY
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rarity indicator - show on left for non-legendary items */}
                      {rarity.level !== 'common' && rarity.level !== 'legendary' && (
                        <div className="absolute top-3 left-3 z-20">
                          <div className={`bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-bold ${rarity.color} border border-current/30 flex items-center gap-1`}>
                            {rarity.level === 'epic' && <Gem className="w-3 h-3" />}
                            {rarity.level === 'rare' && <Star className="w-3 h-3" />}
                            {rarity.level.toUpperCase()}
                          </div>
                        </div>
                      )}

                      {/* For legendary items, show on left too (optional) */}
                      {rarity.level === 'legendary' && (
                        <div className="absolute top-3 left-3 z-20">
                          <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-bold text-orange-400 border border-orange-500/30 flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            LEGENDARY
                          </div>
                        </div>
                      )}

                    {/* Main content */}
                    <div className="relative p-6 bg-gradient-to-br from-zinc-900/95 to-zinc-950/95 backdrop-blur-sm h-full flex flex-col">
                      {/* Category icon */}
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 mt-5 rounded-xl bg-black/30 ${category.color}`}>
                          {category.icon}
                        </div>
                        {/* <div className="text-xs font-mono text-gray-500">
                          #{prize.id}
                        </div> */}
                      </div>

                      {/* Prize title */}
                      <h3 className="text-lg font-bold text-white -mb-5 sm:mb-2 line-clamp-2 min-h-[3.5rem]">
                        {prize.title}
                      </h3>

                      {/* Prize value */}
                      {prize.value ? (
                        <div className="mb-4">
                          <div className="text-sm text-gray-400 mb-1">Value</div>
                          <div className={`text-2xl font-black ${category.color}`}>
                            {prize.title.toLowerCase().includes('point') || prize.title.toLowerCase().includes('pts')
                              ? `${prize.value.toLocaleString()} pts`
                              : `£${prize.value.toLocaleString()}`
                            }
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 h-[3.5rem]" />
                      )}

                      {/* Progress section */}
                      <div className="mt-auto space-y-3">
                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Claimed</span>
                            <span className="text-yellow-400 font-bold">{sold} / {prize.totalQty}</span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${sellThroughRate}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                              className={`h-full rounded-full ${
                                sellThroughRate > 80 ? 'bg-red-500' :
                                sellThroughRate > 50 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-1 gap-2 text-center">
                          <div className="bg-black/30 rounded-lg p-2">
                            <div className="text-xs text-gray-400">Remaining</div>
                            <div className="text-sm font-bold text-yellow-400">
                              {prize.remainingQty}
                            </div>
                          </div>
                          
                        </div>

                        {/* Timer effect for low stock */}
                        {/* {prize.remainingQty <= 5 && (
                          <div className="flex items-center justify-center gap-1 text-xs text-orange-400 animate-pulse">
                            <Timer className="w-3 h-3" />
                            <span>Only {prize.remainingQty} left!</span>
                          </div>
                        )} */}
                      </div>

                      {/* Hover overlay effect */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 0.1 : 0 }}
                        className="absolute inset-0 bg-gradient-to-t from-yellow-500 to-transparent pointer-events-none"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer stats */}
           
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}