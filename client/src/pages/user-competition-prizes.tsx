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
  ChevronUp,
  Ticket,
  Percent,
  Coins
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Prize {
  id: string;
  competitionId: string;
  prizeName: string;
  prizeValue: number;
  totalQuantity: number;
  remainingQuantity: number;
  createdAt?: string;
  updatedAt?: string;
  publicStatus?: "available" | "won" | "unavailable";
  status?: string;
  winningTicketNumber?: number | null;
  winnerDisplayName?: string | null;
}

interface PrizeGroupTicket {
  id: string;
  winningTicketNumber?: number | null;
  publicStatus?: "available" | "won" | "unavailable";
  winnerDisplayName?: string | null;
}

interface PrizeGroup {
  id: string;
  prizeName: string;
  prizeValue: number;
  totalQuantity: number;
  remainingQuantity: number;
  wonCount: number;
  leftCount: number;
  tickets: PrizeGroupTicket[];
}

interface PrizeTableResponse {
  mode: "probability" | "controlled_pool";
  prizes: Prize[];
  groups?: PrizeGroup[];
  pool?: {
    maxTickets: number;
    soldTickets: number;
    remaining: number;
    percentSold: number;
  };
}

interface TicketInfo {
  winPercentage: number;
  ticketCost: number;
  isActive: boolean;
  totalRemainingPrizes: number;
  totalPrizes: number;
  prizesAvailable: boolean;
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
  if (percentage < 25) return { label: "Low Stock", color: "bg-yellow-500", textColor: "text-yellow-400", variant: "warning" };
  return { label: "Available", color: "bg-green-500", textColor: "text-green-400", variant: "default" };
};

// Format number with commas
const formatNumber = (num: number) => {
  return num.toLocaleString();
};

