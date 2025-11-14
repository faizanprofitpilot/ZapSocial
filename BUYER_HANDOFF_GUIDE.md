# 🔥 ZapSocial Meta API - Buyer Handoff Guide

This guide provides step-by-step instructions for transferring the ZapSocial Meta API integration to a new owner.

---

## 📋 Prerequisites

Before starting the handoff, ensure you have:

1. ✅ Admin access to Meta Business Manager
2. ✅ Admin access to Facebook App
3. ✅ Access to the ZapSocial codebase
4. ✅ Access to environment variables (`.env.local`)
5. ✅ Access to Supabase database

---

## 🔄 Step 1: Add Buyer as Admin to Meta Business Manager

### Option A: Add as Admin (Recommended)

1. Go to [Meta Business Manager](https://business.facebook.com/)
2. Click **Business Settings** → **People**
3. Click **Add**
4. Enter buyer's email address
5. Select **Admin** role
6. Click **Add Person**
7. Buyer will receive an email invitation

### Option B: Transfer Ownership (Full Handoff)

1. Go to **Business Settings** → **Business Info**
2. Click **Transfer Ownership**
3. Enter buyer's email address
4. Select **Transfer All Assets**
5. Confirm transfer
6. Buyer will receive ownership transfer email

**Note**: Transfer ownership revokes your admin access immediately.

---

## 🔄 Step 2: Add Buyer as Admin to Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Select your app (ZapSocial App)
3. Click **Settings** → **Roles**
4. Click **Add People**
5. Enter buyer's email address
6. Select **Administrator** role
7. Click **Add**
8. Buyer will receive an email invitation

### Alternative: Transfer App to Buyer's Business Manager

If buyer prefers to own the app:

1. Go to **Settings** → **Advanced**
2. Click **Migrate App**
3. Select buyer's Business Manager
4. Confirm migration
5. App ownership transfers to buyer

---

## 🔄 Step 3: Update Environment Variables

Buyer needs to update these environment variables:

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

### Update Steps

1. Buyer clones the repository
2. Buyer creates `.env.local` file
3. Buyer adds credentials (see above)
4. Buyer deploys to their hosting platform
5. Buyer updates environment variables in hosting platform

**Note**: No code changes are needed. Only environment variables need to be updated.

---

## 🔄 Step 4: Buyer Reconnects Account

After buyer updates environment variables:

1. Buyer logs into ZapSocial
2. Buyer goes to **Settings** → **Integrations**
3. Buyer clicks **Connect** on Meta/Facebook card
4. Buyer authorizes the app
5. Buyer's tokens are generated automatically
6. Your tokens are automatically revoked (Meta handles this)

**Important**: Buyer must reconnect even if you've transferred the app. This generates new tokens under their account.

---

## 🔄 Step 5: Verify Connection

Buyer should verify:

1. ✅ Facebook Pages are listed
2. ✅ Instagram accounts are linked
3. ✅ Test post to Facebook works
4. ✅ Test post to Instagram works
5. ✅ Scheduled posts work
6. ✅ Image uploads work

### Test Script

```bash
# Test Facebook post
curl -X POST https://yourdomain.com/api/posts/publish \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Test post",
    "platforms": ["facebook"],
    "pageId": "your_page_id"
  }'

# Test Instagram post
curl -X POST https://yourdomain.com/api/posts/publish \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Test post",
    "platforms": ["instagram"],
    "imageUrls": ["https://example.com/image.jpg"],
    "pageId": "your_page_id"
  }'
```

---

## 🔄 Step 6: Transfer Database (Optional)

If buyer wants to keep existing data:

### Option A: Export/Import

1. Export Supabase database
2. Buyer imports database
3. Buyer updates user IDs if needed

### Option B: Fresh Start (Recommended)

1. Buyer creates new Supabase project
2. Buyer runs migrations
3. Buyer starts fresh (cleaner approach)

**Note**: User data and posts are user-specific. If buyer wants to keep existing users, use Option A.

---

## 🔄 Step 7: Transfer Domain (Optional)

If buyer wants to use the same domain:

1. Transfer domain to buyer's registrar
2. Buyer updates DNS records
3. Buyer updates `NEXT_PUBLIC_APP_URL` in environment variables
4. Buyer updates OAuth redirect URIs in Facebook App

### Update OAuth Redirect URIs

1. Go to Facebook App → Facebook Login → Settings
2. Add buyer's domain to **Valid OAuth Redirect URIs**:
   ```
   https://buyerdomain.com/api/integrations/oauth/facebook/callback
   ```
3. Remove old domain (optional)
4. Save changes

---

## ✅ Verification Checklist

After handoff, verify:

- [ ] Buyer has admin access to Business Manager
- [ ] Buyer has admin access to Facebook App
- [ ] Buyer has updated environment variables
- [ ] Buyer has reconnected their account
- [ ] Buyer can publish to Facebook
- [ ] Buyer can publish to Instagram
- [ ] Buyer can schedule posts
- [ ] Buyer can upload images
- [ ] CRON job is running (check Vercel dashboard)
- [ ] API logs are being stored (check Supabase)
- [ ] Token refresh is working (check logs)

---

## 🔒 Security Checklist

Before handoff:

- [ ] Remove your personal access tokens
- [ ] Revoke your app access (if not transferring)
- [ ] Update app contact email to buyer's email
- [ ] Update app privacy policy URL (if needed)
- [ ] Update app terms of service URL (if needed)
- [ ] Review app permissions (remove unnecessary permissions)
- [ ] Enable app review (if going to production)
- [ ] Set up rate limiting (if not already done)
- [ ] Set up monitoring/alerts (if not already done)

---

## 📝 Post-Handoff Support

### What Buyer Gets

1. ✅ Full access to codebase
2. ✅ Full access to Meta Business Manager
3. ✅ Full access to Facebook App
4. ✅ All documentation
5. ✅ Database schema
6. ✅ API documentation

### What Buyer Needs to Do

1. ✅ Update environment variables
2. ✅ Reconnect their account
3. ✅ Test publishing
4. ✅ Set up monitoring
5. ✅ Set up alerts
6. ✅ Review app permissions
7. ✅ Enable app review (if going to production)

### What You Should Do

1. ✅ Remove your access (if not transferring)
2. ✅ Update app contact email
3. ✅ Provide support documentation
4. ✅ Answer questions (if agreed upon)
5. ✅ Transfer domain (if applicable)

---

## 🐛 Troubleshooting

### Buyer Can't Connect Account

**Problem**: Buyer sees "Invalid redirect URI" error

**Solution**:
1. Check OAuth redirect URIs in Facebook App
2. Ensure buyer's domain is added
3. Ensure `NEXT_PUBLIC_APP_URL` matches domain

### Buyer Can't Publish Posts

**Problem**: Buyer sees "Token expired" error

**Solution**:
1. Check if CRON job is running
2. Check token expiration date in database
3. Manually refresh token: `/api/integrations/facebook/refresh-token`
4. If refresh fails, buyer needs to reconnect

### Buyer Can't See Instagram Account

**Problem**: Buyer doesn't see Instagram account in integrations

**Solution**:
1. Check if Instagram account is linked to Facebook Page
2. Check if Instagram account is Business account
3. Check account_type in metadata
4. Buyer needs to link Instagram to Facebook Page in Instagram Settings

### Buyer Can't Schedule Posts

**Problem**: Scheduled posts don't publish

**Solution**:
1. Check CRON job for scheduled posts (if implemented)
2. Check token expiration date
3. Check API logs for errors
4. Verify scheduled_at is in the future

---

## 📚 Additional Resources

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Meta Business Manager Help](https://www.facebook.com/business/help)
- [Facebook App Review Guide](https://developers.facebook.com/docs/app-review)

---

## 🎯 Quick Start for Buyer

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd ZapSocial
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Run database migrations**
   ```bash
   # Run in Supabase SQL Editor
   # - supabase/meta-api-logs.sql
   # - supabase/add-integration-metadata.sql
   ```

5. **Deploy to hosting platform**
   ```bash
   # Vercel, Netlify, or your preferred platform
   ```

6. **Connect your account**
   - Go to Settings → Integrations
   - Click Connect on Meta/Facebook
   - Authorize the app

7. **Test publishing**
   - Create a post
   - Publish to Facebook
   - Publish to Instagram

---

## ✅ Handoff Complete!

Once all steps are complete, the buyer has full control of the Meta API integration. Your personal information is not shared, and Meta automatically handles token revocation when the buyer reconnects.

---

## 📞 Support

If buyer needs help:

1. Review this guide
2. Check META_API_IMPROVEMENTS.md for technical details
3. Check API logs in Supabase
4. Check Facebook App logs in Meta Business Manager
5. Contact Meta support if needed

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Status**: Production Ready

