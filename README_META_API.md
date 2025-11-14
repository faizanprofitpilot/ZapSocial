# Meta API Integration - Quick Reference

## 🚀 Quick Start

### 1. Setup Facebook App

1. Create Facebook App at [Facebook Developers](https://developers.facebook.com/apps/)
2. Add products: Facebook Login, Instagram Graph API
3. Configure OAuth redirect URIs
4. Get App ID and App Secret

### 2. Environment Variables

```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
CRON_SECRET=your_random_secret_key
NEXT_PUBLIC_DEBUG=false
```

### 3. Database Migrations

Run these SQL files in Supabase:

1. `supabase/add-integration-metadata.sql` - Adds metadata column
2. `supabase/meta-api-logs.sql` - Creates API logs table

### 4. Connect Account

1. Go to Settings → Integrations
2. Click "Connect" on Meta/Facebook
3. Authorize the app
4. Select Facebook Pages
5. Instagram accounts are automatically linked

### 5. Publish Posts

1. Go to Dashboard → Create Post
2. Write caption
3. Upload images (optional)
4. Select platforms (Facebook, Instagram)
5. Click "Post Now" or "Schedule Post"

## 📋 API Endpoints

### OAuth

- `GET /api/integrations/oauth/facebook` - Initiate OAuth
- `GET /api/integrations/oauth/facebook/callback` - OAuth callback

### Token Management

- `POST /api/integrations/facebook/refresh-token` - Refresh single token
- `POST /api/integrations/facebook/refresh-all` - Refresh all tokens (CRON)

### Publishing

- `POST /api/posts/publish` - Publish posts
- `POST /api/posts/upload-image` - Upload images
- `POST /api/posts/manual` - Save drafts

### Integration Management

- `DELETE /api/integrations/disconnect?platform=facebook` - Disconnect

## 🔧 Key Features

- ✅ Token refresh (automatic + manual)
- ✅ Token expiration handling
- ✅ API logging
- ✅ Retry logic (Instagram carousels)
- ✅ Rate limiting
- ✅ Instagram Business account validation
- ✅ Image validation
- ✅ Debug mode
- ✅ Enhanced error handling

## 📚 Documentation

- `META_API_PRODUCTION_READY.md` - Production features
- `META_API_IMPROVEMENTS.md` - Implementation details
- `BUYER_HANDOFF_GUIDE.md` - Buyer handoff instructions
- `FACEBOOK_INSTAGRAM_SETUP.md` - Setup guide

## 🐛 Troubleshooting

### Token Expired

1. Check integrations page for expiration status
2. Click "Refresh Token" if available
3. Click "Reconnect" if expired

### Rate Limiting

1. Check API logs for rate limit errors
2. Wait 2 seconds between posts
3. Automatic retry on rate limit

### Instagram Post Fails

1. Check if account is Business account
2. Verify images are accessible
3. Check image format and size
4. Check API logs for errors

## 🔒 Security

- Tokens stored in database (consider encryption)
- API logs with redacted tokens
- RLS policies for user data isolation
- CRON secret for authentication

## 📊 Monitoring

Check API logs in Supabase:

```sql
SELECT * FROM meta_api_logs
WHERE user_id = 'your_user_id'
ORDER BY created_at DESC
LIMIT 100;
```

## 🎯 Next Steps

1. Set up CRON job (automatic on Vercel)
2. Monitor API logs
3. Test publishing
4. Enable app review (if going to production)
5. Set up monitoring/alerts

---

**Status**: Production Ready ✅

