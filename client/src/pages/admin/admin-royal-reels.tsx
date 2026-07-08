import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, Save, Eye, EyeOff, Sparkles, AlertCircle, RotateCcw, Settings, Gift, Coins, Music, Crown, BarChart3, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RoyalPrize {
  id: string;
  prizeName: string;
  symbolKey: string;
  prizeValue: string;
  rewardType: "cash" | "points" | "no_win";
  weight: number;
  maxWins: number | null;
  quantityWon: number;
  isActive: boolean;
  displayOrder: number;
  currentWins?: number;
}

interface RoyalConfig {
  id: string;
  isVisible: boolean;
  isActive: boolean;
  replayChance: string;
}

interface RoyalStats {
  totalPlays: number;
  totalWins: number;
  totalReplays: number;
  totalRewards: number;
  totalCashPrizes: number;
  totalPointsPrizes: number;
  uniquePlayers: number;
}

const SYMBOLS = [
  "crown", "trophy", "diamond", "bar", "seven", "dice", "star",
  "orange", "cherry", "strawberry", "banana", "grape", "bell",
  "apple", "tomato", "coin", "points1000", "points500", "points100"
];

export default function AdminRoyalReelsSettings() {
  const { toast } = useToast();
  const [prizes, setPrizes] = useState<RoyalPrize[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [replayChance, setReplayChance] = useState("5.00");
  const [hasChanges, setHasChanges] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("prizes");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [prizeToDelete, setPrizeToDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{
    config: RoyalConfig;
    prizes: RoyalPrize[];
    stats: RoyalStats;
    recentOrders: any[];
  }>({
    queryKey: ["/api/admin/game-royal-config"],
    queryFn: async () => {
      const res = await apiRequest("/api/admin/game-royal-config", "GET");
      return res.json();
    },
  });

  useEffect(() => {
    if (data) {
      setPrizes(data.prizes || []);
      setIsVisible(data.config?.isVisible ?? true);
      setIsActive(data.config?.isActive ?? true);
      setReplayChance(data.config?.replayChance || "5.00");
      setHasChanges(false);
    }
  }, [data]);

  const updateConfigMutation = useMutation({
    mutationFn: async (config: { isVisible: boolean; isActive: boolean; replayChance: string }) => {
      return apiRequest("/api/admin/game-royal-config", "PUT", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-royal-config"] });
      toast({ title: "Saved!", description: "Royal Reels settings updated" });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePrizeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RoyalPrize> }) => {
      return apiRequest(`/api/admin/royal-prizes/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-royal-config"] });
      toast({ title: "Prize updated" });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createPrizeMutation = useMutation({
    mutationFn: async (data: Partial<RoyalPrize>) => {
      return apiRequest("/api/admin/royal-prizes", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-royal-config"] });
      toast({ title: "Prize created" });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePrizeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/royal-prizes/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-royal-config"] });
      toast({ title: "Prize deleted" });
      setDeleteConfirmOpen(false);
      setPrizeToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetWinsMutation = useMutation({
    mutationFn: async (clearHistory: boolean) => {
      return apiRequest("/api/admin/royal-prizes/reset-wins", "POST", { clearHistory });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-royal-config"] });
      toast({ title: "Win counts reset" });
      setResetConfirmOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveConfig = () => {
    const chance = parseFloat(replayChance);
    if (isNaN(chance) || chance < 0 || chance > 100) {
      toast({
        title: "Invalid Replay Chance",
        description: "Replay chance must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }
    updateConfigMutation.mutate({ isVisible, isActive, replayChance });
  };

  const addPrize = () => {
    const newPrize: RoyalPrize = {
      id: "",
      prizeName: "New Prize",
      symbolKey: "coin",
      prizeValue: "1.00",
      rewardType: "cash",
      weight: 10,
      maxWins: null,
      quantityWon: 0,
      isActive: true,
      displayOrder: prizes.length + 1,
    };
    setPrizes([...prizes, newPrize]);
    setHasChanges(true);
  };

  const updatePrize = (index: number, field: keyof RoyalPrize, value: any) => {
    const updatedPrizes = [...prizes];
    (updatedPrizes[index] as any)[field] = value;
    setPrizes(updatedPrizes);
    setHasChanges(true);
  };

  const removePrize = (index: number) => {
    const prize = prizes[index];
    if (prize.id) {
      setPrizeToDelete(prize.id);
      setDeleteConfirmOpen(true);
    } else {
      setPrizes(prizes.filter((_, i) => i !== index));
      setHasChanges(true);
    }
  };

  const savePrize = async (index: number) => {
    const prize = prizes[index];
    if (prize.id) {
      await updatePrizeMutation.mutateAsync({ id: prize.id, data: prize });
    } else {
      await createPrizeMutation.mutateAsync(prize);
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case "cash": return <Coins className="w-4 h-4 text-green-400" />;
      case "points": return <Music className="w-4 h-4 text-yellow-400" />;
      case "no_win": return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

  const getRewardTypeBadge = (type: string) => {
    switch (type) {
      case "cash": return <Badge className="bg-green-500/20 text-green-400">Cash</Badge>;
      case "points": return <Badge className="bg-yellow-500/20 text-yellow-400">Points</Badge>;
      case "no_win": return <Badge variant="secondary">No Win</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const totalWeight = prizes
    .filter(p => p.isActive !== false)
    .reduce((sum, p) => sum + (p.weight || 0), 0);

  const stats = data?.stats || {
    totalPlays: 0,
    totalWins: 0,
    totalReplays: 0,
    totalRewards: 0,
    totalCashPrizes: 0,
    totalPointsPrizes: 0,
    uniquePlayers: 0,
  };

  const winRate = stats.totalPlays > 0 ? ((stats.totalWins / stats.totalPlays) * 100).toFixed(1) : "0";

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Crown className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Royal Reels Settings</h1>
              <p className="text-sm text-muted-foreground">Manage prizes and configure your Royal Reels game</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="prizes" className="gap-2">
              <Gift className="w-4 h-4" /> Prizes
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" /> Settings
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Statistics
            </TabsTrigger>
          </TabsList>

          {/* PRIZES TAB */}
          <TabsContent value="prizes" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="w-5 h-5" /> Prize Tiers
                  </CardTitle>
                  <CardDescription>
                    Configure prizes, weights, and limits. Total weight: {totalWeight}
                  </CardDescription>
                </div>
                <Button onClick={addPrize} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Add Prize
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prizes.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground border rounded-lg">
                      No prizes configured. Click "Add Prize" to create one.
                    </div>
                  ) : (
                    prizes.map((prize, index) => (
                      <div key={prize.id || index} className={`border rounded-lg p-4 ${prize.isActive === false ? 'opacity-50 bg-muted/30' : ''}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {/* Prize Name */}
                          <div>
                            <Label className="text-xs">Prize Name</Label>
                            <Input
                              value={prize.prizeName}
                              onChange={(e) => updatePrize(index, "prizeName", e.target.value)}
                              className="h-8 text-sm mt-1"
                            />
                          </div>

                          {/* Symbol */}
                          <div>
                            <Label className="text-xs">Symbol</Label>
                            <Select
                              value={prize.symbolKey}
                              onValueChange={(val) => updatePrize(index, "symbolKey", val)}
                            >
                              <SelectTrigger className="h-8 text-sm mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SYMBOLS.map(sym => (
                                  <SelectItem key={sym} value={sym}>{sym}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Reward Type */}
                          <div>
                            <Label className="text-xs">Reward Type</Label>
                            <Select
                              value={prize.rewardType}
                              onValueChange={(val) => updatePrize(index, "rewardType", val)}
                            >
                              <SelectTrigger className="h-8 text-sm mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="points">Points</SelectItem>
                                <SelectItem value="no_win">No Win</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Prize Value */}
                          <div>
                            <Label className="text-xs">
                              {prize.rewardType === "cash" ? "Value (£)" : 
                               prize.rewardType === "points" ? "Points" : "Value"}
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={prize.prizeValue}
                              onChange={(e) => updatePrize(index, "prizeValue", e.target.value)}
                              disabled={prize.rewardType === "no_win"}
                              className="h-8 text-sm mt-1"
                            />
                          </div>

                          {/* Weight */}
                          <div>
                            <Label className="text-xs">Weight</Label>
                            <Input
                              type="number"
                              value={prize.weight}
                              onChange={(e) => updatePrize(index, "weight", parseInt(e.target.value) || 0)}
                              className="h-8 text-sm mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {totalWeight > 0 ? ((prize.weight / totalWeight) * 100).toFixed(1) : 0}% chance
                            </p>
                          </div>

                          {/* Max Wins */}
                          <div>
                            <Label className="text-xs">Max Wins</Label>
                            <Input
                              type="number"
                              value={prize.maxWins ?? ""}
                              onChange={(e) => updatePrize(index, "maxWins", e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="Unlimited"
                              className="h-8 text-sm mt-1"
                            />
                          </div>

                          {/* Won Count */}
                          <div>
                            <Label className="text-xs">Won So Far</Label>
                            <div className="h-8 flex items-center px-3 rounded-md border bg-muted/30 mt-1">
                              <span className="text-sm font-medium">{prize.quantityWon || 0}</span>
                              {prize.maxWins && (
                                <span className="text-xs text-muted-foreground ml-1">/ {prize.maxWins}</span>
                              )}
                            </div>
                          </div>

                          {/* Active Toggle & Actions */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={prize.isActive !== false}
                                onCheckedChange={(val) => updatePrize(index, "isActive", val)}
                              />
                              <span className="text-xs text-muted-foreground">
                                {prize.isActive !== false ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getRewardTypeBadge(prize.rewardType)}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => savePrize(index)}
                                disabled={updatePrizeMutation.isPending || createPrizeMutation.isPending}
                                className="h-8 w-8"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removePrize(index)}
                                className="h-8 w-8 text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-4">
            {/* Game Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Game Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isActive ? "bg-green-500/20" : "bg-muted"}`}>
                      <Crown className={`w-5 h-5 ${isActive ? "text-green-400" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium">Game Active</p>
                      <p className="text-sm text-muted-foreground">
                        {isActive ? "Players can play Royal Reels" : "Game is disabled"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(val) => { setIsActive(val); setHasChanges(true); }}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isVisible ? "bg-green-500/20" : "bg-muted"}`}>
                      {isVisible ? (
                        <Eye className="w-5 h-5 text-green-400" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Show on Site</p>
                      <p className="text-sm text-muted-foreground">
                        {isVisible ? "Game appears on the website" : "Hidden from users"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isVisible}
                    onCheckedChange={(val) => { setIsVisible(val); setHasChanges(true); }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Royal Replay Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" /> Royal Replay
                </CardTitle>
                <CardDescription>
                  Chance of getting a free replay after each game
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-sm">Replay Chance (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      value={replayChance}
                      onChange={(e) => {
                        setReplayChance(e.target.value);
                        setHasChanges(true);
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Current</p>
                    <p className="text-lg font-bold text-purple-400">{parseFloat(replayChance).toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reset Wins */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/30">
                    <div>
                      <p className="font-medium">Reset Win Counts</p>
                      <p className="text-sm text-muted-foreground">Set all prize win counters back to zero</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setResetConfirmOpen(true)}
                      disabled={resetWinsMutation.isPending}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATISTICS TAB */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-400">Total Plays</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalPlays}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Total Wins</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalWins}</p>
                  <p className="text-xs text-muted-foreground">{winRate}% win rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">Royal Replays</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalReplays}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-400">Total Rewards</span>
                  </div>
                  <p className="text-2xl font-bold">£{stats.totalRewards.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-500">Cash Prizes</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalCashPrizes}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Music className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-500">Points Prizes</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalPointsPrizes}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Settings className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-medium text-pink-400">Unique Players</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.uniquePlayers}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-background/95 backdrop-blur border-t border-border shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {hasChanges ? (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">Unsaved changes</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">All saved</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (data) {
                    setIsVisible(data.config?.isVisible ?? true);
                    setIsActive(data.config?.isActive ?? true);
                    setReplayChance(data.config?.replayChance || "5.00");
                    setHasChanges(false);
                  }
                }}
              >
                Discard
              </Button>
            )}
            <Button
              onClick={handleSaveConfig}
              disabled={updateConfigMutation.isPending || !hasChanges}
              className={hasChanges ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateConfigMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prize?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prize? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPrizeToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => prizeToDelete && deletePrizeMutation.mutate(prizeToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Win Counts?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all prize win counters to zero. Optionally, you can also clear win history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => resetWinsMutation.mutate(false)}
              disabled={resetWinsMutation.isPending}
            >
              Reset Counts Only
            </Button>
            <AlertDialogAction
              onClick={() => resetWinsMutation.mutate(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              Reset & Clear History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}