export default function UserCompetitionPrizes({ competitionId }: UserCompetitionPrizesProps) {
  const [hoveredPrize, setHoveredPrize] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<PrizeGroup | null>(null);

  // Fetch prizes
  const { data: prizeTable, isLoading, error } = useQuery<PrizeTableResponse>({
    queryKey: ["/api/competitions", competitionId, "prizes"],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${competitionId}/prize-table`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch prizes");
      const data = await res.json();
      if (Array.isArray(data)) {
        return {
          mode: "probability" as const,
          prizes: data.map((prize: any) => ({
            ...prize,
            prizeValue: Number(prize.prizeValue),
            totalQuantity: Number(prize.totalQuantity),
            remainingQuantity: Number(prize.remainingQuantity),
          })),
        };
      }
      return {
        mode: data.mode || "controlled_pool",
        pool: data.pool,
        groups: (data.groups || []).map((group: any) => ({
          ...group,
          prizeValue: Number(group.prizeValue),
          totalQuantity: Number(group.totalQuantity ?? 1),
          remainingQuantity: Number(group.remainingQuantity ?? 0),
          wonCount: Number(group.wonCount ?? 0),
          leftCount: Number(group.leftCount ?? group.remainingQuantity ?? 0),
          tickets: group.tickets || [],
        })),
        prizes: (data.prizes || []).map((prize: any) => ({
          ...prize,
          prizeValue: Number(prize.prizeValue),
          totalQuantity: Number(prize.totalQuantity ?? 1),
          remainingQuantity: Number(prize.remainingQuantity ?? 0),
        })),
      };
    },
    enabled: !!competitionId,
    refetchInterval: 15000,
  });

  const prizes = prizeTable?.prizes || [];
  const groups = prizeTable?.groups || [];
  const isControlled = prizeTable?.mode === "controlled_pool";
  const useGroups = isControlled && groups.length > 0;

  // Fetch ticket info
  const { data: ticketInfo, isLoading: ticketLoading } = useQuery<TicketInfo>({
    queryKey: ["/api/competitions", competitionId, "ticket-info"],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${competitionId}/ticket-info`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch ticket info");
      return res.json();
    },
    enabled: !!competitionId,
  });

  // Sort prizes by value (highest first) and filter out zero remaining
  const sortedPrizes = useMemo(() => {
    return [...prizes]
      .filter(prize => prize.totalQuantity > 0)
      .sort((a, b) => b.prizeValue - a.prizeValue);
  }, [prizes]);

  if (isLoading || ticketLoading) {
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

  if ((useGroups ? groups.length : sortedPrizes.length) === 0) {
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
        
        {/* Ticket Info Card */}
        {isControlled && prizeTable?.pool ? (
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-amber-500/5 to-yellow-500/5 border-amber-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Ticket className="w-5 h-5 text-amber-400" />
                    <span className="text-sm text-muted-foreground">Tickets sold</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-400">
                    {prizeTable.pool.soldTickets} / {prizeTable.pool.maxTickets}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Gift className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Remaining</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-500">{prizeTable.pool.remaining}</p>
                </div>
                <div className="text-center col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Zap className="w-5 h-5 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Pool</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-400">{prizeTable.pool.percentSold}% sold</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : ticketInfo ? (
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Percent className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-green-500">{ticketInfo.winPercentage}%</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Ticket Cost</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-500">{ticketInfo.ticketCost}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Gift className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Prizes Left</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-500">{ticketInfo.totalRemainingPrizes}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Zap className="w-5 h-5 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Status</span>
                  </div>
                  <Badge 
                    variant={ticketInfo.isActive && ticketInfo.prizesAvailable ? "default" : "destructive"}
                    className="mt-1"
                  >
                    {ticketInfo.isActive && ticketInfo.prizesAvailable ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Prizes Grid with Collapsible Animation */}
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mx-4 sm:mx-28 gap-6 transition-all duration-500 ease-in-out overflow-hidden",
         isOpen ? "max-h-none opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {(useGroups ? groups : sortedPrizes).map((item, index) => {
          const prize = useGroups
            ? {
                id: (item as PrizeGroup).id,
                prizeName: (item as PrizeGroup).prizeName,
                prizeValue: (item as PrizeGroup).prizeValue,
                totalQuantity: (item as PrizeGroup).totalQuantity,
                remainingQuantity: (item as PrizeGroup).remainingQuantity,
              }
            : (item as Prize);
          const group = useGroups ? (item as PrizeGroup) : null;
          const stockStatus = getStockStatus(prize.remainingQuantity, prize.totalQuantity);
          const percentageRemaining = prize.totalQuantity > 0
            ? (prize.remainingQuantity / prize.totalQuantity) * 100
            : 0;
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
                      {group
                        ? `${group.leftCount} OF ${group.totalQuantity} PRIZES REMAINING`
                        : `${prize.remainingQuantity} / ${prize.totalQuantity} remaining`}
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
                    <p className="text-xs text-muted-foreground">{group ? "Won" : "Total Available"}</p>
                    <p className="text-lg font-bold">{formatNumber(group ? group.wonCount : prize.totalQuantity)}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/50 backdrop-blur">
                    <p className="text-xs text-muted-foreground">{group ? "Left" : "Remaining"}</p>
                    <p className={cn("text-lg font-bold", stockStatus.textColor)}>
                      {formatNumber(group ? group.leftCount : prize.remainingQuantity)}
                    </p>
                  </div>
                </div>

                {group && (
                  <button
                    type="button"
                    onClick={() => setOpenGroup(group)}
                    className="w-full text-sm font-semibold text-amber-400 hover:text-amber-300 pt-1"
                  >
                    Check ticket numbers →
                  </button>
                )}
                
                {/* Win Chance Indicator */}
                {!group && isControlled && (item as Prize).publicStatus === "won" && (
                  <div className="text-center pt-2 space-y-1">
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Won</Badge>
                    <p className="text-sm text-muted-foreground">
                      Ticket #{(item as Prize).winningTicketNumber} · {(item as Prize).winnerDisplayName}
                    </p>
                  </div>
                )}
                {!group && isControlled && (item as Prize).publicStatus === "unavailable" && (
                  <div className="text-center pt-2">
                    <Badge variant="outline" className="text-slate-400">Coming soon</Badge>
                  </div>
                )}
                {!group && isControlled && (item as Prize).publicStatus === "available" && (
                  <div className="text-center pt-2">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Available</Badge>
                  </div>
                )}
                {!isControlled && ticketInfo && (
                  <div className="text-center pt-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                      <Ticket className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500 font-medium">
                        {((prize.remainingQuantity / ticketInfo.totalRemainingPrizes) * ticketInfo.winPercentage).toFixed(1)}% chance
                      </span>
                    </div>
                  </div>
                )}
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

      <Dialog open={!!openGroup} onOpenChange={(open) => { if (!open) setOpenGroup(null); }}>
        <DialogContent className="max-w-lg bg-zinc-950 border-amber-500/20">
          <DialogHeader>
            <p className="text-xs font-bold tracking-[0.2em] text-amber-400 uppercase">Ticket assignments</p>
            <DialogTitle className="text-2xl">{openGroup?.prizeName}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {(openGroup?.tickets || []).map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-xl border border-white/10 bg-black/40 p-4 text-center"
              >
                <div className="text-xl font-bold">
                  {ticket.winningTicketNumber ? `#${ticket.winningTicketNumber}` : "—"}
                </div>
                <div className="text-xs mt-1 uppercase tracking-wide text-muted-foreground">
                  {ticket.publicStatus === "won"
                    ? ticket.winnerDisplayName || "Won"
                    : ticket.publicStatus === "available"
                    ? "Available"
                    : "Coming soon"}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}