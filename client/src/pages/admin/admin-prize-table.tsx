// admin-prize-table.tsx
import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Gift, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useParams } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Types
interface GamePrize {
  id: number;
  gameId: string;
  title: string;
  value: number | null;
  totalQty: number;
  remainingQty: number;
  createdAt: string;
}

// Zod schemas
const createPrizeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  value: z.number().nullable().optional(),
  totalQty: z.number().int().min(0, "Quantity must be 0 or greater"),
  remainingQty: z.number().int().min(0, "Quantity must be 0 or greater").optional(),
});

const updatePrizeSchema = createPrizeSchema.partial();

type CreatePrizeFormData = z.infer<typeof createPrizeSchema>;
type UpdatePrizeFormData = z.infer<typeof updatePrizeSchema>;

// Prize Form Component
function PrizeForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initialData?: GamePrize;
  onSubmit: (data: CreatePrizeFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePrizeFormData>({
    resolver: zodResolver(createPrizeSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          value: initialData.value || undefined,
          totalQty: initialData.totalQty,
          remainingQty: initialData.remainingQty,
        }
      : {
          title: "",
          value: undefined,
          totalQty: 0,
          remainingQty: undefined,
        },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Prize Title</Label>
        <Input
          id="title"
          placeholder="e.g., £1000 Cash, iPhone 15, Gift Card"
          {...register("title")}
          className="w-full"
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="value">Value</Label>
        <Input
          id="value"
          type="number"
          step="0.01"
          placeholder="e.g., 1000"
          {...register("value", { valueAsNumber: true })}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Monetary value of the prize (if applicable)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="totalQty">Total Quantity</Label>
          <Input
            id="totalQty"
            type="number"
            min="0"
            placeholder="Total available"
            {...register("totalQty", { valueAsNumber: true })}
            className="w-full"
          />
          {errors.totalQty && (
            <p className="text-sm text-red-500 mt-1">{errors.totalQty.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="remainingQty">Remaining Quantity</Label>
          <Input
            id="remainingQty"
            type="number"
            min="0"
            placeholder="Remaining"
            {...register("remainingQty", { valueAsNumber: true })}
            className="w-full"
          />
        </div>
      </div>

      <DialogFooter className="mt-6 flex-col sm:flex-row gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? "Saving..." : initialData ? "Update Prize" : "Add Prize"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Mobile Prize Card Component
function MobilePrizeCard({ prize, onEdit }: { prize: GamePrize; onEdit: (prize: GamePrize) => void }) {
  const [expanded, setExpanded] = useState(false);
  const sold = prize.totalQty - prize.remainingQty;
  const soldPercentage = prize.totalQty > 0 ? Math.round((sold / prize.totalQty) * 100) : 0;

  return (
    <div className="border rounded-lg p-4 mb-3 bg-card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base truncate pr-2">{prize.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            {prize.value ? (
              <span className="text-primary font-medium text-sm">
                {/points?|pts?/i.test(prize.title)
                  ? `${prize.value.toLocaleString()} pts`
                  : `£${prize.value.toLocaleString()}`}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">No value</span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(prize)}
          className="h-8 w-8 flex-shrink-0"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-center text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Total</p>
          <p className="font-medium">{prize.totalQty}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Remaining</p>
          <p className={`font-medium ${prize.remainingQty === 0 ? "text-red-500" : ""}`}>
            {prize.remainingQty}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Sold</p>
          <p className="font-medium">
            {sold} <span className="text-xs text-muted-foreground">({soldPercentage}%)</span>
          </p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="w-full mt-2 text-xs"
      >
        {expanded ? (
          <>Show Less <ChevronUp className="h-3 w-3 ml-1" /></>
        ) : (
          <>Show Details <ChevronDown className="h-3 w-3 ml-1" /></>
        )}
      </Button>

      {expanded && (
        <div className="mt-3 pt-3 border-t text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prize ID:</span>
            <span className="font-mono text-xs">{prize.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span>{new Date(prize.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPrizeTable() {
  const params = useParams();
  const gameId = params.gameId;
  const { toast } = useToast();
  
  // State for dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<GamePrize | null>(null);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);

  // Fetch prizes for this competition
  const { data: prizes, isLoading } = useQuery<GamePrize[]>({
    queryKey: [`/games/admin/${gameId}/prizes`],
    enabled: !!gameId,
  });

  // Create prize mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreatePrizeFormData) => {
      const res = await apiRequest(`/games/admin/${gameId}/prizes`, "POST", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/games/admin/${gameId}/prizes`] });
      setCreateDialogOpen(false);
      toast({ title: "Prize added successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add prize",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update prize mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePrizeFormData }) => {
      const res = await apiRequest(`/games/admin/prizes/${id}`, "PUT", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/games/admin/${gameId}/prizes`] });
      setEditingPrize(null);
      toast({ title: "Prize updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update prize",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear all prizes mutation
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/games/admin/${gameId}/prizes`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/games/admin/${gameId}/prizes`] });
      setClearAllConfirmOpen(false);
      toast({ title: "All prizes cleared successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to clear prizes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link to="/admin/ringtone-plinko">
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
                Prize Table
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage prizes for games
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="w-full sm:w-auto"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Prize
            </Button>
            {prizes && prizes.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setClearAllConfirmOpen(true)}
                className="w-full sm:w-auto"
                disabled={clearAllMutation.isPending}
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards - Mobile Optimized */}
        {prizes && prizes.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <Card className="col-span-1">
              <CardHeader className="p-3 sm:p-4 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Total Prizes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <p className="text-lg sm:text-2xl font-bold">{prizes.length}</p>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="p-3 sm:p-4 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Total Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <p className="text-lg sm:text-2xl font-bold">
                  {prizes.reduce((sum, p) => sum + p.totalQty, 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="p-3 sm:p-4 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Remaining
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <p className="text-lg sm:text-2xl font-bold">
                  {prizes.reduce((sum, p) => sum + p.remainingQty, 0)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Prizes Section */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Prizes ({prizes?.length || 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {!prizes || prizes.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-4 border border-dashed rounded-lg mx-4 sm:mx-6 mb-4 sm:mb-6">
                <Gift className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  No prizes added yet
                </p>
                <Button 
                  onClick={() => setCreateDialogOpen(true)} 
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Prize
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table View - Hidden on Mobile */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Prize</TableHead>
                        <TableHead className="whitespace-nowrap">Value</TableHead>
                        <TableHead className="text-center whitespace-nowrap">Total Qty</TableHead>
                        <TableHead className="text-center whitespace-nowrap">Remaining</TableHead>
                        <TableHead className="text-center whitespace-nowrap">Sold</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prizes.map((prize) => {
                        const sold = prize.totalQty - prize.remainingQty;
                        const soldPercentage = prize.totalQty > 0 
                          ? Math.round((sold / prize.totalQty) * 100) 
                          : 0;

                        return (
                          <TableRow key={prize.id}>
                            <TableCell className="font-medium">{prize.title}</TableCell>
                            <TableCell>
                              {prize.value ? (
                                <span className="text-primary font-medium">
                                  {/points?|pts?/i.test(prize.title)
                                    ? `${prize.value.toLocaleString()} pts`
                                    : `£${prize.value.toLocaleString()}`}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{prize.totalQty}</TableCell>
                            <TableCell className="text-center">
                              <span className={prize.remainingQty === 0 ? "text-red-500 font-medium" : ""}>
                                {prize.remainingQty}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span>{sold}</span>
                                {prize.totalQty > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    ({soldPercentage}%)
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingPrize(prize)}
                                  className="h-8 w-8"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View - Hidden on Desktop */}
                <div className="sm:hidden px-4 pb-4">
                  {prizes.map((prize) => (
                    <MobilePrizeCard 
                      key={prize.id} 
                      prize={prize} 
                      onEdit={setEditingPrize}
                    />
                  ))}
                  
                 
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Create Prize Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg">Add New Prize</DialogTitle>
            </DialogHeader>
            <PrizeForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setCreateDialogOpen(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Prize Dialog */}
        <Dialog open={!!editingPrize} onOpenChange={(open) => !open && setEditingPrize(null)}>
          <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg">Edit Prize</DialogTitle>
            </DialogHeader>
            {editingPrize && (
              <PrizeForm
                initialData={editingPrize}
                onSubmit={(data) =>
                  updateMutation.mutate({ id: editingPrize.id, data })
                }
                onCancel={() => setEditingPrize(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Clear All Confirmation Dialog */}
        <Dialog open={clearAllConfirmOpen} onOpenChange={setClearAllConfirmOpen}>
          <DialogContent className="w-[95vw] max-w-sm mx-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg">Clear All Prizes</DialogTitle>
            </DialogHeader>
            <p className="text-sm sm:text-base text-muted-foreground">
              Are you sure you want to clear all prizes? This action cannot be undone.
            </p>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
              <Button
                variant="outline"
                onClick={() => setClearAllConfirmOpen(false)}
                disabled={clearAllMutation.isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => clearAllMutation.mutate()}
                disabled={clearAllMutation.isPending}
                className="w-full sm:w-auto"
              >
                {clearAllMutation.isPending ? "Clearing..." : "Clear All"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}