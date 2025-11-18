"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, FileText, TrendingUp, Inbox } from "lucide-react";

type TodaySummaryProps = {
  posts: Array<{
    id: string;
    status: string;
    scheduled_at: string | null;
  }>;
  metrics?: {
    engagement_24h?: number;
  };
  inboxCount?: number;
};

export function TodaySummary({ posts, metrics, inboxCount = 0 }: TodaySummaryProps) {
  // Calculate scheduled today
  const scheduledToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return posts.filter((post) => {
      if (!post.scheduled_at || post.status !== "scheduled") return false;
      const scheduledDate = new Date(post.scheduled_at);
      return scheduledDate >= today && scheduledDate < tomorrow;
    }).length;
  }, [posts]);

  // Calculate drafts
  const draftsCount = useMemo(
    () => posts.filter((post) => post.status === "draft").length,
    [posts]
  );

  // Get engagement (mock for now, can be real data later)
  const engagement = metrics?.engagement_24h || 0;
  const engagementDisplay = engagement > 0 ? `+${engagement}%` : engagement < 0 ? `${engagement}%` : "0%";
  const engagementColor = engagement > 0 ? "text-green-400" : engagement < 0 ? "text-red-400" : "text-gray-400";

  const statCards = [
    {
      label: "Scheduled Today",
      value: scheduledToday > 0 ? scheduledToday : "No posts scheduled",
      icon: Calendar,
      gradient: "from-blue-500/20 to-blue-600/20",
      iconColor: "text-blue-400",
    },
    {
      label: "Drafts Needing Review",
      value: draftsCount,
      icon: FileText,
      gradient: "from-cyan-500/20 to-cyan-600/20",
      iconColor: "text-cyan-400",
    },
    {
      label: "Engagement (last 24h)",
      value: engagementDisplay,
      icon: TrendingUp,
      gradient: "from-green-500/20 to-green-600/20",
      iconColor: engagementColor,
      valueClass: engagementColor,
    },
    {
      label: "New Inbox Messages",
      value: inboxCount,
      icon: Inbox,
      gradient: "from-orange-500/20 to-orange-600/20",
      iconColor: "text-orange-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card
            key={idx}
            className={`
              glass-base glass-low border border-white/5
              bg-gradient-to-br ${stat.gradient}
              transition-all duration-300
              hover:border-white/20 hover:bg-white/10 hover:-translate-y-0.5
              h-full flex flex-col
            `}
          >
            <div className="flex flex-col h-full p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`h-4 w-4 ${stat.iconColor} flex-shrink-0`} />
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide truncate">
                  {stat.label}
                </p>
              </div>
              <p
                className={`text-2xl font-bold text-white mt-auto ${
                  stat.valueClass || ""
                }`}
              >
                {stat.value}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

