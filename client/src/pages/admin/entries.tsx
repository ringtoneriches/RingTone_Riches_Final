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
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
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
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Ticket className="w-8 h-8 text-primary" />
            Competition Entries
          </h1>
          <p className="text-muted-foreground mt-1">
            View all competition entries and download data
          </p>
        </div>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by ticket number, user name, or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            data-testid="input-search-entries"
          />
        </div>
        <div className="flex gap-2">
          <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
            <SelectTrigger className="w-[250px]" data-testid="select-competition-filter">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by competition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Competitions</SelectItem>
              {competitions.map((comp) => (
                <SelectItem key={comp.id} value={comp.id}>
                  {comp.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {competitionFilter !== "all" && (
            <Button
              onClick={() => handleDownloadCSV(competitionFilter)}
              variant="outline"
              data-testid="button-download-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Entries</p>
          <p className="text-2xl font-bold text-foreground" data-testid="text-total-entries">
            {filteredEntries.length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Winning Entries</p>
          <p className="text-2xl font-bold text-green-600" data-testid="text-winning-entries">
            {filteredEntries.filter((e) => e.isWinner).length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Unique Users</p>
          <p className="text-2xl font-bold text-foreground" data-testid="text-unique-users">
            {new Set(filteredEntries.filter(e => e.user).map((e) => e.user!.id)).size}
          </p>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket Number</TableHead>
              <TableHead>Competition</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Winner</TableHead>
              <TableHead>Prize</TableHead>
              <TableHead>Entry Date</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No entries found
                </TableCell>
              </TableRow>
            ) : (
              paginatedEntries.map((entry) => (
                <TableRow key={entry.id} data-testid={`row-entry-${entry.id}`}>
                  <TableCell className="font-mono font-bold text-primary">
                    {entry.ticketNumber}
                  </TableCell>
                  <TableCell>{entry.competition?.title || 'N/A'}</TableCell>
                  <TableCell>
                    {entry.competition ? (
                      <span className="capitalize px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                        {entry.competition.type}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.user ? `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.user?.email || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {entry.isWinner ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium">
                        ✓ Winner
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.prizeAmount ? `£${entry.prizeAmount}` : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                      data-testid={`button-delete-${entry.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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

      {/* Results count */}
      <div className="text-sm text-muted-foreground text-center">
  Showing {paginatedEntries.length} of {filteredEntries.length} entries
</div>
    </div>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Entry</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this entry? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={deleteMutation.isPending}
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </AdminLayout>
  );
}