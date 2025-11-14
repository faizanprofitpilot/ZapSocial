# Meta API Integration - Production Implementation Summary

## 🎯 Overview

This document provides a comprehensive summary of the Meta (Facebook/Instagram) API integration implementation for ZapSocial, including all production-ready improvements and buyer handoff requirements.

---

## ✅ What Was Implemented

### 1. Core Integration (Initial Implementation)

**OAuth Flow**:
- Facebook OAuth initiation (`/api/integrations/oauth/facebook`)
- OAuth callback handler (`/api/integrations/oauth/facebook/callback`)
- Long-lived token exchange (60 days)
- Facebook Pages fetching with Instagram account linking
- Metadata storage in JSONB column

**Publishing**:
- Facebook post publishing (text + images)
- Instagram post publishing (single image + carousel)
- Scheduled posts support
- Image upload to Supabase Storage
- Post saving to database

**UI**:
- Composer integration for publishing
- Page/account selection
- Image upload and preview
- Publish results display
- Integration status UI

### 2. Production Improvements (New Implementation)

#### A. Token Refresh System ✅

**Files Created**:
- `app/api/integrations/facebook/refresh-token/route.ts` - Manual token refresh
- `app/api/integrations/facebook/refresh-all/route.ts` - Bulk token refresh (CRON)
- `vercel.json` - CRON job configuration

**How It Works**:
- Automatic token refresh for tokens expiring within 7 days
- CRON job runs daily at 2 AM UTC
- Manual refresh endpoint for individual tokens
- Marks expired tokens in metadata
- Handles token expiration gracefully

**Setup Required**:
1. Add `CRON_SECRET` to environment variables
2. CRON job automatically runs on Vercel (configured in `vercel.json`)
3. For other platforms, set up CRON to call `/api/integrations/facebook/refresh-all` with `Authorization: Bearer <CRON_SECRET>`

#### B. Token Expiration Handling ✅

**Files Modified**:
- `lib/meta/api-logger.ts` - `isTokenExpired()` function
- `app/api/posts/publish/route.ts` - Expiration checks
- `app/integrations/page.tsx` - UI for expired tokens

**How It Works**:
- Detects Facebook error code 190 (invalid/expired token)
- Marks integration as expired in metadata
- Shows "Reconnect" button for expired tokens
- Shows "Refresh Token" button for expiring tokens (7 days before expiration)
- Shows expiration date in integrations page
- Returns user-friendly error messages

**UI Features**:
- Red warning for expired tokens
- Yellow warning for tokens expiring soon
- "Refresh Token" button for expiring tokens
- "Reconnect" button for expired tokens
- Expiration date display

#### C. API Logging ✅

**Files Created**:
- `supabase/meta-api-logs.sql` - Database schema
- `lib/meta/api-logger.ts` - Logging utilities

**Files Modified**:
- `app/api/posts/publish/route.ts` - Logging in publish flow
- `app/api/integrations/oauth/facebook/callback/route.ts` - Logging in OAuth flow

**How It Works**:
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

#### D. Retry Logic for Instagram Carousels ✅

**Files Created**:
- `lib/meta/retry.ts` - Retry utility

**Files Modified**:
- `app/api/posts/publish/route.ts` - Retry in Instagram carousel flow

**How It Works**:
- Retries failed API calls up to 3 times
- Exponential backoff (400ms, 800ms, 1600ms for Instagram)
- Only retries on retryable errors (rate limits, network errors, 5xx)
- Does NOT retry on token expiration or 4xx errors
- Separate retry logic for child containers and carousel container

**Configuration**:
- Single image posts: 3 retries, 400ms delay
- Carousel posts: 2 retries for carousel, 3 retries for children, 500-600ms delay

#### E. Rate Limiting ✅

**Files Modified**:
- `app/api/posts/publish/route.ts` - Rate limiting implementation

**How It Works**:
- 2-second delay between posts to same platform
- Automatic retry on rate limit errors (error code 613)
- 5-second wait before retry on rate limit
- Prevents API throttling

**Configuration**:
- `rateLimitDelay`: 2000ms (2 seconds)
- Retry delay on rate limit: 5000ms (5 seconds)

#### F. Instagram Business Account Validation ✅

**Files Modified**:
- `app/api/posts/publish/route.ts` - Account type validation
- `app/api/integrations/oauth/facebook/callback/route.ts` - Account type storage
- `app/integrations/page.tsx` - UI warning for non-Business accounts

