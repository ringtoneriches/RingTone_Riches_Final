import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Download, Filter, Search, Ticket, Trash2, Calendar, ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import AdminLayout from "@/components/admin/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface Entry {
  id: string;
  ticketNumber: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  competition: {
    id: string;
    title: string;
    type: string;
  } | null;
  isWinner: boolean;
  prizeAmount: string;
  createdAt: string;
}

type DateFilter = "all" | "1h" | "24h" | "7d" | "30d" | "custom";

export default function AdminEntriesPage() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [competitionFilter, setCompetitionFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("1h");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [currentPage , setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Calculate date range based on filter (memoized to prevent infinite loops)
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

  // Fetch entries (only date filtering on backend)
  const { data: entries = [], isLoading } = useQuery<Entry[]>({
    queryKey: ["/api/admin/entries", { dateFrom, dateTo }],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);
      
      const url = queryParams.toString() 
        ? `/api/admin/entries?${queryParams.toString()}`
        : "/api/admin/entries";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch entries");
      return res.json();
    },
  });

   console.log("Fetched entries:", entries);

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await apiRequest(`/api/admin/entries/${entryId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/entries"] });
      toast({
        title: "Entry Deleted",
        description: "The entry has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete entry",
        variant: "destructive",
      });
    },
  });

  // Get unique competitions for filter dropdown
  const competitions = Array.from(
    new Map(
      entries
        .filter((entry) => entry.competition?.id)
        .map((entry) => [
          entry.competition!.id,
          {
            id: entry.competition!.id,
            title: entry.competition!.title,
          },
        ])
    ).values()
  );

  // Client-side filtering for instant search (no reload)
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (!entry.user || !entry.competition) return false;
      
      // Competition filter
      const matchesCompetition =
        competitionFilter === "all" || entry.competition.id === competitionFilter;
      if (!matchesCompetition) return false;
      
      // Search filter (instant, client-side)
      if (searchInput.trim()) {
        const searchLower = searchInput.toLowerCase().trim();
        const ticketNumber = entry.ticketNumber?.toLowerCase() || "";
        const userName = `${entry.user.firstName || ""} ${entry.user.lastName || ""}`.toLowerCase().trim();
        const email = entry.user.email?.toLowerCase() || "";
        const competitionTitle = entry.competition.title?.toLowerCase() || "";
        
        return (
          ticketNumber.includes(searchLower) ||
          userName.includes(searchLower) ||
          email.includes(searchLower) ||
          competitionTitle.includes(searchLower)
        );
      }
      
      return true;
    });
  }, [entries, competitionFilter, searchInput]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const paginatedEntries = filteredEntries.slice(startIndex, startIndex + itemsPerPage);

  const handleDeleteEntry = (entryId: string) => {
    setEntryToDelete(entryId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteMutation.mutate(entryToDelete);
    }
  };

  const handleDownloadCSV = async (competitionId: string) => {
    try {
      // Get competition title for filename
      const competition = competitions.find((c) => c.id === competitionId);
      const competitionTitle = competition?.title || 'competition';
      const sanitizedTitle = competitionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

      const response = await fetch(
        `/api/admin/entries/download/${competitionId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download CSV");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sanitizedTitle}_entries.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Failed to download CSV");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AdminLayout>
    <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
            Competition Entries
          </h1>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          View all competition entries and download data
        </p>
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
  
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by ticket number, user name, or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 sm:pl-10 text-sm sm:text-base"
            data-testid="input-search-entries"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
            <SelectTrigger className="w-full sm:w-[250px] text-sm sm:text-base" data-testid="select-competition-filter">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <SelectValue placeholder="Filter by competition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">All Competitions</SelectItem>
              {competitions.map((comp) => (
                <SelectItem key={comp.id} value={comp.id} className="text-xs w-80 sm:w-full">
                  {comp.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {competitionFilter !== "all" && (
            <Button
              onClick={() => handleDownloadCSV(competitionFilter)}
              variant="outline"
              className="text-xs sm:text-sm py-2"
              data-testid="button-download-csv"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              CSV
            </Button>
          )}
        </div>
      </div>
  
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground">Total Entries</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground" data-testid="text-total-entries">
            {filteredEntries.length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground">Winning Entries</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600" data-testid="text-winning-entries">
            {filteredEntries.filter((e) => e.isWinner).length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground">Unique Users</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground" data-testid="text-unique-users">
            {new Set(filteredEntries.filter(e => e.user).map((e) => e.user!.id)).size}
          </p>
        </div>
      </div>
  
      {/* Mobile Cards View */}
      <div className="block md:hidden space-y-3">
        {paginatedEntries.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="text-base sm:text-lg font-medium">No entries found</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </div>
            </div>
          </Card>
        ) : (
          paginatedEntries.map((entry) => (
            <Card key={entry.id} className="p-4">
              <div className="space-y-4">
                {/* Entry Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono font-bold text-primary text-sm">
                      Ticket: {entry.ticketNumber}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {entry.competition?.title || 'N/A'}
                    </div>
                  </div>
                  {entry.competition && (
                    <span className="capitalize px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                      {entry.competition.type === "instant" ? "Comp" : entry.competition.type}
                    </span>
                  )}
                </div>
  
                {/* User Info */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User:</span>
                    <span className="font-medium">
                      {entry.user ? `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-muted-foreground truncate max-w-[150px]">
                      {entry.user?.email || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
  
                {/* Action Button */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                    data-testid={`button-delete-${entry.id}`}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete Entry
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
  
      {/* Desktop Table View */}
      <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                  Ticket Number
                </th>
                <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                  Competition
                </th>
                <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                  User
                </th>
                <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                  Entry Date
                </th>
                <th className="text-center py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                    No entries found
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-entry-${entry.id}`}>
                    <td className="py-3 px-4 font-mono font-bold text-primary text-sm">
                      {entry.ticketNumber}
                    </td>
                    <td className="py-3 px-4 text-sm">{entry.competition?.title || 'N/A'}</td>
                    <td className="py-3 px-4">
                      {entry.competition ? (
                        <span className="capitalize px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                          {entry.competition.type === "instant" ? "Competition" : entry.competition.type}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {entry.user ? `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {entry.user?.email || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        data-testid={`button-delete-${entry.id}`}
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
  
      {/* PAGINATION */}
      {paginatedEntries.length > 0 && (
        <>
          <div className="flex flex-row justify-center items-center gap-3 sm:gap-4 my-4 sm:my-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p - 1)}
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
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4 text-xs sm:text-sm"
            >
              
              <ArrowBigRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
  
          <div className="text-xs sm:text-sm text-muted-foreground text-center">
            Showing {paginatedEntries.length} of {filteredEntries.length} entries
          </div>
        </>
      )}
  
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-full sm:max-w-md p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Delete Entry</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete this entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto text-sm sm:text-base" data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto text-sm sm:text-base"
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </AdminLayout>
  );
}