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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";


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
  const [openUserSelect, setOpenUserSelect] = useState(false);
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

  <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={openUserSelect}
        className="w-full justify-between"
      >
        {form.userId
          ? users.find((u) => u.id === form.userId)?.firstName +
            " " +
            users.find((u) => u.id === form.userId)?.lastName
          : "Select user"}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>

    <PopoverContent className="min-w-[600px] max-w-[200px]  p-0">
      <Command>
        <CommandInput placeholder="Search user by name or email..." />
        <CommandEmpty>No user found.</CommandEmpty>

        <CommandGroup className="max-h-64 overflow-y-auto">
          {users.map((user) => (
            <CommandItem
              key={user.id}
              value={`${user.firstName} ${user.lastName} ${user.email}`}
              onSelect={() => {
                setForm({ ...form, userId: user.id });
                setOpenUserSelect(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  form.userId === user.id ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex flex-col">
                <span className="font-medium">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
    </PopoverContent>
  </Popover>
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
// Update your winners useMemo to include all sorting AND duplicate filtering
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

  // 🔍 REMOVE DUPLICATES
  // Create a map to track unique combinations
  const uniqueWinners = new Map();
  const deduplicated = [];

  for (const winner of filtered) {
    // Create a unique key based on user, competition, prize, and time (within 5 seconds)
    const userKey = winner.users?.id || "";
    const competitionKey = winner.competitions?.id || "none";
    const prizeKey = winner.winners.prizeValue;
    const descriptionKey = winner.winners.prizeDescription;
    
    // Round timestamp to nearest minute to catch duplicates that happened at similar times
    const timestamp = new Date(winner.winners.createdAt);
    const roundedTime = new Date(
      timestamp.getFullYear(),
      timestamp.getMonth(),
      timestamp.getDate(),
      timestamp.getHours(),
      timestamp.getMinutes()
    ).getTime();
    
    const uniqueKey = `${userKey}-${competitionKey}-${prizeKey}-${descriptionKey}-${roundedTime}`;
    
    // If we haven't seen this combination before, add it
    if (!uniqueWinners.has(uniqueKey)) {
      uniqueWinners.set(uniqueKey, true);
      deduplicated.push(winner);
    } else {
      // Log duplicate found (optional)
      console.log("Duplicate winner filtered out:", {
        userId: userKey,
        competitionId: competitionKey,
        prizeValue: prizeKey,
        description: descriptionKey,
        createdAt: winner.winners.createdAt
      });
    }
  }

  // Update filtered to use deduplicated array
  filtered = deduplicated;

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
}, [winnersData, searchInput, sortField, sortOrder]);

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
    <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Past Winners Management</h1>
        </div>
        <Button
          onClick={() => {
            setEditingWinner(undefined);
            setDialogOpen(true);
          }}
          className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2.5"
          data-testid="button-add-winner"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Add Winner
        </Button>
      </div>
  
      {/* Date Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
          <span className="text-xs sm:text-sm font-medium text-foreground">Date Range:</span>
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <Button
            variant={dateFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("all")}
            className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            data-testid="button-filter-all"
          >
            All
          </Button>
          <Button
            variant={dateFilter === "1h" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("1h")}
            className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            data-testid="button-filter-1h"
          >
            1H
          </Button>
          <Button
            variant={dateFilter === "24h" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("24h")}
            className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            data-testid="button-filter-24h"
          >
            24H
          </Button>
          <Button
            variant={dateFilter === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("7d")}
            className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            data-testid="button-filter-7d"
          >
            7D
          </Button>
          <Button
            variant={dateFilter === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("30d")}
            className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            data-testid="button-filter-30d"
          >
            30D
          </Button>
          <Button
            variant={dateFilter === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("custom")}
            className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            data-testid="button-filter-custom"
          >
            Custom
          </Button>
        </div>
      </div>
  
      {/* Custom Date Range Inputs */}
      {dateFilter === "custom" && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center bg-card border border-border rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-medium text-foreground">From:</label>
            <Input
              type="date"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
              className="w-full sm:w-auto text-sm"
              data-testid="input-date-from"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-medium text-foreground">To:</label>
            <Input
              type="date"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
              className="w-full sm:w-auto text-sm"
              data-testid="input-date-to"
            />
          </div>
        </div>
      )}
  
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
          <Input
            placeholder="Search winners..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 sm:pl-10 text-sm sm:text-base"
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
          className="text-xs sm:text-sm py-2"
          disabled={winners.filter(w => w.winners.isShowcase).length === 0}
        >
          <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Remove All</span>
          <span className="sm:hidden">Remove</span>
        </Button>
      </div>
  
      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-sm">Loading winners...</div>
        ) : paginatedWinners.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="text-base sm:text-lg font-medium">No winners found</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </div>
            </div>
          </Card>
        ) : (
          paginatedWinners.map((item) => (
            <Card key={item.winners.id} className="p-4">
              <div className="space-y-4">
                {/* Winner Info */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium">
                        {item.users?.firstName} {item.users?.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.users?.email}
                      </div>
                    </div>
                    {item.winners.isShowcase ? (
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-green-600" />
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-600 text-white">
                          Showed
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <EyeOff className="h-3 w-3 text-red-600" />
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-600 text-white">
                          Hidden
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Competition: {item.competitions?.title || "No competition"}
                  </div>
                </div>
  
                {/* Prize Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prize:</span>
                    <span className="font-medium truncate max-w-[150px]">
                      {item.winners.prizeDescription}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Value:</span>
                    <span className="font-medium text-primary">
                      {item.winners.prizeValue}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.winners.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
  
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="flex-1 text-xs"
                    data-testid={`button-edit-${item.winners.id}`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item)}
                    className="flex-1 text-xs"
                    data-testid={`button-delete-${item.winners.id}`}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
  
      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort('winner')}
                >
                  <div className="flex items-center text-xs sm:text-sm">
                    Winner
                    {getSortIcon('winner')}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort('competition')}
                >
                  <div className="flex items-center text-xs sm:text-sm">
                    Competition
                    {getSortIcon('competition')}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort('prizeDescription')}
                >
                  <div className="flex items-center text-xs sm:text-sm">
                    Prize Description
                    {getSortIcon('prizeDescription')}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort('prizeValue')}
                >
                  <div className="flex items-center text-xs sm:text-sm">
                    Prize Value
                    {getSortIcon('prizeValue')}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort('showcase')}
                >
                  <div className="flex items-center text-xs sm:text-sm">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Showcase
                    {getSortIcon('showcase')}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort('dateAdded')}
                >
                  <div className="flex items-center text-xs sm:text-sm">
                    Date Added
                    {getSortIcon('dateAdded')}
                  </div>
                </TableHead>
                
                <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-sm">
                    Loading winners...
                  </TableCell>
                </TableRow>
              ) : paginatedWinners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                    No winners found. Add your first winner to get started.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedWinners.map((item) => (
                  <TableRow key={item.winners.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">
                          {item.users?.firstName} {item.users?.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.users?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.competitions?.title || (
                        <span className="text-muted-foreground">No competition</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {item.winners.prizeDescription}
                    </TableCell>
                    <TableCell className="font-semibold text-primary text-sm">
                      {item.winners.prizeValue}
                    </TableCell>
                    <TableCell>
                      {item.winners.isShowcase ? (
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-green-600" />
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-600 text-white">
                            Showed
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <EyeOff className="h-4 w-4 text-red-600" />
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-600 text-white">
                            Hidden
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(item.winners.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 p-0"
                          data-testid={`button-edit-${item.winners.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          className="h-8 w-8 p-0"
                          data-testid={`button-delete-${item.winners.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </table>
        </div>
      </div>
  
      {/* PAGINATION */}
      {paginatedWinners.length > 0 && (
        <>
          <div className="flex flex-row justify-center items-center gap-3 sm:gap-4 my-4 sm:my-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4 text-xs sm:text-sm"
            >
              <ArrowBigLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              
            </Button>
  
            <div className="flex items-center gap-1 sm:gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 sm:w-10 sm:h-10 text-xs"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
  
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4 text-xs sm:text-sm"
            >
             
              <ArrowBigRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
  
          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            Showing {paginatedWinners.length} of {winners.length} filtered entries
          </p>
        </>
      )}
  
      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
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
        <AlertDialogContent className="max-w-full sm:max-w-md p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will permanently delete this winner from the showcase. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto text-sm sm:text-base" data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingWinner && deleteMutation.mutate(deletingWinner.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto text-sm sm:text-base"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  
      {/* Bulk Remove Dialog */}
      <Dialog open={showBulkRemoveDialog} onOpenChange={setShowBulkRemoveDialog}>
        <DialogContent className="max-w-full sm:max-w-[500px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              Remove Winners from Showcase
            </DialogTitle>
            <DialogDescription className="text-sm">
              This action will remove {winners.filter(w => w.winners.isShowcase).length} winners from the public showcase
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4 p-4 border border-amber-200 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-amber-800">Winners to be removed:</h4>
                  <p className="text-sm text-amber-600 mt-1">
                    {winners.filter(w => w.winners.isShowcase).length} winner(s) will be set to non-showcase
                  </p>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-amber-700">
                  {winners.filter(w => w.winners.isShowcase).length}
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2 text-sm sm:text-base">What will happen:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 flex items-center justify-center rounded-full mt-0.5">
                    <EyeOff className="h-3 w-3 text-blue-600" />
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
              className="w-full sm:w-auto text-sm sm:text-base"
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
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-sm sm:text-base"
              disabled={isBulkRemoving}
            >
              {isBulkRemoving ? (
                <>
                  <div className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Removing...
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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