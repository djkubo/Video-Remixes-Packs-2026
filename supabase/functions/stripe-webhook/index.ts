import { createClient } from "npm:@supabase/supabase-js@2";
import { createShippoLabel, getShippoFromAddress, getShippoToken, type ShippoAddress } from "../_shared/shippo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_INPUT_REGEX = /^\+?\d{7,20}$/;

function cleanEmail(value: unknown): string | null {
  const email = asString(value).toLowerCase();
  if (!email || email.length > 255) return null;
  return EMAIL_REGEX.test(email) ? email : null;
}

function cleanName(value: unknown): string | null {
  const name = asString(value);
  if (!name) return null;
  return name.length > 120 ? name.slice(0, 120) : name;
}

function cleanPhone(value: unknown): string | null {
  const raw = asString(value);
  if (!raw) return null;
  const cleaned = raw.replace(/[\s().-]/g, "");
  const digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
  if (cleaned.length > 20) return null;
  if (!PHONE_INPUT_REGEX.test(cleaned)) return null;
  if (!/[1-9]/.test(digits)) return null;
  return cleaned;
}

// ── Stripe signature verification ──────────────────────────────────────────

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function computeHmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string,
  toleranceSeconds = 300,
): Promise<{ verified: boolean; reason?: string }> {
  if (!signatureHeader) return { verified: false, reason: "Missing stripe-signature header" };

  const parts: Record<string, string[]> = {};
  for (const item of signatureHeader.split(",")) {
    const [key, val] = item.split("=", 2);
    if (!key || !val) continue;
    const k = key.trim();
    if (!parts[k]) parts[k] = [];
    parts[k].push(val.trim());
  }

  const timestamps = parts["t"] || [];
  const signatures = parts["v1"] || [];
  if (!timestamps.length || !signatures.length) {
    return { verified: false, reason: "Missing t or v1 in signature header" };
  }

  const timestamp = timestamps[0];
  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return { verified: false, reason: "Invalid timestamp" };

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > toleranceSeconds) {
    return { verified: false, reason: "Timestamp outside tolerance" };
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = await computeHmacSha256Hex(webhookSecret, signedPayload);

  for (const sig of signatures) {
    if (timingSafeEqual(expected, sig.toLowerCase())) {
      return { verified: true };
    }
  }

  return { verified: false, reason: "Signature mismatch" };
}

// ── Shippo label helper (same logic as stripe-checkout verify) ─────────────

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
  const city = typeof addr.city === "string" ? addr.city : "";
  const state = typeof addr.state === "string" ? addr.state : "";
  const zip = typeof addr.postal_code === "string" ? addr.postal_code : "";
  const country = typeof addr.country === "string" ? addr.country : "";

  if (!name || !street1 || !city || !state || !zip || !country) return null;

  return {
    name,
    street1,
    street2: typeof addr.line2 === "string" ? addr.line2 : undefined,
    city,
    state,
    zip,
    country,
    phone:
      (customerDetails && typeof customerDetails.phone === "string" && customerDetails.phone) ||
      args.lead.phone,
    email:
      (customerDetails && typeof customerDetails.email === "string" && customerDetails.email) ||
      args.lead.email,
  };
}

const SHIPPING_PRODUCTS = new Set(["usb128", "usb_500gb"]);

// ── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, function: "stripe-webhook" }), {
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

  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!STRIPE_WEBHOOK_SECRET || !STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[stripe-webhook] Missing required env vars");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("stripe-signature") || "";

  const { verified, reason } = await verifyStripeSignature(rawBody, signatureHeader, STRIPE_WEBHOOK_SECRET);
  if (!verified) {
    console.error("[stripe-webhook] Signature verification failed:", reason);
    return new Response(JSON.stringify({ error: reason || "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const eventId = asString(event.id);
  const eventType = asString(event.type);

  if (!eventId || !eventType) {
    return new Response(JSON.stringify({ error: "Missing event id/type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // ── Idempotency: record event ──────────────────────────────────────────

  const { data: eventRow, error: insertError } = await supabaseAdmin
    .from("stripe_webhook_events")
    .upsert(
      {
        stripe_event_id: eventId,
        event_type: eventType,
        payload: event,
        status: "received",
      },
      { onConflict: "stripe_event_id", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();

  if (insertError) {
    console.error("[stripe-webhook] Failed to record event:", insertError.message);
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

  // ── Handle checkout.session.completed ──────────────────────────────────

  if (eventType === "checkout.session.completed") {
    const session = isRecord(event.data) && isRecord((event.data as Record<string, unknown>).object)
      ? ((event.data as Record<string, unknown>).object as Record<string, unknown>)
      : null;

    if (!session) {
      await supabaseAdmin.from("stripe_webhook_events").update({
        status: "ignored",
        processing_error: "Missing session object",
        processed_at: new Date().toISOString(),
      }).eq("id", dbEventId);

      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentStatus = asString(session.payment_status);
    const paid = paymentStatus === "paid" || paymentStatus === "no_payment_required";

    if (!paid) {
      await supabaseAdmin.from("stripe_webhook_events").update({
        status: "ignored",
        processing_error: `Payment not completed: ${paymentStatus}`,
        processed_at: new Date().toISOString(),
      }).eq("id", dbEventId);

      return new Response(JSON.stringify({ ok: true, ignored: true, reason: "not_paid" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract lead ID from metadata or client_reference_id
    const metadata = isRecord(session.metadata) ? (session.metadata as Record<string, unknown>) : {};
    const leadId =
      asString(metadata.lead_id) ||
      asString(session.client_reference_id);

    if (!leadId || !UUID_REGEX.test(leadId)) {
      await supabaseAdmin.from("stripe_webhook_events").update({
        status: "ignored",
        processing_error: "No valid lead_id in session",
        processed_at: new Date().toISOString(),
      }).eq("id", dbEventId);

      return new Response(JSON.stringify({ ok: true, ignored: true, reason: "no_lead_id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const product = asString(metadata.product);
    const stripeSessionId = asString(session.id);
    const dedupeKey = `lead:${leadId}:payment:stripe:${stripeSessionId || eventId}`;

    const customerDetails = isRecord(session.customer_details)
      ? (session.customer_details as Record<string, unknown>)
      : null;
    const shippingDetails = isRecord(session.shipping_details)
      ? (session.shipping_details as Record<string, unknown>)
      : null;

    const sessionEmail = customerDetails ? cleanEmail(customerDetails.email) : null;
    const sessionPhone = customerDetails ? cleanPhone(customerDetails.phone) : null;
    const sessionName =
      (shippingDetails && cleanName(shippingDetails.name)) ||
      (customerDetails && cleanName(customerDetails.name)) ||
      "DJ";

    // Fetch lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("id,name,email,phone,source_page,tags,paid_at,shipping_tracking_number,shipping_label_url")
      .eq("id", leadId)
      .maybeSingle();

    if (leadError) {
      await supabaseAdmin.from("stripe_webhook_events").update({
        status: "failed",
        lead_id: leadId,
        processing_error: leadError.message,
        processed_at: new Date().toISOString(),
      }).eq("id", dbEventId);

      return new Response(JSON.stringify({ error: "Lead lookup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let ensuredLead = lead as typeof lead | null;
    if (!ensuredLead) {
      const sourcePage = asString(metadata.source_page) || null;
      const source = asString(metadata.source) || product || "stripe";
      const tags = mergeTags([], [product || "unknown_product", "paid_stripe", "stripe_webhook"]);

      const insertPayloadFull: Record<string, unknown> = {
        id: leadId,
        name: sessionName,
        email: sessionEmail || "pending",
        phone: sessionPhone || "",
        source,
        tags,
        source_page: sourcePage,
        intent_plan: product || null,
        funnel_step: "paid",
        paid_at: new Date().toISOString(),
        payment_provider: "stripe",
        payment_id: stripeSessionId || eventId,
        consent_transactional: true,
        consent_transactional_at: new Date().toISOString(),
      };

      try {
        const { error: insertError } = await supabaseAdmin.from("leads").insert(insertPayloadFull);
        if (insertError) throw insertError;
      } catch {
        const leadSelect =
          "id,name,email,phone,source_page,tags,paid_at,shipping_tracking_number,shipping_label_url";

        // If optional columns haven't been migrated yet, fall back to minimal insert.
        const insertPayloadMinimal: Record<string, unknown> = {
          id: leadId,
          name: sessionName,
          email: sessionEmail || "pending",
          phone: sessionPhone || "",
          source,
          tags,
        };

        const { error: insertError } = await supabaseAdmin.from("leads").insert(insertPayloadMinimal);

        if (insertError) {
          // Race/duplicate: if the row exists, just reload and continue.
          const { data: existingLead } = await supabaseAdmin
            .from("leads")
            .select(leadSelect)
            .eq("id", leadId)
            .maybeSingle();

          if (!existingLead) {
            await supabaseAdmin.from("stripe_webhook_events").update({
              status: "failed",
              lead_id: leadId,
              processing_error: `Lead insert failed: ${insertError.message}`,
              processed_at: new Date().toISOString(),
            }).eq("id", dbEventId);

            return new Response(JSON.stringify({ error: "Lead insert failed" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          ensuredLead = existingLead;
        }
      }

      const { data: reloaded } = await supabaseAdmin
        .from("leads")
        .select("id,name,email,phone,source_page,tags,paid_at,shipping_tracking_number,shipping_label_url")
        .eq("id", leadId)
        .maybeSingle();

      ensuredLead = reloaded || null;
    }

    if (!ensuredLead) {
      await supabaseAdmin.from("stripe_webhook_events").update({
        status: "failed",
        lead_id: leadId,
        processing_error: "Lead missing after insert",
        processed_at: new Date().toISOString(),
      }).eq("id", dbEventId);

      return new Response(JSON.stringify({ error: "Lead missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update lead with payment info
    const newTags = mergeTags(ensuredLead.tags, [
      "paid_stripe",
      "stripe_webhook",
      ...(product ? [product] : []),
    ]);
    const updatePayload: Record<string, unknown> = {
      paid_at: new Date().toISOString(),
      payment_provider: "stripe",
      payment_id: stripeSessionId || eventId,
      tags: newTags,
      funnel_step: "paid",
      consent_transactional: true,
      consent_transactional_at: new Date().toISOString(),
    };

    if (product) {
      updatePayload.intent_plan = product;
    }

    if (sessionEmail) updatePayload.email = sessionEmail;
    if (sessionPhone) updatePayload.phone = sessionPhone;
    if (sessionName) updatePayload.name = sessionName;

    const { error: updateError } = await supabaseAdmin
      .from("leads")
      .update(updatePayload)
      .eq("id", leadId);

    if (updateError) {
      console.error("[stripe-webhook] Failed to update lead:", updateError.message);
      await supabaseAdmin.from("stripe_webhook_events").update({
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

    // Record order event (idempotent via dedupe_key)
    try {
      await supabaseAdmin.from("order_events").insert({
        lead_id: leadId,
        event_type: "payment_confirmed",
        event_source: "stripe_webhook",
        event_key: dedupeKey,
        event_payload: {
          stripe_event_id: eventId,
          stripe_session_id: stripeSessionId,
          payment_status: paymentStatus,
          product,
        },
      });
    } catch {
      // Best-effort — dedupe_key conflict is expected if already recorded
    }

    // ── Shippo label creation for physical products ──────────────────────

    let shippoResult: { ok: boolean; trackingNumber?: string; labelUrl?: string } | undefined;

    if (product && SHIPPING_PRODUCTS.has(product)) {
      const alreadyHasLabel = ensuredLead.shipping_tracking_number || ensuredLead.shipping_label_url ||
        newTags.includes("shippo_label_created");

      if (!alreadyHasLabel) {
        try {
          const shippoToken = getShippoToken();
          const fromAddress = getShippoFromAddress();
          const toAddress = buildShippoToAddressFromStripe({ lead: ensuredLead, session });

          if (shippoToken && fromAddress && toAddress) {
            const label = await createShippoLabel({
              token: shippoToken,
              fromAddress,
              toAddress,
              metadata: { lead_id: leadId, product },
            });

            const shippoTags = mergeTags(newTags, ["shippo_label_created"]);
            await supabaseAdmin.from("leads").update({
              shipping_label_url: label.labelUrl,
              shipping_tracking_number: label.trackingNumber,
              shipping_carrier: label.carrier || null,
              shipping_servicelevel: label.servicelevel || null,
              shipping_status: "label_created",
              shipping_to: toAddress,
              tags: shippoTags,
            }).eq("id", leadId);

            shippoResult = { ok: true, trackingNumber: label.trackingNumber, labelUrl: label.labelUrl };
          }
        } catch (e) {
          console.error("[stripe-webhook] Shippo label failed:", e);
          shippoResult = { ok: false };
        }
      }
    }

    // Mark webhook event as processed
    await supabaseAdmin.from("stripe_webhook_events").update({
      status: "processed",
      lead_id: leadId,
      processed_at: new Date().toISOString(),
    }).eq("id", dbEventId);

    return new Response(JSON.stringify({
      ok: true,
      processed: true,
      leadId,
      product,
      shippo: shippoResult,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Unhandled event types ──────────────────────────────────────────────

  await supabaseAdmin.from("stripe_webhook_events").update({
    status: "ignored",
    processing_error: `Unhandled event type: ${eventType}`,
    processed_at: new Date().toISOString(),
  }).eq("id", dbEventId);

  return new Response(JSON.stringify({ ok: true, ignored: true, eventType }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
