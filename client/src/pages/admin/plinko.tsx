// ================================================================================
// PLINKO ADMIN PAGE - Prize Configuration Dashboard
// ================================================================================
// This admin page allows configuration of the Plinko game settings and prizes.
// Admins can manage 8 prize slots, set probabilities, configure max wins,
// and control game visibility/active status.
//
// FEATURES:
// - Configure 8 prize slots with name, type (cash/points/lose), value, probability
// - Set max wins limit per prize (optional - null means unlimited)
// - View current win counts for each prize
// - Reset win counters individually or all at once
// - Set free replay probability percentage
// - Toggle game visibility and active status
// - Real-time probability total validation (must equal 100%)
// - Sticky controls that stay visible when scrolling
//
// API ENDPOINTS USED:
// - GET /api/admin/plinko-config - Fetch current configuration
// - PUT /api/admin/plinko-config - Update configuration and prizes
//
// DATA STRUCTURE:
// - PlinkoPrize: { slotIndex, prizeName, rewardType, prizeValue, probability, maxWins, currentWins, color }
// - PlinkoConfig: { isVisible, isActive, rows, freeReplayProbability, prizes[] }
// ================================================================================

import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Eye, EyeOff, Target, AlertCircle, RotateCcw, Settings, Gift, Coins, Ban, Repeat, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface PlinkoPrize {
  id: string;
  slotIndex: number;
  prizeName: string;
  rewardType: "cash" | "points" | "try_again";
  prizeValue: number;
  probability: number;
  maxWins: number | null;
  currentWins: number;
  displayOrder: number;
  color: string;
  isActive: boolean;
}

interface PlinkoConfig {
  id: string;
  isVisible: boolean;
  isActive: boolean;
  rows: number;
  freeReplayProbability: string;
  prizes: PlinkoPrize[];
}

