import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, shippo-auth-signature, x-shippo-auth-signature",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ShippoWebhookPayload = {
  event?: unknown;
  event_type?: unknown;
  test?: unknown;
  data?: unknown;
};

type ShippoTrackingStatus = {
  status?: unknown;
  status_date?: unknown;
  object_updated?: unknown;
  status_details?: unknown;
};

type ShippoWebhookEventInsert = {
  shippo_event: string;
  tracking_number: string | null;
  event_fingerprint: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  status: "received" | "processed" | "ignored" | "failed";
  lead_id?: string;
  processing_error?: string | null;
  processed_at?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTrackingNumber(value: string): string {
  return value.replace(/[\s-]+/g, "").toUpperCase();
}

function normalizeShippingStatus(raw: string): string {
  const status = raw.trim().toUpperCase().replace(/\s+/g, "_");
  if (!status) return "";

  switch (status) {
    case "TRANSIT":
      return "in_transit";
    case "PRE_TRANSIT":
      return "pre_transit";
    case "OUT_FOR_DELIVERY":
      return "out_for_delivery";
    case "DELIVERED":
      return "delivered";
    case "RETURNED":
      return "returned";
    case "FAILURE":
      return "delivery_failed";
    case "AVAILABLE_FOR_PICKUP":
    case "READY_FOR_PICKUP":
      return "available_for_pickup";
    case "UNKNOWN":
      return "unknown";
    default:
      return status.toLowerCase();
  }
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
  for (const t of add) {
    const norm = t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (norm) set.add(norm);
  }
  return Array.from(set).slice(0, 30);
}

type SupabaseUpdateLike = {
  eq: (column: string, value: string) => Promise<unknown>;
};

type SupabaseFromLike = {
  update: (values: Record<string, unknown>) => SupabaseUpdateLike;
};

type SupabaseAdminLike = {
  from: (table: string) => SupabaseFromLike;
};

function extractLeadIdFromMetadata(value: unknown): string | null {
  if (!value) return null;

  if (isRecord(value)) {
    const maybeLeadId = asString(value.lead_id);
    if (maybeLeadId && UUID_REGEX.test(maybeLeadId)) return maybeLeadId;
  }

  if (typeof value !== "string") return null;
  const metadata = value.trim();
  if (!metadata) return null;

  try {
    const parsed = JSON.parse(metadata) as unknown;
    if (isRecord(parsed)) {
      const maybeLeadId = asString(parsed.lead_id);
      if (maybeLeadId && UUID_REGEX.test(maybeLeadId)) return maybeLeadId;
    }
  } catch {
    // ignore JSON parse errors and fallback to regex parsing.
  }

  const match = metadata.match(/["']?lead_id["']?\s*[:=]\s*["']?([0-9a-fA-F-]{36})["']?/i);
  if (match && match[1] && UUID_REGEX.test(match[1])) {
    return match[1];
  }

  return null;
}

function extractShippoUpdate(payload: ShippoWebhookPayload): {
  eventType: string;
  trackingNumber: string;
  normalizedStatus: string;
  statusDate: string;
  statusDetails: string;
  carrier: string;
  trackingUrlProvider: string;
  servicelevel: string;
  metadata: unknown;
} {
  const eventType = asString(payload.event || payload.event_type).toLowerCase();
  const data = isRecord(payload.data) ? payload.data : {};

  const trackingNumberRaw = asString(data.tracking_number);
  const trackingNumber = normalizeTrackingNumber(trackingNumberRaw);

  let rawStatus = "";
  let statusDate = "";
  let statusDetails = "";

  const trackingStatus = data.tracking_status;
  if (isRecord(trackingStatus)) {
    const trackingStatusObj = trackingStatus as ShippoTrackingStatus;
    rawStatus = asString(trackingStatusObj.status);
    statusDate =
      asString(trackingStatusObj.status_date) ||
      asString(trackingStatusObj.object_updated);
    statusDetails = asString(trackingStatusObj.status_details);
  } else if (typeof trackingStatus === "string") {
    rawStatus = trackingStatus;
  }

  if (!rawStatus) {
    // Transaction webhooks can still send the status as string.
    rawStatus = asString(data.status);
  }

  if (!statusDate) {
    statusDate = asString(data.object_updated) || asString(data.object_created);
  }

  const normalizedStatus = normalizeShippingStatus(rawStatus);
  const carrier =
    asString(data.carrier) ||
    asString((data.rate as Record<string, unknown> | undefined)?.provider);
  const trackingUrlProvider = asString(data.tracking_url_provider);

  const servicelevelValue = data.servicelevel;
  let servicelevel = "";
  if (isRecord(servicelevelValue)) {
    servicelevel = asString(servicelevelValue.name) || asString(servicelevelValue.token);
  }

  return {
    eventType,
    trackingNumber,
    normalizedStatus,
    statusDate,
    statusDetails,
    carrier,
    trackingUrlProvider,
    servicelevel,
    metadata: data.metadata,
  };
}

function statusTags(status: string): string[] {
  switch (status) {
    case "pre_transit":
      return ["shipping_pre_transit"];
    case "in_transit":
      return ["shipping_in_transit"];
    case "out_for_delivery":
      return ["shipping_out_for_delivery"];
    case "delivered":
      return ["shipping_delivered"];
    case "returned":
      return ["shipping_returned"];
    case "delivery_failed":
    case "unknown":
      return ["shipping_issue"];
    default:
      return ["shipping_updated"];
  }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return toHex(new Uint8Array(digest));
}

function parseShippoSignatureHeader(headerValue: string): {
  timestamp: string;
  signature: string;
} | null {
  if (!headerValue) return null;
  const parts = headerValue.split(",").map((s) => s.trim());

  let timestamp = "";
  let signature = "";

  for (const part of parts) {
    const [k, v] = part.split("=");
    if (!k || !v) continue;
    const key = k.trim().toLowerCase();
    const val = v.trim();
    if (key === "t") timestamp = val;
    if (key === "v1") signature = val.toLowerCase();
  }

  if (!timestamp || !signature) return null;
  return { timestamp, signature };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function computeHmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );

  return toHex(new Uint8Array(signature));
}

async function verifyShippoSecurity(req: Request, rawBody: string): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const url = new URL(req.url);

  const tokenExpected = Deno.env.get("SHIPPO_WEBHOOK_TOKEN") || "";
  const hmacSecret = Deno.env.get("SHIPPO_HMAC_SECRET") || "";
  const requireAuth =
    (Deno.env.get("SHIPPO_WEBHOOK_REQUIRE_AUTH") || "true").toLowerCase() !==
    "false";

  if (!requireAuth) return { ok: true };

  if (!tokenExpected && !hmacSecret) {
    return {
      ok: false,
      reason:
        "SHIPPO webhook auth required but no SHIPPO_WEBHOOK_TOKEN/SHIPPO_HMAC_SECRET configured",
    };
  }

  if (tokenExpected) {
    const token = url.searchParams.get("token") || "";
    if (token !== tokenExpected) {
      return { ok: false, reason: "Invalid Shippo token" };
    }
  }

  if (hmacSecret) {
    const signatureHeader =
      req.headers.get("shippo-auth-signature") ||
      req.headers.get("x-shippo-auth-signature") ||
      "";

    const parsedHeader = parseShippoSignatureHeader(signatureHeader);
    if (!parsedHeader) {
      return { ok: false, reason: "Missing/invalid Shippo HMAC signature header" };
    }

    const toleranceSeconds = Number.parseInt(
      Deno.env.get("SHIPPO_HMAC_TOLERANCE_SECONDS") || "600",
      10,
    );

    if (Number.isFinite(toleranceSeconds) && toleranceSeconds > 0) {
      const nowSec = Math.floor(Date.now() / 1000);
      const ts = Number.parseInt(parsedHeader.timestamp, 10);
      if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > toleranceSeconds) {
        return { ok: false, reason: "Shippo HMAC timestamp outside tolerance" };
      }
    }

    const signedPayload = `${parsedHeader.timestamp}.${rawBody}`;
    const expectedSig = await computeHmacSha256Hex(hmacSecret, signedPayload);
    if (!timingSafeEqualHex(expectedSig, parsedHeader.signature)) {
      return { ok: false, reason: "Invalid Shippo HMAC signature" };
    }
  }

  return { ok: true };
}

