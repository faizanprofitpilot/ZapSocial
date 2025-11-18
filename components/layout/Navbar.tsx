"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Bell, Search, Sparkles } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export function Navbar({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  // Create Supabase client only at runtime, never during build
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);

  // Determine if we're on a platform route
  const isPlatformRoute = Boolean(
    pathname && (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/posts") ||
      pathname.startsWith("/calendar") ||
      pathname.startsWith("/integrations") ||
      pathname.startsWith("/analytics") ||
      pathname.startsWith("/copilot") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/inbox") ||
      pathname.startsWith("/ai-cmo")
    )
  );
  const authedMode = isAuthenticated || isPlatformRoute;

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
    if (authedMode && supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
      });
    }
  }, [authedMode, supabase]);

  const sectionMeta = [
    { match: "/dashboard/create", title: "AI Composer", description: "Craft and refine social posts" },
    { match: "/dashboard", title: "Dashboard", description: "Overview and quick actions" },
    { match: "/inbox", title: "Inbox", description: "Manage conversations across channels" },
    { match: "/calendar", title: "Calendar", description: "Plan and schedule posts" },
    { match: "/posts", title: "Library", description: "Review saved drafts and content" },
    { match: "/analytics", title: "Analytics", description: "Track performance metrics" },
    { match: "/integrations", title: "Integrations", description: "Connect social accounts" },
    { match: "/settings", title: "Settings", description: "Manage workspace preferences" },
    { match: "/copilot", title: "AI Copilot", description: "Ask questions and get ideas" },
    { match: "/ai-cmo", title: "AI CMO", description: "Your AI Chief Marketing Officer" },
  ];

  const currentSection = isPlatformRoute
    ? sectionMeta.find((section) => pathname?.startsWith(section.match))
    : undefined;

  return (
    <header
      className={cn(
        "fixed top-0 z-[9999] border-b border-white/10 bg-slate-900/70 backdrop-blur-xl transition-all duration-200",
        isPlatformRoute ? "left-0 md:left-20 lg:left-60 w-full md:w-[calc(100%-80px)] lg:w-[calc(100%-240px)]" : "left-0 w-full"
      )}
    >
      <div
        className={cn(
          isPlatformRoute ? "px-4 md:px-6" : "max-w-7xl mx-auto px-6",
          "flex h-16 items-center justify-between gap-4"
        )}
      >
        <div className="flex items-center gap-4">
          {!isPlatformRoute ? (
            <Link href={authedMode ? "/dashboard" : "/"} className="flex items-center gap-2">
              <div className="relative h-10 w-10">
                <Image
                  src="/zapsocial-logo.png"
                  alt="ZapSocial Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl font-semibold tracking-tight text-white">ZapSocial</span>
            </Link>
          ) : (
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-white leading-tight">
                {currentSection?.title ?? "Workspace"}
              </span>
              {currentSection?.description && (
                <span className="text-xs text-gray-400">{currentSection.description}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {authedMode ? (
            <>
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 shadow-inner shadow-black/30 sm:flex">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-48 bg-transparent text-sm text-gray-200 placeholder:text-gray-400 focus:outline-none"
                />
              </div>

              <Link href="/dashboard/create" className="hidden sm:block">
                <Button className="inline-flex gap-2 bg-cyan-500 px-4 hover:bg-cyan-600">
                  <Sparkles className="h-4 w-4" />
                  Create Post
                </Button>
              </Link>

              <Link href="/dashboard/create" className="sm:hidden">
                <Button className="h-10 w-10 rounded-full bg-cyan-500 p-0 hover:bg-cyan-600">
                  <Sparkles className="h-4 w-4" />
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-white/10 bg-white/5 text-gray-200 hover:border-white/20 hover:text-white"
              >
                <Bell className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-5">
              <Link
                href="/#features"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-cyan-400"
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-cyan-400"
              >
                Pricing
              </Link>
              <Link
                href="/privacy"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-cyan-400"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-cyan-400"
              >
                Terms
              </Link>
              <span className="h-5 w-px bg-white/10" />
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-gray-300 transition-colors hover:text-cyan-400"
              >
                Sign In
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-cyan-400 to-cyan-600 hover:bg-gradient-to-r from-cyan-400 to-cyan-600-hover">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
