import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// STRICT INPUT VALIDATION (inline, no external Zod)
// ============================================

// E.164 international phone format regex
const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;
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

  // Validate ID (required, UUID)
  if (typeof lead.id !== 'string' || !UUID_REGEX.test(lead.id)) {
    errors.push({ field: 'id', message: 'Invalid UUID format' });
  }

  // Validate name (required, 1-100 chars)
  if (typeof lead.name !== 'string' || lead.name.trim().length < 1 || lead.name.length > 100) {
    errors.push({ field: 'name', message: 'Name is required (1-100 characters)' });
  }

  // Validate email (required, valid format)
  if (typeof lead.email !== 'string' || !EMAIL_REGEX.test(lead.email) || lead.email.length > 255) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Validate phone (required, international format)
  const cleanPhone = typeof lead.phone === 'string' 
    ? lead.phone.replace(/[\s\-\(\)\.]/g, '') 
    : '';
  if (cleanPhone.length < 7 || cleanPhone.length > 20 || !PHONE_REGEX.test(cleanPhone)) {
    errors.push({ field: 'phone', message: 'Invalid phone format. Expected international format (e.g., +521234567890)' });
  }

  // Validate country_code (optional)
  const countryCode = lead.country_code;
  if (countryCode !== null && countryCode !== undefined) {
    const cleanCode = typeof countryCode === 'string' ? countryCode.replace(/[\s\-]/g, '') : '';
    if (cleanCode && !COUNTRY_CODE_REGEX.test(cleanCode)) {
      errors.push({ field: 'country_code', message: 'Invalid country code format' });
    }
  }

  // Validate country_name (optional, max 100)
  if (lead.country_name !== null && lead.country_name !== undefined) {
    if (typeof lead.country_name !== 'string' || lead.country_name.length > 100) {
      errors.push({ field: 'country_name', message: 'Country name too long' });
    }
  }

  // Validate source (optional, max 50)
  if (lead.source !== null && lead.source !== undefined) {
    if (typeof lead.source !== 'string' || lead.source.length > 50) {
      errors.push({ field: 'source', message: 'Source too long' });
    }
  }

  // Validate tags (optional array)
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
      country_code: typeof lead.country_code === 'string' ? lead.country_code.replace(/[\s\-]/g, '') : null,
      country_name: typeof lead.country_name === 'string' ? lead.country_name : null,
      source: typeof lead.source === 'string' ? lead.source : null,
      tags: Array.isArray(lead.tags) ? lead.tags.map(t => String(t).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')) : null,
    }
  };
}

// ============================================
// MANYCHAT API CALL WITH TIMEOUT
// ============================================

interface ManyChatResponse {
  status: 'success' | 'error';
  data?: { id?: number | string; [key: string]: unknown };
  message?: string;
}

const MANYCHAT_TIMEOUT_MS = 10000;

