# Zapwrite - AI Content Studio

Zapwrite is an AI-powered platform that helps businesses generate SEO-optimized blog posts and social media content in minutes.

## Features

- **Keyword → Blog Generator**: Transform keywords into full-length, SEO-optimized blog posts
- **YouTube → Blog Generator**: Convert YouTube videos into blog posts with transcripts
- **Social Media Caption Generator**: Generate captions for Twitter, LinkedIn, and Instagram
- **Zapier Integration**: One-click publishing to Notion, Medium, Webflow, or any platform via Zapier
- **Programmatic SEO**: Bulk generation mode for scaling content creation

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Supabase (Auth + Database)
- **AI**: OpenAI GPT-4o
- **Integrations**: RapidAPI (YouTube Transcript), Zapier Webhooks
- **Payments**: Stripe (planned)
- **Deployment**: Vercel

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (copy `.env.example` to `.env`):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
RAPIDAPI_YOUTUBE_KEY=your_rapidapi_key
RAPIDAPI_YOUTUBE_HOST=youtube-transcript-api.p.rapidapi.com
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor

5. Run the development server:
```bash
npm run dev
```

## Database Schema

See `supabase/schema.sql` for the complete database schema including:
- Users table
- Content table
- Generations tracking table
- Zapier webhooks table

## License

MIT

