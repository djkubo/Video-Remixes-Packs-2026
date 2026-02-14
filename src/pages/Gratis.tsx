import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Disc3,
  Gift,
  Loader2,
  Play,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import SettingsToggle from "@/components/SettingsToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDataLayer } from "@/hooks/useDataLayer";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";
import { countryNameFromCode, detectCountryCodeFromTimezone } from "@/lib/country";

type CountryData = {
  country_code: string;
  country_name: string;
  dial_code: string;
};

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

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function normalizePhoneInput(input: string): { clean: string; digits: string } {
  const clean = input.trim().replace(/[\s().-]/g, "");
  const digits = clean.startsWith("+") ? clean.slice(1) : clean;
  return { clean, digits };
}

export default function Gratis() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const { trackFormSubmit } = useDataLayer();

  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [countryData, setCountryData] = useState<CountryData>({
    country_code: "US",
    country_name: "United States",
    dial_code: "+1",
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [consentTransactional, setConsentTransactional] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);

  const countryOptions = useMemo(() => {
    return Object.entries(COUNTRY_DIAL_CODES)
      .map(([code, dial]) => ({ code, dial }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, []);

  // Detect user's country (best-effort; timezone-based so we avoid CORS/network issues).
  useEffect(() => {
    const code = detectCountryCodeFromTimezone() || "US";
    const dialCode = COUNTRY_DIAL_CODES[code] || "+1";
    setCountryData({
      country_code: code,
      country_name: countryNameFromCode(code, language === "es" ? "es" : "en"),
      dial_code: dialCode,
    });
  }, [language]);

  const openJoin = useCallback(() => {
    setConsentTransactional(false);
    setConsentMarketing(false);
    setConsentTouched(false);
    setIsJoinOpen(true);
    trackEvent("gratis_join_open", { page: "/gratis" });
  }, [trackEvent]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();
      const email = formData.email.trim().toLowerCase();
      const { clean: cleanPhone, digits: phoneDigits } = normalizePhoneInput(formData.phone);

      if (!firstName || !lastName || !email || !cleanPhone) {
        toast({
          title: language === "es" ? "Campos requeridos" : "Required fields",
          description:
            language === "es"
              ? "Por favor completa todos los campos."
              : "Please fill in all fields.",
          variant: "destructive",
        });
        return;
      }

      if (!isValidEmail(email)) {
        toast({
          title: language === "es" ? "Email inválido" : "Invalid email",
          description:
            language === "es"
              ? "Por favor ingresa un email válido."
              : "Please enter a valid email.",
          variant: "destructive",
        });
        return;
      }

      // Similar UX to the reference page: validate phone and show a clear error.
      // NOTE: Supabase RLS policy enforces phone length <= 20.
      if (
        cleanPhone.length > 20 ||
        !/^\+?\d{7,20}$/.test(cleanPhone) ||
        !/[1-9]/.test(phoneDigits)
      ) {
        toast({
          title: language === "es" ? "WhatsApp inválido" : "Invalid WhatsApp",
          description:
            language === "es"
              ? "Número de teléfono no válido."
              : "Phone number is not valid.",
          variant: "destructive",
        });
        return;
      }

      setConsentTouched(true);
      if (!consentTransactional) {
        toast({
          title: language === "es" ? "Confirmación requerida" : "Confirmation required",
          description:
            language === "es"
              ? "Debes aceptar recibir mensajes transaccionales y de soporte para continuar."
              : "You must agree to receive transactional and support messages to continue.",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const fullName = `${firstName} ${lastName}`.trim();
        const leadId = crypto.randomUUID();

        const leadBase = {
          id: leadId,
          name: fullName,
          email,
          phone: cleanPhone,
          country_code: countryData.dial_code,
          country_name: countryData.country_name,
          source: "gratis",
          tags: ["gratis", "whatsapp_group"],
        };

        const leadWithConsent = {
          ...leadBase,
          consent_transactional: consentTransactional,
          consent_transactional_at: consentTransactional ? new Date().toISOString() : null,
          consent_marketing: consentMarketing,
          consent_marketing_at: consentMarketing ? new Date().toISOString() : null,
        };

        let { error: insertError } = await supabase.from("leads").insert(leadWithConsent);
        // If the DB migration hasn't been applied yet, avoid breaking lead capture.
        if (insertError && /consent_(transactional|marketing)/i.test(insertError.message)) {
          if (import.meta.env.DEV) {
            console.warn("Leads consent columns missing. Retrying insert without consent fields.");
          }
          ({ error: insertError } = await supabase.from("leads").insert(leadBase));
        }

        if (insertError) throw insertError;

        trackFormSubmit("gratis_whatsapp_join");
        trackEvent("gratis_join_submit", { lead_id: leadId });

        try {
          const { error: syncError } = await supabase.functions.invoke("sync-manychat", {
            body: { leadId },
          });
          if (syncError && import.meta.env.DEV) {
            console.warn("ManyChat sync error:", syncError);
          }
        } catch (syncErr) {
          if (import.meta.env.DEV) console.warn("ManyChat sync threw:", syncErr);
        }

        setIsJoinOpen(false);
        navigate("/gratis/gracias");
      } catch (err) {
        console.error("Gratis lead submit error:", err);
        toast({
          title: language === "es" ? "Error" : "Error",
          description:
            language === "es"
              ? "Hubo un problema al enviar tus datos. Intenta de nuevo."
              : "There was a problem submitting your data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      consentMarketing,
      consentTransactional,
      countryData.dial_code,
      countryData.country_name,
      formData,
      isSubmitting,
      language,
      navigate,
      toast,
      trackEvent,
      trackFormSubmit,
    ]
  );

  return (
    <main className="brand-frame min-h-screen bg-background">
      <SettingsToggle />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#1a1a1a] via-[#AA0202] to-[#1a1a1a]" />

        <div className="container relative z-10 mx-auto px-4 pb-16 pt-20 md:pb-24 md:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <img
              src={theme === "dark" ? logoWhite : logoDark}
              alt="VideoRemixesPacks"
              className="mx-auto h-16 w-auto object-contain md:h-20"
            />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-8"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary backdrop-blur-sm">
                <Gift className="h-4 w-4" />
                {language === "es"
                  ? "Acceso gratis por WhatsApp"
                  : "Free access via WhatsApp"}
              </span>

              <h1 className="mt-6 font-display text-4xl font-extrabold uppercase tracking-tight md:text-6xl">
                {language === "es" ? (
                  <>
                    La mejor musica latina para DJs{" "}
                    <span className="text-gradient-red">directo</span> en tu WhatsApp
                  </>
                ) : (
                  <>
                    The best Latin music for DJs{" "}
                    <span className="text-gradient-red">directly</span> to your WhatsApp
                  </>
                )}
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
                {language === "es"
                  ? "Recibe selecciones listas para pinchar y organizadas por genero. Sin spam. Sin perder horas buscando."
                  : "Get DJ-ready selections, organized by genre. No spam. No wasted hours searching."}
              </p>
            </motion.div>

            {/* Video + CTA */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="mt-10 grid gap-6 md:grid-cols-2 md:items-stretch"
            >
              <button
                type="button"
                onClick={() => setIsVideoOpen(true)}
                className="group glass-card-hover relative flex min-h-[220px] items-center justify-center overflow-hidden border-primary/20"
                aria-label={language === "es" ? "Ver video" : "Watch video"}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary)/0.15),transparent_50%)]" />
                <div className="relative z-10 flex items-center gap-3">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                    <Play className="h-6 w-6" />
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">
                      {language === "es" ? "Mira el preview" : "Watch the preview"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === "es"
                        ? "Calidad real. Listo para eventos."
                        : "Real quality. Ready for events."}
                    </p>
                  </div>
                </div>
              </button>

              <div className="glass-card flex flex-col justify-center gap-4 border-primary/20 p-6 text-left">
                <div className="flex items-start gap-3">
                  <Users className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">
                      {language === "es"
                        ? "Grupo exclusivo: solo contenido."
                        : "Exclusive group: content only."}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "es"
                        ? "Entras, descargas y mezclas. Nosotros hacemos el filtro por ti."
                        : "Join, download, and mix. We filter the noise for you."}
                    </p>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="btn-primary-glow h-14 w-full text-base font-bold"
                  onClick={openJoin}
                >
                  {language === "es" ? "Quiero unirme al grupo" : "Join the group"}
                  <ChevronRight className="ml-1 h-5 w-5" />
                </Button>

                <p className="text-xs text-muted-foreground">
                  {language === "es"
                    ? "Te pediremos tu WhatsApp para mandarte el acceso."
                    : "We’ll ask for your WhatsApp to send you access."}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-3xl font-extrabold uppercase md:text-5xl">
            {language === "es" ? (
              <>
                ¿Que obtendras en el{" "}
                <span className="text-gradient-red">WhatsApp</span>?
              </>
            ) : (
              <>
                What will you get on{" "}
                <span className="text-gradient-red">WhatsApp</span>?
              </>
            )}
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              {
                title:
                  language === "es"
                    ? "Seleccion musical de alta calidad"
                    : "High-quality music selection",
                body:
                  language === "es"
                    ? "Cada semana recibes un repertorio nuevo, organizado por genero: reggaeton, cumbia, bachata, salsa y mas."
                    : "Weekly drops, organized by genre: reggaeton, cumbia, bachata, salsa, and more.",
              },
              {
                title: language === "es" ? "Organizacion profesional" : "Pro organization",
                body:
                  language === "es"
                    ? "Lo que sirve en pista. Sin relleno. Sin versiones inutiles."
                    : "What works on the dancefloor. No filler. No useless versions.",
              },
              {
                title: language === "es" ? "Ahorro de tiempo" : "Save time",
                body:
                  language === "es"
                    ? "Deja de perder horas buscando. Nosotros filtramos y te entregamos lo mejor."
                    : "Stop wasting hours searching. We filter and deliver the best.",
              },
              {
                title: language === "es" ? "Actualizaciones constantes" : "Constant updates",
                body:
                  language === "es"
                    ? "Contenido fresco para renovar tus sets y mantener tu pista llena."
                    : "Fresh content to refresh your sets and keep your floor packed.",
              },
            ].map((item) => (
              <div key={item.title} className="glass-card-hover p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-display text-xl font-extrabold uppercase">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why special + Process */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1a1a1a] via-[#AA0202] to-[#1a1a1a]" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-3xl font-extrabold uppercase md:text-5xl">
              {language === "es" ? (
                <>
                  ¿Por que este grupo es{" "}
                  <span className="text-gradient-red">especial</span>?
                </>
              ) : (
                <>
                  Why is this group{" "}
                  <span className="text-gradient-red">special</span>?
                </>
              )}
            </h2>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: language === "es" ? "Organizado y exclusivo" : "Organized and exclusive",
                  body:
                    language === "es"
                      ? "Grupo cerrado: solo nosotros compartimos los enlaces. Tu entras, descargas y a mezclar."
                      : "Closed group: only we share links. You join, download, and mix.",
                },
                {
                  title:
                    language === "es"
                      ? "Musica para eventos sociales"
                      : "Music for social events",
                  body:
                    language === "es"
                      ? "Bodas, quinceaneras, corporativos y mas. Ten siempre temas que garantizan pista llena."
                      : "Weddings, quinceañeras, corporate events, and more. Keep the floor full.",
                },
                {
                  title: language === "es" ? "Cero spam" : "Zero spam",
                  body:
                    language === "es"
                      ? "Sin mensajes de extraños ni notificaciones fuera de lugar. Solo musica."
                      : "No random messages, no noisy notifications. Just music.",
                },
              ].map((item) => (
                <div key={item.title} className="glass-card-hover p-6">
                  <h3 className="font-display text-xl font-extrabold uppercase">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 md:items-stretch">
              <div className="glass-card p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-display text-2xl font-extrabold uppercase">
                      {language === "es" ? "¿Como funciona el proceso?" : "How does it work?"}
                    </h3>
                    <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                          1
                        </span>
                        {language === "es" ? "Completa el formulario" : "Fill the form"}
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                          2
                        </span>
                        {language === "es"
                          ? "Recibe el acceso por WhatsApp"
                          : "Get access via WhatsApp"}
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                          3
                        </span>
                        {language === "es"
                          ? "Contenido nuevo cada semana"
                          : "New content weekly"}
                      </li>
                    </ol>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="btn-primary-glow mt-6 h-14 w-full text-base font-bold"
                  onClick={openJoin}
                >
                  {language === "es" ? "Quiero unirme al grupo" : "Join the group"}
                  <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-display text-2xl font-extrabold uppercase">
                  {language === "es" ? "DJs que ya lo usan" : "DJs already using it"}
                </h3>
                <div className="mt-5 space-y-4">
                  {[
                    {
                      quote:
                        language === "es"
                          ? "“Desde que me uni, siempre traigo novedades y mis eventos estan prendidisimos.”"
                          : "“Since I joined, I always have fresh tracks and my events are on fire.”",
                      name: language === "es" ? "DJ Carlos, CDMX" : "DJ Carlos, Mexico City",
                    },
                    {
                      quote:
                        language === "es"
                          ? "“Antes pasaba horas buscando musica. Ahora llega directo al WhatsApp y esta brutal.”"
                          : "“I used to spend hours searching. Now it hits my WhatsApp and it’s fire.”",
                      name: language === "es" ? "DJ Valentina, Lima" : "DJ Valentina, Lima",
                    },
                    {
                      quote:
                        language === "es"
                          ? "“Muy recomendable: todo organizado por genero y listo para descargar.”"
                          : "“Highly recommended: organized by genre and ready to download.”",
                      name: language === "es" ? "Fernando, Bogota" : "Fernando, Bogota",
                    },
                  ].map((t) => (
                    <div key={t.name} className="rounded-xl border border-border/50 bg-card/50 p-4">
                      <p className="text-sm text-foreground">{t.quote}</p>
                      <p className="mt-2 text-xs font-semibold text-muted-foreground">{t.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="mt-12 text-center">
              <h2 className="font-display text-3xl font-extrabold uppercase md:text-5xl">
                {language === "es" ? (
                  <>
                    Registrate y obten acceso{" "}
                    <span className="text-gradient-red">gratis</span>
                  </>
                ) : (
                  <>
                    Register and get{" "}
                    <span className="text-gradient-red">free</span> access
                  </>
                )}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
                {language === "es"
                  ? "No vuelvas a quedarte sin nuevos exitos. Entra hoy y lleva tus mezclas al siguiente nivel."
                  : "Never run out of fresh hits. Join today and level up your sets."}
              </p>
              <div className="mt-6 flex justify-center">
                <Button size="lg" className="btn-primary-glow h-14 px-8 text-base font-bold" onClick={openJoin}>
                  {language === "es" ? "REGISTRATE AHORA" : "REGISTER NOW"}
                  <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Dialog */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="glass-card border-primary/20 p-0 sm:max-w-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{language === "es" ? "Preview" : "Preview"}</DialogTitle>
            <DialogDescription>
              {language === "es"
                ? "Vista previa del contenido."
                : "Content preview."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between border-b border-border/50 p-4">
            <div className="flex items-center gap-2">
              <Disc3 className="h-5 w-5 text-primary" />
              <p className="font-semibold">
                {language === "es" ? "Preview" : "Preview"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsVideoOpen(false)}
              className="rounded-full p-2 hover:bg-muted"
              aria-label={language === "es" ? "Cerrar" : "Close"}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="aspect-video bg-black">
            <video
              controls
              playsInline
              className="h-full w-full object-cover"
              poster="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1600&q=80"
            >
              <source
                src="https://cdn.coverr.co/videos/coverr-dj-mixing-music-at-a-club-3790/1080p.mp4"
                type="video/mp4"
              />
            </video>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Dialog */}
      <Dialog open={isJoinOpen} onOpenChange={(open) => !isSubmitting && setIsJoinOpen(open)}>
        <DialogContent className="glass-card border-primary/20 sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {language === "es" ? "Unete gratis" : "Join for free"}
            </DialogTitle>
            <DialogDescription>
              {language === "es"
                ? "Te enviaremos el acceso directo a tu WhatsApp."
                : "We’ll send direct access to your WhatsApp."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-extrabold uppercase">
                {language === "es" ? "Unete gratis" : "Join for free"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {language === "es"
                  ? "Te enviaremos el acceso directo a tu WhatsApp."
                  : "We’ll send direct access to your WhatsApp."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsJoinOpen(false)}
              disabled={isSubmitting}
              className="rounded-full p-2 hover:bg-muted disabled:opacity-50"
              aria-label={language === "es" ? "Cerrar" : "Close"}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
            {language === "es"
              ? "“Descubre selecciones listas para eventos, organizadas por genero, cada semana.”"
              : "“Get event-ready selections, organized by genre, every week.”"}
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium">
                  {language === "es" ? "Nombre" : "First name"}
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder={language === "es" ? "DJ Carlos" : "DJ Carlos"}
                  autoComplete="given-name"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium">
                  {language === "es" ? "Apellido" : "Last name"}
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder={language === "es" ? "Gomez" : "Gomez"}
                  autoComplete="family-name"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                {language === "es" ? "WhatsApp" : "WhatsApp"}
              </Label>
              <div className="mt-1 grid grid-cols-[120px_1fr] gap-2">
                <select
                  value={countryData.country_code}
                  onChange={(e) => {
                    const code = e.target.value;
                    setCountryData((prev) => ({
                      ...prev,
                      country_code: code,
                      dial_code: COUNTRY_DIAL_CODES[code] || prev.dial_code,
                      country_name: countryNameFromCode(code, language === "es" ? "es" : "en"),
                    }));
                  }}
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"
                  aria-label={language === "es" ? "Pais" : "Country"}
                >
                  {countryOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.code} {opt.dial}
                    </option>
                  ))}
                </select>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder={language === "es" ? "55 1234 5678" : "(555) 123-4567"}
                  disabled={isSubmitting}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {language === "es"
                  ? `Solo numeros, sin el codigo de pais. Detectamos: ${countryData.country_name}`
                  : `Digits only, without country code. Detected: ${countryData.country_name}`}
              </p>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                {language === "es" ? "Email" : "Email"}
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder={language === "es" ? "dj@ejemplo.com" : "dj@example.com"}
                disabled={isSubmitting}
              />
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="gratis-consent-transactional"
                  checked={consentTransactional}
                  onCheckedChange={(checked) => {
                    setConsentTransactional(Boolean(checked));
                    if (checked) setConsentTouched(false);
                  }}
                  disabled={isSubmitting}
                  aria-required="true"
                />
                <Label
                  htmlFor="gratis-consent-transactional"
                  className="cursor-pointer text-xs leading-snug text-foreground"
                >
                  {language === "es"
                    ? "Acepto recibir mensajes transaccionales y de soporte por WhatsApp/SMS/email."
                    : "I agree to receive transactional and support messages via WhatsApp/SMS/email."}
                </Label>
              </div>

              <div className="mt-3 flex items-start gap-3">
                <Checkbox
                  id="gratis-consent-marketing"
                  checked={consentMarketing}
                  onCheckedChange={(checked) => setConsentMarketing(Boolean(checked))}
                  disabled={isSubmitting}
                />
                <Label
                  htmlFor="gratis-consent-marketing"
                  className="cursor-pointer text-xs leading-snug text-muted-foreground"
                >
                  {language === "es"
                    ? "Quiero recibir promociones y novedades por WhatsApp/SMS/email."
                    : "I want to receive promotions and updates via WhatsApp/SMS/email."}
                </Label>
              </div>

              {consentTouched && !consentTransactional && (
                <p className="mt-3 text-xs font-semibold text-destructive">
                  {language === "es"
                    ? "Requerido: confirma el consentimiento de soporte/transaccional."
                    : "Required: confirm transactional/support consent."}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="btn-primary-glow h-14 w-full text-base font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "es" ? "Enviando..." : "Sending..."}
                </>
              ) : language === "es" ? (
                "UNETE GRATIS AL GRUPO DE WHATSAPP"
              ) : (
                "JOIN THE WHATSAPP GROUP FOR FREE"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
