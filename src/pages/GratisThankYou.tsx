import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

// Optional: set a WhatsApp invite link here if you want to show it immediately
// after registration. If empty, the page will instruct the user to check WhatsApp.
const WHATSAPP_GROUP_URL = "";
const PLAN_URL = "/plan";

export default function GratisThankYou() {
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
            className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-[#AA0202]/10"
          >
            <CheckCircle2 className="h-12 w-12 text-[#AA0202]" />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {language === "es" ? "¡Gracias por registrarte!" : "Thanks for registering!"}
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
            {language === "es"
              ? "Ya casi: estás entrando a nuestra comunidad exclusiva para DJs."
              : "Almost there: you’re joining our exclusive DJ community."}
          </p>

          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 mb-8 text-left">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="h-6 w-6 text-[#AA0202]" />
              <span className="font-semibold">
                {language === "es" ? "Revisa tu WhatsApp" : "Check your WhatsApp"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {language === "es"
                ? "En unos minutos recibirás el acceso. Si no te llega, revisa tu número o intenta de nuevo."
                : "In a few minutes you’ll receive access. If it doesn’t arrive, double-check your number or try again."}
            </p>
          </div>

          <div className="grid gap-3">
            <Button asChild className="btn-primary-glow h-12 w-full text-base font-bold">
              <Link to={PLAN_URL}>Ver opciones: Pack $35 / Membresía $35 / USB $147</Link>
            </Button>

            {WHATSAPP_GROUP_URL ? (
              <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer">
                <Button className="btn-primary-glow h-12 w-full text-base font-bold">
                  {language === "es" ? "Únete al grupo de WhatsApp" : "Join the WhatsApp group"}
                </Button>
              </a>
            ) : null}
          </div>

          <div className="mt-6">
            <Link to="/gratis">
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
