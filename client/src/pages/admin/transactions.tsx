import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Search,
  Calendar,
  ArrowBigLeft,
  ArrowBigRight,
  Wallet,
  TrendingUp,
  Users,
  PoundSterling,
  Download,
  CreditCard,
  Banknote,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type DateFilter = "all" | "1h" | "24h" | "7d" | "30d" | "custom";

export default function AdminTransactions() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("1h");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // DATE RANGE HANDLER
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
    }

    return { dateFrom, dateTo };
  }, [dateFilter, customDateFrom, customDateTo]);

  // FETCH DATA
  const { data: transactions = [], isLoading } = useQuery<CashflowTx[]>({
    queryKey: ["/api/admin/cashflow-transactions", dateFrom, dateTo],
    queryFn: async () => {
      const url = new URL("/api/admin/cashflow-transactions", window.location.origin);
      if (dateFrom) url.searchParams.append("dateFrom", dateFrom);
      if (dateTo) url.searchParams.append("dateTo", dateTo);
      
      const res = await fetch(url.toString(), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval:10000,
    refetchIntervalInBackground: true,
    staleTime: 5000,
  });

 


  // FILTERING
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const searchLower = search.toLowerCase().trim();
      const matchSearch =
        searchLower === "" ||
        tx.userName?.toString().includes(searchLower) ||
        tx.userEmail?.toString().includes(searchLower) ||
        tx.amount.toString().includes(searchLower) ||
        tx.description.toString().includes(searchLower) ||
        tx.type.toString().includes(searchLower) ||
        tx.source?.toLowerCase().includes(searchLower);

      let matchDate = true;
      if (dateFrom) matchDate = new Date(tx.createdAt) >= new Date(dateFrom);
      if (dateTo) matchDate = matchDate && new Date(tx.createdAt) <= new Date(dateTo);

      return matchSearch && matchDate;
    });
  }, [transactions, search, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


   // CALCULATE ANALYTICS
   const analytics = useMemo(() => {
    if (!filtered.length) return null;
  
    // Convert all amounts to numbers
    const txAmounts = filtered.map(tx => ({
      ...tx,
      amount: Number(tx.amount || 0)
    }));
  
    const totalAmount = txAmounts.reduce((sum, tx) => sum + tx.amount, 0);
  
    const depositTotal = txAmounts
      .filter(tx => tx.type === "deposit")
      .reduce((sum, tx) => sum + tx.amount, 0);
  
    const competitionTotal = txAmounts
      .filter(tx => tx.type !== "deposit")
      .reduce((sum, tx) => sum + tx.amount, 0);
  
    const uniqueUsers = new Set(txAmounts.map(tx => tx.userEmail).filter(Boolean));
  
    // Daily breakdown
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
  
    const dailyData = last7Days.map(date => {
      const dayTransactions = txAmounts.filter(tx => tx.createdAt.startsWith(date));
      const dayTotal = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      return {
        date: new Date(date).toLocaleDateString('en-GB', { weekday: 'short' }),
        amount: dayTotal,
        count: dayTransactions.length
      };
    });
  
    const sourceData = Object.entries(
      txAmounts.reduce((acc, tx) => {
        const source = tx.source || 'unknown';
        acc[source] = (acc[source] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));
  
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
    return {
      totalAmount,
      depositTotal,
      competitionTotal,
      uniqueUsers: uniqueUsers.size,
      transactionCount: txAmounts.length,
      dailyData,
      sourceData,
      COLORS
    };
  }, [filtered]);

  // Export function
  const handleExportCSV = () => {
    if (!transactions.length) return;
    
    const headers = ['Date', 'User', 'Email', 'Type', 'Source', 'Description', 'Amount'];
    const csvRows = [
      headers.join(','),
      ...transactions.map(tx => [
        new Date(tx.createdAt).toLocaleString(),
        tx.userName || 'N/A',
        tx.userEmail || 'N/A',
        tx.type,
        tx.source || 'N/A',
        `"${tx.description.replace(/"/g, '""')}"`,
        tx.amount.toFixed(2)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cashflow-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
<AdminLayout>
  <div className="space-y-4 md:space-y-6">
    {/* HEADER - Stack on mobile, row on desktop */}
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
      <Button 
        onClick={handleExportCSV} 
        disabled={!transactions.length}
        className="w-full sm:w-auto"
      >
        <Download className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
    </div>

    {/* FILTERS & SEARCH */}
    <Card>
      <CardContent className="pt-4 sm:pt-6 space-y-4">
        {/* DATE FILTERS - Wrap on mobile */}
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

        {/* CUSTOM FILTERS - Stack on mobile */}
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

        {/* SEARCH */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by user, transaction, amount..."
            className="pl-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>

    {/* SUMMARY CARDS - 1 column on mobile, 3 on desktop */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Card 1: Total Revenue */}
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
            £{analytics ? Number(analytics.totalAmount || 0).toFixed(2) : '0.00'}
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <div className="flex items-center text-green-500">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              <span>From {analytics ? analytics.transactionCount : 0} txs</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Top-Ups */}
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
            £{analytics ? Number(analytics.depositTotal || 0).toFixed(2) : '0.00'}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <Badge 
              variant="outline" 
              className="w-fit border-emerald-500/30 text-emerald-400 text-xs"
            >
              {analytics && analytics.totalAmount > 0 
                ? `${((analytics.depositTotal / analytics.totalAmount) * 100).toFixed(1)}% of total`
                : '0%'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {filtered.filter(tx => tx.type === "deposit").length} deposits
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Active Users */}
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
            {analytics ? analytics.uniqueUsers : 0}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">
            Avg £{analytics && analytics.uniqueUsers > 0 
              ? (analytics.totalAmount / analytics.uniqueUsers).toFixed(2) 
              : '0.00'} per user
          </div>
        </CardContent>
      </Card>
    </div>

    {/* TRANSACTIONS TABLE - Scrollable on mobile */}
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">Transaction Details</CardTitle>
        <CardDescription className="text-sm">
          Showing {paginated.length} of {filtered.length} filtered transactions
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
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No transactions found for selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/50">
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
                          className={`
                            text-xs ${tx.type === 'deposit' 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : ''
                            }
                          `}
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* PAGINATION - Compact on mobile */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-4 sm:mt-6">
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage((p) => p - 1)} 
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ArrowBigLeft className="w-4 h-4" />
              </Button>

              <span className="text-sm min-w-[100px] text-center">
                Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ArrowBigRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="order-1 sm:order-2 text-xs text-muted-foreground sm:hidden">
              {filtered.length} total transactions
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
</AdminLayout>
  );
}