**How It Works**:
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

#### G. Image Validation ✅

**Files Created**:
- `lib/meta/image-validator.ts` - Image validation utilities

**How It Works**:
- Validates file type (JPEG, PNG)
- Validates file size (max 8MB)
- Validates aspect ratio (4:5 to 1.91:1) - client-side
- Validates carousel images (2-10 images)

**Note**: Full validation requires server-side image processing. This is a client-side validation that checks URL accessibility and headers.

#### H. Debug Mode ✅

**Files Modified**:
- `app/api/posts/publish/route.ts` - Debug mode support

**How It Works**:
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

#### I. Enhanced Error Handling ✅

**Files Created**:
- `lib/meta/api-logger.ts` - Error detection utilities

**Files Modified**:
- `app/api/posts/publish/route.ts` - Comprehensive error handling

**How It Works**:
- Token expiration detection (error code 190)
- Rate limit detection (error code 613)
- Retryable error detection
- User-friendly error messages
- Error logging to database

#### J. Integration Status UI ✅

**Files Modified**:
- `app/integrations/page.tsx` - Enhanced UI

**Features**:
- Shows token expiration status
- Shows expiration date
- Shows "Refresh Token" button for expiring tokens
- Shows "Reconnect" button for expired tokens
- Shows warning for non-Business Instagram accounts
- Shows warning for tokens expiring soon (7 days)

---

## 📋 Database Schema

### 1. Integration Metadata

Already exists in `integrations` table:

```sql
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_integrations_metadata 
ON public.integrations USING GIN (metadata);
```

**Metadata Structure**:
```json
{
  "pages": [
    {
      "id": "page_id",
      "name": "Page Name",
      "access_token": "page_access_token",
      "instagram_account": {
        "id": "ig_account_id",
        "username": "instagram_username",
        "account_type": "BUSINESS"
      }
    }
  ],
  "app_id": "facebook_app_id",
  "expired": false,
  "expired_at": null,
  "token_refreshed_at": null
}
```

### 2. Meta API Logs

New table created:

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

**Indexes**:
- `idx_meta_api_logs_user_id` - Fast user queries
- `idx_meta_api_logs_integration_id` - Fast integration queries
- `idx_meta_api_logs_platform` - Fast platform queries
- `idx_meta_api_logs_created_at` - Fast time-based queries
- `idx_meta_api_logs_success` - Fast success/failure queries

**RLS Policies**:
- Users can only view their own API logs
- Authenticated users can insert logs

---

## 🔧 Environment Variables

### Required Variables

```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Optional Variables

```env
CRON_SECRET=your_random_secret_key  # For CRON job authentication
NEXT_PUBLIC_DEBUG=false  # Set to true for debug mode
```

### Where to Find Credentials

1. **App ID**: Facebook App → Settings → Basic → App ID
2. **App Secret**: Facebook App → Settings → Basic → App Secret (click Show)
3. **App URL**: Your production domain (e.g., `https://zapsocial.com`)
4. **CRON Secret**: Generate a random string (e.g., `openssl rand -hex 32`)

---

## 🚀 CRON Job Setup

### Vercel (Automatic)

The `vercel.json` file is already configured:

```json
{
  "crons": [
    {
      "path": "/api/integrations/facebook/refresh-all",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Vercel will automatically run the CRON job daily at 2 AM UTC.

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

---

## 📊 API Endpoints

### OAuth

- `GET /api/integrations/oauth/facebook` - Initiate OAuth
- `GET /api/integrations/oauth/facebook/callback` - OAuth callback

### Token Management

- `POST /api/integrations/facebook/refresh-token` - Refresh single token
  - Body: `{ "integrationId": "..." }`
  - Response: `{ "success": true, "expires_at": "...", "expires_in": 5184000 }`

- `POST /api/integrations/facebook/refresh-all` - Refresh all tokens (CRON)
  - Headers: `Authorization: Bearer <CRON_SECRET>`
  - Response: `{ "success": true, "total": 10, "refreshed": 8, "failed": 2 }`

### Publishing

- `POST /api/posts/publish` - Publish posts
  - Body: `{ "caption": "...", "platforms": ["facebook", "instagram"], "imageUrls": ["..."], "pageId": "...", "scheduledAt": "..." }`
  - Response: `{ "success": true, "results": [...] }`

- `POST /api/posts/upload-image` - Upload images
  - Body: `FormData` with `file`
  - Response: `{ "success": true, "url": "..." }`

### Integration Management

- `DELETE /api/integrations/disconnect?platform=facebook` - Disconnect

---

## 🧪 Testing

### Test Token Refresh

```bash
# Manual refresh
curl -X POST http://localhost:3000/api/integrations/facebook/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"integrationId": "your-integration-id"}'
```

### Test Publish

```bash
# Facebook text post
curl -X POST http://localhost:3000/api/posts/publish \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Test post",
    "platforms": ["facebook"],
    "pageId": "your_page_id"
  }'

