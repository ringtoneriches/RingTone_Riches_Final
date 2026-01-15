    import AdminLayout from "@/components/admin/admin-layout";
    import { useQuery, useMutation } from "@tanstack/react-query";
    import { useState, useEffect } from "react";
    import { Button } from "@/components/ui/button";
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
    import { Plus, Trash2, Save, Eye, EyeOff, AlertCircle, RotateCcw, Settings, Gift, Coins, X, ChevronUp, ChevronDown, Palette } from "lucide-react";
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

    interface SpinSegment {
    id: string;
    label: string;
    rewardType: "cash" | "points" | "lose" | "try_again";
    rewardValue: number | string;
    probability: number | string;
    maxWins: number | null;
    currentWins?: number;
    color: string;
    iconKey?: string;
    }

    interface SpinConfig {
    id: string;
    isVisible: boolean;
    isActive: boolean;
    segments: SpinSegment[];
    }

    export default function AdminSpinWheelSettings() {
    const { toast } = useToast();
    const [segments, setSegments] = useState<SpinSegment[]>([]);
    const [isVisible, setIsVisible] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("segments");

    const { data: config, isLoading } = useQuery<SpinConfig>({
        queryKey: ["/api/admin/game-spin-2-config"],
        queryFn: async () => {
        const res = await apiRequest("/api/admin/game-spin-2-config", "GET");
        return res.json();
        },
    });

    useEffect(() => {
        if (config) {
        setSegments(config.segments || []);
        setIsVisible(config.isVisible ?? true);
        setIsActive(config.isActive ?? true);
        setHasChanges(false);
        }
    }, [config]);

    const updateConfigMutation = useMutation({
        mutationFn: async (data: { segments: SpinSegment[]; isVisible: boolean; isActive: boolean }) => {
        return apiRequest("/api/admin/game-spin-2-config", "PUT", data);
        },
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/game-spin-2-config"] });
        toast({ title: "Saved!", description: "Your changes have been saved" });
        setHasChanges(false);
        },
        onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const resetWinsMutation = useMutation({
        mutationFn: async () => {
        return apiRequest("/api/admin/game-spin-2-reset-wins", "POST");
        },
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/game-spin-2-config"] });
        toast({
            title: "Success",
            description: "All win counts have been reset",
        });
        setResetConfirmOpen(false);
        },
        onError: (error: any) => {
        toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
        });
        },
    });

    const addSegment = (type: "cash" | "points" | "lose" | "try_again") => {
        if (segments.length >= 12) {
        toast({
            title: "Maximum Segments",
            description: "Spin wheel can only have 12 segments",
            variant: "destructive",
        });
        return;
        }

        const defaults = {
        cash: { label: "Cash Prize", rewardValue: 5, color: "#10B981", iconKey: "Coin" },
    points: { label: "Points Prize", rewardValue: 100, color: "#F59E0B", iconKey: "Star" },
    lose: { label: "No Win", rewardValue: 0, color: "#6B7280", iconKey: "Dead" },
    try_again: { label: "Free Spin", rewardValue: 0, color: "#3B82F6", iconKey: "Refresh" },
        };
        
        const colors = [
        "#EF4444", "#F97316", "#F59E0B", "#84CC16",
        "#10B981", "#06B6D4", "#3B82F6", "#8B5CF6",
        "#EC4899", "#F43F5E", "#14B8A6", "#6366F1"
        ];
        
        const newSegment: SpinSegment = {
        id: crypto.randomUUID(),
        label: defaults[type].label,
        rewardType: type,
        rewardValue: defaults[type].rewardValue,
        probability: (100 / 13).toFixed(2), // Leave room for adding more
        maxWins: null,
        currentWins: 0,
        color: colors[segments.length % colors.length],
        iconKey: defaults[type].iconKey,
        };
        
        setSegments([...segments, newSegment]);
        setHasChanges(true);
        toast({ title: "Segment Added", description: `New ${defaults[type].label} segment created` });
    };

    const updateSegment = (id: string, field: keyof SpinSegment, value: string | number | null) => {
        setSegments(segments.map(seg =>
        seg.id === id ? { ...seg, [field]: value } : seg
        ));
        setHasChanges(true);
    };

   const removeSegment = (id: string) => {
  if (segments.length <= 1) { // Change 12 to 1 (minimum 1 segment)
    toast({
      title: "Cannot Remove",
      description: "Need at least 1 segment",
      variant: "destructive",
    });
    return;
  }
  
  const segmentToRemove = segments.find(seg => seg.id === id);
  if (segmentToRemove) {
    setSegments(segments.filter(seg => seg.id !== id));
    setHasChanges(true);
    toast({
      title: "Segment Removed",
      description: `"${segmentToRemove.label}" has been removed`,
    });
  }
};

    const moveSegment = (index: number, direction: "up" | "down") => {
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= segments.length) return;
        
        const newSegments = [...segments];
        [newSegments[index], newSegments[newIndex]] = [newSegments[newIndex], newSegments[index]];
        setSegments(newSegments);
        setHasChanges(true);
    };

    const totalProbability = segments.reduce((sum, seg) => sum + (Number(seg.probability) || 0), 0);
    const isValid = Math.abs(totalProbability - 100) < 0.01;
    const probabilityDiff = totalProbability - 100;

    const handleSave = () => {
  if (!isValid) {
    if (segments.length !== 12) {
      toast({
        title: "Fix Segments First",
        description: `Spin wheel must have exactly 12 segments. Currently ${segments.length}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Fix Probability First",
        description: `Total must be 100%. Currently ${totalProbability.toFixed(2)}%`,
        variant: "destructive",
      });
    }
    return;
  }

  const cleanSegments = segments.map((seg) => ({
    id: seg.id,
    label: seg.label,
    rewardType: seg.rewardType,
    rewardValue: seg.rewardValue === "" ? 0 : parseFloat(seg.rewardValue as string),
    probability: seg.probability === "" ? 0 : parseFloat(seg.probability as string),
    maxWins: seg.maxWins,
    currentWins: seg.currentWins || 0, // ← KEEP THIS!
    color: seg.color,
    iconKey: seg.iconKey || "Coin",
  }));

  updateConfigMutation.mutate({ segments: cleanSegments, isVisible, isActive });
};
    const getTypeIcon = (type: string) => {
        switch (type) {
        case "cash": return <Coins className="w-4 h-4" />;
        case "points": return <Gift className="w-4 h-4" />;
        case "lose": return <X className="w-4 h-4" />;
        case "try_again": return <RotateCcw className="w-4 h-4" />;
        default: return <Gift className="w-4 h-4" />;
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
        case "cash": return "border-green-500/50 bg-green-500/10";
        case "points": return "border-yellow-500/50 bg-yellow-500/10";
        case "lose": return "border-muted-foreground/30 bg-muted/30";
        case "try_again": return "border-blue-500/50 bg-blue-500/10";
        default: return "border-border";
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
        case "cash": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Cash</Badge>;
        case "points": return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Points</Badge>;
        case "lose": return <Badge variant="secondary">No Win</Badge>;
        case "try_again": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Free Spin</Badge>;
        default: return <Badge variant="secondary">{type}</Badge>;
        }
    };

    const segmentsByType = {
        cash: segments.filter(s => s.rewardType === "cash"),
        points: segments.filter(s => s.rewardType === "points"),
        lose: segments.filter(s => s.rewardType === "lose"),
        try_again: segments.filter(s => s.rewardType === "try_again"),
    };

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
                <RotateCcw className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                <h1 className="text-xl font-bold">Retro Wheel Settings</h1>
                <p className="text-sm text-muted-foreground">Configure your 12-segment spin wheel</p>
                </div>
            </div>
            </div>

            {/* Warnings */}
            {segments.length !== 12 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div className="text-sm">
                <span className="font-medium text-red-400">Segments Error: </span>
                <span className="text-muted-foreground">
                    Spin wheel must have exactly 12 segments. Currently {segments.length}.
                </span>
                </div>
            </div>
            )}

            {!isValid && segments.length === 12 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div className="text-sm">
                <span className="font-medium text-red-400">Probability Error: </span>
                <span className="text-muted-foreground">
                    Total is {totalProbability.toFixed(2)}%. 
                    {probabilityDiff > 0 
                    ? ` Remove ${probabilityDiff.toFixed(2)}% to fix.`
                    : ` Add ${Math.abs(probabilityDiff).toFixed(2)}% to fix.`
                    }
                </span>
                </div>
            </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
                <TabsTrigger value="segments" className="gap-2">
                <Gift className="w-4 h-4" /> Segments
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" /> Settings
                </TabsTrigger>
            </TabsList>

            {/* SEGMENTS TAB */}
            <TabsContent value="segments" className="space-y-4">
                {/* Quick Add Buttons */}
                <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Add Segment</CardTitle>
                    <CardDescription>Click to add a new segment (Max: 12)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => addSegment("cash")}
                        disabled={segments.length >= 12}
                        className="border-green-500/50 hover:bg-green-500/10 gap-2"
                    >
                        <Coins className="w-4 h-4 text-green-400" /> Cash
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => addSegment("points")}
                        disabled={segments.length >= 12}
                        className="border-yellow-500/50 hover:bg-yellow-500/10 gap-2"
                    >
                        <Gift className="w-4 h-4 text-yellow-400" /> Points
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => addSegment("lose")}
                        disabled={segments.length >= 12}
                        className="gap-2"
                    >
                        <X className="w-4 h-4" /> No Win
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => addSegment("try_again")}
                        disabled={segments.length >= 12}
                        className="border-blue-500/50 hover:bg-blue-500/10 gap-2"
                    >
                        <RotateCcw className="w-4 h-4 text-blue-400" /> Free Spin
                    </Button>
                    </div>
                </CardContent>
                </Card>

                {/* Probability Meter */}
                <div className="sticky top-0 z-40 bg-background/95 backdrop-blur py-2 -mx-1 px-1">
                <div className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                    <div className="flex items-center gap-2">
                    <span className="text-sm font-medium shrink-0">Segments:</span>
                    <Badge variant={segments.length === 12 ? "default" : "destructive"}>
                        {segments.length}/12
                    </Badge>
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                    <span className="text-sm font-medium shrink-0">Probability:</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                        className={`h-full transition-all ${isValid ? "bg-green-500" : totalProbability > 100 ? "bg-red-500" : "bg-yellow-500"}`}
                        style={{ width: `${Math.min(totalProbability, 100)}%` }}
                        />
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${isValid ? "text-green-400" : "text-red-400"}`}>
                        {totalProbability.toFixed(1)}%
                    </span>
                    </div>
                </div>
                </div>

                {/* Segments Grid */}
                <div className="pb-20">
                {segments.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground border rounded-lg">
                    No segments yet. Use the buttons above to add segments.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {segments.map((seg, index) => (
                        <div key={seg.id} className={`${getTypeStyles(seg.rewardType)} border rounded-lg p-3`}>
                        {/* Header */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                            {getTypeBadge(seg.rewardType)}
                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => moveSegment(index, "up")}
                                disabled={index === 0}
                                className="h-6 w-6"
                            >
                                <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => moveSegment(index, "down")}
                                disabled={index === segments.length - 1}
                                className="h-6 w-6"
                            >
                                <ChevronDown className="w-3 h-3" />
                            </Button>
                             <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeSegment(seg.id)}
                           
                            className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-500/10"
                            title="Delete segment"
                            >
                            <Trash2 className="w-3 h-3" />
                            </Button>
                            </div>
                        </div>
                        
                        {/* Name */}
                        <Input
                            value={seg.label}
                            onChange={(e) => updateSegment(seg.id, "label", e.target.value)}
                            placeholder="Segment name"
                            className="h-8 text-sm mb-2"
                        />
                        
                        {/* Color and Value */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                <Palette className="w-3 h-3" /> Color
                            </Label>
                            <div className="flex gap-2">
                                <div 
                                className="w-8 h-8 rounded border"
                                style={{ backgroundColor: seg.color }}
                                />
                                <Input
                                value={seg.color}
                                onChange={(e) => updateSegment(seg.id, "color", e.target.value)}
                                placeholder="#000000"
                                className="h-8 text-sm"
                                />
                            </div>
                            </div>
                            <div>
                            <Label className="text-xs text-muted-foreground">
                                {seg.rewardType === "cash" ? "£ Amount" : seg.rewardType === "points" ? "Points" : "Value"}
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={
                                seg.rewardType === "lose" || seg.rewardType === "try_again"
                                    ? ""
                                    : seg.rewardValue === null || seg.rewardValue === undefined
                                    ? ""
                                    : seg.rewardValue
                                }
                                onChange={(e) => updateSegment(seg.id, "rewardValue", e.target.value)}
                                disabled={seg.rewardType === "lose" || seg.rewardType === "try_again"}
                                placeholder="-"
                                className="h-8 text-sm"
                            />
                            </div>
                        </div>
                                <div className="mb-2">
                            <Label className="text-xs text-muted-foreground">Icon Key</Label>
                            <Input
                                value={seg.iconKey || ""}
                                onChange={(e) => updateSegment(seg.id, "iconKey", e.target.value)}
                                placeholder="e.g., Coin, Star, Dead, Bomb"
                                className="h-8 text-sm"
                            />
                            </div>
                        {/* Probability and Max Wins */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                            <Label className="text-xs text-muted-foreground">Probability %</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={seg.probability === undefined || seg.probability === null ? "" : seg.probability}
                                onChange={(e) => updateSegment(seg.id, "probability", e.target.value)}
                                className="h-8 text-sm"
                            />
                            </div>
                            <div>
                            <Label className="text-xs text-muted-foreground">Max Wins</Label>
                            <Input
                                type="number"
                                value={seg.maxWins ?? ""}
                                onChange={(e) => {
                                const value = e.target.value;
                                updateSegment(seg.id, "maxWins", value ? parseInt(value) : null);
                                }}
                                placeholder="∞"
                                className="h-8 text-sm"
                            />
                            </div>
                        </div>

                        {/* Current Wins */}
                        <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            seg.maxWins !== null && (seg.currentWins || 0) >= seg.maxWins
                                ? "bg-red-500/20 text-red-400"
                                : "bg-muted text-muted-foreground"
                            }`}>
                            <span>Won:</span>
                            <span className="font-bold">{seg.currentWins || 0}</span>
                            <span>/</span>
                            <span>{seg.maxWins ?? "∞"}</span>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
                </div>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="space-y-4">
                {/* Game Status */}
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
                        <RotateCcw className={`w-5 h-5 ${isActive ? "text-green-400" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                        <p className="font-medium">Game Active</p>
                        <p className="text-sm text-muted-foreground">
                            {isActive ? "Players can spin the wheel" : "Wheel is disabled"}
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
                            {isVisible ? "Wheel appears on the website" : "Hidden from users"}
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

                {/* Stats Overview */}
                <Card>
                <CardHeader>
                    <CardTitle className="text-base">Segment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-2 mb-1">
                        <Coins className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">Cash Segments</span>
                        </div>
                        <p className="text-2xl font-bold">{segmentsByType.cash.length}</p>
                        <p className="text-xs text-muted-foreground">
                        {segmentsByType.cash.reduce((sum, s) => sum + Number(s.probability), 0).toFixed(1)}% total chance
                        </p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <div className="flex items-center gap-2 mb-1">
                        <Gift className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-400">Points Segments</span>
                        </div>
                        <p className="text-2xl font-bold">{segmentsByType.points.length}</p>
                        <p className="text-xs text-muted-foreground">
                        {segmentsByType.points.reduce((sum, s) => sum + Number(s.probability), 0).toFixed(1)}% total chance
                        </p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <div className="flex items-center gap-2 mb-1">
                        <RotateCcw className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-400">Free Spins</span>
                        </div>
                        <p className="text-2xl font-bold">{segmentsByType.try_again.length}</p>
                        <p className="text-xs text-muted-foreground">
                        {segmentsByType.try_again.reduce((sum, s) => sum + Number(s.probability), 0).toFixed(1)}% total chance
                        </p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-center gap-2 mb-1">
                        <X className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">No Win</span>
                        </div>
                        <p className="text-2xl font-bold">{segmentsByType.lose.length}</p>
                        <p className="text-xs text-muted-foreground">
                        {segmentsByType.lose.reduce((sum, s) => sum + Number(s.probability), 0).toFixed(1)}% total chance
                        </p>
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
                    <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/30">
                    <div>
                        <p className="font-medium">Reset All Win Counts</p>
                        <p className="text-sm text-muted-foreground">Set all segment win counters back to zero</p>
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
                </CardContent>
                </Card>
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
                {!isValid && (
                <Badge variant="destructive" className="text-xs">
                    {segments.length !== 12 ? "Need 12 segments" : "Total must be 100%"}
                </Badge>
                )}
            </div>
            <div className="flex items-center gap-2">
                {hasChanges && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                    if (config) {
                        setSegments(config.segments || []);
                        setIsVisible(config.isVisible ?? true);
                        setIsActive(config.isActive ?? true);
                        setHasChanges(false);
                    }
                    }}
                >
                    Discard
                </Button>
                )}
                <Button
                onClick={handleSave}
                disabled={updateConfigMutation.isPending || !isValid || !hasChanges}
                className={hasChanges ? "bg-green-600 hover:bg-green-700" : ""}
                >
                <Save className="w-4 h-4 mr-2" />
                {updateConfigMutation.isPending ? "Saving..." : "Save"}
                </Button>
            </div>
            </div>
        </div>

        <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Reset All Win Counts?</AlertDialogTitle>
                <AlertDialogDescription>
                This will set all segment win counts to zero. This cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                onClick={() => resetWinsMutation.mutate()}
                className="bg-red-600 hover:bg-red-700"
                >
                Yes, Reset All
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </AdminLayout>
    );
    }