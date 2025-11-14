-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'enterprise')),
  generations_this_month integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Content table
create table public.content (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  body text not null,
  type text not null check (type in ('keyword', 'youtube', 'caption', 'bulk')),
  keywords text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Generations tracking table
create table public.generations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('keyword', 'youtube', 'caption', 'bulk')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Zapier webhooks table
create table public.zapier_webhooks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  webhook_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) policies

-- Enable RLS
alter table public.users enable row level security;
alter table public.content enable row level security;
alter table public.generations enable row level security;
alter table public.zapier_webhooks enable row level security;

-- Users policies
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- Content policies
create policy "Users can view their own content"
  on public.content for select
  using (auth.uid() = user_id);

create policy "Users can insert their own content"
  on public.content for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own content"
  on public.content for update
  using (auth.uid() = user_id);

create policy "Users can delete their own content"
  on public.content for delete
  using (auth.uid() = user_id);

-- Generations policies
create policy "Users can view their own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

-- Zapier webhooks policies
create policy "Users can view their own webhooks"
  on public.zapier_webhooks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own webhooks"
  on public.zapier_webhooks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own webhooks"
  on public.zapier_webhooks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own webhooks"
  on public.zapier_webhooks for delete
  using (auth.uid() = user_id);

-- Function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to reset monthly generation count
create or replace function public.reset_monthly_generations()
returns void as $$
begin
  update public.users
  set generations_this_month = 0
  where generations_this_month > 0;
end;
$$ language plpgsql;

