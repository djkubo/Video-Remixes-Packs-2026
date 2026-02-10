import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// STRICT INPUT VALIDATION
// ============================================

// Accepts user-provided "input" phone formats after basic cleanup (digits, optional +),
// then we later normalize to strict E.164 before calling ManyChat.
const PHONE_INPUT_REGEX = /^\+?\d{7,20}$/;
const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const COUNTRY_CODE_REGEX = /^\+?[1-9]\d{0,3}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface LeadData {
  id: string;
  name: string;
  email: string;
  phone: string;
  country_code: string | null;
  country_name: string | null;
  source: string | null;
  tags: string[] | null;
}

interface ValidationError {
  field: string;
  message: string;
}

function validateLead(data: unknown): { valid: true; data: LeadData } | { valid: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: [{ field: 'lead', message: 'Lead data must be an object' }] };
  }

  const lead = data as Record<string, unknown>;

  if (typeof lead.id !== 'string' || !UUID_REGEX.test(lead.id)) {
    errors.push({ field: 'id', message: 'Invalid UUID format' });
  }

  if (typeof lead.name !== 'string' || lead.name.trim().length < 1 || lead.name.length > 100) {
    errors.push({ field: 'name', message: 'Name is required (1-100 characters)' });
  }

  if (typeof lead.email !== 'string' || !EMAIL_REGEX.test(lead.email) || lead.email.length > 255) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  const cleanPhone = typeof lead.phone === 'string'
    ? lead.phone.replace(/[\s().-]/g, '')
    : '';
  const phoneDigits = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone;
  if (!PHONE_INPUT_REGEX.test(cleanPhone) || !/[1-9]/.test(phoneDigits)) {
    errors.push({ field: 'phone', message: 'Invalid phone format' });
  }

  const countryCode = lead.country_code;
  if (countryCode !== null && countryCode !== undefined) {
    const cleanCode = typeof countryCode === 'string' ? countryCode.replace(/[\s-]/g, '') : '';
    if (cleanCode && !COUNTRY_CODE_REGEX.test(cleanCode)) {
      errors.push({ field: 'country_code', message: 'Invalid country code format' });
    }
  }

  if (lead.country_name !== null && lead.country_name !== undefined) {
    if (typeof lead.country_name !== 'string' || lead.country_name.length > 100) {
      errors.push({ field: 'country_name', message: 'Country name too long' });
    }
  }

  if (lead.source !== null && lead.source !== undefined) {
    if (typeof lead.source !== 'string' || lead.source.length > 50) {
      errors.push({ field: 'source', message: 'Source too long' });
    }
  }

  if (lead.tags !== null && lead.tags !== undefined) {
    if (!Array.isArray(lead.tags) || lead.tags.length > 20) {
      errors.push({ field: 'tags', message: 'Tags must be an array (max 20)' });
    } else if (lead.tags.some(t => typeof t !== 'string' || t.length > 50)) {
      errors.push({ field: 'tags', message: 'Each tag must be a string (max 50 chars)' });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      id: lead.id as string,
      name: (lead.name as string).trim(),
      email: (lead.email as string).toLowerCase().trim(),
      phone: cleanPhone,
      country_code: typeof lead.country_code === 'string' ? lead.country_code.replace(/[\s-]/g, '') : null,
      country_name: typeof lead.country_name === 'string' ? lead.country_name : null,
      source: typeof lead.source === 'string' ? lead.source : null,
      tags: Array.isArray(lead.tags) ? lead.tags.map(t => String(t).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')) : null,
    }
  };
}

function formatPhoneToE164(phone: string, countryCode: string | null): string | null {
  const cleaned = phone.replace(/[\s().-]/g, '');
  const hasPlus = cleaned.startsWith('+');

  const digits = hasPlus ? cleaned.slice(1) : cleaned;
  const digitsNoLeadingZeros = digits.replace(/^0+/, '');

  if (!digitsNoLeadingZeros || !/^\d{7,20}$/.test(digitsNoLeadingZeros) || !/[1-9]/.test(digitsNoLeadingZeros)) {
    return null;
  }

  let fullDigits = digitsNoLeadingZeros;

  if (!hasPlus && countryCode) {
    const cc = countryCode.replace(/[\s-]/g, '');
    const ccDigits = cc.startsWith('+') ? cc.slice(1) : cc;
    if (ccDigits) {
      fullDigits = `${ccDigits}${digitsNoLeadingZeros}`;
    }
  }

  const e164 = `+${fullDigits}`;
  return E164_PHONE_REGEX.test(e164) ? e164 : null;
}

// ============================================
// MANYCHAT API CALL WITH TIMEOUT (sanitized logging)
// ============================================

const MANYCHAT_TIMEOUT_MS = 10000;

