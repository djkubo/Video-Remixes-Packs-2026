import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

export default function DjEditsThankYou() {
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
            className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-[#AA0202]/10"
          >
            <CheckCircle2 className="h-12 w-12 text-[#AA0202]" />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {language === "es" ? "¡Pago confirmado!" : "Payment confirmed!"}
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
            {paidConfirmed
              ? language === "es"
                ? "Listo. Revisa tu email (y spam): ahí llega la confirmación y los siguientes pasos del curso."
                : "All set. Check your email (and spam) for confirmation and next steps for the course."
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
                ? "No encontramos un pago confirmado en esta página. Si ya pagaste, revisa tu email y vuelve a cargar esta pantalla."
                : "We couldn’t confirm a payment on this page. If you already paid, check your email and refresh this screen."}
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
                  ? "1) Revisa tu email (y spam) para la confirmación."
                  : "1) Check your email (and spam) for confirmation."}
              </li>
              <li>
                {language === "es"
                  ? "2) Si necesitas ayuda, entra a /help."
                  : "2) If you need help, go to /help."}
              </li>
            </ul>
          </div>

          <div className="grid gap-3">
            <Button asChild variant="outline" className="h-12 w-full text-base font-bold">
              <Link to="/help">{language === "es" ? "Soporte" : "Support"}</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full text-base font-bold">
              <Link to="/trends">{language === "es" ? "Ir a Tendencias" : "Go to Trends"}</Link>
            </Button>
          </div>

          <div className="mt-6">
            <Link to="/djedits">
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

