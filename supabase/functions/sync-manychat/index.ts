import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

interface ManyChatSubscriber {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  custom_fields: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MANYCHAT_API_KEY = Deno.env.get('MANYCHAT_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!MANYCHAT_API_KEY) {
      console.error('MANYCHAT_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'ManyChat API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const lead: LeadData = body.lead;

    if (!lead) {
      return new Response(
        JSON.stringify({ error: 'Lead data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing lead for ManyChat:', lead.email);

    // Parse name into first and last name
    const nameParts = lead.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Format phone number with country code
    const fullPhone = lead.country_code 
      ? `${lead.country_code}${lead.phone.replace(/^0+/, '')}` 
      : lead.phone;

    // Create subscriber in ManyChat using their API
    // ManyChat API endpoint for creating/finding subscriber by phone
    const manychatResponse = await fetch('https://api.manychat.com/fb/subscriber/createSubscriber', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        phone: fullPhone,
        email: lead.email,
        has_opt_in_sms: true,
        has_opt_in_email: true,
        consent_phrase: "Website exit intent popup opt-in",
      }),
    });

    const manychatData = await manychatResponse.json();
    console.log('ManyChat response:', JSON.stringify(manychatData));

    let subscriberId: string | null = null;

    if (manychatData.status === 'success' && manychatData.data?.id) {
      subscriberId = manychatData.data.id;
      console.log('Subscriber created/found with ID:', subscriberId);

      // Add tags to the subscriber
      const defaultTags = ['exit_intent', 'website_lead'];
      const allTags = [...defaultTags, ...(lead.tags || [])];

      for (const tag of allTags) {
        try {
          await fetch('https://api.manychat.com/fb/subscriber/addTag', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subscriber_id: subscriberId,
              tag_name: tag,
            }),
          });
          console.log(`Tag "${tag}" added to subscriber`);
        } catch (tagError) {
          console.error(`Failed to add tag "${tag}":`, tagError);
        }
      }

      // Set custom fields if needed
      if (lead.country_name) {
        try {
          await fetch('https://api.manychat.com/fb/subscriber/setCustomField', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subscriber_id: subscriberId,
              field_name: 'country',
              field_value: lead.country_name,
            }),
          });
          console.log('Country custom field set');
        } catch (fieldError) {
          console.error('Failed to set country field:', fieldError);
        }
      }

      // Set source custom field
      try {
        await fetch('https://api.manychat.com/fb/subscriber/setCustomField', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriber_id: subscriberId,
            field_name: 'lead_source',
            field_value: lead.source || 'exit_intent',
          }),
        });
        console.log('Source custom field set');
      } catch (fieldError) {
        console.error('Failed to set source field:', fieldError);
      }
    } else {
      console.error('ManyChat API error:', manychatData);
    }

    // Update lead in database with ManyChat subscriber ID
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        manychat_synced: subscriberId !== null,
        manychat_subscriber_id: subscriberId,
      })
      .eq('id', lead.id);

    if (updateError) {
      console.error('Failed to update lead sync status:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        manychat_subscriber_id: subscriberId,
        synced: subscriberId !== null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-manychat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
