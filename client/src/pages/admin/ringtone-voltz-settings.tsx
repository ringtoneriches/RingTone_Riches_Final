import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, Save, Eye, EyeOff, RotateCcw, Settings, Gift, Coins, Music, Repeat, Zap, Pencil, Check, X, Trophy, TrendingUp, Shield, Target, AlertCircle } from "lucide-react";
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

interface VoltzPrize {
  id: string;
  prizeName: string;
  prizeValue: string;
  rewardType: "cash" | "points" | "try_again" | "no_win";
  weight: number;
  maxWins: number | null;
  quantityWon: number;
  isActive: boolean;
  displayOrder: number;
}

interface VoltzConfig {
  id: string;
  isVisible: boolean;
  isActive: boolean;
  winProbability: string;
  freeReplayProbability: string;
  prizes: VoltzPrize[];
}

export default function AdminRingtoneVoltzSettings() {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [winProbability, setWinProbability] = useState("10.00");
  const [freeReplayProbability, setFreeReplayProbability] = useState("5.00");
  const [hasConfigChanges, setHasConfigChanges] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("prizes");
  const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<VoltzPrize>>({});
  const [newPrize, setNewPrize] = useState({
    prizeName: "",
    prizeValue: "",
    rewardType: "cash" as "cash" | "points" | "try_again" | "no_win",
    weight: 10,
    maxWins: null as number | null,
    displayOrder: 0,
  });

  const { data: config, isLoading } = useQuery<VoltzConfig>({
    queryKey: ["/api/admin/voltz-config"],
    queryFn: async () => {
      const res = await apiRequest("/api/admin/voltz-config", "GET");
      return res.json();
    },
  });

  const { data: prizes = [], isLoading: prizesLoading } = useQuery<VoltzPrize[]>({
    queryKey: ["/api/admin/voltz-prizes"],
    queryFn: async () => {
      const res = await apiRequest("/api/admin/voltz-prizes", "GET");
      return res.json();
    },
  });

  useEffect(() => {
    if (config) {
      setIsVisible(config.isVisible ?? true);
      setIsActive(config.isActive ?? true);
      setWinProbability(config.winProbability || "10.00");
      setFreeReplayProbability(config.freeReplayProbability || "5.00");
      setHasConfigChanges(false);
    }
  }, [config]);

  const updateConfigMutation = useMutation({
    mutationFn: async (data: { isVisible: boolean; isActive: boolean; winProbability: string; freeReplayProbability: string }) => {
      return apiRequest("/api/admin/voltz-config", "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/voltz-config"] });
      toast({ title: "Saved!", description: "Configuration updated successfully" });
      setHasConfigChanges(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createPrizeMutation = useMutation({
    mutationFn: async (data: typeof newPrize) => {
      return apiRequest("/api/admin/voltz-prizes", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/voltz-prizes"] });
      toast({ title: "Prize Created", description: "New prize added successfully" });
      setNewPrize({ prizeName: "", prizeValue: "", rewardType: "cash", weight: 10, maxWins: null, displayOrder: prizes.length });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePrizeMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; prizeName?: string; prizeValue?: string; rewardType?: string; weight?: number; maxWins?: number | null; isActive?: boolean; displayOrder?: number }) => {
      return apiRequest(`/api/admin/voltz-prizes/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/voltz-prizes"] });
      toast({ title: "Updated", description: "Prize updated successfully" });
      setEditingPrizeId(null);
      setEditForm({});
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const togglePrizeMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest(`/api/admin/voltz-prizes/${id}`, "PUT", { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/voltz-prizes"] });
      toast({ title: "Updated", description: "Prize status changed" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePrizeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/voltz-prizes/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/voltz-prizes"] });
      toast({ title: "Deleted", description: "Prize removed successfully" });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetWinsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/admin/game-voltz-reset-wins", "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/voltz-prizes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/voltz-config"] });
      toast({ title: "Success", description: "All win counts have been reset" });
      setResetConfirmOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Update the handleSaveConfig function with better error logging
const handleSaveConfig = async () => {
  setIsSavingConfig(true);
  try {
    console.log("Saving config:", { isVisible, isActive, winProbability, freeReplayProbability });
    
    const res = await fetch("/api/admin/voltz-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible, isActive, winProbability, freeReplayProbability }),
      credentials: "include",
    });
    
    const responseText = await res.text();
    console.log("Config save response:", responseText);
    
    if (!res.ok) {
      throw new Error(responseText || "Failed to save config");
    }
    
    queryClient.invalidateQueries({ queryKey: ["/api/admin/voltz-config"] });
    setHasConfigChanges(false);
    toast({ title: "Saved!", description: "Configuration updated successfully" });
  } catch (err: any) {
    console.error("Config save error:", err);
    toast({ title: "Error", description: err.message || "Failed to save config", variant: "destructive" });
  } finally {
    setIsSavingConfig(false);
  }
};

  const handleCreatePrize = () => {
    if (!newPrize.prizeName.trim()) {
      toast({ title: "Validation Error", description: "Prize name is required", variant: "destructive" });
      return;
    }
    if (newPrize.rewardType !== "try_again" && newPrize.rewardType !== "no_win" && (!newPrize.prizeValue || parseFloat(newPrize.prizeValue) <= 0)) {
      toast({ title: "Validation Error", description: "Prize value must be greater than 0", variant: "destructive" });
      return;
    }
    createPrizeMutation.mutate({
      ...newPrize,
      prizeValue: (newPrize.rewardType === "try_again" || newPrize.rewardType === "no_win") ? "0" : newPrize.prizeValue,
      displayOrder: prizes.length,
    });
  };

  const startEditing = (prize: VoltzPrize) => {
    setEditingPrizeId(prize.id);
    setEditForm({
      prizeName: prize.prizeName,
      prizeValue: prize.prizeValue,
      rewardType: prize.rewardType,
      weight: prize.weight,
      maxWins: prize.maxWins,
    });
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveEdit = async (prizeId?: string) => {
    const targetId = prizeId || editingPrizeId;
    if (!targetId) {
      toast({ title: "Error", description: "No prize selected for editing", variant: "destructive" });
      return;
    }
    const name = String(editForm.prizeName || "").trim();
    if (!name) {
      toast({ title: "Validation Error", description: "Prize name is required", variant: "destructive" });
      return;
    }
    const type = editForm.rewardType || "cash";
    const rawValue = editForm.prizeValue;
    const numValue = Number(rawValue);
    if (type !== "try_again" && type !== "no_win" && (isNaN(numValue) || numValue <= 0)) {
      toast({ title: "Validation Error", description: "Prize value must be greater than 0", variant: "destructive" });
      return;
    }
    const body = {
      prizeName: name,
      prizeValue: (type === "try_again" || type === "no_win") ? "0" : String(rawValue),
      rewardType: type,
      weight: Number(editForm.weight) || 1,
      maxWins: editForm.maxWins !== undefined && editForm.maxWins !== null ? Number(editForm.maxWins) : null,
    };
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/voltz-prizes/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to update prize");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/voltz-prizes"] });
      toast({ title: "Updated", description: "Prize updated successfully" });
      setEditingPrizeId(null);
      setEditForm({});
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update prize", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingPrizeId(null);
    setEditForm({});
  };

  const totalWeight = prizes.filter(p => p.isActive).reduce((sum, p) => sum + p.weight, 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "cash": return <Coins className="w-4 h-4" />;
      case "points": return <Trophy className="w-4 h-4" />;
      case "try_again": return <Repeat className="w-4 h-4" />;
      case "no_win": return <X className="w-4 h-4" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

  const getTypeGradient = (type: string) => {
    switch (type) {
      case "cash": return "from-emerald-500/20 via-emerald-600/10 to-transparent border-emerald-500/40";
      case "points": return "from-amber-500/20 via-amber-600/10 to-transparent border-amber-500/40";
      case "try_again": return "from-cyan-500/20 via-cyan-600/10 to-transparent border-cyan-500/40";
      case "no_win": return "from-red-500/20 via-red-600/10 to-transparent border-red-500/40";
      default: return "from-gray-500/20 via-gray-600/10 to-transparent border-border";
    }
  };

  const getTypeAccent = (type: string) => {
    switch (type) {
      case "cash": return { text: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30", dot: "bg-emerald-400" };
      case "points": return { text: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30", dot: "bg-amber-400" };
      case "try_again": return { text: "text-cyan-400", bg: "bg-cyan-500/20", border: "border-cyan-500/30", dot: "bg-cyan-400" };
      case "no_win": return { text: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30", dot: "bg-red-400" };
      default: return { text: "text-gray-400", bg: "bg-gray-500/20", border: "border-gray-500/30", dot: "bg-gray-400" };
    }
  };

  const getTypeBadge = (type: string) => {
    const accent = getTypeAccent(type);
    const label = type === "cash" ? "Cash" : type === "points" ? "Points" : type === "no_win" ? "No Win" : "Free Play";
    return (
      <Badge className={`${accent.bg} ${accent.text} ${accent.border} gap-1.5 font-semibold`}>
        {getTypeIcon(type)} {label}
      </Badge>
    );
  };

  const activePrizes = prizes.filter(p => p.isActive);
  const cashPrizes = activePrizes.filter(p => p.rewardType === "cash");
  const pointsPrizes = activePrizes.filter(p => p.rewardType === "points");
  const freePlayPrizes = activePrizes.filter(p => p.rewardType === "try_again");
  const totalWon = prizes.reduce((s, p) => s + (p.quantityWon || 0), 0);

  if (isLoading || prizesLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Loading Voltz settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const hasAnyChanges = hasConfigChanges || editingPrizeId !== null;

  const handleSaveAll = async () => {
    if (editingPrizeId) {
      await saveEdit(editingPrizeId);
    }
    if (hasConfigChanges) {
      await handleSaveConfig();
    }
    if (!editingPrizeId && !hasConfigChanges) {
      toast({ title: "No Changes", description: "Nothing to save", variant: "default" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="sticky top-0 z-50 -mx-4 px-4 sm:-mx-6 sm:px-6 -mt-4 pt-4 pb-3" style={{ background: 'linear-gradient(180deg, rgba(13,13,18,0.98) 0%, rgba(13,13,18,0.95) 80%, rgba(13,13,18,0) 100%)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-[#0d0d12] to-amber-500/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/30 to-amber-600/10 border border-amber-500/30">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent" data-testid="text-page-title">
                  Ringtone Voltz
                </h1>
                <p className="text-xs text-muted-foreground">Configure prizes & settings</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 ml-3">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActive ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                  {isActive ? "Active" : "Inactive"}
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isVisible ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" : "bg-gray-500/15 text-gray-400 border border-gray-500/30"}`}>
                  {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {isVisible ? "Visible" : "Hidden"}
                </div>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving || isSavingConfig || !hasAnyChanges}
              className={`px-5 h-10 font-bold rounded-lg transition-all duration-300 ${hasAnyChanges ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/25" : "bg-muted text-muted-foreground"}`}
              data-testid="button-save-all"
            >
              {isSaving || isSavingConfig ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                  {hasAnyChanges && <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />}
                </div>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="relative overflow-hidden rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400/80 font-medium">Total Prizes</span>
            </div>
            <p className="text-2xl font-bold text-amber-300" data-testid="text-total-prizes">{prizes.length}</p>
            <p className="text-xs text-muted-foreground">{activePrizes.length} active</p>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400/80 font-medium">Total Weight</span>
            </div>
            <p className="text-2xl font-bold text-emerald-300" data-testid="text-total-weight">{totalWeight}</p>
            <p className="text-xs text-muted-foreground">distribution pool</p>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-3">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-cyan-400/80 font-medium">Total Won</span>
            </div>
            <p className="text-2xl font-bold text-cyan-300" data-testid="text-total-won">{totalWon}</p>
            <p className="text-xs text-muted-foreground">prizes claimed</p>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400/80 font-medium">Win Rate</span>
            </div>
            <p className="text-2xl font-bold text-purple-300" data-testid="text-win-rate">{winProbability}%</p>
            <p className="text-xs text-muted-foreground">probability</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full max-w-md bg-[#0d0d12] border border-border/50">
            <TabsTrigger value="prizes" className="gap-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300" data-testid="tab-prizes">
              <Gift className="w-4 h-4" /> Prizes ({prizes.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300" data-testid="tab-settings">
              <Settings className="w-4 h-4" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prizes" className="space-y-4">
            <Card className="border-dashed border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20">
                    <Plus className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-amber-300">Add New Prize</CardTitle>
                    <CardDescription>Create a new prize for the Voltz game</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="lg:col-span-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">Prize Name</Label>
                   <Input
                    value={newPrize.prizeName}
                    onChange={(e) =>
                        setNewPrize({ ...newPrize, prizeName: e.target.value })
                    }
                    placeholder="e.g. £5 Cash"
                    className="h-9 bg-zinc-900 text-white border-zinc-700 placeholder:text-zinc-400 focus:border-amber-500"
                    data-testid="input-new-prize-name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Reward Type</Label>
                    <Select
                      value={newPrize.rewardType}
                      onValueChange={(val: "cash" | "points" | "try_again" | "no_win") => setNewPrize({ ...newPrize, rewardType: val, prizeValue: (val === "try_again" || val === "no_win") ? "0" : newPrize.prizeValue })}
                    >
                      <SelectTrigger className="h-9 bg-background/50 border-border/50" data-testid="select-new-reward-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="points">Points</SelectItem>
                        <SelectItem value="try_again">Free Replay</SelectItem>
                        <SelectItem value="no_win">No Win</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">{newPrize.rewardType === "cash" ? "£ Amount" : newPrize.rewardType === "points" ? "Points" : "Value"}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={(newPrize.rewardType === "try_again" || newPrize.rewardType === "no_win") ? "" : newPrize.prizeValue}
                      onChange={(e) => setNewPrize({ ...newPrize, prizeValue: e.target.value })}
                      disabled={newPrize.rewardType === "try_again" || newPrize.rewardType === "no_win"}
                      placeholder={(newPrize.rewardType === "try_again" || newPrize.rewardType === "no_win") ? "-" : "0.00"}
                      className="h-9 bg-zinc-900 text-white border-zinc-700 placeholder:text-zinc-400 focus:border-amber-500"
                      data-testid="input-new-prize-value"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Weight</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newPrize.weight}
                      onChange={(e) => setNewPrize({ ...newPrize, weight: parseInt(e.target.value) || 1 })}
                      className="h-9 bg-zinc-900 text-white border-zinc-700 placeholder:text-zinc-400 focus:border-amber-500"
                      data-testid="input-new-weight"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Max Wins</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={newPrize.maxWins ?? ""}
                        onChange={(e) => setNewPrize({ ...newPrize, maxWins: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="∞"
                        className="h-9 bg-zinc-900 text-white border-zinc-700 placeholder:text-zinc-400 focus:border-amber-500"
                        data-testid="input-new-max-wins"
                      />
                      <Button onClick={handleCreatePrize} disabled={createPrizeMutation.isPending} className="h-9 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-500/20" data-testid="button-add-prize">
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="pb-4">
              {prizes.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-border/50 rounded-xl" data-testid="text-no-prizes">
                  <Gift className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No prizes configured yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Use the form above to add your first prize</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {prizes.map((prize, index) => {
                    const accent = getTypeAccent(prize.rewardType);
                    const isEditing = editingPrizeId === prize.id;
                    const winPercent = totalWeight > 0 ? ((prize.weight / totalWeight) * 100).toFixed(1) : "0.0";
                    const maxReached = prize.maxWins !== null && (prize.quantityWon || 0) >= prize.maxWins;

                    return (
                      <div
                        key={prize.id}
                        className={`relative rounded-xl border bg-gradient-to-br ${getTypeGradient(prize.rewardType)} transition-all duration-200 ${!prize.isActive ? "opacity-40 grayscale" : "hover:shadow-lg hover:shadow-black/20"} ${isEditing ? "ring-2 ring-amber-500/50" : "overflow-hidden"}`}
                        data-testid={`card-prize-${prize.id}`}
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/[0.03] to-transparent" />

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              {getTypeBadge(prize.rewardType)}
                              <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); saveEdit(prize.id); }}
                                    disabled={isSaving}
                                    className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 z-90"
                                    data-testid={`button-save-edit-${prize.id}`}
                                  >
                                    {isSaving ? <div className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5 z-90" />}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={cancelEdit}
                                    className="h-7 w-7 text-muted-foreground hover:text-white hover:bg-muted/50 z-90"
                                    data-testid={`button-cancel-edit-${prize.id}`}
                                  >
                                    <X className="w-3.5 h-3.5 z-90" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => startEditing(prize)}
                                    className="h-7 w-7 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
                                    data-testid={`button-edit-${prize.id}`}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => togglePrizeMutation.mutate({ id: prize.id, isActive: !prize.isActive })}
                                    className="h-7 w-7 z-90"
                                    data-testid={`button-toggle-${prize.id}`}
                                  >
                                    {prize.isActive ? <Eye className="w-3.5 h-3.5 text-emerald-400 z-90" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground z-90" />}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setDeleteConfirmId(prize.id)}
                                    className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20 z-90"
                                    data-testid={`button-delete-${prize.id}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 z-90" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Prize Name</Label>
                                <Input
                                  value={editForm.prizeName ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, prizeName: e.target.value })}
                                  className="h-8 mt-1 text-foreground border-border/50 focus:border-amber-500/50"
                                  style={{ backgroundColor: 'var(--card)' }}
                                  data-testid={`input-edit-name-${prize.id}`}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Type</Label>
                                  <Select
                                    value={editForm.rewardType}
                                    onValueChange={(val: "cash" | "points" | "try_again" | "no_win") => setEditForm({ ...editForm, rewardType: val, prizeValue: (val === "try_again" || val === "no_win") ? "0" : editForm.prizeValue })}
                                  >
                                    <SelectTrigger className="h-8 mt-1 text-foreground border-border/50" style={{ backgroundColor: 'var(--card)' }} data-testid={`select-edit-type-${prize.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="cash">Cash</SelectItem>
                                      <SelectItem value="points">Points</SelectItem>
                                      <SelectItem value="try_again">Free Replay</SelectItem>
                                      <SelectItem value="no_win">No Win</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Value</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={(editForm.rewardType === "try_again" || editForm.rewardType === "no_win") ? "" : editForm.prizeValue ?? ""}
                                    onChange={(e) => setEditForm({ ...editForm, prizeValue: e.target.value })}
                                    disabled={editForm.rewardType === "try_again" || editForm.rewardType === "no_win"}
                                    placeholder={(editForm.rewardType === "try_again" || editForm.rewardType === "no_win") ? "-" : "0.00"}
                                    className="h-8 mt-1 text-foreground border-border/50 focus:border-amber-500/50"
                                    style={{ backgroundColor: 'var(--card)' }}
                                    data-testid={`input-edit-value-${prize.id}`}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Weight</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={editForm.weight ?? ""}
                                    onChange={(e) => setEditForm({ ...editForm, weight: parseInt(e.target.value) || 1 })}
                                    className="h-8 mt-1 text-foreground border-border/50 focus:border-amber-500/50"
                                    style={{ backgroundColor: 'var(--card)' }}
                                    data-testid={`input-edit-weight-${prize.id}`}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Max Wins</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={editForm.maxWins ?? ""}
                                    onChange={(e) => setEditForm({ ...editForm, maxWins: e.target.value ? parseInt(e.target.value) : null })}
                                    placeholder="∞"
                                    className="h-8 mt-1 text-foreground border-border/50 focus:border-amber-500/50"
                                    style={{ backgroundColor: 'var(--card)' }}
                                    data-testid={`input-edit-maxwins-${prize.id}`}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-bold text-base mb-3" data-testid={`text-prize-name-${prize.id}`}>{prize.prizeName}</h3>

                              <div className="grid grid-cols-3 gap-2 mb-3">
                                <div className="bg-black/20 rounded-lg p-2 text-center">
                                  <p className={`text-lg font-bold ${accent.text}`} data-testid={`text-prize-value-${prize.id}`}>
                                    {prize.rewardType === "try_again" ? "Free" : prize.rewardType === "no_win" ? "—" : prize.rewardType === "cash" ? `£${prize.prizeValue}` : prize.prizeValue}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Value</p>
                                </div>
                                <div className="bg-black/20 rounded-lg p-2 text-center">
                                  <p className="text-lg font-bold" data-testid={`text-weight-${prize.id}`}>{prize.weight}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{winPercent}%</p>
                                </div>
                                <div className="bg-black/20 rounded-lg p-2 text-center">
                                  <p className={`text-lg font-bold ${maxReached ? "text-red-400" : ""}`} data-testid={`text-wins-${prize.id}`}>
                                    {prize.quantityWon || 0}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">/ {prize.maxWins ?? "∞"}</p>
                                </div>
                              </div>

                              <div className="relative h-1.5 rounded-full bg-black/30 overflow-hidden">
                                <div
                                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${maxReached ? "bg-red-500" : prize.rewardType === "cash" ? "bg-emerald-500" : prize.rewardType === "points" ? "bg-amber-500" : "bg-cyan-500"}`}
                                  style={{ width: `${totalWeight > 0 ? Math.min((prize.weight / totalWeight) * 100, 100) : 0}%` }}
                                />
                              </div>
                              {!prize.isActive && (
                                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <EyeOff className="w-3 h-3" /> Inactive
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20"><Zap className="w-4 h-4 text-amber-400" /></div>
                  Game Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-500/5 to-transparent border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isActive ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-muted border border-border"}`}>
                      <Zap className={`w-5 h-5 ${isActive ? "text-amber-400" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-semibold">Game Active</p>
                      <p className="text-sm text-muted-foreground">{isActive ? "Players can play the game" : "Game is disabled"}</p>
                    </div>
                  </div>
                  <Switch checked={isActive} onCheckedChange={(val) => { setIsActive(val); setHasConfigChanges(true); }} data-testid="switch-active" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/5 to-transparent border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isVisible ? "bg-blue-500/20 border border-blue-500/30" : "bg-muted border border-border"}`}>
                      {isVisible ? <Eye className="w-5 h-5 text-blue-400" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-semibold">Show on Site</p>
                      <p className="text-sm text-muted-foreground">{isVisible ? "Game appears on the website" : "Hidden from users"}</p>
                    </div>
                  </div>
                  <Switch checked={isVisible} onCheckedChange={(val) => { setIsVisible(val); setHasConfigChanges(true); }} data-testid="switch-visible" />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/20">
                    <Label className="text-sm font-semibold mb-2 block">Win Probability (%)</Label>
                    <p className="text-xs text-muted-foreground mb-2">Chance of winning a prize each play</p>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={winProbability}
                      onChange={(e) => { setWinProbability(e.target.value); setHasConfigChanges(true); }}
                      className="h-9 bg-zinc-900 text-white border-zinc-700 placeholder:text-zinc-400 focus:border-amber-500"
                      data-testid="input-win-probability"
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/5 to-transparent border border-cyan-500/20">
                    <Label className="text-sm font-semibold mb-2 block">Free Replay Probability (%)</Label>
                    <p className="text-xs text-muted-foreground mb-2">Chance of getting a free replay</p>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={freeReplayProbability}
                      onChange={(e) => { setFreeReplayProbability(e.target.value); setHasConfigChanges(true); }}
                      className="h-9 bg-zinc-900 text-white border-zinc-700 placeholder:text-zinc-400 focus:border-amber-500"
                      data-testid="input-free-replay-probability"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20"><TrendingUp className="w-4 h-4 text-amber-400" /></div>
                  Prize Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-transparent p-4">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-full blur-xl" />
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-400">Cash</span>
                    </div>
                    <p className="text-3xl font-bold" data-testid="text-cash-count">{cashPrizes.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{totalWeight > 0 ? ((cashPrizes.reduce((s, p) => s + p.weight, 0) / totalWeight) * 100).toFixed(1) : "0.0"}% weight</p>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-transparent p-4">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-full blur-xl" />
                    <div className="flex items-center gap-2 mb-2">
                      <Music className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-400">Points</span>
                    </div>
                    <p className="text-3xl font-bold" data-testid="text-points-count">{pointsPrizes.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{totalWeight > 0 ? ((pointsPrizes.reduce((s, p) => s + p.weight, 0) / totalWeight) * 100).toFixed(1) : "0.0"}% weight</p>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/15 to-transparent p-4">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/10 rounded-full blur-xl" />
                    <div className="flex items-center gap-2 mb-2">
                      <Repeat className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-semibold text-cyan-400">Free Replay</span>
                    </div>
                    <p className="text-3xl font-bold" data-testid="text-freeplay-count">{freePlayPrizes.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{totalWeight > 0 ? ((freePlayPrizes.reduce((s, p) => s + p.weight, 0) / totalWeight) * 100).toFixed(1) : "0.0"}% weight</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="text-base text-red-400 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-red-500/20"><AlertCircle className="w-4 h-4 text-red-400" /></div>
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                  <div>
                    <p className="font-semibold">Reset All Win Counts</p>
                    <p className="text-sm text-muted-foreground">Set all prize win counters back to zero</p>
                  </div>
                  <Button variant="outline" onClick={() => setResetConfirmOpen(true)} disabled={resetWinsMutation.isPending} className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300" data-testid="button-reset-wins">
                    <RotateCcw className="w-4 h-4 mr-2" /> Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveConfig}
                disabled={isSavingConfig || !hasConfigChanges}
                className={`px-6 ${hasConfigChanges ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-500/20 text-white" : ""}`}
                data-testid="button-save-config"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSavingConfig ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Win Counts?</AlertDialogTitle>
            <AlertDialogDescription>This will set all prize win counts to zero. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-reset-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => resetWinsMutation.mutate()} className="bg-red-600 hover:bg-red-700" data-testid="button-reset-confirm">
              Reset All Wins
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prize?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this prize. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteConfirmId) deletePrizeMutation.mutate(deleteConfirmId); }}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-delete-confirm"
            >
              Delete Prize
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}