import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Link, Router, useLocation } from "wouter";
import { Transaction, User, Ticket, Competition } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import {
  DollarSign,
  PoundSterling,
  ShoppingCart,
  Gift,
  Users,
  ArrowUpCircle,
  ArrowDownCircle,
  ExternalLink,
  Filter,
  Copy,
  MapPin,
  CheckCircle,
  Wallet as WalletIcon,
  FileText,
  Award,
  UserCircle,
  Home,
  Sparkles,
  Headphones,
  RefreshCcw,
  ArrowRight,
  X,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderDetailsDialog } from "@/components/order-details-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Support from "./support";
import { navigate } from "wouter/use-browser-location";
import { useNavigation } from "react-day-picker";

const getTransactionIcon = (type: string) => {
  switch (type) {
    case "deposit":
      return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
    case "withdrawal":
      return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
    case "purchase":
      return <ShoppingCart className="h-4 w-4 text-blue-500" />;
    case "prize":
      return <Gift className="h-4 w-4 text-yellow-500" />;
    case "referral":
      return <Users className="h-4 w-4 text-purple-500" />;
    case "referral_bonus":
      return <Gift className="h-4 w-4 text-yellow-500" />;
    case "refund":
      return <RefreshCcw className="h-4 w-4 text-orange-500" />; // New case
    default:
      return <DollarSign className="h-4 w-4 text-gray-500" />;
  }
};

const getTransactionTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    deposit: "bg-green-500/10 text-green-500 border-green-500/20",
    withdrawal: "bg-red-500/10 text-red-500 border-red-500/20",
    purchase: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    prize: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    referral: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    referral_bonus: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    refund: "bg-orange-500/10 text-orange-500 border-orange-500/20", // New case
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[type] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
};

interface ReferralStats {
  totalReferrals: number;
  totalEarned: string;
  referrals: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: Date;
  }>;
}

interface GroupedEntry {
  competition: Competition;
  tickets: Ticket[];
}

interface OrderWithCompetition {
  competitions: {
    title: string;
    imageUrl: string;
    ticketPrice: string;
    type: string;
  };
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
    updatedAt: string;
  };
  tickets?: Ticket[];
  remainingPlays?: number;
}

