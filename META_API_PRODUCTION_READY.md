# 🚀 Meta API Integration - Production Ready Checklist

This document summarizes all production-ready improvements implemented for the Meta API integration.

## ✅ Implemented Features

### 1. Token Refresh System ✅

**Files**:
- `app/api/integrations/facebook/refresh-token/route.ts` - Manual token refresh
- `app/api/integrations/facebook/refresh-all/route.ts` - Bulk token refresh (CRON)
- `vercel.json` - CRON job configuration

**Features**:
- Automatic token refresh for tokens expiring within 7 days
- Manual token refresh endpoint
- CRON job runs daily at 2 AM UTC
- Marks expired tokens in metadata
- User-friendly error messages

**Setup**:
1. Add `CRON_SECRET` to environment variables
2. CRON job automatically runs on Vercel
3. For other platforms, set up CRON to call `/api/integrations/facebook/refresh-all`

### 2. Token Expiration Handling ✅

**Files**:
- `lib/meta/api-logger.ts` - `isTokenExpired()` function
- `app/api/posts/publish/route.ts` - Expiration checks
- `app/integrations/page.tsx` - UI for expired tokens

**Features**:
- Detects Facebook error code 190 (invalid/expired token)
- Marks integration as expired in metadata
- Shows "Reconnect" button for expired tokens
- Shows expiration warnings (7 days before expiration)
- User-friendly error messages

**UI**:
- Red warning for expired tokens
- Yellow warning for tokens expiring soon
- "Refresh Token" button for expiring tokens
- "Reconnect" button for expired tokens

### 3. API Logging ✅

**Files**:
- `supabase/meta-api-logs.sql` - Database schema
- `lib/meta/api-logger.ts` - Logging utilities
- `app/api/posts/publish/route.ts` - Logging in publish flow
- `app/api/integrations/oauth/facebook/callback/route.ts` - Logging in OAuth flow

**Features**:
- Logs all API requests and responses
- Stores request/response bodies (tokens redacted)
- Tracks success/failure and duration
- Indexed for fast queries
- RLS policies for user data isolation

**Database Schema**:
```sql
CREATE TABLE public.meta_api_logs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  integration_id uuid REFERENCES integrations(id),
  platform text CHECK (platform IN ('facebook', 'instagram')),
  endpoint text,
  method text CHECK (method IN ('GET', 'POST', 'DELETE', 'PATCH')),
  request_body jsonb,
  response_body jsonb,
  status_code integer,
  success boolean,
  error_message text,
  duration_ms integer,
  created_at timestamp with time zone
);
```

### 4. Retry Logic for Instagram Carousels ✅

**Files**:
- `lib/meta/retry.ts` - Retry utility
- `app/api/posts/publish/route.ts` - Retry in Instagram carousel flow

**Features**:
- Retries failed API calls up to 3 times
- Exponential backoff (400ms, 800ms, 1600ms for Instagram)
- Only retries on retryable errors (rate limits, network errors, 5xx)
- Does NOT retry on token expiration or 4xx errors
- Separate retry logic for child containers and carousel container

**Configuration**:
- Single image posts: 3 retries, 400ms delay
- Carousel posts: 2 retries for carousel, 3 retries for children, 500-600ms delay

### 5. Rate Limiting ✅

**Files**:
- `app/api/posts/publish/route.ts` - Rate limiting implementation

**Features**:
- 2-second delay between posts to same platform
- Automatic retry on rate limit errors (error code 613)
- 5-second wait before retry on rate limit
- Prevents API throttling

**Configuration**:
- `rateLimitDelay`: 2000ms (2 seconds)
- Retry delay on rate limit: 5000ms (5 seconds)

### 6. Instagram Business Account Validation ✅

**Files**:
- `app/api/posts/publish/route.ts` - Account type validation
- `app/api/integrations/oauth/facebook/callback/route.ts` - Account type storage
- `app/integrations/page.tsx` - UI warning for non-Business accounts

**Features**:
- Validates account type is "BUSINESS" before posting
- Shows user-friendly error if account is not Business
- Stores account_type in metadata during OAuth
- UI warning in integrations page for non-Business accounts

**Error Response**:
```json
{
  "error": "Instagram account must be a Business account. Current type: MEDIA_CREATOR. Please convert your Instagram account to a Business account in Instagram Settings."
}
```

### 7. Image Validation ✅

**Files**:
- `lib/meta/image-validator.ts` - Image validation utilities

**Features**:
- Validates file type (JPEG, PNG)
- Validates file size (max 8MB)
- Validates aspect ratio (4:5 to 1.91:1) - client-side
- Validates carousel images (2-10 images)

