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
import AdminRedeemCodes from "./pages/admin/adminRedeem";
import AdminPushMessages from "./pages/admin/push-messages";
import AdminVoltz from "./pages/admin/admin-voltz";
import AdminRingtoneVoltzSettings from "./pages/admin/ringtone-voltz-settings";
import VoltzGamePage from "./pages/voltzGamePage";
import VoltzBilling from "./pages/voltzBilling";
import UserNotifications from "./components/notifications";
import AdminFAQManager from "./pages/admin/faq-manager";
import AdminPrizes from "./pages/admin/admin-prizes";
import AdminCompetitionVideos from "./pages/admin/admin-competition-videos";
import { initSocialBrowserWarning } from "./lib/facebook-browser-check";
import AdminTicketManager from "./pages/admin/AdminTicketManager";
import AdminTicketManagerPage from "./pages/admin/AdminTicketManagerPage";
import AddPastWinnerPage from "./pages/admin/winners";
import AdminAddWinner from "./pages/admin/winners";
import SlotGamePage from "./pages/slotGamePage";
import SlotBilling from "./pages/slotBilling";
import RoyalGamePage from "./pages/royalGamePage";
import RoyalBilling from "./pages/royalBilling";
import AdminSlotMachine from "./pages/admin/slot-machine";
import AdminRoyalReels from "./pages/admin/royal-reels";
import AdminRoyalReelsSettings from "./pages/admin/admin-royal-reels";
import AdminSlotMachineSettings from "./pages/admin/admin-slot-machine";
import AdminBulkPoints from "./pages/admin/admin-bulk-points";

