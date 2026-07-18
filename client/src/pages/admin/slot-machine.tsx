import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Coins, TrendingUp, Activity, CheckCircle, XCircle,
  Save, RotateCcw, Trophy, Percent, Plus, Trash2, AlertCircle, Image,
} from "lucide-react";

interface SlotConfig {
  isVisible: boolean;
  isActive: boolean;
  creditsPerSpin: number;
  pricePerSpin: string;
}

interface SlotPrize {
  id: string;
  symbol: string;
  image?: string;
  pay: number;
  isEuro: boolean;
  maxWins: number | null;
  enabled: boolean;
  probability: number;
}

interface SlotStats {
  totalSpins: number;
  totalWins: number;
  totalCoinsWon: number;
  totalCoinsSpent: number;
  winsPerPrize: Record<string, number>;
  recentSpins: Array<{
    id: string;
    isWin: boolean;
    coinsWon: number;
    coinsSpent: number;
    spinNumber: number;
    usedAt: string;
  }>;
}

function EditableCell({
  value, onChange, type = "number", prefix, suffix, className = "", testId,
}: {
  value: number | null; onChange: (v: number | null) => void;
  type?: string; prefix?: string; suffix?: string; className?: string; testId?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) { setDraft(value?.toString() ?? ""); setTimeout(() => inputRef.current?.select(), 0); }
  }, [editing, value]);

  const commit = () => {
    const parsed = draft === "" ? null : parseFloat(draft);
    onChange(isNaN(parsed as number) ? null : parsed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input ref={inputRef} type="number" value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className="w-24 px-2 py-1 text-sm rounded bg-zinc-700 border border-yellow-500 text-white outline-none"
        data-testid={testId}
      />
    );
  }

  return (
    <button onClick={() => setEditing(true)}
      className={`group flex items-center gap-0.5 text-sm font-bold rounded px-1 py-0.5 hover:bg-zinc-700/50 transition-colors cursor-text ${className}`}
      data-testid={testId} title="Click to edit">
      {prefix && <span className="opacity-60">{prefix}</span>}
      <span>{value === null ? "∞" : value.toLocaleString()}</span>
      {suffix && <span className="opacity-60">{suffix}</span>}
    </button>
  );
}

function EditableText({
  value, onChange, placeholder = "Edit…", className = "", testId,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; className?: string; testId?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) { setDraft(value); setTimeout(() => inputRef.current?.select(), 0); } }, [editing, value]);

  const commit = () => { onChange(draft); setEditing(false); };

  if (editing) {
    return (
      <input ref={inputRef} type="text" value={draft} placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className="w-32 px-2 py-1 text-sm rounded bg-zinc-700 border border-yellow-500 text-white outline-none"
        data-testid={testId}
      />
    );
  }

  return (
    <button onClick={() => setEditing(true)}
      className={`flex items-center gap-0.5 text-sm font-bold rounded px-1 py-0.5 hover:bg-zinc-700/50 transition-colors cursor-text text-left ${className}`}
      data-testid={testId} title="Click to edit">
      {value || <span className="text-gray-500 italic">{placeholder}</span>}
    </button>
  );
}