# Instagram image post
curl -X POST http://localhost:3000/api/posts/publish \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Test post",
    "platforms": ["instagram"],
    "imageUrls": ["https://example.com/image.jpg"],
    "pageId": "your_page_id"
  }'
```

### Test Image Upload

```bash
curl -X POST http://localhost:3000/api/posts/upload-image \
  -F "file=@/path/to/image.jpg"
```

---

## 📚 Files Created/Modified

### New Files

**API Routes**:
- `app/api/integrations/facebook/refresh-token/route.ts`
- `app/api/integrations/facebook/refresh-all/route.ts`
- `app/api/posts/upload-image/route.ts`
- `app/api/posts/publish/route.ts` (completely rewritten)

**Libraries**:
- `lib/meta/api-logger.ts`
- `lib/meta/retry.ts`
- `lib/meta/image-validator.ts`

**Database**:
- `supabase/meta-api-logs.sql`

**Configuration**:
- `vercel.json`

**Documentation**:
- `META_API_PRODUCTION_READY.md`
- `META_API_IMPROVEMENTS.md`
- `BUYER_HANDOFF_GUIDE.md`
- `README_META_API.md`
- `META_API_IMPLEMENTATION_SUMMARY.md` (this file)

### Modified Files

**API Routes**:
- `app/api/integrations/oauth/facebook/route.ts` - Added logging
- `app/api/integrations/oauth/facebook/callback/route.ts` - Added logging, expired flag
- `app/api/posts/manual/route.ts` - Added image URL support

**Components**:
- `components/dashboard/AIComposer.tsx` - Added publish integration, image upload, page selection
- `app/integrations/page.tsx` - Added token expiration UI, refresh button

**Libraries**:
- `lib/facebook/client.ts` - (existing, not modified)
- `lib/instagram/client.ts` - (existing, not modified)

---

## 🔒 Security Considerations

### 1. Token Storage

**Current Implementation**: Tokens are stored in plain text in the database.

**Recommendation**: Encrypt tokens before storing. Use a library like `crypto-js` or Supabase's encryption features.

### 2. API Logs

**Current Implementation**: Request bodies are logged with tokens redacted (`access_token: "[REDACTED]"`).

**Recommendation**: Review logs regularly. Consider removing sensitive data from logs after a certain period.

### 3. CRON Secret

**Current Implementation**: CRON secret is stored in environment variables.

**Recommendation**: Use a strong, random secret. Generate with `openssl rand -hex 32`.

### 4. Rate Limiting

**Current Implementation**: Basic rate limiting (2 seconds between posts).

**Recommendation**: Consider more sophisticated rate limiting for production (e.g., token bucket algorithm).

---

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

---

## 🐛 Troubleshooting

### Token Expiration

**Problem**: Users see "Token expired" errors

**Solution**:
1. Check if CRON job is running (check Vercel dashboard)
2. Manually refresh token: `/api/integrations/facebook/refresh-token`
3. If refresh fails, user needs to reconnect account
4. Check API logs for expiration errors

### Rate Limiting

**Problem**: Posts fail with rate limit errors

**Solution**:
1. Check API logs for rate limit errors
2. Increase delay between posts (currently 2 seconds)
3. Implement exponential backoff (already done)
4. Check Facebook App rate limits

### Instagram Carousel Failures

**Problem**: Carousel posts fail for some images

**Solution**:
1. Check retry logs in API logs
2. Verify image URLs are accessible
3. Check image dimensions and format
4. Verify all images have same dimensions
5. Check Instagram API status

### Non-Business Instagram Accounts

**Problem**: Users see "Instagram account must be a Business account" error

**Solution**:
1. Check account type in metadata
2. Guide user to convert to Business account
3. User needs to link Instagram to Facebook Page in Instagram Settings
4. Check Instagram account type in Facebook Page settings

---

## 🎯 Buyer Handoff

### Step 1: Add Buyer as Admin

1. Add buyer as Admin to Meta Business Manager
2. Add buyer as Admin to Facebook App
3. (Optional) Transfer ownership to buyer

### Step 2: Update Environment Variables

Buyer updates:
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`

