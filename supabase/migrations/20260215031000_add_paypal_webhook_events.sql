-- PayPal webhook events table (idempotency + observability)
-- Used by supabase/functions/paypal-webhook

CREATE TABLE IF NOT EXISTS public.paypal_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paypal_event_id text NOT NULL,
  event_type text NOT NULL,
  order_id text,
  payload jsonb NOT NULL DEFAULT '{}',
  headers jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'received',
  lead_id uuid REFERENCES public.leads(id),
  processing_error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS paypal_webhook_events_event_id_idx
  ON public.paypal_webhook_events (paypal_event_id);

CREATE INDEX IF NOT EXISTS paypal_webhook_events_order_id_idx
  ON public.paypal_webhook_events (order_id);

CREATE INDEX IF NOT EXISTS paypal_webhook_events_status_idx
  ON public.paypal_webhook_events (status);

ALTER TABLE public.paypal_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view paypal webhook events"
  ON public.paypal_webhook_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

