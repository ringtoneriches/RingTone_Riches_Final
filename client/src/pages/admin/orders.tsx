import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search, Trash2, Calendar, ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
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
import { Card } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  competition: string | null;
  quantity: number;
  totalAmount: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

type DateFilter = "all" | "1h" | "24h" | "7d" | "30d" | "custom";

export default function AdminOrders() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("1h");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [currentPage , setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  // Calculate date range (memoized to prevent infinite loops)
  const { dateFrom, dateTo } = useMemo(() => {
    if (dateFilter === "all") {
      return { dateFrom: "", dateTo: "" };
    }

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

  // Fetch orders (only date filtering on backend)
  const { data: allOrders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders", { dateFrom, dateTo }],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);
      
      const url = queryParams.toString() 
        ? `/api/admin/orders?${queryParams.toString()}`
        : "/api/admin/orders";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });
  // console.log("Fetched orders:", allOrders);
  // Client-side filtering for instant search (no reload)
 const orders = useMemo(() => {
  if (!allOrders) return [];
  
  // First, filter to show only completed orders
  const completedOrders = allOrders.filter(order => order.status === "completed");
  
  // If there's no search input, return all completed orders
  if (!searchInput.trim()) return completedOrders;
  
  // If there's search input, filter the completed orders by search
  const searchLower = searchInput.toLowerCase().trim();
  return completedOrders.filter((order) => {
    const fullName = `${order.user.firstName || ""} ${order.user.lastName || ""}`.toLowerCase().trim();
    const email = order.user.email?.toLowerCase() || "";
    const competition = order.competition?.toLowerCase() || "";
    const orderId = order.id?.toLowerCase() || "";
    
    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      competition.includes(searchLower) ||
      orderId.includes(searchLower)
    );
  });
}, [allOrders, searchInput]);
   const totalPages= Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders  = orders.slice(startIndex , startIndex + itemsPerPage);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await apiRequest(`/api/admin/orders/${orderId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order Deleted",
        description: "The order has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      });
    },
  });

  const handleDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteMutation.mutate(orderToDelete);
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

  const totalRevenue = orders?.reduce(
    (sum, order) => sum + parseFloat(order.totalAmount),
    0
  );

  return (
    <AdminLayout>
  <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
    <div className="flex flex-col gap-2 sm:gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground" data-testid="heading-orders">
          Orders & Transactions
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">View all platform orders</p>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Orders</p>
        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mt-1 sm:mt-2">{orders?.length || 0}</p>
      </div>
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Revenue</p>
        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mt-1 sm:mt-2">
          £{totalRevenue?.toFixed(2) || "0.00"}
        </p>
      </div>
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">Completed Orders</p>
        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-500 mt-1 sm:mt-2">
          {orders?.filter((o) => o.status === "completed").length || 0}
        </p>
      </div>
    </div>

    {/* Date Filters */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <div className="flex items-center gap-2">
        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
        <span className="text-xs sm:text-sm font-medium text-foreground">Date Range:</span>
      </div>
      <div className="flex flex-wrap gap-1 sm:gap-2">
        <Button
          variant={dateFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setDateFilter("all")}
          className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          data-testid="button-filter-all"
        >
          All
        </Button>
        <Button
          variant={dateFilter === "1h" ? "default" : "outline"}
          size="sm"
          onClick={() => setDateFilter("1h")}
          className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          data-testid="button-filter-1h"
        >
          1H
        </Button>
        <Button
          variant={dateFilter === "24h" ? "default" : "outline"}
          size="sm"
          onClick={() => setDateFilter("24h")}
          className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          data-testid="button-filter-24h"
        >
          24H
        </Button>
        <Button
          variant={dateFilter === "7d" ? "default" : "outline"}
          size="sm"
          onClick={() => setDateFilter("7d")}
          className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          data-testid="button-filter-7d"
        >
          7D
        </Button>
        <Button
          variant={dateFilter === "30d" ? "default" : "outline"}
          size="sm"
          onClick={() => setDateFilter("30d")}
          className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          data-testid="button-filter-30d"
        >
          30D
        </Button>
        <Button
          variant={dateFilter === "custom" ? "default" : "outline"}
          size="sm"
          onClick={() => setDateFilter("custom")}
          className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          data-testid="button-filter-custom"
        >
          Custom
        </Button>
      </div>
    </div>

    {/* Custom Date Range Inputs */}
    {dateFilter === "custom" && (
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center bg-card border border-border rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <label className="text-xs sm:text-sm font-medium text-foreground">From:</label>
          <Input
            type="date"
            value={customDateFrom}
            onChange={(e) => setCustomDateFrom(e.target.value)}
            className="w-full sm:w-auto text-sm"
            data-testid="input-date-from"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <label className="text-xs sm:text-sm font-medium text-foreground">To:</label>
          <Input
            type="date"
            value={customDateTo}
            onChange={(e) => setCustomDateTo(e.target.value)}
            className="w-full sm:w-auto text-sm"
            data-testid="input-date-to"
          />
        </div>
      </div>
    )}

    <div className="relative">
      <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
      <Input
        placeholder="Search orders by user email or competition..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="pl-8 sm:pl-10 text-sm sm:text-base"
        data-testid="input-search-orders"
      />
    </div>

    {/* Mobile Cards View */}
    <div className="block md:hidden space-y-3">
      {paginatedOrders?.map((order) => (
        <Card key={order.id} className="p-4">
          <div className="space-y-4">
            {/* Order Header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-muted-foreground font-mono">
                  ID: {order.id.slice(0, 8)}...
                </div>
                <div className="text-sm font-medium text-foreground mt-1">
                  {order.user.firstName} {order.user.lastName || order.user.email}
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === "completed"
                    ? "bg-green-500/20 text-green-500"
                    : order.status === "pending"
                    ? "bg-yellow-500/20 text-yellow-500"
                    : "bg-red-500/20 text-red-500"
                }`}
              >
                {order.status}
              </span>
            </div>

            {/* Order Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Competition:</span>
                <span className="font-medium text-foreground">{order.competition || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium text-foreground">{order.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium text-primary">£{parseFloat(order.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment:</span>
                <span className="font-medium text-foreground">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium text-foreground text-xs">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteOrder(order.id)}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                data-testid={`button-delete-order-${order.id}`}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete Order
              </Button>
            </div>
          </div>
        </Card>
      ))}
      
      {paginatedOrders?.length === 0 && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="text-base sm:text-lg font-medium">No orders found</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters
            </div>
          </div>
        </Card>
      )}
    </div>

    {/* Desktop Table View */}
    <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                Order ID
              </th>
              <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                User
              </th>
              <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                Competition
              </th>
              <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                Quantity
              </th>
              <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                Amount
              </th>
              <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                Payment Method
              </th>
              <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                Date
              </th>
              <th className="text-center py-3 px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders?.map((order) => (
              <tr key={order.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-3 px-4 text-sm text-muted-foreground font-mono">
                  {order.id.slice(0, 8)}...
                </td>
                <td className="py-3 px-4 text-sm text-foreground">
                  {order.user.firstName} {order.user.lastName || order.user.email}
                </td>
                <td className="py-3 px-4 text-sm text-foreground">
                  {order.competition || "N/A"}
                </td>
                <td className="py-3 px-4 text-sm text-foreground">{order.quantity}</td>
                <td className="py-3 px-4 text-sm text-primary font-medium">
                  £{parseFloat(order.totalAmount).toFixed(2)}
                </td>
                <td className="py-3 px-4 text-sm text-foreground">
                  {order.paymentMethod}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === "completed"
                        ? "bg-green-500/20 text-green-500"
                        : order.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-500"
                        : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteOrder(order.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    data-testid={`button-delete-order-${order.id}`}
                    title="Delete Order"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* PAGINATION */}
    {paginatedOrders?.length > 0 && (
      <>
        <div className="flex flex-row justify-center items-center gap-3 sm:gap-4 my-4 sm:my-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
            className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4 text-xs sm:text-sm"
          >
            <ArrowBigLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-1">Previous</span>
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
                  className="w-8 h-8 sm:w-10 sm:h-10 text-xs"
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
            className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4 text-xs sm:text-sm"
          >
            <span className="hidden sm:inline mr-1">Next</span>
            <ArrowBigRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>

        <p className="text-center text-xs sm:text-sm text-muted-foreground">
          Showing {paginatedOrders.length} of {allOrders.length} filtered entries
        </p>
      </>
    )}

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent className="max-w-full sm:max-w-md p-4 sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg sm:text-xl">Delete Order</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Are you sure you want to delete this order? This action cannot be undone and will also delete all associated tickets.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <AlertDialogCancel className="w-full sm:w-auto text-sm sm:text-base" data-testid="button-cancel-delete">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto text-sm sm:text-base"
            disabled={deleteMutation.isPending}
            data-testid="button-confirm-delete"
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