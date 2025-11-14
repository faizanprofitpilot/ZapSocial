# Social Media API Integration Setup Guide

This guide provides step-by-step instructions for setting up Facebook and Instagram API integrations in ZapSocial.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Facebook App Setup](#facebook-app-setup)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Testing the Integration](#testing-the-integration)
6. [API Usage Examples](#api-usage-examples)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### For Facebook Integration:
- Facebook Developer Account: [developers.facebook.com](https://developers.facebook.com/)
- Facebook Page (required for Instagram)
- Facebook App (we'll create this)

### For Instagram Integration:
- Instagram Business or Creator account
- Instagram account linked to your Facebook Page
- All Facebook prerequisites (Instagram uses Facebook Graph API)

## Facebook App Setup

### Step 1: Create Facebook App

1. Go to [Facebook Developers Dashboard](https://developers.facebook.com/apps/)
2. Click **"Create App"**
3. Select **"Business"** as app type
4. Fill in:
   - **App Name**: ZapSocial (or your preferred name)
   - **App Contact Email**: Your email address
5. Click **"Create App"**

### Step 2: Add Products

In your app dashboard, add these products:

1. **Facebook Login**
   - Go to **Products** → **Facebook Login** → **Settings**
   - Add **Valid OAuth Redirect URIs**:
     ```
     http://localhost:3000/api/integrations/oauth/facebook/callback
     https://yourdomain.com/api/integrations/oauth/facebook/callback
     ```
   - Click **"Save Changes"**

2. **Instagram Graph API**
   - Go to **Products** → **Instagram**
   - Click **"Set Up"** on **Instagram Graph API**

### Step 3: Configure Basic Settings

1. Go to **Settings** → **Basic**
2. Add **App Domains** (for production):
   ```
   yourdomain.com
   ```
3. Add **Privacy Policy URL** (required)
4. Add **Terms of Service URL** (required)
5. Note your **App ID** and **App Secret** (you'll need these)

### Step 4: Request Permissions

Go to **App Review** → **Permissions and Features** and request:

**Required Permissions:**
- `pages_show_list` - List user's Facebook Pages
- `pages_read_engagement` - Read page engagement metrics
- `pages_manage_posts` - Create and manage posts
- `pages_read_user_content` - Read user content (for Instagram)
- `business_management` - Manage business assets
- `instagram_basic` - Instagram account info
- `instagram_content_publish` - Publish to Instagram

**Note:** For development, you can test with your own account without App Review. For production, you must submit for review.

## Environment Variables

Create or update your `.env.local` file:

```env
# Facebook/Instagram API Credentials
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here

# App URL (required for OAuth redirects)
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production (uncomment and update)
# NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**⚠️ Important:**
- Never commit `.env.local` to version control
- Add `.env.local` to `.gitignore`
- Keep `FACEBOOK_APP_SECRET` secure

## Database Setup

### Step 1: Add Metadata Column (if not exists)

Run this SQL in your Supabase SQL Editor:

```sql
-- Add metadata column to store additional integration data (pages, etc.)
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS metadata JSONB;
```

### Step 2: Verify Integrations Table

Ensure your `integrations` table has these columns:
- `id` (UUID)
- `user_id` (UUID)
- `platform` (TEXT)
- `token` (TEXT)
- `refresh_token` (TEXT, nullable)
- `expires_at` (TIMESTAMP, nullable)
- `connected_at` (TIMESTAMP)
- `metadata` (JSONB, nullable)

## File Structure

The integration structure has been set up as follows:

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
      ├── route.ts          # Facebook OAuth initiation
      └── callback/
          └── route.ts      # Facebook OAuth callback
```

## Testing the Integration

### Step 1: Start Development Server

```bash
npm run dev
```

### Step 2: Test OAuth Flow

1. Navigate to `/integrations`
2. Click **"Connect"** on Facebook or Instagram card
3. You'll be redirected to Facebook login
4. Grant all requested permissions
5. You'll be redirected back to `/integrations`
6. The card should show **"Connected"**

### Step 3: Verify in Database

Check your Supabase `integrations` table:
- Should have a row with `platform = 'facebook'`
- `token` should contain the access token
- `expires_at` should be set (60 days for long-lived tokens)
- `metadata` should contain page information

## API Usage Examples

### Post to Facebook Page

```typescript
import { getFacebookClient } from "@/lib/facebook/client";

// Get client for user
const client = await getFacebookClient(userId);
if (!client) {
  throw new Error("Facebook not connected");
}

// Get user's pages
const pages = await client.getPages();
const pageId = pages[0].id;

// Create a post
await client.createPost(pageId, "Hello from ZapSocial!", {
  imageUrl: "https://example.com/image.jpg",
  link: "https://example.com",
});
```

### Post to Instagram

```typescript
import { getInstagramClient } from "@/lib/instagram/client";

// Get client for user
const client = await getInstagramClient(userId);
if (!client) {
  throw new Error("Instagram not connected");
}

// Get pages (Instagram requires a Facebook page)
const { getFacebookClient } = await import("@/lib/facebook/client");
const fbClient = await getFacebookClient(userId);
const pages = await fbClient!.getPages();
const pageId = pages[0].id;

// Create an Instagram post
await client.createPost(
  pageId,
  "https://example.com/image.jpg",
  "Check out this amazing content! #socialmedia"
);
```

### Post Carousel to Instagram

```typescript
// Post multiple images as carousel
await client.createCarouselPost(
  pageId,
  [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg",
  ],
  "Check out these amazing photos! #photography"
);
```

### Schedule a Post

```typescript
const scheduledTime = new Date("2024-12-25T10:00:00Z");

// Facebook
await client.createPost(pageId, "Merry Christmas!", {
  scheduledTime,
});

// Instagram
await client.createPost(pageId, imageUrl, "Merry Christmas!", {
  scheduledTime,
});
```

## Troubleshooting

### Issue: "Redirect URI mismatch"

**Solution:**
- Verify redirect URI in Facebook App settings matches exactly
- Check for trailing slashes
- Ensure `NEXT_PUBLIC_APP_URL` matches your app domain
- Update redirect URI to match exactly: `http://localhost:3000/api/integrations/oauth/facebook/callback`

### Issue: "Invalid OAuth Access Token"

**Solution:**
- Tokens expire after 60 days (long-lived) or 1 hour (short-lived)
- Check `expires_at` in database
- Implement token refresh before expiration
- Re-authenticate if token is expired

### Issue: "Instagram account not found"

**Solution:**
- Ensure Instagram account is converted to Business account
- Verify Instagram is connected to Facebook Page
- Check that Facebook Page has Instagram Business account linked
- In Instagram Settings → Account → Switch to Professional Account → Business

### Issue: "Missing permissions"

**Solution:**
- Ensure all required permissions are requested in OAuth flow
- User must grant all permissions during login
- Check App Review status for each permission
- For development, use your own account (no review needed)

### Issue: "Page access token required"

**Solution:**
- Instagram API requires page access token, not user access token
- Ensure you're using the page access token from `/me/accounts`
- Store page access tokens in metadata for easy access

## Token Management

### Token Types

1. **User Access Token** (short-lived: 1 hour)
   - Used to access user's pages
   - Can be exchanged for long-lived token

2. **Long-lived User Token** (60 days)
   - Exchanged from short-lived token
   - Used to get page access tokens

3. **Page Access Token** (doesn't expire if page is connected)
   - Required for posting to pages
   - Required for Instagram API
   - Retrieved from `/me/accounts` endpoint

### Token Refresh

Implement token refresh before expiration:

```typescript
// Check if token expires soon
const expiresAt = new Date(integration.expires_at);
const now = new Date();
const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

if (daysUntilExpiry < 7) {
  // Refresh token
  const newToken = await FacebookClient.exchangeForLongLivedToken(
    integration.token,
    FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET
  );
  // Update in database
}
```

## Security Best Practices

1. **Encrypt tokens** before storing in database
2. **Never expose** `FACEBOOK_APP_SECRET` to client-side code
3. **Use HTTPS** in production for OAuth callbacks
4. **Validate state parameter** to prevent CSRF attacks
5. **Refresh tokens** before they expire
6. **Store tokens securely** - consider using Supabase Vault
7. **Implement rate limiting** for API calls
8. **Log errors** but don't expose sensitive data

## Next Steps

1. ✅ OAuth flow implemented
2. ✅ API clients created
3. ⬜ Implement token refresh mechanism
4. ⬜ Add UI for selecting page/account
5. ⬜ Implement disconnect functionality
6. ⬜ Add webhook handling for events
7. ⬜ Implement error handling for expired tokens
8. ⬜ Add encryption for stored tokens

## Resources

- [Facebook Graph API Docs](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Facebook OAuth Guide](https://developers.facebook.com/docs/facebook-login)
- [App Review Guide](https://developers.facebook.com/docs/app-review)
- [Instagram Publishing Guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)

