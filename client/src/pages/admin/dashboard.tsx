import AdminLayout from "@/components/admin/admin-layout";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Trophy, DollarSign, BarChart3, PoundSterling, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import BrandWait from "@/components/brand/BrandWait";

interface DashboardStats {
  stats: {
    totalUsers: number;
    totalCompetitions: number;
    dailyRevenue: number;
    totalSiteCredit: number;
    totalApprovedWithdrawals: number;
    dailyApprovedWithdrawals: number;
  };
  recentOrders: Array<{
    id: string;
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
    competition: string | null;
    amount: string;
    status: string;
    createdAt: string;
  }>;
}

// Privacy mask component
const PrivacyMask = () => (
  <span className="inline-flex items-center gap-1.5">
    <span className="font-mono tracking-widest">••••</span>
    <EyeOff className="h-4 w-4 text-white/40" />
  </span>
);

function StatCard({ title, value, icon: Icon, tone, delay, subtitle, isHidden }: any) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`rr-admin-stat ${tone ? `rr-admin-stat--${tone}` : ""} transition-all duration-500 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
      data-testid={`stat-card-${title.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="rr-admin-stat-label truncate">{title}</p>
          {subtitle && (
            <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{subtitle}</p>
          )}
        </div>
        <span className="rr-admin-stat-icon">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="rr-admin-stat-value mt-4 truncate">
        {isHidden ? <PrivacyMask /> : value}
      </p>
    </div>
  );
}

function statusPill(status: string) {
  return status === "completed"
    ? "rr-admin-pill--ok"
    : status === "pending"
    ? "rr-admin-pill--wait"
    : "rr-admin-pill--bad";
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [privacyMode, setPrivacyMode] = useState(() => {
    const saved = localStorage.getItem("adminPrivacyMode");
    return saved ? JSON.parse(saved) : false;
  });

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
  });

  const togglePrivacyMode = () => {
    setPrivacyMode((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem("adminPrivacyMode", JSON.stringify(newValue));
      return newValue;
    });
  };

  const formatAmount = (amount: string) => {
    // if (privacyMode) return <PrivacyMask />;
    return `£${parseFloat(amount).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <BrandWait mode="embed" kicker="Admin" headline="Loading dashboard" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5 max-w-full overflow-x-hidden">
        {/* Welcome Header with Privacy Toggle */}
        <div className="rr-admin-hero">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <span className="rr-admin-kicker-pill">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF263D] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF263D]" />
                </span>
                Live overview
              </span>
              <h1 className="mt-3 truncate text-3xl sm:text-4xl" data-testid="heading-dashboard">
                Welcome Back, Admin!
              </h1>
              <p className="mt-2 truncate text-sm font-semibold text-white/70">
                {user?.firstName || 'Admin'} • {new Date().toLocaleDateString('en-GB', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              <p className="mt-0.5 truncate text-xs text-white/45">
                {privacyMode
                  ? '🔒 Privacy mode enabled - figures are hidden'
                  : "Here's what's happening with Ringtone Riches today"}
              </p>
            </div>

            {/* Privacy Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={togglePrivacyMode}
              className={`w-full sm:w-auto ${privacyMode ? 'ring-2 ring-[#F1D47A]/60' : ''}`}
            >
              {privacyMode ? (
                <>
                  <Eye className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Show Figures</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Hide Figures</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Cards - Responsive grid */}
        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <StatCard
            title="Total Users"
            value={data?.stats.totalUsers?.toLocaleString() || 0}
            icon={Users}
            tone="red"
            delay={100}
            isHidden={privacyMode}
          />
          <StatCard
            title="Active Competitions"
            value={data?.stats.totalCompetitions?.toLocaleString() || 0}
            icon={Trophy}
            delay={200}
            isHidden={privacyMode}
          />
          <StatCard
            title="Today's Revenue"
            value={`£${parseFloat(data?.stats.dailyRevenue?.toString() || "0").toFixed(2)}`}
            icon={PoundSterling}
            tone="green"
            delay={300}
            subtitle="Cashflows · since midnight UK"
            isHidden={privacyMode}
          />
          <StatCard
            title="Total Site Credit"
            value={`£${parseFloat(data?.stats.totalSiteCredit?.toString() || "0").toFixed(2)}`}
            icon={DollarSign}
            delay={400}
            isHidden={privacyMode}
          />
          <StatCard
            title="Approved Withdrawals"
            value={`£${parseFloat(data?.stats.totalApprovedWithdrawals?.toString() || "0").toFixed(2)}`}
            icon={TrendingUp}
            tone="red"
            delay={500}
            subtitle="All time"
            isHidden={privacyMode}
          />
          <StatCard
            title="Daily Withdrawals"
            value={`£${parseFloat(data?.stats.dailyApprovedWithdrawals?.toString() || "0").toFixed(2)}`}
            icon={BarChart3}
            tone="green"
            delay={600}
            subtitle="Today"
            isHidden={privacyMode}
          />
        </div>

        {/* Recent Orders */}
        <div className="rr-admin-panel">
          <div className="rr-admin-panel-head">
            <div className="flex items-center gap-3">
              <span className="rr-admin-panel-icon">
                <BarChart3 className="h-4 w-4" />
              </span>
              <div>
                <p className="rr-admin-kicker">Latest activity</p>
                <h2 className="text-lg leading-tight text-[#FFF8EE]">Recent Orders</h2>
              </div>
            </div>
          </div>

          {/* Desktop Table - Hidden on mobile, visible on md and up */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-5">User</th>
                  <th className="text-left py-3 px-5">Competition</th>
                  <th className="text-left py-3 px-5">Amount</th>
                  <th className="text-left py-3 px-5">Status</th>
                  <th className="text-left py-3 px-5">Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentOrders && data.recentOrders.length > 0 ? (
                  data.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b transition-colors last:border-0"
                    >
                      <td className="py-3.5 px-5 text-sm font-semibold text-[#FFF8EE] whitespace-nowrap">
                        {order.user.firstName} {order.user.lastName || order.user.email}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-white/55 max-w-[240px] truncate">
                        {order.competition || "N/A"}
                      </td>
                      <td className="py-3.5 px-5 font-prize text-base tabular-nums text-[#F1D47A] whitespace-nowrap">
                        {formatAmount(order.amount)}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className={`rr-admin-pill ${statusPill(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-sm tabular-nums text-white/45 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-white/45">
                      No recent orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Visible only on mobile (below md breakpoint) */}
          <div className="md:hidden space-y-2.5 p-3">
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              data.recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5">
                  <div className="flex flex-col gap-3">
                    {/* User and Amount row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="rr-admin-stat-label">User</p>
                        <p className="mt-1 truncate text-sm font-semibold text-[#FFF8EE]">
                          {order.user.firstName} {order.user.lastName || order.user.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="rr-admin-stat-label">Amount</p>
                        <p className="mt-1 font-prize text-lg tabular-nums text-[#F1D47A]">
                          {formatAmount(order.amount)}
                        </p>
                      </div>
                    </div>

                    {/* Competition and Status row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="rr-admin-stat-label">Competition</p>
                        <p className="mt-1 truncate text-sm text-white/60">{order.competition || "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <p className="rr-admin-stat-label">Status</p>
                        <span className={`rr-admin-pill mt-1 ${statusPill(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Date row */}
                    <div>
                      <p className="rr-admin-stat-label">Date</p>
                      <p className="mt-1 text-xs tabular-nums text-white/50">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-white/45">
                <BarChart3 className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No recent orders</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
