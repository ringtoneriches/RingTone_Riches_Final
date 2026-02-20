import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Wallet from "@/pages/wallet";
import PastWinners from "@/pages/past-winners";
import Checkout from "@/pages/checkout";
import Competition from "@/pages/competition";
import PlayGame from "@/pages/play-game";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import spinWheel from "./pages/spinWheel";
import WalletSuccess from "./pages/success";
import CheckoutSuccess from "./pages/competion-success";
import scratchcard from "./pages/scratch-card";
import PaymentCancelled from "./pages/cancelled";
import PaymentFailed from "./pages/failed";
import CheckoutFailed from "./pages/competition-failed";
import CheckoutCancelled from "./pages/competition-cancelled";
import { useEffect, useState } from "react";
import TermsAndConditions from "./pages/terms-and-conditions";
import PlayResponsibly from "./pages/play-responsible";
import PrivacyPolicy from "./pages/privacy-policy";
import ScratchCardPage from "./pages/scratch-card";
import instant from "./pages/instant";
import BeAware from "./pages/beAware";
import SpinBilling from "./pages/spinBilling";
import ScratchBilling from "./pages/scratchBilling";
import ScratchGamePage from "./pages/scratchGamePage";
import SpinGamePage from "./pages/spinGamePage";
import PopGamePage from "./pages/popGamePage";
import PopBilling from "./pages/popBilling";
import RingtonePopPage from "./pages/ringtone-pop";
import AdminLogin from "./pages/admin/login";
import AdminDashboard from "./pages/admin/dashboard";
import AdminCompetitions from "./pages/admin/competitions";
import AdminSpinWheel from "./pages/admin/spin-wheel";
import AdminScratchCard from "./pages/admin/scratch-card";
import AdminUsers from "./pages/admin/users";
import AdminOrders from "./pages/admin/orders";
import AdminSettings from "./pages/admin/settings";
import AdminWithdrawals from "./pages/admin/withdrawals";
import AdminEntries from "./pages/admin/entries";
import AdminPastWinners from "./pages/admin/past-winners";
import AdminMarketing from "./pages/admin/marketing";
import ScrollToTop from "./lib/ScrollToTop ";
import MaintenancePage from "./pages/MaintenancePage";
import UserAuditPage from "./pages/admin/audit";
import AdminTransactions from "./pages/admin/transactions";
import AdminSupport from "./pages/admin/support";
import AdminWellbeing from "./pages/admin/well-being";
import AdminRingtonePop from "./pages/admin/ringtone-pop";
import AdminPopBalloon from "./pages/admin/admin-pop-balloon";
import VerifyEmailPage from "./pages/verify-email";
import AdminSpinWheelSettings from "./pages/admin/AdminSpinWheelSettings";
import Intelligence from "./pages/admin/intelligence";
import RegistrationSourceModal from "./components/RegistrationSourceModal";
import AdminDiscountCodes from "./pages/admin/discount";
import PlinkoBilling from "./pages/plinkoBilling";
import AdminPlinko from "./pages/admin/plinko";
import AdminPlinkoBalloon from "./pages/admin/admin-plinko";
import PlinkoGamePage from "./pages/plinkoGamePage";
import AdminVerifications from "./pages/admin/admin-verification";
import PremiumBalloonPop from "./components/PremiumBalloonPop";
import AdminPrizeTable from "./pages/admin/admin-prize-table";
function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading || !isAuthenticated) return <Landing />;
  return <Home />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes - always available */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/termsAndConditions" component={TermsAndConditions} />
      <Route path="/play-responsible" component={PlayResponsibly} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/be-aware" component={BeAware} />

      {/* Main routes - always registered */}
      <Route path="/" component={HomePage} />
      <Route path="/competition/:id" component={Competition} />
      <Route path="/play/:id" component={PlayGame} />
      <Route path="/winners" component={PastWinners} />

      {/* Game routes - always registered */}
      <Route
        path="/scratch/:competitionId/:orderId"
        component={ScratchGamePage}
      />
      <Route path="/spin/:competitionId/:orderId" component={SpinGamePage} />
        <Route path="/pop/:competitionId/:orderId" component={PopGamePage} />
        <Route path="/plinko/:competitionId/:orderId" component={PlinkoGamePage} />

      {/* Authenticated routes - always registered, auth checked in component */}
      <Route path="/instant" component={instant} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/checkout/:orderId" component={Checkout} />
      <Route path="/spin-wheel" component={spinWheel} />
      <Route path="/scratch-card" component={ScratchCardPage} />
       <Route path="/ringtone-pop" component={RingtonePopPage} />
      <Route path="/wallet/success" component={WalletSuccess} />
      <Route path="/wallet/cancelled" component={PaymentCancelled} />
      <Route path="/wallet/failed" component={PaymentFailed} />
      <Route path="/success/competition" component={CheckoutSuccess} />
      <Route path="/failed" component={CheckoutFailed} />
      <Route path="/cancelled" component={CheckoutCancelled} />
      <Route path="/scratch" component={scratchcard} />
   <Route
  path="/spin-billing/:orderId/:wheelType"
  component={SpinBilling}
