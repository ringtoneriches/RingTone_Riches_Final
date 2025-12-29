import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Upload, ArrowBigRight, ArrowBigLeft, Calendar, Search, ArrowUpDown, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
type ShowcaseFilter = "all" | "showcase" | "not-showcase";

// Add sort field types
type SortField = 'winner' | 'competition' | 'prizeDescription' | 'prizeValue' | 'showcase' | 'dateAdded';
type SortOrder = 'asc' | 'desc' | null;


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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [dateFilter, setDateFilter] = useState<DateFilter>("1h");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showBulkRemoveDialog, setShowBulkRemoveDialog] = useState(false);
const [isBulkRemoving, setIsBulkRemoving] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  
  const [sortByShowcase, setSortByShowcase] = useState<"showcase-first" | "not-showcase-first" | null>(null);
  
  // Calculate date range
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
    queryKey: ["/api/admin/winners", dateFrom, dateTo],
    queryFn: async () => {
      const url = new URL("/api/admin/winners", window.location.origin);
      if (dateFrom) url.searchParams.append("dateFrom", dateFrom);
      if (dateTo) url.searchParams.append("dateTo", dateTo);
      const res = await fetch(url.toString());
      return res.json();
    },
  });


// Handle sorting
const handleSort = (field: SortField) => {
  if (sortField === field) {
    // Cycle through: asc -> desc -> null
    if (sortOrder === "asc") {
      setSortOrder("desc");
    } else if (sortOrder === "desc") {
      setSortField(null);
      setSortOrder(null);
    } else {
      setSortOrder("asc");
      setSortField(field);
    }
  } else {
    // New field, start with asc
    setSortField(field);
    setSortOrder("asc");
  }
};

// Get sort icon for a field
const getSortIcon = (field: SortField) => {
  if (sortField === field) {
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  } else {
    // Show neutral chevrons (both up and down)
    return (
      <div className="inline-flex flex-col ml-1">
        <ChevronUp className="w-3 h-3 -mb-1 text-gray-400 opacity-50" />
        <ChevronDown className="w-3 h-3 text-gray-400 opacity-50" />
      </div>
    );
  }
};



