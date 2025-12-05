import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface Ticket {
  id: string;
  ticketNumber: string;
  userId: string;
  competitionId: string;
  isWinner: boolean;
  prizeAmount: string | null;
  createdAt: string;
}

interface OrderDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
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
    };
    competitions: {
      title: string;
      imageUrl: string;
      ticketPrice: string;
    };
    tickets?: Ticket[];
  } | null;
}

export function OrderDetailsDialog({ open, onOpenChange, order }: OrderDetailsProps) {
  if (!order) return null;

  const subtotal = (parseFloat(order.competitions.ticketPrice) * order.orders.quantity).toFixed(2);
  const walletUsed = parseFloat(order.orders.walletAmount || "0").toFixed(2);
  const pointsUsed = parseFloat(order.orders.pointsAmount || "0").toFixed(2);
  const cashPaid = parseFloat(order.orders.cashflowsAmount || "0").toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">ORDER DETAILS</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status */}
          <div className="border-b border-border pb-4">
            <p className="text-sm text-muted-foreground">
              Order <span className="text-primary font-bold" data-testid={`text-dialog-order-id-${order.orders.id}`}>#{order.orders.id.slice(-8).toUpperCase()}</span> was placed on{" "}
              {format(new Date(order.orders.createdAt), "dd MMMM yyyy")} and is currently{" "}
              <span className="font-bold capitalize">{order.orders.status}</span>.
            </p>
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-start gap-4 mb-4">
              {order.competitions.imageUrl && (
                <img
                  src={order.competitions.imageUrl}
                  alt={order.competitions.title}
                  className="w-16 h-16 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2" data-testid="text-product-name">{order.competitions.title}</h3>
                {order.tickets && order.tickets.length > 0 && (
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-sm font-semibold mb-2">Numbers:</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-entry-numbers">
                      {order.tickets.map(t => t.ticketNumber).join(", ")}
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold" data-testid="text-item-total">£{subtotal}</p>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex justify-between">
              <span className="font-semibold">Subtotal:</span>
              <span data-testid="text-subtotal">£{subtotal}</span>
            </div>

            {parseFloat(pointsUsed) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Ringtone Points:</span>
                <span data-testid="text-points-used">-pts{pointsUsed}</span>
              </div>
            )}

            {parseFloat(walletUsed) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Site Credit:</span>
                <span data-testid="text-wallet-used">-£{walletUsed}</span>
              </div>
            )}

            <div className="flex justify-between border-t border-border pt-3">
              <span className="font-semibold">Payment method:</span>
              <span className="capitalize" data-testid="text-payment-method">
                {order.orders.paymentMethod === "cashflows" ? "Debit/Credit Card" : order.orders.paymentMethod}
              </span>
            </div>

            <div className="flex justify-between text-lg font-bold border-t border-border pt-3">
              <span>Total:</span>
              <span data-testid="text-order-total">£{parseFloat(order.orders.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
