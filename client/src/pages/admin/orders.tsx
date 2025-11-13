import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search, Trash2, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

type DateFilter = "all" | "24h" | "7d" | "30d" | "custom";

export default function AdminOrders() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Calculate date range (memoized to prevent infinite loops)
  const { dateFrom, dateTo } = useMemo(() => {
    if (dateFilter === "all") {
      return { dateFrom: "", dateTo: "" };
    }

    const now = new Date();
    let dateFrom = "";
    let dateTo = "";

    switch (dateFilter) {
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

  // Structured query key for proper cache invalidation
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders", { dateFrom, dateTo, search: searchTerm }],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);
      if (searchTerm) queryParams.append("search", searchTerm);
      
      const url = queryParams.toString() 
        ? `/api/admin/orders?${queryParams.toString()}`
        : "/api/admin/orders";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });

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
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="heading-orders">
              Orders & Transactions
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">View all platform orders</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Total Orders</p>
            <p className="text-3xl font-bold text-foreground mt-2">{orders?.length || 0}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-primary mt-2">
              £{totalRevenue?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground font-medium">Completed Orders</p>
            <p className="text-3xl font-bold text-green-500 mt-2">
              {orders?.filter((o) => o.status === "completed").length || 0}
            </p>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground mr-2">Date Range:</span>
          <Button
            variant={dateFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("all")}
            data-testid="button-filter-all"
          >
            All Time
          </Button>
          <Button
            variant={dateFilter === "24h" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("24h")}
            data-testid="button-filter-24h"
          >
            Last 24 Hours
          </Button>
          <Button
            variant={dateFilter === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("7d")}
            data-testid="button-filter-7d"
          >
            Last 7 Days
          </Button>
          <Button
            variant={dateFilter === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("30d")}
            data-testid="button-filter-30d"
          >
            Last 30 Days
          </Button>
          <Button
            variant={dateFilter === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateFilter("custom")}
            data-testid="button-filter-custom"
          >
            Custom Range
          </Button>
        </div>

        {/* Custom Date Range Inputs */}
        {dateFilter === "custom" && (
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">From:</label>
              <Input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="w-auto"
                data-testid="input-date-from"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">To:</label>
              <Input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="w-auto"
                data-testid="input-date-to"
              />
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search orders by user email or competition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-orders"
          />
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Competition
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Quantity
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Payment Method
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders?.map((order) => (
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
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                        data-testid={`button-delete-order-${order.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone and will also delete all associated tickets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
