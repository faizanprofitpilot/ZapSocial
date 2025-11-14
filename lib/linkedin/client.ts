/**
 * LinkedIn API Client
 * 
 * LinkedIn API Documentation: https://learn.microsoft.com/en-us/linkedin/
 */

export interface LinkedInProfile {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
}

export interface LinkedInOrganization {
  id: string;
  name: string;
  role: string;
  vanityName?: string;
}

export interface CreatePostOptions {
  text: string;
  organizationId?: string; // If provided, post as organization
  visibility?: "PUBLIC" | "CONNECTIONS";
  media?: {
    id: string;
    title?: string;
    description?: string;
  };
}

export interface LinkedInPost {
  id: string;
  activity: string;
  created: {
    time: number;
  };
}

export class LinkedInClient {
  private accessToken: string;
  private baseUrl = "https://api.linkedin.com/v2";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Get user profile using OpenID Connect
   */
  async getProfile(): Promise<LinkedInProfile> {
    const response = await fetch(`${this.baseUrl.replace("/v2", "")}/userinfo`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Failed to get profile: ${response.statusText}`);
    }

    return data;
  }

  /**
   * Get user's organizations
   */
  async getOrganizations(): Promise<LinkedInOrganization[]> {
    const response = await fetch(`${this.baseUrl}/organizationalEntityAcls?q=roleAssignee`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Failed to get organizations: ${response.statusText}`);
    }

    if (!data.elements) {
      return [];
    }

    // Fetch details for each organization
    const orgDetailsPromises = data.elements.map(async (element: any) => {
      const orgId = element.organizationalTarget?.split(":").pop();
      if (!orgId) return null;

      try {
        const orgDetailUrl = `${this.baseUrl}/organizations/${orgId}`;
        const orgDetailResponse = await fetch(orgDetailUrl, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        });

        const orgDetailData = await orgDetailResponse.json();
        if (orgDetailResponse.ok && orgDetailData) {
          return {
            id: orgId,
            name: orgDetailData.localizedName || orgDetailData.name,
            role: element.role,
            vanityName: orgDetailData.vanityName,
          };
        }
      } catch (error) {
        console.error(`Error fetching organization ${orgId}:`, error);
      }
      return null;
    });

    const organizations = await Promise.all(orgDetailsPromises);
    return organizations.filter(Boolean) as LinkedInOrganization[];
  }

  /**
   * Create a post (as user or organization)
   */
  async createPost(options: CreatePostOptions): Promise<LinkedInPost> {
    const {
      text,
      organizationId,
      visibility = "PUBLIC",
      media,
    } = options;

    // Build the post payload
    const postPayload: any = {
      author: organizationId
        ? `urn:li:organization:${organizationId}`
        : "urn:li:person:" + (await this.getProfile()).sub,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: text,
          },
          shareMediaCategory: media ? "IMAGE" : "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": visibility,
      },
    };

    // Add media if provided
    if (media) {
      postPayload.specificContent["com.linkedin.ugc.ShareContent"].media = [
        {
          status: "READY",
          media: media.id,
          title: {
            text: media.title || "",
          },
          description: {
            text: media.description || "",
          },
        },
      ];
    }

    // Determine the endpoint based on whether it's a user or organization post
    const endpoint = organizationId
      ? `${this.baseUrl}/ugcPosts` // Organization posts
      : `${this.baseUrl}/ugcPosts`; // User posts (same endpoint)

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error?.message || `Failed to create post: ${response.statusText}`);
    }

    return data;
  }

  /**
   * Upload an image for use in posts
   */
  async uploadImage(imageUrl: string, organizationId?: string, title?: string, description?: string): Promise<string> {
    // LinkedIn requires images to be registered before use
    // First, register the image
    const profile = await this.getProfile();
    const ownerUrn = organizationId 
      ? `urn:li:organization:${organizationId}`
      : `urn:li:person:${profile.sub}`;
    
    const registerPayload = {
      initializeUploadRequest: {
        owner: ownerUrn,
      },
    };

    const registerResponse = await fetch(`${this.baseUrl}/assets?action=registerUpload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(registerPayload),
    });

    const registerData = await registerResponse.json();

    if (!registerResponse.ok) {
      throw new Error(registerData.message || registerData.error?.message || "Failed to register image upload");
    }

    const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
    const assetId = registerData.value.asset;

    // Download the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download image");
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Upload the image to LinkedIn
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": imageResponse.headers.get("content-type") || "image/jpeg",
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload image to LinkedIn");
    }

    // Return the asset ID for use in posts
    return assetId;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number; refresh_token?: string }> {
    const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
    const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;

    const tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";
    const tokenParams = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || data.error || "Failed to refresh token");
    }

    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
    };
  }
}

