"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Clock4,
  Filter,
  Plus,
  Search,
  Edit,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const platformMeta: Record<
  string,
  {
    label: string;
    logo?: string;
    color: string;
  }
> = {
  instagram: {
    label: "Instagram",
    logo: "/Instagram logo.png",
    color: "from-pink-500/30 via-rose-500/20 to-pink-600/10 text-pink-200",
  },
  linkedin: {
    label: "LinkedIn",
    logo: "/Linkedin logo.png",
    color: "from-blue-500/30 via-blue-500/15 to-blue-600/10 text-blue-200",
  },
  facebook: {
    label: "Facebook",
    logo: "/Facebook logo.png",
    color: "from-blue-600/30 via-blue-600/15 to-blue-700/10 text-blue-200",
  },
};

const viewModes = [
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "month", label: "Month" },
] as const;

type ViewMode = (typeof viewModes)[number]["id"];

type SchedulerEvent = {
  id: string;
  title: string;
  start: string;
  platform: string;
  status: string;
  caption?: string;
  isHoliday?: boolean;
};

interface CalendarViewProps {
  events: SchedulerEvent[];
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized} ${suffix}`;
}

function sameDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export function CalendarView({ events }: CalendarViewProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("week");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const caption = event.caption?.toLowerCase() ?? "";
      const title = event.title?.toLowerCase() ?? "";
      const matchesSearch =
        !searchTerm || caption.includes(searchTerm.toLowerCase()) || title.includes(searchTerm.toLowerCase());
      const matchesPlatform =
        platformFilter.length === 0 || platformFilter.includes(event.platform);
      return matchesSearch && matchesPlatform;
    });
  }, [events, searchTerm, platformFilter]);

  const days = useMemo(() => {
    if (view === "day") {
      return [new Date(referenceDate)];
    }

    if (view === "month") {
      const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
      const array: Date[] = [];
      for (let day = start.getDate(); day <= end.getDate(); day++) {
        array.push(new Date(referenceDate.getFullYear(), referenceDate.getMonth(), day));
      }
      return array;
    }

    const start = startOfWeek(referenceDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [referenceDate, view]);

  const eventsByDayHour = useMemo(() => {
    const map = new Map<string, SchedulerEvent[]>();

    filteredEvents.forEach((event) => {
      const date = new Date(event.start);
      const key = `${formatDateKey(date)}-${date.getHours()}`;
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    });

    return map;
  }, [filteredEvents]);

  const handlePrev = () => {
    if (view === "day") {
      setReferenceDate(addDays(referenceDate, -1));
    } else if (view === "month") {
      setReferenceDate(new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1));
    } else {
      setReferenceDate(addDays(referenceDate, -7));
    }
  };

  const handleNext = () => {
    if (view === "day") {
      setReferenceDate(addDays(referenceDate, 1));
    } else if (view === "month") {
      setReferenceDate(new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1));
    } else {
      setReferenceDate(addDays(referenceDate, 7));
    }
  };

  const formattedRange = useMemo(() => {
    if (view === "day") {
      return referenceDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }

    if (view === "month") {
      return referenceDate.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    }

    const start = startOfWeek(referenceDate);
    const end = addDays(start, 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const formatOptions: Intl.DateTimeFormatOptions = sameMonth
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric" };

    return `${start.toLocaleDateString(undefined, formatOptions)} – ${end.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: start.getFullYear() === end.getFullYear() ? undefined : "numeric",
    })}`;
  }, [referenceDate, view]);

  const allPlatforms = useMemo(() => {
    const unique = new Set(events.map((event) => event.platform));
    return Array.from(unique);
  }, [events]);

  const renderEventCard = (event: SchedulerEvent) => {
    const meta = platformMeta[event.platform] ?? platformMeta.instagram;

    return (
      <div className={cn("group relative w-full rounded-2xl border px-3 py-2 text-xs shadow-sm transition",
        "border-white/10 bg-white/10 hover:border-brand-500/40 hover:bg-brand-500/10")}
      >
        <div className="flex items-center gap-2">
          {meta.logo ? (
          <Image
              src={meta.logo}
              alt={meta.label}
            width={16}
            height={16}
              className="flex-shrink-0"
            />
          ) : (
            <span className="text-brand-200">•</span>
          )}
          <span className="flex-1 truncate text-gray-100">{event.title}</span>
        </div>
        <div className="absolute -top-3 right-2 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] uppercase text-gray-300">
          {event.status}
        </div>
        <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-2xl border border-white/10 bg-[#0f172a]/95 p-3 shadow-2xl shadow-black/40 group-hover:block">
          <p className="mb-3 text-xs font-semibold text-white">{event.title}</p>
          {event.caption && <p className="text-xs text-gray-300">{event.caption}</p>}
          <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
            <Clock4 className="h-3 w-3" />
            {new Date(event.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            <button className="flex-1 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-gray-200 hover:border-brand-400 hover:text-white">
              <Edit className="mr-1 h-3 w-3 inline-block" /> Edit
            </button>
            <button className="flex-1 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-gray-200 hover:border-brand-400 hover:text-white">
              <CalendarDays className="mr-1 h-3 w-3 inline-block" /> Reschedule
            </button>
            <button className="rounded-lg border border-red-400/40 bg-red-500/10 px-2 py-1 text-red-200 hover:border-red-400 hover:text-red-100">
              <Trash2 className="mr-1 h-3 w-3 inline-block" /> Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleCreateFromSlot = (date: Date) => {
    router.push(`/dashboard/create?draft=${encodeURIComponent(date.toISOString())}`);
  };

  return (
    <div className="space-y-5">
      <div className="glass-base glass-mid flex flex-col gap-3 rounded-3xl p-4 shadow-lg shadow-black/30 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={handlePrev}
            className="rounded-full border border-white/10 bg-white/10 p-2 text-gray-200 hover:border-white/30 hover:text-white"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            className="rounded-full border border-white/10 bg-white/10 p-2 text-gray-200 hover:border-white/30 hover:text-white"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="text-left">
            <p className="text-xs uppercase tracking-wide text-brand-300">Schedule</p>
            <p className="text-lg font-semibold text-white">{formattedRange}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-gray-300">
            <Search className="h-4 w-4" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search caption or idea"
              className="w-44 bg-transparent text-sm text-gray-100 focus:outline-none"
            />
          </div>
          <div className="flex rounded-full border border-white/10 bg-white/5 p-1 text-xs text-gray-300">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setView(mode.id)}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition",
                  view === mode.id
                    ? "bg-gradient-to-r from-brand-500/40 via-purple-500/40 to-cyan-500/40 text-white"
                    : "hover:bg-white/10 hover:text-white"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "month" ? (
        <div className="glass-base glass-low grid gap-3 rounded-3xl p-4 shadow-lg shadow-black/30 md:grid-cols-7">
          {days.map((day) => {
            const dayEvents = filteredEvents.filter((event) => sameDay(new Date(event.start), day));
            return (
              <div key={day.toISOString()} className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/5/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">
                  {day.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                </p>
                <div className="flex flex-col gap-2">
                  {dayEvents.length === 0 ? (
                    <button
                      onClick={() => handleCreateFromSlot(day)}
                      className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 py-6 text-xs text-gray-400 hover:border-brand-400/40 hover:text-white"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Post
                    </button>
                  ) : (
                    dayEvents.map((event) => (
                      <div key={event.id} className="rounded-xl border border-white/10 bg-white/10 p-2 text-xs text-gray-100">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(event.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-base glass-low rounded-3xl p-4 shadow-xl shadow-black/30">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `80px repeat(${view === "day" ? 1 : 7}, minmax(0, 1fr))`,
            }}
          >
            <div className="sticky top-0 z-10 h-14 bg-transparent" />
            {(view === "day" ? days : days.slice(0, 7)).map((day) => (
              <div key={day.toISOString()} className="sticky top-0 z-10 h-14 border-l border-white/5 bg-white/5/60 px-3">
                <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-brand-200">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </p>
                <p className="text-sm text-gray-100">
                  {day.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </p>
              </div>
            ))}

            {HOURS.map((hour) => (
              <>
                <div key={`time-${hour}`} className="border-t border-white/5 px-2 py-4 text-xs text-gray-400">
                  {formatHour(hour)}
                </div>
                {(view === "day" ? days : days.slice(0, 7)).map((day) => {
                  const key = `${formatDateKey(day)}-${hour}`;
                  const slotEvents = eventsByDayHour.get(key) ?? [];

                  return (
                    <div
                      key={`${key}-cell`}
                      className="relative border-t border-l border-white/5 px-3 py-3"
                    >
                      {slotEvents.length === 0 ? (
                        <button
                          onClick={() => handleCreateFromSlot(
                            new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour)
                          )}
                          className="group flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-white/20 bg-white/5 text-gray-400 opacity-0 transition hover:border-brand-400/40 hover:text-white group-hover:opacity-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {slotEvents.map((event) => (
                            <div key={event.id}>{renderEventCard(event)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

