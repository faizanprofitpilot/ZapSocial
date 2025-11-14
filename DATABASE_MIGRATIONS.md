# Database Migrations Guide

This document lists all database migrations that must be run in Supabase before deployment.

## Migration Order

Run these migrations in **exact order** in the Supabase SQL Editor:

### 1. Base Schema
**File**: `supabase/schema.sql`

Creates the foundation:
- `users` table (extends auth.users)
- `content` table (stores generated content)
- `generations` table (tracks usage)
- `zapier_webhooks` table
- Basic RLS policies

**Status**: Run this first if not already done.

### 2. Social Integrations Schema
**File**: `supabase/schema-social.sql` OR `supabase/migration-to-social.sql`

**Choose ONE** based on what's already in your database:
- Use `schema-social.sql` if starting fresh
- Use `migration-to-social.sql` if you have existing `schema.sql` and need to migrate

Creates:
- `integrations` table (OAuth tokens for platforms)
- `posts` table (published/scheduled posts)
- Related RLS policies

**Status**: Check which file matches your current state.

### 3. Integration Metadata
**File**: `supabase/add-integration-metadata.sql`

**Note**: Only run if not already included in `schema-social.sql` or `migration-to-social.sql`

Adds:
- `metadata` JSONB column to `integrations` table (stores pages, profiles, etc.)

**Status**: Check if `integrations.metadata` column already exists.

### 4. Meta API Logs
**File**: `supabase/meta-api-logs.sql`

Creates:
- `meta_api_logs` table (tracks all API requests/responses)
- Indexes for performance
- RLS policies

**Status**: Required for Meta (Facebook/Instagram) integration.

### 5. LinkedIn Support
**File**: `supabase/linkedin-migration.sql`

Updates:
- `meta_api_logs.platform` check constraint to include `'linkedin'`
- `integrations` table to support LinkedIn tokens

**Status**: Required for LinkedIn integration.

## Verification Queries

After running migrations, verify with these queries:

### Check Tables Exist
```sql
-- Verify core tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'content', 'integrations', 'posts', 'meta_api_logs');
```

### Check Integrations Table Structure
```sql
-- Verify integrations table has required columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'integrations' 
  AND table_schema = 'public';
```

**Required columns**:
- `id` (uuid)
- `user_id` (uuid)
- `platform` (text)
- `token` (text)
- `refresh_token` (text, nullable)
- `expires_at` (timestamp, nullable)
- `connected_at` (timestamp)
- `metadata` (jsonb, nullable)

### Check Posts Table Structure
```sql
-- Verify posts table has required columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND table_schema = 'public';
```

**Required columns**:
- `id` (uuid)
- `user_id` (uuid)
- `content` (text)
- `platform` (text)
- `status` (text)
- `scheduled_at` (timestamp, nullable)
- `published_at` (timestamp, nullable)
- `metadata` (jsonb, nullable)

### Check RLS Policies
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'content', 'integrations', 'posts', 'meta_api_logs');
```

All should return `rowsecurity = true`.

### Check Indexes
```sql
-- Verify indexes exist for performance
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('integrations', 'posts', 'meta_api_logs');
```

## Migration Checklist

Before deployment:

- [ ] Run `schema.sql` (base schema)
- [ ] Run `schema-social.sql` OR `migration-to-social.sql` (choose one)
- [ ] Run `add-integration-metadata.sql` (if metadata column missing)
- [ ] Run `meta-api-logs.sql` (API logging)
- [ ] Run `linkedin-migration.sql` (LinkedIn support)
- [ ] Verify all tables exist (use verification queries)
- [ ] Verify RLS policies are enabled
- [ ] Test creating a user account
- [ ] Test creating an integration record
- [ ] Test creating a post record

## Common Issues

### Migration Already Run
If you see errors like "relation already exists" or "column already exists", the migration may have already been applied. Check the verification queries to confirm.

### Missing Columns
If queries fail after migrations, check:
1. Did you run migrations in order?
2. Are there any errors in the SQL Editor output?
3. Run verification queries to see what's missing

### RLS Blocking Queries
If you can't query tables even though they exist:
1. Check RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. Verify policies exist: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
3. Ensure you're authenticated when testing queries

## Rollback

**⚠️ Warning**: Rolling back migrations may cause data loss. Only do this if absolutely necessary and you have backups.

If you need to rollback:
1. **DO NOT** drop tables if they contain production data
2. Instead, create new migrations to fix issues
3. Contact support if you need help with rollback

## Next Steps

After migrations are complete:
1. Configure environment variables (see `ENV_SETUP.md`)
2. Test OAuth flows (Meta, LinkedIn)
3. Deploy to Vercel
4. Verify production database matches development

