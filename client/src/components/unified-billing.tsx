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
  ArrowUpRight,
  Tag,
  Percent
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface UnifiedBillingProps {
  orderId: string;
  orderType: 'competition' | 'spin' | 'scratch' | 'pop' | 'plinko';
  wheelType?: string;
}

export default function UnifiedBilling({ orderId, orderType, wheelType }: UnifiedBillingProps) {
  const [, setLocation] = useLocation();
  const [selectedMethods, setSelectedMethods] = useState({
    walletBalance: false,
    ringtonePoints: false,
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  // Determine API endpoints based on order type
  const getEndpoint = () => {
    switch(orderType) {
      case 'spin': return '/api/spin-order';
      case 'scratch': return '/api/scratch-order';
      case 'pop': return '/api/pop-order';
      case 'plinko': return '/api/plinko-order';
      default: return '/api/order';
    }
  };

  const getTitle = () => {
    if (orderType === "spin") {
      if (wheelType === "wheel2") {
        return "RETRO RINGTONE SPIN Purchase";
      }
      return "The Luxury Car Spin Purchase";
    }

    switch (orderType) {
      case "scratch":
        return "The Landmark Loot Purchase";
      case "pop":
        return "Ringtone Pop Purchase";
      case "plinko":
        return "Ringtone Plinko Purchase";
      default:
        return "Competition Tickets";
    }
  };

  const getItemName = () => {
    if (orderType === "spin") {
      if (wheelType === "wheel2") {
        return "Retro Spins";
      }
      return "Spins";
    }

    switch (orderType) {
      case "scratch":
        return "Scratch Cards";
      case "pop":
        return "Pop Games";
      case "plinko":
        return "Plinko Games";
      default:
        return "Tickets";
    }
  };

  const {
    data: orderData,
    isLoading,
    refetch: refetchOrder,
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

  // Check if this is an instant competition (should disable points)
  const isInstantCompetition = orderType === 'competition' && competition?.type === 'instant';
  
  // Determine if points should be disabled
  const isPointsDisabled = isInstantCompetition;

  const itemCost = orderType === 'competition' 
  ? parseFloat(competition?.ticketPrice || '0') 
  : parseFloat(orderData?.scratchCost || orderData?.spinCost || orderData?.popCost || orderData?.plinkoCost || '2');

  const appliedDiscount = Number(order?.discountAmount || 0);
  const discountType = order?.discountType || null;
  
  const pointsDiscountCashValue =
    discountType === "points" ? appliedDiscount * 0.01 : 0;
  
  // backend already applied discount
  const totalAmount = Number(order?.totalAmount);
  
  // reconstruct original total ONLY for UI strike-through
  const originalTotalAmount =
    appliedDiscount > 0
      ? totalAmount + (discountType === "cash" ? appliedDiscount : pointsDiscountCashValue)
      : totalAmount;
  
     

const walletBalance = Number(user?.balance) || 0;
const ringtonePoints = user?.ringtonePoints || 0;
const ringtoneBalance = ringtonePoints * 0.01;

// Simple calculations
const maxWalletUse = Math.min(walletBalance, totalAmount);
const maxPointsUse = isPointsDisabled ? 0 : Math.min(ringtoneBalance, totalAmount);
const walletUsed = selectedMethods.walletBalance ? maxWalletUse : 0;
const pointsUsed = selectedMethods.ringtonePoints ? maxPointsUse : 0;
const remainingAfterWallet = totalAmount - walletUsed;
const actualPointsUsed = isPointsDisabled ? 0 : Math.min(maxPointsUse, remainingAfterWallet);
const finalPointsUsed = selectedMethods.ringtonePoints ? actualPointsUsed : 0;
const finalAmount = totalAmount - walletUsed - finalPointsUsed;
const pointsNeeded = Math.ceil(finalPointsUsed * 100);
  
  // Apply discount mutation
  const applyDiscountMutation = useMutation({
    mutationFn: async (code: string) => {
      
    const res = await fetch("/api/checkout/apply-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, code }),
      });
  
      const data = await res.json();
      
      
  
      if (!res.ok) {
        throw new Error(data.error || "Failed to apply discount");
      }
  
      return data;
    },
  
    onSuccess: (data) => {
      setIsApplyingDiscount(false);
  
      toast({
        title: "Discount Applied 🎉",
        description: data.message,
      });
  
      setShowDiscountDialog(false);
      setDiscountCode("");
      refetchOrder();
    },
  
    onError: (error: any) => {
      setIsApplyingDiscount(false);
  
      toast({
        title: "Discount Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  

  // Remove discount mutation
  const removeDiscountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/checkout/remove-discount", "POST", {
        orderId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Discount Removed",
          description: "Discount has been removed from your order",
          variant: "default",
        });
        refetchOrder();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove discount",
        variant: "destructive",
      });
    },
  });

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter a discount code",
        variant: "destructive",
      });
      return;
    }
    setIsApplyingDiscount(true);
    applyDiscountMutation.mutate(discountCode.trim().toUpperCase());
  };

  const handleRemoveDiscount = () => {
    removeDiscountMutation.mutate();
  };

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
        case 'pop': 
          endpoint =  '/api/process-pop-payment';
          break;
        case 'plinko': 
          endpoint =  '/api/process-plinko-payment';
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
      
      const responseText = await res.text();
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`Server error: ${responseText.slice(0, 100)}`);
      }
      
      if (!res.ok) {
        const errorMessage = result?.message || result?.error || "Payment failed";
        throw new Error(errorMessage);
      }
      
      if (result.remainingAmount > 0) {
        throw new Error(`Insufficient funds. You need £${result.remainingAmount.toFixed(2)} more.`);
      }
      
      return result;
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      localStorage.removeItem('pendingOrderInfo');
      
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
          else if (orderType === 'pop') setLocation(`/pop/${competitionId}/${orderId}`);
          else if (orderType === 'plinko') setLocation(`/plinko/${competitionId}/${orderId}`);
          else setLocation(`/success/competition?orderId=${orderId}`);
        }, 1500);
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      console.error("Payment error:", error);
      
      const errorMessage = error?.message || "Payment failed";
      
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
    // Prevent enabling points for instant competitions
    if (method === 'ringtonePoints' && isPointsDisabled) {
      toast({
        title: "Points Not Available",
        description: "Ringtone Points cannot be used for competitions.",
        variant: "destructive",
      });
      return;
    }
    
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

    // Additional validation for instant competitions
    if (isInstantCompetition && selectedMethods.ringtonePoints) {
      toast({
        title: "Invalid Payment Method",
        description: "Ringtone Points cannot be used for competitions.",
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
        <div className="lg:col-span-2 space-y-2 sm:space-y-6">
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Order Summary
              </h2>
              
              {/* Discount Section */}
           {/* Discount Section */}
        <div className="flex items-center gap-2">
          {appliedDiscount > 0 ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Tag className="w-3 h-3 mr-1" />
                {discountType === 'cash' ? `£${appliedDiscount} OFF` : `${appliedDiscount} Points`}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveDiscount}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
                disabled={removeDiscountMutation.isPending}
              >
                {removeDiscountMutation.isPending ? "Removing..." : <X className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiscountDialog(true)}
              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            >
              <Tag className="w-4 h-4 mr-2" />
              Apply Discount
            </Button>
          )}
        </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-yellow-500/10">
                <span className="text-gray-300 text-sm sm:text-base">{getItemName()}</span>
                <span className="font-bold text-white text-lg">{order?.quantity || 1}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-yellow-500/10">
                <span className="text-gray-300 text-sm sm:text-base">Price per item</span>
                <span className="font-semibold text-white">£{itemCost.toFixed(2)}</span>
              </div>
              
              {/* Discount Display */}
             {/* In the Order Summary section - fix the condition */}
{appliedDiscount > 0 && discountType === 'cash' && (
  <div className="flex justify-between items-center py-2 border-b border-green-500/20">
    <span className="text-gray-300 text-sm sm:text-base flex items-center gap-1">
      <Tag className="w-4 h-4 text-green-400" />
      Cash Discount Applied
    </span>
    <span className="font-bold text-green-400 text-lg">-£{appliedDiscount.toFixed(2)}</span>
  </div>
)}

{appliedDiscount > 0 && discountType === 'points' && (
  <div className="flex justify-between items-center py-2 border-b border-green-500/20">
    <span className="text-gray-300 text-sm sm:text-base flex items-center gap-1">
      <Tag className="w-4 h-4 text-green-400" />
      Points Discount Applied
    </span>
    <span className="font-bold text-green-400 text-lg">
      -£{pointsDiscountCashValue.toFixed(2)} ({appliedDiscount.toLocaleString()} pts)
    </span>
  </div>
)}

{/* Also fix the total amount display */}
<div className="flex justify-between items-center py-4 bg-yellow-500/5 -mx-6 px-6 rounded-lg mt-3">
  <span className="font-bold text-yellow-400 text-base sm:text-lg">Total Amount</span>
  <div className="text-right">
    {appliedDiscount > 0 && discountType === 'cash' && (
      <div className="text-sm text-gray-400 line-through mb-1">
        £{originalTotalAmount.toFixed(2)}
      </div>
    )}
    <span className="font-black text-yellow-400 text-2xl sm:text-3xl">
      £{totalAmount.toFixed(2)}
    </span>
  </div>
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
                className={`relative group rounded-xl border-2 transition-all duration-300 ${
                  isPointsDisabled
                    ? "border-zinc-700 bg-zinc-800/30 opacity-60 cursor-not-allowed"
                    : selectedMethods.ringtonePoints
                      ? "border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/20 cursor-pointer"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-yellow-500/50 hover:bg-zinc-800 cursor-pointer"
                }`}
                onClick={isPointsDisabled ? undefined : () => handleMethodToggle("ringtonePoints")}
                data-testid="checkbox-points"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                        isPointsDisabled
                          ? "bg-zinc-800"
                          : selectedMethods.ringtonePoints
                            ? "bg-yellow-500"
                            : "bg-zinc-700"
                      } transition-colors`}>
                        <Coins className={`w-6 h-6 ${isPointsDisabled ? 'text-zinc-600' : 'text-black'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-bold text-lg ${isPointsDisabled ? 'text-gray-500' : 'text-white'}`}>
                            Ringtone Points
                            {isPointsDisabled && (
                              <span className="ml-2 text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                                Not Available
                              </span>
                            )}
                          </h3>
                          {!isPointsDisabled && selectedMethods.ringtonePoints && (
                            <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          Available: <span className="text-yellow-400 font-semibold">
                            {ringtonePoints.toLocaleString()} pts (£{ringtoneBalance.toFixed(2)})
                          </span>
                        </p>
                        {isPointsDisabled ? (
                          <p className="text-sm font-semibold text-red-400">
                            Points cannot be used for competitions
                          </p>
                        ) : (
                          <p className="text-sm font-semibold text-yellow-400">
                            Use £{maxPointsUse.toFixed(2)} ({Math.ceil(maxPointsUse * 100)} points)
                          </p>
                        )}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMethods.ringtonePoints}
                      onChange={isPointsDisabled ? undefined : () => handleMethodToggle("ringtonePoints")}
                      disabled={isPointsDisabled}
                      className={`w-5 h-5 ${isPointsDisabled ? 'text-zinc-600 border-zinc-700 cursor-not-allowed' : 'text-yellow-500 border-gray-600'} rounded focus:ring-yellow-500 focus:ring-offset-0 bg-zinc-700`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
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
        <div className="flex justify-between items-center py-2 border-b border-zinc-700">
          <span className="text-gray-300">Order Total</span>
          <span className="text-white font-semibold">£{originalTotalAmount.toFixed(2)}</span>
        </div>
        
     {/* Cash Discount in Payment Breakdown */}
{appliedDiscount > 0 && discountType === 'cash' && (
  <div className="flex justify-between items-center py-2 border-b border-green-500/20">
    <span className="text-gray-300">Cash Discount</span>
    <span className="text-green-400 font-semibold">-£{appliedDiscount.toFixed(2)}</span>
  </div>
)}

{/* Points Discount in Payment Breakdown */}
{appliedDiscount > 0 && discountType === 'points' && (
  <div className="flex justify-between items-center py-2 border-b border-green-500/20">
    <span className="text-gray-300">Points Discount</span>
    <span className="text-green-400 font-semibold">
      -£{pointsDiscountCashValue.toFixed(2)} ({appliedDiscount.toLocaleString()} pts)
    </span>
  </div>
)}
        
        {/* Wallet Payment */}
        {selectedMethods.walletBalance && (
          <div className="flex justify-between items-center py-2 border-b border-zinc-700">
            <span className="text-gray-300">Wallet Balance</span>
            <span className="text-green-400 font-semibold">-£{walletUsed.toFixed(2)}</span>
          </div>
        )}
        
        {/* Points Payment */}
        {selectedMethods.ringtonePoints && !isPointsDisabled && (
          <div className="flex justify-between items-center py-2 border-b border-zinc-700">
            <span className="text-gray-300">Ringtone Points</span>
            <span className="text-yellow-400 font-semibold">
              -£{finalPointsUsed.toFixed(2)} ({pointsNeeded} pts)
            </span>
          </div>
        )}
        
        {/* Show discounted total before payment methods */}
        <div className="flex justify-between items-center py-2 border-b border-yellow-500/20 bg-yellow-500/5 -mx-2 px-2 rounded">
          <span className="text-gray-300 font-semibold">Discounted Total</span>
          <span className="text-yellow-400 font-bold">£{totalAmount.toFixed(2)}</span>
        </div>
        
        {/* Final remaining amount */}
        <div className="flex justify-between items-center pt-3 mt-3 bg-yellow-500/10 -mx-6 px-6 py-3 rounded-lg">
          <span className="font-bold text-white">Remaining to Pay</span>
          <span className="font-black text-yellow-400 text-xl">
            {finalAmount > 0 ? `£${finalAmount.toFixed(2)}` : 'PAID IN FULL'}
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

      {/* Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-yellow-500/30 text-white max-w-md rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-400 flex items-center gap-2">
              <Tag className="w-6 h-6" />
              Apply Discount Code
            </DialogTitle>
            <DialogDescription className="text-gray-300 pt-2">
              Enter your discount code to save on your purchase.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <Input
              type="text"
              placeholder="Enter discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              className="bg-zinc-800 border-yellow-500/30 text-white placeholder:text-gray-400"
              onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
            />
           <p className="text-sm text-gray-400">
            Cash discounts reduce the total amount. Points discounts are converted to cash (100 points = £1 off).
          </p>
          </div>
          
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDiscountDialog(false);
                setDiscountCode("");
              }}
              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyDiscount}
              disabled={isApplyingDiscount || !discountCode.trim()}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold"
            >
              {isApplyingDiscount ? "Applying..." : "Apply Discount"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top Up Modal */}
      <Dialog open={showTopUpModal} onOpenChange={setShowTopUpModal}>
        <DialogContent className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-yellow-500/30 w-[90vw] text-white max-w-md rounded-2xl shadow-2xl">
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
                  £{(walletBalance + (isPointsDisabled ? 0 : ringtoneBalance)).toFixed(2)}
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
                localStorage.setItem('pendingOrderInfo', JSON.stringify({
                  orderId,
                  orderType,
                  wheelType,
                  totalAmount,
                  finalAmount,
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