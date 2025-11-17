"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { getCurrentAndNextYearHolidays } from "@/lib/holidays";

type MiniCalendarProps = {
  scheduledPosts: Array<{
    id: string;
    title: string;
    start: string;
    platform: string;
  }>;
};

export function MiniCalendar({ scheduledPosts }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const holidays = getCurrentAndNextYearHolidays();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentYear, currentMonth + direction, 1));
  };

  const getDayEvents = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayPosts = scheduledPosts.filter((post) => post.start.startsWith(dateStr));
    const dayHolidays = holidays.filter((holiday) => holiday.start.startsWith(dateStr));
    return { posts: dayPosts, holidays: dayHolidays };
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  return (
    <Card className="glass-light border border-white/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-50">
            {monthNames[currentMonth]} {currentYear}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1.5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-[10px] text-gray-400 text-center font-medium py-0.5">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const { posts, holidays: dayHolidays } = getDayEvents(day);
            const today = isToday(day);

            return (
              <div
                key={day}
                className={`
                  aspect-square rounded-lg border-2 transition-all cursor-pointer
                  ${today
                    ? "border-cyan-400 bg-cyan-900/20"
                    : "border-white/5 hover:border-white/20"
                  }
                  ${posts.length > 0 || dayHolidays.length > 0 ? "bg-white/5" : ""}
                `}
              >
                <div className="h-full flex flex-col items-center justify-center p-0.5">
                  <span
                    className={`text-[11px] font-medium ${
                      today ? "text-cyan-400" : "text-gray-300"
                    }`}
                  >
                    {day}
                  </span>
                  {posts.length > 0 && (
                    <div className="w-1 h-1 rounded-full bg-blue-400 mt-0.5" />
                  )}
                  {dayHolidays.length > 0 && (
                    <span className="text-[7px] mt-0.5">🎉</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Link href="/calendar" className="mt-2 block">
          <Button variant="outline" className="w-full text-xs h-7" size="sm">
            <CalendarIcon className="w-3 h-3 mr-1.5" />
            Open Full Calendar
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

type WeeklySummaryProps = {
  scheduledPosts: Array<{
    id: string;
    start: string;
  }>;
};

export function WeeklySummary({ scheduledPosts }: WeeklySummaryProps) {
  // Get next 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return date;
  });

  const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Count posts for each day in the next 7 days
  const weeklyCounts = next7Days.map((date) => {
    const dateStr = date.toISOString().split("T")[0];
    const count = scheduledPosts.filter((post) => {
      const postDate = new Date(post.start);
      return postDate.toISOString().split("T")[0] === dateStr;
    }).length;
    return {
      day: weekdayNames[date.getDay() === 0 ? 6 : date.getDay() - 1], // Adjust to Mon-Sun
      date: date,
      count,
    };
  });

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
        This Week&apos;s Schedule
      </h4>
      <div className="space-y-2">
        {weeklyCounts.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-xs text-gray-300"
          >
            <span className="font-medium">{item.day}</span>
            <span className={item.count > 0 ? "text-white" : "text-gray-500"}>
              {item.count > 0 ? `${item.count} post${item.count > 1 ? "s" : ""}` : "0"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

