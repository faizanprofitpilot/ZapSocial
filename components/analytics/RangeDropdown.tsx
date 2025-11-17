"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarRange, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_RANGES = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Year to date", value: "ytd" },
];

interface RangeDropdownProps {
  value?: string;
  onChange?: (value: string) => void;
  options?: { label: string; value: string }[];
}

export function RangeDropdown({ value = "30d", onChange, options = DEFAULT_RANGES }: RangeDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(value);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  function handleSelect(range: { label: string; value: string }) {
    setSelected(range.value);
    onChange?.(range.value);
    setOpen(false);
  }

  const activeLabel = options.find((option) => option.value === selected)?.label ?? "Last 30 days";

  return (
    <div className="relative inline-flex text-sm text-gray-100">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-gray-200 hover:bg-white/10"
      >
        <CalendarRange className="h-4 w-4 text-cyan-200" />
        <span>{activeLabel}</span>
      </Button>

      {open ? (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-[#111a2d]/95 p-2 text-sm text-gray-200 shadow-2xl backdrop-blur"
        >
          <div className="grid gap-1">
            {options.map((option) => {
              const isActive = option.value === selected;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10",
                    isActive && "bg-white/15"
                  )}
                >
                  <span>{option.label}</span>
                  {isActive && <Check className="h-4 w-4 text-emerald-300" />}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
