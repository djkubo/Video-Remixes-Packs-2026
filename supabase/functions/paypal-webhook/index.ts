import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createShippoLabel,
  getShippoFromAddress,
  getShippoToken,
  type ShippoAddress,
} from "../_shared/shippo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, paypal-transmission-id, paypal-transmission-time, paypal-transmission-sig, paypal-cert-url, paypal-auth-algo",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PayPalWebhookEvent = {
  id?: unknown;
  event_type?: unknown;
  resource?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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
  return Array.from(set).slice(0, 30);
}

type ProductKey = "usb128" | "usb_500gb" | "anual" | "djedits";

const SHIPPING_PRODUCTS = new Set<ProductKey>(["usb128", "usb_500gb"]);

function isShippingProduct(product: string | null): product is ProductKey {
  return Boolean(product) && SHIPPING_PRODUCTS.has(product as ProductKey);
}

type PayPalVerifySignatureInput = {
  auth_algo: string;
  cert_url: string;
  transmission_id: string;
  transmission_sig: string;
  transmission_time: string;
  webhook_id: string;
  webhook_event: Record<string, unknown>;
};

function getPayPalBaseUrl(): string {
  const env = (Deno.env.get("PAYPAL_ENV") || "live").toLowerCase();
  return env === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}

function getPayPalWebhookId(): string {
  const env = (Deno.env.get("PAYPAL_ENV") || "live").toLowerCase();
  const liveId = Deno.env.get("PAYPAL_WEBHOOK_ID") || "";
  const sandboxId = Deno.env.get("PAYPAL_WEBHOOK_ID_SANDBOX") || "";

  if (env === "sandbox") return sandboxId || liveId;
  return liveId || sandboxId;
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

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    console.error("[PayPal] Failed to get access token");
    throw new Error("PayPal auth failed");
  }

  const token = typeof data.access_token === "string" ? data.access_token : "";
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

async function verifyPayPalWebhookSignature(args: {
  baseUrl: string;
  token: string;
  webhookId: string;
  headers: Headers;
  event: Record<string, unknown>;
}): Promise<{ verified: true } | { verified: false; reason: string }> {
  const transmissionId = args.headers.get("paypal-transmission-id") || "";
  const transmissionTime = args.headers.get("paypal-transmission-time") || "";
  const transmissionSig = args.headers.get("paypal-transmission-sig") || "";
  const certUrl = args.headers.get("paypal-cert-url") || "";
  const authAlgo = args.headers.get("paypal-auth-algo") || "";

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    return { verified: false, reason: "Missing required PayPal signature headers" };
  }

  const input: PayPalVerifySignatureInput = {
    auth_algo: authAlgo,
    cert_url: certUrl,
    transmission_id: transmissionId,
    transmission_sig: transmissionSig,
    transmission_time: transmissionTime,
    webhook_id: args.webhookId,
    webhook_event: args.event,
  };

  const res = await paypalFetchJson({
    baseUrl: args.baseUrl,
    token: args.token,
    method: "POST",
    path: "/v1/notifications/verify-webhook-signature",
    body: input as unknown as Record<string, unknown>,
  });

  if (!res.ok) {
    console.error("[paypal-webhook] Signature verification request failed", res.status);
    return { verified: false, reason: "PayPal signature verification failed" };
  }

  const status = asString(res.json.verification_status).toUpperCase();
  if (status !== "SUCCESS") {
    return { verified: false, reason: "Invalid PayPal signature" };
  }

  return { verified: true };
}

