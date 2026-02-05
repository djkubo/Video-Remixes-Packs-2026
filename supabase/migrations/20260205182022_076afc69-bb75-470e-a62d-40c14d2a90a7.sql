-- Fix overly permissive INSERT policies

-- 1. Drop and recreate leads INSERT policy with validation
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;

CREATE POLICY "Submit leads with valid data" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  -- Require valid name
  name IS NOT NULL 
  AND LENGTH(TRIM(name)) > 0 
  AND LENGTH(name) <= 100
  -- Require valid email format
  AND email IS NOT NULL 
  AND email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'
  AND LENGTH(email) <= 255
  -- Require valid phone
  AND phone IS NOT NULL 
  AND LENGTH(phone) >= 7 
  AND LENGTH(phone) <= 20
);

-- 2. Drop the old analytics_events policy (should already be dropped but ensure)
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;