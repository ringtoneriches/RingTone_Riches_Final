import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import {
  Trophy,
  Award,
  Crown,
  Gem,
  ChevronDown,
  ChevronUp,
  Ticket,
  ChevronLeft,
  ChevronRight,
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
  ringtonePoints?: number;
  totalQuantity: number;
  remainingQuantity: number;
  createdAt?: string;
  updatedAt?: string;
  publicStatus?: "available" | "won";
  winningTicketNumber?: number | null;
  winnerDisplayName?: string | null;
}

interface PrizeGroupTicket {
  id: string;
  winningTicketNumber?: number | null;
  publicStatus?: "available" | "won";
  winnerDisplayName?: string | null;
}

interface PrizeGroup {
  id: string;
  prizeName: string;
  prizeValue: number;
  ringtonePoints?: number;
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
  if (name.includes("gold") || name.includes("platinum") || value > 1000) return <Crown className="h-5 w-5 text-[#F1D47A] sm:h-8 sm:w-8" />;
  if (name.includes("silver") || value > 500) return <Gem className="h-5 w-5 text-[#D4AF37] sm:h-8 sm:w-8" />;
  if (name.includes("bronze") || value > 250) return <Award className="h-5 w-5 text-[#C8102E] sm:h-8 sm:w-8" />;
  return <Trophy className="h-5 w-5 text-[#F1D47A] sm:h-8 sm:w-8" />;
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

function getPrizeOfferLabel(prize: { prizeValue: number; ringtonePoints?: number }) {
  const points = Number(prize.ringtonePoints || 0);
  const cash = Number(prize.prizeValue || 0);
  if (points > 0 && cash <= 0) {
    return { amount: points.toLocaleString(), suffix: "Ringtone Points" };
  }
  return { amount: `£${cash.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, suffix: "value" };
}

const TICKETS_PER_PAGE = 24;

function PrizeTicketNumbersDialog({
  group,
  onClose,
}: {
  group: PrizeGroup | null;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [group?.id]);

  const sortedTickets = useMemo(() => {
    return [...(group?.tickets || [])].sort(
      (a, b) => (Number(a.winningTicketNumber) || 0) - (Number(b.winningTicketNumber) || 0),
    );
  }, [group?.tickets]);

  const totalTickets = sortedTickets.length;
  const totalPages = Math.max(1, Math.ceil(totalTickets / TICKETS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * TICKETS_PER_PAGE;
  const pageTickets = sortedTickets.slice(pageStart, pageStart + TICKETS_PER_PAGE);
  const wonOnPage = pageTickets.filter((t) => t.publicStatus === "won").length;
  const totalWon = sortedTickets.filter((t) => t.publicStatus === "won").length;

  const goToPage = (nextPage: number) => {
    setPage(Math.max(1, Math.min(totalPages, nextPage)));
  };

  return (
    <Dialog open={!!group} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="flex max-h-[min(88vh,760px)] max-w-lg flex-col gap-0 overflow-hidden border-white/10 bg-[#0A0A0D] p-0">
        <DialogHeader className="shrink-0 space-y-3 border-b border-white/10 px-5 pb-4 pt-5 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F1D47A]">Ticket assignments</p>
            <DialogTitle className="font-prize text-2xl text-white">{group?.prizeName}</DialogTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-white/15 bg-white/5 text-white/80">
              {formatNumber(totalTickets)} tickets
            </Badge>
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200">
              {formatNumber(totalWon)} won
            </Badge>
            <Badge variant="outline" className="border-[#C8102E]/30 bg-[#C8102E]/10 text-[#F1D47A]">
              {formatNumber(totalTickets - totalWon)} available
            </Badge>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {totalTickets === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/30 px-4 py-10 text-center text-sm text-muted-foreground">
              No ticket numbers assigned yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
              {pageTickets.map((ticket) => {
                const isWon = ticket.publicStatus === "won";
                return (
                  <div
                    key={ticket.id}
                    className={cn(
                      "rounded-xl border p-3 text-center transition-colors sm:p-4",
                      isWon
                        ? "border-amber-500/25 bg-amber-500/10"
                        : "border-white/10 bg-black/40",
                    )}
                  >
                    <div className="font-mono text-lg font-bold text-white sm:text-xl">
                      {ticket.winningTicketNumber ? `#${ticket.winningTicketNumber}` : "—"}
                    </div>
                    {isWon ? (
                      <div className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wide text-amber-200/90 sm:text-xs">
                        {ticket.winnerDisplayName || "Won"}
                      </div>
                    ) : (
                      <div className="mt-1 text-[10px] uppercase tracking-wide text-white/35 sm:text-xs">
                        Available
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {totalTickets > 0 && (
          <div className="shrink-0 border-t border-white/10 bg-black/30 px-5 py-4 sm:px-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/55 sm:text-sm">
              <span>
                Showing{" "}
                <span className="font-semibold text-white">
                  {formatNumber(pageStart + 1)}–{formatNumber(Math.min(pageStart + TICKETS_PER_PAGE, totalTickets))}
                </span>{" "}
                of {formatNumber(totalTickets)}
              </span>
              {wonOnPage > 0 && (
                <span className="text-amber-200/80">{wonOnPage} won on this page</span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage <= 1}
                className="border-white/15 bg-transparent text-white hover:bg-white/10 disabled:opacity-40"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Page</p>
                <p className="font-prize text-lg leading-none text-[#F1D47A]">
                  {safePage}
                  <span className="text-sm text-white/45"> / {totalPages}</span>
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage >= totalPages}
                className="border-white/15 bg-transparent text-white hover:bg-white/10 disabled:opacity-40"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
            ringtonePoints: Number(prize.ringtonePoints || 0),
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
          ringtonePoints: Number(group.ringtonePoints || 0),
          totalQuantity: Number(group.totalQuantity ?? 1),
          remainingQuantity: Number(group.remainingQuantity ?? 0),
          wonCount: Number(group.wonCount ?? 0),
          leftCount: Number(group.leftCount ?? group.remainingQuantity ?? 0),
          tickets: group.tickets || [],
        })),
        prizes: (data.prizes || []).map((prize: any) => ({
          ...prize,
          prizeValue: Number(prize.prizeValue),
          ringtonePoints: Number(prize.ringtonePoints || 0),
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
      <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
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
      {/* Prizes Grid with Collapsible Animation */}
      <div
        className={cn(
          "grid grid-cols-1 gap-3 transition-all duration-500 ease-in-out sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6 overflow-hidden",
          isOpen ? "max-h-none opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {(useGroups ? groups : sortedPrizes).map((item, index) => {
          const prize = useGroups
            ? {
                id: (item as PrizeGroup).id,
                prizeName: (item as PrizeGroup).prizeName,
                prizeValue: (item as PrizeGroup).prizeValue,
                ringtonePoints: (item as PrizeGroup).ringtonePoints,
                totalQuantity: (item as PrizeGroup).totalQuantity,
                remainingQuantity: (item as PrizeGroup).remainingQuantity,
              }
            : (item as Prize);
          const offer = getPrizeOfferLabel(prize);
          const group = useGroups ? (item as PrizeGroup) : null;
          const stockStatus = getStockStatus(prize.remainingQuantity, prize.totalQuantity);
          const percentageRemaining = prize.totalQuantity > 0
            ? (prize.remainingQuantity / prize.totalQuantity) * 100
            : 0;

          return (
            <Card
              key={prize.id}
              className={cn(
                "rr-prize-card relative overflow-hidden rounded-xl border-white/10 sm:rounded-2xl sm:transition-transform sm:duration-300 sm:hover:-translate-y-1",
                hoveredPrize === prize.id && "border-[#C8102E]/40"
              )}
              onMouseEnter={() => setHoveredPrize(prize.id)}
              onMouseLeave={() => setHoveredPrize(null)}
            >
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
              
              {/* Prize Icon */}
              <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
                {getPrizeIcon(prize.prizeName, prize.prizeValue)}
              </div>
              
              <CardHeader className="space-y-1.5 p-4 pr-11 sm:p-6 sm:pr-14">
                <div className="space-y-1.5 sm:space-y-2">
                  <Badge
                    variant="outline"
                    className="w-fit border-[#D4AF37]/30 px-1.5 py-0 text-[9px] uppercase tracking-widest text-[#F1D47A] sm:px-2.5 sm:py-0.5 sm:text-[10px]"
                  >
                    Prize #{index + 1}
                  </Badge>
                  <CardTitle className="line-clamp-2 break-words text-base font-bold leading-snug text-white sm:text-lg md:text-2xl">
                    {prize.prizeName}
                  </CardTitle>
                  <CardDescription className="flex items-baseline gap-1">
                    <span className="font-prize text-xl text-[#F1D47A] sm:text-2xl md:text-3xl">
                      {offer.amount}
                    </span>
                    <span className="text-[11px] text-white/40 sm:text-sm">{offer.suffix}</span>
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 p-4 pt-0 sm:space-y-4 sm:p-6 sm:pt-0">
                {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[11px] text-muted-foreground sm:text-sm">Availability</span>
                    <span className={cn("text-xs font-semibold leading-snug sm:text-sm", stockStatus.textColor)}>
                      {group
                        ? `${group.leftCount} OF ${group.totalQuantity} PRIZES REMAINING`
                        : `${prize.remainingQuantity} / ${prize.totalQuantity} remaining`}
                    </span>
                  </div>
                  <Progress 
                    value={percentageRemaining} 
                    className="h-2 sm:h-3"
                    indicatorClassName={stockStatus.color}
                  />
                  <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground sm:text-xs">
                    <span>{Math.round(percentageRemaining)}% available</span>
                    <Badge 
                      variant={stockStatus.variant as any}
                      className={cn(
                        "shrink-0 text-[10px] sm:text-xs",
                        stockStatus.variant === "warning" && "bg-yellow-500/20 text-yellow-500",
                        stockStatus.variant === "info" && "bg-blue-500/20 text-blue-500"
                      )}
                    >
                      {stockStatus.label}
                    </Badge>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1 sm:gap-3 sm:pt-2">
                  <div className="rounded-lg bg-background/50 p-2 text-center backdrop-blur">
                    <p className="text-[10px] text-muted-foreground sm:text-xs">{group ? "Won" : "Total"}</p>
                    <p className="text-base font-bold sm:text-lg">{formatNumber(group ? group.wonCount : prize.totalQuantity)}</p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-2 text-center backdrop-blur">
                    <p className="text-[10px] text-muted-foreground sm:text-xs">{group ? "Left" : "Remaining"}</p>
                    <p className={cn("text-base font-bold sm:text-lg", stockStatus.textColor)}>
                      {formatNumber(group ? group.leftCount : prize.remainingQuantity)}
                    </p>
                  </div>
                </div>

                {group && (
                  <button
                    type="button"
                    onClick={() => setOpenGroup(group)}
                    className="w-full pt-1 text-xs font-semibold text-[#F1D47A] hover:text-[#F1D47A]/80 sm:text-sm"
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
                {!isControlled && ticketInfo && (
                  <div className="text-center pt-2">
                    <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 sm:gap-2 sm:px-3">
                      <Ticket className="h-3.5 w-3.5 shrink-0 text-green-500 sm:h-4 sm:w-4" />
                      <span className="text-xs font-medium text-green-500 sm:text-sm">
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

      <PrizeTicketNumbersDialog group={openGroup} onClose={() => setOpenGroup(null)} />
    </div>
  );
}