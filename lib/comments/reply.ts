import { FacebookClient } from "@/lib/facebook/client";
import { InstagramClient } from "@/lib/instagram/client";
import { LinkedInClient } from "@/lib/linkedin/client";
import { logApiRequest } from "@/lib/meta/api-logger";

export interface ReplyOptions {
  commentId: string;
  postId: string;
  replyText: string;
  platform: "facebook" | "instagram" | "linkedin";
  accessToken: string;
  pageAccessToken?: string; // For Facebook/Instagram
  pageId?: string; // For Facebook/Instagram
  igAccountId?: string; // For Instagram
  organizationId?: string; // For LinkedIn
  userId: string;
  integrationId: string;
}

export interface ReplyResult {
  success: boolean;
  replyId?: string;
  error?: string;
}

/**
 * Reply to a Facebook comment
 */
export async function replyToFacebookComment(
  options: ReplyOptions
): Promise<ReplyResult> {
  const { commentId, replyText, pageAccessToken, userId, integrationId } = options;

  if (!pageAccessToken) {
    return { success: false, error: "Page access token required" };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${commentId}/comments`;
    const params = new URLSearchParams({
      access_token: pageAccessToken,
      message: replyText,
    });

    const startTime = Date.now();
    const response = await fetch(url, {
      method: "POST",
      body: params,
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (!response.ok || data.error) {
      await logApiRequest({
        user_id: userId,
        integration_id: integrationId,
        platform: "facebook",
        endpoint: `/${commentId}/comments`,
        method: "POST",
        status_code: response.status,
        success: false,
        error_message: data.error?.message || "Failed to reply to comment",
        duration_ms: duration,
      });

      return {
        success: false,
        error: data.error?.message || "Failed to reply to comment",
      };
    }

    await logApiRequest({
      user_id: userId,
      integration_id: integrationId,
      platform: "facebook",
      endpoint: `/${commentId}/comments`,
      method: "POST",
      response_body: data,
      status_code: response.status,
      success: true,
      duration_ms: duration,
    });

    return {
      success: true,
      replyId: data.id,
    };
  } catch (error: any) {
    console.error("Error replying to Facebook comment:", error);
    return {
      success: false,
      error: error.message || "Failed to reply to comment",
    };
  }
}

/**
 * Reply to an Instagram comment
 */
export async function replyToInstagramComment(
  options: ReplyOptions
): Promise<ReplyResult> {
  const { commentId, replyText, pageAccessToken, userId, integrationId } = options;

  if (!pageAccessToken) {
    return { success: false, error: "Page access token required" };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${commentId}/replies`;
    const params = new URLSearchParams({
      access_token: pageAccessToken,
      message: replyText,
    });

    const startTime = Date.now();
    const response = await fetch(url, {
      method: "POST",
      body: params,
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (!response.ok || data.error) {
      await logApiRequest({
        user_id: userId,
        integration_id: integrationId,
        platform: "instagram",
        endpoint: `/${commentId}/replies`,
        method: "POST",
        status_code: response.status,
        success: false,
        error_message: data.error?.message || "Failed to reply to comment",
        duration_ms: duration,
      });

      return {
        success: false,
        error: data.error?.message || "Failed to reply to comment",
      };
    }

    await logApiRequest({
      user_id: userId,
      integration_id: integrationId,
      platform: "instagram",
      endpoint: `/${commentId}/replies`,
      method: "POST",
      response_body: data,
      status_code: response.status,
      success: true,
      duration_ms: duration,
    });

    return {
      success: true,
      replyId: data.id,
    };
  } catch (error: any) {
    console.error("Error replying to Instagram comment:", error);
    return {
      success: false,
      error: error.message || "Failed to reply to comment",
    };
  }
}

/**
 * Reply to a LinkedIn comment
 * Note: LinkedIn comment API may have limitations
 */
export async function replyToLinkedInComment(
  options: ReplyOptions
): Promise<ReplyResult> {
  const { commentId, replyText, accessToken, userId, integrationId, postId } = options;

  try {
    // LinkedIn comment reply format
    // This requires the social action URN and comment URN
    // Format: urn:li:comment:(activity:xxx,comment:xxx)
    const url = `https://api.linkedin.com/v2/socialActions/${commentId}/comments`;

    const requestBody = {
      actor: "urn:li:person:" + userId, // This may need adjustment based on LinkedIn API
      object: commentId,
      message: {
        text: replyText,
      },
    };

    const startTime = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (!response.ok) {
      await logApiRequest({
        user_id: userId,
        integration_id: integrationId,
        platform: "linkedin",
        endpoint: "/v2/socialActions/{commentId}/comments",
        method: "POST",
        status_code: response.status,
        success: false,
        error_message: data.message || data.error || "Failed to reply to comment",
        duration_ms: duration,
      });

      return {
        success: false,
        error: data.message || data.error || "Failed to reply to comment",
      };
    }

    await logApiRequest({
      user_id: userId,
      integration_id: integrationId,
      platform: "linkedin",
      endpoint: "/v2/socialActions/{commentId}/comments",
      method: "POST",
      response_body: data,
      status_code: response.status,
      success: true,
      duration_ms: duration,
    });

    return {
      success: true,
      replyId: data.id || commentId, // LinkedIn may return different format
    };
  } catch (error: any) {
    console.error("Error replying to LinkedIn comment:", error);
    return {
      success: false,
      error: error.message || "Failed to reply to comment",
    };
  }
}

/**
 * Reply to a comment on any platform
 */
export async function replyToComment(
  options: ReplyOptions
): Promise<ReplyResult> {
  switch (options.platform) {
    case "facebook":
      return replyToFacebookComment(options);
    case "instagram":
      return replyToInstagramComment(options);
    case "linkedin":
      return replyToLinkedInComment(options);
    default:
      return {
        success: false,
        error: `Unsupported platform: ${options.platform}`,
      };
  }
}

