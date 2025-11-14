export type ContentType = "keyword" | "youtube" | "caption" | "bulk";

export type Tone = "friendly" | "corporate" | "playful" | "expert";

export type Length = "short" | "medium" | "long";

export type SubscriptionTier = "free" | "pro" | "enterprise";

export interface Content {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: ContentType;
  keywords?: string;
  metadata?: {
    tone?: Tone;
    length?: Length;
    transcript?: string;
    video_url?: string;
    captions?: string[];
    [key: string]: any;
  };
  created_at: string;
  updated_at?: string;
}

export interface Generation {
  id: string;
  user_id: string;
  type: ContentType;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  subscription_tier: SubscriptionTier;
  generations_this_month: number;
  created_at: string;
}

export interface ZapierWebhook {
  id: string;
  user_id: string;
  webhook_url: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  caption: string;
  hashtags?: string[];
  platform: "instagram" | "linkedin" | "x" | "facebook";
  status: "draft" | "scheduled" | "published" | "failed";
  scheduled_at?: string;
  image_url?: string;
  engagement_data?: {
    tone?: string;
    wordCount?: number;
    includeEmojis?: boolean;
    generateHashtags?: boolean;
    [key: string]: any;
  };
  created_at: string;
  updated_at?: string;
}

