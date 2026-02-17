import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useDataLayer } from "@/hooks/useDataLayer";

type ShippoInfo = { ok: boolean; labelUrl?: string; trackingNumber?: string } | null;

export default function Usb500gbThankYou() {
  const { language } = useLanguage();
  const { trackPurchase } = useDataLayer();
  const hasFiredPurchase = useRef(false);
  const [params] = useSearchParams();
  const stripeSessionId = params.get("session_id");
  const paypalOrderId = params.get("token");
  const leadId = params.get("lead_id");
  const product = params.get("product");

  const hasStripeSession = Boolean(stripeSessionId);
  const hasPayPalOrder = Boolean(paypalOrderId);

  const [stripeVerifyState, setStripeVerifyState] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");

  const [paypalCaptureState, setPaypalCaptureState] = useState<
    "idle" | "processing" | "success" | "error" | "shipping_not_allowed"
  >("idle");

  const [shippoInfo, setShippoInfo] = useState<ShippoInfo>(null);

  useEffect(() => {
    if (!stripeSessionId || !leadId) return;
    if (stripeVerifyState !== "idle") return;

    setStripeVerifyState("processing");
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("stripe-checkout", {
          body: { action: "verify", leadId, sessionId: stripeSessionId, product },
        });

        const paid = Boolean((data as { paid?: unknown } | null)?.paid);
        if (error || !paid) {
          setStripeVerifyState("error");
          return;
        }

        const shippo = (data as { shippo?: unknown } | null)?.shippo;
        if (shippo && typeof shippo === "object") {
          setShippoInfo(shippo as ShippoInfo);
        }

        try {
          await supabase.functions.invoke("sync-manychat", { body: { leadId } });
        } catch {
          // ignore
        }

        setStripeVerifyState("success");
      } catch {
        setStripeVerifyState("error");
      }
    })();
  }, [leadId, product, stripeSessionId, stripeVerifyState]);

  useEffect(() => {
    if (!paypalOrderId || !leadId) return;
    if (paypalCaptureState !== "idle") return;

    setPaypalCaptureState("processing");
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("paypal-checkout", {
          body: { action: "capture", leadId, orderId: paypalOrderId },
        });

        const code = typeof (data as { code?: unknown } | null)?.code === "string"
          ? String((data as { code?: unknown }).code)
          : "";
        if (code === "SHIPPING_COUNTRY_NOT_ALLOWED" || code === "SHIPPING_ADDRESS_REQUIRED") {
          setPaypalCaptureState("shipping_not_allowed");
          return;
        }

        const completed = Boolean((data as { completed?: unknown } | null)?.completed);
        if (error || !completed) {
          setPaypalCaptureState("error");
          return;
        }

        const shippo = (data as { shippo?: unknown } | null)?.shippo;
        if (shippo && typeof shippo === "object") {
          setShippoInfo(shippo as ShippoInfo);
        }

        // Re-sync ManyChat so payment tags get applied.
        try {
          await supabase.functions.invoke("sync-manychat", { body: { leadId } });
        } catch {
          // ignore
        }

        setPaypalCaptureState("success");
      } catch {
        setPaypalCaptureState("error");
      }
    })();
  }, [leadId, paypalCaptureState, paypalOrderId]);

  const paidConfirmed =
    (hasStripeSession && stripeVerifyState === "success") ||
    (hasPayPalOrder && paypalCaptureState === "success");

  const shippingBlocked =
    hasPayPalOrder && paypalCaptureState === "shipping_not_allowed";

  const isProcessing =
    (hasStripeSession && stripeVerifyState === "processing") ||
    (hasPayPalOrder && paypalCaptureState === "processing");

  const hasError =
    (hasStripeSession && stripeVerifyState === "error") ||
    (hasPayPalOrder && paypalCaptureState === "error");

  const trackingNumber =
    shippoInfo && typeof shippoInfo === "object" ? shippoInfo.trackingNumber : undefined;
  const labelUrl =
    shippoInfo && typeof shippoInfo === "object" ? shippoInfo.labelUrl : undefined;
  const paymentRef = stripeSessionId || paypalOrderId || null;
  const paymentProvider = stripeSessionId ? "Stripe" : paypalOrderId ? "PayPal" : null;

  /* ─── GTM purchase event (fires once when payment is confirmed) ─── */
  useEffect(() => {
    if (paidConfirmed && !hasFiredPurchase.current) {
      hasFiredPurchase.current = true;
      trackPurchase(197, "USD", paymentRef || undefined);
    }
  }, [paidConfirmed, trackPurchase, paymentRef]);

  return (
    <main className="min-h-screen bg-[#070707] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.15 }}
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${shippingBlocked ? "bg-red-500/10" : "bg-[#AA0202]/10"
              }`}
          >
            {shippingBlocked ? (
              <AlertTriangle className="w-12 h-12 text-red-500" />
            ) : (
              <CheckCircle2 className="w-12 h-12 text-[#AA0202]" />
            )}
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {shippingBlocked
              ? language === "es"
                ? "Atención"
                : "Action needed"
              : paidConfirmed
                ? language === "es"
                  ? "¡Pago confirmado!"
                  : "Payment confirmed!"
                : isProcessing
                  ? language === "es"
                    ? "Confirmando pago..."
                    : "Confirming payment..."
                  : hasError
                    ? language === "es"
                      ? "Pago pendiente"
                      : "Payment pending"
                    : language === "es"
                      ? "¡Listo!"
                      : "All set!"}
          </h1>

          <p className="text-lg text-zinc-400 mb-8">
            {paidConfirmed
              ? language === "es"
                ? "Pago confirmado. Tu pedido ya está en proceso. Te enviaremos la confirmación y el seguimiento por email."
                : "Payment confirmed. Your order is now processing. We’ll send confirmation and tracking by email."
              : shippingBlocked
                ? language === "es"
                  ? "Solo enviamos productos físicos dentro de Estados Unidos. Tu pago con PayPal no se completó. Regresa e intenta de nuevo con una dirección en USA, o escríbenos por WhatsApp."
                  : "We only ship physical products within the United States. Your PayPal payment was not completed. Go back and try again with a US address, or message us on WhatsApp."
                : hasStripeSession && stripeVerifyState === "processing"
                  ? language === "es"
                    ? "Estamos confirmando tu pago con Stripe. No cierres esta página."
                    : "We’re confirming your Stripe payment. Please keep this page open."
                  : hasStripeSession && stripeVerifyState === "error"
                    ? language === "es"
                      ? "Tu pago con Stripe está pendiente de confirmación. Revisa tu email o intenta de nuevo."
                      : "Your Stripe payment is pending confirmation. Check your email or try again."
                    : hasPayPalOrder && paypalCaptureState === "processing"
                      ? language === "es"
                        ? "Estamos confirmando tu pago con PayPal. No cierres esta página."
                        : "We’re confirming your PayPal payment. Please keep this page open."
                      : hasPayPalOrder && paypalCaptureState === "error"
                        ? language === "es"
                          ? "Tu pago con PayPal está pendiente de confirmación. Revisa tu email de PayPal o intenta de nuevo."
                          : "Your PayPal payment is pending confirmation. Check your PayPal email or try again."
                        : language === "es"
                          ? "No encontramos un pago confirmado en esta página. Si aún no pagas, regresa e intenta de nuevo. Si ya pagaste, revisa tu email y vuelve a cargar esta pantalla."
                          : "We couldn’t confirm a payment on this page. If you haven’t paid yet, go back and try again. If you already paid, check your email and refresh this screen."}
          </p>

          {paidConfirmed ? (
            <div className="rounded-xl border border-[#5E5E5E]/70 bg-[#111111] p-6 mb-8 text-left shadow-xl">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">
                {language === "es" ? "Estado del envío" : "Shipping status"}
              </p>
              {trackingNumber ? (
                <>
                  <p className="mt-2 text-sm text-zinc-400">
                    {language === "es" ? "Guía de rastreo" : "Tracking number"}
                  </p>
                  <p className="mt-1 font-mono text-sm text-[#EFEFEF]">{trackingNumber}</p>
                  <p className="mt-3 text-xs text-zinc-400">
                    {language === "es"
                      ? "La guía puede tardar un poco en activarse en la paquetería."
                      : "It may take a little while for the carrier to activate the tracking."}
                  </p>
                  {labelUrl ? (
                    <a
                      href={labelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex text-sm font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      {language === "es" ? "Abrir link de envío" : "Open shipping link"}
                    </a>
                  ) : null}
                </>
              ) : (
                <p className="mt-2 text-sm text-zinc-400">
                  {language === "es"
                    ? "Estamos preparando tu envío. En cuanto se genere la guía, aparecerá aquí y te llegará por email."
                    : "We’re preparing your shipment. Once tracking is generated, it will show here and arrive by email."}
                </p>
              )}
            </div>
          ) : null}

          {paidConfirmed ? (
            <div className="grid gap-3 mb-8">
              <Button asChild className="btn-primary-glow h-12 w-full text-base font-bold">
                <a href="https://videoremixespacks.com/plan" rel="noopener noreferrer">Membresía para actualizaciones semanales/mensuales</a>
              </Button>
            </div>
          ) : null}

          <div className="rounded-xl border border-[#5E5E5E]/70 bg-muted/30 p-6 mb-8 text-left">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="w-6 h-6 text-primary" />
              <span className="font-semibold">
                {language === "es" ? "Soporte en español" : "Spanish support"}
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              {language === "es"
                ? "Si necesitas ayuda con tu pedido, contáctanos y te respondemos rápido."
                : "If you need help with your order, contact us and we’ll reply fast."}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link to="/help">
                <Button variant="outline" className="w-full">
                  {language === "es" ? "Ver ayuda" : "Open help"}
                </Button>
              </Link>
              {paymentRef && paymentProvider ? (
                <p className="text-xs text-zinc-400">
                  {language === "es" ? "Referencia" : "Reference"}: {paymentProvider} ·{" "}
                  <span className="font-mono">{paymentRef}</span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6">
            <Link to="/usb500">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {language === "es" ? "Volver" : "Back"}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
