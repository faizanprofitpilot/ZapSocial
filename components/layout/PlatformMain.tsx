"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PlatformMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPlatformRoute = Boolean(
    pathname && (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/generate") ||
      pathname.startsWith("/content") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/posts") ||
      pathname.startsWith("/calendar") ||
      pathname.startsWith("/integrations") ||
      pathname.startsWith("/analytics") ||
      pathname.startsWith("/copilot") ||
      pathname.startsWith("/inbox") ||
      pathname.startsWith("/ai-cmo")
    )
  );

  const isAICMOPage = pathname?.startsWith("/ai-cmo");

  if (isPlatformRoute) {
    // AI CMO page needs full height without padding
    if (isAICMOPage) {
      return (
        <main className={cn("h-[calc(100vh-64px)] overflow-hidden md:ml-60 mt-[64px]")}>
          <div key={pathname} className="animate-page-fade h-full">
            {children}
          </div>
        </main>
      );
    }

    return (
      <main className={cn("h-[calc(100vh-64px)] overflow-y-auto p-4 sm:p-6 lg:p-8 md:ml-60 mt-[64px]")}>
        <div key={pathname} className="animate-page-fade">
          {children}
        </div>
      </main>
    );
  }

  // Public routes (landing/auth/etc.): normal document flow, no inner scroll or margins
  return (
    <main>
      <div key={pathname} className="animate-page-fade">
        {children}
      </div>
    </main>
  );
}


