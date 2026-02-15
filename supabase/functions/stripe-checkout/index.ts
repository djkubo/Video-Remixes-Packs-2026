import { createClient } from "npm:@supabase/supabase-js@2";
import { createShippoLabel, getShippoFromAddress, getShippoToken, type ShippoAddress } from "../_shared/shippo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const t of input) {
    if (typeof t !== "string") continue;
    const norm = t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (!norm) continue;
    out.push(norm);
  }
  return out;
}

function mergeTags(existing: unknown, add: string[]): string[] {
  const base = normalizeTags(existing);
  const set = new Set<string>(base);
  for (const t of add) set.add(t);
  return Array.from(set).slice(0, 20);
}

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
  trialDays?: number;
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
    defaultAmountCents: 19500,
    envAmountKey: "STRIPE_ANUAL_AMOUNT_CENTS",
  },
  plan_1tb_mensual: {
    mode: "subscription",
    name: "Plan PRO DJ mensual",
    description: "Acceso a la membresia con 1 TB de descarga mensual.",
    defaultAmountCents: 3500,
    envAmountKey: "STRIPE_PLAN_1TB_MENSUAL_AMOUNT_CENTS",
    trialDays: 7,
    recurring: { interval: "month" },
  },
  plan_2tb_anual: {
    mode: "subscription",
    name: "Plan 2 TB / Mes \u2013 195 Anual",
    description: "Acceso a la membresia con 2 TB de descarga.",
    defaultAmountCents: 19500,
    envAmountKey: "STRIPE_PLAN_2TB_ANUAL_AMOUNT_CENTS",
    trialDays: 7,
    recurring: { interval: "year" },
  },
};

