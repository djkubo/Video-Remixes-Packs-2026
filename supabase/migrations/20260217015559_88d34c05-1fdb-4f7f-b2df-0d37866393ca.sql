ALTER TABLE public.analytics_events
ADD COLUMN IF NOT EXISTS fbclid TEXT,
ADD COLUMN IF NOT EXISTS gclid TEXT,
ADD COLUMN IF NOT EXISTS ttclid TEXT;

CREATE INDEX IF NOT EXISTS idx_analytics_events_fbclid ON public.analytics_events(fbclid);
CREATE INDEX IF NOT EXISTS idx_analytics_events_gclid ON public.analytics_events(gclid);