// Modals for Account Tab
function UpdateProfileModal({ user }: { user: any }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    dateOfBirth: user?.dateOfBirth || "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/auth/user", "PUT", form);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully!" });
      setOpen(false);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.message || "Something went wrong",
      });
    },
  });

  return (
    <>
      <button
        className="w-full text-left px-4 py-2 rounded-lg hover:bg-yellow-500/10 transition-colors text-sm"
        onClick={() => setOpen(true)}
        data-testid="button-update-profile"
      >
        Update Profile
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-yellow-500/20">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">
              Update Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-black/50 border-yellow-500/20"
              />
            </div>
            <div>
              <Label>First Name</Label>
              <Input
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                className="bg-black/50 border-yellow-500/20"
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="bg-black/50 border-yellow-500/20"
              />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={form.dateOfBirth || ""}
                onChange={(e) =>
                  setForm({ ...form, dateOfBirth: e.target.value })
                }
                className="bg-black/50 border-yellow-500/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-400"
            >
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ChangePasswordModal() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/auth/user", "PUT", { password });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password updated successfully!" });
      setPassword("");
      setOpen(false);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.message || "Something went wrong",
      });
    },
  });

  return (
    <>
      <button
        className="w-full text-left px-4 py-2 rounded-lg hover:bg-yellow-500/10 transition-colors text-sm"
        onClick={() => setOpen(true)}
        data-testid="button-change-password"
      >
        Change Password
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-yellow-500/20">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">
              Change Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/50 border-yellow-500/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !password}
              className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-400"
            >
              {mutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function getTotalCashflow(transactions: Transaction[]): string {
  const total = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  return total % 1 === 0 ? total.toFixed() : total.toFixed(2);
}

export default function Wallet() {
  const { toast } = useToast();
  const { data: user, isLoading, isError } = useQuery({
  queryKey: ["/api/auth/user"],
  queryFn: async () => {
    const res = await apiRequest("/api/auth/user", "GET");
    return res.json();
  },
  refetchInterval: 4000,        // 🔥 auto refresh every 4 seconds
  refetchOnWindowFocus: true,   // 🔥 refresh when page is focused
  staleTime: 0,
});

const isAuthenticated = !!user;
  const queryClient = useQueryClient();
  const [topUpAmount, setTopUpAmount] = useState<string>("10");
  const [filterType, setFilterType] = useState<string>("all");
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    postcode: "",
    country: "United Kingdom",
  });
  const [selectedOrder, setSelectedOrder] =
    useState<OrderWithCompetition | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 15;

  // Withdrawal request states
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "",
    accountName: "",
    accountNumber: "",
    sortCode: "",
  });

  const [errors, setErrors] = useState({
  accountNumber: "",
  sortCode: ""
});
  // Load user's existing address when user data is available
  useEffect(() => {
    if (user) {
      setAddressForm({
        street: user.addressStreet || "",
        city: user.addressCity || "",
        postcode: user.addressPostcode || "",
        country: user.addressCountry || "United Kingdom",
      });
    }
  }, [user]);

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
    enabled: isAuthenticated,
  });

  const { data: cashflowTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/user/cashflow-transactions"],
    enabled: isAuthenticated,
  });

 const totalCashflow = getTotalCashflow(cashflowTransactions);


  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ["/api/user/tickets"],
    enabled: isAuthenticated,
  });

  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
    enabled: isAuthenticated,
  });

  const { data: referralCodeData } = useQuery<{ referralCode: string }>({
    queryKey: ["/api/user/referral-code"],
    enabled: isAuthenticated,
  });

  const { data: referralStats } = useQuery<ReferralStats>({
    queryKey: ["/api/user/referral-stats"],
    enabled: isAuthenticated,
  });

  const { data: orders = [] } = useQuery<OrderWithCompetition[]>({
    queryKey: ["/api/user/orders"],
    enabled: isAuthenticated,
  });

  const { data: withdrawalRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/withdrawal-requests/me"],
    enabled: isAuthenticated,
  });

   const { data: supportUnreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/support/unread-count"],
    enabled: isAuthenticated,
    refetchInterval: 5000,
  });


  const filteredTransactions =
    filterType === "all"
      ? transactions
      : transactions.filter((t) => t.type === filterType);

  // RingTone Points transactions
  const pointsTransactions = transactions
    .filter(
      (t) =>
        t.description?.toLowerCase().includes("ringtone") ||
        t.description?.toLowerCase().includes("points"),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
    );

    function formatAmount(transaction: Transaction) {
  const isPoints =
    transaction.description?.toLowerCase().includes("ringtone") ||
    transaction.description?.toLowerCase().includes("points");

  const amount = Math.abs(parseFloat(transaction.amount));

  if (isPoints) {
    return `${amount} pts`;
  }

  return `£${amount.toFixed(2)}`;
}


  const ringtonePoints = user?.ringtonePoints || 0;

  // Group tickets by competition
  const competitionMap = new Map(competitions.map((c) => [c.id, c]));
  const groupMap = new Map<string, GroupedEntry>();

  tickets.forEach((ticket) => {
    const competition = competitionMap.get(ticket.competitionId);
    if (!competition) return;

    const existing = groupMap.get(competition.id);
    if (existing) {
      existing.tickets.push(ticket);
    } else {
      groupMap.set(competition.id, {
        competition,
        tickets: [ticket],
      });
    }
  });

  const groupedEntries = Array.from(groupMap.values()).map((entry) => ({
    ...entry,
    tickets: entry.tickets.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    }),
  }));

  groupedEntries.sort((a, b) => {
    const aTime = a.tickets[0]?.createdAt
      ? new Date(a.tickets[0].createdAt).getTime()
      : 0;
    const bTime = b.tickets[0]?.createdAt
      ? new Date(b.tickets[0].createdAt).getTime()
      : 0;
    return bTime - aTime;
  });

  // Orders pagination
  const incompleteGames = orders.filter(
    (order) =>
      (order.competitions?.type === "spin" ||
        order.competitions?.type === "scratch") &&
      order.orders.status === "completed" &&
      (order.remainingPlays || 0) > 0,
  );

  const completedOrders = orders.filter(
    (order) =>
      !(
        (order.competitions?.type === "spin" ||
          order.competitions?.type === "scratch") &&
        order.orders.status === "completed" &&
        (order.remainingPlays || 0) > 0
      ),
  );

  const totalPages = Math.ceil(completedOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const currentOrders = completedOrders.slice(
    startIndex,
    startIndex + ordersPerPage,
  );

  const referralLink = referralCodeData?.referralCode
    ? `${window.location.origin}/register?ref=${referralCodeData.referralCode}`
    : "";

  const topUpMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("/api/wallet/topup-checkout", "POST", {
        amount,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast({
          title: "Error",
          description: "Failed to get Cashflows checkout URL",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout session",
        variant: "destructive",
      });
    },
  });

 

  const withdrawalRequestMutation = useMutation({
    mutationFn: async (data: {
      amount: string;
      accountName: string;
      accountNumber: string;
      sortCode: string;
    }) => {
      const response = await apiRequest(
        "/api/withdrawal-requests",
        "POST",
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description:
          "Withdrawal request submitted. We'll process it manually within 2-3 business days.",
      });
      setWithdrawalDialogOpen(false);
      setWithdrawalForm({
        amount: "",
        accountName: "",
        accountNumber: "",
        sortCode: "",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/withdrawal-requests/me"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
   onError: async (error: any) => {
  let friendlyMessage = "Failed to submit withdrawal request";

  try {
    const err = await error.response.json();

    if (err?.errors?.length > 0) {
      // Use the Zod message from backend
      friendlyMessage = err.errors[0].message;
    } else if (err?.message) {
      friendlyMessage = err.message;
    }
  } catch {
    // ignore JSON parsing errors
  }

  toast({
    title: "Error",
    description: friendlyMessage,
    variant: "destructive",
  });
},

  });

   // Real-time validation on change
const handleAccountNumberChange = (e) => {
  const value = e.target.value.replace(/\D/g, "");
  setWithdrawalForm({ ...withdrawalForm, accountNumber: value });
  
  // Real-time validation feedback
  if (value && value.length !== 8) {
    setErrors(prev => ({ ...prev, accountNumber: "Account number must be 8 digits" }));
  } else {
    setErrors(prev => ({ ...prev, accountNumber: "" }));
  }
};

const handleSortCodeChange = (e) => {
  const value = e.target.value.replace(/\D/g, "");
  setWithdrawalForm({ ...withdrawalForm, sortCode: value });
  
  if (value && value.length !== 6) {
    setErrors(prev => ({ ...prev, sortCode: "Sort code must be 6 digits" }));
  } else {
    setErrors(prev => ({ ...prev, sortCode: "" }));
  }
};
  const LogoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/auth/logout", "POST");
      return res.json();
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Something went wrong",
      });
    },
  });

  // Get current location for watching URL changes
  const [location] = useLocation();

  // Get tab from URL search params
  const getTabFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    // Map 'ringtone' to 'points' for consistency with header
    if (tab === "ringtone") return "points";
    return tab || "wallet";
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl());

  // Update tab when URL changes (including when clicking header links while on /wallet)
  useEffect(() => {
    const newTab = getTabFromUrl();
    setActiveTab(newTab);
  }, [location]); // Re-run when location changes

  // Handle tab change - update both state and URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL to reflect the tab change
    window.history.pushState({}, "", `/wallet?tab=${value}`);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleTopUp = () => {
    const amountNum = Number(topUpAmount);
    if (amountNum < 0.50) {
      toast({
        title: "Invalid Amount",
        description: "Minimum top-up amount is £0.50",
        variant: "destructive",
      });
      return;
    }
    topUpMutation.mutate(amountNum);
  };

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  // Mutation for saving address
  const saveAddressMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/auth/user", "PUT", {
        addressStreet: addressForm.street,
        addressCity: addressForm.city,
        addressPostcode: addressForm.postcode,
        addressCountry: addressForm.country,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Address saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save address",
        variant: "destructive",
      });
    },
  });

  const handleSaveAddress = () => {
    if (!addressForm.street || !addressForm.city || !addressForm.postcode) {
      toast({
        title: "Invalid Address",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    saveAddressMutation.mutate();
  };

  const handleLogout = (e: React.FormEvent) => {
    e.preventDefault();
    LogoutMutation.mutate();
  };


  const [, setLocation] = useLocation(); 

  // Add this state for pending order banner
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  
  // Add this useEffect to check for pending orders
  useEffect(() => {
    const checkPendingOrder = () => {
      try {
        const saved = localStorage.getItem('pendingOrderInfo');
        if (saved) {
          const orderInfo = JSON.parse(saved);
          const now = Date.now();
          const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
          
          // Check if order is still valid (less than 1 hour old)
          if (now - orderInfo.timestamp < oneHour) {
            setPendingOrder(orderInfo);
          } else {
            // Remove expired order
            localStorage.removeItem('pendingOrderInfo');
          }
        }
      } catch (error) {
        console.error('Error reading pending order:', error);
      }
    };
    
    checkPendingOrder();
  }, [location]); // Re-run when location changes (user navigates)
  
  // Function to clear pending order when user completes it
  const clearPendingOrder = () => {
    localStorage.removeItem('pendingOrderInfo');
    setPendingOrder(null);
  };
  
  // Function to navigate back to the order
  const handleResumeOrder = () => {
    if (!pendingOrder) return;
    
    // Determine the correct route based on order type
    let route = '';
    switch (pendingOrder.orderType) {
      case 'spin':
        route = `/spin-billing/${pendingOrder.orderId}/${pendingOrder.wheelType || 'wheel1'}`;
        break;
      case 'scratch':
        route = `/scratch-billing/${pendingOrder.orderId}`;
        break;
      case 'competition':
      default:
        route = `/checkout/${pendingOrder.orderId}`;
        break;
    }
    
    clearPendingOrder();
    setLocation(route);
  };
  
  // Function to dismiss the banner
  const handleDismissBanner = () => {
    clearPendingOrder();
    toast({
      title: "Reminder",
      description: "You can always find pending orders in the 'Orders' tab",
    });
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center">
        <div
          className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const NotificationBadge = ({ count }: { count?: number }) => {
  const displayCount = count || 0;
  
  if (displayCount <= 0) {
    return null;
  }
  
  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
      {displayCount > 9 ? "9+" : displayCount}
    </span>
  );
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white">
      <Header />

       {/* 🔥 PENDING ORDER BANNER - Shows when user returns from top-up */}
    {pendingOrder && (
      <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/20 border-y border-yellow-500/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-yellow-500/20 p-2 rounded-full">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-bold text-yellow-400 text-lg">
                  Complete Your Order!
                </h3>
                <p className="text-gray-300 text-sm">
                 Topup your wallet . You have a pending order waiting to be completed.
                </p>
                <p className="text-gray-300 text-sm">
                 Or you can complete it later in the <span className="font-bold">'Orders'</span> tab.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleResumeOrder}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold px-6"
                data-testid="button-resume-pending-order"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Complete Order Now
              </Button>
              
              <button
                onClick={handleDismissBanner}
                className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10"
                data-testid="button-dismiss-banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

      <div className="container mx-auto px-4 py-8">
        {/* Premium Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="text-center mb-8">
            <h1
              className="text-5xl font-bold mb-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent"
              data-testid="heading-account"
            >
              MY ACCOUNT
            </h1>
            <div className="flex items-center justify-center gap-3 text-gray-400">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <p className="text-sm">
                Manage your competitions, rewards & settings
              </p>
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </div>
          </div>

          {/* Premium Tabbed Interface */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList
              className="grid w-full h-full grid-cols-4 md:grid-cols-8 gap-2 bg-zinc-900/50 border border-yellow-500/20 p-2 rounded-xl mb-12 relative z-10"
              data-testid="tabs-account"
            >
              <TabsTrigger
                value="wallet"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/50 transition-all text-xs sm:text-sm flex-col sm:flex-row gap-1 py-3"
                data-testid="tab-wallet"
              >
                <WalletIcon className="h-4 w-4" />
                <span>Wallet</span>
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/50 transition-all text-xs sm:text-sm flex-col sm:flex-row gap-1 py-3"
                data-testid="tab-orders"
              >
                <FileText className="h-4 w-4" />
                <span>Orders</span>
              </TabsTrigger>
              <TabsTrigger
                value="entries"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/50 transition-all text-xs sm:text-sm flex-col sm:flex-row gap-1 py-3"
                data-testid="tab-entries"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Entries</span>
              </TabsTrigger>
              <TabsTrigger
                value="points"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/50 transition-all text-xs sm:text-sm flex-col sm:flex-row gap-1 py-3"
                data-testid="tab-points"
              >
                <Award className="h-4 w-4" />
                <span>Points</span>
              </TabsTrigger>
              <TabsTrigger
                value="referral"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/50 transition-all text-xs sm:text-sm flex-col sm:flex-row gap-1 py-3"
                data-testid="tab-referral"
              >
                <Users className="h-4 w-4" />
                <span>Referral</span>
              </TabsTrigger>
              <TabsTrigger
                value="account"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/50 transition-all text-xs sm:text-sm flex-col sm:flex-row gap-1 py-3"
                data-testid="tab-account"
              >
                <UserCircle className="h-4 w-4" />
                <span>Account</span>
              </TabsTrigger>
              <TabsTrigger
                value="address"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/50 transition-all text-xs sm:text-sm flex-col sm:flex-row gap-1 py-3"
                data-testid="tab-address"
              >
                <Home className="h-4 w-4" />
                <span>Address</span>
              </TabsTrigger>
               <TabsTrigger
                value="support"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-yellow-500 data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-500/50 transition-all text-xs sm:text-sm flex-col sm:flex-row gap-1 py-3 relative"
                data-testid="tab-support"
              >
                <Headphones className="h-4 w-4" />
                <span>Support</span>
                <NotificationBadge count={supportUnreadData?.count} />
              </TabsTrigger>
            </TabsList>

            {/* WALLET TAB */}
            <TabsContent
              value="wallet"
              className="space-y-6 pt-12 relative z-0"
              data-testid="content-wallet"
            >
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Wallet Balance Card */}
                <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-yellow-500/30 shadow-xl shadow-yellow-500/10">
              <CardHeader className="border-b border-yellow-500/20 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-0">
              <div className="flex items-center gap-2 text-yellow-400 justify-center sm:justify-start">
                <WalletIcon className="h-6 w-6" />
                <span className="text-xl sm:text-2xl font-medium">Wallet Balance</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-400 justify-center sm:justify-end">
                <span className="text-lg sm:text-xl font-medium">Total Spend=£{totalCashflow}</span>
              </div>
            </CardHeader>

                  <CardContent className="pt-6">
                    <div className="text-center space-y-6">
                      <div>
                        <p className="text-gray-400 text-sm mb-2">
                          Available Balance
                        </p>
                        <p
                          className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent"
                          data-testid="text-balance"
                        >
                          £{parseFloat(user?.balance || "0").toFixed(2)}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <label className="text-sm text-gray-400">
                            Quick Top-Up
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[10, 25, 50, 100].map((amount) => (
                              <button
                                key={amount}
                                onClick={() => setTopUpAmount(String(amount))}
                                className={`py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                                  topUpAmount === String(amount)
                                    ? "bg-gradient-to-r from-yellow-600 to-yellow-500 text-black shadow-lg shadow-yellow-500/50"
                                    : "bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-yellow-500/20"
                                }`}
                                data-testid={`button-amount-${amount}`}
                              >
                                £{amount}
                              </button>
                            ))}
                          </div>
                          <input
                            type="number"
                            min="0.50"
                            max="1000"
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(e.target.value)}
                            className="w-full bg-black/50 border border-yellow-500/30 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            placeholder="Custom amount"
                            data-testid="input-custom-amount"
                          />
                        </div>
                        <button
                          onClick={handleTopUp}
                          disabled={topUpMutation.isPending}
                          className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold py-4 rounded-lg hover:from-yellow-500 hover:to-yellow-400 transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                          data-testid="button-topup"
                        >
                          {topUpMutation.isPending
                            ? "Redirecting..."
                            : "TOP UP NOW"}
                        </button>
                        <button
                          onClick={() => setWithdrawalDialogOpen(true)}
                          className="w-full bg-zinc-800 text-yellow-500 border border-yellow-500/30 font-bold py-4 rounded-lg hover:bg-zinc-700 hover:border-yellow-500/50 transition-all transform hover:scale-105"
                          data-testid="button-request-withdrawal"
                        >
                          REQUEST WITHDRAWAL
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction History */}
                <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-yellow-500/30 shadow-xl shadow-yellow-500/10">
                  <CardHeader className="border-b border-yellow-500/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl text-yellow-400">
                        Transaction History
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <Select
                          value={filterType}
                          onValueChange={setFilterType}
                        >
                          <SelectTrigger
                            className="w-32 bg-black/50 border-yellow-500/30"
                            data-testid="select-transaction-filter"
                          >
                            <SelectValue placeholder="Filter" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-yellow-500/20">
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="deposit">Deposits</SelectItem>
                            <SelectItem value="withdrawal">
                              Withdrawals
                            </SelectItem>
                            <SelectItem value="purchase">Purchases</SelectItem>
                            <SelectItem value="prize">Prizes</SelectItem>
                            <SelectItem value="referral">Referrals</SelectItem>
                            <SelectItem value="referral_bonus">Referrals Bonus</SelectItem>
                            <SelectItem value="refund">Refund</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredTransactions.length === 0 ? (
                        <p
                          className="text-gray-400 text-center py-8"
                          data-testid="text-no-transactions"
                        >
                          {filterType === "all"
                            ? "No transactions yet"
                            : `No ${filterType} transactions`}
                        </p>
                      ) : (
                        filteredTransactions.slice(0, 10).map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-start justify-between gap-3 p-4 bg-black/30 rounded-lg border border-yellow-500/10 hover:border-yellow-500/30 transition-colors"
                            data-testid={`transaction-${transaction.id}`}
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-1">
                                {getTransactionIcon(transaction.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {getTransactionTypeBadge(transaction.type)}
                                </div>
                              <p className="font-medium text-sm text-white">
                                {transaction.description.replace("Spin Wheel wheel2", "The festive spin win")}
                              </p>

                                <p className="text-xs text-gray-400 mt-1">
                                  {format(
                                    new Date(transaction.createdAt!),
                                    "dd MMM yyyy 'at' HH:mm",
                                  )}
                                </p>
                              </div>
                            </div>
                            <div
                       className={`font-bold text-lg whitespace-nowrap ${
                          (transaction.type === "deposit" ||
                          transaction.type === "prize" ||
                          transaction.type === "referral" ||
                          transaction.type === "referral_bonus" ||
                          transaction.type === "refund") 
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {(transaction.type === "deposit" ||
                        transaction.type === "prize" ||
                        transaction.type === "referral" ||
                        transaction.type === "referral_bonus" ||
                        transaction.type === "refund")
                          ? "+"
                          : "-"
                        }
                        {formatAmount(transaction)}
                      </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Withdrawal Requests History */}
              {withdrawalRequests.length > 0 && (
                <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-yellow-500/30 shadow-xl shadow-yellow-500/10">
                  <CardHeader className="border-b border-yellow-500/20">
                    <CardTitle className="text-2xl text-yellow-400">
                      Withdrawal Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {withdrawalRequests.map((request: any) => {
                        const statusColors = {
                          pending:
                            "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                          approved:
                            "bg-green-500/10 text-green-500 border-green-500/20",
                          rejected:
                            "bg-red-500/10 text-red-500 border-red-500/20",
                          processed:
                            "bg-blue-500/10 text-blue-500 border-blue-500/20",
                        };
                        return (
                          <div
                            key={request.id}
                            className="p-4 bg-black/30 rounded-lg border border-yellow-500/10"
                            data-testid={`withdrawal-request-${request.id}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[request.status as keyof typeof statusColors]}`}
                              >
                                {request.status.toUpperCase()}
                              </span>
                              <span className="text-2xl font-bold text-yellow-400">
                                £{parseFloat(request.amount).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 space-y-1">
                              <p>Account: {request.accountName}</p>
                              <p>
                                Sort Code: {request.sortCode} | Account: ****
                                {request.accountNumber.slice(-4)}
                              </p>
                              <p>
                                Requested:{" "}
                                {format(
                                  new Date(request.createdAt),
                                  "dd MMM yyyy 'at' HH:mm",
                                )}
                              </p>
                              {request.adminNotes && (
                                <p className="text-yellow-400 mt-2">
                                  Note: {request.adminNotes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ORDERS TAB */}
            <TabsContent
              value="orders"
              className="space-y-6 pt-12 relative z-0"
              data-testid="content-orders"
            >
              {/* Incomplete Games */}
              {incompleteGames.length > 0 && (
                <Card className="bg-gradient-to-br from-yellow-900/20 via-zinc-900 to-zinc-900 border-yellow-500/40 shadow-xl shadow-yellow-500/20">
                  <CardHeader className="border-b border-yellow-500/30">
                    <CardTitle className="text-2xl text-yellow-400 flex items-center gap-2">
                      <span>🎮</span> GAMES IN PROGRESS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {incompleteGames.map((order) => (
                        <div
                          key={order.orders.id}
                          className="bg-black/50 rounded-lg border border-yellow-500/20 p-4 hover:border-yellow-500/40 transition-all transform hover:scale-105"
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            {order.competitions?.imageUrl && (
                              <img
                                src={order.competitions.imageUrl}
                                alt={order.competitions?.title || "Competition"}
                                className="w-16 h-16 rounded-lg object-cover shadow-lg"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm text-white line-clamp-2">
                                {order.competitions?.title ||
                                  "Unknown Competition"}
                              </h3>
                              <p className="text-xs text-gray-400">
                                {order.competitions?.type === "spin"
                                  ? "Spin Wheel"
                                  : "Scratch Card"}
                              </p>
                            </div>
                          </div>

                          <div className="bg-yellow-500/10 rounded-lg p-3 mb-3 border border-yellow-500/20">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-gray-400">
                                Remaining:
                              </span>
                              <span className="text-xl font-bold text-yellow-400">
                                {order.remainingPlays}/{order.orders.quantity}
                              </span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-full transition-all shadow-lg shadow-yellow-500/50"
                                style={{
                                  width: `${((order.remainingPlays || 0) / order.orders.quantity) * 100}%`,
                                }}
                              />
                            </div>
                          </div>

                          <Link
                            href={
                              order.competitions?.type === "spin"
                                ? `/spin/${order.orders.competitionId}/${order.orders.id}`
                                : `/scratch/${order.orders.competitionId}/${order.orders.id}`
                            }
                            className="block"
                          >
                            <button
                              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50"
                              data-testid={`button-resume-${order.orders.id}`}
                            >
                              Resume Game
                            </button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Past Orders */}
              <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-yellow-500/30 shadow-xl shadow-yellow-500/10">
                <CardHeader className="border-b border-yellow-500/20">
                  <CardTitle className="text-2xl text-yellow-400">
                    Past Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <p
                        className="text-gray-400 text-lg mb-4"
                        data-testid="text-no-orders"
                      >
                        No orders yet
                      </p>
                      <Link href="/">
                        <button className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-6 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-400 transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50">
                          Browse Competitions
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-yellow-500/20">
                              <th className="text-left py-4 px-4 font-semibold text-yellow-400">
                                Order
                              </th>
                              <th className="text-left py-4 px-4 font-semibold text-yellow-400">
                                Date
                              </th>
                              <th className="text-left py-4 px-4 font-semibold text-yellow-400">
                                Status
                              </th>
                              <th className="text-left py-4 px-4 font-semibold text-yellow-400">
                                Total
                              </th>
                              <th className="text-left py-4 px-4 font-semibold text-yellow-400">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentOrders.map((order) => (
                              <tr
                                key={order.orders.id}
                                className="border-b border-yellow-500/10 hover:bg-yellow-500/5 transition-colors"
                              >
                                <td className="py-4 px-4">
                                  <div className="flex items-center space-x-3">
                                    {order.competitions?.imageUrl && (
                                      <img
                                        src={order.competitions.imageUrl}
                                        alt={order.competitions.title}
                                        className="w-12 h-12 rounded-lg object-cover shadow-md"
                                      />
                                    )}
                                    <div>
                                      <p className="font-medium text-white">
                                        #
                                        {order.orders.id
                                          .slice(-8)
                                          .toUpperCase()}
                                      </p>
                                      <p className="text-sm text-gray-400 line-clamp-1">
                                        {order.competitions?.title ||
                                          "Competition"}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-sm text-gray-400">
                                  {new Date(
                                    order.orders.createdAt,
                                  ).toLocaleDateString()}
                                </td>
                                <td className="py-4 px-4">
                                  <span
                                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                      order.orders.status === "completed"
                                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                        : order.orders.status === "pending"
                                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                                    }`}
                                  >
                                    {order.orders.status
                                      .charAt(0)
                                      .toUpperCase() +
                                      order.orders.status.slice(1)}
                                  </span>
                                </td>
                                <td className="py-4 px-4 font-bold text-yellow-400">
                                  £
                                  {parseFloat(order.orders.totalAmount).toFixed(
                                    2,
                                  )}
                                </td>
                                <td className="py-4 px-4">
                                    <button
                                      onClick={() => {
                                        if (order.orders.status === "pending") {
                                          // Check competition type for proper routing
                                          if (order.competitions?.type === "spin") {
                                            setLocation(`/spin-billing/${order.orders.id}/${order.orders.competitionId}`);
                                          } else if (order.competitions?.type === "scratch") {
                                            setLocation(`/scratch-billing/${order.orders.id}`);
                                          } else {
                                            // Normal competition → go to checkout
                                            setLocation(`/checkout/${order.orders.id}`);
                                          }
                                        } else {
                                          // Completed order → open details modal
                                          setSelectedOrder(order);
                                          setDialogOpen(true);
                                        }
                                      }}
                                      className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-bold hover:from-yellow-500 hover:to-yellow-400 transition-all"
                                    >
                                      {order.orders.status === "pending" ? "RESUME" : "VIEW"}
                                    </button>
                                
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-4">
                        {currentOrders.map((order) => (
                          <div
                            key={order.orders.id}
                            className="bg-black/30 rounded-lg border border-yellow-500/20 p-4 space-y-3"
                          >
                            <div className="flex items-start gap-3">
                              {order.competitions?.imageUrl && (
                                <img
                                  src={order.competitions.imageUrl}
                                  alt={order.competitions.title}
                                  className="w-16 h-16 rounded-lg object-cover shadow-md flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-white text-sm">
                                  #{order.orders.id.slice(-8).toUpperCase()}
                                </p>
                                <p className="text-sm text-gray-400 line-clamp-2">
                                  {order.competitions?.title || "Competition"}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-400 text-xs mb-1">
                                  Date
                                </p>
                                <p className="text-white font-medium">
                                  {new Date(
                                    order.orders.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs mb-1">
                                  Total
                                </p>
                                <p className="text-yellow-400 font-bold">
                                  £
                                  {parseFloat(order.orders.totalAmount).toFixed(
                                    2,
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                  order.orders.status === "completed"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : order.orders.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                                }`}
                              >
                                {order.orders.status.charAt(0).toUpperCase() +
                                  order.orders.status.slice(1)}
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setDialogOpen(true);
                                }}
                                className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-bold hover:from-yellow-500 hover:to-yellow-400 transition-all flex-shrink-0"
                                data-testid={`button-view-order-${order.orders.id}`}
                              >
                                VIEW
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {orders.length > ordersPerPage && (
                        <div className="flex justify-center items-center gap-4 mt-6">
                          <button
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg border border-yellow-500/30 hover:bg-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-400">
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-lg border border-yellow-500/30 hover:bg-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ENTRIES TAB */}
            <TabsContent
              value="entries"
              className="space-y-6 pt-12 relative z-0"
              data-testid="content-entries"
            >
              <Card className="bg-gradient-to-br from-yellow-900/10 via-zinc-900 to-zinc-900 border-yellow-500/30 shadow-xl shadow-yellow-500/10">
                <CardContent className="p-8">
                  <div className="text-center space-y-3">
                    <h2 className="text-3xl font-bold text-yellow-400">
                      Your Competition Entries
                    </h2>
                    <div className="flex justify-center items-baseline gap-3">
                      <span
                        className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent"
                        data-testid="text-total-entries"
                      >
                        {tickets.length}
                      </span>
                      <span className="text-2xl text-gray-400">
                        {tickets.length === 1 ? "entry" : "entries"}
                      </span>
                    </div>
                    <p className="text-gray-400">
                      Across {groupedEntries.length}{" "}
                      {groupedEntries.length === 1
                        ? "competition"
                        : "competitions"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {groupedEntries.length === 0 ? (
                  <Card className="bg-zinc-900 border-yellow-500/30">
                    <CardContent className="p-12">
                      <div className="text-center space-y-4">
                        <p className="text-xl text-gray-400">No entries yet</p>
                        <p className="text-sm text-gray-500">
                          Start entering competitions to see your entries here!
                        </p>
                        <Link href="/">
                          <button className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-400 transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50">
                            Browse Competitions
                          </button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  groupedEntries.map((entry, groupIndex) => (
                    <Card
                      key={entry.competition.id}
                      className="bg-zinc-900 border-yellow-500/30 overflow-hidden shadow-xl shadow-yellow-500/10"
                    >
                      <div className="bg-gradient-to-r from-yellow-900/20 to-zinc-900 p-4 border-b border-yellow-500/30">
                        <div className="flex items-start gap-4">
                          {entry.competition.imageUrl && (
                            <img
                              src={entry.competition.imageUrl}
                              alt={entry.competition.title}
                              className="w-20 h-20 object-cover rounded-lg shadow-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-yellow-400 mb-2">
                              {entry.competition.title}
                            </h3>
                            <div className="flex flex-wrap gap-3 text-sm">
                              <span className="flex items-center gap-1">
                                <span className="text-gray-400">Type:</span>
                                <span className="capitalize bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30">
                                  {entry.competition.type === "instant" && "Competition"}
                                </span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="text-gray-400">Entries:</span>
                                <span className="text-yellow-400 font-semibold">
                                  {entry.tickets.length}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h4 className="text-sm font-semibold text-gray-400 mb-3">
                          Your Entry Numbers:
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                          {entry.tickets.map((ticket) => (
                            <div
                              key={ticket.id}
                              className={`px-3 py-2 rounded-lg border text-center font-mono text-sm transition-all hover:scale-105 ${
                                ticket.isWinner
                                  ? "bg-green-500/20 border-green-500 text-green-400 font-bold shadow-lg shadow-green-500/50"
                                  : "bg-black/50 border-yellow-500/20 text-white hover:border-yellow-500/50"
                              }`}
                            >
                              {ticket.ticketNumber}
                              {ticket.isWinner && (
                                <div className="text-xs mt-1">🎉</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* RINGTONE POINTS TAB */}
            <TabsContent
              value="points"
              className="space-y-6 pt-12 relative z-0"
              data-testid="content-points"
            >
              <Card className="bg-gradient-to-br from-yellow-900/20 via-zinc-900 to-zinc-900 border-yellow-500/40 shadow-xl shadow-yellow-500/20">
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-yellow-400">
                      Ringtone Points Balance
                    </h2>
                    <div className="flex justify-center items-baseline gap-3">
                      <span
                        className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent"
                        data-testid="text-points-balance"
                      >
                        {ringtonePoints.toLocaleString()}
                      </span>
                      <span className="text-2xl text-gray-400">points</span>
                    </div>
                    <div className="text-xl text-gray-300">
                      Equivalent Value:{" "}
                      <span className="font-bold text-yellow-400">
                        £{(ringtonePoints / 100).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                      100 points = £1.00 • Use your points to enter competitions
                      or save them up for bigger prizes
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-yellow-500/30 shadow-xl shadow-yellow-500/10">
                <CardHeader className="border-b border-yellow-500/20">
                  <CardTitle className="text-2xl text-yellow-400">
                    Points Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {pointsTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400">
                        No points transactions yet
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Earn points by playing games and entering competitions!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pointsTransactions.map((transaction, index) => {
                        const pointsChange = parseFloat(transaction.amount);
                        const isPositive = pointsChange > 0;

                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-black/30 border border-yellow-500/10 hover:border-yellow-500/30 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-white text-sm">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {format(
                                  new Date(transaction.createdAt!),
                                  "dd/MM/yyyy HH:mm",
                                )}
                              </p>
                            </div>
                            <span
                              className={`text-xl font-bold ${
                                isPositive ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {pointsChange.toLocaleString()} pts
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-yellow-500/20">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-yellow-400 mb-4">
                    How to Earn Ringtone Points
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 text-lg">•</span>
                      <span>
                        Win points by playing Spin Wheel and Scratch Card games
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 text-lg">•</span>
                      <span>Refer friends to earn bonus points</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 text-lg">•</span>
                      <span>Special promotions and bonuses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 text-lg">•</span>
                      <span>
                        100 points = £1.00 when used for competition entries
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* REFERRAL TAB */}
            <TabsContent
              value="referral"
              className="space-y-6 pt-12 relative z-0"
              data-testid="content-referral"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-yellow-500/30 hover:border-yellow-500/50 transition-all shadow-xl shadow-yellow-500/10">
                  <CardHeader className="border-b border-yellow-500/20">
                    <CardTitle className="flex items-center gap-2 text-xl text-yellow-400">
                      <Users className="h-6 w-6" />
                      Total Referrals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p
                      className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent"
                      data-testid="text-total-referrals"
                    >
                      {referralStats?.totalReferrals || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-yellow-500/30 hover:border-yellow-500/50 transition-all shadow-xl shadow-yellow-500/10">
                  <CardHeader className="border-b border-yellow-500/20">
                    <CardTitle className="flex items-center gap-2 text-xl text-yellow-400">
                      <PoundSterling className="h-6 w-6" />
                      Total Earned
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p
                      className="text-5xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent"
                      data-testid="text-total-earned"
                    >
                      £{referralStats?.totalEarned || "0.00"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-yellow-900/20 via-zinc-900 to-zinc-900 border-yellow-500/40 shadow-xl shadow-yellow-500/20">
                <CardHeader className="border-b border-yellow-500/30">
                  <CardTitle className="flex items-center gap-2 text-2xl text-yellow-400">
                    <Gift className="h-6 w-6" />
                    Your Referral Link
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Share this link with friends to earn rewards
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralLink}
                      readOnly
                      className="flex-1 px-4 py-3 bg-black/50 border border-yellow-500/30 rounded-lg text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      data-testid="input-referral-link"
                    />
                    <Button
                      onClick={copyReferralLink}
                      className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-400 shadow-lg shadow-yellow-500/50"
                      data-testid="button-copy-referral"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>

                  <div className="bg-black/50 rounded-lg p-6 border border-yellow-500/20">
                    <h3 className="font-semibold text-yellow-400 mb-4 text-lg">
                      How it works:
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        <span>
                          Share your unique referral link with friends
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        <span>
                          They sign up using your link and make their first
                          entry
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        <span>
                          You earn £2 bonus credit when they complete their
                          first competition entry
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        <span>
                          Your friend gets 100 Ringtone Points as a welcome
                          bonus
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        <span>
                          Unlimited referrals - the more friends, the more you
                          earn!
                        </span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-yellow-500/30 shadow-xl shadow-yellow-500/10">
                <CardHeader className="border-b border-yellow-500/20">
                  <CardTitle className="text-2xl text-yellow-400">
                    Your Referrals
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {referralStats?.totalReferrals === 0
                      ? "You haven't referred anyone yet"
                      : `${referralStats?.totalReferrals} friend${referralStats?.totalReferrals === 1 ? "" : "s"} joined through your link`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {referralStats?.referrals &&
                  referralStats.referrals.length > 0 ? (
                    <div className="space-y-3">
                      {referralStats.referrals.map((referral) => (
                        <div
                          key={referral.id}
                          className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-yellow-500/10 hover:border-yellow-500/30 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-white">
                              {referral.firstName} {referral.lastName}
                            </p>
                            <p className="text-sm text-gray-400">
                              {referral.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">
                              Joined{" "}
                              {format(
                                new Date(referral.createdAt),
                                "dd MMM yyyy",
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">No referrals yet</p>
                      <p className="text-sm text-gray-500">
                        Start sharing your link to earn rewards!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ACCOUNT TAB */}
            <TabsContent
              value="account"
              className="space-y-6 pt-12 relative z-0"
              data-testid="content-account"
            >
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-yellow-500/30 shadow-xl shadow-yellow-500/10">
                    <CardHeader className="border-b border-yellow-500/20">
                      <CardTitle className="text-2xl text-yellow-400">
                        Account Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        <div>
                          <label className="text-gray-400 text-sm font-medium">
                            Email
                          </label>
                          <p
                            className="text-white text-lg mt-1"
                            data-testid="text-email"
                          >
                            {user?.email || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="text-gray-400 text-sm font-medium">
                            Name
                          </label>
                          <p
                            className="text-white text-lg mt-1"
                            data-testid="text-name"
                          >
                            {user?.firstName || user?.lastName
                              ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
                              : "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="text-gray-400 text-sm font-medium">
                            Member Since
                          </label>
                          <p
                            className="text-white text-lg mt-1"
                            data-testid="text-member-since"
                          >
                            {user?.createdAt
                              ? new Date(user.createdAt).toLocaleDateString()
                              : "Unknown"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-yellow-500/30 shadow-xl shadow-yellow-500/10">
                    <CardHeader className="border-b border-yellow-500/20">
                      <CardTitle className="text-2xl text-yellow-400">
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => handleTabChange("orders")}
                          className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-400 transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50"
                          data-testid="button-view-orders"
                        >
                          View Orders
                        </button>
                        <button
                         onClick={() => handleTabChange("wallet")}
                          className="bg-zinc-800 text-white py-3 rounded-lg font-bold hover:bg-zinc-700 transition-all border border-yellow-500/30"
                          data-testid="button-manage-wallet"
                        >
                          Manage Wallet
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-yellow-900/20 via-zinc-900 to-zinc-900 border-yellow-500/40 shadow-xl shadow-yellow-500/20">
                    <CardHeader className="border-b border-yellow-500/30">
                      <CardTitle className="text-xl text-yellow-400">
                        Account Balance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p
                          className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent"
                          data-testid="text-balance"
                        >
                          £{parseFloat(user?.balance || "0").toFixed(2)}
                        </p>
                        <button
                         onClick={() => handleTabChange("wallet")}
                          className="mt-4 w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-6 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-400 transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50"
                          data-testid="button-top-up"
                        >
                          TOP UP
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900 border-yellow-500/30 shadow-xl shadow-yellow-500/10">
                    <CardHeader className="border-b border-yellow-500/20">
                      <CardTitle className="text-xl text-yellow-400">
                        Account Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <UpdateProfileModal user={user} />
                        <ChangePasswordModal />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-sm text-red-400"
                          data-testid="button-logout"
                        >
                          Log out
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* ADDRESS TAB */}
            <TabsContent
              value="address"
              className="space-y-6 pt-12 relative z-0"
              data-testid="content-address"
            >
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-400 font-medium">
                  ℹ️ Prize winners will be contacted directly to arrange
                  delivery. Save your address here for faster processing.
                </p>
              </div>
              <Card className="bg-zinc-900 border-yellow-500/30 shadow-xl shadow-yellow-500/10">
                <CardHeader className="border-b border-yellow-500/20">
                  <CardTitle className="flex items-center gap-2 text-2xl text-yellow-400">
                    <MapPin className="h-6 w-6" />
                    Delivery Address
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your delivery address for prize shipments
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street" className="text-gray-300">
                      Street Address *
                    </Label>
                    <Input
                      id="street"
                      placeholder="123 Main Street"
                      value={addressForm.street}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          street: e.target.value,
                        })
                      }
                      className="bg-black/50 border-yellow-500/30 text-white"
                      data-testid="input-street"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-gray-300">
                        City *
                      </Label>
                      <Input
                        id="city"
                        placeholder="London"
                        value={addressForm.city}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            city: e.target.value,
                          })
                        }
                        className="bg-black/50 border-yellow-500/30 text-white"
                        data-testid="input-city"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postcode" className="text-gray-300">
                        Postcode *
                      </Label>
                      <Input
                        id="postcode"
                        placeholder="SW1A 1AA"
                        value={addressForm.postcode}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            postcode: e.target.value,
                          })
                        }
                        className="bg-black/50 border-yellow-500/30 text-white"
                        data-testid="input-postcode"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-gray-300">
                      Country
                    </Label>
                    <Select
                      value={addressForm.country}
                      onValueChange={(value) =>
                        setAddressForm({ ...addressForm, country: value })
                      }
                    >
                      <SelectTrigger
                        className="bg-black/50 border-yellow-500/30"
                        data-testid="select-country"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-yellow-500/20">
                        <SelectItem value="United Kingdom">
                          United Kingdom
                        </SelectItem>
                        <SelectItem value="Ireland">Ireland</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleSaveAddress}
                      className="w-full md:w-auto bg-gradient-to-r from-yellow-600 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-400"
                      disabled={saveAddressMutation.isPending}
                      data-testid="button-save-address"
                    >
                      {saveAddressMutation.isPending
                        ? "Saving..."
                        : "Save Address"}
                    </Button>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4 mt-6 border border-yellow-500/20">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-yellow-400">
                      <Gift className="h-4 w-4" />
                      Important Information
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-400">
                      <li>
                        • Your delivery address is used for shipping physical
                        prizes
                      </li>
                      <li>
                        • Ensure your address is accurate to avoid delivery
                        issues
                      </li>
                      <li>• We only ship to UK and Ireland addresses</li>
                      <li>• You can update your address at any time</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Support tab */}
            <TabsContent
              value="support"
              className="space-y-6 pt-12 relative z-0"
              data-testid="content-support"
            >
              <Support/>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <OrderDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={selectedOrder}
      />

      {/* Withdrawal Request Dialog */}
      <Dialog
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
      >
        <DialogContent
          className="bg-zinc-900 border-yellow-500/30"
          data-testid="dialog-withdrawal"
        >
          <DialogHeader>
            <DialogTitle className="text-yellow-400">
              Request Withdrawal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (£)</Label>
              <Input
                type="number"
                min="5"
                step="0.01"
                placeholder="Min £5"
                value={withdrawalForm.amount}
                onChange={(e) =>
                  setWithdrawalForm({
                    ...withdrawalForm,
                    amount: e.target.value,
                  })
                }
                className="bg-black/50 border-yellow-500/30 text-white"
                data-testid="input-withdrawal-amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input
                placeholder="John Smith"
                value={withdrawalForm.accountName}
                onChange={(e) =>
                  setWithdrawalForm({
                    ...withdrawalForm,
                    accountName: e.target.value,
                  })
                }
                className="bg-black/50 border-yellow-500/30 text-white"
                data-testid="input-account-name"
              />
            </div>
           <div className="space-y-2">
              <Label>Account Number (8 digits)</Label>
              <Input
                placeholder="12345678"
                maxLength={8}
                value={withdrawalForm.accountNumber}
                onChange={handleAccountNumberChange}
                className={`bg-black/50 border-yellow-500/30 text-white ${
                  errors.accountNumber ? "border-red-500" : ""
                }`}
                data-testid="input-account-number"
              />
              {errors.accountNumber && (
                <p className="text-red-500 text-sm">{errors.accountNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Sort Code (6 digits)</Label>
              <Input
                placeholder="123456"
                maxLength={6}
                value={withdrawalForm.sortCode}
                onChange={handleSortCodeChange}
                className={`bg-black/50 border-yellow-500/30 text-white ${
                  errors.sortCode ? "border-red-500" : ""
                }`}
                data-testid="input-sort-code"
              />
              {errors.sortCode && (
                <p className="text-red-500 text-sm">{errors.sortCode}</p>
              )}
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-gray-300">
              <p className="font-semibold text-yellow-400 mb-1">
                Processing Time
              </p>
              <p>
                Withdrawal requests are processed manually within 24 hours. You’ll receive your funds via bank transfer.
              </p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-gray-300">
              <p className="font-semibold text-yellow-400 mb-1">
                Important
              </p>
              <p>
               Joining bonus credit or promotional site credit cannot be withdrawn. These credits are for gameplay only — only winnings generated through gameplay are eligible for withdrawal.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => withdrawalRequestMutation.mutate(withdrawalForm)}
              disabled={
                withdrawalRequestMutation.isPending ||
                !withdrawalForm.amount ||
                !withdrawalForm.accountName ||
                !withdrawalForm.accountNumber ||
                !withdrawalForm.sortCode
              }
              className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-400"
              data-testid="button-submit-withdrawal"
            >
              {withdrawalRequestMutation.isPending
                ? "Submitting..."
                : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
