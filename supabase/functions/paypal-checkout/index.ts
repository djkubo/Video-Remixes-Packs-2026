import { createClient } from "npm:@supabase/supabase-js@2";
import { createShippoLabel, getShippoFromAddress, getShippoToken, type ShippoAddress } from "../_shared/shippo.ts";

const createSupabaseAdmin = (url: string, serviceRoleKey: string) =>
  createClient(url, serviceRoleKey, { auth: { persistSession: false } });

type SupabaseAdmin = ReturnType<typeof createSupabaseAdmin>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_INPUT_REGEX = /^\+?\d{7,20}$/;

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function makePendingEmail(leadId: string): string {
  // Use a reserved TLD so it never routes email, but stays unique per lead.
  return `pending+${leadId}@example.invalid`;
}

function cleanEmail(value: unknown): string | null {
  const email = asTrimmedString(value).toLowerCase();
  if (!email || email.length > 255) return null;
  return EMAIL_REGEX.test(email) ? email : null;
}

function cleanName(value: unknown): string | null {
  const name = asTrimmedString(value);
  if (!name) return null;
  return name.length > 120 ? name.slice(0, 120) : name;
}

function cleanPhone(value: unknown): string | null {
  const raw = asTrimmedString(value);
  if (!raw) return null;
  const cleaned = raw.replace(/[\s().-]/g, "");
  const digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
  if (cleaned.length > 20) return null;
  if (!PHONE_INPUT_REGEX.test(cleaned)) return null;
  if (!/[1-9]/.test(digits)) return null;
  return cleaned;
}

function cleanSourcePage(value: unknown): string | null {
  const page = asTrimmedString(value);
  if (!page) return null;
  if (!page.startsWith("/")) return null;
  if (page.length > 200) return null;
  return page;
}

type ProductKey =
  | "usb128"
  | "usb_500gb"
  | "anual"
  | "djedits"
  | "plan_1tb_mensual"
  | "plan_2tb_anual";

type PayPalShippingPreference = "NO_SHIPPING" | "GET_FROM_FILE";

type ProductConfig = {
  name: string;
  description: string;
  defaultAmountCents: number;
  envAmountKey?: string;
  shippingPreference: PayPalShippingPreference;
};

const PRODUCTS: Record<ProductKey, ProductConfig> = {
  usb128: {
    name: "USB Latin Power 128 GB",
    description: "+10,000 hits latinos MP3 320 kbps, listas para mezclar.",
    defaultAmountCents: 14700,
    envAmountKey: "PAYPAL_USB128_AMOUNT_CENTS",
    shippingPreference: "GET_FROM_FILE",
  },
  usb_500gb: {
    name: "USB Definitiva 500 GB",
    description:
      "+50,000 canciones MP3 320 kbps, organizadas y listas para eventos.",
    defaultAmountCents: 19700,
    envAmountKey: "PAYPAL_USB500GB_AMOUNT_CENTS",
    shippingPreference: "GET_FROM_FILE",
  },
  anual: {
    name: "Acceso Anual - VideoRemixesPack",
    description:
      "Acceso anual a la membresia VideoRemixesPack (audio + video + karaoke).",
    defaultAmountCents: 19500,
    envAmountKey: "PAYPAL_ANUAL_AMOUNT_CENTS",
    shippingPreference: "NO_SHIPPING",
  },
  djedits: {
    name: "Curso DJ Edits (Pago unico)",
    description: "Curso paso a paso para crear DJ edits desde cero.",
    defaultAmountCents: 7000,
    envAmountKey: "PAYPAL_DJEDITS_AMOUNT_CENTS",
    shippingPreference: "NO_SHIPPING",
  },
  plan_1tb_mensual: {
    name: "Membresia 1 TB (Mensual)",
    description: "Acceso a la membresia con 1 TB de descarga mensual.",
    defaultAmountCents: 3500,
    envAmountKey: "PAYPAL_PLAN_1TB_MENSUAL_AMOUNT_CENTS",
    shippingPreference: "NO_SHIPPING",
  },
  plan_2tb_anual: {
    name: "Membresia 2 TB (Anual)",
    description: "Acceso a la membresia con 2 TB de descarga.",
    defaultAmountCents: 19500,
    envAmountKey: "PAYPAL_PLAN_2TB_ANUAL_AMOUNT_CENTS",
    shippingPreference: "NO_SHIPPING",
  },
};

