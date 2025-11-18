"use client";

import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TodaySummary } from "@/components/dashboard/TodaySummary";
import { FloatingCreateButton } from "@/components/dashboard/FloatingCreateButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  CalendarDays,
  MessageCircle,
  PenSquare,
  Sparkles,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type Suggestion = {
  platform: string;
  caption: string;
  hashtags: string[];
};

function DashboardContent() {
  const router = useRouter();
  // Create Supabase client only at runtime, never during build
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  
  // Load suggestions from localStorage on mount, or initialize as empty
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dashboard_suggestions');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });
  const [posts, setPosts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingSuggestions, setRefreshingSuggestions] = useState(false);

  // Initialize Supabase client only in useEffect (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setSupabase(createClient());
      } catch (error) {
        console.error('Failed to create Supabase client:', error);
      }
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      const response = await fetch("/api/copilot/suggestions");
      const data = await response.json();
      if (response.ok && data.suggestions) {
        const hasFacebookSuggestion = data.suggestions.some(
          (item: Suggestion) => item.platform?.toLowerCase() === "facebook"
        );

        const facebookFallback: Suggestion = {
          platform: "facebook",
          caption:
            "Celebrate your community with a heartfelt post thanking them for their ongoing support. Highlight a recent milestone or customer story to build deeper connections.",
          hashtags: ["CommunityLove", "ThankfulThursday", "ZapSocial"],
        };

        const normalizedSuggestions = hasFacebookSuggestion
          ? data.suggestions
          : [...data.suggestions, facebookFallback];

        setSuggestions(normalizedSuggestions);
        
        // Store in localStorage so they persist across page loads
        if (typeof window !== 'undefined') {
          localStorage.setItem('dashboard_suggestions', JSON.stringify(normalizedSuggestions));
        }
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    }
  }, []);

  const handleRefreshSuggestions = async () => {
    setRefreshingSuggestions(true);
    await loadSuggestions();
    setRefreshingSuggestions(false);
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load posts
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Load schedules
      const { data: schedulesData } = await supabase
        .from("schedules")
        .select("*, posts(caption)")
        .eq("user_id", user.id)
        .order("datetime", { ascending: true });

      // Load suggestions only if they don't exist (first time visit)
      // Check if localStorage has suggestions, if not, fetch new ones
      if (typeof window !== 'undefined') {
        const hasStoredSuggestions = localStorage.getItem('dashboard_suggestions');
        if (!hasStoredSuggestions) {
          await loadSuggestions();
        }
      }

      // Load notifications from connected platforms
      try {
        const { data: notificationsData, error: notificationsError } = await supabase
          .from("notifications")
          .select("id, platform, message, metadata, created_at, updated_at, title, subtitle")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30);

        if (!notificationsError && notificationsData) {
          const normalized = notificationsData.map((notification) => {
            let metadata = notification.metadata;
            if (metadata && typeof metadata === "string") {
              try {
                metadata = JSON.parse(metadata);
              } catch (error) {
                metadata = null;
              }
            }
            return {
              ...notification,
              metadata,
            };
          });

          setNotifications(normalized);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }

      setPosts(postsData || []);
      setSchedules(schedulesData || []);
      setLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const getPlatformLogo = (platform: string) => {
    switch (platform) {
      case "instagram":
        return "/Instagram logo.png";
      case "linkedin":
        return "/Linkedin logo.png";
      case "x":
        return "/X logo.png";
      case "facebook":
        return "/Facebook logo.png";
      default:
        return null;
    }
  };

  const handleCreateFromSuggestion = (suggestion: Suggestion) => {
    const params = new URLSearchParams({
      platform: suggestion.platform,
      draft: suggestion.caption,
    });
    router.push(`/dashboard/create?${params.toString()}`);
  };

  const quickActions = useMemo(() => [
    {
      label: "Create Post",
      icon: <PenSquare className="h-4 w-4" />,
      onClick: () => router.push("/dashboard/create"),
    },
    {
      label: "View Calendar",
      icon: <CalendarDays className="h-4 w-4" />,
      onClick: () => router.push("/calendar"),
    },
    {
      label: "Ask Copilot",
      icon: <MessageCircle className="h-4 w-4" />,
      onClick: () => router.push("/dashboard/create?copilot=open"),
    },
  ], [router]);

  const draftsCount = useMemo(() => posts.filter((post) => post.status === "draft").length, [posts]);
  const scheduledCount = useMemo(
    () => schedules.filter((schedule) => new Date(schedule.datetime) > new Date()).length,
    [schedules]
  );

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    [...posts, ...schedules].forEach((item: any) => {
      const platform = (item.platform || item.posts?.platform || "").toLowerCase();
      if (!platform) return;
      counts[platform] = (counts[platform] || 0) + 1;
    });
    return counts;
  }, [posts, schedules]);

  const topPlatform = useMemo(() => {
    const entries = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
    return entries.length > 0 ? entries[0][0] : "instagram";
  }, [platformCounts]);

  // Format schedules for weekly summary
  const calendarEvents = schedules?.map((schedule: any) => ({
    id: schedule.id,
    title: schedule.posts?.caption?.substring(0, 30) || "Scheduled Post",
    start: schedule.datetime,
    platform: schedule.platform,
  })) || [];

  const allCalendarEvents = calendarEvents;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6">
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="ghost"
                size="sm"
                onClick={action.onClick}
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-gray-200 hover:bg-white/15 transition-all duration-200"
              >
                <span className="rounded-full bg-white/10 p-1 text-cyan-200 group-hover:text-cyan-100 transition-colors">
                  {action.icon}
                </span>
                {action.label}
                <ArrowUpRight className="h-3.5 w-3.5 text-gray-500" />
              </Button>
            ))}
          </div>

          {/* Today at a Glance Summary */}
          <TodaySummary posts={posts} inboxCount={notifications.length} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Suggested Posts */}
            <div>
              {suggestions.length > 0 && (
                <Card className="glass-base glass-high border border-white/10 h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-4 px-6 pt-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-cyan-300" />
                      <CardTitle className="text-base font-semibold text-white">Suggested Posts</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshSuggestions}
                      disabled={refreshingSuggestions}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {refreshingSuggestions ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Refreshing...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Refresh</span>
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {suggestions.map((suggestion, idx) => {
                        const logo = getPlatformLogo(suggestion.platform);
                        return (
                          <Card
                            key={idx}
                            className="glass-base glass-mid border border-white/5 p-5 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 cursor-pointer group"
                            onClick={() => handleCreateFromSuggestion(suggestion)}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              {logo && (
                                <Image src={logo} alt={suggestion.platform} width={20} height={20} className="h-5 w-5 object-contain flex-shrink-0" />
                              )}
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                {suggestion.platform}
                              </span>
                            </div>
                            <p className="text-sm text-slate-200 line-clamp-3 flex-1">
                              {suggestion.caption}
                            </p>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* This Week's Schedule */}
            <div>
              <Card className="glass-base glass-high border border-white/10 h-full">
                <CardHeader className="pb-4 px-6 pt-6">
                  <CardTitle className="text-base font-semibold text-white">This Week&apos;s Schedule</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-2.5">
                    {Array.from({ length: 7 }, (_, i) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const date = new Date(today);
                      date.setDate(date.getDate() + i);
                      const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                      const dayName = weekdayNames[date.getDay() === 0 ? 6 : date.getDay() - 1];
                      const dateStr = date.toISOString().split("T")[0];
                      const count = allCalendarEvents.filter((e) => {
                        const postDate = new Date(e.start);
                        return postDate.toISOString().split("T")[0] === dateStr;
                      }).length;

                      const handleDayClick = () => {
                        router.push(`/calendar?date=${dateStr}`);
                      };

                      return (
                        <button
                          key={i}
                          onClick={handleDayClick}
                          className="flex items-center justify-between w-full text-xs py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-left"
                        >
                          <span className="font-medium text-gray-300">{dayName}</span>
                          <span className={count > 0 ? "text-white font-semibold" : "text-gray-500"}>
                            {count} posts
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Create Button */}
      <FloatingCreateButton />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