export default function AdminPlinko() {
  const { toast } = useToast();
  const [prizes, setPrizes] = useState<PlinkoPrize[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [freeReplayProbability, setFreeReplayProbability] = useState("5.00");
  const [hasChanges, setHasChanges] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const { data: config, isLoading } = useQuery<PlinkoConfig>({
    queryKey: ["/api/admin/plinko-config"],
    queryFn: async () => {
      const res = await apiRequest("/api/admin/plinko-config", "GET");
      return res.json();
    },
  });

  useEffect(() => {
    if (config) {
      setPrizes(config.prizes || []);
      setIsVisible(config.isVisible ?? true);
      setIsActive(config.isActive ?? true);
      setFreeReplayProbability(config.freeReplayProbability || "5.00");
      setHasChanges(false);
    }
  }, [config]);

  const updateConfigMutation = useMutation({
    mutationFn: async (data: { prizes: PlinkoPrize[]; isVisible: boolean; isActive: boolean; freeReplayProbability: string }) => {
      return apiRequest("/api/admin/plinko-config", "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plinko-config"] });
      toast({ title: "Saved!", description: "Your changes have been saved" });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetWinsMutation = useMutation({
    mutationFn: async () => {
      const resetPrizes = prizes.map(p => ({ ...p, currentWins: 0 }));
      return apiRequest("/api/admin/plinko-config", "PUT", { 
        prizes: resetPrizes, 
        isVisible, 
        isActive,
        freeReplayProbability
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plinko-config"] });
      toast({ title: "Success", description: "All win counts reset to zero" });
      setResetConfirmOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePrize = (slotIndex: number, field: keyof PlinkoPrize, value: any) => {
    setPrizes(prizes.map(p =>
      p.slotIndex === slotIndex ? { ...p, [field]: value } : p
    ));
    setHasChanges(true);
  };

  const movePrize = (currentIndex: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= prizes.length) return;
    
    const newPrizes = [...prizes];
    // Swap the prizes in the array
    [newPrizes[currentIndex], newPrizes[newIndex]] = [newPrizes[newIndex], newPrizes[currentIndex]];
    
    // Update displayOrder to match new positions
    newPrizes.forEach((prize, index) => {
      prize.displayOrder = index;
    });
    
    setPrizes(newPrizes);
    setHasChanges(true);
  };

  const totalProbability = prizes.reduce((sum, p) => sum + (parseFloat(String(p.probability)) || 0), 0);
  const probabilityValid = Math.abs(totalProbability - 100) < 0.01;

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "cash": return <Gift className="w-4 h-4 text-green-400" />;
      case "points": return <Coins className="w-4 h-4 text-purple-400" />;
      case "try_again": return <Ban className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const getRewardBadge = (type: string) => {
    switch (type) {
      case "cash": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Cash</Badge>;
      case "points": return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Points</Badge>;
      case "try_again": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">No Win</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 pb-28">
        {/* Sticky header with controls */}
        <div className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-sm -mx-6 px-6 py-4 border-b border-zinc-800 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent flex items-center gap-3">
                <Target className="w-8 h-8 text-purple-500" />
                Ringtone Plinko
              </h1>
              <p className="text-gray-400 mt-1">Configure the Plinko game prizes and settings</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Probability status - always visible */}
              <div className="flex items-center gap-2">
                {!probabilityValid && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Probability must equal 100%
                  </Badge>
                )}
                <Badge variant={probabilityValid ? "default" : "destructive"} className={probabilityValid ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}>
                  Total: {totalProbability.toFixed(2)}%
                </Badge>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setResetConfirmOpen(true)}
                className="border-red-500/30 text-red-400"
                data-testid="button-reset-wins"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Wins
              </Button>
              
              <Button
                onClick={() => updateConfigMutation.mutate({ prizes, isVisible, isActive, freeReplayProbability })}
                disabled={!hasChanges || !probabilityValid}
                className="bg-gradient-to-r from-purple-600 to-amber-600"
                data-testid="button-save-changes"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="prizes" className="space-y-6">
          <TabsList className="bg-zinc-900/50 border border-zinc-800">
            <TabsTrigger value="prizes" className="data-[state=active]:bg-purple-500/20">
              <Gift className="w-4 h-4 mr-2" />
              Prize Slots
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-500/20">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prizes" className="space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-3">
                <div>
                  <CardTitle className="text-xl text-white">Prize Slots (8 Total)</CardTitle>
                  <CardDescription>Configure the 8 prize slots at the bottom of the Plinko board</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {prizes.sort((a, b) => a.displayOrder - b.displayOrder).map((prize, index) => (
                    <Card key={prize.slotIndex} className="bg-zinc-800/50 border-zinc-700 hover:border-purple-500/30 transition-colors">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-full" 
                              style={{ backgroundColor: prize.color }}
                            />
                            <span className="text-sm font-medium text-gray-300">Slot {prize.slotIndex + 1}</span>
                          </div>
                          {getRewardBadge(prize.rewardType)}
                        </div>

                        {/* <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => movePrize(index, "up")}
            disabled={index === 0}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => movePrize(index, "down")}
            disabled={index === prizes.length - 1}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div> */}

                        <div className="space-y-2">
                          <Label className="text-xs text-gray-400">Prize Name</Label>
                          <Input
                            value={prize.prizeName}
                            onChange={(e) => updatePrize(prize.slotIndex, "prizeName", e.target.value)}
                            className="bg-zinc-900 border-zinc-700 h-8 text-sm"
                          />
                        </div>

                        {prize.rewardType !== "lose" && (
                          <div className="space-y-2">
                            <Label className="text-xs text-gray-400">
                              {prize.rewardType === "cash" ? "Cash Value (£)" : "Points Value"}
                            </Label>
                            <Input
                              type="number"
                              value={prize.prizeValue}
                              onChange={(e) => updatePrize(prize.slotIndex, "prizeValue", parseFloat(e.target.value) || 0)}
                              className="bg-zinc-900 border-zinc-700 h-8 text-sm"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-xs text-gray-400">Probability (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={prize.probability}
                            onChange={(e) => updatePrize(prize.slotIndex, "probability", parseFloat(e.target.value) || 0)}
                            className="bg-zinc-900 border-zinc-700 h-8 text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-gray-400">Max Wins (blank = unlimited)</Label>
                          <Input
                            type="number"
                            value={prize.maxWins ?? ""}
                            onChange={(e) => updatePrize(prize.slotIndex, "maxWins", e.target.value ? parseInt(e.target.value) : null)}
                            className="bg-zinc-900 border-zinc-700 h-8 text-sm"
                            placeholder="Unlimited"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
                          <span className="text-xs text-gray-500">Current Wins</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              prize.maxWins && prize.currentWins >= prize.maxWins 
                                ? "border-red-500 text-red-400 bg-red-500/10" 
                                : prize.maxWins && prize.currentWins >= prize.maxWins * 0.8
                                ? "border-amber-500 text-amber-400 bg-amber-500/10"
                                : ""
                            }`}
                          >
                            {prize.currentWins || 0} {prize.maxWins ? `/ ${prize.maxWins}` : ""}
                            {prize.maxWins && prize.currentWins >= prize.maxWins && (
                              <span className="ml-1 text-red-400">(LIMIT)</span>
                            )}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Game Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                    <div className="flex items-center gap-3">
                      {isVisible ? <Eye className="w-5 h-5 text-green-400" /> : <EyeOff className="w-5 h-5 text-red-400" />}
                      <div>
                        <p className="font-medium text-white">Visibility</p>
                        <p className="text-sm text-gray-400">Show Plinko game to users</p>
                      </div>
                    </div>
                    <Switch
                      checked={isVisible}
                      onCheckedChange={(checked) => { setIsVisible(checked); setHasChanges(true); }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                    <div className="flex items-center gap-3">
                      <Target className={`w-5 h-5 ${isActive ? "text-green-400" : "text-red-400"}`} />
                      <div>
                        <p className="font-medium text-white">Active</p>
                        <p className="text-sm text-gray-400">Allow users to play Plinko</p>
                      </div>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) => { setIsActive(checked); setHasChanges(true); }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Repeat className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="font-medium text-white">Free Replay Probability</p>
                      <p className="text-sm text-gray-400">Chance to get a free replay (independent of prizes)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={freeReplayProbability}
                      onChange={(e) => { setFreeReplayProbability(e.target.value); setHasChanges(true); }}
                      className="w-32 bg-zinc-900 border-zinc-700"
                    />
                    <span className="text-gray-400">%</span>
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      Current: {freeReplayProbability}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
          <AlertDialogContent className="bg-zinc-900 border-zinc-800">
            <AlertDialogHeader>
              <AlertDialogTitle>Reset All Win Counts?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset the current win counts for all prizes to zero. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => resetWinsMutation.mutate()}
                className="bg-red-600 hover:bg-red-700"
              >
                Reset Wins
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}