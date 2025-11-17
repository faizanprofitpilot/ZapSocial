"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Plug,
  BarChart3,
  Settings,
  MoreVertical,
  Inbox,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/ai-cmo", label: "AI CMO", icon: MessageSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/posts", label: "Library", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const bottomNavItems: NavItem[] = [
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  // Create Supabase client only at runtime, never during build
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);

  const isPlatformRoute = pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/posts") ||
    pathname?.startsWith("/calendar") ||
    pathname?.startsWith("/integrations") ||
    pathname?.startsWith("/analytics") ||
    pathname?.startsWith("/copilot") ||
    pathname?.startsWith("/ai-cmo") ||
    pathname?.startsWith("/settings") ||
    pathname?.startsWith("/inbox");

  // Initialize Supabase client only in useEffect (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setSupabase(createClient());
      } catch (error) {
        console.error('Failed to create Supabase client:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (isPlatformRoute && supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
      });
    }
  }, [isPlatformRoute, supabase]);

  if (!isPlatformRoute) return null;

  return (
    <aside
      className={cn(
        "hidden md:flex fixed top-0 left-0 bottom-0 z-[9998] border-r border-white/10 bg-gradient-to-b from-[#0f172a]/95 to-[#1e293b]/95 backdrop-blur-xl transition-all duration-300 md:w-60"
      )}
    >
      <div className="flex h-full w-full flex-col px-3 py-4">
        <div className="flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-2 py-2 text-white transition-colors duration-200 hover:bg-white/5"
          >
            <div className="relative h-9 w-9 flex-shrink-0">
              <Image
                src="/zapsocial-logo.png"
                alt="ZapSocial Logo"
                fill
                sizes="36px"
                className="object-contain"
                priority
              />
            </div>
            <span className="whitespace-nowrap text-lg font-semibold tracking-tight">ZapSocial</span>
          </Link>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {mainNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname ? pathname === href || pathname.startsWith(`${href}/`) : false;

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-gradient-to-r from-brand-500/30 via-purple-500/25 to-cyan-500/20 text-white shadow-[0_0_25px_rgba(59,130,246,0.25)]"
                    : "text-gray-300 hover:text-gray-100 hover:bg-white/5"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors duration-200",
                    isActive ? "text-white" : "text-gray-400"
                  )}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1">
          <div className="mb-2 border-t border-white/10"></div>
          {bottomNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname ? pathname === href || pathname.startsWith(`${href}/`) : false;

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-gradient-to-r from-brand-500/30 via-purple-500/25 to-cyan-500/20 text-white shadow-[0_0_25px_rgba(59,130,246,0.25)]"
                    : "text-gray-300 hover:text-gray-100 hover:bg-white/5"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors duration-200",
                    isActive ? "text-white" : "text-gray-400"
                  )}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-white/5 bg-white/5/50 p-3">
          <div className="flex items-center gap-3">
            {(() => {
              const name = user?.user_metadata?.full_name || user?.user_metadata?.name;
              const displayName = name || user?.email?.split("@")[0] || "User";
              const avatarInitial = name ? name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || "U");

              return (
                <>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-brand-500/30">
                    {avatarInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{displayName}</p>
                    <p className="truncate text-xs text-gray-400">{user?.email || ""}</p>
                  </div>
                </>
              );
            })()}

            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-9 w-9 rounded-full border border-white/10 bg-white/5 text-gray-300 transition hover:border-white/20 hover:text-white"
              disabled={loading || !supabase}
              onClick={async () => {
                if (!supabase) return;
                setLoading(true);
                await supabase.auth.signOut();
                router.push("/");
                router.refresh();
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}


