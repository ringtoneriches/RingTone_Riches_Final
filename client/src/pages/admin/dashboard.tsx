import AdminLayout from "@/components/admin/admin-layout";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Trophy, DollarSign, Settings, BarChart3, Sparkles, PoundSterling } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

interface DashboardStats {
  stats: {
    totalUsers: number;
    totalCompetitions: number;
    totalRevenue: number;
    totalSiteCredit: number;           // ⭐ NEW
    totalApprovedWithdrawals: number;  // ⭐ NEW

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
        rounded-xl p-6 shadow-lg hover:shadow-2xl 
        transition-all duration-500 transform hover:scale-105 hover:-translate-y-1
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
      data-testid={`stat-card-${title.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80 font-medium uppercase tracking-wide">{title}</p>
            <p className="text-4xl font-bold text-white mt-2 tracking-tight">{value}</p>
          </div>
          <div className={`p-4 rounded-full ${color} shadow-lg`}>
            <Icon className="w-7 h-7 text-white" />
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
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="relative">
            <div className="animate-spin w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full" />
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-yellow-400" />
          </div>
          <p className="mt-4 text-muted-foreground font-medium">Loading dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Welcome Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
              <h1 className="text-3xl md:text-4xl font-bold text-white" data-testid="heading-dashboard">
                Welcome Back, Admin!
              </h1>
            </div>
            <p className="text-white/90 text-lg font-medium">
              {user?.firstName || 'Admin'} • {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-white/80 mt-2">
              Here's what's happening with Ringtone Riches today
            </p>
          </div>
        </div>

        {/* Animated Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            title="Total Revenue"
            value={`£${parseFloat(data?.stats.totalRevenue?.toString() || "0").toFixed(2)}`}
            icon={PoundSterling }
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

        {/* Recent Orders with Modern Design */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-foreground">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-yellow-400/20">
                  <th className="text-left py-4 px-4 text-sm font-bold text-foreground uppercase tracking-wide">
                    User
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-bold text-foreground uppercase tracking-wide">
                    Competition
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-bold text-foreground uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-bold text-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-bold text-foreground uppercase tracking-wide">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.recentOrders && data.recentOrders.length > 0 ? (
                  data.recentOrders.map((order, index) => (
                    <tr 
                      key={order.id} 
                      className="border-b border-border hover:bg-yellow-400/5 transition-colors"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="py-4 px-4 text-sm font-medium text-foreground">
                        {order.user.firstName} {order.user.lastName || order.user.email}
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {order.competition || "N/A"}
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-yellow-400">
                        £{parseFloat(order.amount).toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            order.status === "completed"
                              ? "bg-green-500/20 text-green-500 border border-green-500/30"
                              : order.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                              : "bg-red-500/20 text-red-500 border border-red-500/30"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
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
        </div>
      </div>
    </AdminLayout>
  );
}