/>

      <Route path="/scratch-billing/:orderId" component={ScratchBilling} />
          <Route path="/pop-billing/:orderId" component={PopBilling} />
      <Route path="/plinko-billing/:orderId" component={PlinkoBilling} />
      {/* <Route path="/support" component={Support} /> */}

      {/* Admin routes - always registered, auth checked in component */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/spin-wheel" component={AdminSpinWheel} />
      <Route path="/admin/wheel-2-settings" component={AdminSpinWheelSettings} />
      <Route path="/admin/scratch-card" component={AdminScratchCard} />
      <Route path="/admin/competitions" component={AdminCompetitions} />
      <Route path="/admin/entries" component={AdminEntries} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/withdrawals" component={AdminWithdrawals} />
      <Route path="/admin/past-winners" component={AdminPastWinners} />
      <Route path="/admin/marketing" component={AdminMarketing} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/users/:id" component={UserAuditPage} />
      <Route path="/admin/transactions" component={AdminTransactions} />
      <Route path="/admin/support" component={AdminSupport} />
      <Route path="/admin/well-being" component={AdminWellbeing} />
            <Route path="/admin/ringtone-pop/settings" component={AdminRingtonePop} />
            <Route path="/admin/add-ringtone-pop" component={AdminPopBalloon} />
      <Route path="/admin/users/:id" component={UserAuditPage} />
      <Route path="/admin/intelligence" component={Intelligence} />
      <Route path="/admin/discount" component={AdminDiscountCodes} />
      <Route path="/admin/plinko" component={AdminPlinkoBalloon} />
      <Route path="/admin/ringtone-plinko/settings" component={AdminPlinko} />
      <Route path="/admin/verification" component={AdminVerifications} />
      <Route path="/admin/prize-table/:gameId" component={AdminPrizeTable} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithMaintenance />
    </QueryClientProvider>
  );
}

function AppWithMaintenance() {
  const [location] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [hasCheckedSource, setHasCheckedSource] = useState(false);
  
 const [showBalloonPop, setShowBalloonPop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: maintenanceData, isLoading: maintenanceLoading } = useQuery({
    queryKey: ["/api/maintenance"],
    queryFn: () => fetch("/api/maintenance").then((res) => res.json()),
  });

  // Check if user needs to provide registration source
  const { data: sourceStatus, isLoading: sourceLoading } = useQuery({
    queryKey: ["/api/user/registration-source-status"],
    queryFn: async () => {
      const res = await fetch("/api/user/registration-source-status", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch source status");
      return res.json();
    },
    enabled: !!user && !hasCheckedSource,
    staleTime: 0
  });

   useEffect(() => {
    // Check if user has seen the balloon before
    const hasSeenBalloon = localStorage.getItem('hasSeenBalloonPop');
    
    // Don't show on admin routes
    const isAdminRoute = location.startsWith("/admin");
    const isAuthRoute = ["/login", "/register", "/verify-email", "/forgot-password", "/reset-password"]
      .some(route => location.startsWith(route));
    
    if (!hasSeenBalloon && !isAdminRoute && !isAuthRoute && !maintenanceLoading) {
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        setShowBalloonPop(true);
        setIsLoading(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [location, maintenanceLoading]);


  // Show modal when user logs in and needs to provide source
  useEffect(() => {
    if (sourceStatus?.needsToProvide && !hasCheckedSource && !sourceLoading) {

      const lastAsked = localStorage.getItem(`registration_source_asked_${user.id}`);
    
    // If we never asked OR it's been more than 7 days since last ask
    const shouldShow = !lastAsked || 
      (Date.now() - parseInt(lastAsked) > 7 * 24 * 60 * 60 * 1000);

      // Don't show on admin pages or certain routes
      const excludedRoutes = [
        "/admin",
        "/login",
        "/register",
        "/verify-email",
        "/forgot-password",
        "/reset-password"
      ];
      
      const isExcludedRoute = excludedRoutes.some(route => location.startsWith(route));
    
    if (shouldShow && !isExcludedRoute) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setShowSourceModal(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    }
  }, [sourceStatus, location, sourceLoading, hasCheckedSource]);

  if (maintenanceLoading) return null;

  const isAdminUser = user?.isAdmin === true;
  const isAdminRoute = location.startsWith("/admin");

  // If maintenance ON → only admin can bypass
  if (maintenanceData?.maintenanceMode && !isAdminUser && !isAdminRoute) {
    return <MaintenancePage />;
  }

 const handleBalloonComplete = () => {
    setShowBalloonPop(false);
    // Set localStorage so it never shows again on this browser
    localStorage.setItem('hasSeenBalloonPop', 'true');
  };

  return (
    <TooltipProvider>
      <Toaster />
      <ScrollToTop />
      <div className="pt-20 lg:pt-24"/> 
     <PremiumBalloonPop
        isOpen={showBalloonPop}
        onComplete={handleBalloonComplete}
      />

      <Router />
      
    
      {user && (
        <RegistrationSourceModal
          isOpen={showSourceModal}
          onClose={() => {
            setShowSourceModal(false);
            setHasCheckedSource(true);
          }}
          onComplete={() => {
            setShowSourceModal(false);
            setHasCheckedSource(true);
          }}
        />
      )}
    </TooltipProvider>
  );
}


export default App;
