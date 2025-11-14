-- LinkedIn Integration Migration
-- Run this if you haven't already updated your meta_api_logs table

-- Update meta_api_logs table to include LinkedIn (if table exists)
DO $$ 
BEGIN
  -- Check if meta_api_logs table exists
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'meta_api_logs') THEN
    
    -- Drop existing check constraint if it exists
    ALTER TABLE public.meta_api_logs 
    DROP CONSTRAINT IF EXISTS meta_api_logs_platform_check;
    
    -- Add new check constraint including LinkedIn
    ALTER TABLE public.meta_api_logs 
    ADD CONSTRAINT meta_api_logs_platform_check 
    CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'x'));
    
  ELSE
    -- Create table if it doesn't exist (from meta-api-logs.sql)
    CREATE TABLE public.meta_api_logs (
      id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
      integration_id uuid REFERENCES public.integrations(id) ON DELETE CASCADE,
      platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'x')),
      endpoint text NOT NULL,
      method text NOT NULL CHECK (method IN ('GET', 'POST', 'DELETE', 'PATCH')),
      request_body jsonb,
      response_body jsonb,
      status_code integer,
      success boolean NOT NULL DEFAULT false,
      error_message text,
      duration_ms integer,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_meta_api_logs_user_id ON public.meta_api_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_meta_api_logs_integration_id ON public.meta_api_logs(integration_id);
    CREATE INDEX IF NOT EXISTS idx_meta_api_logs_platform ON public.meta_api_logs(platform);
    CREATE INDEX IF NOT EXISTS idx_meta_api_logs_created_at ON public.meta_api_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_meta_api_logs_success ON public.meta_api_logs(success);

    -- RLS
    ALTER TABLE public.meta_api_logs ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view their own API logs"
      ON public.meta_api_logs
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    GRANT SELECT, INSERT ON public.meta_api_logs TO authenticated;
  END IF;
END $$;

-- Ensure integrations table has metadata column (if add-integration-metadata.sql hasn't been run)
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index on metadata if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_integrations_metadata 
ON public.integrations USING GIN (metadata);

