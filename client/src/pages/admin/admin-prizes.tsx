// admin-prizes.tsx
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
  Filter
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Prize {
  id: string;
  competitionId: string;
  prizeName: string;
  prizeValue: number;
  totalQuantity: number;
  remainingQuantity: number;
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

export default function AdminPrizes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    prizeName: "",
    prizeValue: "",
    totalQuantity: "",
    remainingQuantity: ""
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
        allowedTypes.includes(comp.type?.toLowerCase()))
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

  // Filter prizes
  const filteredPrizes = useMemo(() => {
    if (!prizes) return [];
    return prizes.filter((prize) =>
      prize.prizeName.toLowerCase().includes(search.toLowerCase()) ||
      prize.prizeValue.toString().includes(search) ||
      prize.totalQuantity.toString().includes(search)
    );
  }, [prizes, search]);

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

  const getPrizeStatus = (remaining: number) => {
    if (remaining === 0) {
      return { label: "All Claimed", variant: "destructive" };
    }
    return { label: "Available", variant: "default" };
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
              Manage competition prizes, quantities, and values
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
                        {!comp.title.toLowerCase().includes("festive spin") && (
                        <div className="flex items-center justify-between gap-2">
                            <span>{comp.title}</span>
                        </div>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCompetition && (
                <Button
                  onClick={() => refetchPrizes()}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedCompetition && (
          <>
            {/* Actions Bar - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
              {/* Search - Full width on mobile */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search prizes by name, value, or quantity..."
                  className="pl-10 w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              {/* Add Prize Button - Responsive */}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
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

            {/* Prizes Table - Mobile Optimized with Horizontal Scroll */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Prizes</CardTitle>
                <CardDescription>
                  Showing {filteredPrizes.length} of {prizes.length} prizes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {prizesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : filteredPrizes.length === 0 ? (
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
                    {/* Mobile Card View (Visible on small screens) */}
                    <div className="block sm:hidden space-y-3 p-3">
                      {filteredPrizes.map((prize) => {
                        const stockStatus = getPrizeStatus(prize.remainingQuantity);
                        return (
                          <Card key={prize.id} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                  <h3 className="font-semibold text-base break-words flex-1">
                                    {prize.prizeName}
                                  </h3>
                                </div>
                                <Badge variant={stockStatus.variant as any}>
                                  {stockStatus.label}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Value</p>
                                  <p className="font-bold text-green-500">
                                    £{typeof prize.prizeValue === 'number' 
                                      ? prize.prizeValue.toFixed(2) 
                                      : Number(prize.prizeValue || 0).toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Total</p>
                                  <p className="font-medium">{prize.totalQuantity}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Remaining</p>
                                  <p className="font-medium">{prize.remainingQuantity}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleEdit(prize)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => handleDelete(prize)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Desktop Table View (Hidden on mobile) */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Prize Name</TableHead>
                            <TableHead className="whitespace-nowrap">Value</TableHead>
                            <TableHead className="whitespace-nowrap">Total</TableHead>
                            <TableHead className="whitespace-nowrap">Remaining</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="whitespace-nowrap">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPrizes.map((prize) => {
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
              Please select a competition from the dropdown above to manage its prizes.
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