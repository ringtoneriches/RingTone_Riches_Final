import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Search, AlertTriangle, Calendar, FileText, ChevronUp, ChevronDown, CheckCircle, XCircle, Download, Eye, ArrowLeft, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { Transaction } from "@shared/schema";
import AdminLayout from "@/components/admin/admin-layout";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  balance: string;
  ringtonePoints: number;
  isAdmin: boolean;
  createdAt: string;
  phoneNumber: string;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostcode: string | null;
  addressCountry: string | null;
  notes: string | null;
  disabled: boolean;
  disabledAt: string | null;
  disabledUntil: string | null;
  dailySpendLimit: string | null;
  dailyLimitLastUpdatedAt: string | null;
  lastIpAddress?: string | null;
}

interface PaginatedUsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

type DateFilter = "all" | "24h" | "7d" | "30d" | "custom";

export default function AdminUsers() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth() as { user: User | null };
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordResetConfirm, setPasswordResetConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [editForm, setEditForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    balance: "",
    ringtonePoints: "",
    phoneNumber: "",
    isAdmin: false,
    notes: "",
  });
  const [, setLocation] = useLocation();
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [userToDisable, setUserToDisable] = useState<User | null>(null);
  const [disableDays, setDisableDays] = useState("7");
  const [dailyLimitDialogOpen, setDailyLimitDialogOpen] = useState(false);
  const [userForDailyLimitReset, setUserForDailyLimitReset] = useState<User | null>(null);
  const [selectedIpUser, setSelectedIpUser] = useState<User | null>(null);
  const [ipDialogOpen, setIpDialogOpen] = useState(false);
  const [returnToSupport, setReturnToSupport] = useState<{ ticketId: string; ticketData: string } | null>(null);

  // Debounce search to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get("search");
    const returnTo = params.get("returnTo");
    const ticketId = params.get("ticketId");
    const ticketData = params.get("ticketData");
    
    if (searchParam) {
      setSearchInput(decodeURIComponent(searchParam));
    }
    
    if (returnTo === "support" && ticketId && ticketData) {
      setReturnToSupport({ ticketId, ticketData });
    }
  }, []);
  
  // Calculate date range
  const { dateFrom, dateTo } = useMemo(() => {
    if (dateFilter === "all") {
      return { dateFrom: "", dateTo: "" };
    }

    const now = new Date();
    let dateFrom = "";
    let dateTo = "";

    switch (dateFilter) {
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

  // Fetch cashflow transactions (keep as is)
  const { data: cashflowTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/users/cashflow-transactions"],
  });

  // Infinite query for paginated users
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<PaginatedUsersResponse>({
    queryKey: ["/api/admin/users", dateFrom, dateTo, debouncedSearch, roleFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const url = new URL("/api/admin/users", window.location.origin);
      url.searchParams.append("page", pageParam.toString());
      url.searchParams.append("limit", "30");
      if (dateFrom) url.searchParams.append("dateFrom", dateFrom);
      if (dateTo) url.searchParams.append("dateTo", dateTo);
      if (debouncedSearch) url.searchParams.append("search", debouncedSearch);
      if (roleFilter !== "all") url.searchParams.append("role", roleFilter);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30000,
  });

  // Intersection Observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLTableRowElement | HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // Flatten all users from all pages
  const allUsers = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.users);
  }, [data]);

  const totalUsers = data?.pages[0]?.pagination.total || 0;

  const getCashflowTotal = (userId: string) => {
    const userTx = cashflowTransactions.find(tx => tx.userId === userId);
    return userTx ? parseFloat(userTx.totalCashflow).toFixed(2) : "0.00";
  };

  // Export function (exports all data via server)
  const handleExportCSV = async () => {
    const url = new URL("/api/admin/users/export", window.location.origin);
    if (dateFrom) url.searchParams.append("dateFrom", dateFrom);
    if (dateTo) url.searchParams.append("dateTo", dateTo);
    if (debouncedSearch) url.searchParams.append("search", debouncedSearch);
    if (roleFilter !== "all") url.searchParams.append("role", roleFilter);
    
    window.open(url.toString(), '_blank');
  };

  // Mutations (same as before)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest(`/api/admin/users/${id}`, "PUT", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      toast({ title: "User updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const res = await apiRequest(`/api/admin/users/${id}/reset-password`, "POST", { password });
      return res.json();
    },
    onSuccess: () => {
      setPasswordResetConfirm(false);
      setNewPassword("");
      toast({ title: "Password reset successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reset password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest(`/api/admin/users/${userId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Deleted",
        description: "The user has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const disableUserMutation = useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      const res = await apiRequest(`/api/admin/users/${userId}/disable`, "POST", { days });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.message || "Failed to disable user");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User has been disabled successfully",
      });
      setIsDisableDialogOpen(false);
      setUserToDisable(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disable user",
        variant: "destructive",
      });
    },
  });

  const enableUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest(`/api/admin/users/${userId}/enable`, "POST");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.message || "Failed to enable user");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User has been enabled successfully",
      });
      setIsDisableDialogOpen(false);
      setUserToDisable(null);
      setDisableDays("7");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enable user",
        variant: "destructive",
      });
    },
  });

  const resetDailyLimitMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const res = await apiRequest(
        "/api/admin/wellbeing/daily-limit-reset", 
        "POST", 
        { targetUserId }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.message || "Failed to reset daily limit");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Daily limit reset successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset daily limit",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      balance: user.balance,
      ringtonePoints: user.ringtonePoints.toString(),
      phoneNumber: user.phoneNumber || "",
      notes: user.notes || "",
      isAdmin: user.isAdmin,
    });
  };

  const handlePasswordReset = () => {
    if (!editingUser || !newPassword || newPassword.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    resetPasswordMutation.mutate({
      id: editingUser.id,
      password: newPassword,
    });
  };

  const handleUpdate = () => {
    if (!editingUser) return;

    if (editingUser.id === currentUser?.id && !editForm.isAdmin) {
      toast({
        title: "Cannot demote yourself",
        description: "You cannot remove your own admin privileges",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      id: editingUser.id,
      data: {
        email: editForm.email,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phoneNumber: editForm.phoneNumber,
        balance: parseFloat(editForm.balance).toFixed(2),
        ringtonePoints: parseInt(editForm.ringtonePoints),
        notes: editForm.notes,
        isAdmin: editForm.isAdmin,
      },
    });
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) {
      toast({
        title: "Cannot delete yourself",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  if (isLoading) {
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
      <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-2 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              Users
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
              Manage platform users - {totalUsers} total users
            </p>
          </div>
        </div>

        {/* Return to Support Banner */}
        {returnToSupport && (
          <div className="flex justify-between items-center bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">Viewing user from support ticket</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLocation(`/admin/support?returnToTicket=${returnToSupport.ticketId}&ticketData=${returnToSupport.ticketData}`);
              }}
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Back to Support Ticket
            </Button>
          </div>
        )}

        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium text-foreground">Date Range:</span>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {["all", "24h", "7d", "30d", "custom"].map((filter) => (
                <Button
                  key={filter}
                  variant={dateFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter(filter as DateFilter)}
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  {filter === "all" ? "All Time" : filter === "24h" ? "24H" : filter === "7d" ? "7D" : filter === "30d" ? "30D" : "Custom"}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              title="Export Users to CSV"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Export CSV
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
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <label className="text-xs sm:text-sm font-medium text-foreground">To:</label>
              <Input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="w-full sm:w-auto text-sm"
              />
            </div>
          </div>
        )}

        {/* Role Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-md text-sm"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins Only</option>
            <option value="user">Users Only</option>
          </select>
          
          <div className="relative flex-1">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              placeholder="Search users by email, name, or phone number..."
              value={searchInput}
              autoComplete="off"
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 sm:pl-10 text-sm sm:text-base"
            />
          </div>
        </div>

       {/* Mobile Cards View with Infinite Scroll - FIXED */}
<div className="block md:hidden space-y-3">
  {/* Add a loading spinner at the top while fetching first page */}
  {isFetchingNextPage && allUsers.length === 0 && (
    <Card className="p-8 text-center">
      <div className="flex justify-center items-center gap-2">
        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
        <span className="text-sm text-muted-foreground">Loading users...</span>
      </div>
    </Card>
  )}
  
  {allUsers.map((user, index) => {
    // Attach observer to last 3 items for better mobile detection
    const isNearEnd = index >= allUsers.length - 3;
    return (
      <Card 
        key={user.id} 
        ref={isNearEnd ? loadMoreRef : null}
        className="p-4"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-foreground break-all">{user.email}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {user.firstName} {user.lastName || ""}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ml-2 ${
                user.isAdmin ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {user.isAdmin ? "Admin" : "User"}
              </span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.disabled ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"
              }`}>
                {user.disabled ? "Disabled" : "Active"}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Phone</div>
              <div className="font-medium break-all">{user.phoneNumber || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Cashflow</div>
              <div className="font-medium">£{getCashflowTotal(user.id)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Balance</div>
              <div className="font-medium text-primary">£{parseFloat(user.balance).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Points</div>
              <div className="font-medium">{user.ringtonePoints}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/admin/users/${user.id}`)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs px-2"
            >
              <FileText className="w-3 h-3 mr-1" />
              Audit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(user)}
              className="text-xs px-2"
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserToDisable(user);
                setIsDisableDialogOpen(true);
              }}
              className={`text-xs px-2 ${
                user.disabled 
                  ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                  : "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
              }`}
            >
              {user.disabled ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Enable
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Disable
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteUser(user)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </Card>
    );
  })}
  
  {/* Loading indicator at bottom */}
  {isFetchingNextPage && allUsers.length > 0 && (
    <Card className="p-4 text-center">
      <div className="flex justify-center items-center gap-2">
        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
        <span className="text-sm text-muted-foreground">Loading more users...</span>
      </div>
    </Card>
  )}
  
  {/* "Load More" button as fallback for mobile */}
  {hasNextPage && !isFetchingNextPage && allUsers.length > 0 && (
    <Button
      variant="outline"
      onClick={() => fetchNextPage()}
      className="w-full py-6"
    >
      Load More Users ({allUsers.length} of {totalUsers})
    </Button>
  )}
  
  {allUsers.length === 0 && !isLoading && (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="text-base sm:text-lg font-medium">No users found</div>
        <div className="text-xs sm:text-sm text-muted-foreground mt-1">
          Try adjusting your search or filters
        </div>
      </div>
    </Card>
  )}