function generateId() {
  return `prize_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const BLANK_PRIZE = (): SlotPrize => ({
  id: generateId(),
  symbol: "New Prize",
  image: "",
  pay: 1,
  isEuro: true,
  maxWins: null,
  enabled: true,
  probability: 0,
});

export default function AdminSlotMachine() {
  const { toast } = useToast();

  const { data: config, isLoading: configLoading } = useQuery<SlotConfig>({
    queryKey: ["/api/slot-config"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<SlotStats>({
    queryKey: ["/api/admin/slot-stats"],
    refetchInterval: 15000,
    retry: false,
  });

  const { data: prizesData, isLoading: prizesLoading } = useQuery<SlotPrize[]>({
    queryKey: ["/api/slot-prizes"],
    refetchInterval: 30000,
  });

  const [form, setForm] = useState<Partial<SlotConfig>>({});
  const [prizes, setPrizes] = useState<SlotPrize[]>([]);
  const [prizesChanged, setPrizesChanged] = useState(false);

  useEffect(() => {
    if (prizesData) { setPrizes(prizesData); setPrizesChanged(false); }
  }, [prizesData]);

  const effective = { ...config, ...form } as SlotConfig;

  const saveConfigMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/slot-config", "PUT", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slot-config"] });
      setForm({});
      toast({ title: "✓ Saved", description: "Game settings updated." });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message || "Failed to save settings.", variant: "destructive" }),
  });

  const savePrizesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/admin/slot-prizes", "PUT", { prizes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slot-prizes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/slot-stats"] });
      setPrizesChanged(false);
      toast({ title: "✓ Prizes Saved", description: "Prize configuration updated." });
    },
    onError: (err: any) => toast({ title: "Failed to save prizes", description: err?.message || "Please try again.", variant: "destructive" }),
  });

  const updatePrize = (id: string, field: keyof SlotPrize, value: any) => {
    setPrizes((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    setPrizesChanged(true);
  };

  const addPrize = (isEuro: boolean) => {
    const blank = BLANK_PRIZE();
    blank.isEuro = isEuro;
    setPrizes((prev) => [...prev, blank]);
    setPrizesChanged(true);
  };

  const deletePrize = (id: string) => {
    setPrizes((prev) => prev.filter((p) => p.id !== id));
    setPrizesChanged(true);
  };

  const discardChanges = () => {
    if (prizesData) setPrizes(prizesData);
    setPrizesChanged(false);
  };

  const winRate = stats && stats.totalSpins > 0 ? ((stats.totalWins / stats.totalSpins) * 100).toFixed(1) : "0.0";
  const winsPerPrize = stats?.winsPerPrize || {};

  const cashPrizes = prizes.filter((p) => p.isEuro);
  const pointsPrizes = prizes.filter((p) => !p.isEuro);
  const activeCash = cashPrizes.filter((p) => p.enabled).length;
  const activePts = pointsPrizes.filter((p) => p.enabled).length;
  const totalProb = prizes.reduce((sum, p) => sum + Number(p.probability || 0), 0);
  const probWarning = totalProb > 100;
  const probOk = totalProb > 0 && totalProb <= 100;

  if (configLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading slot configuration…</div>
        </div>
      </AdminLayout>
    );
  }

  const PrizeTable = ({ rows, isCash }: { rows: SlotPrize[]; isCash: boolean }) => {
    const rowTotal = rows.reduce((sum, p) => sum + Number(p.probability || 0), 0);
    return (
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-800/70 border-b border-zinc-700">
              <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-widest text-gray-400 w-36">Title</th>
              <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-widest text-gray-400 w-36">Image URL</th>
              <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                {isCash ? "Payout (£)" : "Points Award"}
              </th>
              <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-widest text-gray-400 w-28">Probability %</th>
              <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-widest text-gray-400">Max Wins</th>
              <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-widest text-gray-400 w-20">On/Off</th>
              <th className="py-3 px-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((prize, i) => {
              const prob = Number(prize.probability || 0);
              const isDisabled = prob === 0;
              const winsUsed = winsPerPrize[prize.id] || 0;
              const maxReached = prize.maxWins !== null && winsUsed >= (prize.maxWins || 0);
              return (
                <tr key={prize.id}
                  className={`border-b border-zinc-800/40 transition-colors ${i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-800/20"} ${!prize.enabled ? "opacity-40" : ""}`}>
                  {/* Title */}
                  <td className="py-2 px-3">
                    <EditableText
                      value={prize.symbol}
                      onChange={(v) => updatePrize(prize.id, "symbol", v)}
                      placeholder="Prize name"
                      className="text-white"
                      testId={`cell-title-${prize.id}`}
                    />
                  </td>
                  {/* Image URL */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      {prize.image ? (
                        <img src={prize.image} alt={prize.symbol}
                          className="w-6 h-6 rounded object-cover border border-zinc-600"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <Image className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                      )}
                      <input
                        type="text"
                        value={prize.image || ""}
                        onChange={(e) => updatePrize(prize.id, "image", e.target.value)}
                        placeholder="https://…"
                        className="w-24 px-1.5 py-0.5 text-xs rounded bg-zinc-800 border border-zinc-700 text-gray-300 outline-none focus:border-yellow-500 truncate"
                        data-testid={`cell-image-${prize.id}`}
                      />
                    </div>
                  </td>
                  {/* Payout */}
                  <td className="py-2 px-3">
                    <EditableCell
                      value={prize.pay}
                      onChange={(v) => updatePrize(prize.id, "pay", v ?? 0)}
                      prefix={isCash ? "£" : undefined}
                      suffix={!isCash ? " pts" : undefined}
                      className={isCash ? "text-green-400" : "text-purple-400"}
                      testId={`cell-pay-${prize.id}`}
                    />
                  </td>
                  {/* Probability */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <EditableCell
                        value={prob}
                        onChange={(v) => updatePrize(prize.id, "probability", Math.max(0, Math.min(100, v ?? 0)))}
                        suffix="%"
                        className={isDisabled ? "text-red-400 line-through" : "text-yellow-400"}
                        testId={`cell-prob-${prize.id}`}
                      />
                      {isDisabled && <span className="text-xs text-red-400 font-bold">NEVER</span>}
                    </div>
                  </td>
                  {/* Max Wins + current count */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <EditableCell
                        value={prize.maxWins}
                        onChange={(v) => updatePrize(prize.id, "maxWins", v)}
                        className={maxReached ? "text-red-400" : "text-gray-300"}
                        testId={`cell-maxwins-${prize.id}`}
                      />
                      {prize.maxWins === null
                        ? <span className="text-xs text-gray-500">∞</span>
                        : <span className={`text-xs font-bold ${maxReached ? "text-red-400" : "text-gray-500"}`}>
                            ({winsUsed}/{prize.maxWins})
                          </span>
                      }
                      {maxReached && (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" title="Max wins reached — prize excluded from draws" />
                      )}
                    </div>
                  </td>
                  {/* Toggle */}
                  <td className="py-2 px-3">
                    <Switch
                      checked={prize.enabled}
                      onCheckedChange={(v) => updatePrize(prize.id, "enabled", v)}
                      data-testid={`switch-prize-${prize.id}`}
                    />
                  </td>
                  {/* Delete */}
                  <td className="py-2 px-3">
                    <button
                      onClick={() => deletePrize(prize.id)}
                      className="text-red-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-900/20"
                      title="Delete prize"
                      data-testid={`button-delete-${prize.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-800/50 border-t border-zinc-700">
              <td colSpan={3} className="py-2 px-3 text-xs text-gray-500 font-medium">Subtotal probability</td>
              <td className="py-2 px-3">
                <span className={`text-sm font-bold ${rowTotal > 100 ? "text-red-400" : rowTotal > 0 ? "text-yellow-400" : "text-gray-500"}`}>
                  {rowTotal.toFixed(2)}%
                </span>
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🎰 Slot Machine</h1>
            <p className="text-gray-400 text-sm mt-1">Configure prizes, probabilities, and monitor performance</p>
          </div>
          <Badge variant={effective.isActive ? "default" : "secondary"} className={effective.isActive ? "bg-green-600" : ""}>
            {effective.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Spins",  value: stats?.totalSpins ?? "—",                      icon: Activity,   color: "text-blue-400" },
            { label: "Total Wins",   value: stats?.totalWins ?? "—",                       icon: TrendingUp, color: "text-green-400" },
            { label: "Win Rate",     value: `${winRate}%`,                                 icon: Percent,    color: "text-yellow-400" },
            { label: "Credits Won",  value: stats?.totalCoinsWon?.toLocaleString() ?? "—", icon: Coins,      color: "text-purple-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`w-8 h-8 ${color}`} />
                <div>
                  <div className="text-xs text-gray-400">{label}</div>
                  <div className="text-xl font-bold text-white">{statsLoading ? "…" : value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Settings + Recent Spins */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Game Settings</CardTitle>
              <CardDescription>Control visibility, access, and credit values</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Visible on site</Label>
                  <p className="text-xs text-gray-400">Show the slot machine to players</p>
                </div>
                <Switch checked={effective.isVisible ?? true}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isVisible: v }))}
                  data-testid="switch-slot-visible" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Game active</Label>
                  <p className="text-xs text-gray-400">Allow players to spin</p>
                </div>
                <Switch checked={effective.isActive ?? true}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                  data-testid="switch-slot-active" />
              </div>
              <Separator className="border-zinc-700" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white font-medium">Credits per spin</Label>
                  <Input type="number" min={1} value={effective.creditsPerSpin ?? 20}
                    onChange={(e) => setForm((f) => ({ ...f, creditsPerSpin: parseInt(e.target.value) || 20 }))}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="input-slot-credits-per-spin" />
                  <p className="text-xs text-gray-500">Credits deducted per spin</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white font-medium">Price per spin (£)</Label>
                  <Input type="number" min={0.01} step={0.01} value={effective.pricePerSpin ?? "0.20"}
                    onChange={(e) => setForm((f) => ({ ...f, pricePerSpin: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    data-testid="input-slot-price-per-spin" />
                  <p className="text-xs text-gray-500">Real money cost</p>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button onClick={() => saveConfigMutation.mutate()}
                  disabled={saveConfigMutation.isPending || Object.keys(form).length === 0}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
                  data-testid="button-slot-save">
                  <Save className="w-4 h-4 mr-2" />
                  {saveConfigMutation.isPending ? "Saving…" : "Save Settings"}
                </Button>
                {Object.keys(form).length > 0 && (
                  <Button variant="outline" onClick={() => setForm({})} className="border-zinc-700 text-gray-300" data-testid="button-slot-reset">
                    <RotateCcw className="w-4 h-4 mr-2" /> Reset
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-white">Recent Spins</CardTitle>
                <CardDescription>Live — refreshes every 15 seconds</CardDescription>
              </div>
              {statsLoading && <span className="text-xs text-yellow-400 animate-pulse">Refreshing…</span>}
            </CardHeader>
            <CardContent>
              {!stats?.recentSpins?.length ? (
                <div className="text-gray-400 text-sm">No spins recorded yet.</div>
              ) : (
                <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                  {stats.recentSpins.map((spin) => (
                    <div key={spin.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/50">
                      <div className="flex items-center gap-2">
                        {spin.isWin ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                        <span className="text-sm text-gray-300">Spin #{spin.spinNumber}</span>
                      </div>
                      <div className="text-right">
                        {spin.isWin
                          ? <span className="text-green-400 text-sm font-medium">+{spin.coinsWon} credits</span>
                          : <span className="text-gray-500 text-sm">No win</span>
                        }
                        <div className="text-xs text-gray-500">
                          {new Date(spin.usedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Prize Management */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <CardTitle className="text-white">Prize Management</CardTitle>
            </div>
            <CardDescription>
              Click any value to edit inline. <strong className="text-white">Title</strong> and <strong className="text-white">Image URL</strong> are fully configurable.
              Win counts vs Max Wins shown as <code className="text-yellow-400">(used/cap)</code>. Red = prize capped out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {prizesLoading ? (
              <div className="text-gray-400 text-sm py-8 text-center">Loading prizes…</div>
            ) : (
              <>
                {/* Cash Prizes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-yellow-400 uppercase tracking-widest">💷 Cash Prizes</span>
                      <Badge className="bg-zinc-700 text-gray-300 text-xs">{activeCash} active</Badge>
                    </div>
                    <Button size="sm" variant="outline"
                      onClick={() => addPrize(true)}
                      className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-900/20 text-xs"
                      data-testid="button-add-cash-prize">
                      <Plus className="w-3 h-3 mr-1" /> Add Cash Prize
                    </Button>
                  </div>
                  <PrizeTable rows={cashPrizes} isCash={true} />
                </div>

                {/* Points Prizes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-purple-400 uppercase tracking-widest">🎯 Points Prizes</span>
                      <Badge className="bg-zinc-700 text-gray-300 text-xs">{activePts} active</Badge>
                    </div>
                    <Button size="sm" variant="outline"
                      onClick={() => addPrize(false)}
                      className="border-purple-600/50 text-purple-400 hover:bg-purple-900/20 text-xs"
                      data-testid="button-add-points-prize">
                      <Plus className="w-3 h-3 mr-1" /> Add Points Prize
                    </Button>
                  </div>
                  <PrizeTable rows={pointsPrizes} isCash={false} />
                </div>

                {/* Total probability */}
                <div className={`rounded-lg px-4 py-3 border flex items-center justify-between ${
                  probWarning ? "bg-red-900/20 border-red-700/50" : probOk ? "bg-zinc-800/50 border-zinc-700" : "bg-yellow-900/20 border-yellow-700/40"
                }`}>
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-bold text-white">Total Win Probability</span>
                    <span className="text-xs text-gray-400">(remainder = no win)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xl font-bold ${probWarning ? "text-red-400" : probOk ? "text-yellow-400" : "text-gray-500"}`}>
                      {totalProb.toFixed(2)}%
                    </span>
                    {probWarning && (
                      <span className="text-xs text-red-400 font-bold bg-red-900/40 px-2 py-1 rounded">⚠ Over 100%! Reduce probabilities.</span>
                    )}
                    {!probOk && !probWarning && (
                      <span className="text-xs text-yellow-500 font-bold bg-yellow-900/30 px-2 py-1 rounded">No prizes active — all spins lose</span>
                    )}
                    {probOk && (
                      <span className="text-xs text-green-400 font-medium">{(100 - totalProb).toFixed(2)}% no-win chance</span>
                    )}
                  </div>
                </div>

                {/* Save / Discard */}
                <div className="flex gap-3 pt-1">
                  <Button onClick={() => savePrizesMutation.mutate()}
                    disabled={savePrizesMutation.isPending || !prizesChanged}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
                    data-testid="button-save-prizes">
                    <Save className="w-4 h-4 mr-2" />
                    {savePrizesMutation.isPending ? "Saving…" : "Save Prizes"}
                  </Button>
                  {prizesChanged && (
                    <Button variant="outline" onClick={discardChanges}
                      className="border-zinc-700 text-gray-300"
                      data-testid="button-discard-prizes">
                      <RotateCcw className="w-4 h-4 mr-2" /> Discard Changes
                    </Button>
                  )}
                  {prizesChanged && (
                    <span className="self-center text-xs text-yellow-400 font-semibold animate-pulse">● Unsaved changes</span>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}