// Helper function to extract numeric value ONLY from £ amounts
const extractPrizeValue = (prize: string): number => {
  // Match £ followed by numbers with commas/decimals
  const poundMatch = prize.match(/£\s*([\d,.]+)/);
  if (poundMatch) {
    // Remove commas and convert to number
    const cleanNumber = poundMatch[1].replace(/,/g, '');
    return parseFloat(cleanNumber) || 0;
  }
  
  // Return 0 for non-£ prizes (ringtones, etc.)
  return 0;
};

  
// Update your winners useMemo to include all sorting
const winners = useMemo(() => {
  if (!winnersData) return [];

  let filtered = [...winnersData];

  // Apply search filter
  if (searchInput.trim()) {
    const searchLower = searchInput.toLowerCase().trim();
    filtered = filtered.filter((item) => {
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
  }

  // Apply sorting based on sortField and sortOrder
  if (sortField && sortOrder) {
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'winner':
          aValue = `${a.users?.firstName || ''} ${a.users?.lastName || ''}`.toLowerCase();
          bValue = `${b.users?.firstName || ''} ${b.users?.lastName || ''}`.toLowerCase();
          break;
          
        case 'competition':
          aValue = a.competitions?.title?.toLowerCase() || '';
          bValue = b.competitions?.title?.toLowerCase() || '';
          break;
          
        case 'prizeDescription':
          aValue = a.winners.prizeDescription.toLowerCase();
          bValue = b.winners.prizeDescription.toLowerCase();
          break;
          
        case 'prizeValue':
  // Extract only £ values, treat non-£ as 0
  const aNum = extractPrizeValue(a.winners.prizeValue);
  const bNum = extractPrizeValue(b.winners.prizeValue);
  
  // Sort by £ amount (0 for non-£ prizes)
  if (sortOrder === 'asc') {
    return aNum - bNum; // Low to high
  } else {
    return bNum - aNum; // High to low
  }
  break;
          
        case 'showcase':
          aValue = a.winners.isShowcase ? 1 : 0;
          bValue = b.winners.isShowcase ? 1 : 0;
          break;
          
        case 'dateAdded':
          aValue = new Date(a.winners.createdAt).getTime();
          bValue = new Date(b.winners.createdAt).getTime();
          break;
          
        default:
          return 0;
      }
      
      // For string comparisons
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // For number comparisons (including showcase)
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }

  return filtered;
}, [winnersData, searchInput, sortField, sortOrder]); // Add sortField and sortOrder to dependencies
  const totalPages = Math.ceil(winners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWinners = winners.slice(startIndex, startIndex + itemsPerPage);

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
    if (editingWinner) {
      updateMutation.mutate({ id: editingWinner.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (winner: WinnerWithDetails) => {
    setEditingWinner(winner.winners);
    setDialogOpen(true);
  };

  const handleDelete = (winner: WinnerWithDetails) => {
    setDeletingWinner(winner.winners);
  };

  // Sort functions
  const handleSortShowcaseFirst = () => {
    setSortByShowcase("showcase-first");
  };

  const handleSortNotShowcaseFirst = () => {
    setSortByShowcase("not-showcase-first");
  };

  const handleClearSort = () => {
    setSortByShowcase(null);
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

        

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search winners by user, competition, prize..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
              data-testid="input-search-winners"
            />
          </div>

<Button
  onClick={() => {
    const showcaseWinners = winners.filter(w => w.winners.isShowcase);
    
    if (showcaseWinners.length === 0) {
      toast({
        title: "No showcase winners",
        description: "There are no winners in the showcase to remove.",
      });
      return;
    }
    setShowBulkRemoveDialog(true);
  }}
  variant="outline"
  className=""
  disabled={winners.filter(w => w.winners.isShowcase).length === 0}
>
  <EyeOff className="h-4 w-4 mr-2" />
  Remove All from Showcase
</Button>

          {/* Sort Dropdown */}
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort by Showcase
                {sortByShowcase && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                    {sortByShowcase === "showcase-first" ? "Showcase" : "Not Showcase"}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleSortShowcaseFirst}>
                <Eye className="h-4 w-4 mr-2 text-green-600" />
                Showcase Winners
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSortNotShowcaseFirst}>
                <EyeOff className="h-4 w-4 mr-2 text-gray-600" />
                Non-Showcase Winners
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearSort} disabled={!sortByShowcase}>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Clear Sorting
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </div>

        {/* Sort Indicator */}
        {/* {sortByShowcase && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Sorted by:</span>
            <span className="font-medium">
              {sortByShowcase === "showcase-first" ? "Showcase Winners First" : "Non-Showcase Winners First"}
            </span>
            <Button variant="ghost" size="sm" onClick={handleClearSort} className="h-6 px-2">
              Clear
            </Button>
          </div>
        )} */}



        {/* Showcase Statistics */}
        {/* <div className="flex gap-4 text-sm">
          <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-md">
            <span className="font-medium text-green-700">Showcase Winners:</span>
            <span className="ml-2 text-green-900">
              {winners.filter(w => w.winners.isShowcase).length}
            </span>
          </div>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
            <span className="font-medium text-gray-700">Non-Showcase Winners:</span>
            <span className="ml-2 text-gray-900">
              {winners.filter(w => !w.winners.isShowcase).length}
            </span>
          </div>
        </div> */}

{/* Add this near your other controls if you want a clear button */}
{/* {sortField && (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <span>Sorted by: 
      <span className="font-medium ml-1 capitalize">
        {sortField.replace(/([A-Z])/g, ' $1')} 
        ({sortOrder === 'asc' ? 'ascending' : 'descending'})
      </span>
    </span>
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => {
        setSortField(null);
        setSortOrder(null);
      }}
      className="h-6 px-2"
    >
      Clear
    </Button>
  </div>
)} */}

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
      <TableHead 
        className="cursor-pointer hover:bg-muted transition-colors"
        onClick={() => handleSort('winner')}
      >
        <div className="flex items-center">
          Winner
          {getSortIcon('winner')}
        </div>
      </TableHead>
      
      <TableHead 
        className="cursor-pointer hover:bg-muted transition-colors"
        onClick={() => handleSort('competition')}
      >
        <div className="flex items-center">
          Competition
          {getSortIcon('competition')}
        </div>
      </TableHead>
      
      <TableHead 
        className="cursor-pointer hover:bg-muted transition-colors"
        onClick={() => handleSort('prizeDescription')}
      >
        <div className="flex items-center">
          Prize Description
          {getSortIcon('prizeDescription')}
        </div>
      </TableHead>
      
      <TableHead 
        className="cursor-pointer hover:bg-muted transition-colors"
        onClick={() => handleSort('prizeValue')}
      >
        <div className="flex items-center">
          Prize Value
          {getSortIcon('prizeValue')}
        </div>
      </TableHead>
      
      <TableHead 
        className="cursor-pointer hover:bg-muted transition-colors"
        onClick={() => handleSort('showcase')}
      >
        <div className="flex items-center">
          <Eye className="h-4 w-4 mr-1" />
          Showcase
          {getSortIcon('showcase')}
        </div>
      </TableHead>
      
      <TableHead 
        className="cursor-pointer hover:bg-muted transition-colors"
        onClick={() => handleSort('dateAdded')}
      >
        <div className="flex items-center">
          Date Added
          {getSortIcon('dateAdded')}
        </div>
      </TableHead>
      
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {/* Table body remains the same */}
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
          {item.competitions?.title || (
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
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4 text-green-600" />
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-light bg-green-600 text-white">
                In Showcase
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <EyeOff className="h-4 w-4 text-gray-600" />
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-light bg-red-600 text-white">
                Not in Showcase
              </span>
            </div>
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
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ArrowBigLeft />
          </Button>

          <span className="font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ArrowBigRight />
          </Button>
        </div>

        {/* ENTRY COUNT */}
        <p className="text-center text-sm text-muted-foreground">
          Showing {paginatedWinners.length} of {winners.length} filtered entries
          {sortByShowcase && (
            <span className="ml-2 text-primary">
              • Sorted by {sortByShowcase === "showcase-first" ? "Showcase First" : "Non-Showcase First"}
            </span>
          )}
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

<Dialog open={showBulkRemoveDialog} onOpenChange={setShowBulkRemoveDialog}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <EyeOff className="h-5 w-5 text-amber-600" />
        Remove Winners from Showcase
      </DialogTitle>
      <DialogDescription>
        This action will remove {winners.filter(w => w.winners.isShowcase).length} winners from the public showcase
      </DialogDescription>
    </DialogHeader>
    
    <div className="py-4">
      <div className="mb-4 p-4 border border-white  text-white rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium ">Winners to be removed:</h4>
            <p className="text-sm  mt-1">
              {winners.filter(w => w.winners.isShowcase).length} winner(s) will be set to non-showcase
            </p>
          </div>
          <div className="text-3xl font-bold ">
            {winners.filter(w => w.winners.isShowcase).length}
          </div>
        </div>
        
        {/* List of affected winners */}
        {/* <div className="mt-4 max-h-60 overflow-y-auto border-t border-amber-200 pt-3">
          <h5 className="text-sm font-medium text-amber-700 mb-2">Affected Winners:</h5>
          <div className="space-y-2">
            {winners
              .filter(w => w.winners.isShowcase)
              .slice(0, 10) // Show first 10 only
              .map((winner, index) => (
                <div 
                  key={winner.winners.id} 
                  className="flex items-center gap-3 p-2 bg-white rounded border border-amber-100 hover:bg-amber-50"
                >
                  <div className="w-6 h-6 flex items-center justify-center bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {winner.users?.firstName} {winner.users?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {winner.winners.prizeDescription}
                    </p>
                  </div>
                  <div className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded">
                    Showcase
                  </div>
                </div>
              ))}
            
            {winners.filter(w => w.winners.isShowcase).length > 10 && (
              <div className="text-center py-2 text-sm text-gray-500 border-t border-amber-100">
                ... and {winners.filter(w => w.winners.isShowcase).length - 10} more winners
              </div>
            )}
          </div>
        </div> */}
      </div>
      
      <div className=" p-4 border border-white text-white rounded-lg">
        <h4 className="font-medium  mb-2">What will happen:</h4>
        <ul className="text-sm  space-y-1">
          <li className="flex items-start gap-2">
            <div className="w-5 h-5 flex items-center justify-center rounded-full mt-0.5">
              <EyeOff className="h-3 w-3 " />
            </div>
            <span>Winners will no longer appear on Past Winners</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-5 h-5 flex items-center justify-center rounded-full mt-0.5">
              <span className="text-xs">📋</span>
            </div>
            <span>Winners will still be visible in the admin panel</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-5 h-5 flex items-center justify-center rounded-full mt-0.5">
              <span className="text-xs">🔄</span>
            </div>
            <span>You can add them back to showcase individually anytime</span>
          </li>
        </ul>
      </div>
    </div>
    
    <DialogFooter className="flex-col sm:flex-row gap-2">
      <Button
        variant="outline"
        onClick={() => setShowBulkRemoveDialog(false)}
        className="w-full sm:w-auto"
        disabled={isBulkRemoving}
      >
        Cancel
      </Button>
      <Button
        onClick={async () => {
          setIsBulkRemoving(true);
          const showcaseWinners = winners.filter(w => w.winners.isShowcase);
          
          try {
            // Create array of promises to update all showcase winners
            const updatePromises = showcaseWinners.map(winner =>
              updateMutation.mutateAsync({
                id: winner.winners.id,
                data: {
                  userId: winner.winners.userId,
                  competitionId: winner.winners.competitionId,
                  prizeDescription: winner.winners.prizeDescription,
                  prizeValue: winner.winners.prizeValue,
                  imageUrl: winner.winners.imageUrl,
                  isShowcase: false
                }
              })
            );

            // Execute all updates
            await Promise.all(updatePromises);
            
            toast({
              title: "Success",
              description: `Removed ${showcaseWinners.length} winners from showcase`,
            });
            setShowBulkRemoveDialog(false);
          } catch (error) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to remove some winners from showcase",
            });
          } finally {
            setIsBulkRemoving(false);
          }
        }}
        variant="destructive"
        className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
        disabled={isBulkRemoving}
      >
        {isBulkRemoving ? (
          <>
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Removing...
          </>
        ) : (
          <>
            <EyeOff className="h-4 w-4 mr-2" />
            Remove All ({winners.filter(w => w.winners.isShowcase).length})
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
        
      </div>
    </AdminLayout>
  );
}