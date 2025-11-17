"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function AIEngagementSummary() {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [stats, setStats] = useState({
    todayReplies: 0,
    weekReplies: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSupabase(createClient());
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const loadStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Get today's replies
        const { data: todayData } = await supabase
          .from("comments")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("replied", true)
          .gte("replied_at", today.toISOString());

        // Get week's replies
        const { data: weekData } = await supabase
          .from("comments")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("replied", true)
          .gte("replied_at", weekAgo.toISOString());

        setStats({
          todayReplies: todayData?.length || 0,
          weekReplies: weekData?.length || 0,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error loading engagement stats:", error);
        setStats({ todayReplies: 0, weekReplies: 0, isLoading: false });
      }
    };

    loadStats();
  }, [supabase]);

  return (
    <Card className="glass-base glass-mid border border-white/10">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 p-2">
            <MessageCircle className="h-5 w-5 text-cyan-400" />
          </div>
          <CardTitle className="text-base font-semibold text-white">AI Auto-Engage</CardTitle>
        </div>
        <Link href="/automation/comments">
          <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-white">
            View All
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{stats.isLoading ? "—" : stats.todayReplies}</span>
            <span className="text-xs text-gray-400">today</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <TrendingUp className="h-3 w-3" />
            <span>{stats.weekReplies} replies this week</span>
          </div>
        </div>
        <Link href="/automation/comments">
          <Button
            variant="outline"
            className="w-full border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
          >
            View Comment Logs
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

