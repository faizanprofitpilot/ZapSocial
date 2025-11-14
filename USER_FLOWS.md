# Zapwrite User Flow Documentation

## Overview
This document describes the detailed user flows for each feature in the Zapwrite platform. All flows assume users are authenticated unless otherwise specified.

---

## 1. Landing Page & Authentication Flow

### 1.1 Public Landing Page (`/`)
**Entry Point:** User visits root URL

**User Journey:**
1. User lands on homepage with hero section
2. Views feature cards: Keyword → Blog, YouTube → Blog, Auto-Publish
3. CTA buttons available:
   - "Start Creating" → Redirects to `/auth/signup`
   - "View Pricing" → Redirects to `/pricing`

**Exit Points:**
- Sign up flow
- Pricing page
- Sign in (via navbar link)

---

### 1.2 Sign Up Flow (`/auth/signup`)
**Entry Point:** User clicks "Start Creating" or "Sign Up" from navbar

**User Journey:**
1. User sees signup form with:
   - Email input field
   - Password input field (minimum 6 characters)
2. User enters credentials and submits
3. System validates inputs:
   - Email format validation
   - Password length check (≥6 chars)
4. **On Success:**
   - Account created via Supabase Auth
   - User automatically logged in
   - Redirected to `/dashboard`
   - Page refreshed to show authenticated state
5. **On Error:**
   - Error message displayed in red alert box
   - User remains on signup page
   - Can retry or navigate to sign in

**Exit Points:**
- Dashboard (after successful signup)
- Sign in page (via "Already have an account?" link)

---

### 1.3 Sign In Flow (`/auth/signin`)
**Entry Point:** User clicks "Sign In" from navbar or link from signup page

**User Journey:**
1. User sees signin form with:
   - Email input field
   - Password input field
2. User enters credentials and submits
3. System validates against Supabase Auth
4. **On Success:**
   - User authenticated
   - Redirected to `/dashboard`
   - Page refreshed to show authenticated state
5. **On Error:**
   - Error message displayed in red alert box
   - User remains on signin page
   - Can retry or navigate to sign up

**Exit Points:**
- Dashboard (after successful signin)
- Sign up page (via "Don't have an account?" link)

---

## 2. Dashboard Flow (`/dashboard`)

### Entry Point
User successfully authenticates OR navigates from any authenticated page

**User Journey:**
1. System checks authentication:
   - If not authenticated → Redirects to `/auth/signin`
   - If authenticated → Continues
2. User sees dashboard with:
   - Header: "What would you like to create today?"
   - Subtitle: "Choose your content type — blogs, social posts, or bulk SEO drafts."
   - Four content generation cards in a glassmorphic container:
     - **Keyword → Blog** (blue gradient)
     - **YouTube → Blog** (red gradient)
     - **Social Captions** (indigo gradient)
     - **Bulk Generate** (purple gradient)
3. Each card displays:
   - Icon (gradient background)
   - Title
   - Description
   - "Get Started" button

**User Actions:**
- Click "Get Started" on any card → Navigate to respective generator page
- Navigate via header toggle: "Generate", "My Content", "Settings"
- Sign out via header button

**Exit Points:**
- Any generator page (`/generate/*`)
- My Content page (`/content`)
- Settings page (`/settings`)

---

## 3. Keyword → Blog Generator Flow (`/generate/keyword`)

### Entry Point
User clicks "Get Started" on Keyword → Blog card from dashboard

**User Journey:**

#### Step 1: Input Form
1. User sees form with:
   - **Keyword/Topic** input field (required)
     - Placeholder: "e.g., 'AI content generation tips'"
   - **Tone** dropdown (default: "friendly")
     - Options: Friendly, Corporate, Playful, Expert
   - **Length** dropdown (default: "medium")
     - Options: Short (~800 words), Medium (~1000 words), Long (~1200 words)
2. User fills in keyword and selects preferences
3. User clicks "Generate Blog Post" button

#### Step 2: Generation Process
1. Button shows loading state:
   - Text changes to "⚡ Generating..."
   - Button disabled
   - Previous errors cleared
2. **Backend Process:**
   - API validates user authentication
   - Checks usage limits (free tier: 3/month)
   - If limit exceeded → Error returned
   - Constructs OpenAI prompt with:
     - SEO optimization instructions
     - Tone-specific writing style
     - Word count target
   - Calls OpenAI GPT-4o API
   - Parses response for title and content
   - Saves to `content` table with metadata
   - Tracks generation in `generations` table
   - Updates user's `generations_this_month` count
