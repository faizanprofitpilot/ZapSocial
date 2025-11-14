"use client";

import { InstagramPreview } from "@/components/preview/platforms/InstagramPreview";
import { FacebookPreview } from "@/components/preview/platforms/FacebookPreview";
import { LinkedInPreview } from "@/components/preview/platforms/LinkedInPreview";

type PostPreviewRendererProps = {
  platform: "instagram" | "facebook" | "linkedin";
  caption: string;
  imageUrls?: string[];
  hashtags?: string[];
  tone?: string;
};

export function PostPreviewRenderer({ platform, caption, imageUrls = [], hashtags = [], tone }: PostPreviewRendererProps) {
  switch (platform) {
    case "instagram":
      return <InstagramPreview caption={caption} imageUrls={imageUrls} hashtags={hashtags} tone={tone} />;
    case "facebook":
      return <FacebookPreview caption={caption} imageUrls={imageUrls} hashtags={hashtags} tone={tone} />;
    case "linkedin":
      return <LinkedInPreview caption={caption} imageUrls={imageUrls} hashtags={hashtags} tone={tone} />;
    default:
      return (
        <div className="glass-base glass-low rounded-3xl border border-dashed border-white/15 p-4 text-sm text-gray-300">
          Platform preview not available yet.
        </div>
      );
  }
}
