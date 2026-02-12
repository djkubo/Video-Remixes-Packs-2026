-- Fix outbound_email_queue email validation regex and make email queueing fail-open.
-- This prevents order lead insertion from failing due to email queue issues.

-- 1) Fix email_to check constraint (previous pattern had extra backslashes).
ALTER TABLE IF EXISTS public.outbound_email_queue
  DROP CONSTRAINT IF EXISTS outbound_email_queue_email_to_check;

ALTER TABLE IF EXISTS public.outbound_email_queue
  ADD CONSTRAINT outbound_email_queue_email_to_check
  CHECK (email_to ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$');

-- 2) Make queue_email_for_lead fail-open (never break checkout/lead flow).
CREATE OR REPLACE FUNCTION public.queue_email_for_lead(
  p_lead_id uuid,
  p_template_key text,
  p_subject text,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_lang text DEFAULT 'es',
  p_dedupe_key text DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_job_id uuid;
  v_lang text;
  v_dedupe text;
BEGIN
  SELECT l.email INTO v_email
  FROM public.leads l
  WHERE l.id = p_lead_id;

  -- Fail-open: do not raise.
  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  v_lang := CASE WHEN lower(coalesce(p_lang, 'es')) = 'en' THEN 'en' ELSE 'es' END;
  v_dedupe := coalesce(
    p_dedupe_key,
    format('lead:%s:%s', p_lead_id::text, p_template_key)
  );

  BEGIN
    INSERT INTO public.outbound_email_queue (
      lead_id, email_to, template_key, template_lang, subject, payload, dedupe_key
    )
    VALUES (
      p_lead_id,
      lower(trim(v_email)),
      p_template_key,
      v_lang,
      p_subject,
      coalesce(p_payload, '{}'::jsonb),
      v_dedupe
    )
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING id INTO v_job_id;

    IF v_job_id IS NULL THEN
      SELECT q.id INTO v_job_id
      FROM public.outbound_email_queue q
      WHERE q.dedupe_key = v_dedupe;
    END IF;
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;

  RETURN v_job_id;
END;
$$;