3. **On Error:**
   - Red error alert displayed
   - Button re-enabled
   - User can retry or modify inputs

#### Step 3: Success & Redirect
1. **On Success:**
   - Content generated and saved
   - User automatically redirected to `/content/{id}` (content detail page)
   - No intermediate success message (direct navigation)

**Exit Points:**
- Content detail page (automatic redirect on success)
- Dashboard (via navigation)
- My Content (via navigation)

---

## 4. YouTube → Blog Generator Flow (`/generate/youtube`)

### Entry Point
User clicks "Get Started" on YouTube → Blog card from dashboard

**User Journey:**

#### Step 1: Input Form
1. User sees form with:
   - **YouTube URL** input field (required)
     - Placeholder: "https://www.youtube.com/watch?v=..."
   - Placeholder shows example YouTube URL format
2. User pastes or types YouTube video URL
3. User clicks "Generate Blog Post" button

#### Step 2: Generation Process
1. Button shows loading state (same as Keyword flow)
2. **Backend Process:**
   - API validates user authentication
   - Checks usage limits
   - Extracts video ID from URL
   - Validates URL format
   - Fetches video transcript via RapidAPI YouTube Transcript API
   - Combines transcript text segments
   - Constructs OpenAI prompt to:
     - Summarize transcript
     - Expand into SEO-optimized blog post
     - Extract 3-5 social media captions
   - Calls OpenAI GPT-4o API
   - Parses response for title, content, and captions
   - Saves to `content` table with:
     - Type: "youtube"
     - Video ID and URL in metadata
     - Transcript snippet (first 5000 chars) in metadata
     - Generated captions in metadata
   - Tracks generation and updates usage count
3. **On Error:**
   - Specific error messages shown:
     - "Invalid YouTube URL"
     - "Failed to fetch transcript"
     - "Monthly limit reached" (if applicable)
   - User can retry with different URL

#### Step 3: Success & Redirect
1. **On Success:**
   - Blog post and captions generated
   - Saved to database
   - User redirected to `/content/{id}`
   - Content detail page shows full blog post

**Exit Points:**
- Content detail page (automatic redirect)
- Dashboard (via navigation)

---

## 5. Social Media Caption Generator Flow (`/generate/caption`)

### Entry Point
User clicks "Get Started" on Social Captions card from dashboard

**User Journey:**

#### Step 1: Input Form
1. User sees form with:
   - **Input** field (required)
     - Placeholder: "e.g., 'Check out our new AI features'"
     - Accepts: sentence, blog link, or keyword
   - No additional options (tone/length determined automatically by platform)
2. User enters content idea
3. User clicks "Generate Captions" button

#### Step 2: Generation Process
1. Button shows loading state
2. **Backend Process:**
   - Validates authentication and usage limits
   - Constructs OpenAI prompt for 3 platform-specific variants:
     - Twitter/X style (concise, engaging)
     - LinkedIn style (professional, value-focused)
     - Instagram style (visual, engaging with emojis)
   - Calls OpenAI GPT-4o API
   - Parses response to extract each platform's caption
   - Saves to `content` table with:
     - Type: "caption"
     - Title: "Social Media Captions - {first 50 chars of input}"
     - Body: All three captions separated by "---"
     - Captions array in metadata
   - Tracks generation and updates usage

#### Step 3: Success & Redirect
1. **On Success:**
   - Three captions generated
   - Saved to database
   - User redirected to `/content/{id}`
   - Content page displays all platform variants

**Exit Points:**
- Content detail page
- Dashboard

---

## 6. Bulk/Programmatic SEO Generator Flow (`/generate/bulk`)

### Entry Point
User clicks "Get Started" on Bulk Generate card from dashboard

**User Journey:**

#### Step 1: Input Keywords
1. User sees form with:
   - **Keywords** textarea (required)
     - Placeholder: "keyword 1\nkeyword 2\nkeyword 3"
     - One keyword per line
   - Large text area (height: 256px) for multiple keywords
2. User enters keywords (one per line)
3. User clicks "Generate All" button

#### Step 2: Batch Processing
1. Button shows loading state: "⚡ Generating..."
2. **Backend Process:**
   - Validates keyword list (at least one non-empty keyword)
   - Shows progress message: "Generating {count} blog posts... This may take a while."
   - **Sequential Processing (one at a time):**
     - For each keyword:
       - Calls `/api/generate/keyword` endpoint
       - Uses default tone ("friendly") and length ("medium")
       - Saves each blog post to database
       - Updates generation tracking
   - If any generation fails:
     - Error displayed
     - Processing stops
     - User can retry
