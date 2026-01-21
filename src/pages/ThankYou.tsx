import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, MessageCircle, ArrowLeft, Disc3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataLayer } from "@/hooks/useDataLayer";

export default function ThankYou() {
  const { language } = useLanguage();
  const { trackEvent } = useDataLayer();

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
    
    // Track successful lead conversion
    trackEvent("lead_conversion", {
      page: "thank_you",
      source: "exit_intent",
    });
  }, []);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              damping: 15, 
              stiffness: 200,
              delay: 0.2 
            }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 mb-6"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {language === "es" ? "¡Gracias, DJ!" : "Thanks, DJ!"}
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-muted-foreground mb-8">
            {language === "es" 
              ? "En unos minutos recibirás un mensaje en tu WhatsApp con los demos exclusivos. 🎧" 
              : "In a few minutes you'll receive a WhatsApp message with the exclusive demos. 🎧"}
          </p>

          {/* Info card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-green-500" />
              <span className="font-semibold">
                {language === "es" ? "Revisa tu WhatsApp" : "Check your WhatsApp"}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {language === "es" 
                ? "Si no recibes el mensaje en 10 minutos, revisa que el número esté correcto o contáctanos directamente." 
                : "If you don't receive the message in 10 minutes, make sure the number is correct or contact us directly."}
            </p>
          </motion.div>

          {/* What you'll get */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-left bg-muted/50 rounded-xl p-6 mb-8"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-primary" />
              {language === "es" ? "Lo que recibirás:" : "What you'll get:"}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                {language === "es" 
                  ? "Demos exclusivos de varios géneros" 
                  : "Exclusive demos from various genres"}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                {language === "es" 
                  ? "Archivos listos para mezclar" 
                  : "Files ready to mix"}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                {language === "es" 
                  ? "Acceso a promociones especiales" 
                  : "Access to special promotions"}
              </li>
            </ul>
          </motion.div>

          {/* Back button */}
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {language === "es" ? "Volver al inicio" : "Back to home"}
            </Button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
