import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Search, AlertTriangle, Calendar, FileText, ArrowUp, ArrowDown, ChevronUp, ChevronDown, ArrowBigLeft, ArrowBigRight, CheckCircle,  XCircle, Users, Badge, Shield, AlertTriangleIcon, Download } from "lucide-react";
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
import { getTotalCashflow } from "../wallet";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectItem } from "@radix-ui/react-select";

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
}

type DateFilter = "all" | "24h" | "7d" | "30d" | "custom";
type SortOrder = "asc" | "desc" | null;
type SortField = "balance" | "ringtonePoints" | "phoneNumber" | "firstName" | "createdAt" | "email" | null;
type SortFieldCashflow = "cashflowBalance" | null;

// Add CSV export function
const exportToCSV = (users: User[], cashflowTransactions: Transaction[]) => {
  // Helper function to get cashflow total for a user
  const getCashflowTotal = (userId: string) => {
    const userTx = cashflowTransactions.find(tx => tx.userId === userId);
    return userTx ? parseFloat(userTx.totalCashflow).toFixed(2) : "0.00";
  };

  // Define CSV headers
  const headers = [
    "Email",
    "First Name",
    "Last Name",
    "Phone Number",
    "Balance (£)",
    "Ringtone Points",
    "Cashflow (£)",
    "Role",
    "Status",
    "Joined Date",
    "Address Street",
    "Address City",
    "Address Postcode",
    "Address Country",
    "Notes",
    "Daily Spend Limit (£)",
    "Disabled",
    "Disabled At",
    "Disabled Until"
  ];

  // Map user data to CSV rows
  const rows = users.map(user => [
    user.email,
    user.firstName || "",
    user.lastName || "",
    user.phoneNumber || "",
    parseFloat(user.balance).toFixed(2),
    user.ringtonePoints.toString(),
    getCashflowTotal(user.id),
    user.isAdmin ? "Admin" : "User",
    user.disabled ? "Disabled" : "Active",
    new Date(user.createdAt).toLocaleDateString(),
    user.addressStreet || "",
    user.addressCity || "",
    user.addressPostcode || "",
    user.addressCountry || "",
    (user.notes || "").replace(/,/g, ';'), // Replace commas to avoid CSV issues
    user.dailySpendLimit ? parseFloat(user.dailySpendLimit).toFixed(2) : "Not set",
    user.disabled ? "Yes" : "No",
    user.disabledAt ? new Date(user.disabledAt).toLocaleDateString() : "",
    user.disabledUntil ? new Date(user.disabledUntil).toLocaleDateString() : ""
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  // Create and download the file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function AdminUsers() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth() as { user: User | null };
  const [searchInput, setSearchInput] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordResetConfirm, setPasswordResetConfirm] = useState(false);
  const [resetAll , setResetAll] = useState(null);
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
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortFieldCashflow, setSortFieldCashflow] = useState<SortFieldCashflow>(null);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [userToDisable, setUserToDisable] = useState<User | null>(null);
  const [disableDays, setDisableDays] = useState("7");
  const [dailyLimitDialogOpen, setDailyLimitDialogOpen] = useState(false);
  const [userForDailyLimitReset, setUserForDailyLimitReset] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [currentPage , setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  // Calculate date range (memoized to prevent infinite loops)
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

  // Fetch users (only date filtering on backend)
  const { data: allUsers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users", { dateFrom, dateTo }],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);
      
      const url = queryParams.toString() 
        ? `/api/admin/users?${queryParams.toString()}`
        : "/api/admin/users";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { data: cashflowTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/users/cashflow-transactions"],
  });
  
  const getCashflowTotal = (userId: string) => {
    const userTx = cashflowTransactions.find(tx => tx.userId === userId);
    return userTx ? parseFloat(userTx.totalCashflow).toFixed(2) : "0.00";
  };
  
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
      // New field, start with asc and reset cashflow sort
      setSortFieldCashflow(null);
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

  // Client-side filtering and sorting - UPDATED to include phone number search
  const users = useMemo(() => {
    if (!allUsers) return [];
    
    let filtered = [...allUsers];
    
    // Apply search filter - NOW INCLUDES PHONE NUMBER
    if (searchInput.trim()) {
      const searchLower = searchInput.toLowerCase().trim();
      filtered = filtered.filter((user) => {
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase().trim();
        const email = user.email?.toLowerCase() || "";
        const phoneNumber = user.phoneNumber?.toLowerCase() || ""; // Add phone number search
        
        return (
          fullName.includes(searchLower) ||
          email.includes(searchLower) ||
          phoneNumber.includes(searchLower) // Include phone number in search
        );
      });
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => {
        if (roleFilter === "admin") return user.isAdmin === true;
        if (roleFilter === "user") return user.isAdmin !== true;
        return true;
      });
    }
    
    // Apply sorting - check both sortField and sortFieldCashflow
    if ((sortField || sortFieldCashflow) && sortOrder) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        // Handle cashflow sorting
        if (sortFieldCashflow === "cashflowBalance") {
          aValue = parseFloat(getCashflowTotal(a.id));
          bValue = parseFloat(getCashflowTotal(b.id));
        } 
        // Handle regular field sorting
        else if (sortField) {
          switch (sortField) {
            case "balance":
              aValue = parseFloat(a.balance);
              bValue = parseFloat(b.balance);
              break;
            case "ringtonePoints":
              aValue = a.ringtonePoints;
              bValue = b.ringtonePoints;
              break;
            case "firstName":
              // Sort by full name or individual first name
              aValue = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase().trim();
              bValue = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase().trim();
              break;
            case "phoneNumber":
              aValue = a.phoneNumber?.toLowerCase() || "";
              bValue = b.phoneNumber?.toLowerCase() || "";
              break;
            case "createdAt":
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
            case "email":
              aValue = a.email.toLowerCase();
              bValue = b.email.toLowerCase();
              break;
            default:
              return 0;
          }
        } else {
          return 0;
        }
        
        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }
    
    return filtered;
  }, [allUsers, searchInput, sortField, sortFieldCashflow, roleFilter, sortOrder, getCashflowTotal]);
 
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = users.slice(startIndex , startIndex + itemsPerPage);

  // Handle CSV export
  const handleExportCSV = () => {
    try {
      exportToCSV(users, cashflowTransactions);
      toast({
        title: "Export Successful",
        description: `${users.length} users exported to CSV`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export users",
        variant: "destructive",
      });
    }
  };

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

  const resetAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/admin/full-reset`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "All data reset successfully",
        description: "The data has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete data",
        variant: "destructive",
      });
    },
  });

  // Disable user mutation
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

  // Enable user mutation
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
      setDisableDays("7"); // Reset to default
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

  // Add this with your other mutations
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

  const handleSortCashflow = (field: SortFieldCashflow) => {
    if (sortFieldCashflow === field) {
      // Cycle: asc → desc → none
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortFieldCashflow(null);
        setSortOrder(null);
      } else {
        setSortOrder("asc");
      }
    } else {
      // New field - reset regular sort field
      setSortField(null);
      setSortFieldCashflow(field);
      setSortOrder("asc");
    }
  };

  const getSortIconCashflow = (field: SortFieldCashflow) => {
    if (sortFieldCashflow === field) {
      return sortOrder === "asc" ? (
        <ChevronUp className="w-4 h-4 ml-1" />
      ) : (
        <ChevronDown className="w-4 h-4 ml-1" />
      );
    }

    return (
      <div className="inline-flex flex-col ml-1">
        <ChevronUp className="w-3 h-3 -mb-1 text-gray-400 opacity-50" />
        <ChevronDown className="w-3 h-3 text-gray-400 opacity-50" />
      </div>
    );
  };
  
  const handleResetAll = () => {
    resetAllMutation.mutate()
  }

  const handleDeleteUser = (user: User) => {
    // Prevent deleting yourself
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

    // Prevent self-demotion
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
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground" data-testid="heading-users">
              Users
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">Manage platform users</p>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
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
                All Time
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
          <div className="flex gap-2">
            {/* <button 
              onClick={handleResetAll}
              className="bg-yellow-400 text-black px-2 py-1 sm:px-3 sm:py-1 rounded-sm text-xs sm:text-sm">
              Reset All
            </button> */}
            
            {/* ADDED: CSV Export Button */}
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

        {/* UPDATED: Search input placeholder now mentions phone numbers */}
        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
          <Input
            placeholder="Search users by email, name, or phone number..."
            value={searchInput}
            autoComplete="off"
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 sm:pl-10 text-sm sm:text-base"
            data-testid="input-search-users"
          />
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-3">
          {paginatedUsers?.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="space-y-4">
                {/* User Info */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-foreground">{user.email}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {user.firstName} {user.lastName || ""}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isAdmin
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {user.isAdmin ? "Admin" : "User"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.disabled
                          ? "bg-red-500/20 text-red-500"
                          : "bg-green-500/20 text-green-500"
                      }`}
                    >
                      {user.disabled ? "Disabled" : "Active"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Phone</div>
                    <div className="font-medium">{user.phoneNumber || "-"}</div>
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

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => user?.id && setLocation(`/admin/users/${user.id}`)}
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
                    onClick={() => {
                      setUserForDailyLimitReset(user);
                      setDailyLimitDialogOpen(true);
                    }}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-xs px-2"
                  >
                    <AlertTriangleIcon className="w-3 h-3 mr-1" />
                    Limit
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
          ))}
          
          {paginatedUsers?.length === 0 && (
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

        {/* Desktop Table View */}
        <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th 
                    className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center">
                      Email
                      {getSortIcon("email")}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSort("firstName")}
                  >
                    <div className="flex items-center">
                      Name
                      {getSortIcon("firstName")}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSort("phoneNumber")}
                  >
                    <div className="flex items-center">
                      Phone
                      {getSortIcon("phoneNumber")}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground flex cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSortCashflow("cashflowBalance")}
                  >
                    <div>
                      Cashflow
                    </div>
                    <div>
                      {getSortIconCashflow("cashflowBalance")}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSort("balance")}
                  >
                    <div className="flex items-center">
                      Balance
                      {getSortIcon("balance")}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSort("ringtonePoints")}
                  >
                    <div className="flex items-center">
                      Points
                      {getSortIcon("ringtonePoints")}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Role
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center">
                      Joined
                      {getSortIcon("createdAt")}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers?.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
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
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isAdmin
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {user.isAdmin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.disabled
                            ? "bg-red-500/20 text-red-500"
                            : "bg-green-500/20 text-green-500"
                        }`}
                      >
                        {user.disabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => user?.id && setLocation(`/admin/users/${user.id}`)}
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
                          onClick={() => {
                            setUserForDailyLimitReset(user);
                            setDailyLimitDialogOpen(true);
                          }}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-8 w-8 p-0"
                          title="Reset Daily Limit"
                        >
                          <AlertTriangleIcon className="w-3 h-3" />
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        {paginatedUsers?.length > 0 && (
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

            <p className="text-center text-xs sm:text-sm text-muted-foreground">
              Showing {paginatedUsers?.length || 0} of {allUsers?.length || 0} filtered entries
            </p>
          </>
        )}

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-full sm:max-w-2xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Edit User</DialogTitle>
              <DialogDescription className="text-sm">
                Update user details, credentials, and permissions
              </DialogDescription>
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