/**
 * Instagram Graph API Client
 * 
 * This client handles Instagram API interactions including:
 * - OAuth authentication
 * - Posting content (photos, videos, carousels)
 * - Fetching Instagram Business accounts
 * - Managing media containers
 * 
 * Note: Instagram API requires a Facebook Page connected to an Instagram Business account
 */

import { FacebookClient } from "../facebook/client";

export interface InstagramAccount {
  id: string;
  username: string;
  account_type: "BUSINESS" | "MEDIA_CREATOR";
}

export interface InstagramMediaContainer {
  id: string;
  status_code: "IN_PROGRESS" | "FINISHED" | "ERROR";
  status: string;
}

export interface InstagramPost {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  caption?: string;
  timestamp: string;
  permalink: string;
  like_count?: number;
  comments_count?: number;
}

export interface InstagramPostResponse {
  id: string;
  containerId?: string;
  success: boolean;
}

export class InstagramClient {
  private facebookClient: FacebookClient;
  private apiVersion = "v21.0";

  constructor(facebookClient: FacebookClient) {
    this.facebookClient = facebookClient;
  }

  /**
   * Get the base URL for Instagram Graph API
   */
  private getApiUrl(endpoint: string): string {
    return `https://graph.facebook.com/${this.apiVersion}${endpoint}`;
  }

