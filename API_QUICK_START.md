# Facebook & Instagram API Quick Start

Quick reference guide for using the Facebook and Instagram API integrations.

## 🚀 Quick Setup Checklist

### 1. Environment Variables

Add to `.env.local`:

```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Migration

Run this SQL in Supabase:

```sql
-- Add metadata column (if not exists)
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS metadata JSONB;
```

Or use the migration file: `supabase/add-integration-metadata.sql`

### 3. Facebook App Setup

1. Create app at [developers.facebook.com](https://developers.facebook.com/apps/)
2. Add **Facebook Login** product
3. Add redirect URI: `http://localhost:3000/api/integrations/oauth/facebook/callback`
4. Request permissions:
   - `pages_show_list`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
5. Get **App ID** and **App Secret**

### 4. Test Connection

1. Go to `/integrations`
2. Click "Connect" on Facebook/Instagram
3. Grant permissions
4. Should redirect back and show "Connected"

## 📚 API Usage

### Facebook API Client

```typescript
import { getFacebookClient } from "@/lib/facebook/client";

// Get client
const client = await getFacebookClient(userId);

// Get user's pages
const pages = await client.getPages();
const pageId = pages[0].id;

// Create post
await client.createPost(pageId, "Hello World!", {
  imageUrl: "https://example.com/image.jpg",
});
```

### Instagram API Client

```typescript
import { getInstagramClient } from "@/lib/instagram/client";
import { getFacebookClient } from "@/lib/facebook/client";

// Get client
const igClient = await getInstagramClient(userId);

// Get pages (Instagram needs Facebook page)
const fbClient = await getFacebookClient(userId);
const pages = await fbClient.getPages();
const pageId = pages[0].id;

// Create Instagram post
await igClient.createPost(
  pageId,
  "https://example.com/image.jpg",
  "Amazing content! #socialmedia"
);

// Create carousel
await igClient.createCarouselPost(
  pageId,
  ["url1.jpg", "url2.jpg", "url3.jpg"],
  "Check out these photos!"
);
```

## 🔑 Key Concepts

### Token Types

1. **User Access Token** - Short-lived (1 hour) or long-lived (60 days)
   - Used to access user's pages
   - Exchanged for long-lived token automatically in OAuth flow

2. **Page Access Token** - Doesn't expire (if page is connected)
   - Required for posting to Facebook pages
   - Required for all Instagram API calls
   - Retrieved from `/me/accounts` endpoint

### Instagram Requirements

- Instagram account must be **Business** or **Creator** account
- Instagram account must be **linked to a Facebook Page**
- Use page access token (not user access token)

## 📝 File Structure

```
lib/
  ├── facebook/
  │   └── client.ts          # Facebook Graph API client
  └── instagram/
      └── client.ts          # Instagram Graph API client

app/api/integrations/oauth/
  ├── [platform]/
  │   └── route.ts          # Generic OAuth handler
  └── facebook/
      ├── route.ts          # OAuth initiation
      └── callback/
          └── route.ts      # OAuth callback handler
```

## 🐛 Common Issues

**Redirect URI mismatch**
→ Check redirect URI in Facebook App settings matches exactly

**Token expired**
→ Tokens expire after 60 days. Implement refresh before expiration.

**Instagram account not found**
→ Ensure Instagram is Business account and linked to Facebook Page

**Missing permissions**
→ User must grant all permissions during OAuth flow

## 📖 Full Documentation

See `FACEBOOK_INSTAGRAM_SETUP.md` for detailed setup instructions.

See `SOCIAL_API_SETUP.md` for comprehensive guide.

