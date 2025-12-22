import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  CreditCard, 
  Wallet, 
  Coins, 
  ShieldCheck, 
  Lock, 
  CheckCircle2,
  AlertCircle,
  Ticket,
  Sparkles,
  X,
  ArrowUpRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface UnifiedBillingProps {
  orderId: string;
  orderType: 'competition' | 'spin' | 'scratch';
  wheelType?: string;
}

export default function UnifiedBilling({ orderId, orderType ,wheelType }: UnifiedBillingProps) {
  const [, setLocation] = useLocation();
  const [selectedMethods, setSelectedMethods] = useState({
    walletBalance: false,
    ringtonePoints: false,
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  // Determine API endpoints based on order type
  const getEndpoint = () => {
    switch(orderType) {
      case 'spin': return '/api/spin-order';
      case 'scratch': return '/api/scratch-order';
      default: return '/api/order';
    }
  };

  const getTitle = () => {
    if (orderType === "spin") {
      if (wheelType === "wheel2") {
        return "The Festive Spin Purchase";
      }
      return "The Luxury Car Spin Purchase";
    }

    switch (orderType) {
      case "scratch":
        return "The Landmark Loot Purchase";
      default:
        return "Competition Tickets";
    }
  };

  const getItemName = () => {
    if (orderType === "spin") {
      if (wheelType === "wheel2") {
        return "Festive Spins";
      }
      return "Spins";
    }

    switch (orderType) {
      case "scratch":
        return "Scratch Cards";
      default:
        return "Tickets";
    }
  };

  const {
    data: orderData,
    isLoading,
  } = useQuery({
    queryKey: [getEndpoint(), orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await apiRequest(`${getEndpoint()}/${orderId}`, "GET");
      const data = await res.json();
      return data;
    },
  });

  const order = orderData?.order;
  const user = orderData?.user;
  const competition = orderData?.competition;

  // ✅ FIXED: Add itemCost variable
  const itemCost = orderType === 'competition' 
    ? parseFloat(competition?.ticketPrice || '0') 
    : parseFloat(orderData?.scratchCost || orderData?.spinCost || '2');

  const totalAmount = Number(order?.totalAmount) || 0;
  const walletBalance = Number(user?.balance) || 0;
  const ringtonePoints = user?.ringtonePoints || 0;
  const ringtoneBalance = ringtonePoints * 0.01;

  const maxWalletUse = Math.min(walletBalance, totalAmount);
  const maxPointsUse = Math.min(ringtoneBalance, totalAmount);
  const walletUsed = selectedMethods.walletBalance ? maxWalletUse : 0;
  const pointsUsed = selectedMethods.ringtonePoints ? maxPointsUse : 0;
  const remainingAfterWallet = totalAmount - walletUsed;
  const actualPointsUsed = Math.min(maxPointsUse, remainingAfterWallet);
  const finalPointsUsed = selectedMethods.ringtonePoints ? actualPointsUsed : 0;
  const finalAmount = totalAmount - walletUsed - finalPointsUsed;
  const pointsNeeded = Math.ceil(finalPointsUsed * 100);
  
  const processPaymentMutation = useMutation({
  mutationFn: async (data: any) => {
    // Determine which endpoint to use
    let endpoint = "";
    
    switch (orderType) {
      case "spin":
        endpoint = "/api/process-spin-payment";
        break;
      case "scratch":
        endpoint = "/api/process-scratch-payment";
        break;
      default: // competition
        endpoint = "/api/purchase-ticket";
        break;
    }

    const res = await apiRequest(endpoint, "POST", {
      ...data,
      orderId,
      competitionId: order?.competitionId,
      quantity: order?.quantity || 1,
    });
    
    // Get the response text first
    const responseText = await res.text();
    
    // Try to parse as JSON, but handle non-JSON responses
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      // If not JSON, create a simple error object
      throw new Error(`Server error: ${responseText.slice(0, 100)}`);
    }
    
    // Check if it's an error response
    if (!res.ok) {
      // Use the result.message if available, or a default
      const errorMessage = result?.message || result?.error || "Payment failed";
      throw new Error(errorMessage);
    }
    
    // Check for "insufficient funds" in the success response too
    if (result.remainingAmount > 0) {
      throw new Error(`Insufficient funds. You need £${result.remainingAmount.toFixed(2)} more.`);
    }
    
    return result;
  },
  onSuccess: (data) => {
    setIsProcessing(false);
    localStorage.removeItem('pendingOrderInfo');
    // ✅ Check if this is actually an error disguised as success
    if (data.remainingAmount > 0) {
      setShowTopUpModal(true);
      return;
    }
    
    if (data.success) {
      toast({
        title: "Purchase Successful 🎉",
        description: data.message || `Your purchase is complete!`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: [getEndpoint(), orderId] });

      const competitionId = data.competitionId || order?.competitionId;

      setTimeout(() => {
        if (orderType === 'spin') setLocation(`/spin/${competitionId}/${orderId}`);
        else if (orderType === 'scratch') setLocation(`/scratch/${competitionId}/${orderId}`);
        else setLocation(`/success/competition?orderId=${orderId}`);
      }, 1500);
    }
  },
  onError: (error: any) => {
    setIsProcessing(false);
    console.error("Payment error:", error); // Debug log
    
    // Get the actual error message
    const errorMessage = error?.message || "Payment failed";
    
    // Check if it's a "top up required" error
    if (
      errorMessage.includes("Insufficient") || 
      errorMessage.includes("insufficient") ||
      errorMessage.includes("need") ||
      errorMessage.includes("more")
    ) {
      setShowTopUpModal(true);
    } else {
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  },
});

  const handleMethodToggle = (method: 'walletBalance' | 'ringtonePoints') => {
    setSelectedMethods(prev => ({ ...prev, [method]: !prev[method] }));
  };

  const handleConfirmPayment = () => {
    if (!orderId) {
      toast({ title: "Error", description: "Invalid order ID.", variant: "destructive" });
      return;
    }

    if (!agreeToTerms) {
      toast({ title: "Terms Not Accepted", description: "Please agree to the terms and conditions.", variant: "destructive" });
      return;
    }

    // Check if at least one payment method is selected
    if (!selectedMethods.walletBalance && !selectedMethods.ringtonePoints) {
      toast({
        title: "Select Payment Method",
        description: "Please select wallet balance or ringtone points to pay.",
        variant: "destructive",
      });
      return;
    }

    if (finalAmount > 0) {
      setShowTopUpModal(true);
      return;
    }

    setIsProcessing(true);

    const payload: any = {
      orderId,
      useWalletBalance: selectedMethods.walletBalance,
      useRingtonePoints: selectedMethods.ringtonePoints,
    };
    if (orderType === 'competition') {
      payload.competitionId = order?.competitionId;
      payload.quantity = order?.quantity || 1;
    }

    processPaymentMutation.mutate(payload);
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-[70vh] bg-black text-yellow-400">
        <p>Loading order...</p>
      </div>
    );

  if (!order)
    return (
      <div className="flex justify-center items-center h-[70vh] bg-black text-yellow-400">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p>Invalid or expired order.</p>
      </div>
    );
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Payment Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-yellow-500 via-yellow-600 to-amber-600 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-6 h-6 text-black" />
                  <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                    CHECKOUT
                  </h1>
                </div>
                <p className="text-black/80 font-semibold text-sm sm:text-base">
                  {getTitle()}
                </p>
              </div>
              <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-black/10 rounded-full backdrop-blur-sm">
                <Ticket className="w-8 h-8 text-black" />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
            <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-yellow-500/10">
                <span className="text-gray-300 text-sm sm:text-base">{getItemName()}</span>
                <span className="font-bold text-white text-lg">{order?.quantity || 1}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-yellow-500/10">
                <span className="text-gray-300 text-sm sm:text-base">Price per item</span>
              
                <span className="font-semibold text-white">£{itemCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-4 bg-yellow-500/5 -mx-6 px-6 rounded-lg mt-3">
                <span className="font-bold text-yellow-400 text-base sm:text-lg">Total Amount</span>
                <span className="font-black text-yellow-400 text-2xl sm:text-3xl">
                  £{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
            <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Options
            </h2>
            
            <div className="space-y-4">
              {/* Wallet Balance Option */}
              <div
                className={`relative group cursor-pointer rounded-xl border-2 transition-all duration-300 ${
                  selectedMethods.walletBalance
                    ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-green-500/50 hover:bg-zinc-800"
                }`}
                onClick={() => handleMethodToggle("walletBalance")}
                data-testid="checkbox-wallet"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                        selectedMethods.walletBalance ? "bg-green-500" : "bg-zinc-700"
                      } transition-colors`}>
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white text-lg">Wallet Balance</h3>
                          {selectedMethods.walletBalance && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          Available: <span className="text-green-400 font-semibold">£{walletBalance.toFixed(2)}</span>
                        </p>
                        <p className="text-sm font-semibold text-yellow-400">
                          Use £{maxWalletUse.toFixed(2)} from wallet
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMethods.walletBalance}
                      onChange={() => handleMethodToggle("walletBalance")}
                      className="w-5 h-5 text-green-500 border-gray-600 rounded focus:ring-green-500 focus:ring-offset-0 bg-zinc-700"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>

              {/* Ringtone Points Option */}
              <div
                className={`relative group cursor-pointer rounded-xl border-2 transition-all duration-300 ${
                  selectedMethods.ringtonePoints
                    ? "border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/20"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-yellow-500/50 hover:bg-zinc-800"
                }`}
                onClick={() => handleMethodToggle("ringtonePoints")}
                data-testid="checkbox-points"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                        selectedMethods.ringtonePoints ? "bg-yellow-500" : "bg-zinc-700"
                      } transition-colors`}>
                        <Coins className="w-6 h-6 text-black" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white text-lg">Ringtone Points</h3>
                          {selectedMethods.ringtonePoints && (
                            <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          Available: <span className="text-yellow-400 font-semibold">{ringtonePoints.toLocaleString()} pts (£{ringtoneBalance.toFixed(2)})</span>
                        </p>
                        <p className="text-sm font-semibold text-yellow-400">
                          Use £{maxPointsUse.toFixed(2)} ({Math.ceil(maxPointsUse * 100)} points)
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMethods.ringtonePoints}
                      onChange={() => handleMethodToggle("ringtonePoints")}
                      className="w-5 h-5 text-yellow-500 border-gray-600 rounded focus:ring-yellow-500 focus:ring-offset-0 bg-zinc-700"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>

              {/* ❌ REMOVED: Cashflows reference */}
              {/* <div className="text-center py-4">
                <p className="text-gray-400 text-sm">
                  Or pay the full amount with card via Cashflows
                </p>
              </div> */}
            </div>
          </div>

          {/* Terms */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-5 h-5 text-yellow-500 border-gray-600 rounded focus:ring-yellow-500 focus:ring-offset-0 bg-zinc-700 mt-0.5"
                data-testid="checkbox-terms"
              />
              <label className="text-sm text-gray-300 leading-relaxed">
                I am over 18 and agree to the{" "}
                <a href="/terms-and-conditions" className="text-yellow-400 hover:text-yellow-300 underline">
                  terms and conditions
                </a>
              </label>
            </div>
          </div>

          {/* Checkout Button */}
          <Button
            disabled={isProcessing || !agreeToTerms || (!selectedMethods.walletBalance && !selectedMethods.ringtonePoints)}
            onClick={handleConfirmPayment}
            className="w-full bg-gradient-to-r from-yellow-500 via-yellow-600 to-amber-600 hover:from-yellow-400 hover:via-yellow-500 hover:to-amber-500 text-black font-black text-lg py-7 rounded-xl shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            data-testid="button-checkout"
          >
            {isProcessing ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin w-5 h-5 border-3 border-black border-t-transparent rounded-full" />
                PROCESSING...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Lock className="w-5 h-5" />
                {finalAmount > 0 ? `TOP UP REQUIRED - £${finalAmount.toFixed(2)}` : 'COMPLETE PURCHASE'}
              </div>
            )}
          </Button>
        </div>

        {/* Sidebar - Payment Breakdown & Security */}
        <div className="lg:col-span-1 space-y-6">
          {/* Payment Breakdown */}
          {(selectedMethods.walletBalance || selectedMethods.ringtonePoints) && (
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
              <h3 className="font-bold text-yellow-400 mb-4 text-lg">Payment Breakdown</h3>
              <div className="space-y-3 text-sm">
                {selectedMethods.walletBalance && (
                  <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                    <span className="text-gray-300">Wallet Balance</span>
                    <span className="text-green-400 font-semibold">-£{walletUsed.toFixed(2)}</span>
                  </div>
                )}
                {selectedMethods.ringtonePoints && (
                  <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                    <span className="text-gray-300">Ringtone Points</span>
                    <span className="text-yellow-400 font-semibold">
                      -£{finalPointsUsed.toFixed(2)} ({pointsNeeded} pts)
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 mt-3 bg-yellow-500/10 -mx-6 px-6 py-3 rounded-lg">
                  <span className="font-bold text-white">Final Total</span>
                  <span className="font-black text-yellow-400 text-xl">
                    {finalAmount > 0 ? `£${finalAmount.toFixed(2)} NEEDED` : 'FULLY COVERED'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Security & Trust Signals */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
            <h3 className="font-bold text-yellow-400 mb-4 text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Secure Payment
            </h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-green-500" />
                <span>256-bit SSL Encryption</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>PCI DSS Compliant</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span>Secure Payment Gateway</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <p className="text-xs text-gray-400 leading-relaxed">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
            </div>
          </div>

          {/* Need Help */}
          <div className="bg-gradient-to-br from-blue-950/20 to-blue-900/20 rounded-2xl p-6 border border-blue-500/20 shadow-xl">
            <h3 className="font-bold text-blue-400 mb-3 text-lg">Need Help?</h3>
            <p className="text-sm text-gray-300 mb-3">
              Our support team is here to assist you with any questions.
            </p>
            <a 
              href="mailto:support@ringtoneriches.co.uk"
              className="text-sm text-yellow-400 hover:text-yellow-300 underline"
            >
              support@ringtoneriches.co.uk
            </a>
          </div>
        </div>
      </div>

      {/* ✅ BEAUTIFUL MODAL FOR TOP UP */}
      <Dialog open={showTopUpModal} onOpenChange={setShowTopUpModal}>
        <DialogContent className="bg-gradient-to-br from-zinc-900 to-zinc-950  border-yellow-500/30 w-[90vw] text-white max-w-md rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-400 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Top Up Required
            </DialogTitle>
            <DialogDescription className="text-gray-300 pt-2">
              Your current funds are insufficient to complete this purchase.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Order Total:</span>
                  <span className="font-bold text-yellow-400">£{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Available Funds:</span>
                  <span className="font-bold text-green-400">£{(walletBalance + ringtoneBalance).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-yellow-500/20 pt-2">
                  <span className="text-gray-300">Remaining:</span>
                  <span className="font-bold text-red-400">£{finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <p className="text-center text-gray-300">
              Please add funds to your wallet to continue.
            </p>
          </div>
          
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowTopUpModal(false)}
              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
               // Save pending order info before redirecting
              localStorage.setItem('pendingOrderInfo', JSON.stringify({
                orderId,
                orderType,
                wheelType,
                totalAmount,
                finalAmount, // Amount needed
                topupCompleted: false,
                timestamp: Date.now()
              }));
              
              setShowTopUpModal(false);
              setLocation("/wallet?tab=wallet");
              }}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold gap-2"
            >
              <ArrowUpRight className="w-4 h-4" />
              Go to Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}