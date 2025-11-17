"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Calendar, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

type UpcomingPost = {
  id: string;
  caption: string;
  platform: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  hashtags: string[] | null;
};

type UpcomingPostsProps = {
  posts: UpcomingPost[];
};

const getPlatformLogo = (platform: string) => {
  switch (platform) {
    case "instagram":
      return "/Instagram logo.png";
    case "linkedin":
      return "/Linkedin logo.png";
    case "facebook":
      return "/Facebook logo.png";
    default:
      return null;
  }
};

export function UpcomingPosts({ posts }: UpcomingPostsProps) {
  // Get upcoming scheduled posts and recent drafts
  const [scheduledExpanded, setScheduledExpanded] = useState(false);
  const [draftsExpanded, setDraftsExpanded] = useState(false);

  const allScheduled = posts
    .filter((p) => p.status === "scheduled" && p.scheduled_at)
    .sort((a, b) => {
      const dateA = new Date(a.scheduled_at || a.created_at);
      const dateB = new Date(b.scheduled_at || b.created_at);
      return dateA.getTime() - dateB.getTime();
    });

  const scheduled = scheduledExpanded ? allScheduled : allScheduled.slice(0, 3);

  const allDrafts = posts
    .filter((p) => p.status === "draft")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const drafts = draftsExpanded ? allDrafts : allDrafts.slice(0, 3);

  if (allScheduled.length === 0 && allDrafts.length === 0) {
    return (
      <Card className="glass-light border border-white/10">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-50">Upcoming Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 text-center py-4">No upcoming posts. Create your first post!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-light border border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-50">Upcoming Posts</CardTitle>
          <Link href="/posts">
            <Button variant="ghost" size="sm" className="text-xs">
              View All
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {allScheduled.length > 0 && (
          <div>
            <button
              onClick={() => setScheduledExpanded(!scheduledExpanded)}
              className="flex items-center justify-between w-full mb-2 group"
            >
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide group-hover:text-gray-300 transition-colors">
                Scheduled Posts
              </h4>
              {allScheduled.length > 3 && (
                <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-gray-400">
                  {scheduledExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      <span>Show Less</span>
                    </>
                  ) : (
                    <>
                      <span>View All ({allScheduled.length})</span>
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </div>
              )}
            </button>
            <div className="space-y-2">
              {scheduled.map((post) => {
                const logo = getPlatformLogo(post.platform);
                return (
                  <div
                    key={post.id}
                    className="p-3 rounded-lg border border-white/10 hover:border-white/20 transition-all bg-white/5"
                  >
                    <div className="flex items-start gap-2">
                      {logo && (
                        <div className="w-5 h-5 relative flex-shrink-0 mt-0.5">
                          <Image
                            src={logo}
                            alt={post.platform}
                            width={20}
                            height={20}
                            className="object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 line-clamp-2 mb-1">{post.caption}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {post.scheduled_at ? formatDate(post.scheduled_at) : formatDate(post.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {allDrafts.length > 0 && (
          <div>
            <button
              onClick={() => setDraftsExpanded(!draftsExpanded)}
              className="flex items-center justify-between w-full mb-2 mt-4 group"
            >
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide group-hover:text-gray-300 transition-colors">
                Drafts
              </h4>
              {allDrafts.length > 3 && (
                <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-gray-400">
                  {draftsExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      <span>Show Less</span>
                    </>
                  ) : (
                    <>
                      <span>View All ({allDrafts.length})</span>
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </div>
              )}
            </button>
            <div className="space-y-2">
              {drafts.map((post) => {
                const logo = getPlatformLogo(post.platform);
                return (
                  <div
                    key={post.id}
                    className="p-3 rounded-lg border border-white/10 hover:border-white/20 transition-all bg-white/5"
                  >
                    <div className="flex items-start gap-2">
                      {logo && (
                        <div className="w-5 h-5 relative flex-shrink-0 mt-0.5">
                          <Image
                            src={logo}
                            alt={post.platform}
                            width={20}
                            height={20}
                            className="object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 line-clamp-2 mb-1">{post.caption}</p>
                        <span className="text-[10px] text-gray-500">Draft</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

