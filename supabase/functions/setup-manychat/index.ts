import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManyChatResponse {
  status: string;
  data?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication: Require admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.user.id;

    // Check if user is admin
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (adminError || !adminData) {
      console.error('User is not admin:', userId);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin authenticated:', userId);

    const MANYCHAT_API_KEY = Deno.env.get('MANYCHAT_API_KEY');

    if (!MANYCHAT_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'MANYCHAT_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: Record<string, unknown> = {
      customFields: [],
      tags: [],
      errors: [],
    };

    // Create custom fields
    const customFields = [
      { name: 'country', type: 'text', description: 'País del lead' },
      { name: 'lead_source', type: 'text', description: 'Fuente del lead' },
      { name: 'phone_country_code', type: 'text', description: 'Código de país' },
      { name: 'full_name', type: 'text', description: 'Nombre completo' },
      { name: 'signup_date', type: 'date', description: 'Fecha de registro' },
    ];

    console.log('Creating custom fields...');

    for (const field of customFields) {
      try {
        const response = await fetch('https://api.manychat.com/fb/page/createCustomField', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            caption: field.name,
            type: field.type,
            description: field.description,
          }),
        });

        const data: ManyChatResponse = await response.json();
        console.log(`Field "${field.name}":`, data.status);

        (results.customFields as unknown[]).push({ 
          name: field.name, 
          status: data.status === 'success' ? 'created' : 'exists_or_error' 
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error creating field "${field.name}":`, errorMessage);
        (results.errors as unknown[]).push({ type: 'custom_field', name: field.name, error: errorMessage });
      }
    }

    // Create tags
    const tags = [
      'exit_intent',
      'demo_request',
      'website_lead',
      'dj_prospect',
      'free_demos',
      'gratis',
      'whatsapp_group',
    ];

    console.log('Creating tags...');

    for (const tagName of tags) {
      try {
        const response = await fetch('https://api.manychat.com/fb/page/createTag', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: tagName }),
        });

        const data: ManyChatResponse = await response.json();
        console.log(`Tag "${tagName}":`, data.status);

        (results.tags as unknown[]).push({ 
          name: tagName, 
          status: data.status === 'success' ? 'created' : 'exists_or_error' 
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error creating tag "${tagName}":`, errorMessage);
        (results.errors as unknown[]).push({ type: 'tag', name: tagName, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'ManyChat setup completed',
        customFieldsCreated: (results.customFields as Array<{ status?: string }>).filter((f) => f.status === 'created').length,
        tagsCreated: (results.tags as Array<{ status?: string }>).filter((t) => t.status === 'created').length,
        errors: (results.errors as unknown[]).length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in setup-manychat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
