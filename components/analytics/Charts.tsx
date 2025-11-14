"use client";

import { useId } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];


interface ChartsProps {
  engagementData: Array<{
    date: string;
    engagement: number;
    impressions: number;
  }>;
  platformData: Array<{
    platform: string;
    engagement: number;
    posts: number;
  }>;
}

const engagementChartConfig = {
  engagement: {
    label: "Engagement",
    color: "hsl(var(--chart-1))",
  },
  impressions: {
    label: "Impressions",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function EngagementChart({ engagementData }: { engagementData: ChartsProps["engagementData"] }) {
  const gradientId = useId();
  // Calculate trend (simple comparison of last 2 data points)
  const trend = engagementData.length >= 2
    ? ((engagementData[engagementData.length - 1].engagement - engagementData[engagementData.length - 2].engagement) / engagementData[engagementData.length - 2].engagement * 100).toFixed(1)
    : "0";
  const isPositive = parseFloat(trend) >= 0;

  return (
    <Card className="glass-base glass-mid border border-white/5 p-6 md:p-8 transition duration-300 ease-out hover:-translate-y-1 hover:bg-white/10">
      <CardHeader className="p-0">
        <CardTitle>Engagement Over Time</CardTitle>
        <CardDescription>
          Showing engagement and impressions for the last 7 days
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pt-6">
        <ChartContainer config={engagementChartConfig} className="h-64">
          <AreaChart
            accessibilityLayer
            data={engagementData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 40,
            }}
          >
            <defs>
              <linearGradient id={`${gradientId}-impressions`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-impressions)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-impressions)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`${gradientId}-engagement`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-engagement)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-engagement)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              height={50}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              stroke="rgba(255,255,255,0.08)"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="impressions"
              type="natural"
              fill={`url(#${gradientId}-impressions)`}
              stroke="var(--color-impressions)"
              stackId="a"
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 2, stroke: "#0f172a", fill: "var(--color-impressions)" }}
              activeDot={{ r: 5, strokeWidth: 0, fill: "var(--color-impressions)" }}
            />
            <Area
              dataKey="engagement"
              type="natural"
              fill={`url(#${gradientId}-engagement)`}
              stroke="var(--color-engagement)"
              stackId="a"
              strokeWidth={3}
              dot={{ r: 3, strokeWidth: 2, stroke: "#0f172a", fill: "var(--color-engagement)" }}
              activeDot={{ r: 5, strokeWidth: 0, fill: "var(--color-engagement)" }}
            />
            <ChartLegend
              verticalAlign="top"
              content={<ChartLegendContent className="justify-start text-[11px] text-slate-300" />}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="mt-4 border-t border-white/5 pt-4">
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {isPositive ? "Trending up" : "Trending down"} by {Math.abs(parseFloat(trend))}% this week{" "}
              <TrendingUp className={`h-4 w-4 ${!isPositive ? "rotate-180" : ""}`} />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Last 7 days
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

const PLATFORM_ORDER = ["Instagram", "LinkedIn", "Facebook"];

function normalizePlatforms(data: ChartsProps["platformData"]): ChartsProps["platformData"] {
  return PLATFORM_ORDER.map((platform) => {
    const match = data.find((item) => item.platform.toLowerCase() === platform.toLowerCase());
    if (match) return match;
    return { platform, engagement: 0, posts: 0 };
  });
}

