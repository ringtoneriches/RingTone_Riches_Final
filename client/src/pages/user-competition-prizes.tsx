import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Gift,
  Trophy,
  Award,
  Crown,
  Gem,
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

const getPrizeIcon = (prizeName: string, value: number) => {
  const name = prizeName.toLowerCase();
  if (name.includes("gold") || name.includes("platinum") || value > 1000) return <Crown className="w-8 h-8 text-[#F1D47A]" />;
  if (name.includes("silver") || value > 500) return <Gem className="w-8 h-8 text-[#D4AF37]" />;
  if (name.includes("bronze") || value > 250) return <Award className="w-8 h-8 text-[#C8102E]" />;
  return <Trophy className="w-8 h-8 text-[#F1D47A]" />;
};

// Get stock status with color
const getStockStatus = (remaining: number, total: number) => {
  const percentage = (remaining / total) * 100;
  if (percentage === 0) return { label: "All Claimed", color: "bg-[#C8102E]", textColor: "text-[#FF263D]", variant: "destructive" };
  if (percentage < 25) return { label: "Low Stock", color: "bg-[#D4AF37]", textColor: "text-[#F1D47A]", variant: "warning" };
  return { label: "Available", color: "bg-[#C8102E]", textColor: "text-[#F1D47A]", variant: "default" };
};

// Format number with commas
const formatNumber = (num: number) => {
  return num.toLocaleString();
};

export default function UserCompetitionPrizes({ competitionId }: UserCompetitionPrizesProps) {
  const [hoveredPrize, setHoveredPrize] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
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
      <div className="grid grid-cols-2 gap-3 py-4 md:grid-cols-3 md:gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl bg-white/10" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[#C8102E]/30 bg-[#C8102E]/10 p-6 text-center text-sm text-[#FF263D]">
        Failed to load prizes. Please try again later.
      </div>
    );
  }

  if ((useGroups ? groups.length : sortedPrizes.length) === 0) {
    return null;
  }

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-4 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">On this draw</p>
        <h2 className="font-prize text-3xl text-white sm:text-5xl">INSTANT WINS</h2>
        <p className="mx-auto max-w-2xl text-sm text-white/50">
          Extra prizes sitting in this competition. Claimed or remaining, all shown here.
        </p>

        {isControlled && prizeTable?.pool ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#0A0A0D] p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <Ticket className="h-4 w-4 text-[#F1D47A]" />
                  <span className="text-xs uppercase tracking-wider text-white/45">Tickets sold</span>
                </div>
                <p className="font-prize text-2xl text-[#F1D47A]">
                  {prizeTable.pool.soldTickets} / {prizeTable.pool.maxTickets}
                </p>
              </div>
              <div className="text-center">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <Gift className="h-4 w-4 text-[#FF263D]" />
                  <span className="text-xs uppercase tracking-wider text-white/45">Remaining</span>
                </div>
                <p className="font-prize text-2xl text-white">{prizeTable.pool.remaining}</p>
              </div>
              <div className="col-span-2 text-center sm:col-span-1">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4 text-[#F1D47A]" />
                  <span className="text-xs uppercase tracking-wider text-white/45">Pool</span>
                </div>
                <p className="font-prize text-2xl text-white">{prizeTable.pool.percentSold}% sold</p>
              </div>
            </div>
          </div>
        ) : ticketInfo ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#0A0A0D] p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <Percent className="h-4 w-4 text-[#F1D47A]" />
                  <span className="text-xs uppercase tracking-wider text-white/45">Win rate</span>
                </div>
                <p className="font-prize text-2xl text-[#F1D47A]">{ticketInfo.winPercentage}%</p>
              </div>
              <div className="text-center">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <Coins className="h-4 w-4 text-[#D4AF37]" />
                  <span className="text-xs uppercase tracking-wider text-white/45">Ticket cost</span>
                </div>
                <p className="font-prize text-2xl text-white">{ticketInfo.ticketCost}</p>
              </div>
              <div className="text-center">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <Gift className="h-4 w-4 text-[#FF263D]" />
                  <span className="text-xs uppercase tracking-wider text-white/45">Prizes left</span>
                </div>
                <p className="font-prize text-2xl text-white">{ticketInfo.totalRemainingPrizes}</p>
              </div>
              <div className="text-center">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4 text-[#F1D47A]" />
                  <span className="text-xs uppercase tracking-wider text-white/45">Status</span>
                </div>
                <Badge
                  variant={ticketInfo.isActive && ticketInfo.prizesAvailable ? "default" : "destructive"}
                  className="mt-1"
                >
                  {ticketInfo.isActive && ticketInfo.prizesAvailable ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Prizes Grid with Collapsible Animation */}
      <div
        className={cn(
          "grid grid-cols-2 gap-3 transition-all duration-500 ease-in-out md:grid-cols-3 md:gap-6 overflow-hidden",
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

          return (
            <Card
              key={prize.id}
              className={cn(
                "rr-prize-card relative overflow-hidden rounded-2xl border-white/10 transition-transform duration-300 hover:-translate-y-1 cursor-pointer",
                hoveredPrize === prize.id && "border-[#C8102E]/40"
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
                    className="w-fit border-[#D4AF37]/30 text-[10px] uppercase tracking-widest text-[#F1D47A]"
                  >
                    Prize #{index + 1}
                  </Badge>
                  <CardTitle className="line-clamp-2 text-lg font-bold text-white sm:text-2xl">
                    {prize.prizeName}
                  </CardTitle>
                  <CardDescription className="flex items-baseline gap-1">
                    <span className="font-prize text-2xl text-[#F1D47A] sm:text-3xl">
                      £{prize.prizeValue.toLocaleString()}
                    </span>
                    <span className="text-white/40">value</span>
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
                    className="w-full pt-1 text-sm font-semibold text-[#F1D47A] hover:text-[#F1D47A]/80"
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
          className="mx-auto gap-2 border-white/15 bg-transparent px-6 py-2 text-sm font-black uppercase tracking-widest text-white hover:border-[#C8102E] hover:bg-[#C8102E]/15"
        >
          {isOpen ? (
            <>
              <ChevronUp className="h-5 w-5" />
              Hide prizes
            </>
          ) : (
            <>
              <ChevronDown className="h-5 w-5" />
              Show prizes
            </>
          )}
        </Button>
      </div>

      <Dialog open={!!openGroup} onOpenChange={(open) => { if (!open) setOpenGroup(null); }}>
        <DialogContent className="max-w-lg border-white/10 bg-[#0A0A0D]">
          <DialogHeader>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F1D47A]">Ticket assignments</p>
            <DialogTitle className="font-prize text-2xl text-white">{openGroup?.prizeName}</DialogTitle>
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