async function callManyChatAPI(
  endpoint: string,
  apiKey: string,
  body: Record<string, unknown>,
  operationName: string
): Promise<{ success: boolean; subscriberId?: string; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MANYCHAT_TIMEOUT_MS);

  try {
    // Sanitized log - no sensitive data
    console.log(`[ManyChat] Starting ${operationName}`);
    
    const response = await fetch(`https://api.manychat.com/fb/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Don't log detailed error response
      console.error(`[ManyChat] ${operationName} failed with status ${response.status}`);
      return { success: false, error: 'API request failed' };
    }

    const data = await response.json();
    
    if (data.status === 'success') {
      // Only log success status, not full response
      console.log(`[ManyChat] ${operationName} completed successfully`);
      return { 
        success: true, 
        subscriberId: data.data?.id ? String(data.data.id) : undefined 
      };
    } else {
      console.error(`[ManyChat] ${operationName} returned error status`);
      return { success: false, error: 'API returned error' };
    }

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[ManyChat] ${operationName} timed out`);
      return { success: false, error: 'Request timed out' };
    }

    console.error(`[ManyChat] ${operationName} failed`);
    return { success: false, error: 'Request failed' };
  }
}

// ============================================
// MAIN HANDLER (PUBLIC)
// ============================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Simple health-check to make it easy to validate deployment (especially from a browser).
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ ok: true, function: 'sync-manychat' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const MANYCHAT_API_KEY = Deno.env.get('MANYCHAT_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!MANYCHAT_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Config] Missing required environment variables');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body || typeof body !== 'object' || !('leadId' in body)) {
      return new Response(
        JSON.stringify({ error: 'Missing leadId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const leadId = (body as Record<string, unknown>).leadId;
    if (typeof leadId !== 'string' || !UUID_REGEX.test(leadId)) {
      console.error('[Validation] leadId validation failed');
      return new Response(
        JSON.stringify({ error: 'Invalid leadId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify lead exists in database (and use DB values as source of truth).
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: dbLead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('id, name, email, phone, country_code, country_name, source, tags, manychat_synced, manychat_subscriber_id')
      .eq('id', leadId)
      .single();

    if (leadError || !dbLead) {
      console.error('[Security] Lead not found');
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency: if already synced, don't call ManyChat again.
    if (dbLead.manychat_synced && dbLead.manychat_subscriber_id) {
      return new Response(
        JSON.stringify({ success: true, synced: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate lead data from DB
    const leadValidation = validateLead(dbLead);
    if (!leadValidation.valid) {
      console.error('[Validation] Lead data validation failed');
      return new Response(
        JSON.stringify({ error: 'Invalid lead data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lead = leadValidation.data;
    console.log('[Lead] Processing lead', lead.id);

    // Normalize phone to E.164
    const e164Phone = formatPhoneToE164(lead.phone, lead.country_code);
    if (!e164Phone) {
      console.error('[Validation] Phone normalization failed');
      return new Response(
        JSON.stringify({ error: 'Invalid phone format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create subscriber in ManyChat
    const nameParts = lead.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const createResult = await callManyChatAPI(
      'subscriber/createSubscriber',
      MANYCHAT_API_KEY,
      {
        first_name: firstName,
        last_name: lastName,
        phone: e164Phone,
        whatsapp_phone: e164Phone,
        email: lead.email,
        has_opt_in_sms: true,
        has_opt_in_email: true,
        consent_phrase: "Opted in via website",
      },
      'createSubscriber'
    );

    let subscriberId: string | null = createResult.subscriberId || null;

    if (createResult.success && subscriberId) {
      console.log('[ManyChat] Subscriber created');

      // Set custom fields (don't log field values)
      const customFields = [
        { field_name: 'country', field_value: lead.country_name || 'Unknown' },
        { field_name: 'lead_source', field_value: lead.source || 'exit_intent' },
        { field_name: 'phone_country_code', field_value: lead.country_code || '' },
        { field_name: 'full_name', field_value: lead.name },
        { field_name: 'signup_date', field_value: new Date().toISOString().split('T')[0] },
      ];

      for (const field of customFields) {
        await callManyChatAPI(
          'subscriber/setCustomField',
          MANYCHAT_API_KEY,
          { subscriber_id: subscriberId, ...field },
          'setCustomField'
        );
      }

      // Add tags
      // Keep tagging source-driven and avoid hard-coding exit-intent tags for all leads.
      const baseTags = ['website_lead'];
      const allTags = [...new Set([...baseTags, ...(lead.tags || [])])];
      for (const tag of allTags) {
        await callManyChatAPI(
          'subscriber/addTag',
          MANYCHAT_API_KEY,
          { subscriber_id: subscriberId, tag_name: tag },
          'addTag'
        );
      }

    } else {
      // Try to find existing subscriber
      const findResult = await callManyChatAPI(
        'subscriber/findBySystemField',
        MANYCHAT_API_KEY,
        { phone: e164Phone },
        'findBySystemField'
      );

      if (findResult.success && findResult.subscriberId) {
        subscriberId = findResult.subscriberId;
        console.log('[ManyChat] Found existing subscriber');
      }
    }

    // Update lead in database
    await supabaseAdmin
      .from('leads')
      .update({
        manychat_synced: subscriberId !== null,
        manychat_subscriber_id: subscriberId,
      })
      .eq('id', lead.id);

    return new Response(
      JSON.stringify({
        success: subscriberId !== null,
        synced: subscriberId !== null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Error] Unexpected error occurred');
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
