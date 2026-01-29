import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Trash2, Edit2, Calendar, ArrowBigLeft, ArrowBigRight, CheckCircle, XCircle, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DiscountCode {
  id: string;
  code: string;
  type: "cash" | "points";
  value: number;
  maxUses: number;
  usesCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

type DateFilter = "all" | "7d" | "30d" | "90d" | "custom";

export default function AdminDiscountCodes() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const itemsPerPage = 20;

  // Form state
  const [form, setForm] = useState({
    code: "",
    type: "cash" as "cash" | "points",
    value: 0,
    maxUses: 1,
    expiresAt: "",
    isActive: true,
  });

  // Fetch discount codes
  const { data: allCodes, isLoading } = useQuery<DiscountCode[]>({
    queryKey: ["/api/admin/discount-codes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/discount-codes", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch discount codes");
      return res.json();
    },
  });

  console.log(allCodes)

  // Filter codes based on search
  const codes = allCodes?.filter((code) => {
    if (!searchInput.trim()) return true;
    const searchLower = searchInput.toLowerCase().trim();
    return (
      code.code.toLowerCase().includes(searchLower) ||
      code.type.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Pagination
  const totalPages = Math.ceil(codes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCodes = codes.slice(startIndex, startIndex + itemsPerPage);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("/api/admin/discount-codes", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      toast({
        title: "Discount Code Created",
        description: "The discount code has been successfully created.",
      });
      setForm({
        code: "",
        type: "cash",
        value: 0,
        maxUses: 1,
        expiresAt: "",
        isActive: true,
      });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create discount code",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DiscountCode> }) => {
      return apiRequest(`/api/admin/discount-codes/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      toast({
        title: "Discount Code Updated",
        description: "The discount code has been successfully updated.",
      });
      setEditingCode(null);
      setEditDialogOpen(false);
      setForm({
        code: "",
        type: "cash",
        value: 0,
        maxUses: 1,
        expiresAt: "",
        isActive: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update discount code",
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest(`/api/admin/discount-codes/${id}/toggle-active`, "PATCH", { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      toast({
        title: "Status Updated",
        description: "Discount code status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/discount-codes/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      toast({
        title: "Discount Code Deleted",
        description: "The discount code has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setCodeToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete discount code",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code);
    setForm({
      code: code.code,
      type: code.type,
      value: code.value,
      maxUses: code.maxUses,
      expiresAt: code.expiresAt ? code.expiresAt.split("T")[0] : "",
      isActive: code.isActive,
    });
    setEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCode) {
      updateMutation.mutate({
        id: editingCode.id,
        data: {
          ...form,
          value: Number(form.value),
          maxUses: Number(form.maxUses),
        },
      });
    } else {
      createMutation.mutate({
        ...form,
        value: Number(form.value),
        maxUses: Number(form.maxUses),
      });
    }
  };

  const handleDelete = (id: string) => {
    setCodeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (codeToDelete) {
      deleteMutation.mutate(codeToDelete);
    }
  };

  const handleToggleActive = (code: DiscountCode) => {
    toggleActiveMutation.mutate({
      id: code.id,
      isActive: !code.isActive,
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

  const totalUses = codes?.reduce((sum, code) => sum + code.usesCount, 0) || 0;
  const activeCodes = codes?.filter((code) => code.isActive).length || 0;
  const expiredCodes = codes?.filter((code) => 
    code.expiresAt && new Date(code.expiresAt) < new Date()
  ).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Discount Codes
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Create and manage discount codes
            </p>
          </div>
          
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCode ? "Edit Discount Code" : "Create Discount Code"}
                </DialogTitle>
                <DialogDescription>
                  {editingCode 
                    ? "Update the discount code details below."
                    : "Create a new discount code for customers to use."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    name="code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SUMMER25"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value: "cash" | "points") => 
                      setForm({ ...form, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash Discount (£)</SelectItem>
                      <SelectItem value="points">Points</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">
                    Value * {form.type === "cash" ? "(£)" : "(Points)"}
                  </Label>
                  <Input
                    id="value"
                    name="value"
                    type="number"
                    min="1"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUses">Maximum Uses *</Label>
                  <Input
                    id="maxUses"
                    name="maxUses"
                    type="number"
                    min="1"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
                  <Input
                    id="expiresAt"
                    name="expiresAt"
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                </div>

                {editingCode && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={form.isActive}
                      onCheckedChange={(checked) => 
                        setForm({ ...form, isActive: checked })
                      }
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditDialogOpen(false);
                      setEditingCode(null);
                      setForm({
                        code: "",
                        type: "cash",
                        value: 0,
                        maxUses: 1,
                        expiresAt: "",
                        isActive: true,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : editingCode
                      ? "Update Code"
                      : "Create Code"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{codes.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Uses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUses}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{activeCodes}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expired Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{expiredCodes}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search codes by code or type..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Code
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Value
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Uses
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Max Uses
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Expiry
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Created
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedCodes.map((code) => {
                  const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
                  const isFullyUsed = code.usesCount >= code.maxUses;
                  
                  return (
                    <tr key={code.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-mono font-medium text-foreground">
                          {code.code}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={code.type === "cash" ? "default" : "secondary"}>
                          {code.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {code.type === "cash" ? `£${code.value}` : `${code.value} pts`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(code.usesCount / code.maxUses) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm">{code.usesCount}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {code.maxUses}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {code.expiresAt 
                          ? format(new Date(code.expiresAt), "dd MMM yyyy")
                          : "Never"
                        }
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(code)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                              code.isActive ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                code.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-sm">
                            {code.isActive ? (
                              <span className="flex items-center text-green-500">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center text-red-500">
                                <XCircle className="w-4 h-4 mr-1" />
                                Inactive
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {format(new Date(code.createdAt), "dd MMM yyyy")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(code)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(code.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {paginatedCodes.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-lg font-medium">No discount codes found</div>
                        <div className="text-sm mt-1">
                          {searchInput ? "Try a different search term" : "Create your first discount code"}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {codes.length > 0 && (
          <>
            <div className="flex justify-center items-center gap-4 my-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
              >
                <ArrowBigLeft className="w-4 h-4" />
              </Button>

              <span className="font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
              >
                <ArrowBigRight className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Showing {paginatedCodes.length} of {codes.length} discount codes
            </p>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Discount Code</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this discount code? This action cannot be undone.
                Any users with this code applied will lose the discount.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteMutation.isPending}
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