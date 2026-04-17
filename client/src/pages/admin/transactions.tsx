import { useInfiniteQuery, useQuery } from "@tanstack/react-query"; // Add useQuery
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Search,
  Calendar,
  Wallet,
  TrendingUp,
  Users,
  Download,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CashflowTx {
  id: string;
  userName?: string;
  userEmail?: string;
  description: string;
  paymentRef: string;
  type: string;
  amount: number;
  source: string;
  createdAt: string;
}

interface PaginatedResponse {
  transactions: CashflowTx[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface StatsResponse {
  totalAmount: number;
  depositTotal: number;
  transactionCount: number;
  uniqueUsers: number;
}

type DateFilter = "all" | "1h" | "24h" | "7d" | "30d" | "custom";

export default function AdminTransactions() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("1h");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  
  // Debounce search to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Date range handler
  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    let dateFrom = "";
    let dateTo = "";

    switch (dateFilter) {
      case "1h":
        dateFrom = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
        break;
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
      case "all":
        // Leave empty for all time
        break;
    }

    return { dateFrom, dateTo };
  }, [dateFilter, customDateFrom, customDateTo]);

  // Separate query for stats/totals (only when filters change)
  const { data: statsData, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ["/api/admin/cashflow-transactions/stats", dateFrom, dateTo, debouncedSearch],
    queryFn: async () => {
      const url = new URL("/api/admin/cashflow-transactions/stats", window.location.origin);
      if (dateFrom) url.searchParams.append("dateFrom", dateFrom);
      if (dateTo) url.searchParams.append("dateTo", dateTo);
      if (debouncedSearch) url.searchParams.append("search", debouncedSearch);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Infinite query for paginated data
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<PaginatedResponse>({
    queryKey: ["/api/admin/cashflow-transactions", dateFrom, dateTo, debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const url = new URL("/api/admin/cashflow-transactions", window.location.origin);
      url.searchParams.append("page", pageParam.toString());
      url.searchParams.append("limit", "20");
      if (dateFrom) url.searchParams.append("dateFrom", dateFrom);
      if (dateTo) url.searchParams.append("dateTo", dateTo);
      if (debouncedSearch) url.searchParams.append("search", debouncedSearch);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
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
    refetchInterval: 30000,
  });

  // Intersection Observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLTableRowElement | null) => {
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

  // Flatten all transactions from all pages (for display only)
  const allTransactions = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.transactions);
  }, [data]);

  const totalTransactions = data?.pages[0]?.pagination.total || 0;

  // Use statsData for analytics (the true totals), not the loaded transactions
  const analytics = statsData || {
    totalAmount: 0,
    depositTotal: 0,
    uniqueUsers: 0,
    transactionCount: 0,
  };

  // Export function
  const handleExportCSV = async () => {
    const url = new URL("/api/admin/cashflow-transactions/export", window.location.origin);
    if (dateFrom) url.searchParams.append("dateFrom", dateFrom);
    if (dateTo) url.searchParams.append("dateTo", dateTo);
    if (debouncedSearch) url.searchParams.append("search", debouncedSearch);
    
    window.open(url.toString(), '_blank');
  };

  if (isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              Cashflow Transactions
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Wallet top-ups & cashflow usage analytics
            </p>
          </div>
          <Button onClick={handleExportCSV} disabled={!totalTransactions} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* FILTERS */}
        <Card>
          <CardContent className="pt-4 sm:pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 items-start sm:items-center">
              <div className="flex items-center gap-2 mb-2 sm:mb-0">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">Date Range:</span>
              </div>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
                {["all", "1h", "24h", "7d", "30d", "custom"].map((d) => (
                  <Button
                    key={d}
                    size="sm"
                    variant={dateFilter === d ? "default" : "outline"}
                    onClick={() => setDateFilter(d as DateFilter)}
                    className="text-xs sm:text-sm"
                  >
                    {d === "all" && "All"}
                    {d === "1h" && "1H"}
                    {d === "24h" && "24H"}
                    {d === "7d" && "7D"}
                    {d === "30d" && "30D"}
                    {d === "custom" && "Custom"}
                  </Button>
                ))}
              </div>
            </div>

            {dateFilter === "custom" && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Input 
                  type="date" 
                  value={customDateFrom} 
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="w-full sm:w-auto"
                />
                <Input 
                  type="date" 
                  value={customDateTo} 
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by user, transaction, amount, reference..."
                className="pl-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* SUMMARY CARDS - Now showing true totals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-blue-400">Total Revenue</p>
                  <p className="text-xs text-muted-foreground">All cashflow transactions</p>
                </div>
                <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                £{analytics.totalAmount.toFixed(2)}
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <div className="flex items-center text-green-500">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  <span>From {analytics.transactionCount} txs</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-emerald-400">Top-Ups</p>
                  <p className="text-xs text-muted-foreground">User deposits only</p>
                </div>
                <CreditCard className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                £{analytics.depositTotal.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Total deposits from all users
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20 sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-violet-400">Active Users</p>
                  <p className="text-xs text-muted-foreground">Unique users with transactions</p>
                </div>
                <Users className="w-5 h-5 text-violet-400 flex-shrink-0" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {analytics.uniqueUsers}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Unique users who have transacted
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TRANSACTIONS TABLE with Infinite Scroll */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Transaction Details</CardTitle>
            <CardDescription className="text-sm">
              Showing {allTransactions.length} of {totalTransactions} transactions
              {hasNextPage && " - Scroll down to load more"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">User</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead className="whitespace-nowrap">Type</TableHead>
                      <TableHead className="hidden md:table-cell">Source</TableHead>
                      <TableHead className="hidden lg:table-cell">Description</TableHead>
                      <TableHead className="hidden xl:table-cell">Reference</TableHead>
                      <TableHead className="whitespace-nowrap">Amount</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {allTransactions.map((tx, index) => {
                      const isLastRow = index === allTransactions.length - 1;
                      return (
                        <TableRow 
                          key={tx.id} 
                          ref={isLastRow ? loadMoreRef : null}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium whitespace-nowrap">
                            <div className="text-sm">
                              {new Date(tx.createdAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[100px] truncate">
                            <div className="font-medium">{tx.userName || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground sm:hidden truncate">
                              {tx.userEmail || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell max-w-[150px] truncate">
                            {tx.userEmail || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={tx.type === 'deposit' ? 'default' : 'secondary'}
                              className={`text-xs ${tx.type === 'deposit' 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                : ''
                              }`}
                            >
                              {tx.type === 'deposit' ? 'Top-Up' : tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="text-xs">
                              {tx.source || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
                            {tx.description || 'N/A'}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell max-w-[150px] truncate">
                            {tx.paymentRef || 'N/A'}
                          </TableCell>
                          <TableCell className="font-bold whitespace-nowrap">
                            <span className={tx.type === 'deposit' ? 'text-green-400' : 'text-blue-400'}>
                              £{Number(tx.amount || 0).toFixed(2)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {isFetchingNextPage && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          <div className="flex justify-center items-center gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                            <span className="text-sm text-muted-foreground">Loading more transactions...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {!hasNextPage && allTransactions.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4 text-muted-foreground text-sm">
                          No more transactions to load
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {allTransactions.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No transactions found for selected filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}