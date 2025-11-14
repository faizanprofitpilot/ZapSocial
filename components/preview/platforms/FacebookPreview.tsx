"use client";

import { useState } from "react";
import Image from "next/image";
import { Globe, MoreHorizontal, MessageCircle, Share2, ThumbsUp, Maximize2 } from "lucide-react";
import { ImageExpandModal } from "@/components/preview/ImageExpandModal";
import { cn } from "@/lib/utils";

type FacebookPreviewProps = {
  caption: string;
  imageUrls?: string[];
  hashtags?: string[];
  tone?: string;
};

const fallbackLink = {
  title: "zapwrite.io",
  description: "Tap into AI workflows to plan, draft, and publish social content faster.",
  url: "https://zapwrite.io",
};

const profileNames = ["ZapSocial", "Product Studio", "Northwind Media", "Glacier Ops"];

export function FacebookPreview({ caption, imageUrls = [], hashtags = [] }: FacebookPreviewProps) {
  const profile = profileNames[Math.abs(caption.length) % profileNames.length];
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
        <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300">
          <Share2 className="h-12 w-12 text-slate-400" />
        </div>
      );
    }

    if (imageCount === 1) {
      return (
        <div className="relative group cursor-pointer" onClick={() => handleImageClick(0)}>
          <Image
            src={imageUrls[0]}
            alt="Facebook preview"
            width={640}
            height={360}
            className="h-56 w-full object-cover transition-transform group-hover:scale-105"
          />
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
        <div className="grid grid-cols-2 gap-0.5 h-56">
          {imageUrls.slice(0, 2).map((url, index) => (
            <div key={index} className="relative group cursor-pointer overflow-hidden" onClick={() => handleImageClick(index)}>
              <Image src={url} alt={`Facebook preview ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-105" />
            </div>
          ))}
        </div>
      );
    }

    if (imageCount === 3) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-56">
          <div className="relative group cursor-pointer row-span-2 overflow-hidden" onClick={() => handleImageClick(0)}>
            <Image src={imageUrls[0]} alt="Facebook preview 1" fill className="object-cover transition-transform group-hover:scale-105" />
          </div>
          <div className="relative group cursor-pointer overflow-hidden" onClick={() => handleImageClick(1)}>
            <Image src={imageUrls[1]} alt="Facebook preview 2" fill className="object-cover transition-transform group-hover:scale-105" />
          </div>
          <div className="relative group cursor-pointer overflow-hidden" onClick={() => handleImageClick(2)}>
            <Image src={imageUrls[2]} alt="Facebook preview 3" fill className="object-cover transition-transform group-hover:scale-105" />
          </div>
        </div>
      );
    }

    if (imageCount === 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-56">
          {imageUrls.slice(0, 4).map((url, index) => (
            <div key={index} className="relative group cursor-pointer overflow-hidden" onClick={() => handleImageClick(index)}>
              <Image src={url} alt={`Facebook preview ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-105" />
            </div>
          ))}
        </div>
      );
    }

    // 5+ images: Show first 4 in a 2x2 grid, with a "+N" overlay on the 4th image
    const remainingCount = imageCount - 4;
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-56">
        {imageUrls.slice(0, 4).map((url, index) => (
          <div key={index} className="relative group cursor-pointer overflow-hidden" onClick={() => handleImageClick(index)}>
            <Image src={url} alt={`Facebook preview ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-105" />
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
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">{profile}</p>
            <p className="flex items-center gap-1 text-[11px] text-slate-500">
              5 mins · <Globe className="h-3 w-3" />
            </p>
          </div>
        </div>
        <MoreHorizontal className="h-4 w-4 text-slate-400" />
      </header>

      <div className="space-y-3 text-sm text-slate-800">
        <p>{caption || "Start writing to see how your Facebook post will render."}</p>
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {hashtags.slice(0, 6).map((tag) => (
              <span key={tag} className="cursor-pointer text-blue-600 hover:underline">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        {renderImageGrid()}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-700">
        <button className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-100">
          <ThumbsUp className="h-4 w-4" /> Like
        </button>
        <button className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-100">
          <MessageCircle className="h-4 w-4" /> Comment
        </button>
        <button className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-100">
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>
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
