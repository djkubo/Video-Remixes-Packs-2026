-- Función RPC: get_analytics_summary
-- Devuelve estadísticas agregadas sin descargar todos los registros
CREATE OR REPLACE FUNCTION public.get_analytics_summary(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verificar que el usuario es admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_visitors', (
      SELECT COUNT(DISTINCT visitor_id)
      FROM analytics_events
      WHERE created_at >= p_start_date AND created_at <= p_end_date
    ),
    'total_sessions', (
      SELECT COUNT(DISTINCT session_id)
      FROM analytics_events
      WHERE created_at >= p_start_date AND created_at <= p_end_date
    ),
    'total_page_views', (
      SELECT COUNT(*)
      FROM analytics_events
      WHERE event_name = 'page_view'
        AND created_at >= p_start_date AND created_at <= p_end_date
    ),
    'total_clicks', (
      SELECT COUNT(*)
      FROM analytics_events
      WHERE event_name = 'click'
        AND created_at >= p_start_date AND created_at <= p_end_date
    ),
    'avg_time_on_page', COALESCE((
      SELECT AVG((event_data->>'seconds')::NUMERIC)
      FROM analytics_events
      WHERE event_name = 'time_on_page'
        AND event_data->>'seconds' IS NOT NULL
        AND created_at >= p_start_date AND created_at <= p_end_date
    ), 0),
    'avg_scroll_depth', COALESCE((
      SELECT AVG((event_data->>'percent')::NUMERIC)
      FROM analytics_events
      WHERE event_name = 'scroll_depth'
        AND event_data->>'percent' IS NOT NULL
        AND created_at >= p_start_date AND created_at <= p_end_date
    ), 0)
  ) INTO result;

  RETURN result;
END;
$$;

-- Función RPC: get_daily_trends
-- Devuelve datos agregados por día para gráficos
CREATE OR REPLACE FUNCTION public.get_daily_trends(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  date TEXT,
  visitors BIGINT,
  page_views BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario es admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    TO_CHAR(ae.created_at::DATE, 'MM/DD') as date,
    COUNT(DISTINCT ae.visitor_id) as visitors,
    COUNT(*) FILTER (WHERE ae.event_name = 'page_view') as page_views
  FROM analytics_events ae
  WHERE ae.created_at >= p_start_date AND ae.created_at <= p_end_date
  GROUP BY ae.created_at::DATE
  ORDER BY ae.created_at::DATE;
END;
$$;

-- Función RPC: get_event_breakdown
-- Devuelve conteo de eventos por tipo
CREATE OR REPLACE FUNCTION public.get_event_breakdown(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  name TEXT,
  value BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    ae.event_name as name,
    COUNT(*) as value
  FROM analytics_events ae
  WHERE ae.created_at >= p_start_date AND ae.created_at <= p_end_date
  GROUP BY ae.event_name
  ORDER BY value DESC
  LIMIT 10;
END;
$$;

-- Función RPC: get_country_breakdown
-- Devuelve visitantes únicos por país
CREATE OR REPLACE FUNCTION public.get_country_breakdown(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  name TEXT,
  value BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(ae.country_code, 'XX') as name,
    COUNT(DISTINCT ae.visitor_id) as value
  FROM analytics_events ae
  WHERE ae.created_at >= p_start_date AND ae.created_at <= p_end_date
  GROUP BY ae.country_code
  ORDER BY value DESC
  LIMIT 6;
END;
$$;

-- Función RPC: get_source_breakdown
-- Devuelve visitantes por fuente/medio/campaña
CREATE OR REPLACE FUNCTION public.get_source_breakdown(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'sources', (
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
      FROM (
        SELECT 
          COALESCE(utm_source, 'direct') as name,
          COUNT(DISTINCT visitor_id) as value
        FROM analytics_events
        WHERE created_at >= p_start_date AND created_at <= p_end_date
        GROUP BY utm_source
        ORDER BY value DESC
        LIMIT 10
      ) s
    ),
    'mediums', (
      SELECT COALESCE(json_agg(row_to_json(m)), '[]'::json)
      FROM (
        SELECT 
          COALESCE(utm_medium, 'none') as name,
          COUNT(DISTINCT visitor_id) as value
        FROM analytics_events
        WHERE created_at >= p_start_date AND created_at <= p_end_date
        GROUP BY utm_medium
        ORDER BY value DESC
        LIMIT 10
      ) m
    ),
    'campaigns', (
      SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json)
      FROM (
        SELECT 
          utm_campaign as name,
          COUNT(DISTINCT visitor_id) as value
        FROM analytics_events
        WHERE created_at >= p_start_date AND created_at <= p_end_date
          AND utm_campaign IS NOT NULL
        GROUP BY utm_campaign
        ORDER BY value DESC
        LIMIT 10
      ) c
    )
  ) INTO result;

  RETURN result;
END;
$$;