import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Eye, EyeOff, Sparkles, AlertCircle, Settings, Coins, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SlotConfig {
  id: string;
  isVisible: boolean;
  isActive: boolean;
  creditsPerSpin: number;
}

interface SlotStats {
  totalSpins: number;
  totalWins: number;
  totalCoinsWon: number;
  totalCoinsSpent: number;
  totalRevenue: number;
  uniquePlayers: number;
}

export default function AdminSlotMachineSettings() {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [creditsPerSpin, setCreditsPerSpin] = useState(20);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  const { data, isLoading } = useQuery<{ config: SlotConfig; stats: SlotStats; recentOrders: any[] }>({
    queryKey: ["/api/admin/game-slot-config"],
    queryFn: async () => {
      const res = await apiRequest("/api/admin/game-slot-config", "GET");
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.config) {
      setIsVisible(data.config.isVisible ?? true);
      setIsActive(data.config.isActive ?? true);
      setCreditsPerSpin(data.config.creditsPerSpin || 20);
      setHasChanges(false);
    }
  }, [data]);

  const updateConfigMutation = useMutation({
    mutationFn: async (config: { isVisible: boolean; isActive: boolean; creditsPerSpin: number }) => {
      return apiRequest("/api/admin/game-slot-config", "PUT", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-slot-config"] });
      toast({ title: "Saved!", description: "Slot machine settings updated" });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (creditsPerSpin < 1 || creditsPerSpin > 1000) {
      toast({
        title: "Invalid Credits",
        description: "Credits per spin must be between 1 and 1000",
        variant: "destructive",
      });
      return;
    }
    updateConfigMutation.mutate({ isVisible, isActive, creditsPerSpin });
  };

  const stats = data?.stats || {
    totalSpins: 0,
    totalWins: 0,
    totalCoinsWon: 0,
    totalCoinsSpent: 0,
    totalRevenue: 0,
    uniquePlayers: 0,
  };

  const winRate = stats.totalSpins > 0 ? ((stats.totalWins / stats.totalSpins) * 100).toFixed(1) : "0";

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
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Slot Machine Settings</h1>
              <p className="text-sm text-muted-foreground">Configure your slot machine game</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" /> Settings
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Statistics
            </TabsTrigger>
          </TabsList>

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
                      <Sparkles className={`w-5 h-5 ${isActive ? "text-green-400" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium">Game Active</p>
                      <p className="text-sm text-muted-foreground">
                        {isActive ? "Players can play the slot machine" : "Game is disabled"}
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

            {/* Credits Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" /> Credits Configuration
                </CardTitle>
                <CardDescription>
                  Set how many credits each spin costs. 1 coin = £0.01
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label className="text-sm">Credits Per Spin</Label>
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        value={creditsPerSpin}
                        onChange={(e) => {
                          setCreditsPerSpin(parseInt(e.target.value) || 20);
                          setHasChanges(true);
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Cost</p>
                      <p className="text-lg font-bold text-primary">
                        £{((creditsPerSpin || 0) * 0.01).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-yellow-400">
                        Each spin costs {creditsPerSpin || 0} credits (£{((creditsPerSpin || 0) * 0.01).toFixed(2)})
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How Slot Machine Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-400">1</span>
                    </div>
                    <p>Players purchase spins through a competition created with type "slot"</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-400">2</span>
                    </div>
                    <p>Each spin costs {creditsPerSpin || 20} credits (determined here)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-400">3</span>
                    </div>
                    <p>Wins are calculated on the frontend and coins are converted to cash (£0.01 per coin)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-400">4</span>
                    </div>
                    <p>Wins of £1 or more are automatically credited to player's wallet</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATISTICS TAB */}
          <TabsContent value="stats" className="space-y-4">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">Total Spins</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalSpins}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-400">Total Wins</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalWins}</p>
                  <p className="text-xs text-muted-foreground">{winRate}% win rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Coins Won</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalCoinsWon}</p>
                  <p className="text-xs text-muted-foreground">£{((stats.totalCoinsWon || 0) * 0.01).toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-400">Coins Spent</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalCoinsSpent}</p>
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

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium text-orange-400">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold">£{(stats.totalRevenue || 0).toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            {data?.recentOrders && data.recentOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.recentOrders.slice(0, 10).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <div>
                          <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{order.quantity} spins</p>
                          <p className="text-xs text-muted-foreground">£{parseFloat(order.totalAmount).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
                  if (data?.config) {
                    setIsVisible(data.config.isVisible ?? true);
                    setIsActive(data.config.isActive ?? true);
                    setCreditsPerSpin(data.config.creditsPerSpin || 20);
                    setHasChanges(false);
                  }
                }}
              >
                Discard
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={updateConfigMutation.isPending || !hasChanges}
              className={hasChanges ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateConfigMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}