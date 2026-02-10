import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProductKey =
  | "usb128"
  | "usb_500gb"
  | "anual"
  | "plan_1tb_mensual"
  | "plan_2tb_anual";

type ProductConfig = {
  mode: "payment" | "subscription";
  name: string;
  description: string;
  defaultAmountCents: number;
  envAmountKey?: string;
  shipping?: {
    allowedCountries: string[];
    displayName: string;
  };
  recurring?: {
    interval: "month" | "year";
  };
};

const PRODUCTS: Record<ProductKey, ProductConfig> = {
  usb128: {
    mode: "payment",
    name: "USB Latin Power 128 GB",
    description: "+10,000 hits latinos MP3 320 kbps, listas para mezclar.",
    defaultAmountCents: 14700,
    envAmountKey: "STRIPE_USB128_AMOUNT_CENTS",
    shipping: {
      allowedCountries: ["US"],
      displayName: "Envio gratis (USA)",
    },
  },
  // NOTE: Ajusta el precio si es necesario con STRIPE_USB500GB_AMOUNT_CENTS.
  usb_500gb: {
    mode: "payment",
    name: "USB Definitiva 500 GB",
    description:
      "+50,000 canciones MP3 320 kbps, organizadas y listas para eventos.",
    defaultAmountCents: 19700,
    envAmountKey: "STRIPE_USB500GB_AMOUNT_CENTS",
    shipping: {
      allowedCountries: ["US"],
      displayName: "Envio gratis (USA)",
    },
  },
  anual: {
    mode: "payment",
    name: "Acceso Anual - Video Remixes Packs",
    description:
      "Acceso anual a la membresia Video Remix Packs (audio + video + karaoke).",
    defaultAmountCents: 19700,
    envAmountKey: "STRIPE_ANUAL_AMOUNT_CENTS",
  },
  plan_1tb_mensual: {
    mode: "subscription",
    name: "Membresia 1 TB (Mensual)",
    description: "Acceso a la membresia con 1 TB de descarga mensual.",
    defaultAmountCents: 1950,
    envAmountKey: "STRIPE_PLAN_1TB_MENSUAL_AMOUNT_CENTS",
    recurring: { interval: "month" },
  },
  plan_2tb_anual: {
    mode: "subscription",
    name: "Membresia 2 TB (Anual)",
    description: "Acceso a la membresia con 2 TB de descarga.",
    defaultAmountCents: 19500,
    envAmountKey: "STRIPE_PLAN_2TB_ANUAL_AMOUNT_CENTS",
    recurring: { interval: "year" },
  },
};

function parseAmountCents(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function isAllowedOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;

    // Production domains
    if (u.hostname === "videoremixpack.com" || u.hostname === "www.videoremixpack.com") {
      return true;
    }

    // Local dev
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;

    // Lovable preview domains
    if (u.hostname.endsWith(".lovableproject.com") || u.hostname.endsWith(".lovable.app")) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function getSafeSiteOrigin(req: Request): string {
  const origin = req.headers.get("origin");
  if (origin && isAllowedOrigin(origin)) return origin;

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const u = new URL(referer);
      if (isAllowedOrigin(u.origin)) return u.origin;
    } catch {
      // ignore
    }
  }

  // Safe default (prevents open redirects).
  return "https://videoremixpack.com";
}

function getRedirectPaths(product: ProductKey): { successPath: string; cancelPath: string } {
  switch (product) {
    case "usb128":
      return { successPath: "/usb128/gracias", cancelPath: "/usb128" };
    case "usb_500gb":
      return { successPath: "/usb-500gb/gracias", cancelPath: "/usb-500gb" };
    case "anual":
      return { successPath: "/anual/gracias", cancelPath: "/anual" };
    case "plan_1tb_mensual":
    case "plan_2tb_anual":
      return {
        successPath: `/membresia/gracias?plan=${encodeURIComponent(product)}`,
        cancelPath: `/membresia?plan=${encodeURIComponent(product)}`,
      };
  }
}

