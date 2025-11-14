"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Repeat2, Share, Maximize2 } from "lucide-react";
import { ImageExpandModal } from "@/components/preview/ImageExpandModal";
import { cn } from "@/lib/utils";

type TwitterPreviewProps = {
  caption: string;
  imageUrls?: string[];
  hashtags?: string[];
  tone?: string;
};

const handles = [
  { name: "ZapSocial", handle: "@zapsocial" },
  { name: "The Captionist", handle: "@captionist" },
  { name: "Content Radar", handle: "@contentradar" },
  { name: "Studio Drift", handle: "@studio_drift" },
];

function formatTweet(text: string) {
  if (!text) return "Share your angle and we’ll preview it live.";
  if (text.length <= 280) return text;
  return `${text.slice(0, 276).trim()}…`;
}

export function TwitterPreview({ caption, imageUrls = [], hashtags = [] }: TwitterPreviewProps) {
  const profile = handles[Math.abs(caption.length) % handles.length];
  const [isExpandOpen, setIsExpandOpen] = useState(false);
  const [expandIndex, setExpandIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setExpandIndex(index);
    setIsExpandOpen(true);
  };

  const renderImageGrid = () => {
    const imageCount = imageUrls.length;
    
    if (imageCount === 0) {
      return (
        <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300">
          <Share className="h-10 w-10 text-slate-400" />
        </div>
      );
    }

    if (imageCount === 1) {
      return (
        <div className="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-200" onClick={() => handleImageClick(0)}>
          <Image src={imageUrls[0]} alt="Twitter preview" width={600} height={320} className="h-48 w-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/20">
            <div className="opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
                <Maximize2 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (imageCount === 2) {
      return (
        <div className="grid grid-cols-2 gap-0.5 h-48 rounded-2xl border border-slate-200 overflow-hidden">
          {imageUrls.slice(0, 2).map((url, index) => (
            <div key={index} className="relative group cursor-pointer overflow-hidden" onClick={() => handleImageClick(index)}>
              <Image src={url} alt={`Twitter preview ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-105" />
            </div>
          ))}
        </div>
      );
    }

    if (imageCount === 3) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-48 rounded-2xl border border-slate-200 overflow-hidden">
          <div className="relative group cursor-pointer row-span-2 overflow-hidden" onClick={() => handleImageClick(0)}>
            <Image src={imageUrls[0]} alt="Twitter preview 1" fill className="object-cover transition-transform group-hover:scale-105" />
          </div>
          <div className="relative group cursor-pointer overflow-hidden" onClick={() => handleImageClick(1)}>
            <Image src={imageUrls[1]} alt="Twitter preview 2" fill className="object-cover transition-transform group-hover:scale-105" />
          </div>
          <div className="relative group cursor-pointer overflow-hidden" onClick={() => handleImageClick(2)}>
            <Image src={imageUrls[2]} alt="Twitter preview 3" fill className="object-cover transition-transform group-hover:scale-105" />
          </div>
        </div>
      );
    }

    if (imageCount === 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-48 rounded-2xl border border-slate-200 overflow-hidden">
          {imageUrls.slice(0, 4).map((url, index) => (
            <div key={index} className="relative group cursor-pointer overflow-hidden" onClick={() => handleImageClick(index)}>
              <Image src={url} alt={`Twitter preview ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-105" />
            </div>
          ))}
        </div>
      );
    }

    // 5+ images: Show first 4 in a 2x2 grid, with a "+N" overlay on the 4th image
    const remainingCount = imageCount - 4;
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-48 rounded-2xl border border-slate-200 overflow-hidden">
        {imageUrls.slice(0, 4).map((url, index) => (
          <div key={index} className="relative group cursor-pointer overflow-hidden" onClick={() => handleImageClick(index)}>
            <Image src={url} alt={`Twitter preview ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-105" />
            {index === 3 && remainingCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <span className="text-2xl font-bold text-white">+{remainingCount}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl shadow-black/10">
      <header className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500" />
        <div className="flex-1">
          <div className="flex items-center gap-2 text-slate-900">
            <span className="text-sm font-semibold">{profile.name}</span>
            <span className="text-xs text-slate-500">{profile.handle}</span>
            <span className="text-xs text-slate-400">· 3m</span>
          </div>
          <p className="mt-2 text-sm text-slate-800 whitespace-pre-line">{formatTweet(caption)}</p>
          {hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {hashtags.slice(0, 6).map((tag) => (
                <span key={tag} className="cursor-pointer text-blue-600 hover:underline">
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3">
            {renderImageGrid()}
          </div>

          <div className="mt-2 flex items-center justify-between text-sm text-slate-700">
            <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100">
              <MessageCircle className="h-4 w-4" /> Reply
            </button>
            <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100">
              <Repeat2 className="h-4 w-4" /> Repost
            </button>
            <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100">
              <Heart className="h-4 w-4" /> Like
            </button>
            <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100">
              <Share className="h-4 w-4" /> Share
            </button>
          </div>
        </div>
      </header>
    </div>
      {imageUrls.length > 0 && (
        <ImageExpandModal
          imageUrls={imageUrls}
          initialIndex={expandIndex}
          isOpen={isExpandOpen}
          onClose={() => setIsExpandOpen(false)}
        />
      )}
    </>
  );
}
