-- The analytics_events INSERT policy was already fixed in the previous migration
-- For the analytics_daily_summary VIEW, we need to recreate it with security_invoker
-- First drop and recreate with proper security

DROP VIEW IF EXISTS public.analytics_daily_summary;

CREATE VIEW public.analytics_daily_summary
WITH (security_invoker = on) AS
SELECT 
  date(created_at) as date,
  event_name,
  page_path,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT visitor_id) as unique_visitors
FROM public.analytics_events
GROUP BY date(created_at), event_name, page_path;