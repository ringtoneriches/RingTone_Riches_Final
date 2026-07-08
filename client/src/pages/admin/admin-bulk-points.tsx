import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Users, Gift, CheckCircle, XCircle, ArrowBigLeft, ArrowBigRight } from "lucide-react";
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
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkResult, setBulkResult] = useState<BulkPointsResult | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch users using the dedicated endpoint
 // Fetch users using the dedicated endpoint
const { data: usersData, isLoading, isError, error } = useQuery({
  queryKey: ["/api/admin/users/bulk-points-list", debouncedSearch],
  queryFn: async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      
      const url = `/api/admin/users/bulk-points-list${params.toString() ? '?' + params.toString() : ''}`;
      console.log("Fetching URL:", url);
      
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log("API Response:", data);
      console.log("Users count:", data.users?.length);
      
      // Check if users exist
      if (data.users) {
        data.users.forEach((user: User, index: number) => {
          if (index < 3) { // Log first 3 users for debugging
            console.log(`User ${index + 1}:`, user.firstName, user.lastName, "Admin:", user.isAdmin);
          }
        });
      }
      
      return data.users as User[];
    } catch (err) {
      console.error("Fetch error:", err);
      throw err;
    }
  },
  keepPreviousData: true,
  // Don't retry on 401/403
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
    console.log("Non-admin users:", filtered.length);
    return filtered;
  }, [usersData]);

  // Pagination
  const totalPages = Math.ceil(nonAdminUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = nonAdminUsers.slice(startIndex, startIndex + itemsPerPage);

  // Bulk add points mutation
  const bulkAddPointsMutation = useMutation({
    mutationFn: async (data: { userIds: string[]; points: number; reason: string }) => {
      const res = await apiRequest("/api/admin/users/bulk-add-points", "POST", data);
      return res.json();
    },
    onSuccess: (data: BulkPointsResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setBulkResult(data);
      toast({
        title: "Points Added Successfully",
        description: `Added ${data.pointsAdded} points to ${data.successful.length} users.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add points",
        variant: "destructive",
      });
    },
  });

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

  // Handle bulk add points
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

    setBulkProgress(0);
    setBulkResult(null);

    const progressInterval = setInterval(() => {
      setBulkProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      await bulkAddPointsMutation.mutateAsync({
        userIds: Array.from(selectedUsers),
        points: pointsForm.points,
        reason: pointsForm.reason,
      });
      setBulkProgress(100);
      setSelectedUsers(new Set());
    } finally {
      clearInterval(progressInterval);
    }
  };

  // Show error state
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
              Add ringtone points to multiple users at once
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
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
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllUsers}
                className="text-xs"
              >
                Select All ({nonAdminUsers.length})
              </Button>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={selectedUsers.size === 0}
                    className="gap-1 text-sm"
                  >
                    <Gift className="w-4 h-4" />
                    Add Points ({selectedUsers.size} users)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                      Add Ringtone Points
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      Add points to {selectedUsers.size} selected user{selectedUsers.size !== 1 ? 's' : ''}.
                    </DialogDescription>
                  </DialogHeader>
                  
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
                        Total points to distribute: {pointsForm.points * selectedUsers.size}
                      </p>
                    </div>

                    {(bulkAddPointsMutation.isPending || bulkProgress > 0) && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Adding points...</span>
                          <span>{bulkProgress}%</span>
                        </div>
                        <Progress value={bulkProgress} className="h-2" />
                      </div>
                    )}

                    {bulkResult && (
                      <div className="space-y-3 p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium">Results:</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Success: {bulkResult.successful.length}</span>
                          </div>
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-4 h-4" />
                            <span>Failed: {bulkResult.failed.length}</span>
                          </div>
                        </div>
                        {bulkResult.successful.length > 0 && (
                          <div className="text-xs text-green-600 mt-2">
                            <div className="font-medium mb-1">Updated users:</div>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {bulkResult.successful.slice(0, 5).map((user, i) => (
                                <div key={i}>
                                  {user.firstName} {user.lastName}: {user.previousPoints} → {user.newPoints} points
                                </div>
                              ))}
                              {bulkResult.successful.length > 5 && (
                                <div>...and {bulkResult.successful.length - 5} more</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        setBulkResult(null);
                        setBulkProgress(0);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkAddPoints}
                      disabled={!pointsForm.points || bulkAddPointsMutation.isPending}
                    >
                      {bulkAddPointsMutation.isPending 
                        ? "Adding Points..." 
                        : `Add ${pointsForm.points} Points to ${selectedUsers.size} Users`}
                    </Button>
                  </div>
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
          {searchInput !== debouncedSearch && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
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
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
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
                        selectedUsers.has(user.id) ? 'bg-blue-50 hover:bg-blue-100' : ''
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

        {/* Pagination - only show if there are users and not loading */}
        {!isLoading && nonAdminUsers.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 my-4 sm:my-6">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p - 1)}
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
                  onClick={() => setCurrentPage((p) => p + 1)}
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

            <p className="text-center text-xs sm:text-sm text-muted-foreground">
              Showing {paginatedUsers.length} of {nonAdminUsers.length} users
            </p>
          </>
        )}
      </div>
    </AdminLayout>
  );
}