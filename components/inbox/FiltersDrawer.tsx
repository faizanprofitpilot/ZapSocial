"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { InboxFilterGroup, InboxTag } from "./InboxView";
import { Button } from "@/components/ui/button";

interface FiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: InboxFilterGroup[];
  activeFilters: string[];
  typeFilters: string[];
  onToggleFilter: (id: string) => void;
  onToggleTypeFilter: (id: string) => void;
}

const platformLogos: Record<string, string> = {
  instagram: "/Instagram logo.png",
  linkedin: "/Linkedin logo.png",
  facebook: "/Facebook logo.png",
};

export function FiltersDrawer({
  isOpen,
  onClose,
  filters,
  activeFilters,
  typeFilters,
  onToggleFilter,
  onToggleTypeFilter,
}: FiltersDrawerProps) {

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9997] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer - Mobile: from left edge, Desktop: after sidebar */}
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed left-0 md:left-60 top-16 bottom-0 z-[9998] w-72 md:w-80 border-r border-white/10 bg-[#0f172a]/95 backdrop-blur-xl shadow-2xl"
            style={{ willChange: "transform" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full flex-col gap-4 p-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Filters</h2>
                <Button
                  onClick={onClose}
                  className="h-8 w-8 rounded-full border border-white/10 bg-white/5 p-0 text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Filter Groups */}
              <div className="flex-1 space-y-6 overflow-y-auto">
                {filters.map((group) => (
                  <div key={group.id} className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onToggleFilter(item.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                            activeFilters.includes(item.id)
                              ? `${item.color} shadow-[0_0_18px_rgba(59,130,246,0.35)]`
                              : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white"
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
                      ))}
                    </div>
                  </div>
                ))}

                {/* Conversation Type */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">
                    Conversation Type
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "message", label: "Messages" },
                      { id: "comment", label: "Comments" },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => onToggleTypeFilter(type.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                          typeFilters.includes(type.id)
                            ? "border-cyan-400/40 bg-cyan-500/20 text-white shadow-[0_0_18px_rgba(59,130,246,0.35)]"
                            : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filters */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">
                    Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "open", label: "Open", color: "border-amber-400/40 bg-amber-500/15 text-amber-200" },
                      { id: "resolved", label: "Resolved", color: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" },
                    ].map((status) => (
                      <button
                        key={status.id}
                        onClick={() => onToggleFilter(`status-${status.id}`)}
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                          activeFilters.includes(`status-${status.id}`)
                            ? `${status.color} shadow-[0_0_18px_rgba(59,130,246,0.35)]`
                            : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white"
                        )}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

