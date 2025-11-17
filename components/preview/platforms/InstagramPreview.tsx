"use client";

import { useState } from "react";
import Image from "next/image";
import { MoreHorizontal, Heart, MessageCircle, Send, Bookmark, Sparkles, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageExpandModal } from "@/components/preview/ImageExpandModal";
import { cn } from "@/lib/utils";

type InstagramPreviewProps = {
  caption: string;
  imageUrls?: string[];
  hashtags?: string[];
  tone?: string;
};

const profileNames = [
  "Studio Collective",
  "ZapSocial Labs",
  "Creator Circle",
  "Momentum Studio",
];

function pickProfile(caption: string) {
  const index = Math.abs(caption.length) % profileNames.length;
  return profileNames[index];
}

export function InstagramPreview({ caption, imageUrls = [], hashtags = [] }: InstagramPreviewProps) {
  const profileName = pickProfile(caption || "instagram");
  const previewHashtags = hashtags.slice(0, 8);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isExpandOpen, setIsExpandOpen] = useState(false);
  const [expandIndex, setExpandIndex] = useState(0);

  const hasMultipleImages = imageUrls.length > 1;
  const currentImage = imageUrls[currentImageIndex];

  const handleImageClick = () => {
    if (currentImage) {
      setExpandIndex(currentImageIndex);
      setIsExpandOpen(true);
    }
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <>
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl shadow-black/10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">{profileName}</p>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Los Angeles • 1m</p>
            </div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-slate-400" />
        </header>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {currentImage ? (
            <div className="relative group cursor-pointer" onClick={handleImageClick}>
              <Image
                src={currentImage}
                alt={`Instagram preview ${currentImageIndex + 1}`}
                width={600}
                height={600}
                className="h-64 w-full object-cover transition-transform group-hover:scale-105"
              />
              
              {/* Navigation arrows for carousel */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  
                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {imageUrls.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          goToImage(index);
                        }}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          index === currentImageIndex
                            ? "w-6 bg-white"
                            : "w-1.5 bg-white/50 hover:bg-white/75"
                        )}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                  
                  {/* Image counter */}
                  <div className="absolute top-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-white">
                    {currentImageIndex + 1}/{imageUrls.length}
                  </div>
                </>
              )}
              
              {/* Expand icon on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/20">
                <div className="opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
                    <Maximize2 className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300">
              <Sparkles className="h-12 w-12 text-slate-400" />
            </div>
          )}
        </div>

      <div className="flex items-center gap-5 text-slate-500">
        <Heart className="h-5 w-5" />
        <MessageCircle className="h-5 w-5" />
        <Send className="h-5 w-5" />
        <div className="ml-auto">
          <Bookmark className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-800">
        <p>
          <span className="font-semibold text-slate-900">{profileName}</span>{" "}
          {caption || "Write your story to see a live Instagram preview."}
        </p>
        {previewHashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {previewHashtags.map((tag) => (
              <span key={tag} className="cursor-pointer text-blue-500 hover:underline">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}
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