function extractOrderIdFromEvent(args: {
  eventType: string;
  resource: Record<string, unknown>;
}): string {
  if (args.eventType.startsWith("CHECKOUT.ORDER.")) {
    return asString(args.resource.id);
  }

  // PAYMENT.CAPTURE.* events usually reference the order via supplementary_data.related_ids.order_id
  const sup = isRecord(args.resource.supplementary_data)
    ? (args.resource.supplementary_data as Record<string, unknown>)
    : null;
  const related = sup && isRecord(sup.related_ids) ? (sup.related_ids as Record<string, unknown>) : null;
  const orderId = related ? asString(related.order_id) : "";
  if (orderId) return orderId;

  return "";
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

async function callSyncManyChat(args: {
  supabaseUrl: string;
  anonKey: string | null;
  leadId: string;
}): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (args.anonKey) {
    headers["apikey"] = args.anonKey;
    headers["Authorization"] = `Bearer ${args.anonKey}`;
  }

  try {
    await fetch(`${args.supabaseUrl}/functions/v1/sync-manychat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ leadId: args.leadId }),
    });
  } catch {
    // ignore
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, function: "paypal-webhook" }), {
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
  const PAYPAL_WEBHOOK_ID = getPayPalWebhookId();
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || null;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || !PAYPAL_WEBHOOK_ID || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[paypal-webhook] Missing required env vars");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();
  let parsedEvent: Record<string, unknown>;
  try {
    parsedEvent = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const event = parsedEvent as PayPalWebhookEvent;
  const eventId = asString(event.id);
  const eventType = asString(event.event_type);
  const resource = isRecord(event.resource) ? (event.resource as Record<string, unknown>) : {};

  if (!eventId || !eventType) {
    return new Response(JSON.stringify({ error: "Missing event id/type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const baseUrl = getPayPalBaseUrl();
  let accessToken = "";
  try {
    accessToken = await getPayPalAccessToken({
      baseUrl,
      clientId: PAYPAL_CLIENT_ID,
      clientSecret: PAYPAL_CLIENT_SECRET,
    });
  } catch {
    return new Response(JSON.stringify({ error: "PayPal auth failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const signature = await verifyPayPalWebhookSignature({
    baseUrl,
    token: accessToken,
    webhookId: PAYPAL_WEBHOOK_ID,
    headers: req.headers,
    event: parsedEvent,
  });

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const orderId = extractOrderIdFromEvent({ eventType, resource });

  // Record event (idempotent).
  const headersJson: Record<string, unknown> = {};
  for (const [k, v] of req.headers.entries()) {
    if (k.startsWith("paypal-") || k === "user-agent") headersJson[k] = v;
  }

  const { data: eventRow, error: insertError } = await supabaseAdmin
    .from("paypal_webhook_events")
    .upsert(
      {
        paypal_event_id: eventId,
        event_type: eventType,
        order_id: orderId || null,
        payload: parsedEvent,
        headers: headersJson,
        status: "received",
      },
      { onConflict: "paypal_event_id", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();

  if (insertError) {
    console.error("[paypal-webhook] Failed to record event:", insertError.message);
    return new Response(JSON.stringify({ error: "Failed to record event" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Duplicate — already processed
  if (!eventRow?.id) {
    return new Response(JSON.stringify({ ok: true, duplicate: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const dbEventId = eventRow.id as string;

  if (!signature.verified) {
    await supabaseAdmin.from("paypal_webhook_events").update({
      status: "failed",
      processing_error: signature.reason,
      processed_at: new Date().toISOString(),
    }).eq("id", dbEventId);

    return new Response(JSON.stringify({ error: signature.reason }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const shouldProcess =
    eventType === "CHECKOUT.ORDER.APPROVED" ||
    eventType === "CHECKOUT.ORDER.COMPLETED" ||
    eventType === "PAYMENT.CAPTURE.COMPLETED";

  if (!shouldProcess) {
    await supabaseAdmin.from("paypal_webhook_events").update({
      status: "ignored",
      processing_error: `Unhandled event type: ${eventType}`,
      processed_at: new Date().toISOString(),
    }).eq("id", dbEventId);

    return new Response(JSON.stringify({ ok: true, ignored: true, eventType }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!orderId) {
    await supabaseAdmin.from("paypal_webhook_events").update({
      status: "ignored",
      processing_error: "Missing order_id",
      processed_at: new Date().toISOString(),
    }).eq("id", dbEventId);

    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch full order info to extract lead + product reliably.
  const orderInfo = await paypalFetchJson({
    baseUrl,
    token: accessToken,
    method: "GET",
    path: `/v2/checkout/orders/${encodeURIComponent(orderId)}`,
  });

  if (!orderInfo.ok) {
    await supabaseAdmin.from("paypal_webhook_events").update({
      status: "failed",
      processing_error: "PayPal order lookup failed",
      processed_at: new Date().toISOString(),
    }).eq("id", dbEventId);

    return new Response(JSON.stringify({ error: "PayPal order lookup failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const purchaseUnits = Array.isArray(orderInfo.json.purchase_units)
    ? (orderInfo.json.purchase_units as unknown[])
    : [];
  const pu0 = purchaseUnits[0] as Record<string, unknown> | undefined;
  const product = pu0 && typeof pu0.reference_id === "string" ? (pu0.reference_id as string) : "";
  const leadId = pu0 && typeof pu0.custom_id === "string" ? (pu0.custom_id as string) : "";

  if (!leadId || !UUID_REGEX.test(leadId)) {
    await supabaseAdmin.from("paypal_webhook_events").update({
      status: "ignored",
      processing_error: "No valid lead_id in order",
      processed_at: new Date().toISOString(),
    }).eq("id", dbEventId);

    return new Response(JSON.stringify({ ok: true, ignored: true, reason: "no_lead_id" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const orderStatusRaw = typeof orderInfo.json.status === "string" ? orderInfo.json.status : "";
  const orderStatus = orderStatusRaw.trim().toUpperCase();
  let completed = orderStatus === "COMPLETED";

  // If approved but not completed, capture it (server-side) so we don't rely on return URL.
  if (!completed && eventType === "CHECKOUT.ORDER.APPROVED") {
    if (isShippingProduct(product)) {
      const shippingCountry = getOrderShippingCountryCode(orderInfo.json);
      if (!shippingCountry) {
        await supabaseAdmin.from("paypal_webhook_events").update({
          status: "ignored",
          lead_id: leadId,
          processing_error: "Shipping address missing; not capturing",
          processed_at: new Date().toISOString(),
        }).eq("id", dbEventId);

        return new Response(JSON.stringify({ ok: true, captured: false, code: "SHIPPING_ADDRESS_REQUIRED" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (shippingCountry !== "US") {
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

        await supabaseAdmin.from("paypal_webhook_events").update({
          status: "processed",
          lead_id: leadId,
          processing_error: `Shipping country not allowed: ${shippingCountry}`,
          processed_at: new Date().toISOString(),
        }).eq("id", dbEventId);

        return new Response(JSON.stringify({ ok: true, captured: false, code: "SHIPPING_COUNTRY_NOT_ALLOWED" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
      // If captured elsewhere, refresh and continue.
      const refreshed = await paypalFetchJson({
        baseUrl,
        token: accessToken,
        method: "GET",
        path: `/v2/checkout/orders/${encodeURIComponent(orderId)}`,
      });

      const refreshedStatusRaw = typeof refreshed.json.status === "string" ? refreshed.json.status : "";
      completed = refreshed.ok && refreshedStatusRaw.trim().toUpperCase() === "COMPLETED";
    } else {
      const captureStatus = typeof captureInfo.json.status === "string" ? captureInfo.json.status : "";
      completed = captureStatus.trim().toUpperCase() === "COMPLETED";
    }
  }

  if (!completed) {
    await supabaseAdmin.from("paypal_webhook_events").update({
      status: "ignored",
      lead_id: leadId,
      processing_error: `Order not completed: ${orderStatusRaw || "unknown"}`,
      processed_at: new Date().toISOString(),
    }).eq("id", dbEventId);

    return new Response(JSON.stringify({ ok: true, ignored: true, reason: "not_completed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch lead (for tags + Shippo address fallback).
  const { data: lead, error: leadError } = await supabaseAdmin
    .from("leads")
    .select("id,name,email,phone,tags,paid_at,payment_id,payment_provider,shipping_label_url,shipping_tracking_number")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError || !lead) {
    await supabaseAdmin.from("paypal_webhook_events").update({
      status: "failed",
      lead_id: leadId,
      processing_error: leadError?.message || "Lead not found",
      processed_at: new Date().toISOString(),
    }).eq("id", dbEventId);

    return new Response(JSON.stringify({ error: "Lead not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // If we already processed this order for this lead, only attempt shipping label if needed.
  const alreadyMarkedPaid =
    Boolean(lead.paid_at) &&
    asString(lead.payment_provider).toLowerCase() === "paypal" &&
    asString(lead.payment_id) === orderId;

  const baseTags = mergeTags(lead.tags, ["paid_paypal", "paypal_webhook"]);

  if (!alreadyMarkedPaid) {
    const updatePayload: Record<string, unknown> = {
      paid_at: new Date().toISOString(),
      payment_provider: "paypal",
      payment_id: orderId,
      tags: baseTags,
      funnel_step: "paid",
    };

    // Track which product was purchased (best-effort).
    if (product) updatePayload.intent_plan = product;

    const { error: updateError } = await supabaseAdmin
      .from("leads")
      .update(updatePayload)
      .eq("id", leadId);

    if (updateError) {
      await supabaseAdmin.from("paypal_webhook_events").update({
        status: "failed",
        lead_id: leadId,
        processing_error: `Lead update failed: ${updateError.message}`,
        processed_at: new Date().toISOString(),
      }).eq("id", dbEventId);

      return new Response(JSON.stringify({ error: "Failed to update lead" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Best-effort: sync ManyChat so paid tags apply even if buyer closes the tab.
    await callSyncManyChat({ supabaseUrl: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY, leadId });
  }

  // Shipping label creation (best-effort) for physical products.
  if (isShippingProduct(product)) {
    const alreadyHasLabel =
      Boolean(lead.shipping_label_url) ||
      Boolean(lead.shipping_tracking_number) ||
      baseTags.includes("shippo_label_created") ||
      baseTags.includes("shippo_label");

    const shippingCountry = getOrderShippingCountryCode(orderInfo.json);
    const shippingAllowed = shippingCountry === "US";

    if (!alreadyHasLabel && shippingAllowed) {
      const shippoToken = getShippoToken();
      const fromAddress = getShippoFromAddress();
      const toAddress = buildShippoToAddress({
        lead: { name: lead.name, email: lead.email, phone: lead.phone },
        orderInfo: orderInfo.json,
      });

      if (shippoToken && fromAddress && toAddress) {
        try {
          const label = await createShippoLabel({
            token: shippoToken,
            fromAddress,
            toAddress,
            metadata: {
              lead_id: leadId,
              provider: "paypal",
              order_id: orderId,
              product,
            },
          });

          const tagsWithShippo = mergeTags(baseTags, ["shippo_label_created", "shippo_label"]);
          await supabaseAdmin
            .from("leads")
            .update({
              tags: tagsWithShippo,
              shipping_to: toAddress,
              shipping_label_url: label.labelUrl,
              shipping_tracking_number: label.trackingNumber,
              shipping_carrier: label.carrier || null,
              shipping_servicelevel: label.servicelevel || null,
              shipping_status: "label_created",
            })
            .eq("id", leadId);
        } catch {
          const tagsNeedsShipping = mergeTags(baseTags, ["needs_shipping"]);
          await supabaseAdmin.from("leads").update({ tags: tagsNeedsShipping }).eq("id", leadId);
        }
      }
    } else if (!shippingAllowed) {
      const tagsNotAllowed = mergeTags(baseTags, ["shipping_not_allowed"]);
      await supabaseAdmin.from("leads").update({ tags: tagsNotAllowed }).eq("id", leadId);
    }
  }

  await supabaseAdmin.from("paypal_webhook_events").update({
    status: "processed",
    lead_id: leadId,
    processed_at: new Date().toISOString(),
  }).eq("id", dbEventId);

  return new Response(JSON.stringify({ ok: true, processed: true, leadId, orderId }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

