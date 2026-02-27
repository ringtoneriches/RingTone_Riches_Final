import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Trash2, Edit2, Calendar, ArrowBigLeft, ArrowBigRight, CheckCircle, XCircle, Plus, Download, Copy, Printer } from "lucide-react";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface RedeemCode {
  id: string;
  code: string;
  amount: string;
  isUsed: boolean;
  usedByUserId: string | null;
  usedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
  createdBy: string | null;
  notes: string | null;
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
  usedCodes: number;
  remainingCodes: number;
  totalValue: number;
  usedValue: number;
  remainingValue: number;
}

export default function AdminRedeemCodes() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState<"all" | "used" | "unused">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<RedeemCode | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const itemsPerPage = 20;

  // Generate form state
  const [generateForm, setGenerateForm] = useState({
    amount: 10,
    quantity: 10,
    notes: "",
    expiresAt: "",
  });

  // Fetch redeem codes
  const { data: allCodes, isLoading } = useQuery<RedeemCode[]>({
    queryKey: ["/api/admin/redeem-codes", filter],
    queryFn: async () => {
      const url = filter === "all" 
        ? "/api/admin/redeem-codes"
        : `/api/admin/redeem-codes?used=${filter === "used"}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch redeem codes");
      return res.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchIntervalInBackground: true,
  });

  // Fetch stats
  const { data: stats } = useQuery<RedeemCodeStats>({
    queryKey: ["/api/admin/redeem-codes/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/redeem-codes/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchIntervalInBackground: true,
  });

  // Filter codes based on search
  const codes = allCodes?.filter((code) => {
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
      return apiRequest("/api/admin/redeem-codes/generate", "POST", {
        amount: data.amount,
        quantity: data.quantity,
        notes: data.notes,
        expiresAt: data.expiresAt || undefined,
      });
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/redeem-codes/${id}`, "DELETE");
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

  const handleDelete = (id: string) => {
    setCodeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (codeToDelete) {
      deleteMutation.mutate(codeToDelete);
    }
  };

  const handleViewDetails = (code: RedeemCode) => {
    setSelectedCode(code);
    setViewDetailsOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const downloadCodes = () => {
    const unusedCodes = codes.filter(c => !c.isUsed);
    const codesText = unusedCodes.map(c => c.code).join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flyer-codes-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
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
              Generate and manage redeem codes for flyers
            </p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={downloadCodes}
              disabled={!codes.some(c => !c.isUsed)}
              className="gap-1 sm:gap-2 text-sm sm:text-base flex-1 sm:flex-auto"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Download Unused</span>
              <span className="sm:hidden">Download</span>
            </Button>
            
            <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1 sm:gap-2 text-sm sm:text-base flex-1 sm:flex-auto">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  Generate Codes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    Generate Flyer Codes
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Create multiple redeem codes for your flyer campaign
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
                    <Label htmlFor="notes" className="text-sm sm:text-base">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={generateForm.notes}
                      onChange={(e) => setGenerateForm({ ...generateForm, notes: e.target.value })}
                      placeholder="e.g., Summer campaign 2024"
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setGenerateDialogOpen(false);
                        setGenerateForm({
                          amount: 10,
                          quantity: 10,
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
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
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
                Used / Remaining
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold">
                {stats?.usedCodes || 0} / {stats?.remainingCodes || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <CardHeader className="pb-1 sm:pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-500">
                £{stats?.totalValue.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <CardHeader className="pb-1 sm:pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Claimed Value
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-500">
                £{stats?.usedValue.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Tabs value={filter} onValueChange={(v: any) => setFilter(v)} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">All Codes</TabsTrigger>
              <TabsTrigger value="unused">Unused</TabsTrigger>
              <TabsTrigger value="used">Used</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              placeholder="Search codes, notes..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 sm:pl-10 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-3">
          {paginatedCodes.map((code) => {
            const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
            
            return (
              <Card key={code.id} className="p-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono font-bold text-base text-foreground">
                        {code.code}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={code.isUsed ? "secondary" : "default"}>
                          {code.isUsed ? "Used" : "Available"}
                        </Badge>
                        {code.isUsed && (
                          <Badge variant="outline" className="text-green-500 border-green-500">
                            ✓ Redeemed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-500">
                        £{parseFloat(code.amount).toFixed(2)}
                      </div>
                      {isExpired && !code.isUsed && (
                        <Badge variant="destructive" className="mt-1">Expired</Badge>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Created</div>
                      <div className="font-medium">
                        {format(new Date(code.createdAt), "dd MMM yyyy")}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Expires</div>
                      <div className="font-medium">
                        {code.expiresAt 
                          ? format(new Date(code.expiresAt), "dd MMM yyyy")
                          : "Never"
                        }
                      </div>
                    </div>
                  </div>

                  {/* Simplified Status */}
                  <div className="bg-muted/30 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${code.isUsed ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-medium">
                        {code.isUsed ? 'Redeemed' : 'Not Redeemed'}
                      </span>
                      {code.isUsed && code.usedAt && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(code.usedAt), "dd MMM HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {code.notes && (
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      📝 {code.notes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(code)}
                      className="flex-1 gap-1 text-xs"
                    >
                      View Details
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
                  {searchInput ? "Try a different search term" : "Generate your first flyer codes"}
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
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Created
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Expires
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Redeemed
                  </th>
                  <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Notes
                  </th>
                  <th className="text-center py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedCodes.map((code) => {
                  const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
                  
                  return (
                    <tr key={code.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-mono font-medium text-sm text-foreground">
                          {code.code}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-green-500">
                          £{parseFloat(code.amount).toFixed(2)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {code.isUsed ? (
                          <Badge variant="secondary">Used</Badge>
                        ) : isExpired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <Badge variant="default">Available</Badge>
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
                        {code.isUsed ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-500 font-medium">Redeemed</span>
                            {/* {code.usedAt && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(code.usedAt), "dd MMM HH:mm")}
                              </span>
                            )} */}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">Not Redeemed</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground max-w-[150px] truncate">
                        {code.notes || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
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
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-base sm:text-lg font-medium">No codes found</div>
                        <div className="text-sm mt-1">
                          {searchInput ? "Try a different search term" : "Generate your first flyer codes"}
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
          <DialogContent className="max-w-[95vw] sm:max-w-lg p-4 sm:p-6">
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
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedCode.isUsed ? (
                        <>
                          <Badge variant="secondary">Used</Badge>
                          <span className="text-xs text-green-500">Redeemed ✓</span>
                        </>
                      ) : (
                        <Badge variant="default">Available</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <div className="text-sm">
                    {format(new Date(selectedCode.createdAt), "dd MMMM yyyy HH:mm")}
                  </div>
                </div>

                {selectedCode.expiresAt && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Expires</Label>
                    <div className="text-sm">
                      {format(new Date(selectedCode.expiresAt), "dd MMMM yyyy")}
                    </div>
                  </div>
                )}

                {selectedCode.usedAt && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Redeemed At</Label>
                    <div className="text-sm">
                      {format(new Date(selectedCode.usedAt), "dd MMMM yyyy HH:mm")}
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
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl">Delete Redeem Code</AlertDialogTitle>
              <AlertDialogDescription className="text-sm sm:text-base">
                Are you sure you want to delete this code? This action cannot be undone.
                If the code hasn't been used yet, it will no longer be redeemable.
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