function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
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
      <Route path="/notifications" component={UserNotifications} />

      {/* Game routes - always registered */}
      <Route path="/scratch/:competitionId/:orderId" component={ScratchGamePage} />
      <Route path="/spin/:competitionId/:orderId" component={SpinGamePage} />
      <Route path="/pop/:competitionId/:orderId" component={PopGamePage} />
      <Route path="/plinko/:competitionId/:orderId" component={PlinkoGamePage} />
      <Route path="/voltz/:competitionId/:orderId" component={VoltzGamePage} />
      <Route path="/slot/:competitionId/:orderId" component={SlotGamePage} />
       <Route path="/royal/:competitionId/:orderId" component={RoyalGamePage} />

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
      <Route path="/spin-billing/:orderId/:wheelType" component={SpinBilling} />
      <Route path="/scratch-billing/:orderId" component={ScratchBilling} />
      <Route path="/pop-billing/:orderId" component={PopBilling} />
      <Route path="/plinko-billing/:orderId" component={PlinkoBilling} />
      <Route path="/voltz-billing/:orderId" component={VoltzBilling} />
       <Route path="/slot-billing/:orderId" component={SlotBilling} />
      <Route path="/royal-billing/:orderId" component={RoyalBilling} />

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
      <Route path="/admin/intelligence" component={Intelligence} />
      <Route path="/admin/discount" component={AdminDiscountCodes} />
      <Route path="/admin/plinko" component={AdminPlinkoBalloon} />
      <Route path="/admin/ringtone-plinko/settings" component={AdminPlinko} />
      <Route path="/admin/verification" component={AdminVerifications} />
      <Route path="/admin/redeem" component={AdminRedeemCodes} />
      <Route path="/admin/notification" component={AdminPushMessages} />
      <Route path="/admin/voltz" component={AdminVoltz} />
      <Route path="/admin/ringtone-voltz/settings" component={AdminRingtoneVoltzSettings} />
      <Route path="/admin/faqs" component={AdminFAQManager} />
      <Route path="/admin/prize-table" component={AdminPrizes} />
      <Route path="/admin/promo-video" component={AdminCompetitionVideos} />
      <Route path="/admin/tickets" component={AdminTicketManagerPage} />
      <Route path="/admin/winners" component={AdminAddWinner} />
      <Route path="/admin/slot" component={AdminSlotMachine} />
      <Route path="/admin/royal" component={AdminRoyalReels} />
      {/* <Route path="/admin/royal-reels/settings" component={AdminRoyalReelsSettings} />
      <Route path="/admin/slot-machine/settings" component={AdminSlotMachineSettings} /> */}
      <Route path="/admin/bulk-points" component={AdminBulkPoints } />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    initSocialBrowserWarning();
  }, []);

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

  // Fetch maintenance status with polling every 3 seconds
  const { data: maintenanceData, isLoading: maintenanceLoading } = useQuery({
    queryKey: ["/api/maintenance"],
    queryFn: () => fetch("/api/maintenance").then((res) => res.json()),
    refetchInterval: 3000, // Check every 3 seconds
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true, // Refetch when window gets focus
    refetchOnMount: true, // Refetch when component mounts
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
    enabled: !!user && !hasCheckedSource && !maintenanceData?.maintenanceMode,
    staleTime: 0
  });

  // Handle balloon pop visibility
  useEffect(() => {
    const hasSeenBalloon = localStorage.getItem('hasSeenBalloonPop');
    
    const isAdminRoute = location.startsWith("/admin");
    const isAuthRoute = ["/login", "/register", "/verify-email", "/forgot-password", "/reset-password"]
      .some(route => location.startsWith(route));
    
    // Don't show balloon during maintenance
    if (!hasSeenBalloon && !isAdminRoute && !isAuthRoute && !maintenanceLoading && !maintenanceData?.maintenanceMode) {
      const timer = setTimeout(() => {
        setShowBalloonPop(true);
        setIsLoading(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [location, maintenanceLoading, maintenanceData?.maintenanceMode]);

  // Show registration source modal
  useEffect(() => {
    if (sourceStatus?.needsToProvide && !hasCheckedSource && !sourceLoading && !maintenanceData?.maintenanceMode) {
      const lastAsked = localStorage.getItem(`registration_source_asked_${user?.id}`);
      
      const shouldShow = !lastAsked || 
        (Date.now() - parseInt(lastAsked) > 7 * 24 * 60 * 60 * 1000);

      const excludedRoutes = [
        "/admin",
        "/login",
        "/register",
        "/verify-email",
        "/forgot-password",
        "/reset-password",
        "/admin/login"
      ];
      
      const isExcludedRoute = excludedRoutes.some(route => location.startsWith(route));
      
      if (shouldShow && !isExcludedRoute) {
        const timer = setTimeout(() => {
          setShowSourceModal(true);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [sourceStatus, location, sourceLoading, hasCheckedSource, maintenanceData?.maintenanceMode, user?.id]);

  // Force refetch maintenance status on route change
  useEffect(() => {
    if (!maintenanceLoading) {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
    }
  }, [location]);

  // Show loading state
  if (maintenanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdminUser = user?.isAdmin === true;
  const isAdminRoute = location.startsWith("/admin");
  
  // Public routes that should still be accessible during maintenance
  const publicRoutes = [
    "/login", 
    "/register", 
    "/verify-email", 
    "/forgot-password", 
    "/reset-password",
    "/termsAndConditions",
    "/play-responsible",
    "/privacy-policy",
    "/be-aware",
    "/admin/login" // Allow admin login even during maintenance
  ];
  
  const isPublicRoute = publicRoutes.some(route => location.startsWith(route));

  // If maintenance is ON and user is not admin and not on public route
  if (maintenanceData?.maintenanceMode && !isAdminUser && !isPublicRoute) {
    return (
      <>
        <style>{`
          body { 
            margin: 0; 
            padding: 0; 
            overflow: hidden; 
          }
          #root { 
            height: 100vh; 
          }
        `}</style>
        <MaintenancePage />
      </>
    );
  }

  const handleBalloonComplete = () => {
    setShowBalloonPop(false);
    localStorage.setItem('hasSeenBalloonPop', 'true');
  };

  // Check if we should show maintenance banner for admin
  const showMaintenanceBanner = maintenanceData?.maintenanceMode && isAdminUser;

  return (
    <TooltipProvider>
      <Toaster />
      <ScrollToTop />
      
      {/* Maintenance banner for admin users */}
      {showMaintenanceBanner && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-[100] font-bold text-sm">
          ⚠️ MAINTENANCE MODE ACTIVE - Site is not visible to regular users ⚠️
        </div>
      )}
      
      {/* Adjust top padding based on maintenance banner */}
      <div className={showMaintenanceBanner ? "pt-20 lg:pt-28" : "pt-20 lg:pt-24"}/>
      
      {/* Only show balloon pop when not in maintenance */}
      {!maintenanceData?.maintenanceMode && (
        <PremiumBalloonPop
          isOpen={showBalloonPop}
          onComplete={handleBalloonComplete}
        />
      )}

      <Router />
      
      {/* Only show registration source modal when not in maintenance */}
      {user && !maintenanceData?.maintenanceMode && (
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