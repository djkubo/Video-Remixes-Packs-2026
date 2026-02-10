import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

// Optional: if you have a payment/checkout link for USB 500GB, put it here.
// If empty, the page will instruct the user to check WhatsApp.
const USB500GB_PAYMENT_URL = "";

export default function Usb500gbThankYou() {
  const { language } = useLanguage();

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
            {language === "es"
              ? "Ya registramos tu pedido. En breve te enviaremos por WhatsApp el link de pago y el seguimiento."
              : "We’ve registered your order. You’ll receive the payment link and tracking via WhatsApp shortly."}
          </p>

          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 mb-8 text-left">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="w-6 h-6 text-green-500" />
              <span className="font-semibold">
                {language === "es" ? "Revisa tu WhatsApp" : "Check your WhatsApp"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {language === "es"
                ? "Si no te llega el mensaje en 10 minutos, revisa tu número o vuelve a intentarlo."
                : "If you don’t get a message in 10 minutes, double-check your number or try again."}
            </p>
          </div>

          {USB500GB_PAYMENT_URL ? (
            <a href={USB500GB_PAYMENT_URL} target="_blank" rel="noopener noreferrer">
              <Button className="btn-primary-glow h-12 w-full text-base font-bold">
                {language === "es" ? "Ir a pagar" : "Go to checkout"}
              </Button>
            </a>
          ) : null}

          <div className="mt-6">
            <Link to="/usb-500gb">
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

