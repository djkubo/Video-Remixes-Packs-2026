import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-email-worker-token",
};

type QueueJob = {
  id: string;
  lead_id: string;
  email_to: string;
  template_key: string;
  template_lang: string;
  subject: string;
  payload: unknown;
  retry_count: number;
};

type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().replace("T", " ").replace(".000Z", " UTC");
}

function renderTemplate(job: QueueJob): RenderedEmail {
  const lang = job.template_lang === "en" ? "en" : "es";
  const payload = isRecord(job.payload) ? job.payload : {};

  const name = asString(payload.name, lang === "es" ? "DJ" : "DJ");
  const provider = asString(payload.payment_provider, "").toUpperCase();
  const paymentId = asString(payload.payment_id, "");
  const paidAt = formatDate(asString(payload.paid_at, ""));
  const shippingStatus = asString(payload.shipping_status, "");
  const tracking = asString(payload.shipping_tracking_number, "");
  const labelUrl = asString(payload.shipping_label_url, "");
  const carrier = asString(payload.shipping_carrier, "");

  if (job.template_key === "lead_received") {
    if (lang === "en") {
      return {
        subject: job.subject || "We received your request",
        html: `<h2>Hello ${escapeHtml(name)}, your request is confirmed</h2><p>We already registered your details and our team will follow up shortly with your next steps.</p><p>Thanks for choosing VideoRemixesPack.</p>`,
        text: `Hello ${name}, your request is confirmed. We registered your details and our team will follow up shortly with your next steps.`,
      };
    }

    return {
      subject: job.subject || "Recibimos tu solicitud",
      html: `<h2>Hola ${escapeHtml(name)}, ya recibimos tu solicitud</h2><p>Ya registramos tus datos y en breve te compartimos los siguientes pasos.</p><p>Gracias por elegir VideoRemixesPack.</p>`,
      text: `Hola ${name}, ya recibimos tu solicitud. En breve te compartimos los siguientes pasos.`,
    };
  }

  if (job.template_key === "payment_confirmed") {
    if (lang === "en") {
      return {
        subject: job.subject || "Payment confirmed",
        html: `<h2>Payment confirmed</h2><p>Hi ${escapeHtml(name)}, your payment has been confirmed.</p><ul><li>Provider: ${escapeHtml(provider || "N/A")}</li><li>Payment ID: ${escapeHtml(paymentId || "N/A")}</li><li>Date: ${escapeHtml(paidAt || "N/A")}</li></ul><p>We will send your next update by email/WhatsApp.</p>`,
        text: `Payment confirmed. Hi ${name}, your payment has been confirmed. Provider: ${provider || "N/A"}. Payment ID: ${paymentId || "N/A"}. Date: ${paidAt || "N/A"}.`,
      };
    }

    return {
      subject: job.subject || "Pago confirmado",
      html: `<h2>Pago confirmado</h2><p>Hola ${escapeHtml(name)}, tu pago ya fue confirmado.</p><ul><li>Proveedor: ${escapeHtml(provider || "N/A")}</li><li>ID de pago: ${escapeHtml(paymentId || "N/A")}</li><li>Fecha: ${escapeHtml(paidAt || "N/A")}</li></ul><p>Te compartiremos la siguiente actualización por email/WhatsApp.</p>`,
      text: `Pago confirmado. Hola ${name}, tu pago ya fue confirmado. Proveedor: ${provider || "N/A"}. ID: ${paymentId || "N/A"}. Fecha: ${paidAt || "N/A"}.`,
    };
  }

  if (job.template_key === "shipping_update") {
    const trackingLine = tracking
      ? lang === "en"
        ? `Tracking: ${tracking}`
        : `Guía: ${tracking}`
      : lang === "en"
        ? "Tracking: pending"
        : "Guía: pendiente";

    const carrierLine = carrier
      ? lang === "en"
        ? `Carrier: ${carrier}`
        : `Paquetería: ${carrier}`
      : "";

    const labelLine = labelUrl
      ? lang === "en"
        ? `Label/Tracking URL: ${labelUrl}`
        : `URL de etiqueta/seguimiento: ${labelUrl}`
      : "";

    if (lang === "en") {
      return {
        subject: job.subject || "Shipping update",
        html: `<h2>Shipping update</h2><p>Hi ${escapeHtml(name)}, we have an update on your shipment.</p><ul><li>Status: ${escapeHtml(shippingStatus || "label_created")}</li><li>${escapeHtml(trackingLine)}</li>${carrierLine ? `<li>${escapeHtml(carrierLine)}</li>` : ""}${labelLine ? `<li><a href="${escapeHtml(labelUrl)}">Open tracking</a></li>` : ""}</ul>`,
        text: `Shipping update. Hi ${name}. Status: ${shippingStatus || "label_created"}. ${trackingLine}. ${carrierLine}. ${labelLine}`,
      };
    }

    return {
      subject: job.subject || "Actualización de envío",
      html: `<h2>Actualización de envío</h2><p>Hola ${escapeHtml(name)}, tenemos una actualización de tu envío.</p><ul><li>Estatus: ${escapeHtml(shippingStatus || "label_created")}</li><li>${escapeHtml(trackingLine)}</li>${carrierLine ? `<li>${escapeHtml(carrierLine)}</li>` : ""}${labelLine ? `<li><a href="${escapeHtml(labelUrl)}">Abrir seguimiento</a></li>` : ""}</ul>`,
      text: `Actualización de envío. Hola ${name}. Estatus: ${shippingStatus || "label_created"}. ${trackingLine}. ${carrierLine}. ${labelLine}`,
    };
  }

  if (job.template_key === "abandoned_cart") {
    const checkoutUrl = asString(payload.checkout_url, "https://videoremixpack.com/usb500");
    const productName = asString(payload.product_name, "USB 500GB");

    if (lang === "en") {
      return {
        subject: job.subject || `${name}, your ${productName} is waiting for you`,
        html: [
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">`,
          `<h2 style="color:#AA0202;">Hey ${escapeHtml(name)}, you're almost there! 🎵</h2>`,
          `<p>You were just one step away from getting the <strong>ultimate DJ collection</strong> – 50,000+ remixes, edits, and tracks ready to play.</p>`,
          `<p>Your order is saved and waiting for you:</p>`,
          `<p style="text-align:center;margin:24px 0;">`,
          `<a href="${escapeHtml(checkoutUrl)}" style="background:#AA0202;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">COMPLETE YOUR ORDER →</a>`,
          `</p>`,
          `<p style="color:#666;font-size:13px;">⚡ Limited stock available. Don't miss out.</p>`,
          `<p style="color:#666;font-size:13px;">Questions? Reply to this email or message us on WhatsApp.</p>`,
          `</div>`,
        ].join(""),
        text: `Hey ${name}, you were one step away from your USB with 50,000+ remixes. Complete your order: ${checkoutUrl}`,
      };
    }

    return {
      subject: job.subject || `${name}, tu ${productName} te está esperando`,
      html: [
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">`,
        `<h2 style="color:#AA0202;">Hey ${escapeHtml(name)}, ¡ya casi es tuya! 🎵</h2>`,
        `<p>Estabas a un paso de tener la <strong>colección definitiva para DJs</strong> – más de 50,000 remixes, edits y tracks listos para tocar.</p>`,
        `<p>Tu pedido está guardado y esperándote:</p>`,
        `<p style="text-align:center;margin:24px 0;">`,
        `<a href="${escapeHtml(checkoutUrl)}" style="background:#AA0202;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">COMPLETAR MI PEDIDO →</a>`,
        `</p>`,
        `<p style="color:#666;font-size:13px;">⚡ Stock limitado. No te quedes sin la tuya.</p>`,
        `<p style="color:#666;font-size:13px;">¿Dudas? Responde a este email o escríbenos por WhatsApp.</p>`,
        `</div>`,
      ].join(""),
      text: `Hey ${name}, estabas a un paso de tu USB con 50,000+ remixes. Completa tu pedido: ${checkoutUrl}`,
    };
  }

  throw new Error(`Unsupported template_key: ${job.template_key}`);
}

