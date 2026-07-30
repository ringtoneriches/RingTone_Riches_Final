import { useParams, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import UnifiedBilling from "@/components/unified-billing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserCircle, Shield, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function GuestBilling() {
  const { orderId } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [showGuestForm, setShowGuestForm] = useState(true);
  const [guestForm, setGuestForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [guestFormErrors, setGuestFormErrors] = useState<{[key: string]: string}>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // FETCH ORDER DATA FIRST - this is critical!
  const { data: orderData, isLoading: orderLoading, error: orderError } = useQuery({
    queryKey: ["/api/guest/order", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await apiRequest(`/api/guest/order/${orderId}`, "GET");
      return res.json();
    },
  });

  // Get gameType from order data OR URL params
  const searchParams = new URLSearchParams(window.location.search);
  const urlGameType = searchParams.get('gameType') || 'pop';
  const gameType = orderData?.order?.gameType || urlGameType;

  // If order fetch fails, show error
  useEffect(() => {
    if (orderError) {
      toast({
        title: "Error",
        description: "Could not find your order. Please try again.",
        variant: "destructive",
      });
    }
  }, [orderError, toast]);

  // If user is authenticated, redirect to appropriate billing
  useEffect(() => {
    if (isAuthenticated && orderId) {
      const gameTypeMap: Record<string, string> = {
        spin: 'spin-billing',
        scratch: 'scratch-billing',
        pop: 'pop-billing',
        plinko: 'plinko-billing',
        voltz: 'voltz-billing',
        slot: 'slot-billing',
        royal: 'royal-billing',
      };
      
      const route = gameTypeMap[gameType] || 'checkout';
      setLocation(`/${route}/${orderId}`);
    }
  }, [isAuthenticated, orderId, gameType, setLocation]);

  // Validate guest form
  const validateGuestForm = () => {
    const errors: {[key: string]: string} = {};
    if (!guestForm.firstName.trim()) errors.firstName = "First name is required";
    if (!guestForm.lastName.trim()) errors.lastName = "Last name is required";
    if (!guestForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestForm.email)) {
      errors.email = "Invalid email address";
    }
    if (!guestForm.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (guestForm.phone.replace(/\s/g, '').length < 10) {
      errors.phone = "Please enter a valid phone number";
    }
    setGuestFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  // Update validation on form change
  useEffect(() => {
    validateGuestForm();
  }, [guestForm]);

  // Handle form submission - update order with guest details then proceed
  const handleGuestFormSubmit = async () => {
    if (!validateGuestForm()) {
      toast({
        title: "Please fill in all fields",
        description: "All guest details are required for checkout.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/guest/update-details/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: guestForm.firstName,
          lastName: guestForm.lastName,
          email: guestForm.email,
          phone: guestForm.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update guest details');
      }

      setShowGuestForm(false);
      
      toast({
        title: "Details Saved!",
        description: "Proceed to payment.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save details. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (orderLoading) {
    return (
      <div className="min-h-screen bg-[#0a0800] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FFC300] animate-spin" />
        <p className="text-gray-400 ml-3">Loading order...</p>
      </div>
    );
  }

  // Check if order exists
  if (!orderData?.order) {
    return (
      <div className="min-h-screen bg-[#0a0800] flex items-center justify-center">
        <div className="text-white text-center">
          <UserCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="text-gray-400">The order you're looking for doesn't exist or has expired.</p>
          <button
            onClick={() => setLocation("/")}
            className="mt-4 bg-[#FFC300] text-black px-6 py-2 rounded-lg font-bold hover:bg-[#FF8C00] transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-[#0a0800] flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Invalid Order</h2>
          <p className="text-gray-400">Please go back and try again.</p>
        </div>
      </div>
    );
  }

  // Pre-fill guest form from order data if available
  useEffect(() => {
    if (orderData?.order) {
      const order = orderData.order;
      setGuestForm({
        firstName: order.firstName || '',
        lastName: order.lastName || '',
        email: order.guestEmail || '',
        phone: order.guestPhone || '',
      });
    }
  }, [orderData]);

  return (
    <div className="min-h-screen bg-[#0a0800]">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {showGuestForm ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#0e0a02] border border-[rgba(255,185,0,0.2)] rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-2">
                <UserCircle className="w-6 h-6 text-[#FFC300]" />
                <h2 className="text-xl font-bold text-white">Guest Checkout</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6">Please enter your details to continue with payment</p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400 block mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={guestForm.firstName}
                      onChange={(e) => setGuestForm({ ...guestForm, firstName: e.target.value })}
                      placeholder="John"
                      className={`bg-[rgba(255,255,255,0.05)] border ${guestFormErrors.firstName ? 'border-red-500' : 'border-[rgba(255,185,0,0.2)]'} text-white rounded-xl py-3`}
                    />
                    {guestFormErrors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{guestFormErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400 block mb-1.5">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={guestForm.lastName}
                      onChange={(e) => setGuestForm({ ...guestForm, lastName: e.target.value })}
                      placeholder="Doe"
                      className={`bg-[rgba(255,255,255,0.05)] border ${guestFormErrors.lastName ? 'border-red-500' : 'border-[rgba(255,185,0,0.2)]'} text-white rounded-xl py-3`}
                    />
                    {guestFormErrors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{guestFormErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={guestForm.email}
                    onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                    placeholder="john@example.com"
                    type="email"
                    className={`bg-[rgba(255,255,255,0.05)] border ${guestFormErrors.email ? 'border-red-500' : 'border-[rgba(255,185,0,0.2)]'} text-white rounded-xl py-3`}
                  />
                  {guestFormErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{guestFormErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                    placeholder="+44 1234 567890"
                    className={`bg-[rgba(255,255,255,0.05)] border ${guestFormErrors.phone ? 'border-red-500' : 'border-[rgba(255,185,0,0.2)]'} text-white rounded-xl py-3`}
                  />
                  {guestFormErrors.phone && (
                    <p className="text-red-500 text-xs mt-1">{guestFormErrors.phone}</p>
                  )}
                </div>

                <div className="bg-[rgba(0,207,255,0.06)] border border-[rgba(0,207,255,0.15)] rounded-xl p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-400">
                    Your details are safe and will be used to confirm your purchase and send your winnings.
                  </p>
                </div>

                <Button
                  onClick={handleGuestFormSubmit}
                  disabled={!isFormValid}
                  className="w-full bg-gradient-to-r from-[#FFC300] to-[#FF8C00] text-black font-bold py-4 rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                  Continue to Payment
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <UnifiedBilling
            orderId={orderId} 
            orderType={gameType as any} 
            isGuest={true}
            guestData={guestForm}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}