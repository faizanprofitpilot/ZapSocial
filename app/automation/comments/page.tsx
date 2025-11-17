"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, RefreshCw, Loader2 } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  comment_id: string;
  post_id: string;
  platform: "facebook" | "instagram" | "linkedin";
  commenter_name: string;
  text: string;
  replied: boolean;
  reply_text: string | null;
  replied_at: string | null;
  created_at: string;
}

const platformLogos: Record<string, string> = {
  facebook: "/Facebook logo.png",
  instagram: "/Instagram logo.png",
  linkedin: "/Linkedin logo.png",
};

export default function CommentAutomationPage() {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSupabase(createClient());
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const loadComments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("comments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;
        setComments(data || []);
      } catch (error) {
        console.error("Error loading comments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [supabase]);

  const handleRegenerateReply = async (commentId: string, comment: Comment) => {
    if (!supabase) return;
    setRegenerating(commentId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call API to regenerate and resend reply
      const response = await fetch("/api/automation/comments/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate reply");
      }

      // Reload comments
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("id", commentId)
        .single();

      if (data) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? (data as Comment) : c))
        );
      }
    } catch (error) {
      console.error("Error regenerating reply:", error);
      alert("Failed to regenerate reply");
    } finally {
      setRegenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Comment Automation Logs</h1>
          <p className="text-gray-400">View and manage AI-generated comment replies</p>
        </div>

        <Card className="glass-base glass-mid border border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-cyan-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No comments processed yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Enable auto-replies in Settings to start engaging with comments automatically
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {platformLogos[comment.platform] ? (
                            <Image
                              src={platformLogos[comment.platform]}
                              alt={comment.platform}
                              width={20}
                              height={20}
                              className="object-contain"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded bg-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white">
                                {comment.commenter_name}
                              </span>
                              <Badge
                                variant={comment.replied ? "default" : "secondary"}
                                className={
                                  comment.replied
                                    ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/40"
                                    : "bg-gray-500/20 text-gray-300 border-gray-500/40"
                                }
                              >
                                {comment.replied ? "Replied" : "Pending"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-300">{comment.text}</p>
                          </div>
                          {comment.replied && comment.reply_text && (
                            <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3">
                              <p className="text-xs text-cyan-200 mb-1">AI Reply:</p>
                              <p className="text-sm text-white">{comment.reply_text}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            {comment.replied_at && (
                              <span>
                                Replied{" "}
                                {formatDistanceToNow(new Date(comment.replied_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {comment.replied && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateReply(comment.id, comment)}
                          disabled={regenerating === comment.id}
                          className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                        >
                          {regenerating === comment.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Regenerate
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

