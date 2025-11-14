-- Add Google Business Profile support to integrations table
-- This migration adds 'google-business' to the platform check constraint

-- Drop the existing check constraint
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS integrations_platform_check;

-- Add new check constraint including google-business
ALTER TABLE public.integrations ADD CONSTRAINT integrations_platform_check 
  CHECK (platform IN ('instagram', 'linkedin', 'x', 'facebook', 'tiktok', 'youtube', 'google-business'));

