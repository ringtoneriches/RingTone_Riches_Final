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
import { useEffect } from "react";
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

      {/* Authenticated routes - always registered, auth checked in component */}
      <Route path="/instant" component={instant} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/checkout/:orderId" component={Checkout} />
      <Route path="/spin-wheel" component={spinWheel} />
      <Route path="/scratch-card" component={ScratchCardPage} />
      <Route path="/wallet/success" component={WalletSuccess} />
      <Route path="/wallet/cancelled" component={PaymentCancelled} />
      <Route path="/wallet/failed" component={PaymentFailed} />
      <Route path="/success/competition" component={CheckoutSuccess} />
      <Route path="/failed" component={CheckoutFailed} />
      <Route path="/cancelled" component={CheckoutCancelled} />
      <Route path="/scratch" component={scratchcard} />
      <Route path="/spin-billing/:orderId" component={SpinBilling} />
      <Route path="/scratch-billing/:orderId" component={ScratchBilling} />

      {/* Admin routes - always registered, auth checked in component */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/spin-wheel" component={AdminSpinWheel} />
      <Route path="/admin/scratch-card" component={AdminScratchCard} />
      <Route path="/admin/competitions" component={AdminCompetitions} />
      <Route path="/admin/entries" component={AdminEntries} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/withdrawals" component={AdminWithdrawals} />
      <Route path="/admin/past-winners" component={AdminPastWinners} />
      <Route path="/admin/marketing" component={AdminMarketing} />
      <Route path="/admin/settings" component={AdminSettings} />

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

  // Fetch maintenance status
  const { data: maintenanceData, isLoading } = useQuery({
    queryKey: ["/api/maintenance"],
    queryFn: () => fetch("/api/maintenance").then((res) => res.json()),
     refetchInterval: 10000,
  });

  const isAdminRoute = location.startsWith("/admin");

  if (isLoading) return null;

  if (maintenanceData?.maintenanceMode && !isAdminRoute) {
    return <MaintenancePage />;
  }

  return (
    <TooltipProvider>
      <Toaster />
      <ScrollToTop />
      <Router />
    </TooltipProvider>
  );
}

export default App;
