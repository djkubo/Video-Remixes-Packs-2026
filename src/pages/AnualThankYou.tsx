import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

export default function AnualThankYou() {
  const { language } = useLanguage();
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

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
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
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 mb-6"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {language === "es" ? "¡Listo!" : "All set!"}
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
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

          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 mb-8 text-left">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="w-6 h-6 text-primary" />
              <span className="font-semibold">
                {language === "es" ? "Siguientes pasos" : "Next steps"}
              </span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
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
            <Link to="/anual">
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
