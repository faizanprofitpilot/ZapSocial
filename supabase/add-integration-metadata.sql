-- Add metadata column to integrations table
-- This column stores additional integration data like Facebook pages, Instagram accounts, etc.

ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index on metadata for better query performance
CREATE INDEX IF NOT EXISTS idx_integrations_metadata ON public.integrations USING GIN (metadata);

