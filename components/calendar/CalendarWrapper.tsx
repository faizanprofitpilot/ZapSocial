"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { CalendarView } from "./CalendarView";

const CalendarViewClient = dynamic(() => Promise.resolve({ default: CalendarView }), {
  ssr: false,
});

export default function CalendarWrapper({ events }: { events: any[] }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-gray-400">Loading calendar...</p>
      </div>
    }>
      <CalendarViewClient events={events} />
    </Suspense>
  );
}