**Note**: Full validation requires server-side image processing. This is a client-side validation that checks URL accessibility and headers.

### 8. Debug Mode ✅

**Files**:
- `app/api/posts/publish/route.ts` - Debug mode support

**Features**:
- Set `NEXT_PUBLIC_DEBUG=true` in environment variables
- Returns additional debug information in API responses
- Includes request/response bodies, container IDs, publish IDs
- Helps with debugging and buyer due diligence

**Debug Response**:
```json
{
  "success": true,
  "results": [
    {
      "platform": "instagram",
      "success": true,
      "postId": "...",
      "debug": {
        "containerId": "...",
        "publishId": "..."
      }
    }
  ],
  "duration_ms": 1234
}
```

### 9. Enhanced Error Handling ✅

**Files**:
- `lib/meta/api-logger.ts` - Error detection utilities
- `app/api/posts/publish/route.ts` - Comprehensive error handling

**Features**:
- Token expiration detection (error code 190)
- Rate limit detection (error code 613)
- Retryable error detection
- User-friendly error messages
- Error logging to database

### 10. Integration Status UI ✅

**Files**:
- `app/integrations/page.tsx` - Enhanced UI

**Features**:
- Shows token expiration status
- Shows expiration date
- Shows "Refresh Token" button for expiring tokens
- Shows "Reconnect" button for expired tokens
- Shows warning for non-Business Instagram accounts
- Shows warning for tokens expiring soon (7 days)

## 📋 Database Migrations Required

### 1. Meta API Logs Table

Run this SQL in Supabase:

```sql
-- See supabase/meta-api-logs.sql
CREATE TABLE IF NOT EXISTS public.meta_api_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  integration_id uuid REFERENCES public.integrations(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  endpoint text NOT NULL,
  method text NOT NULL CHECK (method IN ('GET', 'POST', 'DELETE', 'PATCH')),
  request_body jsonb,
  response_body jsonb,
  status_code integer,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  duration_ms integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meta_api_logs_user_id ON public.meta_api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_api_logs_integration_id ON public.meta_api_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_meta_api_logs_platform ON public.meta_api_logs(platform);
CREATE INDEX IF NOT EXISTS idx_meta_api_logs_created_at ON public.meta_api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_meta_api_logs_success ON public.meta_api_logs(success);

-- RLS Policies
ALTER TABLE public.meta_api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API logs"
  ON public.meta_api_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON public.meta_api_logs TO authenticated;
```

### 2. Integration Metadata Column (Already Done)

This was already added in `supabase/add-integration-metadata.sql`.

## 🔧 Environment Variables

Add these to your `.env.local`:

```env
# Existing
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# New
CRON_SECRET=your_random_secret_key  # For CRON job authentication
NEXT_PUBLIC_DEBUG=false  # Set to true for debug mode
```

## 🚀 CRON Job Setup

### Vercel (Automatic)

The `vercel.json` file is already configured. Vercel will automatically run the CRON job daily at 2 AM UTC.

**Verify CRON is working**:
1. Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
2. Check that the job is scheduled
3. Monitor logs for execution

### Manual Setup (Other Platforms)

If you're not using Vercel, set up a CRON job to call:

```
POST /api/integrations/facebook/refresh-all
Authorization: Bearer <CRON_SECRET>
```

**Schedule**: Daily at 2 AM UTC (or your preferred time)

**Example with curl**:
```bash
curl -X POST https://yourdomain.com/api/integrations/facebook/refresh-all \
  -H "Authorization: Bearer $CRON_SECRET"
```

## 📊 Monitoring Queries

### Check Token Expiration

```sql
SELECT 
  user_id,
  platform,
  expires_at,
  (expires_at - NOW()) as days_until_expiration,
  metadata->>'expired' as is_expired
FROM integrations
WHERE platform = 'facebook'
  AND expires_at IS NOT NULL
ORDER BY expires_at ASC;
```

### Check API Logs

```sql
-- Recent failures
SELECT * FROM meta_api_logs
WHERE success = false
ORDER BY created_at DESC
LIMIT 50;

-- Rate limit errors
SELECT * FROM meta_api_logs
WHERE error_message LIKE '%rate limit%' OR error_message LIKE '%613%'
ORDER BY created_at DESC;

-- Token expiration errors
SELECT * FROM meta_api_logs
WHERE error_message LIKE '%expired%' OR error_message LIKE '%190%'
ORDER BY created_at DESC;

-- Success rate by platform
SELECT 
  platform,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM meta_api_logs
GROUP BY platform;
```

### Check Integration Status