async function callManyChatAPI(
  endpoint: string,
  apiKey: string,
  body: Record<string, unknown>,
  operationName: string
): Promise<{ success: boolean; data?: ManyChatResponse; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MANYCHAT_TIMEOUT_MS);

  try {
    console.log(`[ManyChat] Calling ${operationName}...`);
    
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
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[ManyChat] HTTP ${response.status} for ${operationName}: ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText.substring(0, 200)}` };
    }

    const data: ManyChatResponse = await response.json();
    
    if (data.status === 'success') {
      console.log(`[ManyChat] ${operationName} succeeded`);
      return { success: true, data };
    } else {
      console.error(`[ManyChat] ${operationName} failed:`, data.message || 'Unknown error');
      return { success: false, data, error: data.message || 'API returned error status' };
    }

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`[ManyChat] ${operationName} timed out after ${MANYCHAT_TIMEOUT_MS}ms`);
        return { success: false, error: `Request timed out after ${MANYCHAT_TIMEOUT_MS}ms` };
      }
      console.error(`[ManyChat] ${operationName} network error:`, error.message);
      return { success: false, error: `Network error: ${error.message}` };
    }

    console.error(`[ManyChat] ${operationName} unknown error:`, error);
    return { success: false, error: 'Unknown error occurred' };
  }
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify environment variables
  const MANYCHAT_API_KEY = Deno.env.get('MANYCHAT_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!MANYCHAT_API_KEY) {
    console.error('[FATAL] MANYCHAT_API_KEY is not configured');
    return new Response(
      JSON.stringify({ error: 'Server configuration error', code: 'MISSING_API_KEY' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[FATAL] Supabase credentials not configured');
    return new Response(
      JSON.stringify({ error: 'Server configuration error', code: 'MISSING_SUPABASE_CREDS' }),
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
        JSON.stringify({ error: 'Invalid JSON body', code: 'INVALID_JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body || typeof body !== 'object' || !('lead' in body)) {
      return new Response(
        JSON.stringify({ error: 'Missing lead data', code: 'MISSING_LEAD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate lead data
    const validation = validateLead((body as { lead: unknown }).lead);
    if (!validation.valid) {
      console.error('[Validation] Lead data validation failed:', validation.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid lead data', code: 'VALIDATION_ERROR', details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lead = validation.data;
    console.log('[Lead] Processing:', { id: lead.id, email: lead.email });

    // Verify lead exists in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: dbLead, error: leadError } = await supabase
      .from('leads')
      .select('id, email')
      .eq('id', lead.id)
      .single();

    if (leadError || !dbLead) {
      console.error('[Security] Lead not found:', lead.id);
      return new Response(
        JSON.stringify({ error: 'Lead not found', code: 'LEAD_NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (dbLead.email.toLowerCase() !== lead.email.toLowerCase()) {
      console.error('[Security] Email mismatch for lead:', lead.id);
      return new Response(
        JSON.stringify({ error: 'Lead data mismatch', code: 'DATA_MISMATCH' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number
    let cleanPhone = lead.phone.replace(/^0+/, '');
    if (lead.country_code && !cleanPhone.startsWith('+')) {
      const code = lead.country_code.startsWith('+') ? lead.country_code : `+${lead.country_code}`;
      cleanPhone = `${code}${cleanPhone}`;
    }
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
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
        phone: cleanPhone,
        whatsapp_phone: cleanPhone,
        email: lead.email,
        has_opt_in_sms: true,
        has_opt_in_email: true,
        consent_phrase: "Opted in via website exit intent popup",
      },
      'createSubscriber'
    );

    let subscriberId: string | null = null;
    const warnings: string[] = [];

    if (createResult.success && createResult.data?.data?.id) {
      subscriberId = String(createResult.data.data.id);
      console.log('[ManyChat] Subscriber created:', subscriberId);

      // Set custom fields
      const customFields = [
        { field_name: 'country', field_value: lead.country_name || 'Unknown' },
        { field_name: 'lead_source', field_value: lead.source || 'exit_intent' },
        { field_name: 'phone_country_code', field_value: lead.country_code || '' },
        { field_name: 'full_name', field_value: lead.name },
        { field_name: 'signup_date', field_value: new Date().toISOString().split('T')[0] },
      ];

      for (const field of customFields) {
        const result = await callManyChatAPI(
          'subscriber/setCustomField',
          MANYCHAT_API_KEY,
          { subscriber_id: subscriberId, ...field },
          `setCustomField:${field.field_name}`
        );
        if (!result.success) warnings.push(`Field ${field.field_name}: ${result.error}`);
      }

      // Add tags
      const allTags = [...new Set(['exit_intent', 'demo_request', 'website_lead', ...(lead.tags || [])])];
      for (const tag of allTags) {
        const result = await callManyChatAPI(
          'subscriber/addTag',
          MANYCHAT_API_KEY,
          { subscriber_id: subscriberId, tag_name: tag },
          `addTag:${tag}`
        );
        if (!result.success) warnings.push(`Tag ${tag}: ${result.error}`);
      }

    } else {
      if (createResult.error) warnings.push(`Create: ${createResult.error}`);

      // Try to find existing subscriber
      const findResult = await callManyChatAPI(
        'subscriber/findBySystemField',
        MANYCHAT_API_KEY,
        { phone: cleanPhone },
        'findBySystemField'
      );

      if (findResult.success && findResult.data?.data?.id) {
        subscriberId = String(findResult.data.data.id);
        console.log('[ManyChat] Found existing subscriber:', subscriberId);
      }
    }

    // Update lead in database
    await supabase
      .from('leads')
      .update({
        manychat_synced: subscriberId !== null,
        manychat_subscriber_id: subscriberId,
      })
      .eq('id', lead.id);

    return new Response(
      JSON.stringify({
        success: subscriberId !== null,
        manychat_subscriber_id: subscriberId,
        synced: subscriberId !== null,
        ...(warnings.length > 0 && { warnings }),
      }),
      { status: subscriberId ? 200 : 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[FATAL] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
