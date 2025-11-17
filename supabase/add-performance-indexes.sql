-- Performance Indexes for Critical Queries
-- This migration adds indexes to optimize frequently executed queries

-- Index for scheduled posts processing
-- Used in: app/api/posts/scheduled/process/route.ts
-- Query: SELECT * FROM posts WHERE status = 'scheduled' AND scheduled_at <= now()
CREATE INDEX IF NOT EXISTS idx_posts_user_status_scheduled 
ON posts(user_id, status, scheduled_at)
WHERE status = 'scheduled';

-- Index for integrations lookup
-- Used in: Multiple routes that fetch integrations by user and platform
-- Query: SELECT * FROM integrations WHERE user_id = ? AND platform = ?
CREATE INDEX IF NOT EXISTS idx_integrations_user_platform 
ON integrations(user_id, platform);

-- Index for token refresh queries
-- Used in: app/api/integrations/facebook/refresh-all/route.ts
-- Used in: app/api/integrations/linkedin/refresh-all/route.ts
-- Query: SELECT * FROM integrations WHERE platform = ? AND expires_at <= ? AND expires_at IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_integrations_expires_at 
ON integrations(expires_at) 
WHERE expires_at IS NOT NULL;

-- Composite index for platform + expires_at (more specific for token refresh)
-- This helps with the specific query pattern used in refresh-all routes
CREATE INDEX IF NOT EXISTS idx_integrations_platform_expires_at 
ON integrations(platform, expires_at) 
WHERE expires_at IS NOT NULL;

-- Index for posts by user and creation date (common in dashboard queries)
-- Used in: app/dashboard/page.tsx, app/posts/page.tsx
-- Query: SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_posts_user_created_at 
ON posts(user_id, created_at DESC);

-- Index for schedules by user and datetime
-- Used in: app/dashboard/page.tsx, app/calendar/page.tsx
-- Query: SELECT * FROM schedules WHERE user_id = ? ORDER BY datetime ASC
CREATE INDEX IF NOT EXISTS idx_schedules_user_datetime 
ON schedules(user_id, datetime ASC);

-- Index for API logs by user (for analytics/queries)
-- Used in: lib/meta/api-logger.ts
-- Query: SELECT * FROM meta_api_logs WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_meta_api_logs_user_created 
ON meta_api_logs(user_id, created_at DESC);

-- Index for API logs by integration (for debugging specific integrations)
CREATE INDEX IF NOT EXISTS idx_meta_api_logs_integration 
ON meta_api_logs(integration_id, created_at DESC) 
WHERE integration_id IS NOT NULL;

-- Index for posts by platform (for filtering)
CREATE INDEX IF NOT EXISTS idx_posts_platform 
ON posts(platform) 
WHERE platform IS NOT NULL;

-- Index for posts by status (for status-based queries)
CREATE INDEX IF NOT EXISTS idx_posts_status 
ON posts(status) 
WHERE status IS NOT NULL;

-- Note: These indexes are optimized for the most common query patterns.
-- They may slightly slow down INSERT operations, but significantly speed up SELECT queries.
-- Monitor query performance and adjust as needed.

