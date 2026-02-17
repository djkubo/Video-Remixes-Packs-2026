import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useDataLayer } from "@/hooks/useDataLayer";

export default function MembresiaThankYou() {
  const { language } = useLanguage();
  const { trackPurchase } = useDataLayer();
  const purchaseTracked = useRef(false);
  const [params] = useSearchParams();

  const plan = params.get("plan");
  const stripeSessionId = params.get("session_id");
  const paypalOrderId = params.get("token");
  const leadId = params.get("lead_id");
  const product = params.get("product") || plan;

  const hasStripeSession = Boolean(stripeSessionId);
  const hasPayPalOrder = Boolean(paypalOrderId);
  const isMonthlyPlan = product === "plan_1tb_mensual" || product === "plan_1tb_trimestral";

  const [stripeVerifyState, setStripeVerifyState] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");

  const [paypalCaptureState, setPaypalCaptureState] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");

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

        const completed = Boolean((data as { completed?: unknown } | null)?.completed);
        if (error || !completed) {
          setPaypalCaptureState("error");
          return;
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

  const isProcessing =
    (hasStripeSession && stripeVerifyState === "processing") ||
    (hasPayPalOrder && paypalCaptureState === "processing");

  const hasError =
    (hasStripeSession && stripeVerifyState === "error") ||
    (hasPayPalOrder && paypalCaptureState === "error");

  const paymentRef = stripeSessionId || paypalOrderId || null;

  // Track purchase event for ads attribution
  useEffect(() => {
    if (paidConfirmed && !purchaseTracked.current) {
      purchaseTracked.current = true;
      const price = product === "plan_1tb_trimestral" ? 90 : 35;
      const planName = product === "plan_1tb_trimestral"
        ? "Membresía PRO Trimestral"
        : "Membresía PRO Mensual";
      trackPurchase(price, "USD", paymentRef || undefined, product || "plan_1tb_mensual", planName);
    }
  }, [paidConfirmed, trackPurchase, paymentRef, product]);

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
            className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-[#AA0202]/10"
          >
            <CheckCircle2 className="h-12 w-12 text-[#AA0202]" />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {paidConfirmed
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
                ? "Pago confirmado. Revisa tu email: ahí llega tu confirmación. Si ya tienes cuenta con ese correo, inicia sesión ahora."
                : "Payment confirmed. Check your email for confirmation. If you already have an account with that email, you can sign in now."
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
            <div className="grid gap-3 mb-8">
              {isMonthlyPlan ? (
                <Button asChild className="btn-primary-glow h-12 w-full text-base font-bold">
                  <Link to="/anual">Pásate a anual y ahorra</Link>
                </Button>
              ) : null}
              <Button
                asChild
                variant={isMonthlyPlan ? "outline" : "default"}
                className={`${isMonthlyPlan ? "h-12 w-full text-base font-bold" : "btn-primary-glow h-12 w-full text-base font-bold"}`}
              >
                <Link to="/usb128">Agrega USB</Link>
              </Button>
            </div>
          ) : null}

          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 mb-8 text-left">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="w-6 h-6 text-primary" />
              <span className="font-semibold">
                {language === "es" ? "Siguientes pasos" : "Next steps"}
              </span>
            </div>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                {language === "es"
                  ? "1) Confirmación: revisa tu email (y spam)."
                  : "1) Confirmation: check your email (and spam)."}
              </li>
              <li>
                {language === "es"
                  ? "2) Acceso: inicia sesión con el correo que usaste en el checkout."
                  : "2) Access: sign in with the email you used at checkout."}
              </li>
              <li>
                {language === "es"
                  ? "3) Soporte: si algo no cuadra, te ayudamos en /help."
                  : "3) Support: if anything looks off, we’ll help at /help."}
              </li>
            </ul>
          </div>

          {paidConfirmed ? (
            <div className="grid gap-3">
              <Button asChild className="btn-primary-glow h-12 w-full text-base font-bold">
                <Link to="/login">{language === "es" ? "Iniciar sesión" : "Sign in"}</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 w-full text-base font-bold">
                <Link to="/trends">{language === "es" ? "Ir a Tendencias" : "Go to Trends"}</Link>
              </Button>
            </div>
          ) : null}

          <div className="mt-6">
            <a href="https://videoremixespacks.com/plan" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {language === "es" ? "Volver" : "Back"}
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
