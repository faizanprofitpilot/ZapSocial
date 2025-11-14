-- ZapSocial Database Schema
-- New tables for social media management platform

-- Posts table (replaces content table for social posts)
create table public.posts (
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
create table public.schedules (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  datetime timestamp with time zone not null,
  platform text not null check (platform in ('instagram', 'linkedin', 'x', 'facebook', 'tiktok', 'youtube')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Integrations table (stores platform connection tokens)
create table public.integrations (
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
create table public.metrics (
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

-- Row Level Security (RLS) policies

-- Enable RLS
alter table public.posts enable row level security;
alter table public.schedules enable row level security;
alter table public.integrations enable row level security;
alter table public.metrics enable row level security;

-- Posts policies
create policy "Users can view their own posts"
  on public.posts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- Schedules policies
create policy "Users can view their own schedules"
  on public.schedules for select
  using (auth.uid() = user_id);

create policy "Users can insert their own schedules"
  on public.schedules for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own schedules"
  on public.schedules for update
  using (auth.uid() = user_id);

create policy "Users can delete their own schedules"
  on public.schedules for delete
  using (auth.uid() = user_id);

-- Integrations policies
create policy "Users can view their own integrations"
  on public.integrations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own integrations"
  on public.integrations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own integrations"
  on public.integrations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own integrations"
  on public.integrations for delete
  using (auth.uid() = user_id);

-- Metrics policies
create policy "Users can view their own metrics"
  on public.metrics for select
  using (auth.uid() = (select user_id from public.posts where id = metrics.post_id));

create policy "Users can insert their own metrics"
  on public.metrics for insert
  with check (auth.uid() = (select user_id from public.posts where id = metrics.post_id));

-- Indexes for performance
create index idx_posts_user_id on public.posts(user_id);
create index idx_posts_status on public.posts(status);
create index idx_posts_platform on public.posts(platform);
create index idx_schedules_datetime on public.schedules(datetime);
create index idx_schedules_user_id on public.schedules(user_id);
create index idx_integrations_user_id on public.integrations(user_id);
create index idx_metrics_post_id on public.metrics(post_id);
create index idx_metrics_date on public.metrics(date);