function buildStripeFormData(args: {
  mode: "payment" | "subscription";
  name: string;
  description: string;
  amountCents: number;
  currency: string;
  interval?: "month" | "year";
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  clientReferenceId?: string;
  metadata?: Record<string, string>;
  shippingAllowedCountries?: string[];
  shippingDisplayName?: string;
}): URLSearchParams {
  const p = new URLSearchParams();

  p.set("mode", args.mode);
  p.set("success_url", args.successUrl);
  p.set("cancel_url", args.cancelUrl);
  p.set("billing_address_collection", "auto");
  p.set("allow_promotion_codes", "true");
  p.set("phone_number_collection[enabled]", "true");

  if (args.customerEmail) p.set("customer_email", args.customerEmail);
  if (args.clientReferenceId) p.set("client_reference_id", args.clientReferenceId);

  // Single-item checkout
  p.set("line_items[0][quantity]", "1");
  p.set("line_items[0][price_data][currency]", args.currency);
  p.set("line_items[0][price_data][unit_amount]", String(args.amountCents));
  p.set("line_items[0][price_data][product_data][name]", args.name);
  p.set("line_items[0][price_data][product_data][description]", args.description);

  if (args.mode === "subscription") {
    const interval = args.interval;
    if (!interval) throw new Error("Missing recurring interval for subscription product");
    p.set("line_items[0][price_data][recurring][interval]", interval);
  }

  if (args.shippingAllowedCountries?.length) {
    args.shippingAllowedCountries.forEach((c, idx) => {
      p.set(`shipping_address_collection[allowed_countries][${idx}]`, c);
    });

    // Show a single "free shipping" option.
    p.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
    p.set(
      "shipping_options[0][shipping_rate_data][display_name]",
      args.shippingDisplayName || "Free shipping"
    );
    p.set(
      "shipping_options[0][shipping_rate_data][fixed_amount][amount]",
      "0"
    );
    p.set(
      "shipping_options[0][shipping_rate_data][fixed_amount][currency]",
      args.currency
    );
  }

  if (args.metadata) {
    for (const [k, v] of Object.entries(args.metadata)) {
      if (!k) continue;
      p.set(`metadata[${k}]`, v);
    }
  }

  return p;
}

async function stripeCreateCheckoutSession(args: {
  stripeSecretKey: string;
  form: URLSearchParams;
}): Promise<{ id: string; url: string | null }> {
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: args.form.toString(),
  });

  const data = (await res.json()) as unknown;
  if (!res.ok) {
    console.error("[Stripe] Session creation failed");
    return Promise.reject(new Error("Stripe session creation failed"));
  }

  const obj = data as Record<string, unknown>;
  const id = typeof obj.id === "string" ? obj.id : "";
  const url = typeof obj.url === "string" ? obj.url : null;
  if (!id) {
    throw new Error("Stripe response missing session id");
  }
  return { id, url };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, function: "stripe-checkout" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[Config] Missing required environment variables");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const input = (body || {}) as Record<string, unknown>;
  const leadId = typeof input.leadId === "string" ? input.leadId : "";
  const product = typeof input.product === "string" ? input.product : "";

  if (!UUID_REGEX.test(leadId)) {
    return new Response(JSON.stringify({ error: "Invalid leadId" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!product || !(product in PRODUCTS)) {
    return new Response(JSON.stringify({ error: "Invalid product" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const productKey = product as ProductKey;
  const cfg = PRODUCTS[productKey];

  const amountFromEnv = cfg.envAmountKey
    ? parseAmountCents(Deno.env.get(cfg.envAmountKey))
    : null;
  const amountCents = amountFromEnv ?? cfg.defaultAmountCents;

  const siteOrigin = getSafeSiteOrigin(req);
  const { successPath, cancelPath } = getRedirectPaths(productKey);
  const successUrl = `${siteOrigin}${successPath}${successPath.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${siteOrigin}${cancelPath}${cancelPath.includes("?") ? "&" : "?"}canceled=1`;

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: lead, error: leadError } = await supabaseAdmin
    .from("leads")
    .select("id,email,name,source,tags")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    console.error("[Supabase] Failed to fetch lead");
    return new Response(JSON.stringify({ error: "Failed to fetch lead" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!lead) {
    return new Response(JSON.stringify({ error: "Lead not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const currency = "usd";

  try {
    const form = buildStripeFormData({
      mode: cfg.mode,
      name: cfg.name,
      description: cfg.description,
      amountCents,
      currency,
      interval: cfg.recurring?.interval,
      successUrl,
      cancelUrl,
      customerEmail: typeof lead.email === "string" ? lead.email : undefined,
      clientReferenceId: leadId,
      metadata: {
        lead_id: leadId,
        product: productKey,
        source: typeof lead.source === "string" ? lead.source : "",
      },
      shippingAllowedCountries: cfg.shipping?.allowedCountries,
      shippingDisplayName: cfg.shipping?.displayName,
    });

    const session = await stripeCreateCheckoutSession({
      stripeSecretKey: STRIPE_SECRET_KEY,
      form,
    });

    return new Response(JSON.stringify({ ok: true, sessionId: session.id, url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Stripe] Error creating checkout session");
    return new Response(JSON.stringify({ error: "Checkout creation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

