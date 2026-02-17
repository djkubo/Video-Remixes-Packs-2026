import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Disc3,
  Gift,
  Loader2,
  Play,
  ShieldCheck,
  Star,
  Users,
  X,
  Zap,
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
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDataLayer } from "@/hooks/useDataLayer";
import logoWhite from "@/assets/logo-white.webp";
import { countryNameFromCode, detectCountryCodeFromTimezone } from "@/lib/country";

type CountryData = {
  country_code: string;
  country_name: string;
  dial_code: string;
};

const COUNTRY_DIAL_CODES: Record<string, string> = {
  US: "+1", MX: "+52", ES: "+34", AR: "+54", CO: "+57", CL: "+56", PE: "+51",
  VE: "+58", EC: "+593", GT: "+502", CU: "+53", DO: "+1", HN: "+504",
  SV: "+503", NI: "+505", CR: "+506", PA: "+507", UY: "+598", PY: "+595",
  BO: "+591", PR: "+1", BR: "+55", PT: "+351", CA: "+1", GB: "+44",
  FR: "+33", DE: "+49", IT: "+39",
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const { trackFormSubmit } = useDataLayer();

  const isSpanish = language === "es";

  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [countryData, setCountryData] = useState<CountryData>({
    country_code: "US", country_name: "United States", dial_code: "+1",
  });

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
  });

  const [consentTransactional, setConsentTransactional] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);

  const countryOptions = useMemo(() => {
    return Object.entries(COUNTRY_DIAL_CODES)
      .map(([code, dial]) => ({ code, dial }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, []);

  useEffect(() => {
    const code = detectCountryCodeFromTimezone() || "US";
    const dialCode = COUNTRY_DIAL_CODES[code] || "+1";
    setCountryData({
      country_code: code,
      dial_code: dialCode,
      country_name: countryNameFromCode(code, isSpanish ? "es" : "en"),
    });
  }, [isSpanish]);

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
          title: isSpanish ? "Campos requeridos" : "Required fields",
          description: isSpanish ? "Por favor completa todos los campos." : "Please fill in all fields.",
          variant: "destructive",
        });
        return;
      }

      if (!isValidEmail(email)) {
        toast({
          title: isSpanish ? "Email inválido" : "Invalid email",
          description: isSpanish ? "Por favor ingresa un email válido." : "Please enter a valid email.",
          variant: "destructive",
        });
        return;
      }

      if (
        cleanPhone.length > 20 ||
        !/^\+?\d{7,20}$/.test(cleanPhone) ||
        !/[1-9]/.test(phoneDigits)
      ) {
        toast({
          title: isSpanish ? "WhatsApp inválido" : "Invalid WhatsApp",
          description: isSpanish ? "Número de teléfono no válido." : "Phone number is not valid.",
          variant: "destructive",
        });
        return;
      }

      setConsentTouched(true);
      if (!consentTransactional) {
        toast({
          title: isSpanish ? "Confirmación requerida" : "Confirmation required",
          description: isSpanish
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
          title: "Error",
          description: isSpanish
            ? "Hubo un problema al enviar tus datos. Intenta de nuevo."
            : "There was a problem submitting your data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      consentMarketing, consentTransactional, countryData.dial_code,
      countryData.country_name, formData, isSubmitting, isSpanish,
      navigate, toast, trackEvent, trackFormSubmit,
    ]
  );

  /* ─── render ─── */
  return (
    <main className="min-h-screen bg-[#070707] text-[#EFEFEF]">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#1a1a1a] via-[#AA0202] to-[#1a1a1a]" />

        <div className="container relative z-10 mx-auto px-4 pb-16 pt-20 md:pb-24 md:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <img src={logoWhite} alt="VideoRemixesPack" className="mx-auto h-16 w-auto object-contain md:h-20" />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-8"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-[#AA0202]/40 bg-[#AA0202]/10 px-4 py-2 font-bebas text-xs uppercase tracking-widest text-[#AA0202] backdrop-blur-sm">
                <Gift className="h-4 w-4" />
                {isSpanish ? "ACCESO GRATIS POR WHATSAPP" : "FREE ACCESS VIA WHATSAPP"}
              </span>

              <h1 className="mt-6 font-bebas text-4xl uppercase tracking-tight md:text-6xl">
                {isSpanish ? (
                  <>LA MEJOR MÚSICA LATINA PARA DJS <span className="text-[#AA0202]">DIRECTO</span> EN TU WHATSAPP</>
                ) : (
                  <>THE BEST LATIN MUSIC FOR DJS <span className="text-[#AA0202]">DIRECTLY</span> TO YOUR WHATSAPP</>
                )}
              </h1>

              <p className="mx-auto mt-6 max-w-2xl font-sans text-base text-zinc-400 md:text-lg">
                {isSpanish
                  ? "Recibe selecciones listas para pinchar y organizadas por género. Sin spam. Sin perder horas buscando."
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
                className="group relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl border border-[#5E5E5E] bg-[#111111] transition-all duration-300 hover:border-[#AA0202]"
                aria-label={isSpanish ? "Ver video" : "Watch video"}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#AA0202]/10 via-transparent to-transparent" />
                <div className="relative z-10 flex items-center gap-3">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#AA0202]/20 text-[#AA0202] transition-all group-hover:bg-[#AA0202] group-hover:text-[#EFEFEF]">
                    <Play className="h-6 w-6" />
                  </span>
                  <div className="text-left">
                    <p className="font-sans text-sm font-semibold text-[#EFEFEF]">
                      {isSpanish ? "Mira el preview" : "Watch the preview"}
                    </p>
                    <p className="font-sans text-xs text-zinc-400">
                      {isSpanish ? "Calidad real. Listo para eventos." : "Real quality. Ready for events."}
                    </p>
                  </div>
                </div>
              </button>

              <div className="flex flex-col justify-center gap-4 rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6 text-left">
                <div className="flex items-start gap-3">
                  <Users className="mt-1 h-5 w-5 text-[#AA0202]" />
                  <div>
                    <p className="font-sans font-semibold text-[#EFEFEF]">
                      {isSpanish ? "Grupo exclusivo: solo contenido." : "Exclusive group: content only."}
                    </p>
                    <p className="font-sans text-sm text-zinc-400">
                      {isSpanish
                        ? "Entras, descargas y mezclas. Nosotros hacemos el filtro por ti."
                        : "Join, download, and mix. We filter the noise for you."}
                    </p>
                  </div>
                </div>

                <Button size="lg"
                  className="btn-primary-glow min-h-[56px] w-full font-bebas text-xl uppercase tracking-wide"
                  onClick={openJoin}>
                  <Zap className="mr-2 h-5 w-5" />
                  {isSpanish ? "QUIERO UNIRME AL GRUPO" : "JOIN THE GROUP"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="font-sans text-xs text-zinc-500">
                  {isSpanish
                    ? "Te pediremos tu WhatsApp para mandarte el acceso."
                    : "We'll ask for your WhatsApp to send you access."}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-bebas text-4xl uppercase md:text-5xl">
            {isSpanish ? (
              <>¿QUÉ OBTENDRÁS EN EL <span className="text-[#AA0202]">WHATSAPP</span>?</>
            ) : (
              <>WHAT WILL YOU GET ON <span className="text-[#AA0202]">WHATSAPP</span>?</>
            )}
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              {
                title: isSpanish ? "SELECCIÓN MUSICAL DE ALTA CALIDAD" : "HIGH-QUALITY MUSIC SELECTION",
                body: isSpanish ? "Cada semana recibes un repertorio nuevo, organizado por género." : "Weekly drops, organized by genre."
              },
              {
                title: isSpanish ? "ORGANIZACIÓN PROFESIONAL" : "PRO ORGANIZATION",
                body: isSpanish ? "Lo que sirve en pista. Sin relleno. Sin versiones inútiles." : "What works on the floor. No filler."
              },
              {
                title: isSpanish ? "AHORRO DE TIEMPO" : "SAVE TIME",
                body: isSpanish ? "Deja de perder horas buscando. Nosotros filtramos." : "Stop wasting hours searching. We filter."
              },
              {
                title: isSpanish ? "ACTUALIZACIONES CONSTANTES" : "CONSTANT UPDATES",
                body: isSpanish ? "Contenido fresco para renovar tus sets." : "Fresh content to refresh your sets."
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6 transition-all duration-300 hover:border-[#AA0202] hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-[#AA0202]" />
                  <div>
                    <h3 className="font-bebas text-xl uppercase">{item.title}</h3>
                    <p className="mt-2 font-sans text-sm text-zinc-400">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why special + Process ── */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1a1a1a] via-[#AA0202] to-[#1a1a1a]" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-bebas text-4xl uppercase md:text-5xl">
              {isSpanish ? (
                <>¿POR QUÉ ESTE GRUPO ES <span className="text-[#AA0202]">ESPECIAL</span>?</>
              ) : (
                <>WHY IS THIS GROUP <span className="text-[#AA0202]">SPECIAL</span>?</>
              )}
            </h2>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: isSpanish ? "ORGANIZADO Y EXCLUSIVO" : "ORGANIZED & EXCLUSIVE",
                  body: isSpanish ? "Grupo cerrado: solo nosotros compartimos los enlaces." : "Closed group: only we share links."
                },
                {
                  title: isSpanish ? "MÚSICA PARA EVENTOS SOCIALES" : "MUSIC FOR SOCIAL EVENTS",
                  body: isSpanish ? "Bodas, quinceañeras, corporativos y más." : "Weddings, quinceañeras, corporate events."
                },
                {
                  title: isSpanish ? "CERO SPAM" : "ZERO SPAM",
                  body: isSpanish ? "Sin mensajes de extraños. Solo música." : "No random messages. Just music."
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6 transition-all duration-300 hover:border-[#AA0202] hover:-translate-y-0.5">
                  <h3 className="font-bebas text-xl uppercase">{item.title}</h3>
                  <p className="mt-2 font-sans text-sm text-zinc-400">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 md:items-stretch">
              <div className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-[#AA0202]" />
                  <div>
                    <h3 className="font-bebas text-2xl uppercase">
                      {isSpanish ? "¿CÓMO FUNCIONA EL PROCESO?" : "HOW DOES IT WORK?"}
                    </h3>
                    <ol className="mt-4 space-y-2 font-sans text-sm text-zinc-400">
                      {[
                        isSpanish ? "Completa el formulario" : "Fill the form",
                        isSpanish ? "Recibe el acceso por WhatsApp" : "Get access via WhatsApp",
                        isSpanish ? "Contenido nuevo cada semana" : "New content weekly",
                      ].map((step, i) => (
                        <li key={step} className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#AA0202]/20 text-xs font-bold text-[#AA0202]">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <Button size="lg"
                  className="btn-primary-glow mt-6 min-h-[56px] w-full font-bebas text-xl uppercase tracking-wide"
                  onClick={openJoin}>
                  <Zap className="mr-2 h-5 w-5" />
                  {isSpanish ? "QUIERO UNIRME AL GRUPO" : "JOIN THE GROUP"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6">
                <h3 className="font-bebas text-2xl uppercase">
                  {isSpanish ? "DJS QUE YA LO USAN" : "DJS ALREADY USING IT"}
                </h3>
                <div className="mt-5 space-y-4">
                  {[
                    {
                      quote: isSpanish
                        ? `"Desde que me uní, siempre traigo novedades y mis eventos están prendidísimos."`
                        : `"Since I joined, I always have fresh tracks and my events are on fire."`,
                      name: isSpanish ? "DJ Carlos, CDMX" : "DJ Carlos, Mexico City"
                    },
                    {
                      quote: isSpanish
                        ? `"Antes pasaba horas buscando música. Ahora llega directo al WhatsApp."`
                        : `"I used to spend hours searching. Now it hits my WhatsApp."`,
                      name: isSpanish ? "DJ Valentina, Lima" : "DJ Valentina, Lima"
                    },
                    {
                      quote: isSpanish
                        ? `"Muy recomendable: todo organizado por género y listo para descargar."`
                        : `"Highly recommended: organized by genre and ready to download."`,
                      name: isSpanish ? "Fernando, Bogotá" : "Fernando, Bogota"
                    },
                  ].map((t) => (
                    <div key={t.name} className="rounded-xl border border-[#5E5E5E] bg-[#070707] p-4">
                      <p className="font-sans text-sm text-[#EFEFEF]">{t.quote}</p>
                      <p className="mt-2 text-right font-sans text-[10px] text-zinc-500">{t.name} ✓✓</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="mt-12 text-center">
              <h2 className="font-bebas text-4xl uppercase md:text-5xl">
                {isSpanish ? (
                  <>REGÍSTRATE Y OBTÉN ACCESO <span className="text-[#AA0202]">GRATIS</span></>
                ) : (
                  <>REGISTER AND GET <span className="text-[#AA0202]">FREE</span> ACCESS</>
                )}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl font-sans text-sm text-zinc-400 md:text-base">
                {isSpanish
                  ? "No vuelvas a quedarte sin nuevos éxitos. Entra hoy y lleva tus mezclas al siguiente nivel."
                  : "Never run out of fresh hits. Join today and level up your sets."}
              </p>
              <div className="mt-6 flex justify-center">
                <Button size="lg"
                  className="btn-primary-glow min-h-[56px] px-8 font-bebas text-xl uppercase tracking-wide"
                  onClick={openJoin}>
                  <Zap className="mr-2 h-5 w-5" />
                  {isSpanish ? "REGÍSTRATE AHORA" : "REGISTER NOW"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Video Dialog ── */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-0 sm:max-w-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription>{isSpanish ? "Vista previa del contenido." : "Content preview."}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between border-b border-[#5E5E5E] p-4">
            <div className="flex items-center gap-2">
              <Disc3 className="h-5 w-5 text-[#AA0202]" />
              <p className="font-sans font-semibold text-[#EFEFEF]">Preview</p>
            </div>
            <button type="button" onClick={() => setIsVideoOpen(false)}
              className="rounded-full p-2 text-zinc-400 hover:bg-[#070707] hover:text-[#EFEFEF]"
              aria-label={isSpanish ? "Cerrar" : "Close"}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="aspect-video bg-black">
            <video controls playsInline className="h-full w-full object-cover"
              poster="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1600&q=80">
              <source src="https://cdn.coverr.co/videos/coverr-dj-mixing-music-at-a-club-3790/1080p.mp4" type="video/mp4" />
            </video>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Join Dialog ── */}
      <Dialog open={isJoinOpen} onOpenChange={(open) => !isSubmitting && setIsJoinOpen(open)}>
        <DialogContent className="rounded-2xl border border-[#5E5E5E] bg-[#111111] sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>{isSpanish ? "Únete gratis" : "Join for free"}</DialogTitle>
            <DialogDescription>
              {isSpanish ? "Te enviaremos el acceso directo a tu WhatsApp." : "We'll send direct access to your WhatsApp."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bebas text-2xl uppercase">
                {isSpanish ? "ÚNETE GRATIS" : "JOIN FOR FREE"}
              </h2>
              <p className="mt-1 font-sans text-sm text-zinc-400">
                {isSpanish
                  ? "Te enviaremos el acceso directo a tu WhatsApp."
                  : "We'll send direct access to your WhatsApp."}
              </p>
            </div>
            <button type="button" onClick={() => setIsJoinOpen(false)} disabled={isSubmitting}
              className="rounded-full p-2 text-zinc-400 hover:bg-[#070707] hover:text-[#EFEFEF] disabled:opacity-50"
              aria-label={isSpanish ? "Cerrar" : "Close"}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-[#AA0202]/20 bg-[#AA0202]/5 p-4 font-sans text-sm text-zinc-400">
            {isSpanish
              ? `"Descubre selecciones listas para eventos, organizadas por género, cada semana."`
              : `"Get event-ready selections, organized by genre, every week."`}
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-[#EFEFEF]">
                  {isSpanish ? "Nombre" : "First name"}
                </Label>
                <Input id="firstName" value={formData.firstName}
                  onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder={isSpanish ? "DJ Carlos" : "DJ Carlos"}
                  autoComplete="given-name" disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-[#EFEFEF]">
                  {isSpanish ? "Apellido" : "Last name"}
                </Label>
                <Input id="lastName" value={formData.lastName}
                  onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder={isSpanish ? "Gomez" : "Gomez"}
                  autoComplete="family-name" disabled={isSubmitting} />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-[#EFEFEF]">WhatsApp</Label>
              <div className="mt-1 grid grid-cols-[120px_1fr] gap-2">
                <select
                  value={countryData.country_code}
                  onChange={(e) => {
                    const code = e.target.value;
                    setCountryData((prev) => ({
                      ...prev,
                      country_code: code,
                      dial_code: COUNTRY_DIAL_CODES[code] || prev.dial_code,
                      country_name: countryNameFromCode(code, isSpanish ? "es" : "en"),
                    }));
                  }}
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-md border border-[#5E5E5E] bg-[#111111] px-3 text-sm text-[#EFEFEF]"
                  aria-label={isSpanish ? "País" : "Country"}
                >
                  {countryOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.code} {opt.dial}</option>
                  ))}
                </select>
                <Input id="phone" type="tel" inputMode="tel" autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder={isSpanish ? "55 1234 5678" : "(555) 123-4567"}
                  disabled={isSubmitting} />
              </div>
              <p className="mt-1 font-sans text-xs text-zinc-500">
                {isSpanish
                  ? `Solo números, sin el código de país. Detectamos: ${countryData.country_name}`
                  : `Digits only, without country code. Detected: ${countryData.country_name}`}
              </p>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-[#EFEFEF]">Email</Label>
              <Input id="email" type="email" autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder={isSpanish ? "dj@ejemplo.com" : "dj@example.com"}
                disabled={isSubmitting} />
            </div>

            <div className="rounded-xl border border-[#AA0202]/20 bg-[#AA0202]/5 p-4">
              <div className="flex items-start gap-3">
                <Checkbox id="gratis-consent-transactional"
                  checked={consentTransactional}
                  onCheckedChange={(checked) => {
                    setConsentTransactional(Boolean(checked));
                    if (checked) setConsentTouched(false);
                  }}
                  disabled={isSubmitting} aria-required="true" />
                <Label htmlFor="gratis-consent-transactional"
                  className="cursor-pointer text-xs leading-snug text-[#EFEFEF]">
                  {isSpanish
                    ? "Acepto recibir mensajes transaccionales y de soporte por WhatsApp/SMS/email."
                    : "I agree to receive transactional and support messages via WhatsApp/SMS/email."}
                </Label>
              </div>

              <div className="mt-3 flex items-start gap-3">
                <Checkbox id="gratis-consent-marketing"
                  checked={consentMarketing}
                  onCheckedChange={(checked) => setConsentMarketing(Boolean(checked))}
                  disabled={isSubmitting} />
                <Label htmlFor="gratis-consent-marketing"
                  className="cursor-pointer text-xs leading-snug text-zinc-400">
                  {isSpanish
                    ? "Quiero recibir promociones y novedades por WhatsApp/SMS/email."
                    : "I want to receive promotions and updates via WhatsApp/SMS/email."}
                </Label>
              </div>

              {consentTouched && !consentTransactional && (
                <p className="mt-3 text-xs font-semibold text-destructive">
                  {isSpanish
                    ? "Requerido: confirma el consentimiento de soporte/transaccional."
                    : "Required: confirm transactional/support consent."}
                </p>
              )}
            </div>

            <Button type="submit" size="lg" disabled={isSubmitting}
              className="btn-primary-glow min-h-[56px] w-full font-bebas text-xl uppercase tracking-wide">
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "ENVIANDO..." : "SENDING..."}</>
              ) : (
                <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "ÚNETE GRATIS AL GRUPO" : "JOIN THE GROUP FREE"}<ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
