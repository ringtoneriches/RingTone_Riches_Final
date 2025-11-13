import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Search, AlertTriangle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  balance: string;
  ringtonePoints: number;
  isAdmin: boolean;
  createdAt: string;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostcode: string | null;
  addressCountry: string | null;
}

type DateFilter = "all" | "24h" | "7d" | "30d" | "custom";

export default function AdminUsers() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth() as { user: User | null };
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
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
    isAdmin: false,
  });

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

  // Structured query key for proper cache invalidation
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users", { dateFrom, dateTo, search: searchTerm }],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);
      if (searchTerm) queryParams.append("search", searchTerm);
      
      const url = queryParams.toString() 
        ? `/api/admin/users?${queryParams.toString()}`
        : "/api/admin/users";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

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
        balance: parseFloat(editForm.balance).toFixed(2),
        ringtonePoints: parseInt(editForm.ringtonePoints),
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
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="heading-users">
              Users
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Manage platform users</p>
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
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-users"
          />
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Balance
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Points
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Joined
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm text-foreground">{user.email}</td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {user.firstName} {user.lastName || ""}
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          data-testid={`button-edit-user-${user.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details, credentials, and permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  data-testid="input-edit-email"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Balance (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.balance}
                    onChange={(e) =>
                      setEditForm({ ...editForm, balance: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Ringtone Points</Label>
                  <Input
                    type="number"
                    value={editForm.ringtonePoints}
                    onChange={(e) =>
                      setEditForm({ ...editForm, ringtonePoints: e.target.value })
                    }
                  />
                </div>
              </div>
              
              {/* Address Information */}
              {(editingUser?.addressStreet || editingUser?.addressCity || editingUser?.addressPostcode) && (
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-base font-semibold">Delivery Address</Label>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    {editingUser?.addressStreet && (
                      <p className="text-sm"><span className="font-medium">Street:</span> {editingUser.addressStreet}</p>
                    )}
                    {editingUser?.addressCity && (
                      <p className="text-sm"><span className="font-medium">City:</span> {editingUser.addressCity}</p>
                    )}
                    {editingUser?.addressPostcode && (
                      <p className="text-sm"><span className="font-medium">Postcode:</span> {editingUser.addressPostcode}</p>
                    )}
                    {editingUser?.addressCountry && (
                      <p className="text-sm"><span className="font-medium">Country:</span> {editingUser.addressCountry}</p>
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
                  <Label htmlFor="isAdmin">Admin User</Label>
                  {editingUser?.id === currentUser?.id && (
                    <span className="text-xs text-muted-foreground">(Cannot change own role)</span>
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
                    className="w-full"
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
                      data-testid="input-new-password"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPasswordResetConfirm(false);
                          setNewPassword("");
                        }}
                        className="flex-1"
                        data-testid="button-cancel-password"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePasswordReset}
                        disabled={resetPasswordMutation.isPending || newPassword.length < 6}
                        className="flex-1 bg-red-500 hover:bg-red-600"
                        data-testid="button-confirm-password"
                      >
                        {resetPasswordMutation.isPending ? "Resetting..." : "Confirm Reset"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingUser(null)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{userToDelete?.email}</strong>? 
                This action cannot be undone and will remove all user data.
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
      </div>
    </AdminLayout>
  );
}
