import { createServiceRoleClient } from "@/lib/supabase/server";
import { fetchAllComments } from "@/lib/comments/fetch";
import { replyToComment } from "@/lib/comments/reply";
import { generateCommentReply } from "@/lib/comments/generate";
import { NextResponse } from "next/server";

/**
 * Process comments automation
 * Runs every 10 minutes via Vercel Cron
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret if provided
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    
    // Get all users with comment automation enabled
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("user_id, comment_auto_reply_enabled, comment_reply_window_minutes, comment_reply_tone, comment_exclude_keywords, comment_max_replies_per_post_per_day")
      .eq("comment_auto_reply_enabled", true);

    if (settingsError || !settings) {
      console.error("Error fetching user settings:", settingsError);
      return NextResponse.json({ 
        processed: 0,
        replied: 0,
        errors: [],
      });
    }

    const results = {
      processed: 0,
      replied: 0,
      skipped: 0,
      errors: [] as Array<{ userId: string; error: string }>,
    };

    for (const setting of settings) {
      try {
        // Get user's integrations
        const { data: integrations, error: integrationsError } = await supabase
          .from("integrations")
          .select("id, platform, token, metadata, user_id")
          .eq("user_id", setting.user_id)
          .in("platform", ["facebook", "linkedin"]);

        if (integrationsError || !integrations || integrations.length === 0) {
          continue;
        }

        // Fetch new comments
        const lookbackMinutes = setting.comment_reply_window_minutes || 60;
        const comments = await fetchAllComments(
          integrations.map((i) => ({
            platform: i.platform,
            token: i.token,
            metadata: i.metadata,
            user_id: i.user_id,
          })),
          lookbackMinutes
        );

        // Filter out excluded keywords
        const excludeKeywords = setting.comment_exclude_keywords || [];
        const filteredComments = comments.filter((comment) => {
          if (excludeKeywords.length === 0) return true;
          const lowerText = comment.text.toLowerCase();
          return !excludeKeywords.some((keyword: string) =>
            lowerText.includes(keyword.toLowerCase())
          );
        });

        // Check which comments we've already processed
        const commentIds = filteredComments.map((c) => c.id);
        if (commentIds.length === 0) continue;

        const { data: existingComments } = await supabase
          .from("comments")
          .select("comment_id, platform")
          .eq("user_id", setting.user_id)
          .in("comment_id", commentIds);

        const existingCommentMap = new Map(
          (existingComments || []).map((c) => [`${c.comment_id}_${c.platform}`, true])
        );

        // Store new comments in database
        const newComments = filteredComments.filter(
          (c) => !existingCommentMap.has(`${c.id}_${c.platform}`)
        );

        if (newComments.length > 0) {
          const commentsToInsert = newComments.map((comment) => ({
            user_id: setting.user_id,
            post_id: comment.postId,
            comment_id: comment.id,
            platform: comment.platform,
            commenter_name: comment.commenterName,
            commenter_id: comment.commenterId,
            text: comment.text,
            replied: false,
            metadata: comment.metadata || {},
            created_at: comment.createdAt.toISOString(),
          }));

          await supabase.from("comments").insert(commentsToInsert);
        }

        // Get comments that need replies
        const { data: commentsToReply } = await supabase
          .from("comments")
          .select("*")
          .eq("user_id", setting.user_id)
          .eq("replied", false)
          .gte("created_at", new Date(Date.now() - lookbackMinutes * 60 * 1000).toISOString())
          .order("created_at", { ascending: true });

        if (!commentsToReply || commentsToReply.length === 0) continue;

        // Group by post to check max replies per post
        const postReplyCounts = new Map<string, number>();
        const { data: recentReplies } = await supabase
          .from("comments")
          .select("post_id")
          .eq("user_id", setting.user_id)
          .eq("replied", true)
          .gte("replied_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        (recentReplies || []).forEach((reply) => {
          if (reply.post_id) {
            postReplyCounts.set(
              reply.post_id,
              (postReplyCounts.get(reply.post_id) || 0) + 1
            );
          }
        });

        const maxRepliesPerPost = setting.comment_max_replies_per_post_per_day || 10;

        for (const comment of commentsToReply) {
          try {
            // Check daily limit per post
            const replyCount = postReplyCounts.get(comment.post_id || "") || 0;
            if (replyCount >= maxRepliesPerPost) {
              results.skipped++;
              continue;
            }

            // Find integration for this platform
            const integration = integrations.find((i) => {
              if (comment.platform === "instagram") {
                return i.platform === "facebook"; // Instagram uses Facebook integration
              }
              return i.platform === comment.platform;
            });

            if (!integration) {
              results.errors.push({
                userId: setting.user_id,
                error: `No integration found for platform ${comment.platform}`,
              });
              continue;
            }

            // Generate reply
            const replyText = await generateCommentReply({
              commentText: comment.text,
              postCaption: comment.metadata?.post_caption || comment.metadata?.post_message,
              platform: comment.platform as "facebook" | "instagram" | "linkedin",
              tone: setting.comment_reply_tone || "friendly",
            });

            // Prepare reply options
            const pages = integration.metadata?.pages || [];
            let pageAccessToken: string | undefined;
            let pageId: string | undefined;
            let igAccountId: string | undefined;

            if (comment.platform === "facebook" || comment.platform === "instagram") {
              const page = pages[0]; // Use first page for now
              pageAccessToken = page?.access_token;
              pageId = page?.id;
              if (comment.platform === "instagram") {
                igAccountId = page?.instagram_account?.id;
              }
            }

            const replyResult = await replyToComment({
              commentId: comment.comment_id,
              postId: comment.post_id || "",
              replyText,
              platform: comment.platform as "facebook" | "instagram" | "linkedin",
              accessToken: integration.token,
              pageAccessToken,
              pageId,
              igAccountId,
              organizationId: integration.metadata?.organization_id,
              userId: setting.user_id,
              integrationId: integration.id,
            });

            // Update comment in database
            if (replyResult.success) {
              await supabase
                .from("comments")
                .update({
                  replied: true,
                  reply_text: replyText,
                  reply_id: replyResult.replyId,
                  replied_at: new Date().toISOString(),
                })
                .eq("id", comment.id);

              results.replied++;
              
              // Update post reply count
              if (comment.post_id) {
                postReplyCounts.set(
                  comment.post_id,
                  (postReplyCounts.get(comment.post_id) || 0) + 1
                );
              }
            } else {
              results.errors.push({
                userId: setting.user_id,
                error: `Failed to reply to comment ${comment.id}: ${replyResult.error}`,
              });
            }

            results.processed++;

            // Rate limiting: Add small delay between replies
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error: any) {
            console.error(`Error processing comment ${comment.id}:`, error);
            results.errors.push({
              userId: setting.user_id,
              error: error.message || "Unknown error",
            });
          }
        }
      } catch (error: any) {
        console.error(`Error processing user ${setting.user_id}:`, error);
        results.errors.push({
          userId: setting.user_id,
          error: error.message || "Unknown error",
        });
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error in comments process route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

