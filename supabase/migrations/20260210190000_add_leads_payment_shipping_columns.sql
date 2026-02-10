-- Add optional payment + shipping fulfillment fields to leads.
-- Edge Functions update these fields using the Service Role key.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipping_to JSONB,
  ADD COLUMN IF NOT EXISTS shipping_label_url TEXT,
  ADD COLUMN IF NOT EXISTS shipping_tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipping_carrier TEXT,
  ADD COLUMN IF NOT EXISTS shipping_servicelevel TEXT,
  ADD COLUMN IF NOT EXISTS shipping_status TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_payment_provider ON public.leads(payment_provider);
CREATE INDEX IF NOT EXISTS idx_leads_paid_at ON public.leads(paid_at);
CREATE INDEX IF NOT EXISTS idx_leads_shipping_status ON public.leads(shipping_status);

