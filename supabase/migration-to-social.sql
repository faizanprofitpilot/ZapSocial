-- Migration Script: Zapwrite → ZapSocial
-- This script safely migrates from the old blog/SEO schema to the new social media schema
-- Run this AFTER running the original schema.sql (if you haven't already)

-- Step 1: Drop old tables that are no longer needed
-- (Only drop if they exist and you don't need to preserve data)

-- Drop old content table (replaced by posts)
DROP TABLE IF EXISTS public.content CASCADE;

-- Drop old generations tracking table (not needed for social platform)
DROP TABLE IF EXISTS public.generations CASCADE;

-- Note: We keep these tables:
-- - public.users (still needed)
-- - public.zapier_webhooks (might still be useful for publishing)

-- Step 2: Create new tables for social media platform
-- (These use CREATE TABLE IF NOT EXISTS to avoid errors if run multiple times)

-- Posts table (replaces content table for social posts)
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  caption text not null,
  hashtags text[],
  platform text not null check (platform in ('instagram', 'linkedin', 'x', 'facebook', 'tiktok', 'youtube')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at timestamp with time zone,
  image_url text,
  engagement_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Schedules table (stores scheduled posts)
CREATE TABLE IF NOT EXISTS public.schedules (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  datetime timestamp with time zone not null,
  platform text not null check (platform in ('instagram', 'linkedin', 'x', 'facebook', 'tiktok', 'youtube')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Integrations table (stores platform connection tokens)
CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  platform text not null check (platform in ('instagram', 'linkedin', 'x', 'facebook', 'tiktok', 'youtube')),
  token text, -- encrypted token (mock for now)
  refresh_token text,
  expires_at timestamp with time zone,
  connected_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, platform)
);

-- Metrics table (stores post engagement metrics)
CREATE TABLE IF NOT EXISTS public.metrics (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  impressions integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  saves integer default 0,
  platform text not null,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, date)
);

-- Step 3: Enable RLS on new tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop old RLS policies for deleted tables (if they exist)
DROP POLICY IF EXISTS "Users can view their own content" ON public.content;
DROP POLICY IF EXISTS "Users can insert their own content" ON public.content;
DROP POLICY IF EXISTS "Users can update their own content" ON public.content;
DROP POLICY IF EXISTS "Users can delete their own content" ON public.content;
DROP POLICY IF EXISTS "Users can view their own generations" ON public.generations;
DROP POLICY IF EXISTS "Users can insert their own generations" ON public.generations;

-- Step 5: Create RLS policies for new tables

-- Posts policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'posts' 
    AND policyname = 'Users can view their own posts'
  ) THEN
    CREATE POLICY "Users can view their own posts"
      ON public.posts FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'posts' 
    AND policyname = 'Users can insert their own posts'
  ) THEN
    CREATE POLICY "Users can insert their own posts"
      ON public.posts FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'posts' 
    AND policyname = 'Users can update their own posts'
  ) THEN
    CREATE POLICY "Users can update their own posts"
      ON public.posts FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'posts' 
    AND policyname = 'Users can delete their own posts'
  ) THEN
    CREATE POLICY "Users can delete their own posts"
      ON public.posts FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Schedules policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'schedules' 
    AND policyname = 'Users can view their own schedules'
  ) THEN
    CREATE POLICY "Users can view their own schedules"
      ON public.schedules FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'schedules' 
    AND policyname = 'Users can insert their own schedules'
  ) THEN
    CREATE POLICY "Users can insert their own schedules"
      ON public.schedules FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'schedules' 
    AND policyname = 'Users can update their own schedules'
  ) THEN
    CREATE POLICY "Users can update their own schedules"
      ON public.schedules FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'schedules' 
    AND policyname = 'Users can delete their own schedules'
  ) THEN
    CREATE POLICY "Users can delete their own schedules"
      ON public.schedules FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Integrations policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'integrations' 
    AND policyname = 'Users can view their own integrations'
  ) THEN
    CREATE POLICY "Users can view their own integrations"
      ON public.integrations FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'integrations' 
    AND policyname = 'Users can insert their own integrations'
  ) THEN
    CREATE POLICY "Users can insert their own integrations"
      ON public.integrations FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'integrations' 
    AND policyname = 'Users can update their own integrations'
  ) THEN
    CREATE POLICY "Users can update their own integrations"
      ON public.integrations FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'integrations' 
    AND policyname = 'Users can delete their own integrations'
  ) THEN
    CREATE POLICY "Users can delete their own integrations"
      ON public.integrations FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Metrics policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'metrics' 
    AND policyname = 'Users can view their own metrics'
  ) THEN
    CREATE POLICY "Users can view their own metrics"
      ON public.metrics FOR SELECT
      USING (auth.uid() = (SELECT user_id FROM public.posts WHERE id = metrics.post_id));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'metrics' 
    AND policyname = 'Users can insert their own metrics'
  ) THEN
    CREATE POLICY "Users can insert their own metrics"
      ON public.metrics FOR INSERT
      WITH CHECK (auth.uid() = (SELECT user_id FROM public.posts WHERE id = metrics.post_id));
  END IF;
END $$;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON public.posts(platform);
CREATE INDEX IF NOT EXISTS idx_schedules_datetime ON public.schedules(datetime);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_post_id ON public.metrics(post_id);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON public.metrics(date);

