import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertTriangle, 
  Shield, 
  Lock, 
  EyeOff, 
  PiggyBank, 
  Users, 
  TrendingUp,
  Clock,
  Calendar,
  UserX,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Download,
  BarChart3,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { format } from "date-fns";
import AdminLayout from "@/components/admin/admin-layout";

interface TopDailyUser {
  userId: string;
  totalDeposited: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface WellbeingRequest {
  id: string;
  userId: string;
  email: string;
  type: 'suspension' | 'full_closure';
  daysRequested: number | null;
  createdAt: string;
}

interface UserSearchResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dailySpendLimit: string;
  selfSuspended: boolean;
  selfSuspensionEndsAt: string | null;
  disabled: boolean;
  disabledAt: string | null;
  disabledUntil: string | null;
}

export default function AdminWellbeing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
   const [disableDays, setDisableDays] = useState("7");
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [isViewRequestsOpen, setIsViewRequestsOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [currentRequestsPage, setCurrentRequestsPage] = useState(1);
  const requestsPerPage = 50;
  const [currentTopSpendersPage, setCurrentTopSpendersPage] = useState(1);
const topSpendersPerPage = 20;
  const [selectedTopUser, setSelectedTopUser] = useState<TopDailyUser | null>(null);
const [isTopUserDialogOpen, setIsTopUserDialogOpen] = useState(false);

  // Fetch daily top users
  const { data: topUsersData, isLoading: isLoadingTopUsers } = useQuery<{ topDailyCashflowUsers: TopDailyUser[] }>({
    queryKey: ["/api/admin/wellbeing/daily-top-users"],
  });

  // Fetch wellbeing requests
  const { data: requestsData, isLoading: isLoadingRequests } = useQuery<{ requests: WellbeingRequest[] }>({
    queryKey: ["/api/admin/wellbeing/requests"],
  });

  // Search users mutation
 const searchUsersMutation = useMutation({
  mutationFn: async (email: string) => {
    const res = await apiRequest(`/api/admin/users/search?email=${encodeURIComponent(email)}`, "GET");
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error?.message || "Failed to search users");
    }
    return res.json();
  },
  onSuccess: (data) => {
    if (data?.user) {
      setSelectedUser(data.user);
    } else {
      toast({
        title: "User not found",
        description: "No user found with that email address",
        variant: "destructive",
      });
      setSelectedUser(null);
    }
  },
  onError: (error: any) => {
    toast({
      title: "Error",
      description: error.message || "Failed to search for user",
      variant: "destructive",
    });
  },
});


  // Disable user mutation
  const disableUserMutation = useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      const res = await apiRequest( `/api/admin/users/${userId}/disable`,"POST", { days });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.message || "Failed to disable user");
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: variables.days > 0 
          ? `User disabled for ${variables.days} days` 
          : "User disabled indefinitely",
      });
      setIsDisableDialogOpen(false);
      setSelectedUser(null);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wellbeing/requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

 const handleSearch = (email?: string) => {
  const searchEmail = email || searchQuery.trim();
  
  if (!searchEmail) {
    toast({
      title: "Error",
      description: "Please enter an email address to search",
      variant: "destructive",
    });
    return;
  }
  
  searchUsersMutation.mutate(searchEmail);
};

   const handleDisableUser = () => {
    if (!selectedUser) return;
    
    const days = parseInt(disableDays);
    if (isNaN(days) || days < 0) {
      toast({
        title: "Invalid duration",
        description: "Please enter a valid number of days",
        variant: "destructive",
      });
      return;
    }

    disableUserMutation.mutate({ userId: selectedUser.id, days });
  };

