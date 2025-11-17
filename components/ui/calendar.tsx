"use client";

import * as React from "react";
import {
  addMonths,
  endOfMonth,
  format,
  getMonth,
  getYear,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  addDays,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type CalendarProps = {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  captionLayout?: "dropdown" | "buttons";
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function Calendar({ selected, onSelect, className, captionLayout = "dropdown" }: CalendarProps) {
  const [viewDate, setViewDate] = React.useState<Date>(selected ?? new Date());

  React.useEffect(() => {
    if (selected) {
      setViewDate(selected);
    }
  }, [selected]);

  const weeks = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
    const end = endOfMonth(viewDate);
    const rows: Date[][] = [];
    let current = start;
    while (current <= end || rows.length < 6) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(current);
        current = addDays(current, 1);
      }
      rows.push(week);
      if (rows.length === 6) break;
    }
    return rows;
  }, [viewDate]);

  const years = React.useMemo(() => {
    const currentYear = getYear(new Date());
    return Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);
  }, []);

  const handleSelect = (date: Date) => {
    if (!isSameMonth(date, viewDate)) {
      setViewDate(date);
    }
    onSelect?.(date);
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = Number(event.target.value);
    const updated = new Date(viewDate);
    updated.setMonth(newMonth);
    setViewDate(updated);
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = Number(event.target.value);
    const updated = new Date(viewDate);
    updated.setFullYear(newYear);
    setViewDate(updated);
  };

  return (
    <div className={cn("rounded-md border border-white/10 bg-[#0f172a] p-3 shadow-sm", className)}>
      <div className="mb-3 flex items-center justify-between">
        {captionLayout === "dropdown" ? (
          <div className="flex items-center gap-2">
            <select
              value={getMonth(viewDate)}
              onChange={handleMonthChange}
              className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-1 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {Array.from({ length: 12 }).map((_, index) => {
                const date = new Date(2000, index, 1);
                return (
                  <option key={index} value={index} className="bg-[#0f172a] text-gray-100">
                    {format(date, "LLLL")}
                  </option>
                );
              })}
            </select>
            <select
              value={getYear(viewDate)}
              onChange={handleYearChange}
              className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-1 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {years.map((year) => (
                <option key={year} value={year} className="bg-[#0f172a] text-gray-100">
                  {year}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <h3 className="text-sm font-medium text-gray-100">{format(viewDate, "LLLL yyyy")}</h3>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewDate(addMonths(viewDate, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase tracking-wide text-gray-400">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2 text-xs">
        {weeks.flat().map((date, index) => {
          const isSelected = selected ? isSameDay(date, selected) : false;
          const isCurrentMonth = isSameMonth(date, viewDate);
          return (
            <button
              key={`${date.toISOString()}-${index}`}
              type="button"
              onClick={() => handleSelect(date)}
              className={cn(
                "h-8 rounded-full border border-transparent text-gray-200 transition",
                !isCurrentMonth && "text-gray-500 opacity-60",
                isSelected
                  ? "bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white shadow"
                  : "hover:border-white/20 hover:bg-white/10"
              )}
            >
              {format(date, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
