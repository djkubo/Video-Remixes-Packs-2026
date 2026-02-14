-- Explicit consent flags (compliance / deliverability)
-- Separate transactional/support vs promotional marketing consent.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS consent_transactional BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_transactional_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_marketing_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_consent_transactional ON public.leads(consent_transactional);
CREATE INDEX IF NOT EXISTS idx_leads_consent_marketing ON public.leads(consent_marketing);

