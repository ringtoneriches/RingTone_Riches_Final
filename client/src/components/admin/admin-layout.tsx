import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Trophy,
  Users,
  ShoppingCart,
  Settings,
  Menu,
  X,
  CircleDot,
  CreditCard,
  ArrowDownCircle,
  Ticket,
  Award,
  Mail,
  Euro,
  MessageSquare,
  Heart,
  Sparkles,
  Brain,
  TicketIcon,
  ChevronDown,
  Target,
  AlertTriangle,
  Check,
  Lock,
  Unlock,
  FileDigit,
  Send,
  Zap,
  MailQuestion,
  Video,
  TicketCheck,
  Gift,
  Star,
  Hash,
  ListOrdered,
  ExternalLink,
  LogOut,
  TicketPercent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import BrandWait from "@/components/brand/BrandWait";
import BrandLogo from "@/components/layout/BrandLogo";
import { User } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "./admin-theme.css";

// Grouped sidebar items
const sidebarGroups = [
  {
    name: "Games",
    icon: null,
    items: [
      { name: "Spin Wheel", path: "/admin/spin-wheel", icon: CircleDot },
      { name: "Scratch Card", path: "/admin/scratch-card", icon: CreditCard },
      { name: "Ringtone Pop", path: "/admin/add-ringtone-pop", icon: Sparkles },
      { name: "Ringtone Plinko", path: "/admin/plinko", icon: Target },
      { name: "Ringtone Voltz", path: "/admin/voltz", icon: Zap },
      { name: "Ringtone Slot", path: "/admin/slot", icon: Zap },
    ],
    protected: true,
  },
  {
    name: "Competitions",
    icon: null,
    items: [
      { name: "Competitions", path: "/admin/competitions", icon: Trophy },
      { name: "Featured slider", path: "/admin/featured", icon: Star },
      { name: "Listing order", path: "/admin/listing-order", icon: ListOrdered },
      { name: "Card quantity", path: "/admin/card-quantity", icon: Hash },
      { name: "Entries", path: "/admin/entries", icon: Ticket },
      { name: "Winners", path: "/admin/winners", icon: Trophy },
    ],
  },
  {
    name: "Marketing",
    icon: null,
    items: [
      { name: "Marketing", path: "/admin/marketing", icon: Mail },
      { name: "Discounts", path: "/admin/discount", icon: TicketIcon },
      { name: "Flash Sales", path: "/admin/flash-sales", icon: TicketPercent },
      { name: "Redeem Code", path: "/admin/redeem", icon: FileDigit },
      { name: "Intelligence", path: "/admin/intelligence", icon: Brain },
      { name: "Notification", path: "/admin/notification", icon: Send },
    ],
  },
  {
    name: "Personalisation",
    icon: null,
    items: [
      { name: "Faq", path: "/admin/faqs", icon: MailQuestion },
    ],
  },
  {
    name: "Tools",
    icon: null,
    items: [
      { name: "Tickets", path: "/admin/tickets", icon: TicketCheck },
      { name: "Bulk Add Points", path: "/admin/bulk-points", icon: Gift },
      { name: "Past Winners", path: "/admin/past-winners", icon: Award },
      { name: "Promo Video", path: "/admin/promo-video", icon: Video },
      { name: "Prize Table", path: "/admin/prize-table", icon: Award },
      { name: "Instant Pool", path: "/admin/instant-pool", icon: Sparkles },
      { name: "Users", path: "/admin/users", icon: Users, protected: true },
      { name: "Transactions", path: "/admin/transactions", icon: Euro },
      { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
      { name: "Support", path: "/admin/support", icon: MessageSquare, hasNotification: true, notificationType: "support" },
      { name: "Withdrawals", path: "/admin/withdrawals", icon: ArrowDownCircle, hasNotification: true, notificationType: "withdrawals" },
      { name: "Verification", path: "/admin/verification", icon: Check, hasNotification: true, notificationType: "verification" },
      { name: "Well-being", path: "/admin/well-being", icon: Heart },
      { name: "Settings", path: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth() as { user: User | null; isLoading: boolean };
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [unlockingItem, setUnlockingItem] = useState<{ type: 'group' | 'item', name: string, path?: string } | null>(null);
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem("adminSidebarGroups");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const { toast } = useToast();

  const { data: stepUpStatus, refetch: refetchStepUp } = useQuery({
    queryKey: ["/api/admin/step-up/status"],
    enabled: Boolean(user?.isAdmin),
    refetchInterval: 60_000,
  });

  const gamesUnlocked = stepUpStatus?.games === true;
  const usersUnlocked = stepUpStatus?.users === true;

  const stepUpMutation = useMutation({
    mutationFn: async ({ pin, scope }: { pin: string; scope: "games" | "users" }) => {
      const res = await apiRequest("/api/admin/step-up", "POST", { pin, scope });
      return res.json();
    },
    onSuccess: async (_, variables) => {
      await refetchStepUp();
      const targetName = variables.scope === "games" ? "Games tab" : "Users access";

      if (variables.scope === "games") {
        setOpenGroups((prev) => ({ ...prev, Games: true }));
      } else if (variables.scope === "users") {
        setLocation("/admin/users");
        setSidebarOpen(false);
      }

      toast({
        title: "Access Granted",
        description: `${targetName} unlocked for 30 minutes.`,
        duration: 3000,
      });
      setShowPinDialog(false);
      setPinInput("");
      setUnlockingItem(null);
      setPinError("");
    },
    onError: (error: any) => {
      const message = String(error?.message || "");
      if (message.includes("503")) {
        setPinError("Step-up PIN is not configured on the server.");
      } else if (message.includes("429")) {
        setPinError("Too many attempts. Please wait and try again.");
      } else {
        setPinError("Incorrect PIN. Please try again.");
      }
      setPinInput("");
    },
  });

  const lockStepUpMutation = useMutation({
    mutationFn: async (scope: "games" | "users" | "all") => {
      const res = await apiRequest("/api/admin/step-up/lock", "POST", { scope });
      return res.json();
    },
    onSuccess: async () => {
      await refetchStepUp();
    },
  });

  const { data: supportUnreadData } = useQuery({
    queryKey: ["/api/admin/support/unread-count"],
    refetchInterval: 1000,
  });
  const { data: withdrawalUnreadData } = useQuery({
    queryKey: ["/api/admin/withdrawals/unread-count"],
    refetchInterval: 1000,
  });
  const { data: verificationUnreadData } = useQuery({
    queryKey: ["/api/admin/verification/unread-count"],
    refetchInterval: 1000,
  });

  const { data: maintenanceData, refetch: refetchMaintenance } = useQuery({
    queryKey: ["/api/maintenance"],
    queryFn: () => fetch("/api/maintenance").then((res) => res.json()),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/auth/logout", "POST");
      return res.json();
    },
    onSuccess: () => {
      localStorage.removeItem("adminUnlockedGroups");
      localStorage.removeItem("adminUnlockedItems");
      localStorage.removeItem("adminUnlockTimers");
      window.location.href = "/";
    },
  });

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      setLocation("/admin/login");
    }
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    localStorage.setItem("adminSidebarGroups", JSON.stringify(openGroups));
  }, [openGroups]);

  // Auto-open group if active item is inside
  useEffect(() => {
    setOpenGroups(prev => {
      const newState = { ...prev };
      sidebarGroups.forEach(group => {
        const active = group.items.some(item => location === item.path);
        if (active) newState[group.name] = true;
      });
      return newState;
    });
  }, [location]);

// In your AdminLayout component, update the mutations
const enableMaintenance = useMutation({
  mutationFn: async () => {
    const res = await apiRequest("/api/admin/maintenance/on", "POST");
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to enable maintenance mode");
    }
    return res.json();
  },
  onSuccess: async () => {
    toast({
      title: "Maintenance Enabled",
      description: "The site is now in maintenance mode.",
    });
    await refetchMaintenance();
    setShowMaintenanceDialog(false);
  },
  onError: (error: Error) => {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  },
});

