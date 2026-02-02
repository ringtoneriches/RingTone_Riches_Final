import AdminLayout from "@/components/admin/admin-layout";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Trophy, DollarSign, Settings, BarChart3, Sparkles, PoundSterling } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

interface DashboardStats {
  stats: {
    totalUsers: number;
    totalCompetitions: number;
    dailyRevenue: number; 
    totalSiteCredit: number;
    totalApprovedWithdrawals: number;
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

function StatCard({ title, value, icon: Icon, color, gradient, delay }: any) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`
        relative overflow-hidden bg-gradient-to-br ${gradient} 
        rounded-xl p-4 shadow-lg
        transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
      data-testid={`stat-card-${title.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 md:w-20 md:h-20 md:-mr-10 md:-mt-10 lg:w-24 lg:h-24 lg:-mr-12 lg:-mt-12"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm text-white/80 font-medium uppercase tracking-wide truncate">{title}</p>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-white mt-1 truncate">
              {value}
            </p>
          </div>
          <div className={`p-2 md:p-3 rounded-full ${color} shadow-lg ml-2`}>
            <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20"></div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
  });

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
      <div className="space-y-4 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
        {/* Welcome Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl p-4 md:p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 md:w-40 md:h-40 md:-mr-20 md:-mt-20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white animate-pulse" />
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-white truncate" data-testid="heading-dashboard">
                Welcome Back, Admin!
              </h1>
            </div>
            <p className="text-white/90 text-sm md:text-base font-medium truncate">
              {user?.firstName || 'Admin'} • {new Date().toLocaleDateString('en-GB', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-white/80 mt-1 text-xs md:text-sm truncate">
              Here's what's happening with Ringtone Riches today
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <StatCard
            title="Total Users"
            value={data?.stats.totalUsers || 0}
            icon={Users}
            color="bg-blue-600"
            gradient="from-blue-500 to-blue-700"
            delay={100}
          />
          <StatCard
            title="Active Competitions"
            value={data?.stats.totalCompetitions || 0}
            icon={Trophy}
            color="bg-yellow-600"
            gradient="from-yellow-500 to-yellow-700"
            delay={200}
          />
          <StatCard
            title="Today's Revenue"
            value={`£${parseFloat(data?.stats.dailyRevenue?.toString() || "0").toFixed(2)}`}
            icon={PoundSterling}
            color="bg-green-600"
            gradient="from-green-500 to-green-700"
            delay={300}
          />
          <StatCard
            title="Total Site Credit"
            value={`£${parseFloat(data?.stats.totalSiteCredit?.toString() || "0").toFixed(2)}`}
            icon={DollarSign}
            color="bg-purple-600"
            gradient="from-purple-500 to-purple-700"
            delay={400}
          />
          <StatCard
            title="Approved Withdrawals"
            value={`£${parseFloat(data?.stats.totalApprovedWithdrawals?.toString() || "0").toFixed(2)}`}
            icon={TrendingUp}
            color="bg-red-600"
            gradient="from-red-500 to-red-700"
            delay={500}
          />
        </div>

        {/* Recent Orders - Mobile Responsive Table */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-foreground">Recent Orders</h2>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[600px]">
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
                  data.recentOrders.map((order, index) => (
                    <tr 
                      key={order.id} 
                      className="border-b border-border hover:bg-yellow-400/5"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-foreground">
                        {order.user.firstName} {order.user.lastName || order.user.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {order.competition || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-yellow-400">
                        £{parseFloat(order.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-sm text-muted-foreground">
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

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              data.recentOrders.map((order) => (
                <div key={order.id} className="bg-background border border-border rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">User</p>
                      <p className="text-sm font-medium truncate">
                        {order.user.firstName} {order.user.lastName || order.user.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Amount</p>
                      <p className="text-sm font-bold text-yellow-400">
                        £{parseFloat(order.amount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Competition</p>
                      <p className="text-sm truncate">{order.competition || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Status</p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold uppercase inline-block ${
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
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground font-medium">Date</p>
                      <p className="text-sm">
                        {new Date(order.createdAt).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No recent orders
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}