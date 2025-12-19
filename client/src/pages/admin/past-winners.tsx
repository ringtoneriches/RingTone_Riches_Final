import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Upload, ArrowBigRight, ArrowBigLeft, Calendar, Search } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface Winner {
  id: string;
  userId: string;
  competitionId: string | null;
  prizeDescription: string;
  prizeValue: string;
  imageUrl: string | null;
  isShowcase: boolean;
  createdAt: string;
}

interface WinnerWithDetails {
  winners: Winner;
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  competitions: {
    id: string;
    title: string;
  } | null;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Competition {
  id: string;
  title: string;
}

interface WinnerFormData {
  userId: string;
  competitionId: string;
  prizeDescription: string;
  prizeValue: string;
  imageUrl: string;
  isShowcase: boolean;
}

interface WinnerPayload {
  userId: string;
  competitionId: string | null;
  prizeDescription: string;
  prizeValue: string;
  imageUrl: string | null;
  isShowcase?: boolean; 
}
type DateFilter = "all" | "1h" | "24h" | "7d" | "30d" | "custom";

function WinnerForm({
  data,
  onSubmit,
  onCancel,
  isLoading,
}: {
  data?: Winner;
  onSubmit: (formData: WinnerPayload) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<WinnerFormData>({
    userId: data?.userId || "",
    competitionId: data?.competitionId || "",
    prizeDescription: data?.prizeDescription || "",
    prizeValue: data?.prizeValue || "",
    imageUrl: data?.imageUrl || "",
    isShowcase: data?.isShowcase || false,
  });
  const [uploading, setUploading] = useState(false);

  // Fetch users for selection
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch competitions for selection
  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload/competition-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      const { imagePath } = await response.json();
      setForm({ ...form, imageUrl: imagePath });
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>User *</Label>
        <Select
          value={form.userId}
          onValueChange={(value) => setForm({ ...form, userId: value })}
        >
          <SelectTrigger data-testid="select-user">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Competition (Optional)</Label>
        <Select
          value={form.competitionId || "none"}
          onValueChange={(value) => setForm({ ...form, competitionId: value === "none" ? "" : value })}
        >
          <SelectTrigger data-testid="select-competition">
            <SelectValue placeholder="Select a competition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {competitions.map((comp) => (
              <SelectItem key={comp.id} value={comp.id}>
                {comp.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Prize Description *</Label>
        <Textarea
          value={form.prizeDescription}
          onChange={(e) => setForm({ ...form, prizeDescription: e.target.value })}
          placeholder="e.g., BMW M4 Competition, £5000 Cash Prize"
          rows={3}
          data-testid="input-prize-description"
        />
      </div>

      <div>
        <Label>Prize Value *</Label>
        <Input
          value={form.prizeValue}
          onChange={(e) => setForm({ ...form, prizeValue: e.target.value })}
          placeholder="e.g., £50,000, 10,000 Ringtones"
          data-testid="input-prize-value"
        />
      </div>

      <div>
        <Label>Prize Image</Label>
        <div className="space-y-2">
          <Input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="Image URL or upload a file"
            data-testid="input-image-url"
          />
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
           
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              data-testid="button-upload-image"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Image"}
            </Button>
          </div>
          {form.imageUrl && (
            <div className="mt-2">
              <img
                src={form.imageUrl}
                alt="Prize preview"
                className="max-w-full h-32 object-contain rounded border"
              />
            </div>
          )}
        </div>
      </div>


{data && (
  <div className="flex items-center gap-2 mt-2">
    <input
      type="checkbox"
      id="isShowcase"
      checked={form.isShowcase}
      onChange={(e) =>
        setForm({ ...form, isShowcase: e.target.checked })
      }
    />
    <label htmlFor="isShowcase" className="text-sm font-medium">
      Show in Showcase
    </label>
    <span className="text-xs text-gray-500 ml-2">
      (Check to show on public winners page)
    </span>
  </div>
)}

{data && (
  <div className="text-xs text-gray-500 mt-2">
    ⓘ New winners are automatically shown in the showcase
  </div>
)}
      <DialogFooter className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          data-testid="button-cancel"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => {
            // Normalize empty strings to null for optional fields
            const payload: WinnerPayload = {
              ...form,
              competitionId: form.competitionId || null,
              imageUrl: form.imageUrl || null,
               isShowcase: data ? form.isShowcase : true,
            };
            onSubmit(payload);
          }}
          disabled={isLoading || !form.userId || !form.prizeDescription || !form.prizeValue}
          data-testid="button-submit"
        >
          {isLoading ? "Saving..." : data ? "Update Winner" : "Add Winner"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function AdminPastWinners() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWinner, setEditingWinner] = useState<Winner | undefined>();
  const [deletingWinner, setDeletingWinner] = useState<Winner | undefined>();
   const [currentPage , setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [dateFilter, setDateFilter] = useState<DateFilter>("1h");
   const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
 
  // Calculate date range (memoized to prevent infinite loops)
  const { dateFrom, dateTo } = useMemo(() => {
    if (dateFilter === "all") {
      return { dateFrom: "", dateTo: "" };
    }

    const now = new Date();
    let dateFrom = "";
    let dateTo = "";

    switch (dateFilter) {
        case "1h":
    dateFrom = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
    break;
      case "24h":
        dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case "7d":
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case "30d":
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case "custom":
        dateFrom = customDateFrom ? new Date(customDateFrom).toISOString() : "";
        dateTo = customDateTo ? new Date(customDateTo).toISOString() : "";
        break;
    }

    return { dateFrom, dateTo };
  }, [dateFilter, customDateFrom, customDateTo]);
  // Fetch winners with user and competition details
  const { data: winnersData = [], isLoading } = useQuery<WinnerWithDetails[]>({
  queryKey: ["/api/admin/winners", dateFrom, dateTo], // ⬅ IMPORTANT
  queryFn: async () => {
    const url = new URL("/api/admin/winners", window.location.origin);

    if (dateFrom) url.searchParams.append("dateFrom", dateFrom);
    if (dateTo) url.searchParams.append("dateTo", dateTo);

    const res = await fetch(url.toString());
    return res.json();
  },
});

 const winners = useMemo(() => {
  if (!winnersData) return [];

  if (!searchInput.trim()) return winnersData;

  const searchLower = searchInput.toLowerCase().trim();

  return winnersData.filter((item) => {
    const fullName = `${item.users?.firstName || ""} ${item.users?.lastName || ""}`
      .toLowerCase()
      .trim();

    const email = item.users?.email?.toLowerCase() || "";
    const competition = item.competitions?.title?.toLowerCase() || "";
    const winnerId = item.winners?.id?.toLowerCase() || "";
    const prizeDescription = item.winners?.prizeDescription?.toLowerCase() || "";
    const prizeValue = item.winners?.prizeValue?.toLowerCase() || "";

    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      competition.includes(searchLower) ||
      prizeDescription.includes(searchLower) ||
      prizeValue.includes(searchLower) ||
      winnerId.includes(searchLower)
    );
  });
}, [winnersData, searchInput]);



  const totalPages= Math.ceil(winners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWinners  = winners.slice(startIndex , startIndex + itemsPerPage);
  // Create winner mutation
  const createMutation = useMutation({
    mutationFn: async (data: WinnerPayload) => {
      return await apiRequest("/api/admin/winners", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/winners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      toast({
        title: "Success",
        description: "Winner added successfully",
      });
      setDialogOpen(false);
      setEditingWinner(undefined);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add winner",
      });
    },
  });

  // Update winner mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WinnerPayload }) => {
      return await apiRequest(`/api/admin/winners/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/winners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      toast({
        title: "Success",
        description: "Winner updated successfully",
      });
      setDialogOpen(false);
      setEditingWinner(undefined);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update winner",
      });
    },
  });

  // Delete winner mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/winners/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/winners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      toast({
        title: "Success",
        description: "Winner deleted successfully",
      });
      setDeletingWinner(undefined);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete winner",
      });
    },
  });

  const handleSubmit = (payload: WinnerPayload) => {
  //    console.log('Submitting winner payload:', payload);
  // console.log('isShowcase value:', payload.isShowcase, 'Type:', typeof payload.isShowcase);
    if (editingWinner) {
      updateMutation.mutate({ id: editingWinner.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (winner: WinnerWithDetails) => {
  //     console.log("Editing winner:", {
  //   id: winner.winners.id,
  //   isShowcase: winner.winners.isShowcase, // Check if this is true/false
  //   prize: winner.winners.prizeDescription
  // });
    setEditingWinner(winner.winners);
    setDialogOpen(true);
  };

  const handleDelete = (winner: WinnerWithDetails) => {
    setDeletingWinner(winner.winners);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Past Winners Management</h1>
          <Button
            onClick={() => {
              setEditingWinner(undefined);
              setDialogOpen(true);
            }}
            data-testid="button-add-winner"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Winner
          </Button>
        </div>
 {/* Date Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground mr-2">Date Range:</span>
          <Button
            variant={dateFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("all")}
            data-testid="button-filter-all"
          >
            All Time
          </Button>
          
          <Button
            variant={dateFilter === "1h" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("1h")}
            data-testid="button-filter-1h"
          >
            Last 1 Hour
          </Button>
          <Button
            variant={dateFilter === "24h" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("24h")}
            data-testid="button-filter-24h"
          >
            Last 24 Hours
          </Button>
          <Button
            variant={dateFilter === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("7d")}
            data-testid="button-filter-7d"
          >
            Last 7 Days
          </Button>
          <Button
            variant={dateFilter === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("30d")}
            data-testid="button-filter-30d"
          >
            Last 30 Days
          </Button>
          <Button
            variant={dateFilter === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("custom")}
            data-testid="button-filter-custom"
          >
            Custom Range
          </Button>
        </div>
         {/* Custom Date Range Inputs */}
                {dateFilter === "custom" && (
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-foreground">From:</label>
                      <Input
                        type="date"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                        className="w-auto"
                        data-testid="input-date-from"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-foreground">To:</label>
                      <Input
                        type="date"
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                        className="w-auto"
                        data-testid="input-date-to"
                      />
                    </div>
                  </div>
                )}

                <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search orders by user email or competition..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            data-testid="input-search-orders"
          />
        </div>
        {isLoading ? (
          <div className="text-center py-8">Loading winners...</div>
        ) : paginatedWinners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No winners found. Add your first winner to get started.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Winner</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Prize Description</TableHead>
                  <TableHead>Prize Value</TableHead>
                  <TableHead>Showcase</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedWinners.map((item) => (
                  <TableRow key={item.winners.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {item.users?.firstName} {item.users?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.users?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.competitions?.title ||(
                        <span className="text-muted-foreground">No competition</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.winners.prizeDescription}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {item.winners.prizeValue}
                    </TableCell>
                     <TableCell>
        {item.winners.isShowcase ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Yes
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            No
          </span>
        )}
      </TableCell>
                    <TableCell>
                      {new Date(item.winners.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          data-testid={`button-edit-${item.winners.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          data-testid={`button-delete-${item.winners.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

         {/* PAGINATION */}
        <div className="flex justify-center items-center gap-4 my-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
          >
            <ArrowBigLeft />
          </Button>

          <span className="font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
          >
             <ArrowBigRight />
          </Button>
        </div>

        {/* ENTRY COUNT */}
        <p className="text-center text-sm text-muted-foreground">
          Showing {paginatedWinners.length} of {winnersData.length} filtered entries
        </p>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingWinner ? "Edit Winner" : "Add New Winner"}
              </DialogTitle>
            </DialogHeader>
            <WinnerForm
              data={editingWinner}
              onSubmit={handleSubmit}
              onCancel={() => {
                setDialogOpen(false);
                setEditingWinner(undefined);
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingWinner}
          onOpenChange={(open) => !open && setDeletingWinner(undefined)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this winner from the showcase. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingWinner && deleteMutation.mutate(deletingWinner.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
     

    </AdminLayout>
  );
}
