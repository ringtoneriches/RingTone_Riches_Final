import AdminLayout from "@/components/admin/admin-layout";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Trophy, DollarSign, Settings, BarChart3, Sparkles, PoundSterling, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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
  <span className="inline-flex items-center gap-1">
    <span className="font-mono">••••</span>
    <EyeOff className="w-3 h-3 text-white/70" />
  </span>
);

function StatCard({ title, value, icon: Icon, color, gradient, delay, subtitle, isHidden }: any) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`
        relative overflow-hidden bg-gradient-to-br ${gradient} 
        rounded-xl p-3 sm:p-4 shadow-lg
        transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
      data-testid={`stat-card-${title.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 md:w-20 md:h-20 md:-mr-10 md:-mt-10 lg:w-24 lg:h-24 lg:-mr-12 lg:-mt-12"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-white/80 font-medium uppercase tracking-wide truncate pr-2">{title}</p>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-white/60 font-medium mt-0.5 truncate">{subtitle}</p>
            )}
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mt-1 truncate">
              {isHidden ? <PrivacyMask /> : value}
            </p>
          </div>
          <div className={`p-1.5 sm:p-2 md:p-3 rounded-full ${color} shadow-lg ml-1 sm:ml-2 flex-shrink-0`}>
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20"></div>
    </div>
  );
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
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="relative">
            <div className="animate-spin w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full" />
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground font-medium text-center">Loading dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-3 sm:space-y-4 p-2 sm:p-3 md:p-4 lg:p-6 max-w-full overflow-x-hidden">
        {/* Welcome Header with Privacy Toggle */}
        <div className="relative overflow-hidden bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl p-3 sm:p-4 md:p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16 md:w-40 md:h-40 md:-mr-20 md:-mt-20"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2">
              <div className="flex items-center gap-2 md:gap-3">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white animate-pulse flex-shrink-0" />
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate" data-testid="heading-dashboard">
                  Welcome Back, Admin!
                </h1>
              </div>
              
              {/* Privacy Toggle Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={togglePrivacyMode}
                className={`bg-white/10 hover:bg-white/20 text-white border-white/20 w-full sm:w-auto ${
                  privacyMode ? 'ring-2 ring-white' : ''
                }`}
              >
                {privacyMode ? (
                  <>
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Show Figures</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Hide Figures</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-white/90 text-xs sm:text-sm md:text-base font-medium truncate">
              {user?.firstName || 'Admin'} • {new Date().toLocaleDateString('en-GB', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-white/80 mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm truncate">
              {privacyMode 
                ? '🔒 Privacy mode enabled - figures are hidden' 
                : "Here's what's happening with Ringtone Riches today"}
            </p>
          </div>
        </div>

        {/* Stats Cards - Responsive grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          <StatCard
            title="Total Users"
            value={data?.stats.totalUsers?.toLocaleString() || 0}
            icon={Users}
            color="bg-blue-600"
            gradient="from-blue-500 to-blue-700"
            delay={100}
            isHidden={privacyMode}
          />
          <StatCard
            title="Active Competitions"
            value={data?.stats.totalCompetitions?.toLocaleString() || 0}
            icon={Trophy}
            color="bg-yellow-600"
            gradient="from-yellow-500 to-yellow-700"
            delay={200}
            isHidden={privacyMode}
          />
          <StatCard
            title="Today's Revenue"
            value={`£${parseFloat(data?.stats.dailyRevenue?.toString() || "0").toFixed(2)}`}
            icon={PoundSterling}
            color="bg-green-600"
            gradient="from-green-500 to-green-700"
            delay={300}
            isHidden={privacyMode}
          />
          <StatCard
            title="Total Site Credit"
            value={`£${parseFloat(data?.stats.totalSiteCredit?.toString() || "0").toFixed(2)}`}
            icon={DollarSign}
            color="bg-purple-600"
            gradient="from-purple-500 to-purple-700"
            delay={400}
            isHidden={privacyMode}
          />
          <StatCard
            title="Approved Withdrawals"
            value={`£${parseFloat(data?.stats.totalApprovedWithdrawals?.toString() || "0").toFixed(2)}`}
            icon={TrendingUp}
            color="bg-blue-600"
            gradient="from-blue-500 to-blue-700"
            delay={500}
            subtitle="All time"
            isHidden={privacyMode}
          />
          <StatCard
            title="Daily Withdrawals"
            value={`£${parseFloat(data?.stats.dailyApprovedWithdrawals?.toString() || "0").toFixed(2)}`}
            icon={BarChart3}
            color="bg-orange-600"
            gradient="from-orange-500 to-orange-700"
            delay={600}
            subtitle="Today"
            isHidden={privacyMode}
          />
        </div>

        {/* Recent Orders */}
        <div className="bg-card border border-border rounded-xl p-3 sm:p-4 shadow-lg">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-foreground">Recent Orders</h2>
            </div>
            
            {/* Privacy status badge */}
            {/* {privacyMode && (
              <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                <EyeOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Amounts hidden
              </span>
            )} */}
          </div>
          
          {/* Desktop Table - Hidden on mobile, visible on md and up */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-yellow-400/20">
                  <th className="text-left py-3 px-4 text-sm font-bold text-foreground uppercase">User</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-foreground uppercase">Competition</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-foreground uppercase">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-foreground uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-foreground uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentOrders && data.recentOrders.length > 0 ? (
                  data.recentOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="border-b border-border hover:bg-yellow-400/5"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-foreground whitespace-nowrap">
                        {order.user.firstName} {order.user.lastName || order.user.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground max-w-[200px] truncate">
                        {order.competition || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-yellow-400 whitespace-nowrap">
                        {formatAmount(order.amount)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            order.status === "completed"
                              ? "bg-green-500/20 text-green-500"
                              : order.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No recent orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Visible only on mobile (below md breakpoint) */}
          <div className="md:hidden space-y-2 sm:space-y-3">
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              data.recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="bg-background border border-border rounded-lg p-3 sm:p-4 hover:bg-yellow-400/5 transition-colors">
                  <div className="flex flex-col gap-2">
                    {/* User and Amount row */}
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground font-medium">User</p>
                        <p className="text-xs sm:text-sm font-medium truncate pr-2">
                          {order.user.firstName} {order.user.lastName || order.user.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground font-medium">Amount</p>
                        <p className="text-sm sm:text-base font-bold text-yellow-400">
                          {formatAmount(order.amount)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Competition and Status row */}
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground font-medium">Competition</p>
                        <p className="text-xs sm:text-sm truncate pr-2">{order.competition || "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground font-medium">Status</p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase ${
                            order.status === "completed"
                              ? "bg-green-500/20 text-green-500"
                              : order.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Date row */}
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Date</p>
                      <p className="text-xs sm:text-sm">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 sm:py-12 text-center text-muted-foreground">
                <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">No recent orders</p>
              </div>
            )}
          </div>
          
        
        </div>
      </div>
    </AdminLayout>
  );
}