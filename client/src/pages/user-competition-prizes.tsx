import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Gift,
  Trophy,
  Star,
  TrendingUp,
  Package,
  Sparkles,
  Award,
  Crown,
  Gem,
  Flame,
  Zap,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Prize {
  id: string;
  competitionId: string;
  prizeName: string;
  prizeValue: number;
  totalQuantity: number;
  remainingQuantity: number;
  createdAt: string;
  updatedAt: string;
}

interface UserCompetitionPrizesProps {
  competitionId: string;
  competitionName?: string;
}

// Premium gradient backgrounds for cards
const gradientStyles = [
  "from-amber-500/10 via-orange-500/5 to-red-500/10 border-orange-500/20",
  "from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border-emerald-500/20",
  "from-purple-500/10 via-pink-500/5 to-rose-500/10 border-purple-500/20",
  "from-blue-500/10 via-indigo-500/5 to-violet-500/10 border-blue-500/20",
  "from-rose-500/10 via-red-500/5 to-pink-500/10 border-rose-500/20",
  "from-cyan-500/10 via-sky-500/5 to-blue-500/10 border-cyan-500/20",
];

// Prize icons based on value/name
const getPrizeIcon = (prizeName: string, value: number) => {
  const name = prizeName.toLowerCase();
  if (name.includes("gold") || name.includes("platinum") || value > 1000) return <Crown className="w-8 h-8 text-yellow-500" />;
  if (name.includes("silver") || value > 500) return <Gem className="w-8 h-8 text-gray-400" />;
  if (name.includes("bronze") || value > 250) return <Award className="w-8 h-8 text-amber-600" />;
  return <Trophy className="w-8 h-8 text-primary" />;
};

// Get stock status with color
const getStockStatus = (remaining: number, total: number) => {
  const percentage = (remaining / total) * 100;
  if (percentage === 0) return { label: "All Claimed", color: "bg-red-500", textColor: "text-red-400", variant: "destructive" };
  return { label: "Available", color: "bg-green-500", textColor: "text-green-400", variant: "default" };
};

// Format number with commas
const formatNumber = (num: number) => {
  return num.toLocaleString();
};

export default function UserCompetitionPrizes({ competitionId }: UserCompetitionPrizesProps) {
  const [hoveredPrize, setHoveredPrize] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch prizes
  const { data: prizes = [], isLoading, error } = useQuery<Prize[]>({
    queryKey: ["/api/competitions", competitionId, "prizes"],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${competitionId}/prize-table`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch prizes");
      const data = await res.json();
      // Normalize numeric fields
      return data.map((prize: any) => ({
        ...prize,
        prizeValue: Number(prize.prizeValue),
        totalQuantity: Number(prize.totalQuantity),
        remainingQuantity: Number(prize.remainingQuantity),
      }));
    },
    enabled: !!competitionId,
  });

  // Sort prizes by value (highest first) and filter out zero remaining
  const sortedPrizes = useMemo(() => {
    return [...prizes]
      .filter(prize => prize.totalQuantity > 0)
      .sort((a, b) => b.prizeValue - a.prizeValue);
  }, [prizes]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="pt-6">
          <div className="text-center text-red-400">
            <p>Failed to load prizes. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedPrizes.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-gray-500/10 to-gray-600/5 border-gray-500/20">
        <CardContent className="pt-12 pb-12 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Prizes Announced Yet</h3>
          <p className="text-muted-foreground">
            Prizes for this competition will be revealed soon. Stay tuned!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 my-5">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-[30px] font-medium text-primary">Prize Pool</span>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Amazing prizes await the winners! Check out what you could win.
        </p>
        
    
      </div>

      {/* Prizes Grid with Collapsible Animation */}
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mx-4 sm:mx-28 gap-6 transition-all duration-500 ease-in-out overflow-hidden",
         isOpen ? "max-h-none opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {sortedPrizes.map((prize, index) => {
          const stockStatus = getStockStatus(prize.remainingQuantity, prize.totalQuantity);
          const percentageRemaining = (prize.remainingQuantity / prize.totalQuantity) * 100;
          const gradientIndex = index % gradientStyles.length;
          
          return (
            <Card
              key={prize.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer border-2",
                `bg-gradient-to-br ${gradientStyles[gradientIndex]}`,
                hoveredPrize === prize.id && "shadow-2xl scale-105"
              )}
              onMouseEnter={() => setHoveredPrize(prize.id)}
              onMouseLeave={() => setHoveredPrize(null)}
            >
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
              
              {/* Prize Icon */}
              <div className="absolute top-4 right-4">
                {getPrizeIcon(prize.prizeName, prize.prizeValue)}
              </div>
              
              <CardHeader>
                <div className="space-y-2">
                  <Badge 
                    variant="outline" 
                    className="w-fit border-primary/30 text-primary text-xs"
                  >
                    Prize #{index + 1}
                  </Badge>
                  <CardTitle className="text-2xl font-bold line-clamp-2">
                    {prize.prizeName}
                  </CardTitle>
                  <CardDescription className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-green-500">
                      £{prize.prizeValue.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">value</span>
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Availability</span>
                    <span className={cn("font-semibold", stockStatus.textColor)}>
                      {prize.remainingQuantity} / {prize.totalQuantity} remaining
                    </span>
                  </div>
                  <Progress 
                    value={percentageRemaining} 
                    className="h-3"
                    indicatorClassName={stockStatus.color}
                  />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{Math.round(percentageRemaining)}% available</span>
                    <Badge 
                      variant={stockStatus.variant as any}
                      className={cn(
                        "text-xs",
                        stockStatus.variant === "warning" && "bg-yellow-500/20 text-yellow-500",
                        stockStatus.variant === "info" && "bg-blue-500/20 text-blue-500"
                      )}
                    >
                      {stockStatus.label}
                    </Badge>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center p-2 rounded-lg bg-background/50 backdrop-blur">
                    <p className="text-xs text-muted-foreground">Total Available</p>
                    <p className="text-lg font-bold">{formatNumber(prize.totalQuantity)}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/50 backdrop-blur">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className={cn("text-lg font-bold", stockStatus.textColor)}>
                      {formatNumber(prize.remainingQuantity)}
                    </p>
                  </div>
                </div>
                
                
              </CardContent>
            </Card>
          );
        })}
      </div>
        {/* Show Prizes Button */}
        <div className="w-full text-center">

        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          className="gap-2 px-6 py-2 mx-auto hover:bg-yellow-600 text-md font-semibold transition-all hover:scale-105"
        >
          {isOpen ? (
            <>
              <ChevronUp className="w-5 h-5" />
              Hide Prizes
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              Show Prizes
            </>
          )}
        </Button>
        </div>
    </div>
  );
}