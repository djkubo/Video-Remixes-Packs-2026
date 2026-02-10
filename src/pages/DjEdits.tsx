import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Headphones,
  Loader2,
  Lock,
  Sparkles,
  Zap,
} from "lucide-react";
import SettingsToggle from "@/components/SettingsToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import HlsVideo from "@/components/HlsVideo";
import djEditsPoster from "@/assets/dj-edits-poster.jpg";
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

const COURSE_CHECKOUT_URL =
  "https://videoremixpack.app.clientclub.net/courses/offers/d5dfb603-d36f-474c-801e-1fce88c1a31d";

const PREVIEW_HLS_URL =
  "https://content.apisystem.tech/hls/medias/kIG3EUjfgGLoNW0QsJLS/media/transcoded_videos/cts-824a03253a87c3fb_,360,480,720,1080,p.mp4.urlset/master.m3u8";

export default function DjEdits() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isJoinOpen, setIsJoinOpen] = useState(false);
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

  const paymentBadges = useMemo(
    () => ["VISA", "MASTERCARD", "AMEX", "DISCOVER", "PayPal"],
    []
  );

  useEffect(() => {
    document.title = "DJ Edits | Aprende a crear DJ edits desde cero";
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

  const openJoin = useCallback(() => setIsJoinOpen(true), []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      const name = formData.name.trim();
      const email = formData.email.trim().toLowerCase();
      const { clean: cleanPhone, digits: phoneDigits } = normalizePhoneInput(
        formData.phone
      );

      if (!name || !email || !cleanPhone) {
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

      setIsSubmitting(true);
      try {
        const leadId = crypto.randomUUID();

        const { error: insertError } = await supabase.from("leads").insert({
          id: leadId,
          name,
          email,
          phone: cleanPhone,
          country_code: countryData.dial_code,
          country_name: countryData.country_name,
          source: "djedits",
          tags: ["djedits", "course_interest"],
        });

        if (insertError) throw insertError;

        try {
          const { error: syncError } = await supabase.functions.invoke(
            "sync-manychat",
            {
              body: { leadId },
            }
          );
          if (syncError && import.meta.env.DEV)
            console.warn("ManyChat sync error:", syncError);
        } catch (syncErr) {
          if (import.meta.env.DEV) console.warn("ManyChat sync threw:", syncErr);
        }

        // After capturing the lead, we can send them to checkout.
        window.location.href = COURSE_CHECKOUT_URL;
      } catch (err) {
        console.error("DJEDITS lead submit error:", err);
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
      countryData.dial_code,
      countryData.country_name,
      formData.email,
      formData.name,
      formData.phone,
      isSubmitting,
      language,
      toast,
    ]
  );

  return (
    <main className="min-h-screen bg-background">
      <SettingsToggle />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-60" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-10 md:pb-20 md:pt-14">
          <div className="flex items-center justify-between gap-4">
            <img
              src={theme === "dark" ? logoWhite : logoDark}
              alt="VideoRemixesPacks"
              className="h-10 w-auto object-contain md:h-12"
            />
            <p className="text-xs text-muted-foreground md:text-sm">
              videoremixespacks@outlook.com
            </p>
          </div>

          <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-start">
            <div className="glass-card p-8 md:p-10">
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                CURSO
              </Badge>
              <h1 className="mt-5 font-display text-4xl font-black leading-[0.95] md:text-5xl">
                Como Hacer Tus Propios{" "}
                <span className="text-gradient-red">DJ EDITS</span>
              </h1>
              <p className="mt-6 text-sm text-muted-foreground md:text-base">
                Aprende paso a paso a crear tus primeros <strong>DJ edits</strong>{" "}
                y adapta canciones a tu estilo y tus sets.
              </p>
              <p className="mt-4 text-sm text-muted-foreground md:text-base">
                Un curso exclusivo, claro y sin tecnicismos para que logres
                resultados reales desde el <strong>PRIMER DIA</strong>.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={openJoin}
                  className="btn-primary-glow h-12 flex-1 text-base font-black"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Empezar ahora
                </Button>
                <Button
                  variant="outline"
                  className="h-12 flex-1 text-base font-black"
                  onClick={() => navigate("/")}
                >
                  <Headphones className="mr-2 h-5 w-5 text-primary" />
                  Ver VRP
                </Button>
              </div>

              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-4 w-4 text-primary" />
                Tu información está 100% segura con nosotros
              </p>
            </div>

            <div className="glass-card p-8 md:p-10">
              <p className="text-sm font-semibold text-muted-foreground">
                ¡Hola! Soy <strong>DJ NACH</strong> y te doy la bienvenida al
                curso de <strong>DJ Edits</strong>.
              </p>

              <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-black">
                <div className="aspect-video">
                  <HlsVideo
                    src={PREVIEW_HLS_URL}
                    poster={djEditsPoster}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="mt-8 grid gap-3">
                <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <p className="text-sm font-black text-foreground">QUE INCLUYE:</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {[
                      "Acceso instantáneo a todas las lecciones.",
                      "Aprende paso a paso cómo transformar una canción original en una versión adaptada para cabina.",
                      "Descubre por qué los DJ edits son esenciales, cómo optimizar el sonido para entornos de club y domina el flujo completo desde la idea hasta el track listo para mezclar.",
                      "Aprende a crear tus primeros DJ edits desde cero.",
                      "Explicaciones simples, sin tecnicismos.",
                      "Resultados reales desde el primer día.",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <p className="text-sm font-black text-foreground">QUE NO INCLUYE:</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {[
                      "No necesitas experiencia previa.",
                      "No requieres equipo profesional ni software costoso.",
                      "No es teoría aburrida: todo es práctico y aplicable.",
                      "No pierdes tiempo con relleno, solo lo que realmente funciona.",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <BadgeCheck className="mt-0.5 h-5 w-5 text-primary" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learn */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="glass-card p-8 md:p-10">
            <h2 className="font-display text-4xl font-black leading-[0.95] md:text-5xl">
              ¿Qué <span className="text-gradient-red">aprenderás</span>?
            </h2>
            <p className="mt-5 text-sm text-muted-foreground md:text-base">
              En este curso aprenderás, de forma clara y práctica, a crear
              distintos tipos de <strong>DJ edits</strong>, para que tus sesiones
              sean mucho más fluidas, creativas y profesionales.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Flujo completo",
                  body: "Desde la idea hasta el track listo para mezclar.",
                },
                {
                  title: "Club ready",
                  body: "Optimiza el sonido para entornos de club.",
                },
                {
                  title: "Sin tecnicismos",
                  body: "Explicaciones simples y prácticas.",
                },
              ].map((c) => (
                <div key={c.title} className="glass-card p-6">
                  <p className="font-display text-2xl font-black">{c.title}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Price / CTA */}
      <section className="relative pb-20 pt-6 md:pb-28">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="glass-card p-8 md:p-10 text-center">
            <p className="font-display text-4xl font-black">
              Empieza <span className="text-gradient-red">Ahora</span>!
            </p>
            <p className="mt-3 font-display text-2xl font-black">
              <span className="text-gradient-red">PAGO UNICO</span> 70 USD
            </p>
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              *Oferta Por Tiempo Limitado*
            </p>

            <div className="mt-8 flex flex-col items-center gap-3">
              <Button
                onClick={openJoin}
                className="btn-primary-glow h-12 w-full max-w-md text-base font-black"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                CLICK AQUI
              </Button>

              <a
                href={COURSE_CHECKOUT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir checkout en nueva pestaña
              </a>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {paymentBadges.map((label) => (
                  <Badge
                    key={label}
                    variant="outline"
                    className="border-border/60 bg-card/40 px-3 py-1 text-[11px] text-muted-foreground"
                  >
                    <CreditCard className="mr-2 h-3 w-3 text-primary" />
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <p className="mt-8 text-xs text-muted-foreground">
              Video Remixes Packs © {new Date().getFullYear()}. Derechos
              Reservados
            </p>
          </div>
        </div>
      </section>

      {/* Join modal */}
      <Dialog open={isJoinOpen} onOpenChange={(open) => !isSubmitting && setIsJoinOpen(open)}>
        <DialogContent className="glass-card border-border/60 p-0 sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {language === "es" ? "Curso DJ Edits" : "DJ Edits course"}
            </DialogTitle>
            <DialogDescription>
              {language === "es"
                ? "Déjanos tus datos para confirmar y llevarte al checkout."
                : "Leave your details so we can confirm and send you to checkout."}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 md:p-7">
            <h3 className="font-display text-3xl font-black">
              {language === "es" ? "Ingresa tus datos" : "Enter your details"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {language === "es"
                ? "Guardamos tu registro y te llevamos al checkout."
                : "We save your registration and send you to checkout."}
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="djedits-name">
                  {language === "es" ? "Nombre" : "Name"}
                </Label>
                <Input
                  id="djedits-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder={language === "es" ? "Tu nombre completo" : "Your full name"}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="djedits-email">Email</Label>
                <Input
                  id="djedits-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="djedits-phone">
                  {language === "es" ? "WhatsApp" : "WhatsApp"}
                </Label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-10 shrink-0 border-border/60 bg-card/40 px-3 text-sm text-muted-foreground"
                    title={countryData.country_name}
                  >
                    {countryData.dial_code}
                  </Badge>
                  <Input
                    id="djedits-phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder={language === "es" ? "Tu número" : "Your number"}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="btn-primary-glow h-12 w-full text-base font-black"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "es" ? "Enviando..." : "Submitting..."}
                  </>
                ) : (
                  language === "es" ? "Continuar al pago" : "Continue to payment"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {language === "es"
                  ? "Tu información está 100% segura con nosotros"
                  : "Your information is 100% secure with us"}
              </p>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
