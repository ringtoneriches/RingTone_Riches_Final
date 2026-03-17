import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Search, Trash2, ArrowBigLeft, ArrowBigRight, 
  CheckCircle, XCircle, Plus, Download, Copy, 
  Power, Users, Calendar, Clock, Infinity, 
  Sparkles, Code, Tag, BarChart3
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface RedeemCode {
  id: string;
  code: string;
  amount: string;
  usageLimit: number | null;
  currentUses: number;
  isActive: boolean;
  isSystemGenerated: boolean;
  createdAt: string;
  expiresAt: string | null;
  createdBy: string | null;
  notes: string | null;
  // Backward compatibility fields
  isUsed?: boolean;
  usedByUserId?: string | null;
  usedAt?: string | null;
  // Computed fields
  status: "available" | "partially_used" | "fully_used" | "expired" | "inactive";
  usageRemaining: number | "unlimited";
  uniqueUserCount?: number;
  redemptions?: {
    id: string;
    amount: string;
    redeemedAt: string;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
  }[];
}

interface RedeemCodeStats {
  totalCodes: number;
  activeCodes: number;
  systemCodes: number;
  customCodes: number;
  totalRedemptions: number;
  uniqueUsers: number;
  totalValue: number;
  redeemedValue: number;
  remainingValue: number;
}

