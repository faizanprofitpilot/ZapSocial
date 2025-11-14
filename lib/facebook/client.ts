/**
 * Facebook Graph API Client
 * 
 * This client handles Facebook API interactions including:
 * - OAuth authentication
 * - Posting content
 * - Fetching pages
 * - Managing access tokens
 */

import { createClient } from "@/lib/supabase/server";

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  permalink_url: string;
}

export interface FacebookPostResponse {
  id: string;
  success: boolean;
}

export class FacebookClient {
  private accessToken: string;
  private apiVersion = "v21.0"; // Use latest stable version

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Get the base URL for Facebook Graph API
   */
  private getApiUrl(endpoint: string): string {
    return `https://graph.facebook.com/${this.apiVersion}${endpoint}`;
  }

  /**
   * Make an authenticated request to Facebook Graph API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, string> } = {}
  ): Promise<T> {
    const url = this.getApiUrl(endpoint);
    const params = new URLSearchParams({
      access_token: this.accessToken,
      ...(options.params || {}),
    });

    const { params: _, ...fetchOptions } = options;

    const response = await fetch(`${url}?${params}`, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      throw new Error(error.error?.message || `Facebook API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user's Facebook pages
   * Note: User needs 'pages_show_list' and 'pages_read_engagement' permissions
   */
  async getPages(): Promise<FacebookPage[]> {
    const url = this.getApiUrl("/me/accounts");
    const params = new URLSearchParams({
      access_token: this.accessToken,
      fields: "id,name,access_token,category,picture{url}",
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to get pages");
    }

    return data.data || [];
  }

  /**
   * Get a specific page by ID
   * Note: This requires a page access token, not a user access token
   */
  async getPage(pageId: string, pageAccessToken?: string): Promise<FacebookPage> {
    const token = pageAccessToken || this.accessToken;
    const url = this.getApiUrl(`/${pageId}`);
    const params = new URLSearchParams({
      access_token: token,
      fields: "id,name,access_token,category,picture{url}",
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to get page");
    }

    return data;
  }

  /**
   * Create a post on a Facebook page
   * @param pageId - The Facebook page ID
   * @param message - The post message/caption
   * @param imageUrl - Optional image URL to attach
   * @param link - Optional link to attach
   */
  async createPost(
    pageId: string,
    message: string,
    options?: {
      imageUrl?: string;
      link?: string;
      scheduledTime?: Date;
    }
  ): Promise<FacebookPostResponse> {
    // Get page access token
    const page = await this.getPage(pageId);
    const pageAccessToken = page.access_token;

    const url = this.getApiUrl(`/${pageId}/posts`);

    // If image is provided, we need to use photos endpoint first
    if (options?.imageUrl) {
      // Upload photo first
      const photoResponse = await fetch(
        this.getApiUrl(`/${pageId}/photos`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: options.imageUrl,
            message: message,
            published: !options.scheduledTime, // If scheduled, don't publish immediately
            access_token: pageAccessToken,
          }),
        }
      );

      const photoData = await photoResponse.json();
      
      if (!photoResponse.ok) {
        throw new Error(photoData.error?.message || "Failed to upload photo");
      }

      return {
        id: photoData.post_id || photoData.id,
        success: true,
      };
    }

    // Create text post or link post
    const postData: Record<string, string> = {
      message: message,
      access_token: pageAccessToken,
    };

    if (options?.link) {
      postData.link = options.link;
    }

    if (options?.scheduledTime) {
      // Scheduled posts require different endpoint
      postData.published = "false";
      postData.scheduled_publish_time = Math.floor(options.scheduledTime.getTime() / 1000).toString();
      // Note: For scheduled posts, you need to use /page_id/feed endpoint
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to create post");
    }

    return {
      id: data.id,
      success: true,
    };
  }

  /**
   * Get posts from a Facebook page
   */
  async getPosts(pageId: string, pageAccessToken: string, limit = 25): Promise<FacebookPost[]> {
    const url = this.getApiUrl(`/${pageId}/posts`);
    const params = new URLSearchParams({
      access_token: pageAccessToken,
      fields: "id,message,created_time,permalink_url",
      limit: limit.toString(),
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to get posts");
    }

    return data.data || [];
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<boolean> {
    try {
      await this.request(`/${postId}`, {
        method: "DELETE",
      });
      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      return false;
    }
  }

  /**
   * Exchange short-lived token for long-lived token
   * Long-lived tokens last ~60 days
   */
  static async exchangeForLongLivedToken(
    shortLivedToken: string,
    appId: string,
    appSecret: string
  ): Promise<{ access_token: string; expires_in: number }> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to exchange token");
    }

    return response.json();
  }

  /**
   * Refresh access token if expired
   */
  async refreshToken(): Promise<string> {
    // Implement token refresh logic
    // This typically involves using the refresh_token
    throw new Error("Token refresh not implemented");
  }

  /**
   * Get user profile information
   */
  async getUserInfo(): Promise<{ id: string; name: string; email?: string }> {
    const url = this.getApiUrl("/me");
    const params = new URLSearchParams({
      access_token: this.accessToken,
      fields: "id,name,email",
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to get user info");
    }

    return data;
  }
}

/**
 * Helper function to get Facebook client for a user
 */
export async function getFacebookClient(userId: string): Promise<FacebookClient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("token, expires_at")
    .eq("user_id", userId)
    .eq("platform", "facebook")
    .single();

  if (error || !data || !data.token) {
    return null;
  }

  // Check if token is expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    // Token expired, would need to refresh
    console.warn("Facebook token expired");
    return null;
  }

  return new FacebookClient(data.token);
}

