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
  ArrowDown,
  Target,
  AlertTriangle,
  Check,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    ],
    protected: true, // Add protection flag for Games tab
  },
  {
    name: "Competitions",
    icon: null,
    items: [
      { name: "Competitions", path: "/admin/competitions", icon: Trophy },
      { name: "Entries", path: "/admin/entries", icon: Ticket },
      { name: "Past Winners", path: "/admin/past-winners", icon: Award },
      { name: "Users", path: "/admin/users", icon: Users, protected: true }, // Users sub-tab protected
      { name: "Transactions", path: "/admin/transactions", icon: Euro },
      { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
      { name: "Withdrawals", path: "/admin/withdrawals", icon: ArrowDownCircle, hasNotification: true, notificationType: "withdrawals" },
    ],
  },
  {
    name: "Tools",
    icon: null,
    items: [
      { name: "Support", path: "/admin/support", icon: MessageSquare, hasNotification: true, notificationType: "support" },
      { name: "Intelligence", path: "/admin/intelligence", icon: Brain },
      { name: "Discounts", path: "/admin/discount", icon: TicketIcon },
      { name: "Verification", path: "/admin/verification", icon: Check ,  hasNotification: true, notificationType: "verification"},
      { name: "Well-being", path: "/admin/well-being", icon: Heart },
      { name: "Marketing", path: "/admin/marketing", icon: Mail },
      { name: "Settings", path: "/admin/settings", icon: Settings },
    ],
  },
];