3. **On Completion:**
   - Success message: "All blog posts generated successfully! Check your content library."
   - Keyword textarea cleared
   - Button re-enabled

#### Step 3: Content Review
1. User can navigate to "My Content" page
2. All generated blog posts appear in content library
3. Each post can be viewed, edited, downloaded, or published individually

**Note:** This is a basic implementation. Full programmatic SEO features (CSV upload, batch progress tracking, zip export) are pending.

**Exit Points:**
- Content page (to view all generated posts)
- Dashboard

---

## 7. My Content Library Flow (`/content`)

### Entry Point
User clicks "My Content" in navigation OR views content detail page

**User Journey:**

#### Step 1: Content List View
1. System checks authentication → Redirects if not logged in
2. Fetches all user's content from database (ordered by `created_at` DESC)
3. **Page Header:**
   - Title: "My Content"
   - Stats: "{count} posts generated • {total_words} words"
   - "Generate New" button → Links to `/dashboard`
4. **Content Display:**
   - **If no content:**
     - Large empty state card
     - Icon and message: "No content yet. Start generating!"
     - "Go to Dashboard" CTA button
   - **If content exists:**
     - Grid layout (1 column mobile, 2 columns tablet, 3 columns desktop)
     - Each card shows:
       - Title (truncated to 2 lines)
       - Date created (formatted: "Jan 15, 2024")
       - Content type badge (keyword, youtube, caption)
       - Content preview (first 150 characters, 3 lines max)
       - "View Content" button with arrow icon

#### Step 2: Content Card Interactions
1. **Hover Effects:**
   - Card lifts slightly (`hover:-translate-y-1`)
   - Shadow increases
   - Border color changes to brand color
2. **Click "View Content":**
   - Navigate to `/content/{id}` (content detail page)

**Exit Points:**
- Individual content detail pages
- Dashboard (via "Generate New" button)
- Settings (via navigation)

---

## 8. Content Detail View Flow (`/content/[id]`)

### Entry Point
User clicks "View Content" from content library OR redirected after generation

**User Journey:**

#### Step 1: Content Display
1. System checks authentication and ownership:
   - Verifies user owns the content (via `user_id`)
   - If not found or not owned → 404 page
2. **Page Layout:**
   - **Header Section:**
     - Title (full content title)
     - Metadata: "{type} • {formatted date}"
     - Action buttons (right side):
       - "Publish to Zapier" button
       - "Download" button (downloads as .txt file)
   - **Content Card:**
     - Icon + "Content" label
     - Full content body displayed
     - Formatted with prose styling
     - Whitespace preserved (pre-wrap)
     - Dark theme styling

#### Step 2: Actions Available

**A. Publish to Zapier:**
1. User clicks "Publish to Zapier" button
2. **If webhook not configured:**
   - Alert: "Failed to publish to Zapier. Please check your webhook configuration in settings."
   - User should navigate to Settings to configure webhook
3. **If webhook configured:**
   - Button shows "Publishing..." state
   - Backend sends POST to user's Zapier webhook URL with:
     - Title
     - Body
     - Tags (from keywords)
     - Metadata
   - **On Success:**
     - Button shows "✅ Sent to Zapier!" (3 seconds)
     - Button disabled temporarily
   - **On Error:**
     - Alert shown with error message
     - User can retry

**B. Download Content:**
1. User clicks "Download" button
2. Browser downloads file as `{title}.txt`
3. File contains full content body (plain text)

**C. Navigation:**
- User can navigate via header to other sections
- Can return to content library or generate new content

**Exit Points:**
- Settings (to configure Zapier)
- Content library
- Dashboard

---

## 9. Settings Flow (`/settings`)

### Entry Point
User clicks "Settings" in navigation header

**User Journey:**

#### Step 1: Settings Page
1. System checks authentication → Redirects if needed
2. Fetches user's existing Zapier webhook URL (if configured)
3. **Page Layout:**
   - Header: Icon + "Settings" title + description
   - Single card: "Zapier Integration"

#### Step 2: Zapier Webhook Configuration
1. **Form Fields:**
   - **Zapier Webhook URL** input (required)
     - Placeholder: "https://hooks.zapier.com/hooks/catch/..."
     - Pre-filled if already configured
   - Helper text: "Get your webhook URL from your Zapier Zap configuration"
