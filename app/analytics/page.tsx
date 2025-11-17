import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Eye, Heart, Users, Activity, LineChartIcon, Download, Sparkles } from "lucide-react";
import {
  EngagementChartClient,
  PlatformChartClient,
  PlatformDistributionClient,
  FollowersTrendClient,
} from "@/components/analytics/ChartsWrapper";
import { Button } from "@/components/ui/button";
import { PlatformDropdown } from "@/components/analytics/PlatformDropdown";
import { RangeDropdown } from "@/components/analytics/RangeDropdown";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: metrics } = await supabase
    .from("metrics")
    .select("*, posts!inner(user_id, platform)")
    .eq("posts.user_id", user.id);

  // Mock aggregated stats
  const totalImpressions = metrics?.reduce((sum, m) => sum + (m.impressions || 0), 0) || 0;
  const totalEngagement = metrics?.reduce((sum, m) => sum + (m.likes || 0) + (m.comments || 0) + (m.shares || 0), 0) || 0;
  const totalPosts = metrics?.length || 0;
  const avgEngagement = totalPosts ? Math.round((totalEngagement / totalPosts) * 10) / 10 : 0;
  const totalFollowers = metrics?.reduce((sum, m) => sum + (m.followers || 0), 0) || 0;
  const followerGain = metrics?.reduce((sum, m) => sum + (m.follower_gain || 0), 0) || 0;

  const stats = {
    totalImpressions,
    totalEngagement,
    totalPosts,
    avgEngagement,
    totalFollowers,
    followerGain,
  };

  // Prepare engagement over time data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const engagementData = last7Days.map((date) => {
    const dayMetrics = metrics?.filter((m) => m.date === date) || [];
    return {
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      engagement: dayMetrics.reduce((sum, m) => sum + (m.likes || 0) + (m.comments || 0) + (m.shares || 0), 0),
      impressions: dayMetrics.reduce((sum, m) => sum + (m.impressions || 0), 0),
    };
  });

  // Prepare platform data
  const platformMap = new Map<string, { engagement: number; posts: number }>();
  metrics?.forEach((metric) => {
    const platform = metric.posts?.platform || "unknown";
    const existing = platformMap.get(platform) || { engagement: 0, posts: 0 };
    platformMap.set(platform, {
      engagement: existing.engagement + (metric.likes || 0) + (metric.comments || 0) + (metric.shares || 0),
      posts: existing.posts + 1,
    });
  });

  const platformData = Array.from(platformMap.entries()).map(([platform, data]) => ({
    platform: platform.charAt(0).toUpperCase() + platform.slice(1),
    ...data,
  }));

  const expectedPlatforms = ["Instagram", "LinkedIn", "Facebook", "X"];
  const platformIcons: Record<string, string> = {
    instagram: "/Instagram logo.png",
    linkedin: "/Linkedin logo.png",
    facebook: "/Facebook logo.png",
    x: "/X logo.png",
  };

  const platformOptions = expectedPlatforms.map((platform) => ({
    label: platform,
    value: platform.toLowerCase(),
    icon: platformIcons[platform.toLowerCase()],
  }));

  const normalizedPlatformData = expectedPlatforms.map((platform) => {
    const match = platformData.find((item) => item.platform.toLowerCase() === platform.toLowerCase());
    return match ?? { platform, engagement: 0, posts: 0 };
  });

  const followerTrendData = normalizedPlatformData.map((item) => ({
    platform: item.platform,
    followers: Math.max(item.engagement * 20, 0),
    delta: Math.random() * 5,
  }));

  // If no data, show mock data for demo
  const hasData = metrics && metrics.length > 0;
  const displayEngagementData = hasData
    ? engagementData
    : last7Days.map((date) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        engagement: Math.floor(Math.random() * 100),
        impressions: Math.floor(Math.random() * 500),
      }));

  const displayPlatformData = hasData
    ? normalizedPlatformData
    : [
        { platform: "Instagram", engagement: 150, posts: 5 },
        { platform: "LinkedIn", engagement: 200, posts: 8 },
        { platform: "Facebook", engagement: 110, posts: 4 },
        { platform: "X", engagement: 75, posts: 3 },
      ];

  const displayFollowerData = hasData
    ? followerTrendData
    : displayPlatformData.map((item) => ({
        platform: item.platform,
        followers: Math.max(item.engagement * 20, 0),
        delta: Math.random() * 5,
      }));

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <div className="md:flex md:gap-8">
          <Sidebar />
          <div className="flex-1">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <PlatformDropdown options={platformOptions} />
                <RangeDropdown />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 text-sm font-medium text-cyan-100 hover:bg-cyan-500/20"
              >
                <Download className="h-4 w-4" />
                Export report
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="glass-base glass-high border border-white/5 p-6 md:p-8 transition duration-300 ease-out hover:-translate-y-1 hover:bg-white/12">
                <CardHeader className="p-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <span className="text-xs uppercase tracking-wide text-slate-400/80">Followers</span>
                      <h3 className="text-3xl font-semibold text-white">{stats.totalFollowers.toLocaleString()}</h3>
                      <p className="text-xs text-slate-400">Across connected profiles</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-200">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <p className="text-xs font-medium text-emerald-300">
                    ▲ {stats.followerGain.toLocaleString()} new followers
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-base glass-high border border-white/5 p-6 md:p-8 transition duration-300 ease-out hover:-translate-y-1 hover:bg-white/12">
                <CardHeader className="p-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <span className="text-xs uppercase tracking-wide text-slate-400/80">Profile Reach</span>
                      <h3 className="text-3xl font-semibold text-white">3.3M</h3>
                      <p className="text-xs text-slate-400">Active audience last 30 days</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-200">
                      <Activity className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <p className="text-xs font-medium text-emerald-300">▲ 174% vs last month</p>
                </CardContent>
              </Card>
              <Card className="glass-base glass-high border border-white/5 p-6 md:p-8 transition duration-300 ease-out hover:-translate-y-1 hover:bg-white/12">
                <CardHeader className="p-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <span className="text-xs uppercase tracking-wide text-slate-400/80">Profile Impressions</span>
                      <h3 className="text-3xl font-semibold text-white">6.1M</h3>
                      <p className="text-xs text-slate-400">Discovery across networks</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-200">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <p className="text-xs font-medium text-emerald-300">▲ 336% vs last month</p>
                </CardContent>
              </Card>
              <Card className="glass-base glass-high border border-white/5 p-6 md:p-8 transition duration-300 ease-out hover:-translate-y-1 hover:bg-white/12">
                <CardHeader className="p-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <span className="text-xs uppercase tracking-wide text-slate-400/80">Profile Interactions</span>
                      <h3 className="text-3xl font-semibold text-white">162.8K</h3>
                      <p className="text-xs text-slate-400">Likes, saves, shares</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-200">
                      <Heart className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <p className="text-xs font-medium text-emerald-300">▲ 69% vs last month</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <EngagementChartClient engagementData={displayEngagementData} />
              <FollowersTrendClient followerData={displayFollowerData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PlatformChartClient platformData={displayPlatformData} />
              <PlatformDistributionClient platformData={displayPlatformData} />
            </div>

            <Card className="mt-6 glass-base glass-mid border border-white/5 p-6 md:p-8 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-200">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">AI Insight</p>
                  <p className="mt-2 text-sm text-slate-300">
                    Engagement is <span className="text-emerald-300">210% higher</span> this week, driven by LinkedIn posts about
                    product updates. Consider scheduling an additional update for Thursday morning.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