const handleExportData = () => {
  try {
    if (!topUsersData?.topDailyCashflowUsers || topUsersData.topDailyCashflowUsers.length === 0) {
      toast({
        title: "No Data",
        description: "No daily spending data available to export",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = ["Rank", "User ID", "Email", "Name", "Total Deposited (£)", "Date"];
    
    // REVERSE the array to show highest spenders first
    const sortedUsers = [...topUsersData.topDailyCashflowUsers].sort((a, b) => 
      parseFloat(b.totalDeposited) - parseFloat(a.totalDeposited)
    );
    
    const rows = sortedUsers.map((user, index) => [
      index + 1, // Rank (highest spender = rank 1)
      user.userId,
      user.email,
      `${user.firstName} ${user.lastName}`.trim(),
      parseFloat(user.totalDeposited).toFixed(2),
      format(new Date(), 'yyyy-MM-dd')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `daily-top-spenders-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Completed",
      description: `Daily spending data exported (${sortedUsers.length} records) - Highest spenders first`,
    });
  } catch (error) {
    toast({
      title: "Export Failed",
      description: "Failed to export daily spending data",
      variant: "destructive",
    });
    console.error("Export error:", error);
  }
};
 // Update the filteredRequests to sort by date descending
const filteredRequests = (requestsData?.requests || [])
  .filter(request => {
    if (filterType === "all") return true;
    return request.type === filterType;
  })
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort newest first



  // Get sorted top users (highest deposits first)
const sortedTopSpenders = useMemo(() => {
  if (!topUsersData?.topDailyCashflowUsers) return [];
  
  return [...topUsersData.topDailyCashflowUsers].sort((a, b) => {
    const aAmount = parseFloat(a.totalDeposited) || 0;
    const bAmount = parseFloat(b.totalDeposited) || 0;
    return bAmount - aAmount; // Descending (highest first)
  });
}, [topUsersData]);

// Calculate pagination for top spenders
const totalTopSpendersPages = Math.ceil(sortedTopSpenders.length / topSpendersPerPage);
const paginatedTopSpenders = sortedTopSpenders.slice(
  (currentTopSpendersPage - 1) * topSpendersPerPage,
  currentTopSpendersPage * topSpendersPerPage
);

// Update totalDailyDeposits to use sortedTopSpenders
const totalDailyDeposits = sortedTopSpenders.reduce((sum, user) => {
  return sum + parseFloat(user.totalDeposited || "0");
}, 0);



  const totalSuspensionRequests = requestsData?.requests?.filter(r => r.type === "suspension").length || 0;
  const totalClosureRequests = requestsData?.requests?.filter(r => r.type === "full_closure").length || 0;
  
  

  return (
     <AdminLayout>
    <div className="min-h-screen text-foreground">
      <div className="w-full px-3 sm:px-4 py-4 sm:py-8">
      

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-500/30 shadow-xl shadow-blue-500/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-blue-400">
                <TrendingUp className="h-5 w-5" />
                Daily Deposits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                £{totalDailyDeposits.toFixed(2)}
              </p>
              <p className="text-sm text-gray-400 mt-2">Total deposits today</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-900/40 to-yellow-900/40 border-amber-500/30 shadow-xl shadow-amber-500/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-amber-400">
                <EyeOff className="h-5 w-5" />
                Suspension Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                {totalSuspensionRequests}
              </p>
              <p className="text-sm text-gray-400 mt-2">User suspension requests</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/40 to-rose-900/40 border-red-500/30 shadow-xl shadow-red-500/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-red-400">
                <Lock className="h-5 w-5" />
                Closure Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
                {totalClosureRequests}
              </p>
              <p className="text-sm text-gray-400 mt-2">Account closure requests</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-900/40 to-green-900/40 border-emerald-500/30 shadow-xl shadow-emerald-500/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-emerald-400">
                <Users className="h-5 w-5" />
                Top Spenders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                {topUsersData?.topDailyCashflowUsers?.length || 0}
              </p>
              <p className="text-sm text-gray-400 mt-2">Users tracked today</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Search & Management */}
          <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-blue-500/30 shadow-xl shadow-blue-500/10">
            <CardHeader className="border-b border-blue-500/20">
              <CardTitle className="flex items-center gap-2 text-2xl text-blue-400">
                <Search className="h-6 w-6" />
                User Management
              </CardTitle>
              <CardDescription className="text-gray-400">
                Search and manage user accounts
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6">
              {/* Search Section */}
              <div className="bg-black/40 rounded-lg p-4 border border-zinc-700">
                <Label htmlFor="userSearch" className="text-gray-300 font-medium mb-3 block">
                  Search User by Email
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="userSearch"
                    type="email"
                    placeholder="Enter user email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                   onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                onClick={() => handleSearch()}
                disabled={searchUsersMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400"
              >
                {searchUsersMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Search"
                )}
              </Button>
                </div>
              </div>

              {/* User Details */}
              {selectedUser && (
                <div className="bg-black/40 rounded-lg p-4 border border-zinc-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-gray-300">User Details</h3>
                    <Badge variant={selectedUser.disabled ? "destructive" : selectedUser.selfSuspended ? "secondary" : "default"}>
                      {selectedUser.disabled ? "Disabled" : selectedUser.selfSuspended ? "Suspended" : "Active"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="text-gray-300">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="text-gray-300">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Daily Limit</p>
                      <p className="text-gray-300">
                        £{parseFloat(selectedUser.dailySpendLimit || "0").toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <div className="flex items-center gap-2">
                        {selectedUser.disabled ? (
                          <XCircle className="h-4 w-4 text-red-400" />
                        ) : selectedUser.selfSuspended ? (
                          <EyeOff className="h-4 w-4 text-amber-400" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        )}
                        <span>
                          {selectedUser.disabled ? "Disabled" : selectedUser.selfSuspended ? "Self-suspended" : "Active"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Disable User Section */}
                  <div className="pt-4 border-t border-zinc-700">
                    <Label htmlFor="disableMinutes" className="text-gray-300 font-medium mb-3 block">
                      Disable User (Admin)
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <Input
                          id="disableDays"
                          type="number"
                          min="0"
                          placeholder="Days (0 for indefinite)"
                          value={disableDays}
                          onChange={(e) => setDisableDays(e.target.value)}
                          className="bg-zinc-900 border-zinc-700 text-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter 0 for indefinite disable
                        </p>
                      </div>
                      
                      <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="whitespace-nowrap"
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Disable User
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-red-500/30">
                          <DialogHeader>
                            <DialogTitle className="text-red-400 text-2xl">
                              Confirm User Disable
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Are you sure you want to disable {selectedUser.email}?
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm text-red-300 font-semibold mb-1">
                                    This will prevent the user from:
                                  </p>
                                  <ul className="text-sm text-red-300 space-y-1">
                                    <li>• Logging into their account</li>
                                    <li>• Making any purchases</li>
                                    <li>• Entering competitions</li>
                                    <li>• Accessing any account features</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-black/40 rounded-lg p-4 border border-zinc-700">
                              <p className="text-sm text-gray-300">
                                <span className="font-semibold">Duration:</span>{" "}
                                {parseInt(disableDays) === 0 
                                  ? "Indefinite (until manually re-enabled)" 
                                  : `${disableDays} day${parseInt(disableDays) === 1 ? '' : 's'}`}
                              </p>
                              {parseInt(disableDays) > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Will be automatically re-enabled on:{" "}
                                  {format(
                                    new Date(Date.now() + parseInt(disableDays) * 24 * 60 * 60 * 1000),
                                    "dd/MM/yyyy"
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsDisableDialogOpen(false)}
                              className="border-zinc-700 text-gray-400 hover:bg-zinc-800"
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleDisableUser}
                              disabled={disableUserMutation.isPending}
                            >
                              {disableUserMutation.isPending ? (
                                <>
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                  Processing...
                                </>
                              ) : (
                                "Confirm Disable"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wellbeing Requests */}
          <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-amber-500/30 shadow-xl shadow-amber-500/10">
            <CardHeader className="border-b border-amber-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl text-amber-400">
                    <AlertCircle className="h-6 w-6" />
                    Wellbeing Requests
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    User suspension and closure requests
                  </CardDescription>
                </div>
                
              <Dialog open={isViewRequestsOpen} onOpenChange={setIsViewRequestsOpen}>
  <DialogTrigger asChild>
    <Button
      variant="outline"
      className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
    >
      View All
    </Button>
  </DialogTrigger>
  <DialogContent className="bg-zinc-900 border-amber-500/30 max-w-6xl max-h-[90vh] overflow-auto">
    <DialogHeader>
      <DialogTitle className="text-amber-400 text-2xl">
        All Wellbeing Requests
      </DialogTitle>
      <DialogDescription className="text-gray-400">
        Review all user wellbeing requests
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={filterType} onValueChange={(value) => {
          setFilterType(value);
          setCurrentRequestsPage(1); // Reset to first page when filter changes
        }}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="suspension">Suspensions</SelectItem>
            <SelectItem value="full_closure">Closures</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          onClick={handleExportData}
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>
      
      {/* Request count and pagination info */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <div>
          Showing {Math.min((currentRequestsPage - 1) * requestsPerPage + 1, filteredRequests.length)}-
          {Math.min(currentRequestsPage * requestsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
        </div>
        
        {/* Pagination controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentRequestsPage(prev => Math.max(prev - 1, 1))}
            disabled={currentRequestsPage === 1}
            className="border-zinc-700 text-gray-400 hover:bg-zinc-800 h-8 w-8 p-0"
          >
            ←
          </Button>
          
          <span className="text-sm text-gray-300">
            Page {currentRequestsPage} of {Math.ceil(filteredRequests.length / requestsPerPage)}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentRequestsPage(prev => Math.min(prev + 1, Math.ceil(filteredRequests.length / requestsPerPage)))}
            disabled={currentRequestsPage === Math.ceil(filteredRequests.length / requestsPerPage)}
            className="border-zinc-700 text-gray-400 hover:bg-zinc-800 h-8 w-8 p-0"
          >
            →
          </Button>
        </div>
      </div>
      
      {/* Table with scroll */}
      <div className="border rounded-lg border-zinc-700 max-h-[400px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-zinc-900">
            <TableRow className="border-zinc-700">
              <TableHead className="text-gray-300 sticky top-0 bg-zinc-900">User</TableHead>
              <TableHead className="text-gray-300 sticky top-0 bg-zinc-900">Type</TableHead>
              <TableHead className="text-gray-300 sticky top-0 bg-zinc-900">Duration</TableHead>
              <TableHead className="text-gray-300 sticky top-0 bg-zinc-900">Date</TableHead>
              <TableHead className="text-gray-300 sticky top-0 bg-zinc-900">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests
              .slice(
                (currentRequestsPage - 1) * requestsPerPage,
                currentRequestsPage * requestsPerPage
              )
              .map((request) => (
              <TableRow key={request.id} className="border-zinc-700 hover:bg-zinc-800/50">
                <TableCell className="font-medium text-gray-300">
                  {request.email}
                </TableCell>
                <TableCell>
                  <Badge variant={request.type === "suspension" ? "secondary" : "destructive"}>
                    {request.type === "suspension" ? "Suspension" : "Closure"}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-400">
                  {request.daysRequested 
                    ? `${request.daysRequested} days`
                    : "Permanent"}
                </TableCell>
                <TableCell className="text-gray-400">
                  <div>
                    <div>{format(new Date(request.createdAt), "dd/MM/yyyy")}</div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(request.createdAt), "HH:mm:ss")}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                    Completed
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Bottom pagination */}
      {filteredRequests.length > requestsPerPage && (
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-zinc-700">
          <Button
            variant="outline"
            onClick={() => setCurrentRequestsPage(prev => Math.max(prev - 1, 1))}
            disabled={currentRequestsPage === 1}
            className="border-zinc-700 text-gray-400 hover:bg-zinc-800"
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-300">
            Page {currentRequestsPage} of {Math.ceil(filteredRequests.length / requestsPerPage)}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentRequestsPage(prev => Math.min(prev + 1, Math.ceil(filteredRequests.length / requestsPerPage)))}
            disabled={currentRequestsPage === Math.ceil(filteredRequests.length / requestsPerPage)}
            className="border-zinc-700 text-gray-400 hover:bg-zinc-800"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  </DialogContent>
</Dialog>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              {isLoadingRequests ? (
                <div className="text-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading requests...</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No wellbeing requests found</p>
                  <p className="text-sm text-gray-500 mt-1">Users haven't made any requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-amber-500/10 hover:border-amber-500/30 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-300">{request.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={request.type === "suspension" ? "secondary" : "destructive"} className="text-xs">
                            {request.type === "suspension" ? "Suspension" : "Closure"}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {request.daysRequested ? `${request.daysRequested} days` : "Permanent"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {format(new Date(request.createdAt), "dd/MM/yyyy")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(request.createdAt), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Top Spenders */}
<Card className="w-full mx-auto mb-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-emerald-500/30 shadow-xl shadow-emerald-500/10">
  <CardHeader className="border-b border-emerald-500/20">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <CardTitle className="flex items-center gap-2 text-2xl text-emerald-400">
          <BarChart3 className="h-6 w-6" />
          Daily Top Spenders
        </CardTitle>
        <CardDescription className="text-gray-400">
          Top users by deposits today (Sorted by highest deposits)
        </CardDescription>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Export Button */}
        <Button
          variant="outline"
          onClick={handleExportData}
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  </CardHeader>
  
  <CardContent className="pt-6">
    {isLoadingTopUsers ? (
      <div className="text-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading top spenders...</p>
      </div>
    ) : sortedTopSpenders.length === 0 ? (
      <div className="text-center py-8">
        <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No spending activity today</p>
        <p className="text-sm text-gray-500 mt-1">Check back later for daily statistics</p>
      </div>
    ) : (
      <>
        {/* Pagination Info */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="text-sm text-gray-400">
            Showing {Math.min((currentTopSpendersPage - 1) * topSpendersPerPage + 1, sortedTopSpenders.length)}-
            {Math.min(currentTopSpendersPage * topSpendersPerPage, sortedTopSpenders.length)} of {sortedTopSpenders.length} users
          </div>
          
          {/* Pagination Controls */}
          {sortedTopSpenders.length > topSpendersPerPage && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentTopSpendersPage(prev => Math.max(prev - 1, 1))}
                disabled={currentTopSpendersPage === 1}
                className="h-8 w-8 p-0 border-zinc-700 text-gray-400 hover:bg-zinc-800"
              >
                ←
              </Button>
              
              <span className="text-sm text-gray-300">
                Page {currentTopSpendersPage} of {totalTopSpendersPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentTopSpendersPage(prev => Math.min(prev + 1, totalTopSpendersPages))}
                disabled={currentTopSpendersPage === totalTopSpendersPages}
                className="h-8 w-8 p-0 border-zinc-700 text-gray-400 hover:bg-zinc-800"
              >
                →
              </Button>
            </div>
          )}
        </div>
        
        {/* Table */}
        <div className="border rounded-lg border-zinc-700">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700">
                <TableHead className="text-gray-300">Rank</TableHead>
                <TableHead className="text-gray-300">User</TableHead>
                <TableHead className="text-gray-300">Name</TableHead>
                <TableHead className="text-gray-300 text-right">Amount Deposited</TableHead>
                <TableHead className="text-gray-300 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTopSpenders.map((user, index) => {
                // Calculate global rank (considering pagination)
                const globalIndex = (currentTopSpendersPage - 1) * topSpendersPerPage + index;
                
                return (
                  <TableRow key={user.userId} className="border-zinc-700 hover:bg-zinc-800/50">
                    <TableCell className="font-bold">
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                        globalIndex === 0 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        globalIndex === 1 
                          ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                        globalIndex === 2 
                          ? 'bg-amber-700/20 text-amber-400 border border-amber-700/30' :
                          'bg-zinc-800 text-gray-400 border border-zinc-700'
                      }`}>
                        #{globalIndex + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-300">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-emerald-400 text-lg">
                          £{parseFloat(user.totalDeposited).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Today's deposit
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTopUser(user);
                          setIsTopUserDialogOpen(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 mx-auto"
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Bottom Pagination */}
        {sortedTopSpenders.length > topSpendersPerPage && (
          <div className="flex items-center justify-center gap-4 pt-6 mt-6 border-t border-zinc-700">
            <Button
              variant="outline"
              onClick={() => setCurrentTopSpendersPage(prev => Math.max(prev - 1, 1))}
              disabled={currentTopSpendersPage === 1}
              className="border-zinc-700 text-gray-400 hover:bg-zinc-800"
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalTopSpendersPages) }, (_, i) => {
                let pageNum;
                if (totalTopSpendersPages <= 5) {
                  pageNum = i + 1;
                } else if (currentTopSpendersPage <= 3) {
                  pageNum = i + 1;
                } else if (currentTopSpendersPage >= totalTopSpendersPages - 2) {
                  pageNum = totalTopSpendersPages - 4 + i;
                } else {
                  pageNum = currentTopSpendersPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentTopSpendersPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentTopSpendersPage(pageNum)}
                    className={`h-8 w-8 p-0 ${
                      currentTopSpendersPage === pageNum
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-zinc-700 text-gray-400 hover:bg-zinc-800'
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setCurrentTopSpendersPage(prev => Math.min(prev + 1, totalTopSpendersPages))}
              disabled={currentTopSpendersPage === totalTopSpendersPages}
              className="border-zinc-700 text-gray-400 hover:bg-zinc-800"
            >
              Next
            </Button>
          </div>
        )}
        
        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Deposits</p>
                <p className="text-2xl font-bold text-emerald-400">
                  £{totalDailyDeposits.toFixed(2)}
                </p>
              </div>
              <PiggyBank className="h-8 w-8 text-emerald-400/50" />
            </div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg. Deposit</p>
                <p className="text-2xl font-bold text-blue-400">
                  £{(totalDailyDeposits / sortedTopSpenders.length || 0).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400/50" />
            </div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Top Deposit</p>
                <p className="text-2xl font-bold text-yellow-400">
                  £{sortedTopSpenders.length > 0 ? parseFloat(sortedTopSpenders[0].totalDeposited).toFixed(2) : "0.00"}
                </p>
              </div>
              <Users className="h-8 w-8 text-yellow-400/50" />
            </div>
          </div>
        </div>
      </>
    )}
  </CardContent>
</Card>
      </div>


      {/* Add this dialog after your other dialogs */}
<Dialog open={isTopUserDialogOpen} onOpenChange={setIsTopUserDialogOpen}>
  <DialogContent className="bg-zinc-900 border-blue-500/30 max-w-md">
    <DialogHeader>
      <DialogTitle className="text-blue-400 text-xl">
        User Details
      </DialogTitle>
      <DialogDescription className="text-gray-400">
        Daily spending information
      </DialogDescription>
    </DialogHeader>
    
    {selectedTopUser && (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="text-gray-300 font-medium">
              {selectedTopUser.firstName} {selectedTopUser.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-gray-300 font-medium">{selectedTopUser.email}</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-400">Today's Deposit</p>
              <p className="text-2xl font-bold text-cyan-300">
                £{parseFloat(selectedTopUser.totalDeposited).toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
          onClick={() => {
      const email = selectedTopUser.email;
      setSearchQuery(email);
      setIsTopUserDialogOpen(false);
      setTimeout(() => {
        searchUsersMutation.mutate(email);
      }, 0);
    }}

            className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
          >
            <Search className="h-4 w-4 mr-2" />
            Full Search
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedTopUser(null);
              setIsTopUserDialogOpen(false);
            }}
            className="flex-1 border-zinc-700 text-gray-400 hover:bg-zinc-800"
          >
            Close
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
    </div>
    </AdminLayout>
  );
}