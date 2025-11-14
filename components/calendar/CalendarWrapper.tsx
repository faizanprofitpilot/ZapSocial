"use client";

import dynamic from "next/dynamic";
import { CalendarView } from "./CalendarView";

const CalendarViewClient = dynamic(() => Promise.resolve({ default: CalendarView }), {
  ssr: false,
});

export default CalendarViewClient;

