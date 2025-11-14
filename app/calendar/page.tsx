import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CalendarViewClient from "@/components/calendar/CalendarWrapper";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Fetch scheduled posts from posts table
  const { data: scheduledPosts } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "scheduled")
    .not("scheduled_at", "is", null)
    .order("scheduled_at", { ascending: true });

  // Fetch schedules from schedules table (legacy)
  const { data: schedules } = await supabase
    .from("schedules")
    .select("*, posts(caption)")
    .eq("user_id", user.id)
    .order("datetime", { ascending: true });

  // Format scheduled posts as calendar events
  const scheduledPostEvents = scheduledPosts?.map((post: any) => ({
    id: post.id,
    title: post.caption?.substring(0, 30) || "Scheduled Post",
    start: post.scheduled_at,
    platform: Array.isArray(post.platform) ? post.platform[0] : post.platform,
    status: post.status,
    caption: post.caption,
    image_url: post.image_url,
    isHoliday: false,
    type: "post",
  })) || [];

  // Format schedules as calendar events (legacy)
  const scheduleEvents = schedules?.map((schedule: any) => ({
    id: schedule.id,
    title: schedule.posts?.caption?.substring(0, 30) || "Scheduled Post",
    start: schedule.datetime,
    platform: schedule.platform,
    status: schedule.status,
    caption: schedule.posts?.caption,
    isHoliday: false,
    type: "schedule",
  })) || [];

  // Combine both types of events
  const calendarEvents = [...scheduledPostEvents, ...scheduleEvents];

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <CalendarViewClient events={calendarEvents} />
      </div>
    </div>
  );
}
