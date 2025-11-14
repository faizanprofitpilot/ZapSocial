-- Meta API Logs Table
-- Stores all API requests and responses for debugging and analytics

CREATE TABLE IF NOT EXISTS public.meta_api_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  integration_id uuid REFERENCES public.integrations(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin')),
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meta_api_logs_user_id ON public.meta_api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_api_logs_integration_id ON public.meta_api_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_meta_api_logs_platform ON public.meta_api_logs(platform);
CREATE INDEX IF NOT EXISTS idx_meta_api_logs_created_at ON public.meta_api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_meta_api_logs_success ON public.meta_api_logs(success);

-- RLS Policies
ALTER TABLE public.meta_api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API logs"
  ON public.meta_api_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON public.meta_api_logs TO authenticated;

