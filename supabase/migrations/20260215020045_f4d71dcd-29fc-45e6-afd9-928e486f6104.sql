
-- 1. Add consent columns to leads (if not exist)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS consent_transactional boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_transactional_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_marketing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_marketing_at timestamptz;

-- 2. Create shippo_webhook_events table
CREATE TABLE IF NOT EXISTS public.shippo_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shippo_event text NOT NULL DEFAULT 'unknown',
  tracking_number text,
  event_fingerprint text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  headers jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'received',
  lead_id uuid REFERENCES public.leads(id),
  processing_error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS shippo_webhook_events_fingerprint_idx
  ON public.shippo_webhook_events (event_fingerprint);

-- Index for lookups
CREATE INDEX IF NOT EXISTS shippo_webhook_events_tracking_idx
  ON public.shippo_webhook_events (tracking_number);

CREATE INDEX IF NOT EXISTS shippo_webhook_events_status_idx
  ON public.shippo_webhook_events (status);

-- Enable RLS
ALTER TABLE public.shippo_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook events
CREATE POLICY "Admins can view shippo webhook events"
  ON public.shippo_webhook_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role (edge functions) can insert/update via service_role key (bypasses RLS)
-- No public insert/update/delete policies needed

-- 3. Create stripe_webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'received',
  lead_id uuid REFERENCES public.leads(id),
  processing_error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS stripe_webhook_events_event_id_idx
  ON public.stripe_webhook_events (stripe_event_id);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stripe webhook events"
  ON public.stripe_webhook_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
