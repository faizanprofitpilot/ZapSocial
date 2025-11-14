"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Suggestions() {
  const allBlogTopics = useMemo(
    () => [
      "AI prompts that actually work for long-form content",
      "Programmatic SEO: from 10 keywords to 1,000 pages",
      "Instagram carousel ideas to showcase results",
      "90-day launch plan with AI repurposing",
      "LinkedIn thought-leadership cadence for founders",
      "High-performing prompts for social content",
      "Spark engagement with interactive ideas",
      "From outline to publish: a 30‑minute workflow",
    ],
    []
  );

  const allSocialIdeas = useMemo(
    () => [
      { label: "LinkedIn", platform: "linkedin", text: "We built a workflow that takes raw ideas → outlines → blog drafts → social captions. The fastest way to ship content consistently." },
      { label: "Instagram", platform: "instagram", text: "Ideas → Blogs → Captions. Create once, repurpose everywhere. Save this workflow. ✨" },
      { label: "LinkedIn", platform: "linkedin", text: "Your content system is only as good as the prompts you use. Start documenting what works and reuse it." },
      { label: "LinkedIn", platform: "linkedin", text: "We turned our top-performing threads into snackable IG stories — meet the campaign toolkit. #contentmarketing" },
      { label: "Instagram", platform: "instagram", text: "From 0 → 1,000 keywords. Scale the smart way. 💡" },
      { label: "Facebook", platform: "facebook", text: "Turn fan-favorite blog stories into community posts. Ask a question, invite replies, keep the conversation going." },
    ],
    []
  );

  const platformName: Record<string, string> = {
    instagram: "Instagram",
    linkedin: "LinkedIn",
    facebook: "Facebook",
  };

  const [blogSlice, setBlogSlice] = useState(0);
  const [socialSlice, setSocialSlice] = useState(0);
  const blogBatchSize = 5;
  const socialBatchSize = 3;

  const currentBlogs = useMemo(() => {
    const rotated = shuffleArray(allBlogTopics);
    return rotated.slice(blogSlice % Math.max(1, rotated.length - (blogBatchSize - 1)), (blogSlice % Math.max(1, rotated.length - (blogBatchSize - 1))) + blogBatchSize);
  }, [allBlogTopics, blogSlice]);

  const currentSocial = useMemo(() => {
    const rotated = shuffleArray(allSocialIdeas);
    return rotated.slice(socialSlice % Math.max(1, rotated.length - (socialBatchSize - 1)), (socialSlice % Math.max(1, rotated.length - (socialBatchSize - 1))) + socialBatchSize);
  }, [allSocialIdeas, socialSlice]);

  return (
    <section className="mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blog topic ideas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-gray-50">Suggested blog topics</CardTitle>
              <CardDescription className="text-gray-300">Jumpstart your next post</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBlogSlice((s) => s + blogBatchSize)}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentBlogs.map((topic) => (
              <div key={topic} className="flex items-start gap-3 p-3 rounded-lg glass-light border border-white/10">
                <span className="mt-0.5 text-brand-400">•</span>
                <span className="text-sm text-gray-200">{topic}</span>
              </div>
            ))}
            <Link href="/generate/keyword">
              <Button variant="outline" className="w-full">Generate from a topic</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Social post ideas */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-gray-50">Social post suggestions</CardTitle>
              <CardDescription className="text-gray-300">Quick ideas for X, LinkedIn, and IG</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSocialSlice((s) => s + socialBatchSize)}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentSocial.map((item, idx) => (
                <Card
                  key={`${item.label}-${idx}`}
                  className="p-4 rounded-lg glass-light border border-white/10 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-100">{item.label}</p>
                      <p className="text-xs text-gray-400">Platform: {platformName[item.platform] ?? item.platform}</p>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-full bg-gradient-brand text-xs hover:bg-gradient-brand-hover"
                      onClick={() => {
                        const params = new URLSearchParams({
                          platform: item.platform,
                          draft: item.text,
                        });
                        window.location.href = `/dashboard/create?${params.toString()}`;
                      }}
                    >
                      Review
                    </Button>
                  </div>
                  <p className="text-sm text-gray-200 leading-snug">{item.text}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-brand-300">
                    <span className="rounded-full bg-brand-500/10 px-2 py-1">#{item.platform}</span>
                    <span className="rounded-full bg-brand-500/10 px-2 py-1">#{item.label.replace(/\s+/g, "")}</span>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <Link href="/dashboard/create">
                <Button className="bg-gradient-brand hover:bg-gradient-brand-hover">Generate captions</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


