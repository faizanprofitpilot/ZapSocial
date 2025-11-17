"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { LineChartIcon, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlatformOption = {
  label: string;
  value: string;
  icon?: string;
};

interface PlatformDropdownProps {
  options: PlatformOption[];
  onSelect?: (value: string) => void;
  placeholder?: string;
  value?: string;
}

export function PlatformDropdown({
  options,
  onSelect,
  placeholder = "All platforms",
  value,
}: PlatformDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(value ?? placeholder);

  useEffect(() => {
    if (!value) {
      setSelected(placeholder);
      return;
    }
    const match = options.find((option) => option.value === value);
    if (match) {
      setSelected(match.label);
    }
  }, [value, options, placeholder]);

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

  function handleSelect(option: PlatformOption | null) {
    if (option) {
      setSelected(option.label);
      onSelect?.(option.value);
    } else {
      setSelected(placeholder);
      onSelect?.("all");
    }
    setOpen(false);
  }

  return (
    <div className="relative inline-flex text-sm text-gray-100">
      <Button
        ref={triggerRef}
        variant="outline"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border-white/10 bg-white/10 text-gray-100 hover:bg-white/20"
      >
        <LineChartIcon className="h-4 w-4 text-cyan-200" />
        <span className="whitespace-nowrap">{selected}</span>
      </Button>

      {open ? (
        <div
          ref={menuRef}
          className="absolute left-0 z-50 mt-2 w-56 rounded-2xl border border-white/10 bg-[#121a2f]/95 p-2 shadow-2xl backdrop-blur"
        >
          <div
            role="menuitem"
            tabIndex={0}
            onClick={() => handleSelect(null)}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-200 hover:bg-white/10"
          >
            <LineChartIcon className="h-4 w-4 text-cyan-200" />
            <span className="flex-1">All platforms</span>
            {selected === placeholder && <Check className="h-4 w-4 text-emerald-300" />}
          </div>
          <div className="my-2 h-px bg-white/10" />
          <div className="grid gap-1">
            {options.map((option) => {
              const isActive = selected === option.label;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-gray-200 transition hover:bg-white/10",
                    isActive && "bg-white/10"
                  )}
                >
                  {option.icon ? (
                    <Image
                      src={option.icon}
                      alt={option.label}
                      width={16}
                      height={16}
                      className="h-4 w-4 object-contain"
                    />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-white/60" />
                  )}
                  <span className="flex-1">{option.label}</span>
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
