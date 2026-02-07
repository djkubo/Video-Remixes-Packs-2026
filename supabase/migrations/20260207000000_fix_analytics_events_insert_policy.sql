-- Restore anonymous INSERT policy for analytics_events (basic validation).
-- The previous migration dropped the old policy but did not replace it.

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert analytics events (validated)" ON public.analytics_events;
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;

CREATE POLICY "Insert analytics events (validated)"
ON public.analytics_events
FOR INSERT
WITH CHECK (
  event_name IS NOT NULL
  AND length(trim(event_name)) > 0
  AND length(event_name) <= 64
  AND (page_path IS NULL OR length(page_path) <= 2048)
  AND (session_id IS NULL OR length(session_id) <= 128)
  AND (visitor_id IS NULL OR length(visitor_id) <= 128)
  AND (user_agent IS NULL OR length(user_agent) <= 512)
  AND (referrer IS NULL OR length(referrer) <= 2048)
  AND (country_code IS NULL OR length(country_code) <= 8)
  AND (utm_source IS NULL OR length(utm_source) <= 128)
  AND (utm_medium IS NULL OR length(utm_medium) <= 128)
  AND (utm_campaign IS NULL OR length(utm_campaign) <= 256)
  AND (utm_term IS NULL OR length(utm_term) <= 256)
  AND (utm_content IS NULL OR length(utm_content) <= 256)
);