const platformChartConfig = {
  engagement: {
    label: "Engagement",
    color: "hsl(var(--chart-1))",
  },
  posts: {
    label: "Posts",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const followerChartConfig = {
  followers: {
    label: "Followers",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function PlatformChart({ platformData }: { platformData: ChartsProps["platformData"] }) {
  const normalizedData = normalizePlatforms(platformData);

  const totalEngagement = normalizedData.reduce((sum, item) => sum + item.engagement, 0);
  const avgEngagement = normalizedData.length > 0 ? totalEngagement / normalizedData.length : 0;
  const previousAvg = avgEngagement * 0.95; // Mock previous period
  const trend = avgEngagement > 0 ? (((avgEngagement - previousAvg) / previousAvg) * 100).toFixed(1) : "0";
  const isPositive = parseFloat(trend) >= 0;

  return (
    <Card className="glass-base glass-mid border border-white/5 p-6 md:p-8 transition duration-300 ease-out hover:-translate-y-1 hover:bg-white/10">
      <CardHeader className="p-0">
        <CardTitle>Platform Performance</CardTitle>
        <CardDescription>
          Engagement and posts across all platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pt-6">
        <ChartContainer className="h-64 aspect-auto" config={platformChartConfig}>
          <BarChart
            accessibilityLayer
            data={normalizedData}
            barCategoryGap="30%"
            margin={{ top: 16, bottom: 16, left: 8, right: 8 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="platform"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} stroke="rgba(255,255,255,0.08)" />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Legend
              verticalAlign="top"
              iconType="circle"
              wrapperStyle={{ color: "#cbd5f5" }}
              height={24}
            />
            <Bar
              dataKey="engagement"
              fill="var(--color-engagement)"
              radius={[6, 6, 6, 6]}
              barSize={18}
            />
            <Bar
              dataKey="posts"
              fill="var(--color-posts)"
              radius={[6, 6, 6, 6]}
              barSize={12}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {isPositive ? "Trending up" : "Trending down"} by {Math.abs(parseFloat(trend))}% this period{" "}
          <TrendingUp className={`h-4 w-4 ${!isPositive ? "rotate-180" : ""}`} />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing performance across {normalizedData.length} platforms
        </div>
      </CardFooter>
    </Card>
  );
}

export function PlatformDistribution({ platformData }: { platformData: ChartsProps["platformData"] }) {
  const normalizedData = normalizePlatforms(platformData);
  const pieData = normalizedData.map((item) => ({
    name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
    value: item.posts,
  }));

  return (
    <Card className="glass-base glass-mid border border-white/5 p-6 md:p-8 transition duration-300 ease-out hover:-translate-y-1 hover:bg-white/10">
      <CardHeader className="p-0">
        <CardTitle>Posts by Platform</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-6">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => {
                const { name, percent } = props;
                return `${name} ${((percent as number) * 100).toFixed(0)}%`;
              }}
              innerRadius={40}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function FollowersTrend({
  followerData,
}: {
  followerData: Array<{ platform: string; followers: number; delta: number }>;
}) {
  const graphData = normalizePlatforms(
    followerData.map(({ platform, followers }) => ({
      platform,
      engagement: followers,
      posts: 0,
    }))
  ).map((item, index) => ({
    platform: item.platform,
    followers: item.engagement,
    delta: followerData[index]?.delta ?? 0,
  }));
  const gradientId = useId();

  return (
    <Card className="glass-base glass-mid border border-white/5 p-6 md:p-8 transition duration-300 ease-out hover:-translate-y-1 hover:bg-white/10">
      <CardHeader className="p-0">
        <CardTitle>Follower Growth</CardTitle>
        <CardDescription>Rolling 30-day follower trend by platform</CardDescription>
      </CardHeader>
      <CardContent className="p-0 pt-6">
        <ChartContainer config={followerChartConfig} className="h-56 aspect-auto">
          <LineChart
            accessibilityLayer
            data={graphData}
            margin={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <defs>
              <linearGradient id={`${gradientId}-followers`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-followers)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-followers)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="platform" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis tickLine={false} axisLine={false} tickMargin={10} width={80} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <ChartLegend
              verticalAlign="top"
              content={<ChartLegendContent className="justify-start text-[11px] text-slate-300" />}
            />
            <Line
              type="monotone"
              dataKey="followers"
              stroke="var(--color-followers)"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-followers)" }}
              fill={`url(#${gradientId}-followers)`}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

