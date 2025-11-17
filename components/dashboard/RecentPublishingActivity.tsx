"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type RecentPublishingActivityProps = {
  posts: Array<{
    id: string;
    status: string;
    platform: string;
    caption: string;
    updated_at: string;
    created_at: string;
    engagement_data?: any;
  }>;
  onRetry?: (postId: string) => void;
};

const getPlatformLogo = (platform: string) => {
  switch (platform) {
    case "instagram":
      return "/Instagram logo.png";
    case "linkedin":
      return "/Linkedin logo.png";
    case "facebook":
      return "/Facebook logo.png";
    default:
      return null;
  }
};

export function RecentPublishingActivity({ posts, onRetry }: RecentPublishingActivityProps) {
  // Filter and sort recent publishing activity
  const recentActivity = posts
    .filter((post) => {
      // Show published, scheduled, or failed posts
      return post.status === "published" || post.status === "scheduled" || post.status === "failed";
    })
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at);
      const dateB = new Date(b.updated_at || b.created_at);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 6);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "scheduled":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "failed":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "published":
        return "Published";
      case "scheduled":
        return "Scheduled";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  };

  return (
    <Card className="glass-base glass-mid border border-white/5 p-6 md:p-8">
      <CardHeader className="flex items-center justify-between p-0">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-200" />
          <CardTitle className="text-base font-semibold text-white">
            Recent Publishing Activity
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-5">
        <div className="space-y-3">
          {recentActivity.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">
              No publishing activity yet. Create and publish your first post!
            </p>
          )}
          {recentActivity.map((activity) => {
            const logo = getPlatformLogo(activity.platform);
            const timestamp = activity.updated_at || activity.created_at;
            const statusColor = getStatusColor(activity.status);
            const statusLabel = getStatusLabel(activity.status);

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3 transition-all hover:border-white/10 hover:bg-white/10"
              >
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 flex-shrink-0">
                  {logo ? (
                    <Image
                      src={logo}
                      alt={activity.platform}
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                    />
                  ) : (
                    <Activity className="h-4 w-4 text-brand-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
                      {statusLabel}
                    </span>
                    <span className="text-xs text-slate-400">
                      {timestamp
                        ? formatDistanceToNow(typeof timestamp === "string" ? parseISO(timestamp) : new Date(timestamp), {
                            addSuffix: true,
                          })
                        : "Just now"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 line-clamp-1">
                    {activity.caption || `Post on ${activity.platform}`}
                  </p>
                  {activity.status === "failed" && onRetry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={() => onRetry(activity.id)}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry Publish
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

