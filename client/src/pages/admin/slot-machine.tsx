import { useState, useEffect } from "react";
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
import { Coins, TrendingUp, Activity, CheckCircle, XCircle, Save, RotateCcw, Edit2, Trophy, Percent } from "lucide-react";

interface SlotConfig {
  isVisible: boolean;
  isActive: boolean;
  creditsPerSpin: number;
  pricePerSpin: string;
}

interface SlotPrize {
  id: string;
  symbol: string;
  pay: number;
  isEuro: boolean;
  maxWins: number | null;
  enabled: boolean;
}

interface SlotStats {
  totalSpins: number;
  totalWins: number;
  totalCoinsWon: number;
  totalCoinsSpent: number;
  recentSpins: Array<{ id: string; isWin: boolean; coinsWon: number; coinsSpent: number; spinNumber: number; usedAt: string }>;
}

const SYMBOL_EMOJI: Record<string, string> = {
  coin: "🪙", tomato: "🍅", apple: "🍎", bell: "🔔", grape: "🍇",
  banana: "🍌", cherry: "🍒", strawberry: "🍓", orange: "🍊",
  star: "⭐", dice: "🎲", seven: "7️⃣", bar: "📊", diamond: "💎",
  trophy: "🏆", crown: "👑", pts100: "🎯", pts500: "🎯", pts750: "🎯", pts1000: "🎯",
};

