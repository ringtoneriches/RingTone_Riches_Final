import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Zap, Timer, TicketPercent } from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BrandWait from "@/components/brand/BrandWait";
import { useToast } from "@/hooks/use-toast";
import { useCountdown } from "@/hooks/useCountdown";
import { apiRequest } from "@/lib/queryClient";
import { isCompetitionLive } from "@shared/competition-config";
import { flashSaleState } from "@shared/flash-sale";
import type { Competition } from "@shared/schema";

const DURATIONS = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "360", label: "6 hours" },
  { value: "720", label: "12 hours" },
  { value: "1440", label: "24 hours" },
  { value: "custom", label: "Custom end time" },
];

function LiveSale({ endsAt }: { endsAt: Date }) {
  const time = useCountdown(endsAt);
  const parts = [
    time.d ? `${time.d}d` : "",
    time.d || time.h ? `${time.h}h` : "",
    `${time.m}m`,
    `${time.s}s`,
  ].filter(Boolean);

  return (
    <span className="rr-admin-pill rr-admin-pill--bad gap-1.5">
      <Timer className="h-3 w-3" />
      {parts.join(" ")} left
    </span>
  );
}

function CompetitionRow({ competition }: { competition: Competition }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sale = flashSaleState(competition);

  const [salePrice, setSalePrice] = useState("");
  const [duration, setDuration] = useState("60");
  const [customEnd, setCustomEnd] = useState("");

  const basePrice = Number(competition.ticketPrice);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
  };

  const startSale = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { salePrice: Number(salePrice) };
      if (duration === "custom") {
        if (!customEnd) throw new Error("Pick an end date and time");
        body.endsAt = new Date(customEnd).toISOString();
      } else {
        body.durationMinutes = Number(duration);
      }
      const res = await apiRequest(`/api/admin/competitions/${competition.id}/flash-sale`, "POST", body);
      return res.json();
    },
    onSuccess: () => {
      refresh();
      setSalePrice("");
      toast({ title: "Flash sale started", description: competition.title });
    },
    onError: (error: any) => {
      toast({
        title: "Could not start the sale",
        description: String(error?.message || "").replace(/^\d+:\s*/, "") || "Please check the price and timing.",
        variant: "destructive",
      });
    },
  });

  const stopSale = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/admin/competitions/${competition.id}/flash-sale`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      refresh();
      toast({ title: "Flash sale stopped", description: `${competition.title} is back to its normal price.` });
    },
    onError: () => {
      toast({ title: "Could not stop the sale", variant: "destructive" });
    },
  });

  const priceError =
    salePrice !== "" && (Number(salePrice) >= basePrice || Number(salePrice) < 0 || Number.isNaN(Number(salePrice)));

  return (
    <div className="rr-admin-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="rr-admin-kicker">{competition.type}</p>
          <h2 className="mt-1 truncate text-base leading-tight text-[#FFF8EE]">{competition.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {sale.isLive && sale.endsAt ? (
            <>
              <span className="rr-admin-pill rr-admin-pill--wait">
                £{sale.basePrice.toFixed(2)} → £{sale.price.toFixed(2)} ({sale.percentOff}% off)
              </span>
              <LiveSale endsAt={sale.endsAt} />
            </>
          ) : (
            <span className="rr-admin-pill rr-admin-pill--ok">£{basePrice.toFixed(2)} normal price</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-32">
          <Label className="text-xs" htmlFor={`price-${competition.id}`}>
            Sale price (£)
          </Label>
          <Input
            id={`price-${competition.id}`}
            type="number"
            step="0.01"
            min="0"
            placeholder={(basePrice / 2).toFixed(2)}
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            data-testid={`input-flash-price-${competition.id}`}
          />
        </div>

        <div className="w-44">
          <Label className="text-xs">Runs for</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger data-testid={`select-flash-duration-${competition.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {duration === "custom" && (
          <div className="w-56">
            <Label className="text-xs" htmlFor={`end-${competition.id}`}>
              Ends at
            </Label>
            <Input
              id={`end-${competition.id}`}
              type="datetime-local"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        )}

        <Button
          onClick={() => startSale.mutate()}
          disabled={salePrice === "" || priceError || startSale.isPending}
          data-testid={`button-start-flash-${competition.id}`}
        >
          <Zap className="h-4 w-4" />
          {startSale.isPending ? "Starting..." : sale.isLive ? "Replace sale" : "Start sale"}
        </Button>

        {sale.isLive && (
          <Button
            variant="outline"
            onClick={() => stopSale.mutate()}
            disabled={stopSale.isPending}
            data-testid={`button-stop-flash-${competition.id}`}
          >
            {stopSale.isPending ? "Stopping..." : "Stop now"}
          </Button>
        )}
      </div>

      {priceError && (
        <p className="mt-2 text-xs text-destructive">
          Enter a price between £0.00 and £{(basePrice - 0.01).toFixed(2)}.
        </p>
      )}
    </div>
  );
}

export default function AdminFlashSales() {
  const { data: competitions, isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/admin/competitions"],
    refetchInterval: 30_000,
  });

  const live = useMemo(
    () => (competitions || []).filter((competition) => isCompetitionLive(competition)),
    [competitions],
  );
  const onSale = live.filter((competition) => flashSaleState(competition).isLive).length;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rr-admin-hero">
          <div className="relative z-10">
            <span className="rr-admin-kicker-pill">
              <TicketPercent className="h-3 w-3" />
              Promotions
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl">Flash Sales</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Drop the entry price for a set time. The site shows the old price struck through with the sale
              price beside it, and everything returns to normal automatically when the timer runs out.
            </p>
            <p className="mt-1 text-xs text-white/40">
              {onSale > 0 ? `${onSale} sale${onSale === 1 ? "" : "s"} running now` : "No sales running"}
              {" · "}Card payments still need a £3 minimum basket.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <BrandWait mode="embed" kicker="Admin" headline="Loading games" />
          </div>
        ) : live.length === 0 ? (
          <div className="rr-admin-panel p-8 text-center text-white/45">No live competitions to put on sale.</div>
        ) : (
          live.map((competition) => <CompetitionRow key={competition.id} competition={competition} />)
        )}
      </div>
    </AdminLayout>
  );
}
