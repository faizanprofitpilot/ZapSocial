"use client";

import { Suspense } from "react";
import { AIComposer } from "@/components/dashboard/AIComposer";

function CreatePostPageContent() {
  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        <AIComposer />
      </div>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    }>
      <CreatePostPageContent />
    </Suspense>
  );
}