export default function AdminRedeemCodes() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "system" | "custom" | "expired">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [createCustomOpen, setCreateCustomOpen] = useState(false);
  const [editLimitDialogOpen, setEditLimitDialogOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);
  const [codeToEdit, setCodeToEdit] = useState<RedeemCode | null>(null);
  const [selectedCode, setSelectedCode] = useState<RedeemCode | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [viewRedemptionsOpen, setViewRedemptionsOpen] = useState(false);
  const itemsPerPage = 20;

  // Generate form state
  const [generateForm, setGenerateForm] = useState({
    amount: 10,
    quantity: 10,
    usageLimit: "",
    notes: "",
    expiresAt: "",
  });

  // Custom code form state
  const [customForm, setCustomForm] = useState({
    code: "",
    amount: 10,
    usageLimit: "",
    notes: "",
    expiresAt: "",
    isActive: true,
  });

  // Edit limit form state
  const [editLimitForm, setEditLimitForm] = useState({
    usageLimit: "",
  });

  // Helper function to build query URL
  const buildQueryUrl = () => {
    const params = new URLSearchParams();
    
    if (filter === "active") params.append("isActive", "true");
    if (filter === "inactive") params.append("isActive", "false");
    if (filter === "system") params.append("type", "system");
    if (filter === "custom") params.append("type", "custom");
    if (filter === "expired") {
      // We'll handle expired filtering on the client side
    }
    
    return `/api/admin/redeem-codes${params.toString() ? `?${params.toString()}` : ""}`;
  };

  // Fetch redeem codes
  const { data: allCodes, isLoading } = useQuery<RedeemCode[]>({
    queryKey: ["/api/admin/redeem-codes", filter],
    queryFn: async () => {
      const url = buildQueryUrl();
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch redeem codes");
      return res.json();
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
  console.log(allCodes)

  // Fetch stats
  const { data: stats } = useQuery<RedeemCodeStats>({
    queryKey: ["/api/admin/redeem-codes/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/redeem-codes/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  // Filter codes based on search and expiry
  const codes = allCodes?.filter((code) => {
    // First apply expiry filter
    if (filter === "expired") {
      if (!code.expiresAt) return false;
      return new Date(code.expiresAt) < new Date();
    }

    // Then apply search
    if (!searchInput.trim()) return true;
    const searchLower = searchInput.toLowerCase().trim();
    return (
      code.code.toLowerCase().includes(searchLower) ||
      code.notes?.toLowerCase().includes(searchLower) ||
      code.redemptions?.some(r => r.user?.email.toLowerCase().includes(searchLower))
    );
  }) || [];

  // Pagination
  const totalPages = Math.ceil(codes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCodes = codes.slice(startIndex, startIndex + itemsPerPage);

  // Generate codes mutation
  const generateMutation = useMutation({
    mutationFn: async (data: typeof generateForm) => {
      const res = await apiRequest("/api/admin/redeem-codes/generate", "POST", {
        amount: data.amount,
        quantity: data.quantity,
        usageLimit: data.usageLimit === "" ? null : Number(data.usageLimit),
        notes: data.notes,
        expiresAt: data.expiresAt || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/redeem-codes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/redeem-codes/stats"] });
      toast({
        title: "Codes Generated! 🎉",
        description: data.message || `Successfully generated ${generateForm.quantity} codes`,
      });
      setGenerateDialogOpen(false);
      setGenerateForm({
        amount: 10,
        quantity: 10,
        usageLimit: "",
        notes: "",
        expiresAt: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate codes",
        variant: "destructive",
      });
    },
  });

  // Create custom code mutation
  const createCustomMutation = useMutation({
    mutationFn: async (data: typeof customForm) => {
      const res = await apiRequest("/api/admin/redeem-codes/create-custom", "POST", {
        code: data.code.toUpperCase(),
        amount: data.amount,
        usageLimit: data.usageLimit === "" ? null : Number(data.usageLimit),
        notes: data.notes,
        expiresAt: data.expiresAt || undefined,
        isActive: data.isActive,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/redeem-codes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/redeem-codes/stats"] });
      toast({
        title: "Code Created! 🎉",
        description: "Custom redeem code created successfully",
      });
      setCreateCustomOpen(false);
      setCustomForm({
        code: "",
        amount: 10,
        usageLimit: "",
        notes: "",
        expiresAt: "",
        isActive: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create code",
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest(`/api/admin/redeem-codes/${id}/toggle`, "PATCH", { isActive });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/redeem-codes"] });
      toast({
        title: "Status Updated",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update code status",
        variant: "destructive",
      });
    },
  });

  // Update usage limit mutation
  const updateLimitMutation = useMutation({
  mutationFn: async ({ id, usageLimit }: { id: string; usageLimit: string }) => {
    const res = await apiRequest(`/api/admin/redeem-codes/${id}/limit`, "PATCH", { 
      // Fix: properly handle empty string
      usageLimit: usageLimit === "" ? null : Number(usageLimit)
    });
    return res.json();
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/redeem-codes"] });
    toast({
      title: "Limit Updated",
      description: data.message,
    });
    setEditLimitDialogOpen(false);
    setCodeToEdit(null);
  },
  onError: (error: any) => {
    toast({
      title: "Error",
      description: error.message || "Failed to update usage limit",
      variant: "destructive",
    });
  },
});

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/admin/redeem-codes/${id}`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/redeem-codes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/redeem-codes/stats"] });
      toast({
        title: "Code Deleted",
        description: "The redeem code has been deleted.",
      });
      setDeleteDialogOpen(false);
      setCodeToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete code",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate(generateForm);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomMutation.mutate(customForm);
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

  const handleToggleActive = (code: RedeemCode) => {
    toggleActiveMutation.mutate({ 
      id: code.id, 
      isActive: !code.isActive 
    });
  };

  const handleEditLimit = (code: RedeemCode) => {
    setCodeToEdit(code);
      setEditLimitForm({ usageLimit: code.usageLimit?.toString() || "" });
    setEditLimitDialogOpen(true);
  };

  const handleUpdateLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeToEdit) {
      updateLimitMutation.mutate({ 
        id: codeToEdit.id, 
        usageLimit: editLimitForm.usageLimit
      });
    }
  };

  const handleViewDetails = (code: RedeemCode) => {
    setSelectedCode(code);
    setViewDetailsOpen(true);
  };

  const handleViewRedemptions = (code: RedeemCode) => {
    setSelectedCode(code);
    setViewRedemptionsOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const downloadCodes = () => {
    const unusedCodes = codes.filter(c => c.isActive && c.currentUses === 0);
    const codesText = unusedCodes.map(c => c.code).join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redeem-codes-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
  };

  const getStatusBadge = (code: RedeemCode) => {
    const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
    
    if (!code.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (code.status === "fully_used") {
      return <Badge variant="secondary">Fully Used</Badge>;
    }
    if (code.status === "partially_used") {
      return <Badge variant="default" className="bg-blue-500">Partially Used</Badge>;
    }
    return <Badge variant="default" className="bg-green-500">Available</Badge>;
  };

  const getTypeBadge = (code: RedeemCode) => {
    if (code.isSystemGenerated) {
      return <Badge variant="outline" className="border-purple-500 text-purple-500">Flyer</Badge>;
    }
    return <Badge variant="outline" className="border-orange-500 text-orange-500">Custom</Badge>;
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              Redeem Codes
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
              Create and manage redeem codes with flexible usage limits
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={downloadCodes}
              disabled={!codes.some(c => c.isActive && c.currentUses === 0)}
              className="gap-1 sm:gap-2  text-sm sm:text-base flex-1 sm:flex-auto"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Download Unused</span>
              <span className="sm:hidden">Download</span>
            </Button>

            <Dialog open={createCustomOpen} onOpenChange={setCreateCustomOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-1 sm:gap-2 bg-yellow-500 hover:bg-yellow-600 text-black hover:text-black flex-1 sm:flex-auto">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Create Custom</span>
                  <span className="sm:hidden">Custom</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    Create Custom Code
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Create a single custom redeem code with your own text
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateCustom} className="space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="customCode" className="text-sm sm:text-base">Code *</Label>
                    <Input
                      id="customCode"
                      value={customForm.code}
                      onChange={(e) => setCustomForm({ ...customForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., SUMMER2024"
                      required
                      pattern="[A-Z0-9]+"
                      title="Only uppercase letters and numbers, 3-20 characters"
                      className="text-sm sm:text-base font-mono"
                      maxLength={20}
                    />
                    <p className="text-xs text-muted-foreground">
                      Only uppercase letters and numbers, 2-20 characters
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="customAmount" className="text-sm sm:text-base">Amount (£) *</Label>
                    <Input
                      id="customAmount"
                      type="number"
                      min="1"
                      step="0.01"
                      value={customForm.amount}
                      onChange={(e) => setCustomForm({ ...customForm, amount: Number(e.target.value) })}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="customUsageLimit" className="text-sm sm:text-base">Usage Limit</Label>
                    <Input
                      id="customUsageLimit"
                      type="number"
                      min="1"
                      value={customForm.usageLimit}
                     onChange={(e) => setCustomForm({ 
                    ...customForm, 
                    usageLimit: e.target.value 
                  })}
                      placeholder="Leave empty for unlimited"
                      className="text-sm sm:text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      1 = single use, leave empty for unlimited uses
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="customIsActive"
                      checked={customForm.isActive}
                      onCheckedChange={(checked) => setCustomForm({ ...customForm, isActive: checked })}
                    />
                    <Label htmlFor="customIsActive" className="text-sm">Active on creation</Label>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="customExpiresAt" className="text-sm sm:text-base">Expiry Date (Optional)</Label>
                    <Input
                      id="customExpiresAt"
                      type="date"
                      value={customForm.expiresAt}
                      onChange={(e) => setCustomForm({ ...customForm, expiresAt: e.target.value })}
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="customNotes" className="text-sm sm:text-base">Notes (Optional)</Label>
                    <Input
                      id="customNotes"
                      value={customForm.notes}
                      onChange={(e) => setCustomForm({ ...customForm, notes: e.target.value })}
                      placeholder="e.g., VIP customer"
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCreateCustomOpen(false);
                        setCustomForm({
                          code: "",
                          amount: 10,
                          usageLimit: "",
                          notes: "",
                          expiresAt: "",
                          isActive: true,
                        });
                      }}
                      className="w-full sm:w-auto text-sm sm:text-base"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCustomMutation.isPending}
                      className="w-full sm:w-auto text-sm sm:text-base"
                    >
                      {createCustomMutation.isPending ? "Creating..." : "Create Code"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1 sm:gap-2 text-sm sm:text-base flex-1 sm:flex-auto">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Generate Batch</span>
                  <span className="sm:hidden">Batch</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    Generate Batch Codes
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Create multiple redeem codes for your campaign
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="amount" className="text-sm sm:text-base">Amount per Code (£) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      value={generateForm.amount}
                      onChange={(e) => setGenerateForm({ ...generateForm, amount: Number(e.target.value) })}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="quantity" className="text-sm sm:text-base">Number of Codes *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="1000"
                      value={generateForm.quantity}
                      onChange={(e) => setGenerateForm({ ...generateForm, quantity: Number(e.target.value) })}
                      required
                      className="text-sm sm:text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Max 1000 codes at once
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="usageLimit" className="text-sm sm:text-base">Usage Limit per Code</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      min="1"
                      value={generateForm.usageLimit}
                      onChange={(e) => setGenerateForm({ 
      ...generateForm, 
      usageLimit: e.target.value 
    })}
                      placeholder="Leave empty for unlimited"
                      className="text-sm sm:text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      1 = single use, leave empty for unlimited uses per code
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="expiresAt" className="text-sm sm:text-base">Expiry Date (Optional)</Label>
                    <Input
                      id="expiresAt"
                      type="date"
                      value={generateForm.expiresAt}
                      onChange={(e) => setGenerateForm({ ...generateForm, expiresAt: e.target.value })}
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="notes" className="text-sm sm:text-base">Batch Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={generateForm.notes}
                      onChange={(e) => setGenerateForm({ ...generateForm, notes: e.target.value })}
                      placeholder="e.g., Summer campaign 2024"
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="bg-muted/30 p-3 rounded-lg mb-4">
                      <div className="text-sm font-medium mb-2">Summary</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Total Value:</div>
                        <div className="font-bold text-green-500">
                          £{(generateForm.amount * generateForm.quantity).toFixed(2)}
                        </div>
                        <div>Total Codes:</div>
                        <div>{generateForm.quantity}</div>
                        {generateForm.usageLimit && (
                          <>
                            <div>Max Total Uses:</div>
                            <div>{generateForm.quantity * generateForm.usageLimit}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setGenerateDialogOpen(false);
                        setGenerateForm({
                          amount: 10,
                          quantity: 10,
                          usageLimit: "",
                          notes: "",
                          expiresAt: "",
                        });
                      }}
                      className="w-full sm:w-auto text-sm sm:text-base"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={generateMutation.isPending}
                      className="w-full sm:w-auto text-sm sm:text-base"
                    >
                      {generateMutation.isPending ? "Generating..." : "Generate Codes"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog> */}
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card className="p-3 sm:p-4">
            <CardHeader className="pb-1 sm:pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Codes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats?.totalCodes || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <CardHeader className="pb-1 sm:pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats?.activeCodes || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">
                active codes
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <CardHeader className="pb-1 sm:pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Redemptions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats?.totalRedemptions || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats?.uniqueUsers || 0} unique users
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <CardHeader className="pb-1 sm:pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Value Claimed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-500">
                £{stats?.redeemedValue?.toFixed(2) || "0.00"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                of £{stats?.totalValue?.toFixed(2) || "0.00"} total
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {/* <div className="flex flex-col sm:flex-row gap-3">
          <Tabs value={filter} onValueChange={(v: any) => setFilter(v)} className="w-full sm:w-auto">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="active" className="text-xs sm:text-sm">Active</TabsTrigger>
              <TabsTrigger value="inactive" className="text-xs sm:text-sm">Inactive</TabsTrigger>
              <TabsTrigger value="system" className="text-xs sm:text-sm">Flyer</TabsTrigger>
              <TabsTrigger value="custom" className="text-xs sm:text-sm">Custom</TabsTrigger>
              <TabsTrigger value="expired" className="text-xs sm:text-sm">Expired</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              placeholder="Search codes, notes, emails..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 sm:pl-10 text-sm sm:text-base"
            />
          </div>
        </div> */}

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-3">
          {paginatedCodes.map((code) => {
            const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
            const usagePercent = code.usageLimit 
              ? Math.round((code.currentUses / code.usageLimit) * 100)
              : code.currentUses > 0 ? 100 : 0;
            
            return (
              <Card key={code.id} className="p-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-foreground truncate">
                          {code.code}
                        </span>
                        {/* {getTypeBadge(code)} */}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {getStatusBadge(code)}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-bold text-green-500">
                        £{parseFloat(code.amount).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Usage Progress */}
                  {code.usageLimit ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Usage</span>
                        <span className="font-medium">
                          {code.currentUses}/{code.usageLimit} ({usagePercent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            usagePercent >= 100 ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Infinity className="w-3 h-3" />
                      <span>Unlimited uses · {code.currentUses} used</span>
                    </div>
                  )}

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Created</div>
                      <div className="font-medium text-xs">
                        {format(new Date(code.createdAt), "dd MMM yyyy")}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Expires</div>
                      <div className="font-medium text-xs">
                        {code.expiresAt 
                          ? format(new Date(code.expiresAt), "dd MMM yyyy")
                          : "Never"
                        }
                      </div>
                    </div>
                  </div>

                  {/* Redemption Count */}
                  {code.redemptions && code.redemptions.length > 0 && (
                    <div className="bg-muted/30 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          {code.redemptions.length} redemption{code.redemptions.length !== 1 ? 's' : ''}
                          {code.uniqueUserCount && code.uniqueUserCount < code.redemptions.length && 
                            ` · ${code.uniqueUserCount} unique users`}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRedemptions(code)}
                          className="ml-auto h-6 text-xs"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {code.notes && (
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      📝 {code.notes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(code)}
                      className="flex-1 gap-1 text-xs"
                    >
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(code.code)}
                      className="flex-1 gap-1 text-xs"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLimit(code)}
                      className="flex-1 gap-1 text-xs"
                      title="Edit usage limit"
                    >
                      <BarChart3 className="w-3 h-3" />
                      Limit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(code)}
                      className={`flex-1 gap-1 text-xs ${
                        code.isActive ? 'text-yellow-600' : 'text-green-600'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      {code.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(code.id)}
                      className="flex-1 gap-1 text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {paginatedCodes.length === 0 && (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="text-base sm:text-lg font-medium">No codes found</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {searchInput ? "Try a different search term" : "Create your first redeem code"}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Code</th>
                  {/* <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Type</th> */}
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Usage</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Created</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Expires</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Redemptions</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Notes</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCodes.map((code) => {
                  const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
                  const usagePercent = code.usageLimit 
                    ? Math.round((code.currentUses / code.usageLimit) * 100)
                    : code.currentUses > 0 ? 100 : 0;
                  
                  return (
                    <tr key={code.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-mono font-medium text-sm text-foreground">
                          {code.code}
                        </div>
                      </td>
                      {/* <td className="py-3 px-4">
                        {getTypeBadge(code)}
                      </td> */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-green-500">
                          £{parseFloat(code.amount).toFixed(2)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(code)}
                      </td>
                      <td className="py-3 px-4">
                        {code.usageLimit ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-medium">{code.currentUses}/{code.usageLimit}</span>
                              <span className="text-muted-foreground">({usagePercent}%)</span>
                            </div>
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  usagePercent >= 100 ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Infinity className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Unlimited · {code.currentUses} used
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {format(new Date(code.createdAt), "dd MMM yyyy")}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {code.expiresAt 
                          ? format(new Date(code.expiresAt), "dd MMM yyyy")
                          : "Never"
                        }
                      </td>
                      <td className="py-3 px-4">
                        {code.redemptions && code.redemptions.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewRedemptions(code)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Users className="w-3 h-3 mr-1" />
                            {code.redemptions.length}
                            {code.uniqueUserCount && code.uniqueUserCount < code.redemptions.length && 
                              ` (${code.uniqueUserCount} users)`}
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground max-w-[150px] truncate">
                        {code.notes || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(code.code)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Copy code"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLimit(code)}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            title="Edit usage limit"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(code)}
                            className={code.isActive ? "text-yellow-600" : "text-green-600"}
                            title={code.isActive ? "Deactivate" : "Activate"}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(code)}
                            className="text-gray-600 hover:text-gray-700"
                            title="View details"
                          >
                            <Calendar className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(code.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete code"
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
                    <td colSpan={10} className="py-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-base font-medium">No codes found</div>
                        <div className="text-sm mt-1">
                          {searchInput ? "Try a different search term" : "Create your first redeem code"}
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
              Showing {paginatedCodes.length} of {codes.length} codes
            </p>
          </>
        )}

        {/* View Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Code Details: {selectedCode?.code}
              </DialogTitle>
            </DialogHeader>
            
            {selectedCode && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Amount</Label>
                    <div className="text-lg font-bold text-green-500">
                      £{parseFloat(selectedCode.amount).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getTypeBadge(selectedCode)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(selectedCode)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Active</Label>
                    <div className="text-sm">
                      {selectedCode.isActive ? (
                        <span className="text-green-500">Yes</span>
                      ) : (
                        <span className="text-red-500">No</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Usage</Label>
                    <div className="text-sm font-medium">
                      {selectedCode.currentUses} / {selectedCode.usageLimit || '∞'} times
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Unique Users</Label>
                    <div className="text-sm font-medium">
                      {selectedCode.uniqueUserCount || 0}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <div className="text-sm">
                    {format(new Date(selectedCode.createdAt), "dd MMMM yyyy HH:mm")}
                    {selectedCode.createdBy && ` by ${selectedCode.createdBy}`}
                  </div>
                </div>

                {selectedCode.expiresAt && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Expires</Label>
                    <div className="text-sm">
                      {format(new Date(selectedCode.expiresAt), "dd MMMM yyyy")}
                      {new Date(selectedCode.expiresAt) < new Date() && (
                        <Badge variant="destructive" className="ml-2">Expired</Badge>
                      )}
                    </div>
                  </div>
                )}

                {selectedCode.notes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Notes</Label>
                    <div className="text-sm p-2 bg-muted/50 rounded">
                      {selectedCode.notes}
                    </div>
                  </div>
                )}

                {selectedCode.redemptions && selectedCode.redemptions.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Recent Redemptions</Label>
                    <div className="mt-1 space-y-2 max-h-40 overflow-y-auto">
                      {selectedCode.redemptions.slice(0, 5).map((redemption) => (
                        <div key={redemption.id} className="text-xs p-2 bg-muted/30 rounded">
                          <div className="font-medium">
                            {redemption.user?.email || 'Unknown user'}
                          </div>
                          <div className="text-muted-foreground">
                            {format(new Date(redemption.redeemedAt), "dd MMM yyyy HH:mm")}
                          </div>
                        </div>
                      ))}
                      {selectedCode.redemptions.length > 5 && (
                        <div className="text-xs text-center text-muted-foreground">
                          +{selectedCode.redemptions.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Redemptions Dialog */}
        <Dialog open={viewRedemptionsOpen} onOpenChange={setViewRedemptionsOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Redemption History: {selectedCode?.code}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Users who have redeemed this code
              </DialogDescription>
            </DialogHeader>
            
            {selectedCode?.redemptions && selectedCode.redemptions.length > 0 ? (
              <div className="space-y-3">
                {selectedCode.redemptions.map((redemption) => (
                  <Card key={redemption.id} className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-2">
                      <div>
                        <div className="font-medium">
                          {redemption.user?.firstName || ''} {redemption.user?.lastName || ''}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {redemption.user?.email || 'Unknown email'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-500">
                          £{parseFloat(redemption.amount).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(redemption.redeemedAt), "dd MMM yyyy HH:mm")}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No redemptions yet
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Usage Limit Dialog */}
        <Dialog open={editLimitDialogOpen} onOpenChange={setEditLimitDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Edit Usage Limit
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Update the usage limit for code: {codeToEdit?.code}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleUpdateLimit} className="space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="usageLimit" className="text-sm sm:text-base">Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="1"
                  value={editLimitForm.usageLimit}
                  onChange={(e) => setEditLimitForm({ 
              usageLimit: e.target.value // Keep as string, don't convert to number
            })}
                  placeholder="Leave empty for unlimited"
                  className="text-sm sm:text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Current usage: {codeToEdit?.currentUses} / {codeToEdit?.usageLimit || '∞'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditLimitDialogOpen(false);
                    setCodeToEdit(null);
                  }}
                  className="w-full sm:w-auto text-sm sm:text-base"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateLimitMutation.isPending}
                  className="w-full sm:w-auto text-sm sm:text-base"
                >
                  {updateLimitMutation.isPending ? "Updating..." : "Update Limit"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl">Delete Redeem Code</AlertDialogTitle>
              <AlertDialogDescription className="text-sm sm:text-base">
                Are you sure you want to delete this code? This action cannot be undone.
                {codeToDelete && (
                  <div className="mt-2 p-2 bg-muted/50 rounded font-mono text-sm">
                    Code: {codes.find(c => c.id === codeToDelete)?.code}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto text-sm sm:text-base mt-0">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto text-sm sm:text-base"
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