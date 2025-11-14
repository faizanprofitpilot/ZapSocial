"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { InboxFilterGroup } from "./InboxView";
import { Button } from "@/components/ui/button";

interface FiltersDropdownProps {
  filters: InboxFilterGroup[];
  activeFilters: string[];
  typeFilters: string[];
  onToggleFilter: (id: string) => void;
  onToggleTypeFilter: (id: string) => void;
  onClearAll?: () => void;
}

const platformLogos: Record<string, string> = {
  instagram: "/Instagram logo.png",
  linkedin: "/Linkedin logo.png",
  facebook: "/Facebook logo.png",
};

export function FiltersDropdown({
  filters,
  activeFilters,
  typeFilters,
  onToggleFilter,
  onToggleTypeFilter,
  onClearAll,
}: FiltersDropdownProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Count active filters
  const activeCount = activeFilters.length + typeFilters.length;

  // Close on click outside
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
      // Close on escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [open]);

  return (
    <div className="relative inline-flex">
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition",
          open
            ? "border-brand-400/50 bg-brand-500/20 text-white"
            : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white hover:border-white/20",
          activeCount > 0 && "border-brand-400/40 bg-brand-500/10"
        )}
      >
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">Filters</span>
        {activeCount > 0 && (
          <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180"
          )}
        />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-[420px] max-h-[600px] overflow-y-auto rounded-2xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl p-4 shadow-2xl sm:w-[420px]"
            style={{ 
              maxHeight: "min(600px, calc(100vh - 200px))",
            }}
          >
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-semibold text-white">Filters</h3>
                {activeCount > 0 && (
                  <span className="text-xs text-gray-400">
                    {activeCount} {activeCount === 1 ? "active" : "active"}
                  </span>
                )}
              </div>

              {/* Filter Groups */}
              <div className="space-y-5">
                {filters.map((group) => (
                  <div key={group.id} className="space-y-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => {
                        const isActive = activeFilters.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onToggleFilter(item.id)}
                            className={cn(
                              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                              isActive
                                ? `${item.color} shadow-[0_0_12px_rgba(59,130,246,0.4)] scale-105`
                                : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            {group.id === "channels" && platformLogos[item.id] ? (
                              <Image
                                src={platformLogos[item.id]}
                                alt={item.label}
                                width={14}
                                height={14}
                                className="object-contain"
                              />
                            ) : null}
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Conversation Type */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">
                    Conversation Type
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "message", label: "Messages" },
                      { id: "comment", label: "Comments" },
                    ].map((type) => {
                      const isActive = typeFilters.includes(type.id);
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => onToggleTypeFilter(type.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                            isActive
                              ? "border-brand-400/40 bg-brand-500/20 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)] scale-105"
                              : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status Filters */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">
                    Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "open", label: "Open", color: "border-amber-400/40 bg-amber-500/15 text-amber-200" },
                      { id: "resolved", label: "Resolved", color: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" },
                    ].map((status) => {
                      const isActive = activeFilters.includes(`status-${status.id}`);
                      return (
                        <button
                          key={status.id}
                          type="button"
                          onClick={() => onToggleFilter(`status-${status.id}`)}
                          className={cn(
                            "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                            isActive
                              ? `${status.color} shadow-[0_0_12px_rgba(59,130,246,0.4)] scale-105`
                              : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          {status.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              {(activeFilters.length > 0 || typeFilters.length > 0) && (
                <div className="border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (onClearAll) {
                        onClearAll();
                      } else {
                        // Fallback: clear each filter individually
                        activeFilters.forEach((id) => {
                          if (activeFilters.includes(id)) {
                            onToggleFilter(id);
                          }
                        });
                        typeFilters.forEach((id) => {
                          if (typeFilters.includes(id)) {
                            onToggleTypeFilter(id);
                          }
                        });
                      }
                      setOpen(false);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