async function sendWithBrevo(args: {
  authToken: string;
  senderEmail: string;
  senderName: string;
  to: string;
  templateKey: string;
  rendered: RenderedEmail;
  params: Record<string, unknown>;
}): Promise<{ messageId: string | null; response: Record<string, unknown> }> {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": args.authToken,
    },
    body: JSON.stringify({
      sender: {
        name: args.senderName,
        email: args.senderEmail,
      },
      to: [{ email: args.to }],
      subject: args.rendered.subject,
      htmlContent: args.rendered.html,
      textContent: args.rendered.text,
      params: args.params,
      tags: ["videoremixpack", `template:${args.templateKey}`],
    }),
  });

  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const maybeMessage = asString(json.message, "Brevo API request failed");
    throw new Error(`${maybeMessage} (status ${response.status})`);
  }

  const messageId = typeof json.messageId === "string" ? json.messageId : null;
  return { messageId, response: json };
}

// Cron-job token – must match the value in cron.job
const CRON_WORKER_TOKEN = "vrp-email-worker-2026-s3cur3";

function isAuthorized(req: Request, workerToken: string | null, serviceRoleKey: string): boolean {
  const authHeader = req.headers.get("authorization");
  const workerHeader = req.headers.get("x-email-worker-token");

  // Check x-email-worker-token against env secret OR hardcoded cron token
  if (workerHeader) {
    if ((workerToken && workerHeader === workerToken) || workerHeader === CRON_WORKER_TOKEN) {
      return true;
    }
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token && token === serviceRoleKey) {
      return true;
    }
  }

  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, function: "process-email-queue" }), {
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
  // Prefer API key; fallback to SMTP key if that's what is available.
  // Brevo's /v3/smtp/email endpoint authenticates via `api-key` header.
  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  const BREVO_SMTP_KEY = Deno.env.get("BREVO_SMTP_KEY");
  const BREVO_AUTH_TOKEN = BREVO_API_KEY || BREVO_SMTP_KEY;
  const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL");
  const BREVO_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") || "VideoRemixesPack";
  const EMAIL_WORKER_TOKEN = Deno.env.get("EMAIL_WORKER_TOKEN") || null;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BREVO_AUTH_TOKEN || !BREVO_SENDER_EMAIL) {
    return new Response(JSON.stringify({ error: "Missing required secrets" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!isAuthorized(req, EMAIL_WORKER_TOKEN, SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let limit = 25;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const parsedLimit = Number(body.limit);
    if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
      limit = Math.min(200, Math.floor(parsedLimit));
    }
  } catch {
    // Keep default limit.
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: jobsRaw, error: claimError } = await supabaseAdmin.rpc("claim_email_jobs", {
    p_limit: limit,
  });

  if (claimError) {
    console.error("[process-email-queue] claim_email_jobs error", claimError.message);
    return new Response(JSON.stringify({ error: "Failed to claim jobs" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const jobs = Array.isArray(jobsRaw) ? (jobsRaw as QueueJob[]) : [];

  const summary = {
    claimed: jobs.length,
    sent: 0,
    failed: 0,
    failures: [] as Array<{ jobId: string; error: string }>,
  };

  for (const job of jobs) {
    try {
      const rendered = renderTemplate(job);
      const payload = isRecord(job.payload) ? job.payload : {};

      const brevo = await sendWithBrevo({
        authToken: BREVO_AUTH_TOKEN,
        senderEmail: BREVO_SENDER_EMAIL,
        senderName: BREVO_SENDER_NAME,
        to: job.email_to,
        templateKey: job.template_key,
        rendered,
        params: payload,
      });

      const { error: sentError } = await supabaseAdmin.rpc("mark_email_job_sent", {
        p_job_id: job.id,
        p_provider: "brevo",
        p_provider_message_id: brevo.messageId,
        p_response: brevo.response,
      });

      if (sentError) {
        throw new Error(`mark_email_job_sent failed: ${sentError.message}`);
      }

      summary.sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      summary.failed += 1;
      summary.failures.push({ jobId: job.id, error: message });

      const { error: failedMarkError } = await supabaseAdmin.rpc("mark_email_job_failed", {
        p_job_id: job.id,
        p_error: message,
        p_provider: "brevo",
        p_retry_delay_minutes: 15,
        p_response: { reason: message },
      });

      if (failedMarkError) {
        console.error(
          "[process-email-queue] mark_email_job_failed error",
          failedMarkError.message,
        );
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, summary }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
