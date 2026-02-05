import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// STRICT INPUT VALIDATION SCHEMA
// ============================================

// E.164 international phone format regex (with or without +)
// Allows: +1234567890, 1234567890, +52 55 1234 5678
const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

// Country code regex (E.164 format)
const COUNTRY_CODE_REGEX = /^\+?[1-9]\d{0,3}$/;

const LeadSchema = z.object({
  id: z.string().uuid({ message: "Invalid UUID format for lead ID" }),
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .transform(s => s.trim())
    .refine(s => s.length >= 1, "Name cannot be empty after trimming"),
  email: z.string()
    .email("Invalid email format")
    .max(255, "Email too long")
    .transform(s => s.toLowerCase().trim()),
  phone: z.string()
    .min(7, "Phone number too short")
    .max(20, "Phone number too long")
    .transform(s => s.replace(/[\s\-\(\)\.]/g, '')) // Remove common separators
    .refine(
      s => PHONE_REGEX.test(s),
      "Invalid phone format. Expected international format (e.g., +521234567890)"
    ),
  country_code: z.string()
    .max(5, "Country code too long")
    .nullable()
    .transform(s => s?.replace(/[\s\-]/g, '') || null)
    .refine(
      s => s === null || COUNTRY_CODE_REGEX.test(s),
      "Invalid country code format (e.g., +52, +1)"
    ),
  country_name: z.string().max(100).nullable(),
  source: z.string().max(50).nullable(),
  tags: z.array(
    z.string()
      .max(50)
      .transform(s => s.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_'))
  ).max(20).nullable(),
});

type LeadData = z.infer<typeof LeadSchema>;

// ============================================
// MANYCHAT API CALL WITH TIMEOUT & ERROR HANDLING
// ============================================

interface ManyChatResponse {
  status: 'success' | 'error';
  data?: { id?: number | string; [key: string]: unknown };
  message?: string;
}

const MANYCHAT_TIMEOUT_MS = 10000; // 10 seconds timeout

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

    // Check for HTTP-level errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[ManyChat] HTTP ${response.status} for ${operationName}: ${errorText}`);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
      };
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
      
      // Network errors, DNS failures, etc.
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

  // ============================================
  // STEP 1: VERIFY ENVIRONMENT VARIABLES
  // ============================================
  const MANYCHAT_API_KEY = Deno.env.get('MANYCHAT_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!MANYCHAT_API_KEY) {
    console.error('[FATAL] MANYCHAT_API_KEY is not configured in environment');
    return new Response(
      JSON.stringify({ 
        error: 'Server configuration error',
        code: 'MISSING_API_KEY',
        message: 'ManyChat API key is not configured. Please contact administrator.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[FATAL] Supabase credentials not configured');
    return new Response(
      JSON.stringify({ 
        error: 'Server configuration error',
        code: 'MISSING_SUPABASE_CREDS',
        message: 'Database credentials not configured. Please contact administrator.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // ============================================
    // STEP 2: PARSE AND VALIDATE REQUEST BODY
    // ============================================
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      console.error('[Validation] Invalid JSON body received');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body', code: 'INVALID_JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body || typeof body !== 'object' || !('lead' in body)) {
      console.error('[Validation] Missing lead object in request body');
      return new Response(
        JSON.stringify({ error: 'Missing lead data in request body', code: 'MISSING_LEAD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate lead data with strict Zod schema
    const parseResult = LeadSchema.safeParse((body as { lead: unknown }).lead);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      console.error('[Validation] Lead data validation failed:', errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid lead data', 
          code: 'VALIDATION_ERROR',
          details: errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lead: LeadData = parseResult.data;
    console.log('[Lead] Processing:', { id: lead.id, email: lead.email, phone: lead.phone.substring(0, 5) + '***' });

    // ============================================
    // STEP 3: VERIFY LEAD EXISTS IN DATABASE
    // ============================================
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: dbLead, error: leadError } = await supabase
      .from('leads')
      .select('id, email')
      .eq('id', lead.id)
      .single();

    if (leadError || !dbLead) {
      console.error('[Security] Lead not found in database:', lead.id);
      return new Response(
        JSON.stringify({ error: 'Lead not found', code: 'LEAD_NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify email matches (prevents data tampering)
    if (dbLead.email.toLowerCase() !== lead.email.toLowerCase()) {
      console.error('[Security] Email mismatch for lead:', lead.id);
      return new Response(
        JSON.stringify({ error: 'Lead data mismatch', code: 'DATA_MISMATCH' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // STEP 4: PREPARE PHONE NUMBER
    // ============================================
    // Remove any leading zeros and ensure proper format
    let cleanPhone = lead.phone.replace(/^0+/, '');
    
    // If country code is provided and phone doesn't start with +, prepend it
    if (lead.country_code && !cleanPhone.startsWith('+')) {
      const code = lead.country_code.startsWith('+') ? lead.country_code : `+${lead.country_code}`;
      cleanPhone = `${code}${cleanPhone}`;
    }
    
    // Ensure phone starts with +
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }

    console.log('[Phone] Formatted:', cleanPhone.substring(0, 6) + '***');

    // ============================================
    // STEP 5: CREATE SUBSCRIBER IN MANYCHAT
    // ============================================
    const nameParts = lead.name.trim().split(' ');
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
        consent_phrase: "Opted in via website exit intent popup for free demos",
      },
      'createSubscriber'
    );

    let subscriberId: string | null = null;
    const manychatErrors: string[] = [];

    if (createResult.success && createResult.data?.data?.id) {
      subscriberId = String(createResult.data.data.id);
      console.log('[ManyChat] Subscriber created:', subscriberId);

      // ============================================
      // STEP 6: SET CUSTOM FIELDS (with error isolation)
      // ============================================
      const customFields = [
        { field_name: 'country', field_value: lead.country_name || 'Unknown' },
        { field_name: 'lead_source', field_value: lead.source || 'exit_intent' },
        { field_name: 'phone_country_code', field_value: lead.country_code || '' },
        { field_name: 'full_name', field_value: lead.name },
        { field_name: 'signup_date', field_value: new Date().toISOString().split('T')[0] },
      ];

      for (const field of customFields) {
        const fieldResult = await callManyChatAPI(
          'subscriber/setCustomField',
          MANYCHAT_API_KEY,
          {
            subscriber_id: subscriberId,
            field_name: field.field_name,
            field_value: field.field_value,
          },
          `setCustomField:${field.field_name}`
        );
        
        if (!fieldResult.success) {
          manychatErrors.push(`Field ${field.field_name}: ${fieldResult.error}`);
        }
      }

      // ============================================
      // STEP 7: ADD TAGS (with error isolation)
      // ============================================
      const defaultTags = ['exit_intent', 'demo_request', 'website_lead', 'dj_prospect', 'free_demos'];
      const allTags = [...new Set([...defaultTags, ...(lead.tags || [])])]; // Deduplicate

      for (const tag of allTags) {
        const tagResult = await callManyChatAPI(
          'subscriber/addTag',
          MANYCHAT_API_KEY,
          {
            subscriber_id: subscriberId,
            tag_name: tag,
          },
          `addTag:${tag}`
        );
        
        if (!tagResult.success) {
          manychatErrors.push(`Tag ${tag}: ${tagResult.error}`);
        }
      }

      // ============================================
      // STEP 8: SET OPT-IN STATUS (with error isolation)
      // ============================================
      const smsResult = await callManyChatAPI(
        'subscriber/setSmsOptIn',
        MANYCHAT_API_KEY,
        {
          subscriber_id: subscriberId,
          sms_opt_in: true,
          sms_phone: cleanPhone,
        },
        'setSmsOptIn'
      );
      
      if (!smsResult.success) {
        manychatErrors.push(`SMS opt-in: ${smsResult.error}`);
      }

      const emailResult = await callManyChatAPI(
        'subscriber/setEmailOptIn',
        MANYCHAT_API_KEY,
        {
          subscriber_id: subscriberId,
          email_opt_in: true,
          email: lead.email,
        },
        'setEmailOptIn'
      );
      
      if (!emailResult.success) {
        manychatErrors.push(`Email opt-in: ${emailResult.error}`);
      }

    } else {
      // Subscriber creation failed - try to find existing
      console.warn('[ManyChat] Create failed, searching for existing subscriber...');
      
      if (createResult.error) {
        manychatErrors.push(`Create: ${createResult.error}`);
      }

      const findResult = await callManyChatAPI(
        'subscriber/findBySystemField',
        MANYCHAT_API_KEY,
        { phone: cleanPhone },
        'findBySystemField'
      );

      if (findResult.success && findResult.data?.data?.id) {
        subscriberId = String(findResult.data.data.id);
        console.log('[ManyChat] Found existing subscriber:', subscriberId);
      } else {
        console.error('[ManyChat] Could not create or find subscriber');
        if (findResult.error) {
          manychatErrors.push(`Find: ${findResult.error}`);
        }
      }
    }

    // ============================================
    // STEP 9: UPDATE LEAD IN DATABASE
    // ============================================
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        manychat_synced: subscriberId !== null,
        manychat_subscriber_id: subscriberId,
      })
      .eq('id', lead.id);

    if (updateError) {
      console.error('[Database] Failed to update lead sync status:', updateError);
    }

    // ============================================
    // STEP 10: RETURN RESPONSE
    // ============================================
    const response = {
      success: subscriberId !== null,
      manychat_subscriber_id: subscriberId,
      synced: subscriberId !== null,
      ...(manychatErrors.length > 0 && { warnings: manychatErrors }),
    };

    console.log('[Complete] Response:', { 
      success: response.success, 
      subscriberId: subscriberId?.substring(0, 8) + '...', 
      warningCount: manychatErrors.length 
    });

    return new Response(
      JSON.stringify(response),
      { 
        status: subscriberId ? 200 : 207, // 207 Multi-Status if partial failure
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    // Catch-all for unexpected errors
    console.error('[FATAL] Unexpected error in sync-manychat:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full stack for debugging
    if (errorStack) {
      console.error('[FATAL] Stack trace:', errorStack);
    }

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
