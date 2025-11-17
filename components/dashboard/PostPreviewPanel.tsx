"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Info } from "lucide-react";
import { PostPreviewRenderer } from "@/components/preview/PostPreviewRenderer";
import { cn } from "@/lib/utils";

type PostPreviewPanelProps = {
  selectedPlatforms: string[];
  caption: string;
  imageUrls?: string[];
  hashtags?: string[];
  tone?: string;
  includeHashtags?: boolean;
};

const platformTokens: Record<
  "instagram" | "facebook" | "linkedin",
  { label: string; accent: string; logo: string }
> = {
  instagram: {
    label: "Instagram",
    accent: "from-cyan-400 via-cyan-500 to-cyan-600",
    logo: "/Instagram logo.png",
  },
  facebook: { label: "Facebook", accent: "from-blue-500 to-blue-700", logo: "/Facebook logo.png" },
  linkedin: { label: "LinkedIn", accent: "from-sky-500 to-blue-600", logo: "/Linkedin logo.png" },
};

function dedupeHashtags(source: string[], caption: string) {
  const matches = caption.match(/#[\p{L}0-9_]+/gu) ?? [];
  const combined = [...source, ...matches];
  const seen = new Set<string>();
  return combined
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .filter((tag) => {
      if (seen.has(tag.toLowerCase())) return false;
      seen.add(tag.toLowerCase());
      return true;
    });
}

export function PostPreviewPanel({
  selectedPlatforms,
  caption,
  imageUrls = [],
  hashtags = [],
  tone,
  includeHashtags = true,
}: PostPreviewPanelProps) {
  const uniquePlatforms = useMemo(
    () => Array.from(new Set(selectedPlatforms.filter(Boolean))) as ("instagram" | "facebook" | "linkedin")[],
    [selectedPlatforms]
  );

  const [activePlatform, setActivePlatform] = useState<(typeof uniquePlatforms)[number] | null>(
    uniquePlatforms[0] ?? null
  );

  useEffect(() => {
    if (!uniquePlatforms.includes(activePlatform as typeof uniquePlatforms[number])) {
      setActivePlatform(uniquePlatforms[0] ?? null);
    }
  }, [uniquePlatforms, activePlatform]);

  const mergedHashtags = useMemo(
    () => dedupeHashtags(includeHashtags ? hashtags : [], caption).slice(0, 10),
    [caption, hashtags, includeHashtags]
  );

  const [showInfo, setShowInfo] = useState(false);

  if (!activePlatform) {
    return (
      <div className="glass-base glass-low flex h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 p-6 text-center text-sm text-gray-300">
        Select a platform to see a live preview of your post.
      </div>
    );
  }

  const activeToken = platformTokens[activePlatform];

  return (
    <div className="glass-base glass-mid flex flex-col rounded-3xl p-5 shadow-lg shadow-black/30">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="relative flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-100">
              Live Post Preview
              <button
                type="button"
                onClick={() => setShowInfo((prev) => !prev)}
                onBlur={() => setShowInfo(false)}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[10px] text-gray-200 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Preview disclaimer"
              >
                <Info className="h-3 w-3" />
              </button>
            </div>
            <p className="text-xs text-gray-400">Updates as you type • {activeToken.label}</p>
            {showInfo && (
              <div className="absolute top-8 left-0 w-64 rounded-lg border border-white/15 bg-[#0f172a] p-3 text-[11px] text-gray-200 shadow-xl shadow-black/40">
                Preview approximates network rendering. Final display may differ slightly once published.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {uniquePlatforms.map((platform) => {
            const token = platformTokens[platform];
            const isActive = platform === activePlatform;
            return (
              <button
                key={platform}
                type="button"
                onClick={() => setActivePlatform(platform)}
                className={cn(
                  "group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
                  isActive
                    ? "border-white/40 bg-gradient-to-r text-white shadow-lg shadow-black/20"
                    : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white",
                  isActive && token.accent
                )}
              >
                <span className="flex items-center gap-2">
                  <Image
                    src={token.logo}
                    alt={token.label}
                    width={18}
                    height={18}
                    className="h-4 w-4 object-contain"
                  />
                  <span className="text-xs">{token.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activePlatform}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="pt-2"
          >
            <PostPreviewRenderer
              platform={activePlatform}
              caption={caption}
              imageUrls={imageUrls}
              hashtags={mergedHashtags}
              tone={tone}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
