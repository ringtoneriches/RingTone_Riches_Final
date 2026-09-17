import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, Pause, Play, Plus, RotateCcw, Sparkles, Users } from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import BrandWait from "@/components/brand/BrandWait";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Prize = {
  id: string;
  pointsValue: number;
  quantity: number;
  remaining: number;
  segmentIndex: number;
};

type Cycle = {
  id: string;
  name: string | null;
  status: "draft" | "active" | "paused" | "exhausted";
  activatedAt: string | null;
  notes: string | null;
};

type Summary = {
  totalSpins: number;
  spinsRemaining: number;
  spinsUsed: number;
  totalPoints: number;
  pointsAwarded: number;
  pointsRemaining: number;
  liabilityGbp: number;
  exhausted: boolean;
};

type AdminState = {
  enabled: boolean;
  ipLimit: number;
  cycle: Cycle | null;
  prizes: Prize[];
  summary: Summary | null;
};

type HistoryRow = {
  id: string;
  pointsAwarded: number;
  spinDate: string;
  createdAt: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

const STATUS_PILL: Record<Cycle["status"], string> = {
  active: "rr-admin-pill rr-admin-pill--ok",
  paused: "rr-admin-pill rr-admin-pill--wait",
  draft: "rr-admin-pill",
  exhausted: "rr-admin-pill rr-admin-pill--bad",
};

function cleanError(error: any, fallback: string) {
  return String(error?.message || "").replace(/^\d+:\s*/, "") || fallback;
}

/** One prize tier. Quantity is editable while the cycle is not running. */
function PrizeRow({ prize, locked }: { prize: Prize; locked: boolean }) {
  const [quantity, setQuantity] = useState(String(prize.quantity));
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const awarded = prize.quantity - prize.remaining;

  // Keep the field in step when the cycle is reloaded or replaced.
  useEffect(() => setQuantity(String(prize.quantity)), [prize.quantity]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/admin/daily-spin/prizes/${prize.id}`, "PATCH", {
        quantity: Number(quantity),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/daily-spin"] });
      toast({ title: "Quantity updated", description: `${prize.pointsValue} points` });
    },
    onError: (error: any) =>
      toast({
        title: "Could not update the prize",
        description: cleanError(error, "Please check the quantity."),
        variant: "destructive",
      }),
  });

  const pct = prize.quantity > 0 ? Math.round((prize.remaining / prize.quantity) * 100) : 0;
  const changed = quantity !== String(prize.quantity);
  const invalid = !Number.isFinite(Number(quantity)) || Number(quantity) < awarded;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-4 py-3 last:border-b-0">
      <div className="w-20 shrink-0">
        <p className="rr-admin-kicker">Segment {prize.segmentIndex + 1}</p>
        <p className="font-prize text-xl text-[#F1D47A]">{prize.pointsValue}</p>
      </div>

      <div className="min-w-[140px] flex-1">
        <div className="flex items-center justify-between text-xs text-white/45">
          <span>
            {prize.remaining.toLocaleString()} left of {prize.quantity.toLocaleString()}
          </span>
          <span>{awarded.toLocaleString()} given out</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#C8102E] to-[#F1D47A]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-end gap-2">
        <div className="w-24">
          <Label className="text-xs" htmlFor={`qty-${prize.id}`}>
            Quantity
          </Label>
          <Input
            id={`qty-${prize.id}`}
            type="number"
            min={awarded}
            value={quantity}
            disabled={locked}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          disabled={locked || !changed || invalid || save.isPending}
          onClick={() => save.mutate()}
        >
          Save
        </Button>
      </div>

      {invalid && !locked && (
        <p className="w-full text-xs text-[#FF263D]">
          {awarded.toLocaleString()} have already gone out, so the quantity cannot go below that.
        </p>
      )}
    </div>
  );
}

/** The per-IP daily cap. Generous on purpose — see the server comment. */
function IpLimitPanel({ value }: { value: number }) {
  const [limit, setLimit] = useState(String(value));
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => setLimit(String(value)), [value]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/admin/daily-spin/settings", "POST", {
        ipLimit: Number(limit),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/daily-spin"] });
      toast({
        title: "Limit updated",
        description: Number(limit) === 0 ? "The per-connection limit is off." : `${limit} spins per connection per day.`,
      });
    },
    onError: (error: any) =>
      toast({ title: "Could not update the limit", description: cleanError(error, ""), variant: "destructive" }),
  });

  const n = Number(limit);
  const invalid = !Number.isInteger(n) || n < 0 || n > 1000;

  return (
    <div className="rr-admin-panel flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="max-w-xl">
        <p className="text-sm text-[#FFF8EE]">Spins per connection per day</p>
        <p className="mt-0.5 text-xs text-white/45">
          Blunts one person farming points across several accounts. Keep it generous — mobile networks put
          many unrelated customers on one address, so a low number turns real members away. Set 0 to switch
          the limit off.
        </p>
      </div>
      <div className="flex items-end gap-2">
        <div className="w-24">
          <Label className="text-xs" htmlFor="ip-limit">
            Limit
          </Label>
          <Input
            id="ip-limit"
            type="number"
            min={0}
            max={1000}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          disabled={invalid || limit === String(value) || save.isPending}
          onClick={() => save.mutate()}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" }) {
  return (
    <div className={`rr-admin-stat ${tone === "green" ? "rr-admin-stat--green" : tone === "red" ? "rr-admin-stat--red" : ""}`}>
      <p className="rr-admin-stat-label">{label}</p>
      <p className="rr-admin-stat-value">{value}</p>
    </div>
  );
}

export default function AdminDailySpin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);

  const { data, isLoading } = useQuery<AdminState>({
    queryKey: ["/api/admin/daily-spin"],
    refetchInterval: 30_000,
  });

  const { data: history } = useQuery<{ rows: HistoryRow[]; total: number }>({
    queryKey: ["/api/admin/daily-spin/history"],
    enabled: showHistory,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/daily-spin"] });

  const toggle = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("/api/admin/daily-spin/settings", "POST", { enabled });
      return res.json();
    },
    onSuccess: (result: any) => {
      refresh();
      toast({
        title: result?.enabled ? "Daily spin is live" : "Daily spin is off",
        description: result?.enabled
          ? "Members can take their free spin."
          : "The wheel is hidden from members.",
      });
    },
    onError: (error: any) =>
      toast({ title: "Could not change that", description: cleanError(error, ""), variant: "destructive" }),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest(`/api/admin/daily-spin/cycles/${id}/status`, "POST", { status });
      return res.json();
    },
    onSuccess: () => {
      refresh();
      toast({ title: "Cycle updated" });
    },
    onError: (error: any) =>
      toast({
        title: "Could not update the cycle",
        description: cleanError(error, "Please try again."),
        variant: "destructive",
      }),
  });

  const createCycle = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/admin/daily-spin/cycles", "POST", {});
      return res.json();
    },
    onSuccess: () => {
      refresh();
      toast({
        title: "New pool created",
        description: "It starts as a draft so you can adjust the quantities before going live.",
      });
    },
    onError: (error: any) =>
      toast({ title: "Could not create the pool", description: cleanError(error, ""), variant: "destructive" }),
  });

  const cycle = data?.cycle ?? null;
  const summary = data?.summary ?? null;
  const running = cycle?.status === "active";

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rr-admin-hero">
          <div className="relative z-10">
            <span className="rr-admin-kicker-pill">
              <Sparkles className="h-3 w-3" />
              Retention
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl">Free Daily Spin</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              One free spin per member per day, paying Ringtone Points from a fixed pool. The pool runs until
              its prizes are gone, then you create the next one. Members never see the quantities.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <BrandWait mode="embed" kicker="Admin" headline="Loading daily spin" />
          </div>
        ) : (
          <>
            {/* On/off, independent of the pool */}
            <div className="rr-admin-panel flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm text-[#FFF8EE]">Show the wheel to members</p>
                <p className="mt-0.5 text-xs text-white/45">
                  Turning this off hides the wheel immediately. The pool and its history are kept.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={data?.enabled ? "rr-admin-pill rr-admin-pill--ok" : "rr-admin-pill"}>
                  {data?.enabled ? "Live" : "Off"}
                </span>
                <Switch
                  checked={Boolean(data?.enabled)}
                  disabled={toggle.isPending}
                  onCheckedChange={(v) => toggle.mutate(v)}
                  aria-label="Show the daily spin to members"
                />
              </div>
            </div>

            <IpLimitPanel value={data?.ipLimit ?? 12} />

            {!cycle ? (
              <div className="rr-admin-panel p-8 text-center">
                <Gift className="mx-auto h-8 w-8 text-[#F1D47A]" />
                <p className="mt-3 text-sm text-white/60">No prize pool yet.</p>
                <p className="mx-auto mt-1 max-w-md text-xs text-white/40">
                  Creating one sets up the eight prize tiers. It starts as a draft, so you can change the
                  quantities before any member can spin.
                </p>
                <Button className="mt-5" disabled={createCycle.isPending} onClick={() => createCycle.mutate()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create the first pool
                </Button>
              </div>
            ) : (
              <>
                {summary && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Spins left" value={summary.spinsRemaining.toLocaleString()} tone="green" />
                    <Stat label="Spins used" value={summary.spinsUsed.toLocaleString()} />
                    <Stat label="Points given out" value={summary.pointsAwarded.toLocaleString()} />
                    <Stat
                      label="Remaining liability"
                      value={`£${summary.liabilityGbp.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      tone="red"
                    />
                  </div>
                )}

                <div className="rr-admin-panel">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 p-4">
                    <div className="min-w-0">
                      <p className="rr-admin-kicker">Current pool</p>
                      <h2 className="mt-1 truncate text-base text-[#FFF8EE]">{cycle.name || "Untitled pool"}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={STATUS_PILL[cycle.status]}>{cycle.status}</span>
                      {cycle.status !== "exhausted" &&
                        (running ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: cycle.id, status: "paused" })}
                          >
                            <Pause className="mr-1.5 h-3.5 w-3.5" />
                            Pause
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={setStatus.isPending}
                            onClick={() => setStatus.mutate({ id: cycle.id, status: "active" })}
                          >
                            <Play className="mr-1.5 h-3.5 w-3.5" />
                            {cycle.status === "draft" ? "Start this pool" : "Resume"}
                          </Button>
                        ))}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={createCycle.isPending}
                        onClick={() => createCycle.mutate()}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        New pool
                      </Button>
                    </div>
                  </div>

                  {running && (
                    <p className="border-b border-white/5 px-4 py-2 text-xs text-white/40">
                      Pause the pool to change quantities — members are spinning against it right now.
                    </p>
                  )}

                  {(data?.prizes || []).map((prize) => (
                    <PrizeRow key={prize.id} prize={prize} locked={running} />
                  ))}
                </div>
              </>
            )}

            <div className="rr-admin-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#FFF8EE]">Spin history</p>
                  <p className="mt-0.5 text-xs text-white/45">Every spin: member, prize and time.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowHistory((v) => !v)}>
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  {showHistory ? "Hide" : "Show"}
                </Button>
              </div>

              {showHistory && (
                <div className="mt-4 overflow-x-auto">
                  {!history ? (
                    <p className="py-6 text-center text-sm text-white/40">Loading…</p>
                  ) : history.rows.length === 0 ? (
                    <p className="py-6 text-center text-sm text-white/40">No spins yet.</p>
                  ) : (
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="text-xs uppercase tracking-widest text-white/35">
                        <tr>
                          <th className="pb-2 pr-3 font-normal">Member</th>
                          <th className="pb-2 pr-3 font-normal">Prize</th>
                          <th className="pb-2 pr-3 font-normal">Spin day</th>
                          <th className="pb-2 font-normal">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.rows.map((row) => (
                          <tr key={row.id} className="border-t border-white/5">
                            <td className="py-2 pr-3">
                              <span className="text-[#FFF8EE]">
                                {[row.firstName, row.lastName].filter(Boolean).join(" ") || "Member"}
                              </span>
                              <span className="block text-xs text-white/35">{row.email}</span>
                            </td>
                            <td className="py-2 pr-3 font-prize text-[#F1D47A]">{row.pointsAwarded} pts</td>
                            <td className="py-2 pr-3 text-white/55">{row.spinDate}</td>
                            <td className="py-2 text-white/40">
                              {new Date(row.createdAt).toLocaleString("en-GB")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {history && history.total > history.rows.length && (
                    <p className="mt-3 text-center text-xs text-white/35">
                      Showing {history.rows.length} of {history.total.toLocaleString()} spins.
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
