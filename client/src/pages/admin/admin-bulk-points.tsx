import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Users, Gift, CheckCircle, XCircle, ArrowBigLeft, ArrowBigRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  ringtonePoints: number;
  isAdmin: boolean;
  createdAt: string;
}

interface BulkPointsResult {
  successful: Array<{
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    previousPoints: number;
    newPoints: number;
    pointsAdded: number;
  }>;
  failed: Array<{
    userId: string;
    reason: string;
  }>;
  total: number;
  pointsAdded: number;
}

export default function AdminBulkPoints() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const itemsPerPage = 20;

  // Points form state
  const [pointsForm, setPointsForm] = useState({
    points: 100,
    reason: "",
  });

  // Bulk operation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkResult, setBulkResult] = useState<BulkPointsResult | null>(null);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [processedUsers, setProcessedUsers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [successfulUsers, setSuccessfulUsers] = useState<any[]>([]);
  const [failedUsers, setFailedUsers] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch users
  const { data: usersData, isLoading, isError, error } = useQuery({
    queryKey: ["/api/admin/users/bulk-points-list", debouncedSearch],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.append("search", debouncedSearch);
        
        const url = `/api/admin/users/bulk-points-list${params.toString() ? '?' + params.toString() : ''}`;
        const res = await fetch(url, {
          credentials: "include",
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
        
        const data = await res.json();
        return data.users as User[];
      } catch (err) {
        console.error("Fetch error:", err);
        throw err;
      }
    },
    keepPreviousData: true,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Filter out admin users
  const nonAdminUsers = useMemo(() => {
    const filtered = usersData?.filter(user => !user.isAdmin) || [];
    return filtered;
  }, [usersData]);

  // Pagination
  const totalPages = Math.ceil(nonAdminUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = nonAdminUsers.slice(startIndex, startIndex + itemsPerPage);

  // Toggle user selection
  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(userId)) {
        newSelected.delete(userId);
      } else {
        newSelected.add(userId);
      }
      return newSelected;
    });
  };

  // Select all users on current page
  const toggleAllOnPage = () => {
    setSelectedUsers(prev => {
      const newSelected = new Set(prev);
      const allOnPageSelected = paginatedUsers.every(user => newSelected.has(user.id));
      
      if (allOnPageSelected) {
        paginatedUsers.forEach(user => newSelected.delete(user.id));
      } else {
        paginatedUsers.forEach(user => newSelected.add(user.id));
      }
      
      return newSelected;
    });
  };

  // Select all users (across all pages)
  const selectAllUsers = () => {
    const userCount = nonAdminUsers.length;
    if (userCount > 500) {
      if (!confirm(`You are about to select ${userCount} users. This will process in batches of 500 and may take a few minutes. Continue?`)) {
        return;
      }
    }
    
    const newSelected = new Set<string>();
    nonAdminUsers.forEach(user => newSelected.add(user.id));
    setSelectedUsers(newSelected);
    toast({
      title: "All Users Selected",
      description: `Selected ${nonAdminUsers.length} users.`,
    });
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  // Handle bulk add points with batching - sends to ALL users in batches
  const handleBulkAddPoints = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select at least one user.",
        variant: "destructive",
      });
      return;
    }

    if (!pointsForm.points || pointsForm.points <= 0) {
      toast({
        title: "Invalid Points",
        description: "Please enter a valid number of points.",
        variant: "destructive",
      });
      return;
    }

    const userIds = Array.from(selectedUsers);
    const BATCH_SIZE = 500;
    const batches = Math.ceil(userIds.length / BATCH_SIZE);
    
    // Reset state
    setIsProcessing(true);
    setBulkProgress(0);
    setBulkResult(null);
    setCurrentBatch(0);
    setTotalBatches(batches);
    setProcessedUsers(0);
    setTotalUsers(userIds.length);
    setSuccessfulUsers([]);
    setFailedUsers([]);
    setIsComplete(false);

    let allSuccessful: any[] = [];
    let allFailed: any[] = [];

    // Process batch by batch
    for (let i = 0; i < batches; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, userIds.length);
      const batch = userIds.slice(start, end);
      
      setCurrentBatch(i + 1);
      
      try {
        const res = await apiRequest("/api/admin/users/bulk-add-points", "POST", {
          userIds: batch,
          points: pointsForm.points,
          reason: pointsForm.reason,
        });
        
        const data = await res.json();
        
        if (data.successful) {
          allSuccessful = [...allSuccessful, ...data.successful];
          setSuccessfulUsers(allSuccessful);
        }
        if (data.failed) {
          allFailed = [...allFailed, ...data.failed];
          setFailedUsers(allFailed);
        }
        
        setProcessedUsers(end);
        const progress = Math.round((end / userIds.length) * 100);
        setBulkProgress(Math.min(progress, 99));
        
      } catch (error) {
        console.error(`Batch ${i + 1} failed:`, error);
        allFailed.push({
          userIds: batch,
          reason: `Batch ${i + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        setFailedUsers(allFailed);
      }
    }

    // Final result
    const finalResult: BulkPointsResult = {
      successful: allSuccessful,
      failed: allFailed,
      total: userIds.length,
      pointsAdded: pointsForm.points,
    };

    setBulkResult(finalResult);
    setBulkProgress(100);
    setIsComplete(true);
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users/bulk-points-list"] });
    
    toast({
      title: "Points Added Successfully",
      description: `Added ${pointsForm.points} points to ${allSuccessful.length} users. ${allFailed.length} failed.`,
    });
    
    // Clear selection after completion
    setSelectedUsers(new Set());
  };

  // Reset and close dialog
  const resetAndClose = () => {
    setDialogOpen(false);
    setIsProcessing(false);
    setBulkResult(null);
    setBulkProgress(0);
    setSuccessfulUsers([]);
    setFailedUsers([]);
    setIsComplete(false);
  };

  if (isError) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <div className="text-lg font-medium text-red-600">Error loading users</div>
            <div className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : "Please try again later"}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-2 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              Bulk Add Ringtone Points
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
              Add ringtone points to multiple users at once. Large selections will be processed in batches of 500 users.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="text-sm py-1.5">
                <Users className="w-4 h-4 mr-1" />
                {selectedUsers.size} users selected
              </Badge>
              {selectedUsers.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-xs"
                >
                  Clear selection
                </Button>
              )}
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllUsers}
                className="text-xs"
                disabled={isLoading}
              >
                Select All ({nonAdminUsers.length})
              </Button>
              
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                if (!open && isProcessing) return; // Prevent closing while processing
                setDialogOpen(open);
                if (!open) {
                  resetAndClose();
                }
              }}>
                <DialogTrigger asChild>
                  <Button
                    disabled={selectedUsers.size === 0 || isProcessing}
                    className="gap-1 text-sm"
                  >
                    <Gift className="w-4 h-4" />
                    Add Points ({selectedUsers.size} users)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                      {isProcessing ? "Processing Points..." : "Add Ringtone Points"}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      {isProcessing 
                        ? `Processing batch ${currentBatch} of ${totalBatches}`
                        : `Add points to ${selectedUsers.size} selected user${selectedUsers.size !== 1 ? 's' : ''}.`
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  {!isProcessing ? (
                    // Normal form when not processing
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Points to Add *</Label>
                        <Input
                          type="number"
                          min="1"
                          max="1000000"
                          value={pointsForm.points}
                          onChange={(e) => setPointsForm({ ...pointsForm, points: Number(e.target.value) })}
                          placeholder="e.g., 100"
                        />
                        <p className="text-xs text-muted-foreground">
                          These points will be added to each user's current balance.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-sm">Reason (optional)</Label>
                        <Input
                          value={pointsForm.reason}
                          onChange={(e) => setPointsForm({ ...pointsForm, reason: e.target.value })}
                          placeholder="e.g., Promotion bonus, Loyalty reward"
                        />
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-700">
                          💡 <strong>Summary:</strong> Adding {pointsForm.points} points to {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''}.
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Total points to distribute: {(pointsForm.points * selectedUsers.size).toLocaleString()}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          📦 Will process in batches of 500 users ({Math.ceil(selectedUsers.size / 500)} batches)
                        </p>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleBulkAddPoints}
                          disabled={!pointsForm.points || isProcessing}
                        >
                          {isProcessing 
                            ? "Processing..." 
                            : `Add ${pointsForm.points} Points to ${selectedUsers.size} Users`}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Progress view when processing
                    <div className="space-y-6 py-4">
                      <div className="text-center space-y-2">
                        <div className="text-3xl font-bold text-primary">
                          {bulkProgress}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Processing {processedUsers} of {totalUsers} users
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Batch {currentBatch} of {totalBatches}
                        </div>
                      </div>

                      <Progress value={bulkProgress} className="h-3" />

                      <div className="grid grid-cols-2 gap-4 text-center text-sm">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-green-600 font-bold text-lg">
                            {successfulUsers.length}
                          </div>
                          <div className="text-green-600 text-xs">Successful</div>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="text-red-600 font-bold text-lg">
                            {failedUsers.length}
                          </div>
                          <div className="text-red-600 text-xs">Failed</div>
                        </div>
                      </div>

                      {successfulUsers.length > 0 && (
                        <div className="max-h-32 overflow-y-auto text-xs space-y-1 bg-muted p-2 rounded">
                          <div className="font-medium mb-1">Recent updates:</div>
                          {successfulUsers.slice(-5).map((user, i) => (
                            <div key={i} className="text-green-600">
                              {user.firstName} {user.lastName}: {user.previousPoints} → {user.newPoints} points
                            </div>
                          ))}
                          {successfulUsers.length > 5 && (
                            <div className="text-muted-foreground">
                              ...and {successfulUsers.length - 5} more successful
                            </div>
                          )}
                        </div>
                      )}

                      {failedUsers.length > 0 && (
                        <div className="max-h-20 overflow-y-auto text-xs space-y-1 bg-red-50 p-2 rounded">
                          <div className="font-medium mb-1 text-red-600">Failed:</div>
                          {failedUsers.slice(-3).map((user, i) => (
                            <div key={i} className="text-red-600">
                              {user.userId || user.userIds?.join(', ')}: {user.reason}
                            </div>
                          ))}
                          {failedUsers.length > 3 && (
                            <div className="text-red-600">
                              ...and {failedUsers.length - 3} more failed
                            </div>
                          )}
                        </div>
                      )}

                      {isComplete && (
                        <div className="flex justify-end">
                          <Button onClick={resetAndClose} className="w-full">
                            Close
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
          <Input
            placeholder="Search users by name, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 sm:pl-10 text-sm sm:text-base"
          />
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 w-12">
                    <Checkbox
                      checked={
                        paginatedUsers.length > 0 &&
                        paginatedUsers.every(user => selectedUsers.has(user.id))
                      }
                      onCheckedChange={toggleAllOnPage}
                      disabled={isLoading}
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Current Points
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <div className="text-sm text-muted-foreground">Loading users...</div>
                      </div>
                    </td>
                  </tr>
                ) : nonAdminUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-12 h-12 mb-3 text-muted-foreground/50" />
                        <div className="text-base font-medium">No users found</div>
                        <div className="text-sm mt-1">
                          {debouncedSearch ? "Try a different search term" : "No users in the system"}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${
                        selectedUsers.has(user.id) ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/30' : ''
                      }`}
                      onClick={() => toggleUser(user.id)}
                    >
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleUser(user.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-foreground">
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant={user.ringtonePoints > 0 ? "default" : "secondary"}>
                          {user.ringtonePoints?.toLocaleString() || 0} pts
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {user.createdAt ? format(new Date(user.createdAt), "dd MMM yyyy") : "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!isLoading && nonAdminUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 my-4 sm:my-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4"
              >
                <ArrowBigLeft className="w-4 h-4" />
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
                      className="w-8 h-8 sm:w-10 sm:h-10"
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
                className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4"
              >
                <ArrowBigRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        {!isLoading && nonAdminUsers.length > 0 && (
          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            Showing {paginatedUsers.length} of {nonAdminUsers.length} users
          </p>
        )}
      </div>
    </AdminLayout>
  );
}