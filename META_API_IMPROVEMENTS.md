# Meta API Integration - Production Improvements

This document outlines the production-ready improvements added to the Meta API integration.

## ✅ Implemented Features

### 1. Token Refresh System

**Files**:
- `app/api/integrations/facebook/refresh-token/route.ts` - Manual token refresh
- `app/api/integrations/facebook/refresh-all/route.ts` - Bulk token refresh (for CRON)
- `vercel.json` - CRON job configuration

**How it works**:
- Long-lived tokens expire after 60 days
- CRON job runs daily at 2 AM UTC to refresh tokens expiring within 7 days
- Manual refresh endpoint available for individual tokens
- Expired tokens are marked in metadata

**Setup**:
1. Add `CRON_SECRET` to environment variables
2. CRON job will automatically run on Vercel (or configure your own scheduler)
3. For manual refresh, call `/api/integrations/facebook/refresh-token` with `integrationId`

### 2. Token Expiration Handling

**Files**:
- `lib/meta/api-logger.ts` - `isTokenExpired()` function
- `app/api/posts/publish/route.ts` - Expiration checks in publish flow

**How it works**:
- Detects Facebook error code 190 (invalid/expired token)
- Marks integration as expired in metadata
- Returns user-friendly error messages
- Prompts user to reconnect account

**Error Response**:
```json
{
  "error": "Token expired. Please reconnect your account.",
  "expired": true
}
```

### 3. API Logging

**Files**:
- `supabase/meta-api-logs.sql` - Database schema
- `lib/meta/api-logger.ts` - Logging utilities
- `app/api/posts/publish/route.ts` - Logging in publish flow

**Features**:
- Logs all API requests and responses
- Stores request/response bodies (tokens redacted)
- Tracks success/failure and duration
- Indexed for fast queries
- RLS policies for user data isolation

**Query logs**:
```sql
SELECT * FROM meta_api_logs 
WHERE user_id = '...' 
ORDER BY created_at DESC 
LIMIT 100;
```

### 4. Retry Logic for Instagram Carousels

**Files**:
- `lib/meta/retry.ts` - Retry utility
- `app/api/posts/publish/route.ts` - Retry in Instagram carousel flow

**How it works**:
- Retries failed API calls up to 3 times
- Exponential backoff (300ms, 600ms, 1200ms)
- Only retries on retryable errors (rate limits, network errors, 5xx)
- Does NOT retry on token expiration or 4xx errors

**Configuration**:
```typescript
await retry(
  async () => { /* API call */ },
  {
    maxRetries: 3,
    delayMs: 400,
    shouldRetry: isRetryableError,
  }
);
```

### 5. Rate Limiting

**Files**:
- `app/api/posts/publish/route.ts` - Rate limiting implementation

**How it works**:
- 2-second delay between posts to same platform
- Automatic retry on rate limit errors (error code 613)
- 5-second wait before retry on rate limit

**Configuration**:
- `rateLimitDelay`: 2000ms (2 seconds)
- Retry delay on rate limit: 5000ms (5 seconds)

### 6. Instagram Business Account Validation

**Files**:
- `app/api/posts/publish/route.ts` - Account type validation
- `app/api/integrations/oauth/facebook/callback/route.ts` - Account type storage

**How it works**:
- Validates account type is "BUSINESS" before posting
- Shows user-friendly error if account is not Business
- Stores account_type in metadata during OAuth

**Error Response**:
```json
{
  "error": "Instagram account must be a Business account. Current type: MEDIA_CREATOR. Please convert your Instagram account to a Business account in Instagram Settings."
}
```

### 7. Image Validation

**Files**:
- `lib/meta/image-validator.ts` - Image validation utilities

**Features**:
- Validates file type (JPEG, PNG)
- Validates file size (max 8MB)
- Validates aspect ratio (4:5 to 1.91:1)
- Validates carousel images (2-10 images)

**Note**: Full validation requires server-side image processing. This is a client-side validation that checks URL accessibility and headers.

### 8. Debug Mode

**Files**:
- `app/api/posts/publish/route.ts` - Debug mode support

**How it works**:
- Set `NEXT_PUBLIC_DEBUG=true` in environment variables
- Returns additional debug information in API responses
- Includes request/response bodies, container IDs, publish IDs

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

## 📋 Database Schema

### Meta API Logs Table

```sql
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
```

**Run this SQL in Supabase**:
```bash
# Run the migration
psql -h <supabase-host> -U postgres -d postgres -f supabase/meta-api-logs.sql
```

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

## 📊 Monitoring

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
WHERE error_message LIKE '%rate limit%'
ORDER BY created_at DESC;

-- Token expiration errors
SELECT * FROM meta_api_logs
WHERE error_message LIKE '%expired%' OR error_message LIKE '%token%'
ORDER BY created_at DESC;
```

### Check Integration Status

```sql
SELECT 
  user_id,
  platform,
  expires_at,
  metadata->>'expired' as is_expired,
  metadata->'pages'->>0->>'name' as page_name,
  metadata->'pages'->0->>'instagram_account'->>'username' as instagram_username
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

## 🔒 Security Considerations

1. **Token Storage**: Tokens are stored in plain text. Consider encrypting before storing.
2. **API Logs**: Request bodies are logged with tokens redacted. Review logs regularly.
3. **CRON Secret**: Use a strong, random secret for CRON authentication.
4. **Rate Limiting**: Current implementation is basic. Consider more sophisticated rate limiting for production.

## 📝 Next Steps

1. **Image Resizing**: Implement server-side image resizing using `sharp` or similar
2. **Video Support**: Add video upload/posting for both platforms
3. **Stories API**: Support Instagram Stories posting
4. **Analytics**: Fetch post engagement metrics
5. **Comments**: Fetch and display comments from posts
6. **Multi-account**: Support multiple Facebook Pages per user
7. **Token Encryption**: Encrypt tokens before storing in database
8. **Advanced Rate Limiting**: Implement more sophisticated rate limiting

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
3. Implement exponential backoff

### Instagram Carousel Failures

**Problem**: Carousel posts fail for some images

**Solution**:
1. Check retry logs
2. Verify image URLs are accessible
3. Check image dimensions and format
4. Verify all images have same dimensions

## 📚 References

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Facebook Token Refresh](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived-tokens)
- [Instagram Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)

