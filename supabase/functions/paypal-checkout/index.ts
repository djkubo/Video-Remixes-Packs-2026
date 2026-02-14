import { createClient } from "npm:@supabase/supabase-js@2";
import { createShippoLabel, getShippoFromAddress, getShippoToken, type ShippoAddress } from "../_shared/shippo.ts";

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
    name: "Acceso Anual - Video Remixes Packs",
    description:
      "Acceso anual a la membresia Video Remix Packs (audio + video + karaoke).",
    defaultAmountCents: 19500,
    envAmountKey: "PAYPAL_ANUAL_AMOUNT_CENTS",
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

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

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
    const cfg = PRODUCTS[productKey];
    const amountFromEnv = cfg.envAmountKey
      ? parseAmountCents(Deno.env.get(cfg.envAmountKey))
      : null;
    const amountCents = amountFromEnv ?? cfg.defaultAmountCents;

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
        brand_name: "VideoRemixesPacks",
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

    // Enforce US-only shipping for physical products (USBs) BEFORE capturing payment.
    if (parsedProduct && isShippingProduct(parsedProduct)) {
      const shippingCountry = getOrderShippingCountryCode(orderInfo.json);

      if (!shippingCountry) {
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

      if (shippingCountry !== "US") {
        // Best-effort: mark lead for manual follow-up (do not treat as "paid").
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

    const captureInfo = await paypalFetchJson({
      baseUrl,
      token: accessToken,
      method: "POST",
      path: `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      body: {},
    });

    if (!captureInfo.ok) {
      console.error("[PayPal] Capture failed");
      return new Response(JSON.stringify({ error: "PayPal capture failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const status = typeof captureInfo.json.status === "string" ? captureInfo.json.status : "";
    const completed = status.toUpperCase() === "COMPLETED";

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
        if (parsedProduct && isShippingProduct(parsedProduct)) {
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
                      payment_provider: "paypal",
                      payment_id: orderId,
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
            // Nothing to do (already has label or missing lead info).
            const nextTags = mergeTags(baseTags, []);
            await supabaseAdmin.from("leads").update({ tags: nextTags }).eq("id", leadId);
          }
        } else {
          // Digital product: just store payment state (best-effort).
          try {
            await supabaseAdmin
              .from("leads")
              .update({
                tags: baseTags,
                payment_provider: "paypal",
                payment_id: orderId,
                paid_at: new Date().toISOString(),
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