</div>

        {/* Desktop Table View with Infinite Scroll */}
        <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">Phone</th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">Cashflow</th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">Balance</th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">Points</th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">IP Address</th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">Joined</th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user, index) => {
                  const isLastRow = index === allUsers.length - 1;
                  return (
                    <tr 
                      key={user.id} 
                      ref={isLastRow ? loadMoreRef : null}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="py-3 px-4 text-sm text-foreground">{user.email}</td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {user.firstName} {user.lastName || ""}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {user.phoneNumber || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        £{getCashflowTotal(user.id)}
                      </td>
                      <td className="py-3 px-4 text-sm text-primary font-medium">
                        £{parseFloat(user.balance).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {user.ringtonePoints}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground font-mono text-xs">
                        {user.lastIpAddress ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs">
                              {user.lastIpAddress.length > 12 
                                ? `${user.lastIpAddress.substring(0, 12)}...` 
                                : user.lastIpAddress}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedIpUser(user);
                                setIpDialogOpen(true);
                              }}
                              className="h-6 w-6 p-0 hover:bg-muted"
                              title="View full IP"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">No IP</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.disabled ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"
                        }`}>
                          {user.disabled ? "Disabled" : "Active"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/admin/users/${user.id}`)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                            title="Audit"
                          >
                            <FileText className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUserToDisable(user);
                              setIsDisableDialogOpen(true);
                            }}
                            className={`h-8 w-8 p-0 ${
                              user.disabled 
                                ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                                : "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                            }`}
                            title={user.disabled ? "Enable User" : "Disable User"}
                          >
                            {user.disabled ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Loading indicator row */}
                {isFetchingNextPage && (
                  <tr>
                    <td colSpan={10} className="text-center py-4">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                        <span className="text-sm text-muted-foreground">Loading more users...</span>
                      </div>
                    </td>
                  </tr>
                )}
                
                {allUsers.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-muted-foreground">
                      No users found for selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Footer */}
        {allUsers.length > 0 && (
          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            Showing {allUsers.length} of {totalUsers} users
            {hasNextPage && " - Scroll down to load more"}
          </p>
        )}

        {/* All Dialogs (same as before) */}
        {/* IP Address Details Dialog */}
        <Dialog open={ipDialogOpen} onOpenChange={setIpDialogOpen}>
          <DialogContent className="w-[90vw] max-w-sm sm:max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>IP Address Details</DialogTitle>
              <DialogDescription>
                {selectedIpUser?.firstName 
                  ? `IP information for ${selectedIpUser.firstName} ${selectedIpUser.lastName || ''}`
                  : 'User IP information'}
              </DialogDescription>
            </DialogHeader>
            
            {selectedIpUser && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">User Information:</p>
                    <p className="text-sm">
                      <span className="font-medium">Name:</span> {selectedIpUser.firstName} {selectedIpUser.lastName || ''}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {selectedIpUser.email}
                    </p>
                  </div>
                  
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium text-muted-foreground mb-2">IP Address:</p>
                    <div className="bg-black/20 p-3 rounded-lg">
                      <p className="text-sm font-mono break-all">{selectedIpUser.lastIpAddress}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      This is the last known IP address used by this user
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIpDialogOpen(false);
                  setSelectedIpUser(null);
                }}
                className="mt-3 sm:mt-0"
              >
                Close
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  if (selectedIpUser?.lastIpAddress) {
                    navigator.clipboard.writeText(selectedIpUser.lastIpAddress);
                    toast({
                      title: "Copied!",
                      description: "IP address copied to clipboard",
                    });
                  }
                }}
              >
                Copy IP
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-full sm:max-w-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit User</DialogTitle>
            <DialogDescription className="text-sm">
              Update user details, credentials, and permissions
            </DialogDescription>
            <div className="w-full flex">
              <Button 
                onClick={handleUpdate} 
                disabled={updateMutation.isPending}
                className="ml-auto w-fit sm:w-auto text-xs sm:text-sm"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm sm:text-base">Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="text-sm sm:text-base"
                  data-testid="input-edit-email"
                />
              </div>
              <div>
                <Label className="text-sm sm:text-base">Phone Number</Label>
                <Input
                  value={editForm.phoneNumber}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phoneNumber: e.target.value })
                  }
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-sm sm:text-base">First Name</Label>
                  <Input
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, firstName: e.target.value })
                    }
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label className="text-sm sm:text-base">Last Name</Label>
                  <Input
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lastName: e.target.value })
                    }
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-sm sm:text-base">Balance (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.balance}
                    onChange={(e) =>
                      setEditForm({ ...editForm, balance: e.target.value })
                    }
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label className="text-sm sm:text-base">Ringtone Points</Label>
                  <Input
                    type="number"
                    value={editForm.ringtonePoints}
                    onChange={(e) =>
                      setEditForm({ ...editForm, ringtonePoints: e.target.value })
                    }
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm sm:text-base">Notes</Label>
                <Textarea
                  value={editForm.notes || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  placeholder="Add notes about this user..."
                  className="text-sm sm:text-base min-h-[80px]"
                />
              </div>
              {/* Address Information */}
              {(editingUser?.addressStreet || editingUser?.addressCity || editingUser?.addressPostcode) && (
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-base font-semibold">Delivery Address</Label>
                  <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2 text-sm">
                    {editingUser?.addressStreet && (
                      <p><span className="font-medium">Street:</span> {editingUser.addressStreet}</p>
                    )}
                    {editingUser?.addressCity && (
                      <p><span className="font-medium">City:</span> {editingUser.addressCity}</p>
                    )}
                    {editingUser?.addressPostcode && (
                      <p><span className="font-medium">Postcode:</span> {editingUser.addressPostcode}</p>
                    )}
                    {editingUser?.addressCountry && (
                      <p><span className="font-medium">Country:</span> {editingUser.addressCountry}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-3 border-t pt-4">
                <Label className="text-base font-semibold">Role & Permissions</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={editForm.isAdmin}
                    onChange={(e) =>
                      setEditForm({ ...editForm, isAdmin: e.target.checked })
                    }
                    disabled={editingUser?.id === currentUser?.id}
                    className="w-4 h-4"
                    data-testid="checkbox-is-admin"
                  />
                  <Label htmlFor="isAdmin" className="text-sm sm:text-base">Admin User</Label>
                  {editingUser?.id === currentUser?.id && (
                    <span className="text-xs text-muted-foreground">(Cannot change own role)</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 border-t pt-4">
                <Label className="text-base font-semibold">Account Status</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    editingUser?.disabled
                      ? "bg-red-500/20 text-red-500"
                      : "bg-green-500/20 text-green-500"
                  }`}>
                    {editingUser?.disabled ? "Disabled" : "Active"}
                  </div>
                  {editingUser?.disabledAt && (
                    <p className="text-sm text-muted-foreground">
                      Disabled on: {new Date(editingUser.disabledAt).toLocaleDateString()}
                    </p>
                  )}
                  {editingUser?.disabledUntil && (
                    <p className="text-sm text-muted-foreground">
                      Disabled until: {new Date(editingUser.disabledUntil).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 border-t pt-4">
                <Label className="text-base font-semibold">Password Reset</Label>
                <p className="text-sm text-muted-foreground">
                  Set a new password for this user (minimum 6 characters)
                </p>
                {!passwordResetConfirm ? (
                  <Button
                    variant="outline"
                    onClick={() => setPasswordResetConfirm(true)}
                    className="w-full text-sm sm:text-base"
                    data-testid="button-reset-password"
                  >
                    Reset Password
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">This will immediately change the user's password</span>
                    </div>
                    <Input
                      type="password"
                      placeholder="New password (min 6 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="text-sm sm:text-base"
                      data-testid="input-new-password"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPasswordResetConfirm(false);
                          setNewPassword("");
                        }}
                        className="flex-1 text-sm sm:text-base"
                        data-testid="button-cancel-password"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePasswordReset}
                        disabled={resetPasswordMutation.isPending || newPassword.length < 6}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-sm sm:text-base"
                        data-testid="button-confirm-password"
                      >
                        {resetPasswordMutation.isPending ? "Resetting..." : "Confirm Reset"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setEditingUser(null)}
                disabled={updateMutation.isPending}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={updateMutation.isPending}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Disable User Dialog */}
        <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
          <DialogContent className="max-w-full sm:max-w-md p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {userToDisable?.disabled ? "Enable User" : "Disable User"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {userToDisable?.disabled 
                  ? "This will enable the user account and restore access."
                  : "Temporarily disable this user account."
                }
              </DialogDescription>
            </DialogHeader>
            
            {!userToDisable?.disabled && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="disableDays" className="text-sm sm:text-base">Duration (days)</Label>
                  <Input
                    id="disableDays"
                    type="number"
                    min="0"
                    placeholder="Enter days (0 for indefinite)"
                    value={disableDays}
                    onChange={(e) => setDisableDays(e.target.value)}
                    className="mt-1 text-sm sm:text-base"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter 0 to disable indefinitely
                  </p>
                </div>
                
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-500">User will not be able to:</p>
                      <ul className="list-disc list-inside mt-1 text-amber-500/80">
                        <li>Log into their account</li>
                        <li>Make purchases</li>
                        <li>Enter competitions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {userToDisable?.disabled && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-500">User will be able to:</p>
                    <ul className="list-disc list-inside mt-1 text-green-500/80">
                      <li>Access their account normally</li>
                      <li>Make purchases and entries</li>
                      <li>Use all platform features</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDisableDialogOpen(false);
                  setUserToDisable(null);
                }}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                variant={userToDisable?.disabled ? "default" : "destructive"}
                onClick={() => {
                  if (userToDisable) {
                    if (userToDisable.disabled) {
                      enableUserMutation.mutate(userToDisable.id);
                    } else {
                      const days = parseInt(disableDays);
                      if (isNaN(days) || days < 0) {
                        toast({
                          title: "Invalid duration",
                          description: "Please enter a valid number of days",
                          variant: "destructive",
                        });
                        return;
                      }
                      disableUserMutation.mutate({ 
                        userId: userToDisable.id, 
                        days 
                      });
                    }
                  }
                }}
                disabled={disableUserMutation.isPending || enableUserMutation.isPending}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                {disableUserMutation.isPending || enableUserMutation.isPending
                  ? "Processing..." 
                  : userToDisable?.disabled 
                    ? "Enable User" 
                    : "Disable User"
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="max-w-full sm:max-w-md p-4 sm:p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl">Delete User</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Are you sure you want to delete <strong>{userToDelete?.email}</strong>? 
                This action cannot be undone and will remove all user data.
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

        {/* Daily Limit Reset Dialog */}
        <Dialog open={dailyLimitDialogOpen} onOpenChange={setDailyLimitDialogOpen}>
          <DialogContent className="max-w-full sm:max-w-md p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Reset Daily Spending Limit</DialogTitle>
              <DialogDescription className="text-sm">
                This will reset the user's daily spending limit to "No Limit"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="space-y-2">
                  <p className="font-medium">User Details:</p>
                  <p className="text-sm">
                    <span className="font-medium">Name:</span> {userForDailyLimitReset?.firstName} {userForDailyLimitReset?.lastName}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {userForDailyLimitReset?.email}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Current Daily Limit:</span>{" "}
                    {userForDailyLimitReset?.dailySpendLimit ? (
                      <span className="font-medium text-primary">
                        £{parseFloat(userForDailyLimitReset.dailySpendLimit).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </p>
                  {userForDailyLimitReset?.dailyLimitLastUpdatedAt && (
                    <p className="text-sm">
                      <span className="font-medium">Last Updated:</span>{" "}
                      {new Date(userForDailyLimitReset.dailyLimitLastUpdatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-500">What happens after reset:</p>
                    <ul className="list-disc list-inside mt-1 text-amber-500/80">
                      <li>Daily spending limit will be removed</li>
                      <li>User can set a new limit immediately</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setDailyLimitDialogOpen(false);
                  setUserForDailyLimitReset(null);
                }}
                disabled={resetDailyLimitMutation.isPending}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (userForDailyLimitReset) {
                    resetDailyLimitMutation.mutate(userForDailyLimitReset.id);
                    setDailyLimitDialogOpen(false);
                  }
                }}
                disabled={resetDailyLimitMutation.isPending}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                {resetDailyLimitMutation.isPending ? "Resetting..." : "Reset Limit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}