### Step 3: Buyer Reconnects Account

1. Buyer goes to Settings → Integrations
2. Buyer clicks "Connect" on Meta/Facebook
3. Buyer authorizes the app
4. Buyer's tokens are generated automatically
5. Your tokens are automatically revoked (Meta handles this)

### Step 4: Verify Connection

Buyer verifies:
- Facebook Pages are listed
- Instagram accounts are linked
- Test post to Facebook works
- Test post to Instagram works
- Scheduled posts work
- Image uploads work

### Step 5: Transfer Domain (Optional)

If buyer wants to use the same domain:
1. Transfer domain to buyer's registrar
2. Buyer updates DNS records
3. Buyer updates `NEXT_PUBLIC_APP_URL`
4. Buyer updates OAuth redirect URIs in Facebook App

---

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

---

## 📝 Next Steps / Future Enhancements

### High Priority

1. **Image Resizing**: Implement server-side image resizing using `sharp` or similar
2. **Video Support**: Add video upload/posting for both platforms
3. **Token Encryption**: Encrypt tokens before storing in database
4. **Scheduled Posts Queue**: Implement queue system for scheduled posts
5. **Calendar Integration**: Integrate scheduled posts with calendar module

### Medium Priority

1. **Stories API**: Support Instagram Stories posting
2. **Analytics**: Fetch post engagement metrics
3. **Comments**: Fetch and display comments from posts
4. **Multi-account**: Support multiple Facebook Pages per user
5. **Advanced Rate Limiting**: Implement more sophisticated rate limiting

### Low Priority

1. **App Review**: Prepare for Facebook App Review
2. **Webhooks**: Set up webhooks for real-time updates
3. **Batch Publishing**: Support batch publishing for multiple posts
4. **Post Templates**: Support post templates for recurring content
5. **A/B Testing**: Support A/B testing for posts

---

## 📚 Documentation Files

1. **META_API_PRODUCTION_READY.md** - Production features and setup
2. **META_API_IMPROVEMENTS.md** - Implementation details
3. **BUYER_HANDOFF_GUIDE.md** - Buyer handoff instructions
4. **README_META_API.md** - Quick reference
5. **META_API_IMPLEMENTATION_SUMMARY.md** - This file (comprehensive summary)
6. **FACEBOOK_INSTAGRAM_SETUP.md** - Setup guide (existing)

---

## 🎯 Key Achievements

1. ✅ **Production-Ready**: All critical production features implemented
2. ✅ **Error Handling**: Comprehensive error handling with user-friendly messages
3. ✅ **Token Management**: Automatic token refresh with expiration handling
4. ✅ **API Logging**: Complete API logging for debugging and analytics
5. ✅ **Retry Logic**: Retry logic for Instagram carousels with exponential backoff
6. ✅ **Rate Limiting**: Rate limiting to prevent API throttling
7. ✅ **User Experience**: Enhanced UI with token expiration status and refresh button
8. ✅ **Documentation**: Comprehensive documentation for setup, monitoring, and troubleshooting
9. ✅ **Buyer Handoff**: Complete buyer handoff guide with step-by-step instructions
10. ✅ **Debug Mode**: Debug mode for development and buyer due diligence

---

## 🚀 Status

**Status**: Production Ready ✅

**Version**: 2.0

**Last Updated**: [Current Date]

**Ready For**:
- ✅ Production deployment
- ✅ Buyer handoff
- ✅ App review (with additional setup)
- ✅ Real-world usage

---

## 📞 Support

If you need help:

1. Review this document
2. Check `META_API_PRODUCTION_READY.md` for production features
3. Check `BUYER_HANDOFF_GUIDE.md` for buyer handoff
4. Check API logs in Supabase
5. Check Facebook App logs in Meta Business Manager
6. Contact Meta support if needed

---

**This integration is now production-ready and ready for buyer handoff.** 🎉