export default function AdminSlotMachine() {
  const { toast } = useToast();

  const { data: config, isLoading: configLoading } = useQuery<SlotConfig>({ queryKey: ["/api/slot-config"] });
  const { data: stats, isLoading: statsLoading } = useQuery<SlotStats>({ queryKey: ["/api/admin/slot-stats"] });
  const { data: prizesData, isLoading: prizesLoading } = useQuery<SlotPrize[]>({ queryKey: ["/api/slot-prizes"] });

  const [form, setForm] = useState<Partial<SlotConfig>>({});
  const [prizes, setPrizes] = useState<SlotPrize[]>([]);
  const [editingPrize, setEditingPrize] = useState<string | null>(null);
  const [prizeEdits, setPrizeEdits] = useState<Partial<SlotPrize>>({});
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
      toast({ title: "Saved", description: "Game settings updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" }),
  });

  const savePrizesMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/slot-prizes", "PUT", { prizes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slot-prizes"] });
      setPrizesChanged(false);
      toast({ title: "Prizes Saved", description: "Prize configuration updated successfully." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save prizes.", variant: "destructive" }),
  });

  const startEdit = (prize: SlotPrize) => {
    setEditingPrize(prize.id);
    setPrizeEdits({ pay: prize.pay, maxWins: prize.maxWins, enabled: prize.enabled });
  };

  const confirmEdit = (id: string) => {
    setPrizes(prev => prev.map(p => p.id === id ? { ...p, ...prizeEdits } : p));
    setEditingPrize(null);
    setPrizesChanged(true);
  };

  const cancelEdit = () => { setEditingPrize(null); setPrizeEdits({}); };

  const togglePrize = (id: string, enabled: boolean) => {
    setPrizes(prev => prev.map(p => p.id === id ? { ...p, enabled } : p));
    setPrizesChanged(true);
  };

  const winRate = stats && stats.totalSpins > 0 ? ((stats.totalWins / stats.totalSpins) * 100).toFixed(1) : "0.0";
  const cashPrizes = prizes.filter(p => p.isEuro && p.enabled);
  const pointsPrizes = prizes.filter(p => !p.isEuro && p.enabled);

  if (configLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading slot configuration...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🎰 Slot Machine</h1>
            <p className="text-gray-400 text-sm mt-1">Configure prizes, probabilities, and monitor performance</p>
          </div>
          <Badge variant={effective.isActive ? "default" : "secondary"} className={effective.isActive ? "bg-green-600" : ""}>
            {effective.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Spins", value: stats?.totalSpins ?? "—", icon: Activity, color: "text-blue-400" },
            { label: "Total Wins", value: stats?.totalWins ?? "—", icon: TrendingUp, color: "text-green-400" },
            { label: "Win Rate", value: `${winRate}%`, icon: Percent, color: "text-yellow-400" },
            { label: "Credits Won", value: stats?.totalCoinsWon?.toLocaleString() ?? "—", icon: Coins, color: "text-purple-400" },
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
                <Switch
                  checked={effective.isVisible ?? true}
                  onCheckedChange={(v) => setForm(f => ({ ...f, isVisible: v }))}
                  data-testid="switch-slot-visible"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Game active</Label>
                  <p className="text-xs text-gray-400">Allow players to spin</p>
                </div>
                <Switch
                  checked={effective.isActive ?? true}
                  onCheckedChange={(v) => setForm(f => ({ ...f, isActive: v }))}
                  data-testid="switch-slot-active"
                />
              </div>
              <Separator className="border-zinc-700" />
              <div className="space-y-2">
                <Label className="text-white font-medium">Credits per spin</Label>
                <p className="text-xs text-gray-400">Credits each spin costs inside the game</p>
                <Input
                  type="number" min={1}
                  value={effective.creditsPerSpin ?? 20}
                  onChange={(e) => setForm(f => ({ ...f, creditsPerSpin: parseInt(e.target.value) || 20 }))}
                  className="bg-zinc-800 border-zinc-700 text-white w-40"
                  data-testid="input-slot-credits-per-spin"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white font-medium">Price per spin (£)</Label>
                <p className="text-xs text-gray-400">Real money cost per spin</p>
                <Input
                  type="number" min={0.01} step={0.01}
                  value={effective.pricePerSpin ?? "0.20"}
                  onChange={(e) => setForm(f => ({ ...f, pricePerSpin: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white w-40"
                  data-testid="input-slot-price-per-spin"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => saveConfigMutation.mutate()}
                  disabled={saveConfigMutation.isPending || Object.keys(form).length === 0}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
                  data-testid="button-slot-save"
                >
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
            <CardHeader>
              <CardTitle className="text-white">Recent Spins</CardTitle>
              <CardDescription>Last 20 spin results across all players</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="text-gray-400 text-sm">Loading…</div>
              ) : !stats?.recentSpins?.length ? (
                <div className="text-gray-400 text-sm">No spins recorded yet.</div>
              ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {stats.recentSpins.map((spin) => (
                    <div key={spin.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/50">
                      <div className="flex items-center gap-2">
                        {spin.isWin
                          ? <CheckCircle className="w-4 h-4 text-green-400" />
                          : <XCircle className="w-4 h-4 text-red-400" />}
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Prize Management
                </CardTitle>
                <CardDescription>Set the payout amount for each winning symbol combination (3x match)</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {prizesChanged && (
                  <span className="text-xs text-yellow-400 font-medium">● Unsaved changes</span>
                )}
                <Button
                  onClick={() => savePrizesMutation.mutate()}
                  disabled={savePrizesMutation.isPending || !prizesChanged}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
                  data-testid="button-prizes-save"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savePrizesMutation.isPending ? "Saving…" : "Save Prizes"}
                </Button>
                {prizesChanged && (
                  <Button variant="outline" onClick={() => { setPrizes(prizesData || []); setPrizesChanged(false); }} className="border-zinc-700 text-gray-300">
                    <RotateCcw className="w-4 h-4 mr-2" /> Discard
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {prizesLoading ? (
              <div className="text-gray-400 text-sm py-8 text-center">Loading prizes…</div>
            ) : (
              <>
                {/* Cash prizes */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-yellow-400 uppercase tracking-widest">💷 Cash Prizes (3x Match)</span>
                    <span className="text-xs text-gray-500 bg-zinc-800 px-2 py-0.5 rounded">{cashPrizes.length} active</span>
                  </div>
                  <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-800/50">
                          <th className="text-left py-2.5 px-4 text-xs font-bold uppercase tracking-widest text-gray-400">Symbol</th>
                          <th className="text-left py-2.5 px-4 text-xs font-bold uppercase tracking-widest text-gray-400">Payout (£)</th>
                          <th className="text-left py-2.5 px-4 text-xs font-bold uppercase tracking-widest text-gray-400">Max Wins</th>
                          <th className="text-left py-2.5 px-4 text-xs font-bold uppercase tracking-widest text-gray-400">Enabled</th>
                          <th className="py-2.5 px-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {prizes.filter(p => p.isEuro).map((prize, i) => {
                          const isEditing = editingPrize === prize.id;
                          return (
                            <tr key={prize.id} className={`border-b border-zinc-800/50 ${i % 2 === 0 ? "" : "bg-zinc-800/20"} ${!prize.enabled ? "opacity-40" : ""}`}>
                              <td className="py-2.5 px-4 text-white font-medium">
                                <span className="mr-2">{SYMBOL_EMOJI[prize.id] || "🎰"}</span>
                                {prize.symbol}
                              </td>
                              <td className="py-2.5 px-4">
                                {isEditing ? (
                                  <Input
                                    type="number" min={0} step={0.01}
                                    value={prizeEdits.pay ?? prize.pay}
                                    onChange={(e) => setPrizeEdits(f => ({ ...f, pay: parseFloat(e.target.value) || 0 }))}
                                    className="bg-zinc-800 border-zinc-700 text-white w-28 h-8 text-sm"
                                    data-testid={`input-prize-pay-${prize.id}`}
                                  />
                                ) : (
                                  <span className="text-green-400 font-bold">£{prize.pay.toLocaleString()}</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4">
                                {isEditing ? (
                                  <Input
                                    type="number" min={0} placeholder="∞ unlimited"
                                    value={prizeEdits.maxWins ?? ""}
                                    onChange={(e) => setPrizeEdits(f => ({ ...f, maxWins: e.target.value ? parseInt(e.target.value) : null }))}
                                    className="bg-zinc-800 border-zinc-700 text-white w-28 h-8 text-sm"
                                    data-testid={`input-prize-maxwins-${prize.id}`}
                                  />
                                ) : (
                                  <span className="text-gray-400">{prize.maxWins ?? "∞ unlimited"}</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4">
                                <Switch
                                  checked={prize.enabled}
                                  onCheckedChange={(v) => togglePrize(prize.id, v)}
                                  data-testid={`switch-prize-${prize.id}`}
                                />
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                {isEditing ? (
                                  <div className="flex gap-2 justify-end">
                                    <Button size="sm" onClick={() => confirmEdit(prize.id)} className="h-7 bg-green-600 hover:bg-green-500 text-white text-xs">✓ Apply</Button>
                                    <Button size="sm" variant="outline" onClick={cancelEdit} className="h-7 border-zinc-700 text-gray-300 text-xs">Cancel</Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm" variant="ghost"
                                    onClick={() => startEdit(prize)}
                                    className="h-7 text-gray-400 hover:text-yellow-400"
                                    data-testid={`button-edit-prize-${prize.id}`}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Points prizes */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-purple-400 uppercase tracking-widest">🎯 Points Prizes (3x Match)</span>
                    <span className="text-xs text-gray-500 bg-zinc-800 px-2 py-0.5 rounded">{pointsPrizes.length} active</span>
                  </div>
                  <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-800/50">
                          <th className="text-left py-2.5 px-4 text-xs font-bold uppercase tracking-widest text-gray-400">Symbol</th>
                          <th className="text-left py-2.5 px-4 text-xs font-bold uppercase tracking-widest text-gray-400">Points Award</th>
                          <th className="text-left py-2.5 px-4 text-xs font-bold uppercase tracking-widest text-gray-400">Max Wins</th>
                          <th className="text-left py-2.5 px-4 text-xs font-bold uppercase tracking-widest text-gray-400">Enabled</th>
                          <th className="py-2.5 px-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {prizes.filter(p => !p.isEuro).map((prize, i) => {
                          const isEditing = editingPrize === prize.id;
                          return (
                            <tr key={prize.id} className={`border-b border-zinc-800/50 ${i % 2 === 0 ? "" : "bg-zinc-800/20"} ${!prize.enabled ? "opacity-40" : ""}`}>
                              <td className="py-2.5 px-4 text-white font-medium">
                                <span className="mr-2">{SYMBOL_EMOJI[prize.id] || "🎯"}</span>
                                {prize.symbol}
                              </td>
                              <td className="py-2.5 px-4">
                                {isEditing ? (
                                  <Input
                                    type="number" min={0}
                                    value={prizeEdits.pay ?? prize.pay}
                                    onChange={(e) => setPrizeEdits(f => ({ ...f, pay: parseInt(e.target.value) || 0 }))}
                                    className="bg-zinc-800 border-zinc-700 text-white w-28 h-8 text-sm"
                                    data-testid={`input-prize-pts-${prize.id}`}
                                  />
                                ) : (
                                  <span className="text-purple-400 font-bold">{prize.pay.toLocaleString()} pts</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4">
                                {isEditing ? (
                                  <Input
                                    type="number" min={0} placeholder="∞ unlimited"
                                    value={prizeEdits.maxWins ?? ""}
                                    onChange={(e) => setPrizeEdits(f => ({ ...f, maxWins: e.target.value ? parseInt(e.target.value) : null }))}
                                    className="bg-zinc-800 border-zinc-700 text-white w-28 h-8 text-sm"
                                    data-testid={`input-prize-pts-maxwins-${prize.id}`}
                                  />
                                ) : (
                                  <span className="text-gray-400">{prize.maxWins ?? "∞ unlimited"}</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4">
                                <Switch
                                  checked={prize.enabled}
                                  onCheckedChange={(v) => togglePrize(prize.id, v)}
                                  data-testid={`switch-prize-pts-${prize.id}`}
                                />
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                {isEditing ? (
                                  <div className="flex gap-2 justify-end">
                                    <Button size="sm" onClick={() => confirmEdit(prize.id)} className="h-7 bg-green-600 hover:bg-green-500 text-white text-xs">✓ Apply</Button>
                                    <Button size="sm" variant="outline" onClick={cancelEdit} className="h-7 border-zinc-700 text-gray-300 text-xs">Cancel</Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm" variant="ghost"
                                    onClick={() => startEdit(prize)}
                                    className="h-7 text-gray-400 hover:text-yellow-400"
                                    data-testid={`button-edit-pts-prize-${prize.id}`}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  * Prize amounts are the payout for a 3-symbol match on any active payline. Changes apply to new spins after saving.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Live Preview</CardTitle>
            <CardDescription>The slot machine game as players see it (demo mode)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-zinc-700" style={{ height: 480 }}>
              <iframe
                src="/slotmachine/index.html?credits=1000"
                className="w-full h-full border-0"
                title="Slot Machine Preview"
                data-testid="iframe-slot-preview"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}