# LinkedIn API Setup Guide

This guide will walk you through setting up LinkedIn API integration for Zapwrite.

## Step 1: Create a LinkedIn Developer App

1. **Go to LinkedIn Developer Portal**
   - Visit: https://www.linkedin.com/developers/
   - Sign in with your LinkedIn account

2. **Create a New App**
   - Click the **"Create app"** button
   - Fill in the app details:
     - **App name**: `Zapwrite` (or your preferred name)
     - **LinkedIn Page**: Select a LinkedIn Page associated with your account (or create one)
     - **Privacy Policy URL**: `https://yourdomain.com/privacy` (use your actual privacy policy URL)
     - **App logo**: Upload a logo (optional)
   - Check the **"I agree to the LinkedIn API Terms of Use"** checkbox
   - Click **"Create app"**

3. **Verify Your App**
   - LinkedIn may require email verification
   - Complete any verification steps if prompted

## Step 2: Configure OAuth 2.0 Settings

1. **Navigate to Auth Tab**
   - In your app dashboard, click on the **"Auth"** tab

2. **Get Your Credentials**
   - Note down your **Client ID** (you'll see this as "Client ID" or "Application (client) ID")
   - Note down your **Client Secret** (click "Show" to reveal it)
   - ⚠️ **Important**: Save these securely - you'll need them for environment variables

3. **Add Redirect URLs**
   - Under **"OAuth 2.0 settings"**, find **"Authorized redirect URLs for your app"**
   - Add your redirect URL:
     - **For Development**: `http://localhost:3000/api/integrations/oauth/linkedin/callback`
     - **For Production**: `https://yourdomain.com/api/integrations/oauth/linkedin/callback`
   - Click **"Update"** to save

## Step 3: Request API Access (Products)

1. **Navigate to Products Tab**
   - Click on the **"Products"** tab in your app dashboard

2. **Request Required Products**
   - You need to request access to these products:
     - **✅ Sign In with LinkedIn using OpenID Connect** (for authentication)
     - **✅ Share on LinkedIn** (for posting as user - requires app review)

3. **Request Access**
   - Click **"Request access"** for "Share on LinkedIn"
   - Fill out the use case form (explain your app's purpose)
   - You'll need to submit for **App Review**
   - Provide a detailed use case
   - Explain how users will post content on their personal LinkedIn profiles

## Step 4: Configure Scopes (Permissions)

1. **Go to Auth Tab → Scopes**
   - Under **"OAuth 2.0 scopes"**, you'll see required scopes:
     - `openid` - For OpenID Connect (automatic)
     - `profile` - For user profile (automatic)
     - `email` - For user email (automatic)
     - `w_member_social` - Post as user (requires app review)

2. **For Development/Testing**
   - LinkedIn allows certain scopes without app review for development
   - You can test with your own account first
   - For production, you'll need **App Review approval** for `w_member_social`

## Step 5: Set Environment Variables

1. **Add to `.env.local` (Development)**
   ```bash
   LINKEDIN_CLIENT_ID=your_client_id_here
   LINKEDIN_CLIENT_SECRET=your_client_secret_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Add to Production Environment**
   - Add the same variables to your production environment (Vercel, etc.)
   - For production, set:
     ```bash
     NEXT_PUBLIC_APP_URL=https://yourdomain.com
     ```

## Step 6: Run SQL Migration

Run the LinkedIn migration SQL in your Supabase dashboard:

1. Open Supabase Dashboard → SQL Editor
2. Run the contents of `supabase/linkedin-migration.sql`
3. Verify the migration succeeded

## Step 7: Test the Integration

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Navigate to Integrations**
   - Go to: `http://localhost:3000/integrations`
   - Click **"Connect"** on the LinkedIn card

3. **Complete OAuth Flow**
   - You'll be redirected to LinkedIn
   - Sign in and authorize the app
   - You'll be redirected back to your app

4. **Verify Connection**
   - Check that LinkedIn shows as "Connected" in your integrations page
   - You should see your profile name

## Step 8: App Review (For Production)

For production use, you'll need LinkedIn App Review approval:

### What You Need:

1. **Screencast/Video**
   - Record a video showing how users connect LinkedIn
   - Show how users create and publish posts
   - Demonstrate the full user flow

2. **Use Case Description**
   - Explain your app's purpose
   - Describe how it helps users manage social media
   - Explain the value proposition

3. **Privacy Policy & Terms of Service**
   - Must be publicly accessible
   - Must explain how you use LinkedIn data
   - Must comply with LinkedIn's data policies

4. **Test User**
   - Create a LinkedIn test account
   - Provide LinkedIn with test account credentials
   - Ensure they can test the full flow

### App Review Checklist:

- ✅ App is functional and complete
- ✅ Privacy Policy URL is accessible
- ✅ Terms of Service URL is accessible
- ✅ Use case is clearly explained
- ✅ Screencast shows the full user flow
- ✅ Test user credentials are provided
- ✅ All required scopes are justified

### Submit for Review:

1. Go to **Products** tab
2. Click **"Request access"** on products requiring review
3. Fill out the review form
4. Submit and wait for LinkedIn's approval (typically 1-2 weeks)

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**
   - Make sure you've added the exact redirect URL to LinkedIn app settings
   - Check that `NEXT_PUBLIC_APP_URL` matches your actual domain

2. **"Invalid client credentials"**
   - Verify `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` are correct
   - Make sure there are no extra spaces or quotes

3. **"Insufficient permissions"**
   - Verify you've requested the required products
   - Check that scopes are correctly configured
   - For production, ensure App Review is approved

4. **"Token expired"**
   - LinkedIn tokens expire after 60 days
   - Use the refresh token functionality
   - Or reconnect your account

## Resources

- [LinkedIn API Documentation](https://learn.microsoft.com/en-us/linkedin/)
- [LinkedIn OAuth 2.0 Guide](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)
- [LinkedIn Share API](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api)
- [LinkedIn App Review Guide](https://www.linkedin.com/help/linkedin/answer/a1338220)

## Support

If you encounter issues:
1. Check the LinkedIn Developer Portal for error messages
2. Review the API logs in your Supabase `meta_api_logs` table
3. Check your application logs for detailed error messages

