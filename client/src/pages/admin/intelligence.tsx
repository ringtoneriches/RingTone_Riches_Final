import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Brain, TrendingUp, Users, PieChart as PieIcon } from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

type IntelligenceRow = {
  source: string;
  total: number;
};

const COLORS = [
    "#fbbf24", // amber
    "#22c55e", // green
    "#38bdf8", // sky
    "#a78bfa", // violet
    "#f472b6", // rose
  ];
  

  const BAR_COLORS = [
    "#fbbf24", // amber
    "#22c55e", // green
    "#38bdf8", // sky
    "#a78bfa", // violet
    "#f472b6", // rose
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
  
    const { source, total } = payload[0].payload;
  
    return (
      <div className="rounded-xl border border-white flex items-center justify-center gap-1 bg-background/95 backdrop-blur px-4 py-3 shadow-lg">
        <p className="text-sm font-bold ">{total}</p>
        <p className="text-sm font-semibold">
          Users
        </p>
      </div>
    );
  };
  

export default function AdminIntelligence() {
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data = [], isLoading } = useQuery<IntelligenceRow[]>({
    queryKey: ["/api/admin/intelligence/registration-source"],
    queryFn: async () => {
      const res = await apiRequest(
        "/api/admin/intelligence/registration-source",
        "GET"
      );
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-yellow-400" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  const totalUsers = data.reduce((sum, d) => sum + d.total, 0);
  const topSource = data[0];
  const topPercentage =
    topSource && totalUsers
      ? Math.round((topSource.total / totalUsers) * 100)
      : 0;

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 md:space-y-8 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
        {/* HEADER */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-yellow-400" />
            Intelligence
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 max-w-2xl">
            Deep insight into how users discover Ringtone Riches.  
            Use this data to guide marketing and offline campaigns.
          </p>
        </div>

        {/* KPI ROW */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent" />
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                Total Tracked Users
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-1 sm:gap-2">
                {totalUsers} 
                <span className="text-base sm:text-lg md:text-xl font-bold text-muted-foreground">
                  Total Users
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                Strongest Channel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-base sm:text-lg md:text-xl font-semibold truncate">
                {topSource?.source || "N/A"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Highest user acquisition source
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm">
                <PieIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                Market Share
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{topPercentage}%</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                From {topSource?.source || "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CHARTS */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* PIE CHART - Always vertical */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg md:text-xl">User Acquisition Share</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Percentage contribution by channel
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 h-[280px] sm:h-[320px] md:h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {COLORS.map((color, index) => (
                      <linearGradient
                        key={index}
                        id={`pieGrad${index}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>

                  <Pie
                    data={data}
                    dataKey="total"
                    nameKey="source"
                    innerRadius={isMobile ? 50 : 60}
                    outerRadius={isMobile ? 80 : 100}
                    paddingAngle={2}
                  >
                    {data.map((_, index) => (
                      <Cell
                        key={index}
                        fill={`url(#pieGrad${index})`}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>

                  {/* CENTER LABEL */}
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x="50%"
                      dy={isMobile ? "-2" : "-4"}
                      className="fill-muted-foreground text-xs sm:text-sm"
                    >
                      Total Users
                    </tspan>
                    <tspan
                      x="50%"
                      dy={isMobile ? "12" : "16"}
                      className="fill-foreground text-lg sm:text-xl md:text-2xl font-bold"
                    >
                      {totalUsers}
                    </tspan>
                  </text>

                  <Tooltip
                    formatter={(value, name, props) => [
                      <div key="value" className="font-bold text-sm text-white">
                        {value} users
                      </div>,
                      <div key="name" className="text-xs text-muted-foreground">
                        {props.payload.source}
                      </div>
                    ]}
                    labelFormatter={() => null}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      backdropFilter:"blur(5px)",
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* BAR CHART - Switch between vertical and horizontal based on screen size */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg md:text-xl">Channel Performance</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Total users acquired per channel
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 h-[280px] sm:h-[320px] md:h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                {isMobile ? (
                  // HORIZONTAL BAR CHART FOR MOBILE
                  <BarChart
                    data={data}
                    layout="horizontal"
                    barCategoryGap={8}
                    margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
                  >
                    <XAxis
                      type="category"
                      dataKey="source"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 10 }}
                      interval={0}
                    />
                    <YAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      cursor={false}
                      content={<CustomTooltip />}
                    />
                    <Bar
                      dataKey="total"
                      radius={[4, 4, 0, 0]}
                    >
                      {data.map((_, index) => (
                        <Cell
                          key={index}
                          fill={BAR_COLORS[index % BAR_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  // VERTICAL BAR CHART FOR DESKTOP (original layout)
                  <BarChart
                    data={data}
                    layout="vertical"
                    barCategoryGap={12}
                    margin={{ top: 20, right: 20, left: 80, bottom: 20 }}
                  >
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="source"
                      tickLine={false}
                      axisLine={false}
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={false}
                      content={<CustomTooltip />}
                    />
                    <Bar
                      dataKey="total"
                      radius={[0, 8, 8, 0]}
                    >
                      {data.map((_, index) => (
                        <Cell
                          key={index}
                          fill={BAR_COLORS[index % BAR_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Data Table for Mobile - Alternative View */}
        <div className="lg:hidden">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Channel Details</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Breakdown by acquisition source
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 text-xs sm:text-sm font-semibold">Channel</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-semibold">Users</th>
                      <th className="text-left p-3 text-xs sm:text-sm font-semibold">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/30">
                        <td className="p-3 text-xs sm:text-sm font-medium truncate max-w-[120px]">
                          {item.source}
                        </td>
                        <td className="p-3 text-xs sm:text-sm font-bold">
                          {item.total}
                        </td>
                        <td className="p-3 text-xs sm:text-sm">
                          {totalUsers > 0 ? Math.round((item.total / totalUsers) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}