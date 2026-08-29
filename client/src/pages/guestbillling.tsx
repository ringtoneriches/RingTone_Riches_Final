import { useParams, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import UnifiedBilling from "@/components/unified-billing";
import BillingChrome from "@/components/billing/BillingChrome";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import { PageWait } from "@/components/brand/BrandWait";
import { Input } from "@/components/ui/input";
import { UserCircle, Shield, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function GuestBilling() {
  const { orderId } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [showGuestForm, setShowGuestForm] = useState(true);
  const [guestForm, setGuestForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [guestFormErrors, setGuestFormErrors] = useState<{ [key: string]: string }>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const { data: orderData, isLoading: orderLoading, error: orderError } = useQuery({
    queryKey: ["/api/guest/order", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await apiRequest(`/api/guest/order/${orderId}`, "GET");
      return res.json();
    },
  });

  const searchParams = new URLSearchParams(window.location.search);
  const urlGameType = searchParams.get("gameType") || "pop";
  const gameType = orderData?.order?.gameType || urlGameType;

  useEffect(() => {
    if (orderError) {
      toast({
        title: "Error",
        description: "Could not find your order. Please try again.",
        variant: "destructive",
      });
    }
  }, [orderError, toast]);

  useEffect(() => {
    if (isAuthenticated && orderId) {
      const gameTypeMap: Record<string, string> = {
        spin: "spin-billing",
        scratch: "scratch-billing",
        pop: "pop-billing",
        plinko: "plinko-billing",
        voltz: "voltz-billing",
        slot: "slot-billing",
        royal: "royal-billing",
      };

      const route = gameTypeMap[gameType] || "checkout";
      setLocation(`/${route}/${orderId}`);
    }
  }, [isAuthenticated, orderId, gameType, setLocation]);

  const validateGuestForm = () => {
    const errors: { [key: string]: string } = {};
    if (!guestForm.firstName.trim()) errors.firstName = "First name is required";
    if (!guestForm.lastName.trim()) errors.lastName = "Last name is required";
    if (!guestForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestForm.email)) {
      errors.email = "Invalid email address";
    }
    if (!guestForm.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (guestForm.phone.replace(/\s/g, "").length < 10) {
      errors.phone = "Please enter a valid phone number";
    }
    setGuestFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  useEffect(() => {
    validateGuestForm();
  }, [guestForm]);

  useEffect(() => {
    if (orderData?.order) {
      const order = orderData.order;
      setGuestForm({
        firstName: order.firstName || "",
        lastName: order.lastName || "",
        email: order.guestEmail || "",
        phone: order.guestPhone || "",
      });
    }
  }, [orderData]);

  const handleGuestFormSubmit = async () => {
    if (!validateGuestForm()) {
      toast({
        title: "Please fill in all fields",
        description: "All guest details are required for checkout.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/guest/update-details/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: guestForm.firstName,
          lastName: guestForm.lastName,
          email: guestForm.email,
          phone: guestForm.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update guest details");
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
        variant: "destructive",
      });
    }
  };

  const fieldClass = (hasError: boolean) =>
    `h-12 rounded-xl bg-white/[0.04] text-white placeholder:text-white/30 ${
      hasError ? "border-[#C8102E]" : "border-white/10"
    }`;

  if (orderLoading) {
    return (
      <PageWait
        className="rr-page bg-[#050505] text-white"
        kicker="Guest · checkout"
        headline="Loading order"
        subtitle="Getting your tickets ready for payment."
      />
    );
  }

  if (!orderData?.order) {
    return (
      <div className="rr-page relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] text-white">
        <DigitalAtmosphere />
        <div className="relative z-10 px-6 text-center">
          <UserCircle className="mx-auto mb-4 h-16 w-16 text-white/20" />
          <h2 className="font-prize text-3xl">Order not found</h2>
          <p className="mt-2 text-white/50">This order does not exist or has expired.</p>
          <button
            onClick={() => setLocation("/")}
            className="rr-cta mt-6 inline-flex px-6 py-2.5 text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="rr-page relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] text-white">
        <DigitalAtmosphere />
        <div className="relative z-10 px-6 text-center">
          <h2 className="font-prize text-3xl">Invalid order</h2>
          <p className="mt-2 text-white/50">Please go back and try again.</p>
        </div>
      </div>
    );
  }

  if (!showGuestForm) {
    return (
      <BillingChrome
        kicker="Guest · checkout"
        title="CHECKOUT"
        subtitle="Pay here to complete your guest order."
        facts={["Guest checkout"]}
        Icon={UserCircle}
      >
        <UnifiedBilling orderId={orderId} orderType={gameType as any} />
      </BillingChrome>
    );
  }

  return (
    <div className="rr-page relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <DigitalAtmosphere />
      <Header />
      <main className="relative z-10 flex-1 pb-12 pt-5 sm:pt-8">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <div className="mb-6 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
              <UserCircle className="h-3.5 w-3.5 text-[#F1D47A]" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
                Guest · checkout
              </span>
            </div>
            <h1 className="font-prize text-4xl text-white sm:text-5xl">YOUR DETAILS</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
              Enter these once so we can confirm your purchase and send any winnings.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0A0A0D]/80 p-6 sm:p-8">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                    First name <span className="text-[#FF263D]">*</span>
                  </label>
                  <Input
                    value={guestForm.firstName}
                    onChange={(e) => setGuestForm({ ...guestForm, firstName: e.target.value })}
                    placeholder="John"
                    className={fieldClass(!!guestFormErrors.firstName)}
                  />
                  {guestFormErrors.firstName && (
                    <p className="mt-1 text-xs text-[#FF263D]">{guestFormErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                    Last name <span className="text-[#FF263D]">*</span>
                  </label>
                  <Input
                    value={guestForm.lastName}
                    onChange={(e) => setGuestForm({ ...guestForm, lastName: e.target.value })}
                    placeholder="Doe"
                    className={fieldClass(!!guestFormErrors.lastName)}
                  />
                  {guestFormErrors.lastName && (
                    <p className="mt-1 text-xs text-[#FF263D]">{guestFormErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                  Email address <span className="text-[#FF263D]">*</span>
                </label>
                <Input
                  value={guestForm.email}
                  onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                  placeholder="john@example.com"
                  type="email"
                  className={fieldClass(!!guestFormErrors.email)}
                />
                {guestFormErrors.email && (
                  <p className="mt-1 text-xs text-[#FF263D]">{guestFormErrors.email}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                  Phone number <span className="text-[#FF263D]">*</span>
                </label>
                <Input
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                  placeholder="+44 1234 567890"
                  className={fieldClass(!!guestFormErrors.phone)}
                />
                {guestFormErrors.phone && (
                  <p className="mt-1 text-xs text-[#FF263D]">{guestFormErrors.phone}</p>
                )}
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-[#F1D47A]/20 bg-[#F1D47A]/5 p-4">
                <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#F1D47A]" />
                <p className="text-sm text-white/55">
                  Your details are used to confirm this purchase and send your winnings. We do not share them.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGuestFormSubmit}
                disabled={!isFormValid}
                className="rr-cta w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue to payment
              </button>

              <p className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                <Lock className="h-3 w-3 text-[#F1D47A]" />
                SSL checkout
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
