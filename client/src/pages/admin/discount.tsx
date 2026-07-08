import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Trash2, Edit2, Calendar, ArrowBigLeft, ArrowBigRight, CheckCircle, XCircle, Plus, Layers } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DiscountCode {
  id: string;
  code: string;
  type: "cash" | "points" | "percentage";
  value: number;
  maxUses: number;
  usesCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface BulkCreateResult {
  successful: DiscountCode[];
  failed: Array<{ code: string; reason: string }>;
  total: number;
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
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const itemsPerPage = 20;

  // Bulk creation state
  const [bulkMode, setBulkMode] = useState<"manual" | "generate">("manual");
  const [bulkCodes, setBulkCodes] = useState("");
  const [generateCount, setGenerateCount] = useState(5);
  const [generatePrefix, setGeneratePrefix] = useState("");
  const [generateSuffix, setGenerateSuffix] = useState("");
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkResult, setBulkResult] = useState<BulkCreateResult | null>(null);

  // Form state
  const [form, setForm] = useState({
    code: "",
    type: "cash" as "cash" | "points" | "percentage",
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

  // Bulk create mutation
  const bulkCreateMutation = useMutation({
    mutationFn: async (codes: any[]) => {
      const res = await apiRequest("/api/admin/discount-codes/bulk", "POST", { codes });
      return res.json();
      console.log("bulk working...")
    },
    onSuccess: (data: BulkCreateResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      setBulkResult(data);
      toast({
        title: "Bulk Creation Complete",
        description: `Successfully created ${data.successful.length} of ${data.total} codes.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create discount codes",
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

  // Bulk code generation utility
  const generateRandomCode = (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Parse bulk codes from textarea
  const parseBulkCodes = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const [code, type, value, maxUses, expiresAt] = line.split(',').map(s => s.trim());
      return {
        code: code || '',
        type: (type as "cash" | "points" | "percentage") || 'cash',
        value: Number(value) || 0,
        maxUses: Number(maxUses) || 1,
        expiresAt: expiresAt || undefined,
        isActive: true,
      };
    }).filter(c => c.code && c.value > 0);
  };

// Replace all bulk-related state with this:
const [bulkForm, setBulkForm] = useState({
  count: 5,
  prefix: "",
  suffix: "",
  type: "cash" as "cash" | "points" | "percentage",
  value: 0,
  maxUses: 1,
  expiresAt: "",
});

// Replace the old handleGenerateCodes and handleBulkSubmit with this single function:
const handleBulkGenerate = async () => {
  // Validate
  if (!bulkForm.count || bulkForm.count < 1 || bulkForm.count > 100) {
    toast({
      title: "Error",
      description: "Please enter between 1 and 100 codes.",
      variant: "destructive",
    });
    return;
  }
  
  if (!bulkForm.value || bulkForm.value <= 0) {
    toast({
      title: "Error",
      description: "Please enter a valid value.",
      variant: "destructive",
    });
    return;
  }
  
  if (!bulkForm.maxUses || bulkForm.maxUses < 1) {
    toast({
      title: "Error",
      description: "Please enter valid max uses.",
      variant: "destructive",
    });
    return;
  }

  // Generate codes
  const codes = [];
  const usedCodes = new Set<string>();
  
  for (let i = 0; i < bulkForm.count; i++) {
    let code: string;
    let attempts = 0;
    
    do {
      const randomPart = generateRandomCode(8);
      code = `${bulkForm.prefix}${randomPart}${bulkForm.suffix}`;
      attempts++;
      
      if (attempts > 100) {
        toast({
          title: "Error",
          description: "Unable to generate unique codes. Try different prefix/suffix.",
          variant: "destructive",
        });
        return;
      }
    } while (usedCodes.has(code));
    
    usedCodes.add(code);
    codes.push({
      code,
      type: bulkForm.type,
      value: bulkForm.value,
      maxUses: bulkForm.maxUses,
      expiresAt: bulkForm.expiresAt || undefined,
      isActive: true,
    });
  }
  
  setBulkProgress(0);
  setBulkResult(null);
  
  // Simulate progress
  const progressInterval = setInterval(() => {
    setBulkProgress(prev => {
      if (prev >= 90) {
        clearInterval(progressInterval);
        return 90;
      }
      return prev + 10;
    });
  }, 300);
  
  try {
    await bulkCreateMutation.mutateAsync(codes);
    setBulkProgress(100);
  } finally {
    clearInterval(progressInterval);
  }
};

  // Generate codes automatically
  const handleGenerateCodes = () => {
    const codes = [];
    const usedCodes = new Set<string>();

    for (let i = 0; i < generateCount; i++) {
      let code: string;
      let attempts = 0;
      
      do {
        const randomPart = generateRandomCode(8);
        code = `${generatePrefix}${randomPart}${generateSuffix}`;
        attempts++;
        
        if (attempts > 100) {
          toast({
            title: "Error",
            description: "Unable to generate unique codes. Try different prefix/suffix.",
            variant: "destructive",
          });
          return;
        }
      } while (usedCodes.has(code));

      usedCodes.add(code);
      codes.push({
        code,
        type: form.type,
        value: form.value,
        maxUses: form.maxUses,
        expiresAt: form.expiresAt || undefined,
      });
    }
    
    setBulkCodes(codes.map(c => 
      `${c.code}, ${c.type}, ${c.value}, ${c.maxUses}${c.expiresAt ? `, ${c.expiresAt}` : ''}`
    ).join('\n'));
  };

  // Handle bulk submission
  const handleBulkSubmit = async () => {
    const codes = parseBulkCodes(bulkCodes);
    
    if (codes.length === 0) {
      toast({
        title: "Error",
        description: "No valid codes found. Please check the format.",
        variant: "destructive",
      });
      return;
    }
    
    if (codes.length > 100) {
      toast({
        title: "Error",
        description: "Maximum 100 codes allowed per bulk creation.",
        variant: "destructive",
      });
      return;
    }
    
    setBulkProgress(0);
    setBulkResult(null);
    
    // Simulate progress
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
      await bulkCreateMutation.mutateAsync(codes);
      setBulkProgress(100);
    } finally {
      clearInterval(progressInterval);
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

  const totalUses = codes?.reduce((sum, code) => sum + code.usesCount, 0) || 0;
  const activeCodes = codes?.filter((code) => code.isActive).length || 0;
  const expiredCodes = codes?.filter((code) => 
    code.expiresAt && new Date(code.expiresAt) < new Date()
  ).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-2 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              Discount Codes
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
              Create and manage discount codes
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1 sm:gap-2 text-sm sm:text-base py-2 sm:py-2.5 w-full sm:w-auto">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  Create Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    {editingCode ? "Edit Discount Code" : "Create Discount Code"}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    {editingCode 
                      ? "Update the discount code details below."
                      : "Create a new discount code for customers to use."
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="code" className="text-sm sm:text-base">Code *</Label>
                    <Input
                      id="code"
                      name="code"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., SUMMER25"
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="type" className="text-sm sm:text-base">Type *</Label>
                    <Select
                      value={form.type}
                      onValueChange={(value: "cash" | "points" | "percentage")  => 
                        setForm({ ...form, type: value })
                      }
                    >
                      <SelectTrigger className="text-sm sm:text-base">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash" className="text-sm sm:text-base">Cash Discount (£)</SelectItem>
                        <SelectItem value="points" className="text-sm sm:text-base">Points</SelectItem>
                        <SelectItem value="percentage" className="text-sm sm:text-base">Percentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="value" className="text-sm sm:text-base">
                      Value * {form.type === "cash" ? "(£)" : form.type === "points" ? "(Points)" : "(%)"}
                    </Label>
                    <Input
                      id="value"
                      name="value"
                      type="number"
                      min="1"
                      max={form.type === "percentage" ? "100" : undefined}
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="maxUses" className="text-sm sm:text-base">Maximum Uses *</Label>
                    <Input
                      id="maxUses"
                      name="maxUses"
                      type="number"
                      min="1"
                      value={form.maxUses}
                      onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="expiresAt" className="text-sm sm:text-base">Expiry Date (Optional)</Label>
                    <Input
                      id="expiresAt"
                      name="expiresAt"
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                      className="text-sm sm:text-base"
                    />
                  </div>

                  {editingCode && (
                    <div className="flex items-center space-x-2 py-2">
                      <Switch
                        id="isActive"
                        checked={form.isActive}
                        onCheckedChange={(checked) => 
                          setForm({ ...form, isActive: checked })
                        }
                      />
                      <Label htmlFor="isActive" className="text-sm sm:text-base">Active</Label>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
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
                      className="w-full sm:w-auto text-sm sm:text-base"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="w-full sm:w-auto text-sm sm:text-base"
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

            {/* Bulk Create Dialog - SIMPLIFIED VERSION */}
<Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
  <DialogTrigger asChild>
    <Button 
      variant="outline" 
      className="gap-1 sm:gap-2 text-sm sm:text-base py-2 sm:py-2.5 w-full sm:w-auto"
    >
      <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
      Bulk Create
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
    <DialogHeader>
      <DialogTitle className="text-lg sm:text-xl">Bulk Generate Discount Codes</DialogTitle>
      <DialogDescription className="text-xs sm:text-sm">
        Generate multiple discount codes at once with the same settings.
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Number of Codes */}
      <div className="space-y-1.5">
        <Label className="text-sm">Number of Codes to Generate *</Label>
        <Input
          type="number"
          min="1"
          max="100"
          value={bulkForm.count}
          onChange={(e) => setBulkForm({ ...bulkForm, count: Number(e.target.value) })}
          placeholder="e.g., 50"
        />
        <p className="text-xs text-muted-foreground">Max 100 codes per batch</p>
      </div>

      {/* Code Prefix */}
      <div className="space-y-1.5">
        <Label className="text-sm">Code Prefix (optional)</Label>
        <Input
          value={bulkForm.prefix}
          onChange={(e) => setBulkForm({ ...bulkForm, prefix: e.target.value.toUpperCase() })}
          placeholder="e.g., SUMMER"
          maxLength={10}
        />
      </div>

      {/* Code Suffix */}
      <div className="space-y-1.5">
        <Label className="text-sm">Code Suffix (optional)</Label>
        <Input
          value={bulkForm.suffix}
          onChange={(e) => setBulkForm({ ...bulkForm, suffix: e.target.value.toUpperCase() })}
          placeholder="e.g., 2024"
          maxLength={10}
        />
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <Label className="text-sm">Discount Type *</Label>
        <Select
          value={bulkForm.type}
          onValueChange={(value: "cash" | "points" | "percentage") => 
            setBulkForm({ ...bulkForm, type: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash Discount (£)</SelectItem>
            <SelectItem value="points">Points</SelectItem>
            <SelectItem value="percentage">Percentage (%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Value */}
      <div className="space-y-1.5">
        <Label className="text-sm">
          Value * {bulkForm.type === "cash" ? "(£)" : bulkForm.type === "points" ? "(Points)" : "(%)"}
        </Label>
        <Input
          type="number"
          min="1"
          max={bulkForm.type === "percentage" ? "100" : undefined}
          value={bulkForm.value}
          onChange={(e) => setBulkForm({ ...bulkForm, value: Number(e.target.value) })}
          placeholder={bulkForm.type === "cash" ? "e.g., 10" : bulkForm.type === "points" ? "e.g., 500" : "e.g., 15"}
        />
      </div>

      {/* Max Uses */}
      <div className="space-y-1.5">
        <Label className="text-sm">Maximum Uses Per Code *</Label>
        <Input
          type="number"
          min="1"
          value={bulkForm.maxUses}
          onChange={(e) => setBulkForm({ ...bulkForm, maxUses: Number(e.target.value) })}
          placeholder="e.g., 1"
        />
      </div>

      {/* Expiry Date */}
      <div className="space-y-1.5">
        <Label className="text-sm">Expiry Date (optional)</Label>
        <Input
          type="date"
          value={bulkForm.expiresAt}
          onChange={(e) => setBulkForm({ ...bulkForm, expiresAt: e.target.value })}
        />
      </div>

      {/* Preview */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-700">
          💡 <strong>Preview:</strong> Will generate {bulkForm.count || 0} codes like: 
          <span className="font-mono ml-1">
            {bulkForm.prefix}XXXXXXX{bulkForm.suffix}
          </span>
        </p>
        <p className="text-xs text-blue-700 mt-1">
          Type: {bulkForm.type} | Value: {bulkForm.value} | Max Uses: {bulkForm.maxUses}
        </p>
      </div>

      {/* Progress Bar */}
      {(bulkCreateMutation.isPending || bulkProgress > 0) && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Generating codes...</span>
            <span>{bulkProgress}%</span>
          </div>
          <Progress value={bulkProgress} className="h-2" />
        </div>
      )}

      {/* Results */}
      {bulkResult && (
        <div className="space-y-3 p-4 bg-muted rounded-lg">
          <div className="text-sm font-medium">Results:</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Created: {bulkResult.successful.length}</span>
            </div>
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-4 h-4" />
              <span>Failed: {bulkResult.failed.length}</span>
            </div>
          </div>
          {bulkResult.failed.length > 0 && (
            <div className="text-xs text-red-600 mt-2">
              <div className="font-medium mb-1">Failed codes:</div>
              <ul className="list-disc list-inside space-y-1">
                {bulkResult.failed.map((f, i) => (
                  <li key={i}>{f.code} - {f.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>

    <div className="flex justify-end gap-2 pt-4">
      <Button
        variant="outline"
        onClick={() => {
          setBulkDialogOpen(false);
          setBulkResult(null);
          setBulkProgress(0);
          setBulkForm({
            count: 5,
            prefix: "",
            suffix: "",
            type: "cash",
            value: 0,
            maxUses: 1,
            expiresAt: "",
          });
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={handleBulkGenerate}
        disabled={!bulkForm.count || !bulkForm.value || !bulkForm.maxUses || bulkCreateMutation.isPending}
      >
        {bulkCreateMutation.isPending ? "Generating..." : `Generate ${bulkForm.count || 0} Codes`}
      </Button>
    </div>
  </DialogContent>
</Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card className="p-3 sm:p-4">
            <CardHeader className="pb-1 sm:pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Codes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{codes.length}</div>
            </CardContent>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <CardHeader className="pb-1 sm:pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Uses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{totalUses}</div>
            </CardContent>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <CardHeader className="pb-1 sm:pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Active Codes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-500">{activeCodes}</div>
            </CardContent>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <CardHeader className="pb-1 sm:pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Expired Codes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-500">{expiredCodes}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
          <Input
            placeholder="Search codes by code or type..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 sm:pl-10 text-sm sm:text-base"
          />
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-3">
          {paginatedCodes.map((code) => {
            const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
            const isFullyUsed = code.usesCount >= code.maxUses;
            
            return (
              <Card key={code.id} className="p-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono font-bold text-base text-foreground">
                        {code.code}
                      </div>
                      <Badge variant={code.type === "cash" ? "default" : "secondary"} className="mt-1">
                        {code.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${code.isActive ? 'text-green-500' : 'text-red-500'}`}>
                        {code.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleToggleActive(code)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full ${
                          code.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                            code.isActive ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Value</div>
                      <div className="font-medium">
                        {code.type === "cash" ? `£${code.value}` : code.type === "points" ? `${code.value} pts`: `${code.value} %`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Expiry</div>
                      <div className="font-medium">
                        {code.expiresAt 
                          ? format(new Date(code.expiresAt), "dd MMM")
                          : "Never"
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Uses</div>
                      <div className="font-medium">
                        {code.usesCount}/{code.maxUses}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Created</div>
                      <div className="font-medium">
                        {format(new Date(code.createdAt), "dd MMM")}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Usage Progress</span>
                      <span>{Math.round((code.usesCount / code.maxUses) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min((code.usesCount / code.maxUses) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(code)}
                      className="flex-1 gap-1 text-xs"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
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
                <div className="text-base sm:text-lg font-medium">No discount codes found</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {searchInput ? "Try a different search term" : "Create your first discount code"}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Code
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Value
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Uses
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Max Uses
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Expiry
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Created
                  </th>
                  <th className="text-center py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
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
                        <div className="font-mono font-medium text-sm text-foreground">
                          {code.code}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={code.type === "cash" ? "default" : "secondary"} className="text-xs">
                          {code.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {code.type === "cash" ? `£${code.value}` : code.type === "points" ? `${code.value} pts` : `${code.value} %`}
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
                        <div className="text-base sm:text-lg font-medium">No discount codes found</div>
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
              Showing {paginatedCodes.length} of {codes.length} discount codes
            </p>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl">Delete Discount Code</AlertDialogTitle>
              <AlertDialogDescription className="text-sm sm:text-base">
                Are you sure you want to delete this discount code? This action cannot be undone.
                Any users with this code applied will lose the discount.
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