async function updateWebhookEvent(
  supabaseAdmin: SupabaseAdminLike,
  eventId: string,
  patch: Partial<ShippoWebhookEventInsert>,
): Promise<void> {
  await supabaseAdmin
    .from("shippo_webhook_events")
    .update({
      ...patch,
      processed_at: patch.processed_at || new Date().toISOString(),
    })
    .eq("id", eventId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, function: "shippo-webhook" }), {
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

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();

  const security = await verifyShippoSecurity(req, rawBody);
  if (!security.ok) {
    return new Response(JSON.stringify({ error: security.reason || "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let parsed: ShippoWebhookPayload;
  try {
    parsed = JSON.parse(rawBody) as ShippoWebhookPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payloadObj = isRecord(parsed)
    ? (parsed as Record<string, unknown>)
    : ({} as Record<string, unknown>);

  const extracted = extractShippoUpdate(parsed);
  const fingerprint = await sha256Hex(
    JSON.stringify({
      eventType: extracted.eventType,
      trackingNumber: extracted.trackingNumber,
      status: extracted.normalizedStatus,
      statusDate: extracted.statusDate,
      metadataLeadId: extractLeadIdFromMetadata(extracted.metadata),
      test: Boolean(parsed.test),
      body: payloadObj,
    }),
  );

  const requestHeaders: Record<string, string> = {
    "shippo-api-version": req.headers.get("shippo-api-version") || "",
    "shippo-auth-signature":
      req.headers.get("shippo-auth-signature") ||
      req.headers.get("x-shippo-auth-signature") ||
      "",
  };

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const eventInsert: ShippoWebhookEventInsert = {
    shippo_event: extracted.eventType || "unknown",
    tracking_number: extracted.trackingNumber || null,
    event_fingerprint: fingerprint,
    payload: payloadObj,
    headers: requestHeaders,
    status: "received",
  };

  const { data: eventRow, error: eventInsertError } = await supabaseAdmin
    .from("shippo_webhook_events")
    .upsert(eventInsert, {
      onConflict: "event_fingerprint",
      ignoreDuplicates: true,
    })
    .select("id")
    .maybeSingle();

  if (eventInsertError) {
    console.error("[shippo-webhook] Failed to record event", eventInsertError.message);
    return new Response(JSON.stringify({ error: "Failed to record webhook" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!eventRow?.id) {
    return new Response(JSON.stringify({ ok: true, duplicate: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const eventId = eventRow.id as string;

  const supportedEvent =
    extracted.eventType === "track_updated" ||
    extracted.eventType === "transaction_updated" ||
    extracted.eventType === "transaction_created";

  if (!supportedEvent || !extracted.trackingNumber || !extracted.normalizedStatus) {
    await updateWebhookEvent(supabaseAdmin, eventId, {
      status: "ignored",
      processing_error:
        !supportedEvent
          ? "Unsupported event type"
          : "Missing tracking number or status",
    });

    return new Response(
      JSON.stringify({ ok: true, ignored: true, reason: "unsupported_or_missing_data" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const metadataLeadId = extractLeadIdFromMetadata(extracted.metadata);

  let lead: Record<string, unknown> | null = null;
  if (metadataLeadId) {
    const byId = await supabaseAdmin
      .from("leads")
      .select("id,name,source_page,tags,shipping_status,shipping_tracking_number,shipping_label_url")
      .eq("id", metadataLeadId)
      .maybeSingle();
    if (!byId.error && byId.data) lead = byId.data;
  }

  if (!lead) {
    const byTracking = await supabaseAdmin
      .from("leads")
      .select("id,name,source_page,tags,shipping_status,shipping_tracking_number,shipping_label_url")
      .eq("shipping_tracking_number", extracted.trackingNumber)
      .maybeSingle();
    if (!byTracking.error && byTracking.data) lead = byTracking.data;
  }

  if (!lead) {
    await updateWebhookEvent(supabaseAdmin, eventId, {
      status: "ignored",
      processing_error: "Lead not found for tracking number",
    });

    return new Response(JSON.stringify({ ok: true, ignored: true, reason: "lead_not_found" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const leadId = asString(lead.id);

  const updatedTags = mergeTags(lead.tags, [
    "shippo_webhook",
    "shipping_update",
    ...statusTags(extracted.normalizedStatus),
  ]);

  const currentLabelUrl = asString(lead.shipping_label_url);
  const sourcePage = asString(lead.source_page).toLowerCase();
  const language = sourcePage.startsWith("/en") ? "en" : "es";
  const shippingDedupeKey = `lead:${leadId}:shipping:${extracted.normalizedStatus}:${extracted.trackingNumber}`;

  const updatePayload: Record<string, unknown> = {
    shipping_status: extracted.normalizedStatus,
    shipping_tracking_number: extracted.trackingNumber,
    tags: updatedTags,
  };

  if (extracted.carrier) {
    updatePayload.shipping_carrier = extracted.carrier;
  }

  if (extracted.servicelevel) {
    updatePayload.shipping_servicelevel = extracted.servicelevel;
  }

  // Keep the original label URL if present; otherwise save provider tracking URL.
  if (!currentLabelUrl && extracted.trackingUrlProvider) {
    updatePayload.shipping_label_url = extracted.trackingUrlProvider;
  }

  const { error: updateLeadError } = await supabaseAdmin
    .from("leads")
    .update(updatePayload)
    .eq("id", leadId);

  if (updateLeadError) {
    await updateWebhookEvent(supabaseAdmin, eventId, {
      status: "failed",
      lead_id: leadId,
      processing_error: `Lead update failed: ${updateLeadError.message}`,
    });

    return new Response(JSON.stringify({ error: "Failed to update lead shipping state" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Best-effort explicit queue call so shipping emails continue to work
  // even if DB triggers were not applied yet.
  try {
    await supabaseAdmin.rpc("queue_email_for_lead", {
      p_lead_id: leadId,
      p_template_key: "shipping_update",
      p_subject: language === "en" ? "Shipping update" : "Actualización de envío",
      p_payload: {
        lead_id: leadId,
        name: asString(lead.name) || "DJ",
        shipping_status: extracted.normalizedStatus,
        shipping_tracking_number: extracted.trackingNumber,
        shipping_label_url: currentLabelUrl || extracted.trackingUrlProvider || null,
        shipping_carrier: extracted.carrier || null,
      },
      p_lang: language,
      p_dedupe_key: shippingDedupeKey,
    });
  } catch {
    // ignore: webhook processing should not fail if queue helper is unavailable.
  }

  await updateWebhookEvent(supabaseAdmin, eventId, {
    status: "processed",
    lead_id: leadId,
    processing_error: extracted.statusDetails || null,
  });

  return new Response(
    JSON.stringify({
      ok: true,
      processed: true,
      leadId,
      trackingNumber: extracted.trackingNumber,
      shippingStatus: extracted.normalizedStatus,
      eventType: extracted.eventType,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