const disableMaintenance = useMutation({
  mutationFn: async () => {
    const res = await apiRequest("/api/admin/maintenance/off", "POST");
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to disable maintenance mode");
    }
    return res.json();
  },
  onSuccess: async () => {
    toast({
      title: "Maintenance Disabled",
      description: "The site is live again.",
    });
    await refetchMaintenance();
  },
  onError: (error: Error) => {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  },
});

  const handleEnableMaintenance = () => {
    setShowMaintenanceDialog(true);
  };

  const confirmEnableMaintenance = () => {
    enableMaintenance.mutate();
  };

  const handleGroupClick = (groupName: string) => {
    const group = sidebarGroups.find(g => g.name === groupName);

    if (group?.protected && !gamesUnlocked) {
      setUnlockingItem({ type: 'group', name: groupName });
      setPinInput("");
      setPinError("");
      setShowPinDialog(true);
    } else {
      setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    }
  };

  const handleItemClick = (itemName: string, itemPath: string, isProtected?: boolean) => {
    if (isProtected && !usersUnlocked) {
      setUnlockingItem({ type: 'item', name: itemName, path: itemPath });
      setPinInput("");
      setPinError("");
      setShowPinDialog(true);
      return;
    }

    setLocation(itemPath);
    setSidebarOpen(false);
  };

  const verifyPin = () => {
    if (!unlockingItem || stepUpMutation.isPending) return;

    let scope: "games" | "users" | null = null;
    if (unlockingItem.type === "group" && unlockingItem.name === "Games") {
      scope = "games";
    } else if (unlockingItem.type === "item" && unlockingItem.name === "Users") {
      scope = "users";
    }

    if (!scope) {
      setPinError("Unknown protected section.");
      return;
    }

    if (!pinInput.trim()) {
      setPinError("Enter your PIN.");
      return;
    }

    stepUpMutation.mutate({ pin: pinInput.trim(), scope });
  };

  const handleManualLock = (type: 'group' | 'item', identifier: string) => {
    if (type === 'group') {
      lockStepUpMutation.mutate("games", {
        onSuccess: () => {
          toast({
            title: "Locked",
            description: "Games tab has been re-locked.",
          });
        },
      });
    } else if (type === 'item') {
      lockStepUpMutation.mutate("users", {
        onSuccess: () => {
          toast({
            title: "Locked",
            description: "Users access has been re-locked.",
          });
        },
      });
    }

    if (location === identifier) {
      setLocation("/admin");
    }
  };

  const handlePinDialogOpenChange = (open: boolean) => {
    if (!open) {
      setPinInput("");
      setPinError("");
      setUnlockingItem(null);
    }
    setShowPinDialog(open);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      verifyPin();
    }
  };

  const hasToolsNotifications = () => {
    const supportCount = supportUnreadData?.count ?? 0;
    const withdrawalCount = withdrawalUnreadData?.count ?? 0;
    const verificationCount = verificationUnreadData?.count ?? 0;
    return supportCount > 0 || withdrawalCount > 0 || verificationCount > 0;
  };

  if (isLoading) {
    return (
      <BrandWait
        mode="page"
        kicker="Admin"
        headline="Loading admin"
        subtitle="Checking your access."
      />
    );
  }
  if (!user || !user.isAdmin) return null;

  const activeGroup = sidebarGroups.find((group) => group.items.some((item) => item.path === location));
  const activeItem = activeGroup?.items.find((item) => item.path === location);
  // Routes outside the sidebar (e.g. /admin/ringtone-plinko/settings) get a title from the path, minus ids.
  const pathTitle = location
    .replace(/^\/admin\/?/, "")
    .split("/")
    .filter((segment) => segment && !/^[0-9a-f-]{8,}$/i.test(segment))
    .join(" ")
    .replace(/-/g, " ");
  const pageTitle = location === "/admin" ? "Dashboard" : activeItem?.name ?? (pathTitle || "Admin panel");
  const adminName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Admin";

  return (
    <div className="rr-admin-shell fixed inset-0 flex overflow-hidden">
      <div className="rr-admin-backdrop" aria-hidden />

      {/* Sidebar - independent scroll */}
      <aside
        className={`rr-admin-sidebar fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col transition-transform duration-300 lg:relative lg:z-10 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="rr-admin-brand">
          <BrandLogo force="night" className="h-10 w-auto" />
          <button
            type="button"
            className="rr-admin-icon-btn lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="rr-admin-brand-tag">
          <span className="rr-admin-live-dot" aria-hidden />
          Control room
        </div>

        <nav className="rr-admin-nav flex-1 overflow-y-auto px-3 pb-4">
          <Link href="/admin">
            <div className={`rr-admin-link ${location === "/admin" ? "is-active" : ""}`}>
              <span className="rr-admin-link-icon">
                <LayoutDashboard className="h-4 w-4" />
              </span>
              <span className="truncate">Dashboard</span>
            </div>
          </Link>

          {sidebarGroups.map(group => {
            const isGroupUnlocked = group.name === "Games" ? gamesUnlocked : true;
            const isGroupProtected = group.protected;
            const showToolsNotification = group.name === "Tools" && hasToolsNotifications();
            const isOpen = openGroups[group.name] && (isGroupUnlocked || !isGroupProtected);

            return (
              <div key={group.name} className="pt-4">
                <button
                  type="button"
                  className={`rr-admin-group ${showToolsNotification ? "has-alert" : ""} ${isOpen ? "is-open" : ""}`}
                  onClick={() => handleGroupClick(group.name)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {isGroupProtected && !isGroupUnlocked && (
                      <Lock className="h-3 w-3 shrink-0 text-[#F1D47A]" />
                    )}
                    {isGroupProtected && isGroupUnlocked && (
                      <Unlock className="h-3 w-3 shrink-0 text-emerald-400" />
                    )}
                    <span className="truncate">{group.name}</span>
                    {showToolsNotification && (
                      <span className="relative ml-1 inline-flex h-2 w-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF263D] opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF263D]"></span>
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {isGroupProtected && isGroupUnlocked && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rr-admin-lock-btn h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleManualLock('group', group.name);
                        }}
                        title="Lock this tab"
                      >
                        <Lock className="h-3 w-3" />
                      </Button>
                    )}
                    {isGroupProtected && !isGroupUnlocked && (
                      <span className="rr-admin-locked-tag">Locked</span>
                    )}
                    <ChevronDown className="rr-admin-group-chevron h-3.5 w-3.5" />
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-1.5 space-y-0.5">
                    {group.items.map(item => {
                      const Icon = item.icon;
                      let unreadCount = 0;
                      if (item.notificationType === "support") unreadCount = supportUnreadData?.count ?? 0;
                      if (item.notificationType === "withdrawals") unreadCount = withdrawalUnreadData?.count ?? 0;
                      if (item.notificationType === "verification") unreadCount = verificationUnreadData?.count ?? 0;

                      const isItemUnlocked = item.path === "/admin/users" ? usersUnlocked : true;
                      const isItemProtected = item.protected;
                      const canAccess = isItemUnlocked || !isItemProtected;

                      return (
                        <div
                          key={item.path}
                          className={`rr-admin-link ${location === item.path ? "is-active" : ""} ${!canAccess ? "is-locked" : ""}`}
                          onClick={() => handleItemClick(item.name, item.path, isItemProtected)}
                        >
                          <span className="rr-admin-link-icon">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="truncate">{item.name}</span>
                          {isItemProtected && !isItemUnlocked && (
                            <Lock className="h-3 w-3 shrink-0 text-[#F1D47A]" />
                          )}
                          {isItemProtected && isItemUnlocked && (
                            <Unlock className="h-3 w-3 shrink-0 text-emerald-400" />
                          )}
                          <span className="ml-auto flex items-center gap-2">
                            {unreadCount > 0 && (
                              <span className="rr-admin-count">
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </span>
                            )}
                            {isItemProtected && isItemUnlocked && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rr-admin-lock-btn h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleManualLock('item', item.path);
                                }}
                                title="Lock this access"
                              >
                                <Lock className="h-3 w-3" />
                              </Button>
                            )}
                            {isItemProtected && !isItemUnlocked && (
                              <span className="rr-admin-locked-tag">Locked</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="rr-admin-sidebar-foot space-y-2 p-3">
          <div className="rr-admin-identity">
            <span className="rr-admin-avatar">{adminName.charAt(0).toUpperCase()}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#FFF8EE]">{adminName}</span>
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#F1D47A]/80">
                Administrator
              </span>
            </span>
          </div>

          {(gamesUnlocked || usersUnlocked) && (
            <Button
              variant="ghost"
              className="w-full text-xs"
              onClick={() => {
                lockStepUpMutation.mutate("all", {
                  onSuccess: () => {
                    toast({
                      title: "All Tabs Locked",
                      description: "All unlocked sections have been re-locked.",
                    });
                  },
                });
              }}
              disabled={lockStepUpMutation.isPending}
            >
              <Lock className="w-3 h-3 mr-2" />
              Lock All Protected Tabs
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => logoutMutation.mutate()}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area - scrolls independently */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="rr-admin-topbar relative shrink-0">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rr-admin-icon-btn shrink-0 lg:hidden"
              data-testid="button-menu"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <p className="rr-admin-crumb min-w-0 flex-1 truncate">
              Admin
              {activeGroup && (
                <>
                  <span className="rr-admin-crumb-sep">/</span>
                  {activeGroup.name}
                </>
              )}
              <span className="rr-admin-crumb-sep">/</span>
              <span className="text-[#FFF8EE]">{pageTitle}</span>
            </p>

            {/* Maintenance status — clear indicator + always-visible action button */}
            <div className={`rr-admin-status shrink-0 ${maintenanceData?.maintenanceMode ? "is-maintenance" : ""}`}>
              {maintenanceData?.maintenanceMode ? (
                <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#FF6B7A] sm:text-[11px]">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span className="sm:hidden">Maint. ON</span>
                  <span className="hidden sm:inline">Maintenance active</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-400">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                  </span>
                  <span className="hidden sm:inline">Site is live</span>
                </span>
              )}

              {maintenanceData?.maintenanceMode ? (
                <button
                  onClick={() => disableMaintenance.mutate()}
                  disabled={disableMaintenance.isPending}
                  className="rr-admin-status-btn is-go"
                >
                  {disableMaintenance.isPending ? "Disabling..." : "Disable"}
                </button>
              ) : (
                <button
                  onClick={handleEnableMaintenance}
                  disabled={enableMaintenance.isPending}
                  className="rr-admin-status-btn is-stop"
                >
                  {enableMaintenance.isPending ? "Enabling..." : "Enable"}
                </button>
              )}
            </div>

            <Link href="/">
              <Button variant="outline" size="sm" className="shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">View Site</span>
              </Button>
            </Link>
          </div>
          <div className="rr-header-line" aria-hidden />
        </header>

        {/* Main content - scrollable */}
        <main className="rr-admin-main flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Maintenance Confirmation Dialog */}
      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent className="w-[90vw] max-w-sm sm:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-[#FF263D]" />
              Enable Maintenance Mode?
            </DialogTitle>
            <DialogDescription className="pt-2">
              This will put the entire site into maintenance mode. All users will see a maintenance page and will not be able to access any features.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowMaintenanceDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmEnableMaintenance}
              disabled={enableMaintenance.isPending}
              className="flex-1"
            >
              {enableMaintenance.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Enabling...
                </>
              ) : (
                "Enable Maintenance Mode"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN Verification Dialog */}
      <Dialog open={showPinDialog} onOpenChange={handlePinDialogOpenChange}>
        <DialogContent className="w-[90vw] max-w-sm sm:max-w-md mx-auto">
          <form
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              verifyPin();
            }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-6 h-6 text-[#F1D47A]" />
                {unlockingItem?.type === 'group' ? 'Unlock Games Tab' : 'Unlock Users Access'}
              </DialogTitle>
              <DialogDescription className="pt-2">
                {unlockingItem?.type === 'group'
                  ? 'Enter PIN to access Games management section'
                  : 'Enter PIN to access User management section'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pin">Enter PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="admin-pin-code"
                  autoComplete="one-time-code"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  onKeyDown={handleKeyPress}
                  placeholder="••••"
                  className="text-center text-2xl tracking-widest font-mono h-12"
                  maxLength={16}
                  autoFocus
                />
                <input type="text" name="username" autoComplete="username" style={{ display: "none" }} />
                <input type="password" name="password" autoComplete="current-password" style={{ display: "none" }} />

                {pinError && (
                  <p className="text-sm text-destructive">{pinError}</p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => handlePinDialogOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!pinInput.trim() || stepUpMutation.isPending}
                className="flex-1"
              >
                {stepUpMutation.isPending ? "Verifying..." : "Verify PIN"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
