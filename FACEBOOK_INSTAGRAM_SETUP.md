# Facebook & Instagram API Integration Setup Guide

This guide will help you set up Facebook and Instagram API integrations for ZapSocial.

## Prerequisites

1. **Facebook Developer Account**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a developer account (if you don't have one)
   - Create a new Facebook App

2. **Facebook Page**
   - You need a Facebook Page to connect Instagram
   - The Instagram account must be a Business or Creator account
   - The Instagram account must be connected to your Facebook Page

3. **Instagram Business Account**
   - Your Instagram account must be converted to a Business account
   - Link it to your Facebook Page in Instagram Settings

## Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Click "Create App"
3. Select "Business" as the app type
4. Fill in:
   - **App Name**: ZapSocial (or your preferred name)
   - **App Contact Email**: Your email
   - Click "Create App"

## Step 2: Add Products to Your App

1. In your app dashboard, find "Add Products to Your App"
2. Add the following products:
   - **Facebook Login**
   - **Instagram Basic Display** (for Instagram content)
   - **Instagram Graph API** (for posting)

## Step 3: Configure Facebook Login

1. Go to **Facebook Login** → **Settings**
2. Add **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3000/api/integrations/oauth/facebook/callback (for development)
   https://yourdomain.com/api/integrations/oauth/facebook/callback (for production)
   ```
3. Click "Save Changes"

## Step 4: Configure Instagram Graph API

1. Go to **Products** → **Instagram** → **Basic Display** (or **Instagram Graph API**)
2. For **Instagram Graph API**:
   - Add your Instagram Business Account
   - Request access to:
     - `instagram_basic`
     - `instagram_content_publish`
     - `pages_read_user_content`
     - `pages_show_list`
     - `pages_manage_posts`

## Step 5: Configure App Settings

1. Go to **Settings** → **Basic**
2. Note your:
   - **App ID**
   - **App Secret** (click "Show" to reveal)
3. Add **App Domains** (for production):
   ```
   yourdomain.com
   ```
4. Add **Privacy Policy URL** and **Terms of Service URL** (required for review)

## Step 6: Request Permissions

### Required Facebook Permissions:
- `pages_show_list` - To list user's Facebook Pages
- `pages_read_engagement` - To read page engagement metrics
- `pages_manage_posts` - To create and manage posts on Pages
- `pages_read_user_content` - To read user content (for Instagram)
- `business_management` - To manage business assets

### Required Instagram Permissions:
- `instagram_basic` - Basic Instagram account info
- `instagram_content_publish` - To publish content to Instagram

## Step 7: Environment Variables

Add these to your `.env.local` file:

```env
# Facebook/Instagram API Credentials
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here

# App URL (required for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For development
# NEXT_PUBLIC_APP_URL=https://yourdomain.com  # For production
```

**⚠️ Important**: Never commit `.env.local` to version control!

## Step 8: Database Schema Update

The integrations table should already have the necessary fields. If you need to add a metadata column for storing page info:

```sql
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS metadata JSONB;
```

Run this in your Supabase SQL Editor if the column doesn't exist.

## Step 9: App Review (For Production)

Before going to production, you need to submit your app for Facebook App Review:

1. Go to **App Review** → **Permissions and Features**
2. Request each permission:
   - `pages_manage_posts`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - etc.
3. Provide:
   - Screenshots/videos of your app
   - Use case description
   - Privacy policy URL
   - Terms of service URL

**Note**: During development, you can use your own Facebook account and Instagram account to test without review.

## Step 10: Testing the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to `/integrations` page
3. Click "Connect" on Facebook or Instagram
4. You'll be redirected to Facebook login
5. Grant permissions
6. You'll be redirected back to your app
7. The integration should be saved and displayed as "Connected"

## Troubleshooting

### Common Issues

1. **"Redirect URI mismatch"**
   - Make sure the redirect URI in Facebook App settings matches exactly
   - Check for trailing slashes
   - Ensure `NEXT_PUBLIC_APP_URL` is set correctly

2. **"Invalid OAuth Access Token"**
   - Tokens expire after 60 days (long-lived) or 1 hour (short-lived)
   - Implement token refresh logic
   - Check if token is expired in database

3. **"Instagram account not found"**
   - Ensure Instagram account is a Business account
   - Verify Instagram is connected to Facebook Page
   - Check that page has Instagram Business account linked

4. **"Missing permissions"**
   - Ensure all required permissions are requested
   - User must grant all permissions during OAuth
   - Check App Review status for each permission

### Token Management

- **Short-lived tokens**: Last 1 hour
- **Long-lived tokens**: Last ~60 days
- **Page access tokens**: Don't expire if page is connected
- **Instagram tokens**: Use page access token from connected Facebook Page

## API Usage Examples

### Post to Facebook Page

```typescript
import { getFacebookClient } from "@/lib/facebook/client";

const client = await getFacebookClient(userId);
if (client) {
  const pages = await client.getPages();
  const pageId = pages[0].id;
  
  await client.createPost(pageId, "Hello World!", {
    imageUrl: "https://example.com/image.jpg",
  });
}
```

### Post to Instagram

```typescript
import { getInstagramClient } from "@/lib/instagram/client";

const client = await getInstagramClient(userId);
if (client) {
  const pages = await getFacebookClient(userId).getPages();
  const pageId = pages[0].id;
  
  await client.createPost(
    pageId,
    "https://example.com/image.jpg",
    "Check out this amazing content!",
  );
}
```

## Security Best Practices

1. **Encrypt tokens** before storing in database
2. **Never expose** `FACEBOOK_APP_SECRET` to client-side code
3. **Use HTTPS** in production for OAuth callbacks
4. **Validate state parameter** to prevent CSRF attacks
5. **Refresh tokens** before they expire
6. **Store tokens securely** - consider using Supabase Vault or similar

## Next Steps

1. Implement token refresh mechanism
2. Add error handling for expired tokens
3. Implement webhook handling for Instagram/Facebook events
4. Add UI for selecting which page/account to use
5. Add disconnect functionality

## Resources

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Facebook OAuth Documentation](https://developers.facebook.com/docs/facebook-login)
- [App Review Guide](https://developers.facebook.com/docs/app-review)