function parseAmountCents(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function isShippingProduct(product: ProductKey): boolean {
  return Boolean(PRODUCTS[product].shipping);
}

function buildShippoToAddressFromStripe(args: {
  lead: { name: string; email: string; phone: string };
  session: Record<string, unknown>;
}): ShippoAddress | null {
  const shippingDetails = isRecord(args.session.shipping_details)
    ? (args.session.shipping_details as Record<string, unknown>)
    : null;

  const customerDetails = isRecord(args.session.customer_details)
    ? (args.session.customer_details as Record<string, unknown>)
    : null;

  const name =
    (shippingDetails && typeof shippingDetails.name === "string" && shippingDetails.name) ||
    args.lead.name;

  const addr =
    (shippingDetails && isRecord(shippingDetails.address) && (shippingDetails.address as Record<string, unknown>)) ||
    (customerDetails && isRecord(customerDetails.address) && (customerDetails.address as Record<string, unknown>)) ||
    null;

  if (!addr) return null;

  const street1 = typeof addr.line1 === "string" ? addr.line1 : "";
  const street2 = typeof addr.line2 === "string" ? addr.line2 : "";
  const city = typeof addr.city === "string" ? addr.city : "";
  const state = typeof addr.state === "string" ? addr.state : "";
  const zip = typeof addr.postal_code === "string" ? addr.postal_code : "";
  const country = typeof addr.country === "string" ? addr.country : "";

  const email =
    (customerDetails && typeof customerDetails.email === "string" && customerDetails.email) ||
    args.lead.email;
  const phone =
    (customerDetails && typeof customerDetails.phone === "string" && customerDetails.phone) ||
    args.lead.phone;

  if (!name || !street1 || !city || !state || !zip || !country) return null;

  return {
    name,
    street1,
    street2: street2 || undefined,
    city,
    state,
    zip,
    country,
    phone,
    email,
  };
}

function isAllowedOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;

    // Production domains
    const allowedHosts = [
      "videoremixespacks.com",
      "www.videoremixespacks.com",
      "videoremixpack.com",
      "www.videoremixpack.com",
    ];
    if (allowedHosts.includes(u.hostname)) return true;

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
  return "https://videoremixespacks.com";
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
  trialDays?: number;
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

    // If we're offering a free trial, still collect payment method as a quality filter.
    if (args.trialDays && args.trialDays > 0) {
      p.set("subscription_data[trial_period_days]", String(args.trialDays));
      p.set("payment_method_collection", "always");
    }
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

async function stripeRetrieveCheckoutSession(args: {
  stripeSecretKey: string;
  sessionId: string;
}): Promise<Record<string, unknown>> {
  const url = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(args.sessionId)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${args.stripeSecretKey}`,
    },
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    console.error("[Stripe] Session retrieval failed");
    throw new Error("Stripe session retrieval failed");
  }

  return data;
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
  const action = typeof input.action === "string" ? input.action : "create";
  const leadId = typeof input.leadId === "string" ? input.leadId : "";
  const product = typeof input.product === "string" ? input.product : "";
  const sessionId = typeof input.sessionId === "string" ? input.sessionId : "";

  if (!UUID_REGEX.test(leadId)) {
    return new Response(JSON.stringify({ error: "Invalid leadId" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  if (action === "verify") {
    if (!sessionId || sessionId.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid sessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const session = await stripeRetrieveCheckoutSession({
        stripeSecretKey: STRIPE_SECRET_KEY,
        sessionId,
      });

      const paymentStatus =
        typeof session.payment_status === "string" ? session.payment_status : "";
      const paid =
        paymentStatus === "paid" || paymentStatus === "no_payment_required";

      const clientRef =
        typeof session.client_reference_id === "string"
          ? session.client_reference_id
          : "";
      const metadata = isRecord(session.metadata)
        ? (session.metadata as Record<string, unknown>)
        : {};
      const metaLeadId =
        typeof metadata.lead_id === "string" ? metadata.lead_id : "";
      const metaProduct =
        typeof metadata.product === "string" ? metadata.product : "";

      if ((clientRef && clientRef !== leadId) || (metaLeadId && metaLeadId !== leadId)) {
        return new Response(JSON.stringify({ error: "Session does not match lead" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const resolvedProduct = metaProduct || product;
      if (!resolvedProduct || !(resolvedProduct in PRODUCTS)) {
        return new Response(JSON.stringify({ error: "Invalid product" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const productKey = resolvedProduct as ProductKey;

      const { data: lead, error: leadError } = await supabaseAdmin
        .from("leads")
        .select("id,email,name,phone,source,tags")
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

      // Not paid yet: return without mutating.
      if (!paid) {
        return new Response(JSON.stringify({ ok: true, paid: false, payment_status: paymentStatus }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const baseTags = mergeTags(lead.tags, ["paid_stripe"]);
      const alreadyHasLabel =
        baseTags.includes("shippo_label_created") || baseTags.includes("shippo_label");

      let shippo: { ok: boolean; labelUrl?: string; trackingNumber?: string } | undefined;

      if (isShippingProduct(productKey) && !alreadyHasLabel) {
        const shippoToken = getShippoToken();
        const fromAddress = getShippoFromAddress();
        const toAddress = buildShippoToAddressFromStripe({
          lead: { name: lead.name, email: lead.email, phone: lead.phone },
          session,
        });

        // Defense-in-depth: never attempt to buy a label outside the US.
        if (toAddress && toAddress.country.trim().toUpperCase() !== "US") {
          shippo = { ok: false };
          const tagsNotAllowed = mergeTags(baseTags, ["shipping_not_allowed"]);
          await supabaseAdmin.from("leads").update({ tags: tagsNotAllowed }).eq("id", leadId);
        } else if (shippoToken && fromAddress && toAddress) {
          try {
            const label = await createShippoLabel({
              token: shippoToken,
              fromAddress,
              toAddress,
              metadata: {
                lead_id: leadId,
                provider: "stripe",
                session_id: sessionId,
                product: productKey,
              },
            });

            shippo = { ok: true, labelUrl: label.labelUrl, trackingNumber: label.trackingNumber };

            const tagsWithShippo = mergeTags(baseTags, ["shippo_label_created", "shippo_label"]);

            try {
              await supabaseAdmin
                .from("leads")
                .update({
                  tags: tagsWithShippo,
                  payment_provider: "stripe",
                  payment_id: sessionId,
                  paid_at: new Date().toISOString(),
                  shipping_to: toAddress,
                  shipping_label_url: label.labelUrl,
                  shipping_tracking_number: label.trackingNumber,
                  shipping_carrier: label.carrier || null,
                  shipping_servicelevel: label.servicelevel || null,
                  shipping_status: "label_created",
                })
                .eq("id", leadId);
            } catch {
              await supabaseAdmin.from("leads").update({ tags: tagsWithShippo }).eq("id", leadId);
            }
          } catch {
            shippo = { ok: false };
            const tagsNeedsShipping = mergeTags(baseTags, ["needs_shipping"]);
            await supabaseAdmin.from("leads").update({ tags: tagsNeedsShipping }).eq("id", leadId);
          }
        } else {
          shippo = { ok: false };
          const tagsNeedsShipping = mergeTags(baseTags, ["needs_shipping"]);
          await supabaseAdmin.from("leads").update({ tags: tagsNeedsShipping }).eq("id", leadId);
        }
      } else {
        // Digital product or already has label: just persist payment state (best-effort).
        try {
          await supabaseAdmin
            .from("leads")
            .update({
              tags: baseTags,
              payment_provider: "stripe",
              payment_id: sessionId,
              paid_at: new Date().toISOString(),
            })
            .eq("id", leadId);
        } catch {
          await supabaseAdmin.from("leads").update({ tags: baseTags }).eq("id", leadId);
        }
      }

      return new Response(JSON.stringify({ ok: true, paid: true, shippo }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Stripe verify failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // action: "create"
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
  const successUrl = `${siteOrigin}${successPath}${successPath.includes("?") ? "&" : "?"}lead_id=${encodeURIComponent(leadId)}&product=${encodeURIComponent(productKey)}&provider=stripe&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${siteOrigin}${cancelPath}${cancelPath.includes("?") ? "&" : "?"}lead_id=${encodeURIComponent(leadId)}&product=${encodeURIComponent(productKey)}&provider=stripe&canceled=1`;

  const { data: lead, error: leadError } = await supabaseAdmin
    .from("leads")
    .select("id,email,name,phone,source,tags")
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
      trialDays: cfg.trialDays,
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

    // Track checkout started (best-effort).
    try {
      const nextTags = mergeTags(lead.tags, ["stripe_checkout"]);
      await supabaseAdmin.from("leads").update({ tags: nextTags }).eq("id", leadId);
    } catch {
      // ignore
    }

    return new Response(JSON.stringify({ ok: true, sessionId: session.id, url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    console.error("[Stripe] Error creating checkout session");
    return new Response(JSON.stringify({ error: "Checkout creation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
