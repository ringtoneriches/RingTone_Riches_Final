// components/guest-checkout-form.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface GuestCheckoutFormProps {
  competitionId: string;
  gameType: string;
  quantity: number;
  ticketPrice: number;
  onSuccess: (redirectUrl: string) => void;
}

export function GuestCheckoutForm({ 
  competitionId, 
  gameType, 
  quantity, 
  ticketPrice,
  onSuccess 
}: GuestCheckoutFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const totalAmount = (ticketPrice * quantity).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Create guest order
      const orderRes = await fetch("/api/guest/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: form.name,
          guestEmail: form.email,
          guestPhone: form.phone,
          competitionId,
          gameType,
          quantity,
        }),
        credentials: "include",
      });

      if (!orderRes.ok) {
        const error = await orderRes.json();
        throw new Error(error.message || "Failed to create order");
      }

      const orderData = await orderRes.json();

      // Step 2: Process payment
      const paymentRes = await fetch("/api/guest/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
        }),
        credentials: "include",
      });

      if (!paymentRes.ok) {
        const error = await paymentRes.json();
        throw new Error(error.message || "Payment failed");
      }

      const paymentData = await paymentRes.json();

      // Redirect to payment page
      if (paymentData.redirectUrl) {
        onSuccess(paymentData.redirectUrl);
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest Checkout</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+44 7123 456789"
            />
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Quantity:</span>
              <span>{quantity} {gameType === 'pop' ? 'plays' : 'tickets'}</span>
            </div>
            <div className="flex justify-between text-sm font-bold mt-2">
              <span>Total:</span>
              <span>£{totalAmount}</span>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? "Processing..." : "Pay £" + totalAmount + " with Card"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By proceeding, you agree to our terms and conditions.
            A confirmation will be sent to your email.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}