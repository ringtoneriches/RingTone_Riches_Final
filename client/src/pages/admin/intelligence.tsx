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
        <div className="flex items-center justify-center h-72">
          <Loader2 className="w-10 h-10 animate-spin text-yellow-400" />
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
      <div className="space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-7 h-7 text-yellow-400" />
            Intelligence
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Deep insight into how users discover Ringtone Riches.  
            Use this data to guide marketing and offline campaigns.
          </p>
        </div>

        {/* KPI ROW */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-yellow-400" />
                Total Tracked Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold flex items-center gap-2">{totalUsers} <span className="text-2xl font-bold">Total Users</span></p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Strongest Channel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">
                {topSource?.source || "N/A"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Highest user acquisition source
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <PieIcon className="w-4 h-4 text-blue-400" />
                Market Share
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{topPercentage}%</p>
              <p className="text-sm text-muted-foreground mt-1">
      From {topSource?.source || "N/A"}
    </p>
            </CardContent>
          </Card>
        </div>

        {/* CHARTS */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* PIE */}
          <Card>
  <CardHeader>
    <CardTitle>User Acquisition Share</CardTitle>
    <p className="text-sm text-muted-foreground">
      Percentage contribution by channel
    </p>
  </CardHeader>

  <CardContent className="h-[360px]">
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
          innerRadius={80}
          outerRadius={130}
          paddingAngle={4}
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
            dy="-2"
            className="fill-muted-foreground text-sm"
          >
            Total Users
          </tspan>
          <tspan
            x="50%"
            dy="20"
            className="fill-foreground text-2xl font-bold"
          >
            {totalUsers}
          </tspan>
        </text>

        <Tooltip
  formatter={(value, name, props) => [
    <div key="value" className="font-bold">
      {value} users
    </div>,
    <div key="name" className="text-sm text-muted-foreground">
      {props.payload.source}
    </div>
  ]}
  labelFormatter={() => null}
  contentStyle={{
    backgroundColor: 'hsl(var(--background))',
    borderColor: 'hsl(var(--border))',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  }}
  itemStyle={{
    color: 'hsl(var(--foreground))',
    fontSize: '14px',
    padding: '2px 0',
  }}
  wrapperStyle={{
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  }}
  cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
/>
      </PieChart>
    </ResponsiveContainer>
  </CardContent>
</Card>


          {/* BAR */}
          <Card>
  <CardHeader>
    <CardTitle>Channel Performance</CardTitle>
    <p className="text-sm text-muted-foreground">
      Total users acquired per channel
    </p>
  </CardHeader>

  <CardContent className="h-[360px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        barCategoryGap={16}
      >
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          className="text-xs"
        />

        <YAxis
          type="category"
          dataKey="source"
          tickLine={false}
          axisLine={false}
          width={180}
          className="text-xs"
        />

        {/* 🔥 NO hover background */}
        <Tooltip
          cursor={false}
          content={<CustomTooltip />}
        />

        <Bar
          dataKey="total"
          radius={[0, 10, 10, 0]}
        >
          {data.map((_, index) => (
            <Cell
              key={index}
              fill={BAR_COLORS[index % BAR_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>


        </div>
      </div>
    </AdminLayout>
  );
}
