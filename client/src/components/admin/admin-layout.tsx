import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
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
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

const sidebarItems = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { name: "Spin Wheel", path: "/admin/spin-wheel", icon: CircleDot },
  { name: "Scratch Card", path: "/admin/scratch-card", icon: CreditCard },
  { name: "Ringtone Pop", path: "/admin/add-ringtone-pop", icon: Sparkles },
  // { name: "Ringtone Pop", path: "/admin/ringtone-pop", icon: Sparkles },
  { name: "Competitions", path: "/admin/competitions", icon: Trophy },
  { name: "Entries", path: "/admin/entries", icon: Ticket },
  { name: "Past Winners", path: "/admin/past-winners", icon: Award },
  { name: "Users", path: "/admin/users", icon: Users },
  { name: "Transactions", path: "/admin/transactions", icon: Euro },
  { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
{
    name: "Withdrawals",
    path: "/admin/withdrawals",
    icon: ArrowDownCircle,
    hasNotification: true,
    notificationType: "withdrawals",
  },
  {
    name: "Support",
    path: "/admin/support",
    icon: MessageSquare,
    hasNotification: true,
    notificationType: "support",
  },
  { name: "Well-being", path: "/admin/well-being", icon: Heart },
  { name: "Marketing", path: "/admin/marketing", icon: Mail },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth() as {
    user: User | null;
    isLoading: boolean;
  };
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  const { data: maintenanceData, refetch: refetchMaintenance } = useQuery({
    queryKey: ["/api/maintenance"],
    queryFn: () => fetch("/api/maintenance").then((res) => res.json()),
  });

   const { data: supportUnreadData } = useQuery({
    queryKey: ["/api/admin/support/unread-count"],
    refetchInterval: 1000,
  });

  const { data: withdrawalUnreadData } = useQuery({
  queryKey: ["/api/admin/withdrawals/unread-count"],
  refetchInterval: 1000,
});

  const enableMaintenance = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/admin/maintenance/on", "POST");
      const data = await res.json();
      return data;
    },
    onSuccess: async () => {
      toast({
        title: "Maintenance Enabled",
        description: "The site is now in maintenance mode.",
      });
      await refetchMaintenance();
    },
  });

  const disableMaintenance = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/admin/maintenance/off", "POST");
      const data = await res.json();   // <-- only once

    return data;
    },
    onSuccess: async () => {
      toast({
        title: "Maintenance Disabled",
        description: "The site is live again.",
      });
      await refetchMaintenance();
    },
  });
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/auth/logout", "POST");
      return res.json();
    },
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      // Redirect to admin login page instead of home
      setLocation("/admin/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background -mt-20 flex">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              RingTone Riches
            </p>
          </div>

        <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
             let unreadCount = 0;

        if (item.notificationType === "support") {
          unreadCount = supportUnreadData?.count ?? 0;
        }

        if (item.notificationType === "withdrawals") {
          unreadCount = withdrawalUnreadData?.count ?? 0;
        }

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Logged in as</p>
              <p className="text-sm font-medium text-foreground truncate">
                {user.email}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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

              {/* 🔥 Compact Maintenance Toggle */}
              <div className="flex items-center gap-3 bg-muted px-4 py-2 rounded-xl border border-border shadow-sm">
                {maintenanceData?.maintenanceMode ? (
                  <span className="text-red-500 font-bold text-sm">
                    Maintenance
                  </span>
                ) : (
                  <span className="text-green-500 font-bold text-sm">Live</span>
                )}

                {maintenanceData?.maintenanceMode ? (
                  <button
                    onClick={() => disableMaintenance.mutate()}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Disable
                  </button>
                ) : (
                  <button
                    onClick={() => enableMaintenance.mutate()}
                    disabled={enableMaintenance.isPending}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all"
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
    </div>
  );
}
