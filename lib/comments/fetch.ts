import { FacebookClient } from "@/lib/facebook/client";
import { InstagramClient } from "@/lib/instagram/client";
import { LinkedInClient } from "@/lib/linkedin/client";

export interface Comment {
  id: string;
  postId: string;
  text: string;
  commenterName: string;
  commenterId: string;
  createdAt: Date;
  platform: "facebook" | "instagram" | "linkedin";
  metadata?: any;
}

/**
 * Fetch recent comments from Facebook Page posts
 */
export async function fetchFacebookComments(
  pageId: string,
  pageAccessToken: string,
  lookbackMinutes: number = 60
): Promise<Comment[]> {
  const client = new FacebookClient(pageAccessToken);
  const posts = await client.getPosts(pageId, pageAccessToken, 10);
  const comments: Comment[] = [];
  const cutoffTime = Date.now() - lookbackMinutes * 60 * 1000;

  for (const post of posts) {
    try {
      const url = `https://graph.facebook.com/v21.0/${post.id}/comments`;
      const params = new URLSearchParams({
        access_token: pageAccessToken,
        fields: "id,message,created_time,from",
        limit: "25",
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        console.error(`Error fetching comments for post ${post.id}:`, data.error);
        continue;
      }

      const postComments = data.data || [];
      for (const comment of postComments) {
        const commentTime = new Date(comment.created_time).getTime();
        if (commentTime >= cutoffTime && comment.message) {
          comments.push({
            id: comment.id,
            postId: post.id,
            text: comment.message,
            commenterName: comment.from?.name || "Unknown",
            commenterId: comment.from?.id || "",
            createdAt: new Date(comment.created_time),
            platform: "facebook",
            metadata: {
              post_message: post.message,
            },
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching comments for post ${post.id}:`, error);
      continue;
    }
  }

  return comments;
}

/**
 * Fetch recent comments from Instagram Business account posts
 */
export async function fetchInstagramComments(
  pageId: string,
  igAccountId: string,
  pageAccessToken: string,
  lookbackMinutes: number = 60
): Promise<Comment[]> {
  const client = new InstagramClient(new FacebookClient(pageAccessToken));
  const media = await client.getMedia(pageId, 10);
  const comments: Comment[] = [];
  const cutoffTime = Date.now() - lookbackMinutes * 60 * 1000;

  for (const item of media) {
    try {
      const url = `https://graph.facebook.com/v21.0/${item.id}/comments`;
      const params = new URLSearchParams({
        access_token: pageAccessToken,
        fields: "id,text,timestamp,username",
        limit: "25",
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        console.error(`Error fetching comments for media ${item.id}:`, data.error);
        continue;
      }

      const itemComments = data.data || [];
      for (const comment of itemComments) {
        const commentTime = new Date(comment.timestamp).getTime();
        if (commentTime >= cutoffTime && comment.text) {
          comments.push({
            id: comment.id,
            postId: item.id,
            text: comment.text,
            commenterName: comment.username || "Unknown",
            commenterId: comment.username || comment.id,
            createdAt: new Date(comment.timestamp),
            platform: "instagram",
            metadata: {
              post_caption: item.caption,
            },
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching comments for media ${item.id}:`, error);
      continue;
    }
  }

  return comments;
}

/**
 * Fetch recent comments from LinkedIn posts
 * Note: LinkedIn API requires specific scopes and may have limitations
 */
export async function fetchLinkedInComments(
  accessToken: string,
  organizationId?: string,
  lookbackMinutes: number = 60
): Promise<Comment[]> {
  // LinkedIn API for fetching comments is limited
  // We can fetch user's recent posts and check for comments
  // This is a simplified version - actual implementation may vary based on LinkedIn API availability
  const comments: Comment[] = [];
  const cutoffTime = Date.now() - lookbackMinutes * 60 * 1000;

  try {
    // Note: LinkedIn doesn't have a straightforward way to fetch all comments on all posts
    // This would require storing post URNs and fetching comments per post
    // For now, we'll return an empty array as a placeholder
    // Implementation would require tracking published posts in database
    console.warn("LinkedIn comment fetching requires tracking published posts - not fully implemented");
    return comments;
  } catch (error) {
    console.error("Error fetching LinkedIn comments:", error);
    return comments;
  }
}

/**
 * Fetch all new comments across all platforms for a user
 */
export async function fetchAllComments(
  integrations: Array<{
    platform: string;
    token: string;
    metadata: any;
    user_id: string;
  }>,
  lookbackMinutes: number = 60
): Promise<Comment[]> {
  const allComments: Comment[] = [];

  for (const integration of integrations) {
    try {
      if (integration.platform === "facebook") {
        const pages = integration.metadata?.pages || [];
        for (const page of pages) {
          if (page.access_token) {
            const comments = await fetchFacebookComments(
              page.id,
              page.access_token,
              lookbackMinutes
            );
            allComments.push(...comments);
          }
        }
      } else if (integration.platform === "linkedin") {
        // LinkedIn comment fetching would go here
        const organizationId = integration.metadata?.organization_id;
        const comments = await fetchLinkedInComments(
          integration.token,
          organizationId,
          lookbackMinutes
        );
        allComments.push(...comments);
      }
    } catch (error) {
      console.error(`Error fetching comments for ${integration.platform}:`, error);
      continue;
    }
  }

  // Handle Instagram separately (it's under Facebook integration)
  const facebookIntegration = integrations.find((i) => i.platform === "facebook");
  if (facebookIntegration) {
    const pages = facebookIntegration.metadata?.pages || [];
    for (const page of pages) {
      const instagramAccount = page.instagram_account;
      if (instagramAccount?.id && page.access_token) {
        try {
          const comments = await fetchInstagramComments(
            page.id,
            instagramAccount.id,
            page.access_token,
            lookbackMinutes
          );
          allComments.push(...comments);
        } catch (error) {
          console.error(`Error fetching Instagram comments for page ${page.id}:`, error);
        }
      }
    }
  }

  return allComments;
}

