import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Disc3, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDataLayer } from "@/hooks/useDataLayer";
import { useAnalytics } from "@/hooks/useAnalytics";

interface CountryData {
  country_code: string;
  country_name: string;
  dial_code: string;
}

const COUNTRY_DIAL_CODES: Record<string, string> = {
  US: "+1",
  MX: "+52",
  ES: "+34",
  AR: "+54",
  CO: "+57",
  CL: "+56",
  PE: "+51",
  VE: "+58",
  EC: "+593",
  GT: "+502",
  CU: "+53",
  DO: "+1",
  HN: "+504",
  SV: "+503",
  NI: "+505",
  CR: "+506",
  PA: "+507",
  UY: "+598",
  PY: "+595",
  BO: "+591",
  PR: "+1",
  BR: "+55",
  PT: "+351",
  CA: "+1",
  GB: "+44",
  FR: "+33",
  DE: "+49",
  IT: "+39",
};

export default function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countryData, setCountryData] = useState<CountryData>({
    country_code: "US",
    country_name: "United States",
    dial_code: "+1",
  });
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { trackFormSubmit } = useDataLayer();
  const { trackEvent, trackFormSubmit: trackFormInternal } = useAnalytics();
  const debugLog = useCallback((...args: unknown[]) => {
    if (import.meta.env.DEV) console.log(...args);
  }, []);

  // Detect user's country based on IP
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        
        if (data.country_code) {
          const dialCode = COUNTRY_DIAL_CODES[data.country_code] || "+1";
          setCountryData({
            country_code: data.country_code,
            country_name: data.country_name || "Unknown",
            dial_code: dialCode,
          });
        }
      } catch (error) {
        debugLog("Could not detect country, using default");
      }
    };
    
    detectCountry();
  }, [debugLog]);

  // Exit intent detection
  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0 && !hasTriggered) {
      const dismissed = sessionStorage.getItem("exit-popup-dismissed");
      
      // REMOVED: hasInteracted check - was too restrictive
      if (!dismissed) {
        debugLog("Exit Intent Popup triggered (mouseleave)");
        setIsOpen(true);
        setHasTriggered(true);
        trackEvent("popup", { trigger: "exit_intent" });
      } else {
        debugLog("Exit Intent Popup already dismissed in this session");
      }
    }
  }, [hasTriggered, trackEvent, debugLog]);

  // Timer-based trigger: Show popup after 45 seconds if not dismissed
  useEffect(() => {
    debugLog("Exit Intent Popup timer started (45s)");
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem("exit-popup-dismissed");
      
      if (!dismissed && !hasTriggered) {
        debugLog("Exit Intent Popup triggered (timer_45s)");
        setIsOpen(true);
        setHasTriggered(true);
        trackEvent("popup", { trigger: "timer_45s" });
      } else {
        debugLog("Exit Intent Popup timer elapsed, but already shown/dismissed");
      }
    }, 45000); // 45 seconds

    return () => clearTimeout(timer);
  }, [hasTriggered, trackEvent, debugLog]);

  useEffect(() => {
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [handleMouseLeave]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("exit-popup-dismissed", "true");
    trackEvent("popup", { action: "closed", trigger: "manual_close" });
  };

	  const handleSubmit = async (e: React.FormEvent) => {
	    e.preventDefault();
	    
	    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast({
        title: language === "es" ? "Campos requeridos" : "Required fields",
        description: language === "es" 
          ? "Por favor completa todos los campos" 
          : "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
	    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	    if (!emailRegex.test(formData.email)) {
      toast({
        title: language === "es" ? "Email inválido" : "Invalid email",
        description: language === "es" 
          ? "Por favor ingresa un email válido" 
          : "Please enter a valid email",
        variant: "destructive",
      });
	      return;
	    }

	    // Basic phone validation (digits, reasonable length, not all zeros)
	    const cleanPhoneInput = formData.phone.trim().replace(/[\s().-]/g, "");
	    const phoneDigits = cleanPhoneInput.startsWith("+") ? cleanPhoneInput.slice(1) : cleanPhoneInput;
	    if (!/^\d{7,20}$/.test(phoneDigits) || !/[1-9]/.test(phoneDigits)) {
	      toast({
	        title: language === "es" ? "WhatsApp inválido" : "Invalid WhatsApp",
	        description:
	          language === "es"
	            ? "Ingresa un número válido (solo dígitos)."
	            : "Enter a valid number (digits only).",
	        variant: "destructive",
	      });
	      return;
	    }

	    setIsSubmitting(true);

	    try {
	      const cleanPhone = cleanPhoneInput;

      // Insert lead into database
      const { data: lead, error: insertError } = await supabase
        .from("leads")
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: cleanPhone,
          country_code: countryData.dial_code,
          country_name: countryData.country_name,
          source: "exit_intent",
          tags: ["exit_intent", "demo_request"],
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting lead:", insertError);
        throw insertError;
      }
      if (!lead?.id) {
        throw new Error("Lead insert did not return an id");
      }

      // Track form submission
      trackFormSubmit("exit_intent_popup");
      trackFormInternal("exit_intent_popup");

      // Sync with ManyChat via edge function
      try {
        const { error: syncError } = await supabase.functions.invoke("sync-manychat", {
          body: { leadId: lead.id },
        });

        if (syncError) {
          console.error("ManyChat sync error:", syncError);
        }
      } catch (syncErr) {
        console.error("Failed to sync with ManyChat:", syncErr);
      }

      // Close popup and redirect to thank you page
      setIsOpen(false);
      sessionStorage.setItem("exit-popup-dismissed", "true");
      navigate("/gracias");

    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" 
          ? "Hubo un problema al enviar tus datos. Intenta de nuevo." 
          : "There was a problem submitting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md z-[60]"
          >
            <div className="relative bg-gradient-to-br from-background via-background to-primary/5 border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
              
              {/* Close button */}
	              <button
	                onClick={handleClose}
	                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
	                aria-label={language === "es" ? "Cerrar" : "Close"}
	              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="p-6 md:p-8">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Disc3 className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: "3s" }} />
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    {language === "es" ? "¡Hey DJ! 🎧" : "Hey DJ! 🎧"}
                  </h2>
                  
                  <p className="text-muted-foreground">
                    {language === "es" 
                      ? "¿Te gustaría recibir una carpeta con demos gratis directo a tu WhatsApp?" 
                      : "Want a free demo folder sent straight to your WhatsApp?"}
                  </p>
                </div>

                {/* Gift badge */}
                <div className="flex items-center justify-center gap-2 mb-6 py-2 px-4 rounded-full bg-primary/10 border border-primary/20 w-fit mx-auto">
                  <Gift className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {language === "es" ? "Demos Exclusivos Gratis" : "Free Exclusive Demos"}
                  </span>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                      {language === "es" ? "Tu nombre" : "Your name"}
                    </Label>
	                    <Input
	                      id="name"
	                      type="text"
	                      name="name"
	                      autoComplete="name"
	                      required
	                      placeholder={language === "es" ? "DJ Carlos" : "DJ Carlos"}
	                      value={formData.name}
	                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
	                      className="mt-1"
	                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      {language === "es" ? "Tu email" : "Your email"}
                    </Label>
	                    <Input
	                      id="email"
	                      type="email"
	                      name="email"
	                      autoComplete="email"
	                      required
	                      placeholder={language === "es" ? "dj@ejemplo.com" : "dj@example.com"}
	                      value={formData.email}
	                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
	                      className="mt-1"
	                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">
                      {language === "es" ? "Tu WhatsApp" : "Your WhatsApp"}
                    </Label>
                    <div className="flex mt-1">
                      <div className="flex items-center px-3 bg-muted border border-r-0 border-input rounded-l-md text-sm text-muted-foreground">
                        {countryData.dial_code}
                      </div>
	                      <Input
	                        id="phone"
	                        type="tel"
	                        name="phone"
	                        autoComplete="tel"
	                        inputMode="tel"
	                        required
	                        placeholder={language === "es" ? "55 1234 5678" : "(555) 123-4567"}
	                        value={formData.phone}
	                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
	                        className="rounded-l-none"
	                        disabled={isSubmitting}
	                      />
	                    </div>
	                    <p className="text-xs text-muted-foreground mt-1">
	                      {language === "es" 
	                        ? `Solo números, sin el código de país. Detectamos que estás en ${countryData.country_name}` 
	                        : `Digits only, without country code. We detected you're in ${countryData.country_name}`}
	                    </p>
	                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {language === "es" ? "Enviando..." : "Sending..."}
                      </>
                    ) : (
                      language === "es" ? "¡Quiero mis Demos Gratis!" : "I Want My Free Demos!"
                    )}
                  </Button>
                </form>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  {language === "es" 
                    ? "Te enviaremos los demos por WhatsApp en minutos. Sin spam." 
                    : "We'll send the demos via WhatsApp in minutes. No spam."}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