// Define PIN codes
const PROTECTED_PINS = {
  GAMES: "4545", // PIN for Games tab
  USERS: "4545", // PIN for Users sub-tab
};

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
  
  const [unlockedGroups, setUnlockedGroups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("adminUnlockedGroups");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [unlockedItems, setUnlockedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("adminUnlockedItems");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [unlockTimers, setUnlockTimers] = useState<{ [key: string]: number }>(() => {
    try {
      const saved = localStorage.getItem("adminUnlockTimers");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to parse adminUnlockTimers", e);
      localStorage.removeItem("adminUnlockTimers"); // reset bad data
      return {};
    }
  });
  
  const { toast } = useToast();

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
      // Clear all unlocked items on logout
      localStorage.removeItem("adminUnlockedGroups");
      localStorage.removeItem("adminUnlockedItems");
      localStorage.removeItem("adminUnlockTimers");
      setUnlockedGroups([]);
      setUnlockedItems([]);
      setUnlockTimers({});
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

  useEffect(() => {
    localStorage.setItem("adminUnlockedGroups", JSON.stringify(unlockedGroups));
    localStorage.setItem("adminUnlockedItems", JSON.stringify(unlockedItems));
    localStorage.setItem("adminUnlockTimers", JSON.parse(JSON.stringify(unlockTimers)));
  }, [unlockedGroups, unlockedItems, unlockTimers]);

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

  // Check unlock timers every minute
  useEffect(() => {
    const checkTimers = () => {
      const now = Date.now();
      const expired = Object.entries(unlockTimers).filter(([_, expiry]) => now > expiry);
      
      if (expired.length > 0) {
        expired.forEach(([key]) => {
          if (key.startsWith('group:')) {
            const groupName = key.replace('group:', '');
            setUnlockedGroups(prev => prev.filter(g => g !== groupName));
            toast({
              title: "Session Expired",
              description: `Games tab has been re-locked due to inactivity.`,
              variant: "default",
            });
          } else if (key.startsWith('item:')) {
            const itemPath = key.replace('item:', '');
            setUnlockedItems(prev => prev.filter(i => i !== itemPath));
            toast({
              title: "Session Expired",
              description: `Users access has been re-locked due to inactivity.`,
              variant: "default",
            });
          }
        });
        
        // Remove expired timers
        const newTimers = { ...unlockTimers };
        expired.forEach(([key]) => delete newTimers[key]);
        setUnlockTimers(newTimers);
      }
    };

    const timer = setInterval(checkTimers, 60000); // Check every minute
    checkTimers(); // Check immediately on mount

    return () => clearInterval(timer);
  }, [unlockTimers, toast]);

  const enableMaintenance = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/admin/maintenance/on", "POST");
      const data = await res.json();
      return data;
    },
    onSuccess: async () => {
      toast({
        title: "Maintenance Enabled",
        description: "The site is now in maintenance mode. All users will see a maintenance page.",
      });
      await refetchMaintenance();
      setShowMaintenanceDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enable maintenance mode",
        variant: "destructive",
      });
    },
  });

  const disableMaintenance = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/admin/maintenance/off", "POST");
      const data = await res.json();
      return data;
    },
    onSuccess: async () => {
      toast({
        title: "Maintenance Disabled",
        description: "The site is live again.",
      });
      await refetchMaintenance();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disable maintenance mode",
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
    
    if (group?.protected && !unlockedGroups.includes(groupName)) {
      setUnlockingItem({ type: 'group', name: groupName });
      setPinInput("");
      setPinError("");
      setShowPinDialog(true);
    } else {
      setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    }
  };

  const handleItemClick = (itemName: string, itemPath: string, isProtected?: boolean) => {
    // Check if item is protected and not unlocked
    if (isProtected && !unlockedItems.includes(itemPath)) {
      setUnlockingItem({ type: 'item', name: itemName, path: itemPath });
      setPinInput("");
      setPinError("");
      setShowPinDialog(true);
      return; // Don't navigate yet
    }
    
    // If unlocked or not protected, navigate
    setLocation(itemPath);
    setSidebarOpen(false);
  };

  const verifyPin = () => {
    if (!unlockingItem) return;

    let correctPin = "";
    let targetName = "";

    if (unlockingItem.type === 'group') {
      if (unlockingItem.name === "Games") {
        correctPin = PROTECTED_PINS.GAMES;
        targetName = "Games tab";
      }
    } else if (unlockingItem.type === 'item') {
      if (unlockingItem.name === "Users") {
        correctPin = PROTECTED_PINS.USERS;
        targetName = "Users access";
      }
    }

    if (pinInput === correctPin) {
      const now = Date.now();
      const unlockDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
      const expiryTime = now + unlockDuration;

      if (unlockingItem.type === 'group') {
        setUnlockedGroups(prev => [...prev, unlockingItem.name]);
        setOpenGroups(prev => ({ ...prev, [unlockingItem.name]: true }));
        setUnlockTimers(prev => ({ ...prev, [`group:${unlockingItem.name}`]: expiryTime }));
      } else if (unlockingItem.type === 'item' && unlockingItem.path) {
        setUnlockedItems(prev => [...prev, unlockingItem.path]);
        setUnlockTimers(prev => ({ ...prev, [`item:${unlockingItem.path}`]: expiryTime }));
        setLocation(unlockingItem.path);
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
    } else {
      setPinError("Incorrect PIN. Please try again.");
      setPinInput("");
    }
  };

  const handleManualLock = (type: 'group' | 'item', identifier: string) => {
    if (type === 'group') {
      setUnlockedGroups(prev => prev.filter(g => g !== identifier));
      delete unlockTimers[`group:${identifier}`];
      toast({
        title: "Locked",
        description: "Games tab has been re-locked.",
      });
    } else if (type === 'item') {
      setUnlockedItems(prev => prev.filter(i => i !== identifier));
      delete unlockTimers[`item:${identifier}`];
      toast({
        title: "Locked",
        description: "Users access has been re-locked.",
      });
    }
    
    // If we're currently on a locked page, redirect to dashboard
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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user || !user.isAdmin) return null;

  return (
    <div className="flex min-h-screen -mt-20">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X /></button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <Link href="/admin">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer ${
                location === "/admin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </div>
            </Link>

            {sidebarGroups.map(group => {
              const isGroupUnlocked = unlockedGroups.includes(group.name);
              const isGroupProtected = group.protected;
              
              return (
                <div key={group.name}>
                  <button
                    className="flex items-center justify-between w-full px-4 py-2 text-lg font-medium text-muted-foreground hover:bg-muted rounded-lg"
                    onClick={() => handleGroupClick(group.name)}
                  >
                    <div className="flex items-center gap-2">
                      {isGroupProtected && !isGroupUnlocked && (
                        <Lock className="w-3 h-3 text-yellow-500" />
                      )}
                      {isGroupProtected && isGroupUnlocked && (
                        <Unlock className="w-3 h-3 text-green-500" />
                      )}
                      {group.name}
                    </div>
                    <div className="flex items-center gap-1">
                      {isGroupProtected && isGroupUnlocked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualLock('group', group.name);
                          }}
                          title="Lock this tab"
                        >
                          <Lock className="w-3 h-3" />
                        </Button>
                      )}
                      {isGroupProtected && !isGroupUnlocked && (
                        <span className="text-xs text-yellow-500">Locked</span>
                      )}
                      <ArrowDown className={`w-4 h-4 transition-transform ${openGroups[group.name] ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  
                  {openGroups[group.name] && (isGroupUnlocked || !isGroupProtected) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {group.items.map(item => {
                        const Icon = item.icon;
                        let unreadCount = 0;
                        if (item.notificationType === "support") unreadCount = supportUnreadData?.count ?? 0;
                        if (item.notificationType === "withdrawals") unreadCount = withdrawalUnreadData?.count ?? 0;
                        if (item.notificationType === "verification") unreadCount = verificationUnreadData?.count ?? 0;

                        const isItemUnlocked = unlockedItems.includes(item.path);
                        const isItemProtected = item.protected;
                        const canAccess = isItemUnlocked || !isItemProtected;

                        return (
                          <div
                            key={item.path}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer ${
                              location === item.path ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            } ${!canAccess ? "opacity-60" : ""}`}
                            onClick={() => handleItemClick(item.name, item.path, isItemProtected)}
                          >
                            <div className="flex items-center gap-2">
                              {isItemProtected && !isItemUnlocked && (
                                <Lock className="w-3 h-3 text-yellow-500" />
                              )}
                              {isItemProtected && isItemUnlocked && (
                                <Unlock className="w-3 h-3 text-green-500" />
                              )}
                              <Icon className="w-4 h-4" />
                              <span className="text-md">{item.name}</span>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                              {unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                                  {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                              )}
                              {isItemProtected && isItemUnlocked && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleManualLock('item', item.path);
                                  }}
                                  title="Lock this access"
                                >
                                  <Lock className="w-3 h-3" />
                                </Button>
                              )}
                              {isItemProtected && !isItemUnlocked && (
                                <span className="text-xs text-yellow-500">Locked</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
            >
              Logout
            </Button>
            
            {/* Quick lock all button */}
            {(unlockedGroups.length > 0 || unlockedItems.length > 0) && (
              <Button
                variant="ghost"
                className="w-full text-xs"
                onClick={() => {
                  setUnlockedGroups([]);
                  setUnlockedItems([]);
                  setUnlockTimers({});
                  toast({
                    title: "All Tabs Locked",
                    description: "All unlocked sections have been re-locked.",
                  });
                }}
              >
                <Lock className="w-3 h-3 mr-2" />
                Lock All Protected Tabs
              </Button>
            )}
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-card border-b border-border p-4 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
              data-testid="button-menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center justify-between flex-1 gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  View Site
                </Button>
              </Link>

              {/* Unlocked status indicator */}
              {/* {(unlockedGroups.length > 0 || unlockedItems.length > 0) && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Unlocked:</span>
                  {unlockedGroups.map(group => (
                    <span key={group} className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                      {group}
                    </span>
                  ))}
                  {unlockedItems.map(item => {
                    const itemName = sidebarGroups
                      .flatMap(g => g.items)
                      .find(i => i.path === item)?.name;
                    return (
                      <span key={item} className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                        {itemName}
                      </span>
                    );
                  })}
                </div>
              )} */}

              {/* Compact Maintenance Toggle */}
              <div className="flex items-center gap-3 bg-muted px-4 py-2 rounded-xl border border-border shadow-sm">
                {maintenanceData?.maintenanceMode ? (
                  <span className="text-red-500 font-bold text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Maintenance Active
                  </span>
                ) : (
                  <span className="text-green-500 font-bold text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Site is Live
                  </span>
                )}

                {maintenanceData?.maintenanceMode ? (
                  <button
                    onClick={() => disableMaintenance.mutate()}
                    disabled={disableMaintenance.isPending}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    {disableMaintenance.isPending ? "Disabling..." : "Disable"}
                  </button>
                ) : (
                  <button
                    onClick={handleEnableMaintenance}
                    disabled={enableMaintenance.isPending}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    {enableMaintenance.isPending ? "Enabling..." : "Enable"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>

      {/* Maintenance Confirmation Dialog */}
      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent className="w-[90vw] max-w-sm sm:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
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
          <form autoComplete="off">


          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-6 h-6 text-yellow-600" />
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
              <Label htmlFor="pin">Enter 4-digit PIN</Label>
              <Input
              id="pin"
              type="text"             
              inputMode="numeric"         
              pattern="[0-9]*"
              name="admin-pin-code"
              autoComplete="one-time-code"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={handleKeyPress}
              placeholder="0000"
              className="text-center text-2xl tracking-widest font-mono h-12"
              maxLength={4}
              autoFocus
            />
        <input type="text" name="username" autoComplete="username" style={{ display: "none" }} />
      <input type="password" name="password" autoComplete="current-password" style={{ display: "none" }} />

              {pinError && (
                <p className="text-sm text-destructive">{pinError}</p>
              )}
            </div>
            
            {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">Security Notice</p>
                  <p>Access will be automatically locked after 30 minutes of inactivity.</p>
                </div>
              </div>
            </div> */}
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
              onClick={verifyPin}
              disabled={pinInput.length !== 4}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700"
            >
              Verify PIN
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}