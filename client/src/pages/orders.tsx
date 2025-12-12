import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Link } from "wouter";
import { OrderDetailsDialog } from "@/components/order-details-dialog";

interface Ticket {
  id: string;
  ticketNumber: string;
  userId: string;
  competitionId: string;
  isWinner: boolean;
  prizeAmount: string | null;
  createdAt: string;
}

interface OrderWithCompetition {
  competitions: {
    title: string;
    imageUrl: string;
    ticketPrice: string;
    type: string;
  };
  orders: {
    id: string;
    competitionId: string;
    quantity: number;
    totalAmount: string;
    paymentMethod: string;
    walletAmount: string;
    pointsAmount: string;
    cashflowsAmount: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  tickets?: Ticket[];
  remainingPlays?: number;
}


export default function Orders() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithCompetition | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderWithCompetition[]>({
    queryKey: ["/api/user/orders"],
    enabled: isAuthenticated,
  }
);

  // Filter incomplete games (spin/scratch with remaining plays)
  const incompleteGames = orders.filter(
    (order) => 
      (order.competitions?.type === 'spin' || order.competitions?.type === 'scratch') &&
      order.orders.status === 'completed' &&
      (order.remainingPlays || 0) > 0
  );

  // Filter completed orders (exclude incomplete games)
  const completedOrders = orders.filter(
    (order) => 
      !((order.competitions?.type === 'spin' || order.competitions?.type === 'scratch') &&
        order.orders.status === 'completed' &&
        (order.remainingPlays || 0) > 0)
  );

// ⬇️ Add pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 15;

  // ⬇️ Pagination calculations
  const totalPages = Math.ceil(completedOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const currentOrders = completedOrders.slice(startIndex, startIndex + ordersPerPage);

  // 🔄 Handle page changes
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };


  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Navigation Tabs - Mobile Optimized */}
        <div className="bg-muted text-center py-3 sm:py-4 mb-4 sm:mb-8 rounded-lg">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm px-2">
            <span className="text-primary font-semibold px-2 py-1" data-testid="text-current-page">Orders</span>
            <Link href="/entries" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-entries">
              Entries
            </Link>
            <Link href="/ringtune-points" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-ringtune">
              RingTone Points
            </Link>
            <Link href="/referral" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-referral">
              Referral
            </Link>
            <Link href="/wallet" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-wallet">
              Wallet
            </Link>
            <Link href="/account" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-account">
              Account
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center" data-testid="heading-orders">MY ACCOUNT</h1>

          {/* Incomplete Games Section */}
          {incompleteGames.length > 0 && (
            <div className="bg-card rounded-xl border-2 border-yellow-500/30 p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6 text-yellow-400 flex items-center gap-2">
                <span className="text-yellow-400">🎮</span> GAMES IN PROGRESS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {incompleteGames.map((order) => (
                  <div
                    key={order.orders.id}
                    className="bg-background/50 rounded-lg border border-yellow-500/20 p-4 hover:border-yellow-500/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      {order.competitions?.imageUrl && (
                        <img
                          src={order.competitions.imageUrl}
                          alt={order.competitions?.title || "Competition"}
                          className="w-16 h-16 rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {order.competitions?.title || "Unknown Competition"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {order.competitions?.type === 'spin' ? 'Spin Wheel' : 'Scratch Card'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-500/10 rounded-md p-3 mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Remaining:</span>
                        <span className="text-lg font-bold text-yellow-400">
                          {order.remainingPlays}/{order.orders.quantity}
                        </span>
                      </div>
                      <div className="w-full bg-background/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-full transition-all"
                          style={{
                            width: `${((order.remainingPlays || 0) / order.orders.quantity) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <Link
                      to={
                        order.competitions?.type === 'spin'
                          ? `/spin/${order.orders.competitionId}/${order.orders.id}`
                          : `/scratch/${order.orders.competitionId}/${order.orders.id}`
                      }
                      className="block"
                    >
                      <button
                        className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105"
                        data-testid={`button-resume-${order.orders.id}`}
                      >
                        Resume Game
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-2xl font-bold mb-6">PAST ORDERS</h2>
            
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-muted rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4" data-testid="text-no-orders">
                  No orders yet
                </p>
                <Link href="/">
                  <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity" data-testid="button-browse-competitions">
                    Browse Competitions
                  </button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Order</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Total</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.map((order) => (
                      <tr key={order.orders.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            {order.competitions?.imageUrl && (
                              <img 
                                src={order.competitions.imageUrl} 
                                alt={order.competitions.title}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium" data-testid={`text-order-id-${order.orders.id ?? "unknown"}`}>
  #{order.orders.id ? order.orders.id.slice(-8).toUpperCase() : "UNKNOWN"}
</p>

                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {order.competitions?.title || 'Competition'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {order.orders.quantity} item{order.orders.quantity !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground" data-testid={`text-order-date-${order.orders.id}`}>
                          {new Date(order.orders.createdAt).toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            order.orders.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : order.orders.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              : order.orders.status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                          }`} data-testid={`text-order.orders-status-${order.orders.id}`}>
                           {order.orders.status
  ? order.orders.status.charAt(0).toUpperCase() + order.orders.status.slice(1)
  : "Unknown"}

                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold" data-testid={`text-order-total-${order.orders.id}`}>
                          £{parseFloat(order.orders.totalAmount).toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          <button 
                            onClick={() => {
                              setSelectedOrder(order);
                              setDialogOpen(true);
                            }}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                            data-testid={`button-view-order-${order.orders.id}`}
                          >
                            VIEW
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.length > ordersPerPage && (
  <div className="flex justify-center items-center space-x-4 mt-6">
    <button
      onClick={handlePrevPage}
      disabled={currentPage === 1}
      className={`px-4 py-2 rounded-lg border ${
        currentPage === 1
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-muted"
      }`}
    >
      Previous
    </button>

    <span className="text-sm text-muted-foreground">
      Page {currentPage} of {totalPages}
    </span>

    <button
      onClick={handleNextPage}
      disabled={currentPage === totalPages}
      className={`px-4 py-2 rounded-lg border ${
        currentPage === totalPages
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-muted"
      }`}
    >
      Next
    </button>
  </div>
)}

              </div>
            )}
          </div>
        </div>
      </div>

      <OrderDetailsDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={selectedOrder}
      />

      <Footer />
    </div>
  );
}
