-- CRO tracking schema extensions (Home + Funnel experiments)

ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS experiment_assignments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS funnel_step TEXT,
  ADD COLUMN IF NOT EXISTS cta_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_id TEXT,
  ADD COLUMN IF NOT EXISTS device_type TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT;

CREATE INDEX IF NOT EXISTS idx_analytics_events_funnel_step
  ON public.analytics_events(funnel_step);
CREATE INDEX IF NOT EXISTS idx_analytics_events_cta_id
  ON public.analytics_events(cta_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_plan_id
  ON public.analytics_events(plan_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_device_type
  ON public.analytics_events(device_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_language
  ON public.analytics_events(language);

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS funnel_step TEXT,
  ADD COLUMN IF NOT EXISTS source_page TEXT,
  ADD COLUMN IF NOT EXISTS experiment_assignments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS intent_plan TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_funnel_step ON public.leads(funnel_step);
CREATE INDEX IF NOT EXISTS idx_leads_source_page ON public.leads(source_page);
CREATE INDEX IF NOT EXISTS idx_leads_intent_plan ON public.leads(intent_plan);

-- Daily CRO dashboard metrics grouped by experiment variant.
CREATE OR REPLACE VIEW public.cro_daily_variant_summary
WITH (security_invoker = true) AS
WITH event_rows AS (
  SELECT
    date(a.created_at) AS day,
    COALESCE(NULLIF(exp->>'id', ''), 'baseline') AS experiment_id,
    COALESCE(NULLIF(exp->>'variant', ''), 'A') AS variant_id,
    a.session_id,
    a.event_name,
    a.event_data
  FROM public.analytics_events a
  LEFT JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(a.experiment_assignments) = 'array' AND jsonb_array_length(a.experiment_assignments) > 0
        THEN a.experiment_assignments
      ELSE jsonb_build_array(jsonb_build_object('id', 'baseline', 'variant', 'A'))
    END
  ) exp ON true
),
event_agg AS (
  SELECT
    day,
    experiment_id,
    variant_id,
    COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL) AS sessions,
    COUNT(*) FILTER (WHERE event_name = 'plan_click') AS plan_clicks,
    COUNT(*) FILTER (WHERE event_name = 'lead_submit_success') AS lead_submits,
    COUNT(*) FILTER (
      WHERE event_name = 'checkout_redirect'
      AND COALESCE(event_data->>'status', '') = 'redirected'
    ) AS checkout_redirects
  FROM event_rows
  GROUP BY day, experiment_id, variant_id
),
paid_rows AS (
  SELECT
    date(l.paid_at) AS day,
    COALESCE(NULLIF(exp->>'id', ''), 'baseline') AS experiment_id,
    COALESCE(NULLIF(exp->>'variant', ''), 'A') AS variant_id
  FROM public.leads l
  LEFT JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(l.experiment_assignments) = 'array' AND jsonb_array_length(l.experiment_assignments) > 0
        THEN l.experiment_assignments
      ELSE jsonb_build_array(jsonb_build_object('id', 'baseline', 'variant', 'A'))
    END
  ) exp ON true
  WHERE l.paid_at IS NOT NULL
),
paid_agg AS (
  SELECT
    day,
    experiment_id,
    variant_id,
    COUNT(*) AS paid_conversions
  FROM paid_rows
  GROUP BY day, experiment_id, variant_id
)
SELECT
  COALESCE(e.day, p.day) AS day,
  COALESCE(e.experiment_id, p.experiment_id) AS experiment_id,
  COALESCE(e.variant_id, p.variant_id) AS variant_id,
  COALESCE(e.sessions, 0) AS sessions,
  COALESCE(e.plan_clicks, 0) AS plan_clicks,
  COALESCE(e.lead_submits, 0) AS lead_submits,
  COALESCE(e.checkout_redirects, 0) AS checkout_redirects,
  COALESCE(p.paid_conversions, 0) AS paid_conversions
FROM event_agg e
FULL OUTER JOIN paid_agg p
  ON e.day = p.day
  AND e.experiment_id = p.experiment_id
  AND e.variant_id = p.variant_id
ORDER BY day DESC, experiment_id, variant_id;
