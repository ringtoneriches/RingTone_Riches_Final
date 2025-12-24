import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Search,
  Calendar,
  Filter,
  Download,
  Eye,
  FileText,
  Wallet,
  Ticket,
  ShoppingCart,
  Award,
  History,
  Activity,
  TrendingUp,
  Clock,
  CircleCheckBig,
  ChevronsRight,
  ChevronRight,
  ChevronsLeft,
  ChevronLeft,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  email: string;
  action: string;
  competitionId?: string;
  competitionTitle?: string;
  description: string;
  startBalance: number;
  endBalance: number;
  createdAt: string;
}

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  balance: string;
  ringtonePoints: number;
  createdAt: string;
}

interface ApiResponse {
  audit: AuditLog[];
}

export default function UserAuditPage() {
  const [match, params] = useRoute("/admin/users/:id"); // Fixed route pattern
  const id = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);


  // Fetch user info
  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ["userInfo", id],
    queryFn: async () => {
      const res = await apiRequest(`https://ringtoneriches.co.uk/api/admin/users/${id}`, "GET");
      return res.json() as Promise<UserInfo>;
    },
    
    enabled: !!id,
   refetchInterval: 10000, 
  refetchIntervalInBackground: true,
    onError: (err: any) => {
      toast({ title: "Error", description: "Failed to fetch user info", variant: "destructive" });
    },
  });

  // Fetch audit logs
  const { data: auditData, isLoading: loadingAudit } = useQuery({
    queryKey: ["auditLogs", id],
    queryFn: async () => {
      const res = await apiRequest(`https://ringtoneriches.co.uk/api/admin/users/audit/${id}`, "GET"); // Fixed endpoint
      return res.json() as Promise<ApiResponse>;
    },
    enabled: !!id,
  refetchInterval: 10000, // Auto-refresh every 10 seconds (10000ms)
  refetchIntervalInBackground: true, // Continue refreshing even when tab is not active
  onError: (err: any) => {
    toast({ title: "Error", description: "Failed to fetch audit logs", variant: "destructive" });
  },
  });

  // Update user info when data is fetched
  useEffect(() => {
    if (userData) {
      setUserInfo(userData);
    }
  }, [userData]);

  // Get audit logs from query data
  const auditLogs = auditData?.audit || [];
  const loading = loadingUser || loadingAudit;

  console.log("User Data:", userData);
  console.log("Audit Data:", auditData);
  console.log("Audit Logs:", auditLogs);

 const safeFormatDate = (dateString: string | undefined, formatType: 'date' | 'time' | 'datetime' | 'shortDate' = 'date') => {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string:", dateString);
      return "Invalid date";
    }
    
    switch (formatType) {
      case 'date':
        return format(date, "dd MMM yyyy");
      case 'time':
        return format(date, "HH:mm:ss");
      case 'datetime':
        return format(date, "MMM d, yyyy HH:mm");
      case 'shortDate':
        return format(date, "dd/MM/yyyy");
      default:
        return format(date, "dd MMM yyyy");
    }
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error";
  }
};

  // Filter logs based on search and filters
  const filteredLogs = auditLogs.filter((log) => {
    // Search filter
    if (
      searchTerm &&
      !log.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !log.action.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Date filter
    if (dateRange !== "all") {
      const logDate = new Date(log.createdAt);
      const now = new Date();
      let daysAgo = 0;

      switch (dateRange) {
        case "24h":
          daysAgo = 1;
          break;
        case "7d":
          daysAgo = 7;
          break;
        case "30d":
          daysAgo = 30;
          break;
        case "90d":
          daysAgo = 90;
          break;
      }

      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      if (logDate < cutoffDate) return false;
    }

    // Action filter
    if (actionFilter !== "all" && log.action !== actionFilter) {
      return false;
    }

    return true;
  });

const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

// Reset to page 1 when filters change
useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, dateRange, actionFilter]);

  // Get action badge color
  const getActionColor = (action: string) => {
    switch (action) {
      case "wallet_topup":
        return "bg-blue-500 hover:bg-blue-600 text-white";
      case "spin_purchase":
      case "buy_spin":
        return "bg-purple-500 hover:bg-purple-600 text-white";
     case "competition_purchase":
      case "scratch_purchase":
      case "buy_scratch":
        return "bg-amber-700 hover:bg-amber-600 text-white";
      case "buy_competition":
      case "ticket_purchase":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "payment_failed":
      case "wallet_topup_failed":
        return "bg-red-500 hover:bg-red-600 text-white";
      case "order_already_processed":
      case "email_failed":
        return "bg-gray-500 hover:bg-gray-600 text-white";
      case "payment_complete":
      case "deposit":
        return "bg-emerald-500 hover:bg-emerald-600 text-white";
      case "withdrawal":
        return "bg-orange-500 hover:bg-orange-600 text-white";
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white";
    }
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case "wallet_topup":
      case "deposit":
        return <Wallet className="w-3 h-3 mr-1" />;
      case "spin_purchase":
      case "spin_used":
        return <Activity className="w-3 h-3 mr-1" />;
      case "scratch_purchase":
      case "scratch_used":
        return <FileText className="w-3 h-3 mr-1" />;
      case "buy_competition":
      case "ticket_purchase":
        return <Ticket className="w-3 h-3 mr-1" />;
      case "withdrawal":
        return <TrendingUp className="w-3 h-3 mr-1" />;
        case "payment_complete":
        return <CircleCheckBig className="w-3 h-3 mr-1" />;
      default:
        return <History className="w-3 h-3 mr-1" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  // Get unique actions for filter
  const uniqueActions = Array.from(
    new Set(auditLogs.map((log) => log.action))
  );

  // Handle export to CSV
  const handleExportCSV = () => {
    const headers = ["Date", "Action", "Description", "Start Balance", "End Balance", "Change", "Competition"];
    const csvData = filteredLogs.map(log => {
      const balanceChange = log.endBalance - log.startBalance;
      return [
        new Date(log.createdAt).toISOString(),
        log.action,
        `"${log.description}"`,
        formatCurrency(log.startBalance),
        formatCurrency(log.endBalance),
        formatCurrency(balanceChange),
        log.competitionTitle || "N/A"
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${userInfo?.email || 'user'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading audit logs...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!userInfo) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <History className="w-12 h-12 text-muted-foreground" />
          <p className="text-lg font-medium">User not found</p>
          <Button onClick={() => setLocation("/admin/users")}>
            Back to Users
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin/users")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
            <div>
              <h1 className="text-2xl font-bold">User Audit Logs</h1>
              <p className="text-muted-foreground">
                Activity history for {userInfo?.firstName} {userInfo?.lastName} (
                {userInfo?.email})
              </p>
            </div>
          </div>
        </div>

        {/* User Summary Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Current Balance
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(parseFloat(userInfo?.balance || "0"))}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Ringtone Points
                </p>
                <p className="text-2xl font-bold">{userInfo?.ringtonePoints}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Member Since
                </p>
                <p className="text-lg font-semibold">
                  {safeFormatDate(userInfo?.createdAt, 'date')}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Audit Entries
                </p>
                <p className="text-2xl font-bold">
                  {auditLogs.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search actions or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <label className="text-sm font-medium mb-2 block">
                  Time Period
                </label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <label className="text-sm font-medium mb-2 block">
                  Action Type
                </label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setDateRange("all");
                  setActionFilter("all");
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              <Button 
                variant="outline"
                onClick={handleExportCSV}
                disabled={filteredLogs.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity History ({filteredLogs.length} entries)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Competition</TableHead>
                    <TableHead>Start Balance</TableHead>
                    <TableHead>End Balance</TableHead>
                    <TableHead>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <History className="w-12 h-12 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {auditLogs.length === 0 
                              ? "No audit logs found for this user" 
                              : "No audit logs match the selected filters"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLogs.map((log) => {
                      const balanceChange = log.endBalance - log.startBalance;
                      const isPositive = balanceChange > 0;

                      return (
                        <TableRow key={log.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>
                                 {new Date(log.date).toLocaleString()}
                              </span>
                            
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getActionColor(log.action)} text-xs`}>
                              <span className="flex items-center">
                                {getActionIcon(log.action)}
                                {log.action.replace(/_/g, " ")}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="">{log.description}</p>
                          </TableCell>
                         
                          <TableCell>
                            {log.competition ? (
                              <Badge variant="outline" className="text-xs">
                                {log.competition}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                           <TableCell>
                            <span className="font-medium">
                              {formatCurrency(log.startBalance)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {formatCurrency(log.endBalance)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-semibold ${
                                isPositive
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {formatCurrency(balanceChange)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            {filteredLogs.length > 0 && (
              <div className="flex items-center justify-between mt-4">
               <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} entries
                (Filtered from {auditLogs.length} total)
              </p>
                <div className="text-sm text-muted-foreground">
                  Total balance change:{" "}
                  <span className={`font-semibold ${
                    filteredLogs.reduce((sum, log) => sum + (log.endBalance - log.startBalance), 0) > 0 
                      ? "text-green-600" 
                      : "text-red-600"
                  }`}>
                    {formatCurrency(
                      filteredLogs.reduce((sum, log) => sum + (log.endBalance - log.startBalance), 0)
                    )}
                  </span>
                </div>
              </div>
            )}
        

{/* Pagination Controls */}
{filteredLogs.length > itemsPerPage && (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t">
    {/* Items per page selector */}
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Show</span>
      <Select
        value={itemsPerPage.toString()}
        onValueChange={(value) => {
          setItemsPerPage(Number(value));
          setCurrentPage(1);
        }}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10 rows</SelectItem>
          <SelectItem value="20">20 rows</SelectItem>
          <SelectItem value="50">50 rows</SelectItem>
          <SelectItem value="100">100 rows</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Page info */}
    <div className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">
        {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)}
      </span>{" "}
      of{" "}
      <span className="font-medium text-foreground">{filteredLogs.length}</span>{" "}
      items
    </div>

    {/* Pagination buttons */}
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
        className="h-8 w-8"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page numbers - cleaner version */}
      <div className="flex items-center gap-1 mx-1">
        {(() => {
          const pages = [];
          const maxVisible = 5;
          
          // Always show first page
          pages.push(
            <Button
              key={1}
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(1)}
              className="h-8 w-8"
            >
              1
            </Button>
          );

          // Calculate range of pages to show
          let startPage = Math.max(2, currentPage - 1);
          let endPage = Math.min(totalPages - 1, currentPage + 1);

          // Adjust if near start or end
          if (currentPage <= 3) {
            endPage = Math.min(5, totalPages - 1);
          }
          if (currentPage >= totalPages - 2) {
            startPage = Math.max(2, totalPages - 4);
          }

          // Add ellipsis after first page if needed
          if (startPage > 2) {
            pages.push(
              <span key="ellipsis-start" className="px-2 text-muted-foreground">
                ...
              </span>
            );
          }

          // Add middle pages
          for (let i = startPage; i <= endPage; i++) {
            if (i > 1 && i < totalPages) {
              pages.push(
                <Button
                  key={i}
                  variant={currentPage === i ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i)}
                  className="h-8 w-8"
                >
                  {i}
                </Button>
              );
            }
          }

          // Add ellipsis before last page if needed
          if (endPage < totalPages - 1) {
            pages.push(
              <span key="ellipsis-end" className="px-2 text-muted-foreground">
                ...
              </span>
            );
          }

          // Always show last page if there is one
          if (totalPages > 1) {
            pages.push(
              <Button
                key={totalPages}
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                className="h-8 w-8"
              >
                {totalPages}
              </Button>
            );
          }

          return pages;
        })()}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
        className="h-8 w-8"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>

    {/* Page input (optional) */}
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Go to page</span>
      <Input
        type="number"
        min="1"
        max={totalPages}
        value={currentPage}
        onChange={(e) => {
          const page = Math.max(1, Math.min(totalPages, Number(e.target.value) || 1));
          setCurrentPage(page);
        }}
        className="w-16 h-8 text-center"
      />
      <span className="text-sm text-muted-foreground">of {totalPages}</span>
    </div>
  </div>
)}
          </CardContent>
          
        </Card>

        {/* Summary Tabs */}
        <Tabs defaultValue="actions" className="w-full">
          <TabsList>
            <TabsTrigger value="actions">
              <Activity className="w-4 h-4 mr-2" />
              Top Actions
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Clock className="w-4 h-4 mr-2" />
              Timeline
            </TabsTrigger>
          </TabsList>
          <TabsContent value="actions">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uniqueActions.slice(0, 8).map((action) => {
                    const count = auditLogs.filter(
                      (log) => log.action === action
                    ).length;
                    return (
                      <div key={action} className="border rounded-lg p-4">
                        <p className="text-sm font-medium text-muted-foreground">
                          {action.replace(/_/g, " ")}
                        </p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="timeline">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Recent activity timeline:
                  </p>
                  <div className="border-l-2 border-muted pl-4 space-y-4">
                    {filteredLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="relative">
                        <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                        <div className="ml-2">
                          <p className="text-sm font-medium">
                            {log.action.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(log.date).toLocaleString()}
                          </p>
                          <p className="text-sm">{log.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}