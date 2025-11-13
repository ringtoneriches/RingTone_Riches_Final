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
  Sparkles
} from "lucide-react";

interface UnifiedBillingProps {
  orderId: string;
  orderType: 'competition' | 'spin' | 'scratch';
}

export default function UnifiedBilling({ orderId, orderType }: UnifiedBillingProps) {
  const [, setLocation] = useLocation();
  const [selectedMethods, setSelectedMethods] = useState({
    walletBalance: false,
    ringtonePoints: false,
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine API endpoints based on order type
  const getEndpoint = () => {
    switch(orderType) {
      case 'spin': return '/api/spin-order';
      case 'scratch': return '/api/scratch-order';
      default: return '/api/order';
    }
  };

  const getPaymentEndpoint = (needsCashflows: boolean) => {
    switch(orderType) {
      case 'spin': return '/api/process-spin-payment';
      case 'scratch': return '/api/process-scratch-payment';
      default: return needsCashflows ? '/api/create-payment-intent' : '/api/purchase-ticket';
    }
  };

  const getTitle = () => {
    switch(orderType) {
      case 'spin': return 'Spin Wheel Purchase';
      case 'scratch': return 'Scratch Card Purchase';
      default: return 'Competition Tickets';
    }
  };

  const getItemName = () => {
    switch(orderType) {
      case 'spin': return 'Spin Cards';
      case 'scratch': return 'Scratch Cards';
      default: return 'Tickets';
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
  const itemCost = orderType === 'competition' 
    ? parseFloat(competition?.ticketPrice || '0') 
    : parseFloat(orderData?.scratchCost || orderData?.spinCost || '2');

  const processPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const totalAmount = Number(order?.totalAmount) || 0;
      const walletBalance = Number(user?.balance) || 0;
      const ringtonePoints = user?.ringtonePoints || 0;
      const ringtoneBalance = ringtonePoints * 0.01;
      
      const maxWalletUse = Math.min(walletBalance, totalAmount);
      const maxPointsUse = Math.min(ringtoneBalance, totalAmount);
      const walletUsed = data.useWalletBalance ? maxWalletUse : 0;
      const remainingAfterWallet = totalAmount - walletUsed;
      const actualPointsUsed = Math.min(maxPointsUse, remainingAfterWallet);
      const finalPointsUsed = data.useRingtonePoints ? actualPointsUsed : 0;
      const finalAmount = totalAmount - walletUsed - finalPointsUsed;
      
      const needsCashflows = finalAmount > 0;
      const res = await apiRequest(getPaymentEndpoint(needsCashflows), "POST", data);
      return res.json();
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
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
          if (orderType === 'spin') {
            setLocation(`/spin/${competitionId}/${orderId}`);
          } else if (orderType === 'scratch') {
            setLocation(`/scratch/${competitionId}/${orderId}`);
          } else {
            setLocation(`/success/competition?orderId=${orderId}`);
          }
        }, 1500);
      } else {
        toast({
          title: "Payment Failed",
          description: data.message || "Something went wrong",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  const handleMethodToggle = (method: 'walletBalance' | 'ringtonePoints') => {
    setSelectedMethods((prev) => ({ ...prev, [method]: !prev[method] }));
  };

  const handleConfirmPayment = () => {
    if (!orderId) {
      toast({ title: "Error", description: "Invalid order ID.", variant: "destructive" });
      return;
    }

    if (!agreeToTerms) {
      toast({
        title: "Terms Not Accepted",
        description: "Please agree to the terms and conditions.",
        variant: "destructive",
      });
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

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-[70vh] bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-yellow-400">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg">Loading your order...</p>
        </div>
      </div>
    );

  if (!order)
    return (
      <div className="flex justify-center items-center h-[70vh] bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-yellow-400">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <p className="text-lg">Invalid or expired order.</p>
        </div>
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

              {/* Or Continue with Card */}
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">
                  Or pay the full amount with card via Cashflows
                </p>
              </div>
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
                I have read and agree to the{" "}
                <a href="/terms-and-conditions" className="text-yellow-400 hover:text-yellow-300 underline">
                  terms and conditions
                </a>
              </label>
            </div>
          </div>

          {/* Checkout Button */}
          <Button
            disabled={isProcessing || !agreeToTerms}
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
                {finalAmount > 0 ? `COMPLETE PAYMENT - £${finalAmount.toFixed(2)}` : 'COMPLETE PURCHASE'}
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
                {finalAmount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                    <span className="text-gray-300">Card Payment</span>
                    <span className="text-amber-400 font-semibold">£{finalAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 mt-3 bg-yellow-500/10 -mx-6 px-6 py-3 rounded-lg">
                  <span className="font-bold text-white">Final Total</span>
                  <span className="font-black text-yellow-400 text-xl">
                    {finalAmount > 0 ? `£${finalAmount.toFixed(2)}` : 'FULLY COVERED'}
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
    </div>
  );
}
