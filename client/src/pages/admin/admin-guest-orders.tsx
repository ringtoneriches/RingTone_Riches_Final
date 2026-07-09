import { useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowBigLeft, ArrowBigRight, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

interface GuestOrder {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  gameType: string;
  quantity: number;
  totalAmount: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  orderReference: string;
  prizeAmount: string | null;
  isWinner: boolean;
  createdAt: string;
}

export default function AdminGuestOrders() {
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<GuestOrder | null>(null);
  const itemsPerPage = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/guest-orders", searchInput, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      if (searchInput) params.append("search", searchInput);

      const res = await fetch(`/api/admin/guest-orders?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch guest orders");
      return res.json();
    },
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getGameTypeBadge = (type: string) => {
    switch (type) {
      case 'pop':
        return <Badge className="bg-purple-500">Pop</Badge>;
      case 'scratch':
        return <Badge className="bg-orange-500">Scratch</Badge>;
      case 'spin':
        return <Badge className="bg-blue-500">Spin</Badge>;
      case 'plinko':
        return <Badge className="bg-green-500">Plinko</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            Guest Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all guest checkout orders
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search by name, email, or order reference..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-medium">Order Ref</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Guest</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Game</th>
                  <th className="text-center py-3 px-4 text-sm font-medium">Qty</th>
                  <th className="text-right py-3 px-4 text-sm font-medium">Amount</th>
                  <th className="text-center py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Date</th>
                  <th className="text-center py-3 px-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      No guest orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order: GuestOrder) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{order.orderReference}</span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {order.guestName}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {order.guestEmail}
                      </td>
                      <td className="py-3 px-4">
                        {getGameTypeBadge(order.gameType)}
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        {order.quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium">
                        £{order.totalAmount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {format(new Date(order.createdAt), "dd MMM yyyy HH:mm")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
            >
              <ArrowBigLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
            >
              <ArrowBigRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Guest Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Order Reference</Label>
                    <p className="font-mono font-medium">{selectedOrder.orderReference}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <p>{getStatusBadge(selectedOrder.status)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Guest Name</Label>
                    <p className="font-medium">{selectedOrder.guestName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p>{selectedOrder.guestEmail}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <p>{selectedOrder.guestPhone || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Game Type</Label>
                    <p>{getGameTypeBadge(selectedOrder.gameType)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Quantity</Label>
                    <p>{selectedOrder.quantity}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Amount</Label>
                    <p className="font-bold">£{selectedOrder.totalAmount}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Payment Method</Label>
                    <p>{selectedOrder.paymentMethod}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Payment Status</Label>
                    <p>{selectedOrder.paymentStatus}</p>
                  </div>
                  {selectedOrder.isWinner && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Prize Amount</Label>
                      <p className="font-bold text-green-600">£{selectedOrder.prizeAmount}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <p>{format(new Date(selectedOrder.createdAt), "dd MMM yyyy HH:mm")}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}