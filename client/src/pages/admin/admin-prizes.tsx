// src/components/admin/AdminPrizes.tsx

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Gift,
  Trophy,
  Package,
  AlertCircle,
  X,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter,
  Settings,
  Percent,
  Ticket,
  Coins,
  Zap,
  Target,
  Sparkles,
  RotateCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface Prize {
  id: string;
  competitionId: string;
  prizeName: string;
  prizeValue: number;
  totalQuantity: number;
  remainingQuantity: number;
  gameType?: string;
  gamePrizeId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Competition {
  id: string;
  name: string;
  status: string;
  type: string;
  title: string;
}

interface TicketSettings {
  competitionId: string;
  winPercentage: number;
  ticketCost: number;
  isActive: boolean;
}

type SortDirection = 'asc' | 'desc';

export default function AdminPrizes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTicketSettingsOpen, setIsTicketSettingsOpen] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  
  // Sorting state - only for prize name
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Form state
  const [formData, setFormData] = useState({
    prizeName: "",
    prizeValue: "",
    totalQuantity: "",
    remainingQuantity: ""
  });

  // Ticket settings state
  const [ticketSettings, setTicketSettings] = useState<TicketSettings>({
    competitionId: "",
    winPercentage: 30,
    ticketCost: 1,
    isActive: true
  });

  // Fetch competitions
  const { data: competitions = [], isLoading: competitionsLoading } = useQuery<Competition[]>({
    queryKey: ["/api/admin/competitions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/competitions", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch competitions");
      const allCompetitions = await res.json();
    
      // Filter to only show specific competition types
      const allowedTypes = ['pop', 'voltz', 'plinko', 'scratch', 'spin'];
      return allCompetitions.filter((comp: Competition) => 
        allowedTypes.includes(comp.type?.toLowerCase()));
    },
  });

  // Fetch prizes for selected competition
  const { data: prizes = [], isLoading: prizesLoading, refetch: refetchPrizes } = useQuery<Prize[]>({
    queryKey: ["/api/competitions", selectedCompetition, "prizes"],
    queryFn: async () => {
      if (!selectedCompetition) return [];
      const res = await fetch(`/api/competitions/${selectedCompetition}/prizes`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch prizes");
      return res.json();
    },
    enabled: !!selectedCompetition,
  });

  // Fetch ticket settings
  const { data: currentTicketSettings, refetch: refetchTicketSettings } = useQuery<TicketSettings>({
    queryKey: ["/api/competitions", selectedCompetition, "ticket-settings"],
    queryFn: async () => {
      if (!selectedCompetition) return null;
      const res = await fetch(`/api/competitions/${selectedCompetition}/ticket-settings`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch ticket settings");
      return res.json();
    },
    enabled: !!selectedCompetition,
  });

  // Update ticket settings when fetched
  useState(() => {
    if (currentTicketSettings) {
      setTicketSettings(currentTicketSettings);
    }
  });

  // Create prize mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/competitions/${selectedCompetition}/prizes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create prize");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitions", selectedCompetition, "prizes"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Prize created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create prize",
        variant: "destructive",
      });
    },
  });

  // Update prize mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/prizes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update prize");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitions", selectedCompetition, "prizes"] });
      setIsEditDialogOpen(false);
      setSelectedPrize(null);
      toast({
        title: "Success",
        description: "Prize updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update prize",
        variant: "destructive",
      });
    },
  });

  // Delete prize mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/prizes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete prize");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitions", selectedCompetition, "prizes"] });
      setIsDeleteDialogOpen(false);
      setSelectedPrize(null);
      toast({
        title: "Success",
        description: "Prize deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete prize",
        variant: "destructive",
      });
    },
  });

  // Save ticket settings mutation
  const saveTicketSettingsMutation = useMutation({
    mutationFn: async (data: TicketSettings) => {
      const res = await fetch(`/api/competitions/${selectedCompetition}/ticket-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save ticket settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitions", selectedCompetition, "ticket-settings"] });
      setIsTicketSettingsOpen(false);
      toast({
        title: "Success",
        description: "Ticket settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save ticket settings",
        variant: "destructive",
      });
    },
  });

  // Toggle sort direction
  const toggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

// Filter and sort prizes - only sort by prize name with natural sort
const filteredAndSortedPrizes = useMemo(() => {
  if (!prizes) return [];
  
  // First filter
  let filtered = prizes.filter((prize) =>
    prize.prizeName.toLowerCase().includes(search.toLowerCase()) ||
    prize.prizeValue.toString().includes(search) ||
    prize.totalQuantity.toString().includes(search)
  );

  // Natural sort by prize name (handles numbers correctly: £1, £5, £10, £25)
  filtered.sort((a, b) => {
    const comparison = a.prizeName.localeCompare(b.prizeName, undefined, { 
      numeric: true,      // This enables natural numeric sorting
      sensitivity: 'base' // This makes it case-insensitive
    });
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return filtered;
}, [prizes, search, sortDirection]);

  const resetForm = () => {
    setFormData({
      prizeName: "",
      prizeValue: "",
      totalQuantity: "",
      remainingQuantity: ""
    });
  };

  const handleEdit = (prize: Prize) => {
    setSelectedPrize(prize);
    setFormData({
      prizeName: prize.prizeName,
      prizeValue: prize.prizeValue.toString(),
      totalQuantity: prize.totalQuantity.toString(),
      remainingQuantity: prize.remainingQuantity.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (prize: Prize) => {
    setSelectedPrize(prize);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      prizeName: formData.prizeName,
      prizeValue: parseFloat(formData.prizeValue),
      totalQuantity: parseInt(formData.totalQuantity),
      remainingQuantity: parseInt(formData.remainingQuantity),
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrize) return;
    updateMutation.mutate({
      id: selectedPrize.id,
      data: {
        prizeName: formData.prizeName,
        prizeValue: parseFloat(formData.prizeValue),
        totalQuantity: parseInt(formData.totalQuantity),
        remainingQuantity: parseInt(formData.remainingQuantity),
      },
    });
  };

  const handleTicketSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveTicketSettingsMutation.mutate({
      ...ticketSettings,
      competitionId: selectedCompetition,
    });
  };

  const getPrizeStatus = (remaining: number) => {
    if (remaining === 0) {
      return { label: "All Claimed", variant: "destructive" as const };
    }
    if (remaining < 5) {
      return { label: "Low Stock", variant: "warning" as const };
    }
    return { label: "Available", variant: "default" as const };
  };

  const getGameTypeIcon = (gameType?: string) => {
    switch (gameType) {
      case 'pop': return <Sparkles className="w-3 h-3" />;
      case 'voltz': return <Zap className="w-3 h-3" />;
      case 'plinko': return <Target className="w-3 h-3" />;
      case 'scratch': return <Gift className="w-3 h-3" />;
      case 'spin': return <RotateCw className="w-3 h-3" />;
      case 'wheel': return <RotateCw className="w-3 h-3" />;
      default: return null;
    }
  };

  if (competitionsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 px-4 sm:px-0">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              Prize Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage competition prizes, quantities, and auto-sync from games
            </p>
          </div>
        </div>

        {/* Competition Selector */}
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 w-full">
                <Label htmlFor="competition" className="mb-2 block text-sm font-medium">
                  Select Competition
                </Label>
                <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a competition to manage prizes" />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.map((comp) => (
                      <SelectItem key={comp.id} value={comp.id}>
                        <div className="flex items-center justify-between gap-2">
                          <span>{comp.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {comp.type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCompetition && (
                <>
                  <Button
                    onClick={() => refetchPrizes()}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => {
                      if (currentTicketSettings) {
                        setTicketSettings(currentTicketSettings);
                      }
                      setIsTicketSettingsOpen(true);
                    }}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Ticket Settings
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedCompetition && (
          <>
            {/* Ticket Settings Summary Card */}
            {currentTicketSettings && (
              <Card className="bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                      <p className="text-xl font-bold text-green-500">{currentTicketSettings.winPercentage}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Ticket Cost</p>
                      <p className="text-xl font-bold text-yellow-500">{currentTicketSettings.ticketCost}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={currentTicketSettings.isActive ? "default" : "destructive"}>
                        {currentTicketSettings.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Prizes</p>
                      <p className="text-xl font-bold text-blue-500">
                        {prizes.reduce((sum, p) => sum + p.remainingQuantity, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search prizes by name, value, or quantity..."
                  className="pl-10 w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Prize
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleCreateSubmit}>
                      <DialogHeader>
                        <DialogTitle>Add New Prize</DialogTitle>
                        <DialogDescription>
                          Create a new prize for this competition
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="prizeName">Prize Name</Label>
                          <Input
                            id="prizeName"
                            placeholder="e.g., MacBook Pro, Gaming Chair, etc."
                            value={formData.prizeName}
                            onChange={(e) =>
                              setFormData({ ...formData, prizeName: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="prizeValue">Prize Value (£)</Label>
                          <Input
                            id="prizeValue"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.prizeValue}
                            onChange={(e) =>
                              setFormData({ ...formData, prizeValue: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="totalQuantity">Total Quantity</Label>
                          <Input
                            id="totalQuantity"
                            type="number"
                            placeholder="Number of prizes available"
                            value={formData.totalQuantity}
                            onChange={(e) =>
                              setFormData({ ...formData, totalQuantity: e.target.value })
                            }
                            required
                            min="1"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="remainingQuantity">Remaining Quantity</Label>
                          <Input
                            id="remainingQuantity"
                            type="number"
                            placeholder="Number of prizes remaining"
                            value={formData.remainingQuantity}
                            onChange={(e) =>
                              setFormData({ ...formData, remainingQuantity: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsCreateDialogOpen(false);
                            resetForm();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                          {createMutation.isPending && (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          )}
                          Create Prize
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Prizes Table */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Prizes</CardTitle>
                    <CardDescription>
                      Showing {filteredAndSortedPrizes.length} of {prizes.length} prizes
                      {filteredAndSortedPrizes.some(p => p.gameType) && " (Auto-synced from games)"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {prizesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : filteredAndSortedPrizes.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {search ? "No prizes match your search" : "No prizes created yet"}
                    </p>
                    {!search && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setIsCreateDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Prize
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden mx-4 sm:mx-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead 
                              className="whitespace-nowrap cursor-pointer hover:bg-muted/50 transition-colors select-none"
                              onClick={toggleSort}
                            >
                              <div className="flex items-center gap-2">
                                Prize Name
                                {sortDirection === 'asc' ? (
                                  <ArrowUp className="w-4 h-4 text-primary" />
                                ) : (
                                  <ArrowDown className="w-4 h-4 text-primary" />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap">Value</TableHead>
                            <TableHead className="whitespace-nowrap">Total</TableHead>
                            <TableHead className="whitespace-nowrap">Remaining</TableHead>
                            <TableHead className="whitespace-nowrap">Game</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="whitespace-nowrap">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAndSortedPrizes.map((prize) => {
                            const stockStatus = getPrizeStatus(prize.remainingQuantity);
                            return (
                              <TableRow key={prize.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-yellow-500" />
                                    {prize.prizeName}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-green-500">
                                    £{typeof prize.prizeValue === 'number' 
                                      ? prize.prizeValue.toFixed(2) 
                                      : Number(prize.prizeValue || 0).toFixed(2)}
                                  </span>
                                </TableCell>
                                <TableCell>{prize.totalQuantity}</TableCell>
                                <TableCell>{prize.remainingQuantity}</TableCell>
                                <TableCell>
                                  {prize.gameType ? (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      {getGameTypeIcon(prize.gameType)}
                                      <span className="capitalize">{prize.gameType}</span>
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Manual</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      stockStatus.variant === "destructive"
                                        ? "destructive"
                                        : stockStatus.variant === "warning"
                                        ? "secondary"
                                        : "default"
                                    }
                                    className={
                                      stockStatus.variant === "warning"
                                        ? "bg-yellow-500/20 text-yellow-500"
                                        : ""
                                    }
                                  >
                                    {stockStatus.label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEdit(prize)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDelete(prize)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedCompetition && competitions.length > 0 && (
          <Alert className="mx-4 sm:mx-0">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Please select a competition from the dropdown above to manage its prizes and ticket settings.
            </AlertDescription>
          </Alert>
        )}

        {competitions.length === 0 && (
          <Alert className="mx-4 sm:mx-0">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              No competitions found. Please create a competition first before adding prizes.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Ticket Settings Dialog */}
      <Dialog open={isTicketSettingsOpen} onOpenChange={setIsTicketSettingsOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleTicketSettingsSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Ticket Settings
              </DialogTitle>
              <DialogDescription>
                Configure win rate and ticket costs for instant win games
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Win Percentage Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Win Rate Percentage</Label>
                  <Badge variant="outline" className="text-lg font-bold">
                    {ticketSettings.winPercentage}%
                  </Badge>
                </div>
                <Slider
                  value={[ticketSettings.winPercentage]}
                  onValueChange={([value]) => 
                    setTicketSettings({ ...ticketSettings, winPercentage: value })
                  }
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1% (Very Rare)</span>
                  <span>100% (Guaranteed Win)</span>
                </div>
                
                {/* Visual Representation */}
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${ticketSettings.winPercentage}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Players will have a {ticketSettings.winPercentage}% chance to win on each play
                </p>
              </div>

              {/* Ticket Cost */}
              <div className="space-y-2">
                <Label htmlFor="ticketCost" className="text-base font-semibold">
                  Ticket Cost
                </Label>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <Input
                    id="ticketCost"
                    type="number"
                    min="0"
                    step="0.1"
                    value={ticketSettings.ticketCost}
                    onChange={(e) => 
                      setTicketSettings({ 
                        ...ticketSettings, 
                        ticketCost: parseFloat(e.target.value) || 0 
                      })
                    }
                    className="w-32"
                  />
                  <span className="text-muted-foreground">tokens per play</span>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-base font-semibold">Game Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this instant win game
                  </p>
                </div>
                <Switch
                  checked={ticketSettings.isActive}
                  onCheckedChange={(checked) => 
                    setTicketSettings({ ...ticketSettings, isActive: checked })
                  }
                />
              </div>

              {/* Prize Pool Summary */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Prize Pool Summary</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Total Prizes:</span>
                    <span className="font-bold ml-2">
                      {prizes.reduce((sum, p) => sum + p.totalQuantity, 0)}
                    </span>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className="font-bold ml-2">
                      {prizes.reduce((sum, p) => sum + p.remainingQuantity, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTicketSettingsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saveTicketSettingsMutation.isPending}
              >
                {saveTicketSettingsMutation.isPending && (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                )}
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Prize</DialogTitle>
              <DialogDescription>
                Update prize details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-prizeName">Prize Name</Label>
                <Input
                  id="edit-prizeName"
                  value={formData.prizeName}
                  onChange={(e) =>
                    setFormData({ ...formData, prizeName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-prizeValue">Prize Value (£)</Label>
                <Input
                  id="edit-prizeValue"
                  type="number"
                  step="0.01"
                  value={formData.prizeValue}
                  onChange={(e) =>
                    setFormData({ ...formData, prizeValue: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-totalQuantity">Total Quantity</Label>
                <Input
                  id="edit-totalQuantity"
                  type="number"
                  value={formData.totalQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, totalQuantity: e.target.value })
                  }
                  required
                  min="1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-remainingQuantity">Remaining Quantity</Label>
                <Input
                  id="edit-remainingQuantity"
                  type="number"
                  value={formData.remainingQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, remainingQuantity: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedPrize(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95vw]">
          <DialogHeader>
            <DialogTitle>Delete Prize</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prize? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPrize && (
            <div className="py-4 space-y-2">
              <p className="font-semibold break-words">{selectedPrize.prizeName}</p>
              <p className="text-sm text-muted-foreground">
                Value: £{typeof selectedPrize.prizeValue === 'number' 
                  ? selectedPrize.prizeValue.toFixed(2) 
                  : Number(selectedPrize.prizeValue || 0).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Remaining: {selectedPrize.remainingQuantity} of {selectedPrize.totalQuantity}
              </p>
            </div>
          )}
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedPrize && deleteMutation.mutate(selectedPrize.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              )}
              Delete Prize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}