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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-50">
            {monthNames[currentMonth]} {currentYear}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-xs text-gray-400 text-center font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
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
                    ? "border-brand-400 bg-brand-900/20"
                    : "border-white/5 hover:border-white/20"
                  }
                  ${posts.length > 0 || dayHolidays.length > 0 ? "bg-white/5" : ""}
                `}
              >
                <div className="h-full flex flex-col items-center justify-center p-1">
                  <span
                    className={`text-xs font-medium ${
                      today ? "text-brand-400" : "text-gray-300"
                    }`}
                  >
                    {day}
                  </span>
                  {posts.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-0.5" />
                  )}
                  {dayHolidays.length > 0 && (
                    <span className="text-[8px] mt-0.5">🎉</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Link href="/calendar" className="mt-4 block">
          <Button variant="outline" className="w-full text-xs" size="sm">
            <CalendarIcon className="w-3 h-3 mr-2" />
            Open Full Calendar
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

