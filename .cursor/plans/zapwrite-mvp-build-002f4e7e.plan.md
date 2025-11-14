<!-- 002f4e7e-3864-49de-b4a2-b55fe2c09876 6b0aa5d3-6627-437f-a0d5-07fd622fc525 -->
# Zapwrite MVP Build Plan

## Phase 1: Project Setup & Infrastructure

### 1.1 Initialize Next.js 15 Project

- Create Next.js 15 app with TypeScript and Tailwind CSS
- Configure app router structure
- Set up base folder structure: `/app`, `/components`, `/lib`, `/types`
- Configure Tailwind with blue/purple gradient theme
- Add shadcn/ui components for UI primitives

### 1.2 Supabase Setup

- Initialize Supabase client configuration
- Create database schema:
- `users` table (extends Supabase auth.users)
- `content` table (id, user_id, title, body, type, keywords, metadata, created_at)
- `generations` table (track usage/credits per user)
- `zapier_webhooks` table (store user Zapier webhook URLs)
- Set up Supabase auth configuration
- Create RLS (Row Level Security) policies

### 1.3 Environment Configuration

- Create `.env.example` with all required keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `RAPIDAPI_YOUTUBE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `ZAPIER_WEBHOOK_SECRET` (optional)

## Phase 2: Authentication & User Management

### 2.1 Supabase Auth Integration

- Create auth provider component
- Build sign up/sign in pages (`/auth/signup`, `/auth/signin`)
- Implement password reset flow
- Add protected route middleware
- Create user session management hooks

### 2.2 User Profile Setup

- Create user profile initialization on first login
- Add user settings page (`/settings`)
- Store subscription tier in user profile

## Phase 3: Core Content Generation Features

### 3.1 Keyword → Blog Generator

- Create `/generate/keyword` page with input form
- Add tone selector (Friendly/Corporate/Playful/Expert)
- Add length selector (Short/Medium/Long)
- Build OpenAI API integration:
- Prompt engineering for SEO-optimized blogs
- Word count control (800-1200 words)
- Tone/style variations
- Display generated content in editor view
- Save to database functionality

### 3.2 YouTube → Blog Generator

- Create `/generate/youtube` page with URL input
- Integrate RapidAPI YouTube Transcript API:
- Fetch video transcript
- Extract video metadata (title, description)
- Build OpenAI integration:
- Summarize transcript
- Expand into SEO blog post
- Extract 3-5 social media captions
- Display results with transcript preview
- Save blog + captions to database

### 3.3 Social Media Caption Generator

- Create `/generate/caption` page
- Accept sentence/blog link/keyword input
- Generate 3 variants (Twitter/LinkedIn/Instagram styles)
- Add hashtag/emoji toggle
- Use OpenAI with platform-specific prompts
- Display and save results

### 3.4 Programmatic SEO Mode

- Create `/generate/bulk` page
- CSV upload component (or textarea for keyword list)
- Background job queue system:
- Process keywords in batches
- Show progress indicator
- Handle rate limiting
- Generate multiple blog drafts
- Export as .zip or bulk Zapier push option

## Phase 4: Content Management & Editor

### 4.1 Content Editor Component

- Build rich text editor (using Tiptap or similar)
- Add sidebar for tone/length regeneration
- Implement save/edit functionality
- Add export options (.txt, .md)

### 4.2 My Content Dashboard

- Create `/content` page listing all user content
- Add filters (by type, date, status)
- Implement search functionality
- Add action buttons: Edit, Download, Publish to Zapier, Delete
- Pagination for content list

## Phase 5: Zapier Integration

### 5.1 Zapier Webhook Setup

- Create Zapier webhook configuration page in settings
- Store webhook URL per user in database
- Build "Publish to Zapier" button component
- Create API route `/api/zapier/publish`:
- Format payload: `{title, body, tags, metadata}`
- Send POST request to user's webhook
- Handle errors gracefully
- Add success/error toast notifications

## Phase 6: Payments & Subscription Tiers

### 6.1 Stripe Integration

- Set up Stripe account configuration
- Create subscription plans:
- Free: 3 generations/month
- Pro ($19/mo): Unlimited + Zapier
- Enterprise ($49/mo): Adds bulk mode
- Build checkout flow (`/pricing`)
- Implement Stripe webhook for subscription events
- Update user tier on payment success
- Add usage tracking middleware

### 6.2 Usage Limits & Credit System

- Track generation count per user
- Enforce limits based on subscription tier
- Show usage dashboard
- Add upgrade prompts when limits reached

## Phase 7: UI/UX & Polish

### 7.1 Dashboard Layout

- Create main dashboard (`/dashboard`) with tab navigation:
- Generate tab
- My Content tab  
- Settings tab
- Build responsive Tailwind grid layout
- Add loading states and skeletons
- Implement error boundaries

### 7.2 Design System

- Apply blue/purple gradient theme
- Create reusable components:
- Card components
- Button variants
- Input fields
- Toast notifications
- Modal dialogs
- Ensure mobile responsiveness

### 7.3 SEO Landing Page

- Create public landing page (`/`)
- Add marketing copy from PRD
- Include feature highlights
- Add pricing preview
- CTA for sign up

## Phase 8: Deployment & Configuration

### 8.1 Vercel Deployment

- Configure Vercel project
- Set up environment variables
- Configure build settings
- Set up custom domain (if needed)

### 8.2 Final Configuration

- Add error logging (Sentry or similar)
- Configure analytics (optional)
- Test all integrations end-to-end
- Create deployment documentation

## Key Files to Create

**Core Pages:**

- `/app/page.tsx` - Landing page
- `/app/dashboard/page.tsx` - Main dashboard
- `/app/generate/keyword/page.tsx` - Keyword generator
- `/app/generate/youtube/page.tsx` - YouTube generator
- `/app/generate/caption/page.tsx` - Caption generator
- `/app/generate/bulk/page.tsx` - Bulk generator
- `/app/content/page.tsx` - Content library
- `/app/settings/page.tsx` - User settings
- `/app/pricing/page.tsx` - Pricing page
- `/app/auth/signin/page.tsx` - Sign in
- `/app/auth/signup/page.tsx` - Sign up

**API Routes:**

- `/app/api/generate/keyword/route.ts`
- `/app/api/generate/youtube/route.ts`
- `/app/api/generate/caption/route.ts`
- `/app/api/generate/bulk/route.ts`
- `/app/api/zapier/publish/route.ts`
- `/app/api/stripe/checkout/route.ts`
- `/app/api/stripe/webhook/route.ts`

**Components:**

- `/components/editor/ContentEditor.tsx`
- `/components/content/ContentList.tsx`
- `/components/content/ContentCard.tsx`
- `/components/zapier/PublishButton.tsx`
- `/components/auth/AuthProvider.tsx`
- `/components/dashboard/DashboardTabs.tsx`

**Utilities:**

- `/lib/supabase/client.ts`
- `/lib/supabase/server.ts`
- `/lib/openai/client.ts`
- `/lib/rapidapi/youtube.ts`
- `/lib/stripe/client.ts`
- `/lib/utils.ts`

**Database:**

- Supabase SQL schema for tables and RLS policies

### To-dos

- [ ] Initialize Next.js 15 project with TypeScript, Tailwind CSS, and folder structure
- [ ] Configure Supabase client, create database schema (users, content, generations, zapier_webhooks), and set up RLS policies
- [ ] Implement Supabase authentication with sign up, sign in, and protected routes
- [ ] Build keyword to blog generator with tone/length controls and OpenAI integration
- [ ] Implement YouTube to blog converter using RapidAPI for transcripts and OpenAI for expansion
- [ ] Create social media caption generator with platform-specific variants and hashtag/emoji toggles
- [ ] Build programmatic SEO mode with CSV upload, batch processing, and zip export
- [ ] Create rich text editor component with save/edit and export functionality
- [ ] Build My Content page with listing, filters, search, and action buttons
- [ ] Implement Zapier webhook configuration and publish functionality with toast notifications
- [ ] Set up Stripe subscriptions, checkout flow, webhooks, and usage tracking
- [ ] Implement dashboard layout, design system with blue/purple gradients, and mobile responsiveness
- [ ] Create public landing page with marketing copy, features, and pricing preview
- [ ] Configure Vercel deployment, environment variables, and final testing