2. User enters/pastes Zapier webhook URL
3. User clicks "Save Webhook" button
4. **Backend Process:**
   - Validates URL format
   - Saves/updates webhook URL in `zapier_webhooks` table
   - Associates with current user's ID
5. **On Success:**
   - Button shows "✅ Saved!" (3 seconds)
   - Form remains with saved URL
6. **On Error:**
   - Alert: "Failed to save webhook URL"
   - User can retry

#### Step 3: Using Configured Webhook
- Once saved, user can publish any content to Zapier from content detail pages
- Webhook persists across sessions
- User can update URL at any time

**Exit Points:**
- Dashboard
- My Content
- Any content detail page (to test publishing)

---

## 10. Navigation & Header Flow

### Components
- **Fixed Header** (glassmorphic, top of all pages)
- **Logo** (left): Zapwrite logo + text (links to dashboard/home)
- **Navigation Toggle** (center, desktop only):
  - "Generate" → `/dashboard`
  - "My Content" → `/content`
  - "Settings" → `/settings`
  - Active state indicated by gradient background
  - Sliding indicator effect
- **User Info** (right):
  - User email displayed (hidden on mobile)
  - "Sign Out" button

### User Actions

**Sign Out:**
1. User clicks "Sign Out" button
2. Button shows "Signing out..." state
3. Supabase auth sign out called
4. User redirected to `/` (homepage)
5. Page refreshed (shows unauthenticated state)

**Navigation:**
- Clicking logo → Dashboard (if authenticated) or Home (if not)
- Clicking nav toggle items → Navigate to respective pages
- Active route highlighted
- Smooth transitions

---

## Error Handling & Edge Cases

### Authentication Errors
- **Unauthenticated access:** Automatic redirect to `/auth/signin`
- **Session expired:** Same redirect, user must sign in again

### Generation Errors
- **API failures:** User-friendly error messages displayed
- **Usage limit exceeded:** "Monthly limit reached. Upgrade to continue." (free tier: 3/month)
- **Invalid inputs:** Validation errors shown in red alert boxes
- **Network errors:** Generic "Failed to generate content" message

### Content Errors
- **Content not found:** 404 page displayed
- **Unauthorized access:** 404 (can't access other users' content)
- **Publishing errors:** Alert shown, user directed to check webhook configuration

### Form Validation
- **Required fields:** HTML5 validation prevents submission
- **Email format:** Validated on frontend and backend
- **Password length:** Minimum 6 characters enforced

---

## Data Flow Summary

### Generation Flow
1. User submits form → Frontend validation
2. POST to `/api/generate/{type}` → Backend
3. Authentication check → Supabase Auth
4. Usage limit check → Users table
5. API call → OpenAI or RapidAPI
6. Content parsing → Extract title/body
7. Database save → Content table (with metadata)
8. Usage tracking → Generations table + Users table update
9. Response → Frontend receives content data
10. Redirect → Content detail page

### Publishing Flow
1. User clicks "Publish to Zapier" → Frontend
2. POST to `/api/zapier/publish` with `contentId` → Backend
3. Fetch content from database → Verify ownership
4. Fetch user's webhook URL → Zapier webhooks table
5. Format payload → {title, body, tags, metadata}
6. POST to Zapier webhook → External API
7. Response handling → Success/error feedback

---

## Current Limitations & Pending Features

1. **Bulk Generator:**
   - Basic sequential processing only
   - No CSV upload
   - No progress tracking
   - No zip export
   - No background job queue

2. **Content Editor:**
   - No rich text editor (plain text display only)
   - No inline editing
   - No regeneration with different tone/length

3. **Payments:**
   - Stripe integration not implemented
   - No subscription tiers enforced
   - Usage limits hardcoded (not dynamic)

4. **Features:**
   - No search functionality in content library
   - No filters (by type, date)
   - No pagination for large content lists
   - No content deletion

---

## Summary Statistics

- **Total Features:** 8 major flows
- **Authenticated Pages:** 7
- **Public Pages:** 2 (landing, pricing preview)
- **API Endpoints:** 5 (generate: keyword, youtube, caption; zapier: publish; settings: webhook)
- **Database Tables:** 4 (users, content, generations, zapier_webhooks)
- **External Integrations:** OpenAI GPT-4o, RapidAPI YouTube Transcript

---

*Last Updated: Based on current codebase implementation*

