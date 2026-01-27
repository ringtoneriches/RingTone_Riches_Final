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
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

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
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
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

  // CALCULATE ANALYTICS
  const analytics = useMemo(() => {
  if (!transactions.length) return null;

  // Convert all amounts to numbers
  const txAmounts = transactions.map(tx => ({
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
}, [transactions]);


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
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Wallet className="w-8 h-8 text-primary" />
              Cashflow Transactions
            </h1>
            <p className="text-muted-foreground">Wallet top-ups & cashflow usage analytics</p>
          </div>
          <Button onClick={handleExportCSV} disabled={!transactions.length}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>




      

        {/* FILTERS & SEARCH */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* DATE FILTERS */}
            <div className="flex flex-wrap gap-2 items-center">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium mr-2">Date Range:</span>

              {["all", "1h", "24h", "7d", "30d", "custom"].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={dateFilter === d ? "default" : "outline"}
                  onClick={() => setDateFilter(d as DateFilter)}
                >
                  {d === "all" && "All Time"}
                  {d === "1h" && "1 Hour"}
                  {d === "24h" && "24 Hours"}
                  {d === "7d" && "7 Days"}
                  {d === "30d" && "30 Days"}
                  {d === "custom" && "Custom"}
                </Button>
              ))}
            </div>

            {/* CUSTOM FILTERS */}
            {dateFilter === "custom" && (
              <div className="flex gap-4">
                <Input type="date" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)} />
                <Input type="date" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)} />
              </div>
            )}

            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by user, transaction, amount..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

       {/* SUMMARY CARDS */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Card 1: Total Revenue */}
  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg flex items-center justify-between">
        <span className="text-blue-400">Total Revenue</span>
        <TrendingUp className="w-5 h-5 text-blue-400" />
      </CardTitle>
      <CardDescription>All cashflow transactions</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-white">
        £{analytics ? Number(analytics.totalAmount || 0).toFixed(2) : '0.00'}
      </div>
      <div className="flex items-center gap-2 mt-2 text-sm">
        <div className="flex items-center text-green-500">
          <ArrowUpRight className="w-3 h-3 mr-1" />
          <span>From {analytics ? analytics.transactionCount : 0} transactions</span>
        </div>
      </div>
      {/* <Progress 
        value={100} 
        className="mt-4 h-2 bg-blue-900/30 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-blue-600"
      /> */}
    </CardContent>
  </Card>

  {/* Card 2: Top-Ups */}
  <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg flex items-center justify-between">
        <span className="text-emerald-400">Top-Ups</span>
        <CreditCard className="w-5 h-5 text-emerald-400" />
      </CardTitle>
      <CardDescription>User deposits only</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-white">
        £{analytics ? Number(analytics.depositTotal || 0).toFixed(2) : '0.00'}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
          {analytics && analytics.totalAmount > 0 
            ? `${((analytics.depositTotal / analytics.totalAmount) * 100).toFixed(1)}% of total`
            : '0%'}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {transactions.filter(tx => tx.type === "deposit").length} deposits
        </span>
      </div>
      {/* <Progress 
        value={analytics && analytics.totalAmount > 0 
          ? (analytics.depositTotal / analytics.totalAmount) * 100 
          : 0} 
        className="mt-4 h-2 bg-emerald-900/30 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-600"
      /> */}
    </CardContent>
  </Card>

  {/* Card 3: Active Users */}
  <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg flex items-center justify-between">
        <span className="text-violet-400">Active Users</span>
        <Users className="w-5 h-5 text-violet-400" />
      </CardTitle>
      <CardDescription>Unique users with transactions</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-white">
        {analytics ? analytics.uniqueUsers : 0}
      </div>
      <div className="flex items-center gap-2 mt-2 text-sm">
        <span className="text-muted-foreground">
          Avg £{analytics && analytics.uniqueUsers > 0 
            ? (analytics.totalAmount / analytics.uniqueUsers).toFixed(2) 
            : '0.00'} per user
        </span>
      </div>
      {/* <Progress 
        value={analytics && transactions.length > 0 
          ? Math.min(100, (analytics.uniqueUsers / transactions.length) * 100) 
          : 0} 
        className="mt-4 h-2 bg-violet-900/30 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-violet-600"
      /> */}
    </CardContent>
  </Card>
</div>

        {/* TRANSACTIONS TABLE */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Showing {paginated.length} of {filtered.length} filtered transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No transactions found for selected filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {new Date(tx.createdAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>{tx.userName || 'N/A'}</TableCell>
                        <TableCell>{tx.userEmail || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={tx.type === 'deposit' ? 'default' : 'secondary'}
                            className={tx.type === 'deposit' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                          >
                            {tx.type === 'deposit' ? 'Top-Up' : tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {tx.source || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{tx.description || 'N/A'}</TableCell>
                        <TableCell className="max-w-xs truncate">{tx.paymentRef || 'N/A'}</TableCell>
                        <TableCell className="font-bold">
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

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage((p) => p - 1)} 
                  disabled={currentPage === 1}
                >
                  <ArrowBigLeft />
                </Button>

                <span className="text-sm">
                  Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
                </span>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ArrowBigRight />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}