```sql
SELECT 
  user_id,
  platform,
  expires_at,
  metadata->>'expired' as is_expired,
  metadata->'pages'->>0->>'name' as page_name,
  metadata->'pages'->0->>'instagram_account'->>'username' as instagram_username,
  metadata->'pages'->0->>'instagram_account'->>'account_type' as instagram_account_type
FROM integrations
WHERE platform = 'facebook';
```

## 🧪 Testing

### Test Token Refresh

```bash
# Manual refresh
curl -X POST http://localhost:3000/api/integrations/facebook/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"integrationId": "your-integration-id"}'
```

### Test Publish with Debug Mode

1. Set `NEXT_PUBLIC_DEBUG=true` in `.env.local`
2. Publish a post
3. Check response for debug information

### Test Retry Logic

1. Temporarily break an image URL
2. Try to publish to Instagram
3. Check logs for retry attempts

### Test Rate Limiting

1. Publish multiple posts quickly
2. Check for rate limit errors
3. Verify automatic retry

## 🔒 Security Considerations

1. **Token Storage**: Tokens are stored in plain text. Consider encrypting before storing.
2. **API Logs**: Request bodies are logged with tokens redacted. Review logs regularly.
3. **CRON Secret**: Use a strong, random secret for CRON authentication.
4. **Rate Limiting**: Current implementation is basic. Consider more sophisticated rate limiting for production.

## 📝 Next Steps / Future Enhancements

1. **Image Resizing**: Implement server-side image resizing using `sharp` or similar
2. **Video Support**: Add video upload/posting for both platforms
3. **Stories API**: Support Instagram Stories posting
4. **Analytics**: Fetch post engagement metrics
5. **Comments**: Fetch and display comments from posts
6. **Multi-account**: Support multiple Facebook Pages per user
7. **Token Encryption**: Encrypt tokens before storing in database
8. **Advanced Rate Limiting**: Implement more sophisticated rate limiting
9. **Scheduled Posts Queue**: Implement queue system for scheduled posts
10. **Calendar Integration**: Integrate scheduled posts with calendar module

## 🐛 Troubleshooting

### Token Expiration

**Problem**: Users see "Token expired" errors

**Solution**:
1. Check if CRON job is running
2. Manually refresh token: `/api/integrations/facebook/refresh-token`
3. If refresh fails, user needs to reconnect account

### Rate Limiting

**Problem**: Posts fail with rate limit errors

**Solution**:
1. Check API logs for rate limit errors
2. Increase delay between posts
3. Implement exponential backoff (already done)

### Instagram Carousel Failures

**Problem**: Carousel posts fail for some images

**Solution**:
1. Check retry logs
2. Verify image URLs are accessible
3. Check image dimensions and format
4. Verify all images have same dimensions

### Non-Business Instagram Accounts

**Problem**: Users see "Instagram account must be a Business account" error

**Solution**:
1. Check account type in metadata
2. Guide user to convert to Business account
3. User needs to link Instagram to Facebook Page in Instagram Settings

## 📚 Files Created/Modified

### New Files

- `app/api/integrations/facebook/refresh-token/route.ts`
- `app/api/integrations/facebook/refresh-all/route.ts`
- `app/api/posts/upload-image/route.ts`
- `lib/meta/api-logger.ts`
- `lib/meta/retry.ts`
- `lib/meta/image-validator.ts`
- `supabase/meta-api-logs.sql`
- `vercel.json`
- `META_API_IMPROVEMENTS.md`
- `BUYER_HANDOFF_GUIDE.md`
- `META_API_PRODUCTION_READY.md`

### Modified Files

- `app/api/posts/publish/route.ts` - Enhanced with logging, retry, rate limiting
- `app/api/posts/manual/route.ts` - Added image URL support
- `app/api/integrations/oauth/facebook/callback/route.ts` - Added logging, expired flag
- `app/integrations/page.tsx` - Added token expiration UI, refresh button
- `components/dashboard/AIComposer.tsx` - Added publish integration, image upload

## ✅ Production Ready Checklist

- [x] Token refresh system implemented
- [x] Token expiration handling implemented
- [x] API logging implemented
- [x] Retry logic for Instagram carousels
- [x] Rate limiting implemented
- [x] Instagram Business account validation
- [x] Image validation (client-side)
- [x] Debug mode implemented
- [x] Enhanced error handling
- [x] Integration status UI
- [x] Database migrations created
- [x] CRON job configured
- [x] Documentation created
- [x] Buyer handoff guide created

## 🎯 Ready for Production

All critical production features have been implemented. The integration is now ready for:

1. ✅ Production deployment
2. ✅ Buyer handoff
3. ✅ App review (with additional setup)
4. ✅ Real-world usage

---

**Last Updated**: [Current Date]
**Version**: 2.0
**Status**: Production Ready ✅