  /**
   * Get Instagram Business accounts associated with a Facebook page
   * @param pageId - The Facebook page ID connected to Instagram
   */
  async getInstagramAccounts(pageId: string): Promise<InstagramAccount[]> {
    // First, get the page to get the page access token
    const pages = await this.facebookClient.getPages();
    const page = pages.find(p => p.id === pageId);
    
    if (!page || !page.access_token) {
      throw new Error("Page not found or no access token");
    }

    const pageAccessToken = page.access_token;
    
    // Get Instagram Business Account ID from the page
    const url = this.getApiUrl(`/${pageId}`);
    const params = new URLSearchParams({
      access_token: pageAccessToken,
      fields: "instagram_business_account",
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to get Instagram account");
    }

    if (!data.instagram_business_account) {
      return [];
    }

    const igAccountId = data.instagram_business_account.id;

    // Get account details
    const accountUrl = this.getApiUrl(`/${igAccountId}`);
    const accountParams = new URLSearchParams({
      access_token: pageAccessToken,
      fields: "id,username,account_type",
    });

    const accountResponse = await fetch(`${accountUrl}?${accountParams}`);
    const accountData = await accountResponse.json();

    if (!accountResponse.ok) {
      throw new Error(accountData.error?.message || "Failed to get Instagram account details");
    }
    
    return [accountData as InstagramAccount];
  }

  /**
   * Create an Instagram Media Container (required before publishing)
   * @param igAccountId - Instagram Business Account ID
   * @param imageUrl - Image URL to post
   * @param caption - Post caption
   * @param pageAccessToken - Facebook Page access token
   */
  async createMediaContainer(
    igAccountId: string,
    imageUrl: string,
    caption: string,
    pageAccessToken: string,
    options?: {
      mediaType?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
      children?: string[]; // For carousels, array of media IDs
      locationId?: string;
      scheduledTime?: Date;
      published?: boolean;
    }
  ): Promise<InstagramMediaContainer> {
    const url = this.getApiUrl(`/${igAccountId}/media`);

    const containerData: Record<string, string | boolean> = {
      image_url: imageUrl,
      caption: caption,
      access_token: pageAccessToken,
    };

    if (options?.mediaType) {
      containerData.media_type = options.mediaType;
    }

    if (options?.children) {
      containerData.children = options.children.join(",");
    }

    if (options?.locationId) {
      containerData.location_id = options.locationId;
    }

    // For scheduled posts
    if (options?.scheduledTime) {
      containerData.published = false;
      containerData.scheduled_publish_time = Math.floor(options.scheduledTime.getTime() / 1000).toString();
    } else {
      containerData.published = options?.published !== undefined ? options.published : true;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(containerData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to create media container");
    }

    return {
      id: data.id,
      status_code: data.status_code || "IN_PROGRESS",
      status: data.status || "IN_PROGRESS",
    };
  }

  /**
   * Publish a media container
   * @param igAccountId - Instagram Business Account ID
   * @param creationId - Media container ID from createMediaContainer
   * @param pageAccessToken - Facebook Page access token
   */
  async publishMedia(
    igAccountId: string,
    creationId: string,
    pageAccessToken: string
  ): Promise<InstagramPostResponse> {
    const url = this.getApiUrl(`/${igAccountId}/media_publish`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: pageAccessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to publish media");
    }

    return {
      id: data.id,
      containerId: creationId,
      success: true,
    };
  }

  /**
   * Create a single image post on Instagram
   */
  async createPost(
    pageId: string,
    imageUrl: string,
    caption: string,
    options?: {
      scheduledTime?: Date;
      locationId?: string;
    }
  ): Promise<InstagramPostResponse> {
    // Get user's pages first to get page access token
    const pages = await this.facebookClient.getPages();
    const page = pages.find(p => p.id === pageId);
    
    if (!page || !page.access_token) {
      throw new Error("Page not found or no access token");
    }

    const pageAccessToken = page.access_token;

    // Get Instagram Business Account
    const accounts = await this.getInstagramAccounts(pageId);
    if (accounts.length === 0) {
      throw new Error("No Instagram Business account found for this page");
    }

    const igAccountId = accounts[0].id;

    // Create media container
    const container = await this.createMediaContainer(
      igAccountId,
      imageUrl,
      caption,
      pageAccessToken,
      {
        scheduledTime: options?.scheduledTime,
        locationId: options?.locationId,
      }
    );

    // If not scheduled, publish immediately
    if (!options?.scheduledTime) {
      return this.publishMedia(igAccountId, container.id, pageAccessToken);
    }

    // For scheduled posts, just return the container ID
    return {
      id: container.id,
      containerId: container.id,
      success: true,
    };
  }

  /**
   * Create a carousel post (multiple images)
   */
  async createCarouselPost(
    pageId: string,
    imageUrls: string[],
    caption: string,
    options?: {
      scheduledTime?: Date;
      locationId?: string;
    }
  ): Promise<InstagramPostResponse> {
    // Get user's pages first to get page access token
    const pages = await this.facebookClient.getPages();
    const page = pages.find(p => p.id === pageId);
    
    if (!page || !page.access_token) {
      throw new Error("Page not found or no access token");
    }

    const pageAccessToken = page.access_token;

    // Get Instagram Business Account
    const accounts = await this.getInstagramAccounts(pageId);
    if (accounts.length === 0) {
      throw new Error("No Instagram Business account found for this page");
    }

    const igAccountId = accounts[0].id;

    // Create individual media containers for each image
    const children: string[] = [];
    for (const imageUrl of imageUrls) {
      const container = await this.createMediaContainer(
        igAccountId,
        imageUrl,
        "", // No caption for individual items in carousel
        pageAccessToken,
        {
          published: false,
        }
      );
      children.push(container.id);
    }

    // Create carousel container
    const carouselContainer = await this.createMediaContainer(
      igAccountId,
      imageUrls[0], // First image
      caption,
      pageAccessToken,
      {
        mediaType: "CAROUSEL_ALBUM",
        children: children,
        scheduledTime: options?.scheduledTime,
        locationId: options?.locationId,
      }
    );

    // If not scheduled, publish immediately
    if (!options?.scheduledTime) {
      return this.publishMedia(igAccountId, carouselContainer.id, pageAccessToken);
    }

    return {
      id: carouselContainer.id,
      containerId: carouselContainer.id,
      success: true,
    };
  }

  /**
   * Get media from Instagram account
   */
  async getMedia(
    pageId: string,
    limit = 25
  ): Promise<InstagramPost[]> {
    // Get user's pages first to get page access token
    const pages = await this.facebookClient.getPages();
    const page = pages.find(p => p.id === pageId);
    
    if (!page || !page.access_token) {
      throw new Error("Page not found or no access token");
    }

    const pageAccessToken = page.access_token;

    const accounts = await this.getInstagramAccounts(pageId);
    if (accounts.length === 0) {
      return [];
    }

    const igAccountId = accounts[0].id;

    const url = this.getApiUrl(`/${igAccountId}/media`);
    const params = new URLSearchParams({
      access_token: pageAccessToken,
      fields: "id,media_type,media_url,caption,timestamp,permalink,like_count,comments_count",
      limit: limit.toString(),
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to get media");
    }

    return data.data || [];
  }

  /**
   * Delete a media post
   */
  async deleteMedia(mediaId: string, pageAccessToken: string): Promise<boolean> {
    try {
      const response = await fetch(this.getApiUrl(`/${mediaId}`), {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${pageAccessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to delete media");
      }

      return true;
    } catch (error) {
      console.error("Error deleting media:", error);
      return false;
    }
  }
}

/**
 * Helper function to get Instagram client for a user
 */
export async function getInstagramClient(userId: string): Promise<InstagramClient | null> {
  const { FacebookClient, getFacebookClient } = await import("../facebook/client");
  
  const facebookClient = await getFacebookClient(userId);
  if (!facebookClient) {
    return null;
  }

  return new InstagramClient(facebookClient);
}