function isShippingProduct(product: ProductKey): boolean {
  return PRODUCTS[product].shippingPreference === "GET_FROM_FILE";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildShippoToAddress(args: {
  lead: { name: string; email: string; phone: string };
  orderInfo: Record<string, unknown>;
}): ShippoAddress | null {
  const purchaseUnits = Array.isArray(args.orderInfo.purchase_units)
    ? (args.orderInfo.purchase_units as unknown[])
    : [];
  const pu0 = purchaseUnits[0];
  if (!isRecord(pu0)) return null;

  const shipping = pu0.shipping;
  if (!isRecord(shipping)) return null;

  const shippingNameObj = shipping.name;
  const fullName =
    isRecord(shippingNameObj) && typeof shippingNameObj.full_name === "string"
      ? shippingNameObj.full_name
      : args.lead.name;

  const addr = shipping.address;
  if (!isRecord(addr)) return null;

  const street1 = typeof addr.address_line_1 === "string" ? addr.address_line_1 : "";
  const street2 = typeof addr.address_line_2 === "string" ? addr.address_line_2 : "";
  const city = typeof addr.admin_area_2 === "string" ? addr.admin_area_2 : "";
  const state = typeof addr.admin_area_1 === "string" ? addr.admin_area_1 : "";
  const zip = typeof addr.postal_code === "string" ? addr.postal_code : "";
  const country = typeof addr.country_code === "string" ? addr.country_code : "";

  if (!fullName || !street1 || !city || !state || !zip || !country) return null;

  return {
    name: fullName,
    street1,
    street2: street2 || undefined,
    city,
    state,
    zip,
    country,
    phone: args.lead.phone,
    email: args.lead.email,
  };
}

function getOrderShippingCountryCode(orderInfo: Record<string, unknown>): string {
  const purchaseUnits = Array.isArray(orderInfo.purchase_units)
    ? (orderInfo.purchase_units as unknown[])
    : [];
  const pu0 = purchaseUnits[0];
  if (!isRecord(pu0)) return "";

  const shipping = pu0.shipping;
  if (!isRecord(shipping)) return "";

  const addr = shipping.address;
  if (!isRecord(addr)) return "";

  const cc = typeof addr.country_code === "string" ? addr.country_code : "";
  return cc.trim().toUpperCase();
}

function parseAmountCents(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function centsToUsdString(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

function isAllowedOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;

    if (u.hostname === "videoremixpack.com" || u.hostname === "www.videoremixpack.com") {
      return true;
    }

    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;

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
    case "djedits":
      return { successPath: "/djedits/gracias", cancelPath: "/djedits" };
    case "plan_1tb_mensual":
    case "plan_2tb_anual":
      return {
        successPath: `/membresia/gracias?plan=${encodeURIComponent(product)}`,
        cancelPath: `/membresia?plan=${encodeURIComponent(product)}`,
      };
  }
}

function getPayPalBaseUrl(): string {
  const env = (Deno.env.get("PAYPAL_ENV") || "live").toLowerCase();
  return env === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}

async function getPayPalAccessToken(args: {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}): Promise<string> {
  const auth = btoa(`${args.clientId}:${args.clientSecret}`);

  const res = await fetch(`${args.baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = (await res.json()) as unknown;
  if (!res.ok) {
    console.error("[PayPal] Failed to get access token");
    throw new Error("PayPal auth failed");
  }

  const obj = data as Record<string, unknown>;
  const token = typeof obj.access_token === "string" ? obj.access_token : "";
  if (!token) throw new Error("Missing PayPal access token");
  return token;
}

async function paypalFetchJson(args: {
  baseUrl: string;
  token: string;
  method: string;
  path: string;
  body?: Record<string, unknown>;
}): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  const res = await fetch(`${args.baseUrl}${args.path}`, {
    method: args.method,
    headers: {
      Authorization: `Bearer ${args.token}`,
      "Content-Type": "application/json",
    },
    body: args.body ? JSON.stringify(args.body) : undefined,
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, json };
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

async function ensureLeadExists(args: {
  supabaseAdmin: SupabaseAdmin;
  leadId: string;
  productKey: ProductKey;
  input: Record<string, unknown>;
}): Promise<{ id: string; email: string; name: string; phone: string; source: string | null; tags: unknown }> {
  const { data: existing, error: existingError } = await args.supabaseAdmin
    .from("leads")
    .select("id,email,name,phone,source,tags")
    .eq("id", args.leadId)
    .maybeSingle();

  if (existingError) {
    console.error("[Supabase] Failed to fetch lead");
    throw new Error("Failed to fetch lead");
  }

  if (existing) {
    return existing as { id: string; email: string; name: string; phone: string; source: string | null; tags: unknown };
  }

  const providedLead = isRecord(args.input.lead) ? (args.input.lead as Record<string, unknown>) : {};

  const name = cleanName(args.input.name) || cleanName(providedLead.name) || "DJ";
  const email = cleanEmail(args.input.email) || cleanEmail(providedLead.email) || makePendingEmail(args.leadId);
  const phone = cleanPhone(args.input.phone) || cleanPhone(providedLead.phone) || "";
  const countryCode = asTrimmedString(args.input.country_code) || asTrimmedString(providedLead.country_code) || null;
  const countryName = asTrimmedString(args.input.country_name) || asTrimmedString(providedLead.country_name) || null;
  const source = asTrimmedString(args.input.source) || asTrimmedString(providedLead.source) || args.productKey;
  const sourcePage =
    cleanSourcePage(args.input.source_page) ||
    cleanSourcePage(args.input.sourcePage) ||
    cleanSourcePage(providedLead.source_page) ||
    cleanSourcePage(providedLead.sourcePage) ||
    null;

  const baseTags = mergeTags(args.input.tags ?? providedLead.tags, [
    args.productKey,
    "checkout_started",
  ]);

  const leadPayloadFull: Record<string, unknown> = {
    id: args.leadId,
    name,
    email,
    phone,
    country_code: countryCode,
    country_name: countryName,
    source,
    tags: baseTags,
    funnel_step: "checkout_start",
    source_page: sourcePage,
    intent_plan: args.productKey,
    consent_transactional: false,
    consent_marketing: false,
  };

  try {
    const { error: insertError } = await args.supabaseAdmin.from("leads").insert(leadPayloadFull);
    if (insertError) throw insertError;
  } catch {
    const leadPayloadMinimal: Record<string, unknown> = {
      id: args.leadId,
      name,
      email,
      phone,
      country_code: countryCode,
      country_name: countryName,
      source,
      tags: baseTags,
    };
    const { error: insertError } = await args.supabaseAdmin.from("leads").insert(leadPayloadMinimal);
    if (insertError) throw insertError;
  }

  return { id: args.leadId, email, name, phone, source, tags: baseTags };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, function: "paypal-checkout" }), {
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

  const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
  const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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

  if (!UUID_REGEX.test(leadId)) {
    return new Response(JSON.stringify({ error: "Invalid leadId" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createSupabaseAdmin(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const baseUrl = getPayPalBaseUrl();
  const accessToken = await getPayPalAccessToken({
    baseUrl,
    clientId: PAYPAL_CLIENT_ID,
    clientSecret: PAYPAL_CLIENT_SECRET,
  });

  if (action === "create") {
    const product = typeof input.product === "string" ? input.product : "";
    if (!product || !(product in PRODUCTS)) {
      return new Response(JSON.stringify({ error: "Invalid product" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productKey = product as ProductKey;

    // PayPal Subscriptions are required for recurring billing/trials. We only support Orders (one-time CAPTURE) here.
    if (productKey === "plan_1tb_mensual" || productKey === "plan_2tb_anual") {
      return new Response(JSON.stringify({ error: "PayPal not available for subscriptions. Use card." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cfg = PRODUCTS[productKey];

    // NOTE: This function uses PayPal Orders (one-time CAPTURE). Subscription billing + trials
    // require PayPal Subscriptions, which we don't implement here.

    const amountFromEnv = cfg.envAmountKey
      ? parseAmountCents(Deno.env.get(cfg.envAmountKey))
      : null;
    const amountCents = amountFromEnv ?? cfg.defaultAmountCents;

    let lead: { id: string; email: string; name: string; phone: string; source: string | null; tags: unknown };
    try {
      lead = await ensureLeadExists({ supabaseAdmin, leadId, productKey, input });
    } catch (e) {
      console.error("[Supabase] Failed to ensure lead", e);
      return new Response(JSON.stringify({ error: "Failed to fetch lead" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteOrigin = getSafeSiteOrigin(req);
    const { successPath, cancelPath } = getRedirectPaths(productKey);
    const returnUrl = `${siteOrigin}${successPath}${successPath.includes("?") ? "&" : "?"}lead_id=${encodeURIComponent(leadId)}&provider=paypal`;
    const cancelUrl = `${siteOrigin}${cancelPath}${cancelPath.includes("?") ? "&" : "?"}lead_id=${encodeURIComponent(leadId)}&provider=paypal&canceled=1`;

    const createBody: Record<string, unknown> = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: productKey,
          custom_id: leadId,
          description: cfg.description,
          amount: {
            currency_code: "USD",
            value: centsToUsdString(amountCents),
          },
        },
      ],
      application_context: {
        brand_name: "VideoRemixesPack",
        user_action: "PAY_NOW",
        shipping_preference: cfg.shippingPreference,
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    };

    const { ok, json } = await paypalFetchJson({
      baseUrl,
      token: accessToken,
      method: "POST",
      path: "/v2/checkout/orders",
      body: createBody,
    });

    if (!ok) {
      console.error("[PayPal] Order creation failed");
      return new Response(JSON.stringify({ error: "PayPal order creation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderId = typeof json.id === "string" ? json.id : "";
    const links = Array.isArray(json.links) ? (json.links as unknown[]) : [];
    const approveUrl = (() => {
      for (const l of links) {
        const link = l as Record<string, unknown>;
        if (link.rel === "approve" && typeof link.href === "string") return link.href;
      }
      return "";
    })();

    if (!orderId || !approveUrl) {
      console.error("[PayPal] Missing approve url");
      return new Response(JSON.stringify({ error: "PayPal response invalid" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Track checkout started in DB (best-effort).
    try {
      const nextTags = mergeTags(lead.tags, ["paypal_checkout"]);
      await supabaseAdmin.from("leads").update({ tags: nextTags }).eq("id", leadId);
    } catch {
      // ignore
    }

    return new Response(JSON.stringify({ ok: true, orderId, approveUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "capture") {
    const orderId = typeof input.orderId === "string" ? input.orderId : "";
    if (!orderId || orderId.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid orderId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate order belongs to this lead before capturing.
    const orderInfo = await paypalFetchJson({
      baseUrl,
      token: accessToken,
      method: "GET",
      path: `/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    });

    if (!orderInfo.ok) {
      return new Response(JSON.stringify({ error: "PayPal order lookup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const purchaseUnits = Array.isArray(orderInfo.json.purchase_units)
      ? (orderInfo.json.purchase_units as unknown[])
      : [];
    const referenceId = (() => {
      const pu0 = purchaseUnits[0] as Record<string, unknown> | undefined;
      return typeof pu0?.reference_id === "string" ? (pu0.reference_id as string) : "";
    })();
    const customId = (() => {
      const pu0 = purchaseUnits[0] as Record<string, unknown> | undefined;
      return typeof pu0?.custom_id === "string" ? (pu0.custom_id as string) : "";
    })();

    if (!customId || customId !== leadId) {
      return new Response(JSON.stringify({ error: "Order does not match lead" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsedProduct =
      referenceId && referenceId in PRODUCTS ? (referenceId as ProductKey) : null;

    if (!parsedProduct) {
      return new Response(JSON.stringify({ error: "Invalid product" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payer = isRecord(orderInfo.json.payer) ? (orderInfo.json.payer as Record<string, unknown>) : null;
    const payerEmail = payer ? cleanEmail(payer.email_address) : null;
    const payerName = (() => {
      if (!payer) return null;
      const nameObj = payer.name;
      if (!isRecord(nameObj)) return cleanName(payer.name);
      const given = cleanName((nameObj as Record<string, unknown>).given_name);
      const sur = cleanName((nameObj as Record<string, unknown>).surname);
      const joined = `${given || ""} ${sur || ""}`.trim();
      return joined || null;
    })();
    const payerPhone = (() => {
      if (!payer) return null;
      const phoneObj = payer.phone;
      if (!isRecord(phoneObj)) return cleanPhone(phoneObj);
      const pn = (phoneObj as Record<string, unknown>).phone_number;
      if (isRecord(pn)) {
        const nn = (pn as Record<string, unknown>).national_number;
        return cleanPhone(nn);
      }
      return null;
    })();

    const shippingName = (() => {
      const pu = Array.isArray(orderInfo.json.purchase_units) ? (orderInfo.json.purchase_units as unknown[]) : [];
      const pu0 = pu[0];
      if (!isRecord(pu0)) return null;
      const shipping = (pu0 as Record<string, unknown>).shipping;
      if (!isRecord(shipping)) return null;
      const nameObj = (shipping as Record<string, unknown>).name;
      if (isRecord(nameObj)) return cleanName((nameObj as Record<string, unknown>).full_name);
      return cleanName((shipping as Record<string, unknown>).name);
    })();

    const contactName = shippingName || payerName || "DJ";

    // Ensure lead exists so capture/update flows are consistent even when we skip pre-checkout forms.
    try {
      await ensureLeadExists({
        supabaseAdmin,
        leadId,
        productKey: parsedProduct,
        input: {
          ...input,
          name: contactName,
          email: payerEmail || undefined,
          phone: payerPhone || undefined,
          source: parsedProduct,
          tags: [parsedProduct, "paypal_checkout"],
        },
      });
    } catch (e) {
      console.error("[Supabase] Failed to ensure lead", e);
      return new Response(JSON.stringify({ error: "Failed to fetch lead" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderStatusRaw = typeof orderInfo.json.status === "string" ? orderInfo.json.status : "";
    const orderStatus = orderStatusRaw.trim().toUpperCase();
    const alreadyCompleted = orderStatus === "COMPLETED";

    // Enforce US-only shipping for physical products (USBs) BEFORE capturing payment.
    // If the order is already completed, we cannot block capture; mark for manual follow-up instead.
    let shippingCountry = "";
    let shippingAllowed = true;
    if (parsedProduct && isShippingProduct(parsedProduct)) {
      shippingCountry = getOrderShippingCountryCode(orderInfo.json);

      if (!shippingCountry) {
        shippingAllowed = false;
        // Best-effort: mark lead for manual follow-up when order is already completed.
        if (alreadyCompleted) {
          try {
            const { data: lead } = await supabaseAdmin
              .from("leads")
              .select("tags")
              .eq("id", leadId)
              .maybeSingle();
            const nextTags = mergeTags(lead?.tags, ["needs_shipping"]);
            await supabaseAdmin.from("leads").update({ tags: nextTags }).eq("id", leadId);
          } catch {
            // ignore
          }
        }
        if (!alreadyCompleted) {
          return new Response(
            JSON.stringify({
              ok: true,
              completed: false,
              code: "SHIPPING_ADDRESS_REQUIRED",
              message: "Shipping address is required for this product",
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } else if (shippingCountry !== "US") {
        shippingAllowed = false;

        // Best-effort: mark lead for manual follow-up.
        try {
          const { data: lead } = await supabaseAdmin
            .from("leads")
            .select("tags")
            .eq("id", leadId)
            .maybeSingle();
          const nextTags = mergeTags(lead?.tags, ["shipping_not_allowed"]);
          await supabaseAdmin.from("leads").update({ tags: nextTags }).eq("id", leadId);
        } catch {
          // ignore
        }

        if (!alreadyCompleted) {
          return new Response(
            JSON.stringify({
              ok: true,
              completed: false,
              code: "SHIPPING_COUNTRY_NOT_ALLOWED",
              allowedCountries: ["US"],
              country: shippingCountry,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    let status = orderStatusRaw;
    let completed = alreadyCompleted;

    if (!alreadyCompleted) {
      const captureInfo = await paypalFetchJson({
        baseUrl,
        token: accessToken,
        method: "POST",
        path: `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
        body: {},
      });

      if (!captureInfo.ok) {
        // If the order was captured by another flow (e.g. webhook), treat this as success.
        const refreshed = await paypalFetchJson({
          baseUrl,
          token: accessToken,
          method: "GET",
          path: `/v2/checkout/orders/${encodeURIComponent(orderId)}`,
        });

        const refreshedStatusRaw = typeof refreshed.json.status === "string" ? refreshed.json.status : "";
        const refreshedCompleted = refreshedStatusRaw.trim().toUpperCase() === "COMPLETED";
        if (!refreshed.ok || !refreshedCompleted) {
          console.error("[PayPal] Capture failed");
          return new Response(JSON.stringify({ error: "PayPal capture failed" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        status = refreshedStatusRaw;
        completed = true;
      } else {
        status = typeof captureInfo.json.status === "string" ? captureInfo.json.status : "";
        completed = status.toUpperCase() === "COMPLETED";
      }
    }

    // Track successful payment in DB (best-effort).
    let shippo: { ok: boolean; labelUrl?: string; trackingNumber?: string } | undefined;

    if (completed) {
      try {
        const { data: lead } = await supabaseAdmin
          .from("leads")
          .select("tags,name,email,phone")
          .eq("id", leadId)
          .maybeSingle();

        const baseTags = mergeTags(lead?.tags, ["paid_paypal"]);

        // Auto-create a Shippo label for physical products (USBs) if Shippo is configured.
        if (shippingAllowed && parsedProduct && isShippingProduct(parsedProduct)) {
          const alreadyHasLabel =
            baseTags.includes("shippo_label_created") || baseTags.includes("shippo_label");

          if (!alreadyHasLabel && lead?.name && lead?.email && lead?.phone) {
            const shippoToken = getShippoToken();
            const fromAddress = getShippoFromAddress();
            const toAddress = buildShippoToAddress({
              lead: { name: lead.name, email: lead.email, phone: lead.phone },
              orderInfo: orderInfo.json,
            });

            // Defense-in-depth: never attempt to buy a label outside the US.
            if (toAddress && toAddress.country.trim().toUpperCase() !== "US") {
              shippo = { ok: false };
              const tagsNotAllowed = mergeTags(baseTags, ["shipping_not_allowed"]);
              await supabaseAdmin.from("leads").update({ tags: tagsNotAllowed }).eq("id", leadId);
              // Continue without Shippo.
            } else if (shippoToken && fromAddress && toAddress) {
              try {
                const label = await createShippoLabel({
                  token: shippoToken,
                  fromAddress,
                  toAddress,
                  metadata: {
                    lead_id: leadId,
                    provider: "paypal",
                    order_id: orderId,
                    product: parsedProduct,
                  },
                });

                shippo = {
                  ok: true,
                  labelUrl: label.labelUrl,
                  trackingNumber: label.trackingNumber,
                };

                const tagsWithShippo = mergeTags(baseTags, [
                  "shippo_label_created",
                  "shippo_label",
                ]);

                // Persist details if the optional columns exist (best-effort).
                try {
                  await supabaseAdmin
                    .from("leads")
                    .update({
                      tags: tagsWithShippo,
                      name: contactName,
                      ...(payerEmail ? { email: payerEmail } : {}),
                      ...(payerPhone ? { phone: payerPhone } : {}),
                      payment_provider: "paypal",
                      payment_id: orderId,
                      paid_at: new Date().toISOString(),
                      consent_transactional: true,
                      consent_transactional_at: new Date().toISOString(),
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
            // Missing lead info (e.g. phone). Mark for manual follow-up.
            const nextTags = mergeTags(baseTags, ["needs_shipping"]);
            await supabaseAdmin.from("leads").update({ tags: nextTags }).eq("id", leadId);
          }
        } else {
          // Digital product: just store payment state (best-effort).
          try {
            await supabaseAdmin
              .from("leads")
              .update({
                tags: baseTags,
                name: contactName,
                ...(payerEmail ? { email: payerEmail } : {}),
                ...(payerPhone ? { phone: payerPhone } : {}),
                payment_provider: "paypal",
                payment_id: orderId,
                paid_at: new Date().toISOString(),
                consent_transactional: true,
                consent_transactional_at: new Date().toISOString(),
              })
              .eq("id", leadId);
          } catch {
            await supabaseAdmin.from("leads").update({ tags: baseTags }).eq("id", leadId);
          }
        }
      } catch {
        // ignore
      }
    }

    return new Response(JSON.stringify({ ok: true, status, completed, shippo }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
