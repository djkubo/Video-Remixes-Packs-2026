import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PIXEL_ID = "592329516660534";
const API_VERSION = "v18.0";

// Hash function for user data (required by Facebook)
async function hashData(data: string): Promise<string> {
  if (!data) return "";
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
    
    if (!accessToken) {
      console.error("FACEBOOK_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Facebook access token not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const {
      event_name,
      event_id,
      event_time,
      event_source_url,
      action_source = "website",
      user_data = {},
      custom_data = {}
    } = body;

    console.log(`Processing Facebook CAPI event: ${event_name}`);

    // Hash user data for privacy
    const hashedUserData: Record<string, string> = {};
    
    if (user_data.email) {
      hashedUserData.em = await hashData(user_data.email);
    }
    if (user_data.phone) {
      hashedUserData.ph = await hashData(user_data.phone);
    }
    if (user_data.first_name) {
      hashedUserData.fn = await hashData(user_data.first_name);
    }
    if (user_data.last_name) {
      hashedUserData.ln = await hashData(user_data.last_name);
    }
    if (user_data.city) {
      hashedUserData.ct = await hashData(user_data.city);
    }
    if (user_data.state) {
      hashedUserData.st = await hashData(user_data.state);
    }
    if (user_data.zip) {
      hashedUserData.zp = await hashData(user_data.zip);
    }
    if (user_data.country) {
      hashedUserData.country = await hashData(user_data.country);
    }
    if (user_data.external_id) {
      hashedUserData.external_id = await hashData(user_data.external_id);
    }
    
    // Pass through non-hashed data
    if (user_data.client_ip_address) {
      hashedUserData.client_ip_address = user_data.client_ip_address;
    }
    if (user_data.client_user_agent) {
      hashedUserData.client_user_agent = user_data.client_user_agent;
    }
    if (user_data.fbc) {
      hashedUserData.fbc = user_data.fbc;
    }
    if (user_data.fbp) {
      hashedUserData.fbp = user_data.fbp;
    }

    // Build the event payload
    const eventPayload = {
      data: [
        {
          event_name,
          event_time: event_time || Math.floor(Date.now() / 1000),
          event_id,
          event_source_url,
          action_source,
          user_data: hashedUserData,
          custom_data
        }
      ]
    };

    console.log("Sending to Facebook CAPI:", JSON.stringify(eventPayload, null, 2));

    // Send to Facebook Conversions API
    const fbResponse = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      }
    );

    const fbResult = await fbResponse.json();
    
    if (!fbResponse.ok) {
      console.error("Facebook CAPI error:", fbResult);
      return new Response(
        JSON.stringify({ error: "Facebook API error", details: fbResult }),
        { status: fbResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Facebook CAPI success:", fbResult);

    return new Response(
      JSON.stringify({ success: true, result: fbResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in facebook-capi function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
