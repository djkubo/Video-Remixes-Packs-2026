-- Add UTM tracking columns to analytics_events table
ALTER TABLE public.analytics_events 
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT;

-- Create index for faster source queries
CREATE INDEX IF NOT EXISTS idx_analytics_utm_source ON public.analytics_events(utm_source);
CREATE INDEX IF NOT EXISTS idx_analytics_utm_medium ON public.analytics_events(utm_medium);
CREATE INDEX IF NOT EXISTS idx_analytics_utm_campaign ON public.analytics_events(utm_campaign);