import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Search,
  Calendar,
  ArrowBigLeft,
  ArrowBigRight,
  Wallet,
} from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CashflowTx {
  userName?: string;
  userEmail?: string;
  description: string;
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
    queryKey: ["/api/admin/cashflow-transactions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cashflow-transactions", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

//   // DETERMINE TRANSACTION TYPE
//   const getType = (tx: CashflowTx) => {
//     if (!tx.competitionId) return "Wallet Top-Up";
//     return "Competition Payment";
//   };

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
        tx.source?.toLowerCase().includes(searchLower) 

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
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="w-8 h-8 text-primary" />
            Cashflow Transactions
          </h1>
          <p className="text-muted-foreground">Wallet top-ups & cashflow usage</p>
        </div>

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
            placeholder="Search by user ID, transaction ID, amount..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead>Name</TableHead>
                 <TableHead>Email</TableHead>
                 <TableHead>Source</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.userName}</TableCell>
                    <TableCell>{tx.userEmail}</TableCell>
                    <TableCell>{tx.source}</TableCell>
                    <TableCell>{tx.description || "N/A"}</TableCell>
                    <TableCell>
                      {/* {getType(tx) === "deposit" ? (
                        <span className="text-green-600 font-semibold">deposit</span>
                      ) : (
                        <span className="text-blue-600 font-semibold">Competition Payment</span>
                      )} */}
                        <span className="font-semibold">{tx.type === "deposit" ? "Top-Up" : tx.type}</span>
                    </TableCell>
                
                    <TableCell className="font-bold text-primary">£{tx.amount}</TableCell>
                    <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center items-center gap-4 my-6">
          <Button variant="outline" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>
            <ArrowBigLeft />
          </Button>

          <span>Page {currentPage} of {totalPages}</span>

          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
          >
            <ArrowBigRight />
          </Button>
        </div>

      </div>
    </AdminLayout>
  );
}
