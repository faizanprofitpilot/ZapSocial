# ZapSocial - AI Social Media Management Platform

ZapSocial is an AI-powered social media management platform that helps businesses create, schedule, and publish content across LinkedIn, Instagram, and Facebook.

## Features

- **AI-Powered Caption Generation**: Generate platform-specific captions for LinkedIn, Instagram, and Facebook
- **Social Media Publishing**: Direct publishing to LinkedIn, Instagram, and Facebook
- **Post Scheduling**: Schedule posts for future publishing with automatic processing
- **AI Copilot**: Chat-based AI assistant for content strategy and ideas
- **Analytics**: Track post engagement and performance metrics

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Supabase (Auth + Database)
- **AI**: OpenAI GPT-4o
- **Social Integrations**: Meta (Facebook/Instagram) API, LinkedIn API
- **Payments**: Stripe (planned)
- **Deployment**: Vercel

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see `ENV_SETUP.md` for full list):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
NEXT_PUBLIC_APP_URL=your_app_url
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run migrations in order (see `DATABASE_MIGRATIONS.md`)

5. Run the development server:
```bash
npm run dev
```

## Documentation

- `ENV_SETUP.md` - Environment variables guide
- `DATABASE_MIGRATIONS.md` - Database migration guide
- `FACEBOOK_INSTAGRAM_SETUP.md` - Meta API setup guide
- `LINKEDIN_SETUP_GUIDE.md` - LinkedIn API setup guide

## License

MIT

