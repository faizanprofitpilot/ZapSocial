# Environment Variables Setup Guide

This document lists all required and optional environment variables for ZapSocial deployment.

## Required Variables

### Supabase (Authentication & Database)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
  - Format: `https://xxxxxxxxxxxxx.supabase.co`
  - Find in: Supabase Dashboard → Settings → API → Project URL

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
  - Find in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
  - Find in: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
  - ⚠️ **Never expose this in client-side code**

### OpenAI (AI Generation)
- `OPENAI_API_KEY` - OpenAI API key for GPT-4o
  - Get from: https://platform.openai.com/api-keys

### Meta (Facebook & Instagram)
- `FACEBOOK_APP_ID` - Facebook App ID
  - Find in: Facebook Developers → Your App → Settings → Basic → App ID

- `FACEBOOK_APP_SECRET` - Facebook App Secret
  - Find in: Facebook Developers → Your App → Settings → Basic → App Secret (click Show)

### LinkedIn
- `LINKEDIN_CLIENT_ID` - LinkedIn OAuth Client ID
  - Find in: LinkedIn Developers → Your App → Auth tab → Client ID

- `LINKEDIN_CLIENT_SECRET` - LinkedIn OAuth Client Secret
  - Find in: LinkedIn Developers → Your App → Auth tab → Client Secret

### Application URL
- `NEXT_PUBLIC_APP_URL` - Your production application URL
  - Development: `http://localhost:3000`
  - Production: `https://yourdomain.com` (or Vercel deployment URL)
  - ⚠️ **Must match OAuth redirect URIs in all platforms**

## Optional Variables

### Security (Recommended)
- `CRON_SECRET` - Secret key for CRON job authentication (extra security)
  - Generate with: `openssl rand -hex 32`
  - Used to protect scheduled CRON endpoints

### Stripe (For Payments - Phase 4)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (client-side)
  - Find in: Stripe Dashboard → Developers → API keys → Publishable key

- `STRIPE_SECRET_KEY` - Stripe secret key (server-side only)
  - Find in: Stripe Dashboard → Developers → API keys → Secret key
  - ⚠️ **Never expose this in client-side code**

- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
  - Generated when you create a webhook endpoint in Stripe Dashboard
  - Find in: Stripe Dashboard → Developers → Webhooks → Your endpoint → Signing secret

### Debug (Development Only)
- `NEXT_PUBLIC_DEBUG` - Enable debug mode (optional)
  - Values: `true` or `false`
  - Default: `false`
  - ⚠️ **Do not set to `true` in production**

## Vercel Setup Instructions

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable above:
   - Select appropriate **Environment** (Production, Preview, Development)
   - For secrets, mark as **Encrypted**
   - Click **Save**
4. Redeploy your application after adding variables

## Local Development Setup

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Meta
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional
CRON_SECRET=your_cron_secret_here
NEXT_PUBLIC_DEBUG=false
```

⚠️ **Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

## Verification Checklist

After setting up environment variables, verify:

- [ ] All required variables are set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` matches your production domain
- [ ] OAuth redirect URIs in Meta/LinkedIn include your production URL
- [ ] Stripe webhook endpoint is configured (when implementing payments)
- [ ] Test authentication flows (email/password, OAuth)
- [ ] Test API integrations (Meta, LinkedIn)

## Security Notes

1. **Never commit secrets** to Git
2. **Use different keys** for development and production when possible
3. **Rotate keys** if they're accidentally exposed
4. **Service role keys** should only be used server-side (API routes)
5. **Client-side variables** must be prefixed with `NEXT_PUBLIC_` to be accessible in browser

## Troubleshooting

### OAuth Redirect Errors
- Ensure `NEXT_PUBLIC_APP_URL` matches exactly (including protocol and trailing slash)
- Check OAuth redirect URIs in provider dashboards match your app URL

### API Authentication Errors
- Verify API keys are correct (no extra spaces)
- Check key permissions/scopes in provider dashboards
- Ensure service role key is server-side only

### Missing Environment Variables
- Restart dev server after adding variables to `.env.local`
- Redeploy on Vercel after adding variables in dashboard

