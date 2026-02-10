import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  CreditCard,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";
import { countryNameFromCode, detectCountryCodeFromTimezone } from "@/lib/country";

type CountryData = {
  country_code: string;
  country_name: string;
  dial_code: string;
};

type PlanId = "plan_1tb_mensual" | "plan_2tb_anual";

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

const PLAN_DETAILS: Record<
  PlanId,
  {
    label: string;
    priceLabel: string;
    tags: string[];
  }
> = {
  plan_1tb_mensual: {
    label: "Plan 1 TB / Mes",
    priceLabel: "$19.50 mensual",
    tags: ["membresia", "plan_1tb_mensual"],
  },
  plan_2tb_anual: {
    label: "Plan 2 TB / Año",
    priceLabel: "$195 anual",
    tags: ["membresia", "plan_2tb_anual"],
  },
};

export default function Membresia() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<PlanId>("plan_2tb_anual");

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
    document.title =
      "La Membresía DJ Latina #1 | Audio, Video y Karaoke lista para mezclar";
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

  const openJoin = useCallback(
    (plan?: PlanId) => {
      if (plan) setSelectedPlan(plan);
      setIsJoinOpen(true);
    },
    []
  );

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
              ? "Ingresa un número válido."
              : "Enter a valid number.",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const leadId = crypto.randomUUID();

        const planTags = PLAN_DETAILS[selectedPlan].tags;

        const { error: insertError } = await supabase.from("leads").insert({
          id: leadId,
          name,
          email,
          phone: cleanPhone,
          country_code: countryData.dial_code,
          country_name: countryData.country_name,
          source: "membresia",
          tags: planTags,
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

        setIsJoinOpen(false);

        // Try to redirect to Stripe Checkout (if configured). If not, fallback to thank-you.
        try {
          const { data: checkout, error: checkoutError } = await supabase.functions.invoke(
            "stripe-checkout",
            {
              body: { leadId, product: selectedPlan },
            }
          );

          if (checkoutError && import.meta.env.DEV) {
            console.warn("Stripe checkout error:", checkoutError);
          }

          const url = (checkout as { url?: unknown } | null)?.url;
          if (typeof url === "string" && url.length > 0) {
            window.location.assign(url);
            return;
          }
        } catch (stripeErr) {
          if (import.meta.env.DEV) console.warn("Stripe invoke threw:", stripeErr);
        }

        // Fallback: PayPal redirect (if configured).
        try {
          const { data: paypal, error: paypalError } = await supabase.functions.invoke(
            "paypal-checkout",
            {
              body: { action: "create", leadId, product: selectedPlan },
            }
          );

          if (paypalError && import.meta.env.DEV) {
            console.warn("PayPal checkout error:", paypalError);
          }

          const approveUrl = (paypal as { approveUrl?: unknown } | null)?.approveUrl;
          if (typeof approveUrl === "string" && approveUrl.length > 0) {
            window.location.assign(approveUrl);
            return;
          }
        } catch (paypalErr) {
          if (import.meta.env.DEV) console.warn("PayPal invoke threw:", paypalErr);
        }

        navigate(`/membresia/gracias?plan=${encodeURIComponent(selectedPlan)}`);
      } catch (err) {
        console.error("MEMBRESIA lead submit error:", err);
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
      navigate,
      selectedPlan,
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

          <div className="mt-12 grid gap-10 md:grid-cols-2 md:items-start">
            <div className="glass-card p-8 md:p-10">
              <h1 className="font-display text-5xl font-black leading-[0.92] md:text-6xl">
                La <span className="text-gradient-red">Membresía DJ Latina</span>{" "}
                #1
              </h1>
              <p className="mt-4 font-display text-3xl font-black leading-[0.95] md:text-4xl">
                música organizada,
                <br />
                actualizada y lista para romper la pista.
              </p>

              <p className="mt-6 text-sm text-muted-foreground md:text-base">
                Descarga +50,000 canciones latinas y regionales en calidad
                profesional. música 100% organizada por género.
              </p>

              <ul className="mt-8 space-y-3 text-sm text-muted-foreground md:text-base">
                {[
                  "Descarga por carpetas, sin perder tiempo",
                  "Escucha todos los demos antes de suscribirte",
                  "Actualización semanal con los últimos éxitos",
                  "Compatible con Serato, Rekordbox y VirtualDJ",
                  "Soporte VIP 24/7 en español",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                <Button asChild className="btn-primary-glow h-12 text-base font-black">
                  <Link to="/explorer">
                    <Headphones className="mr-2 h-5 w-5" />
                    Quiero escuchar los demos
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 text-base font-black"
                  onClick={() => openJoin(selectedPlan)}
                >
                  <Zap className="mr-2 h-5 w-5 text-primary" />
                  Adquiere tu membresía
                </Button>
              </div>

              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-4 w-4 text-primary" />
                Tu información está 100% segura con nosotros
              </p>
            </div>

            <div className="glass-card p-8 md:p-10">
              <p className="text-sm font-semibold text-muted-foreground">
                🎧 Todo lo que un DJ latino necesita, en un solo lugar
              </p>
              <p className="mt-4 text-sm text-muted-foreground md:text-base">
                ¿Cansado de perder horas buscando música en diferentes fuentes?
                Olvídate de descargar track por track o pagar varias
                suscripciones. Aquí tienes toda la música que necesitas en un
                solo sitio, organizada y lista para tocar.
              </p>

              <div className="mt-8 space-y-3 text-sm text-muted-foreground md:text-base">
                {[
                  "+50,000 canciones en MP3 320kbps & MP4 HD",
                  "Descarga por carpetas completas o FileZilla ultrarrápido",
                  "Géneros Reggaetón, Salsa, Cumbia, Regional, Pop Latino y más",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Button asChild className="btn-primary-glow h-12 w-full text-base font-black">
                  <Link to="/explorer">
                    <Headphones className="mr-2 h-5 w-5" />
                    Quiero escuchar los demos
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="glass-card p-8 md:p-10">
            <div className="text-center">
              <p className="text-sm font-semibold text-muted-foreground">
                Lo que otros están diciendo.
              </p>
              <h2 className="mt-3 font-display text-4xl font-black leading-[0.95] md:text-5xl">
                DJs reales.{" "}
                <span className="text-gradient-red">Resultados reales.</span>
              </h2>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {[
                {
                  name: "DJ Carlos (Miami, FL)",
                  quote:
                    '"Nunca había encontrado un pool con tanta variedad de música latina. Me ahorra horas de búsqueda y los remixes exclusivos son 🔥🔥🔥."',
                },
                {
                  name: "DJ Andrea (Los Ángeles, CA)",
                  quote:
                    '"Mi repertorio se duplicó en un mes con esta membresía. Descargar por carpetas y FileZilla es una bendición."',
                },
              ].map((t) => (
                <div key={t.name} className="glass-card p-7">
                  <p className="font-display text-2xl font-black">{t.name}</p>
                  <p className="mt-4 text-sm text-muted-foreground md:text-base">
                    {t.quote}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Button
                onClick={() => openJoin(selectedPlan)}
                className="btn-primary-glow h-12 w-full max-w-2xl text-base font-black md:h-14 md:text-lg"
              >
                Adquiere tu membresía
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="font-display text-5xl font-black leading-[0.95] md:text-6xl">
              Escoge el plan que{" "}
              <span className="text-gradient-red">mejor</span> se adapte a tus
              necesidades
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* Plan 1TB */}
            <div className="glass-card p-8 md:p-10">
              <p className="font-display text-3xl font-black">
                {PLAN_DETAILS.plan_1tb_mensual.label}
              </p>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                {PLAN_DETAILS.plan_1tb_mensual.priceLabel}
              </p>

              <ul className="mt-6 space-y-3 text-sm text-muted-foreground md:text-base">
                {[
                  "1 TB Descargas mensual",
                  "Acceso completo a remixes exclusivos",
                  "Soporte VIP",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button
                  onClick={() => openJoin("plan_1tb_mensual")}
                  className="btn-primary-glow h-12 w-full text-base font-black"
                >
                  Adquiere tu membresía
                </Button>
              </div>
            </div>

            {/* Plan 2TB */}
            <div className="glass-card p-8 md:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-display text-3xl font-black">
                  {PLAN_DETAILS.plan_2tb_anual.label}
                </p>
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                  Recomendado
                </Badge>
              </div>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                {PLAN_DETAILS.plan_2tb_anual.priceLabel}
              </p>

              <ul className="mt-6 space-y-3 text-sm text-muted-foreground md:text-base">
                {[
                  "2 TB Descargas mensual",
                  "Acceso completo a remixes exclusivos",
                  "Soporte VIP",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button
                  onClick={() => openJoin("plan_2tb_anual")}
                  className="btn-primary-glow h-12 w-full text-base font-black"
                >
                  Adquiere tu membresía
                </Button>

                <div className="mt-4 flex flex-wrap items-center gap-2">
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
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Button asChild className="btn-primary-glow h-12 w-full max-w-2xl text-base font-black md:h-14 md:text-lg">
              <Link to="/explorer">
                <Headphones className="mr-2 h-5 w-5" />
                Quiero escuchar los demos
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center">
            <h2 className="font-display text-5xl font-black leading-[0.95] md:text-6xl">
              <span className="text-gradient-red">Preguntas</span> Frecuentes
            </h2>
          </div>

          <div className="mt-10 glass-card p-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>¿Puedo cancelar cuando quiera?</AccordionTrigger>
                <AccordionContent>Sí, sin permanencia.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>¿Puedo escuchar la música antes de pagar?</AccordionTrigger>
                <AccordionContent>
                  Sí, puedes registrarte y escuchar los demos.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>¿Cómo descargo la música?</AccordionTrigger>
                <AccordionContent>
                  Puedes descargar por carpetas o usar FileZilla.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>¿Qué pasa si no encuentro una canción?</AccordionTrigger>
                <AccordionContent>
                  Pide una edición personalizada y la creamos para ti.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              onClick={() => openJoin(selectedPlan)}
              className="btn-primary-glow h-12 w-full max-w-2xl text-base font-black md:h-14 md:text-lg"
            >
              Adquiere tu membresía
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="relative pb-20 pt-6 md:pb-28">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="glass-card p-8 md:p-10 text-center">
            <p className="text-xs text-muted-foreground">
              © Copyrights {new Date().getFullYear()} | Gustavo García™ | Terms &
              Conditions
            </p>
          </div>
        </div>
      </section>

      {/* Join modal */}
      <Dialog open={isJoinOpen} onOpenChange={(open) => !isSubmitting && setIsJoinOpen(open)}>
        <DialogContent className="glass-card border-border/60 p-0 sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {language === "es" ? "Adquirir membresía" : "Get membership"}
            </DialogTitle>
            <DialogDescription>
              {language === "es"
                ? "Déjanos tus datos para confirmar tu plan y enviarte el acceso."
                : "Leave your details so we can confirm your plan and send access."}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 md:p-7">
            <h3 className="font-display text-3xl font-black">
              {language === "es" ? "Ingresa tus datos" : "Enter your details"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {language === "es"
                ? "Te contactamos por WhatsApp para confirmar tu plan y enviarte el acceso."
                : "We’ll contact you on WhatsApp to confirm your plan and send access."}
            </p>

            <div className="mt-6">
              <Label className="text-sm">
                {language === "es" ? "Plan" : "Plan"}
              </Label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(Object.keys(PLAN_DETAILS) as PlanId[]).map((planId) => {
                  const isActive = selectedPlan === planId;
                  const plan = PLAN_DETAILS[planId];
                  return (
                    <button
                      key={planId}
                      type="button"
                      onClick={() => setSelectedPlan(planId)}
                      aria-pressed={isActive}
                      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                        isActive
                          ? "border-primary/60 bg-primary/10"
                          : "border-border/60 bg-card/40 hover:bg-card/60"
                      }`}
                    >
                      <p className="text-sm font-black">{plan.label}</p>
                      <p className="text-xs text-muted-foreground">{plan.priceLabel}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="membresia-name">
                  {language === "es" ? "Nombre" : "Name"}
                </Label>
                <Input
                  id="membresia-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder={language === "es" ? "Tu nombre completo" : "Your full name"}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="membresia-email">Email</Label>
                <Input
                  id="membresia-email"
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
                <Label htmlFor="membresia-phone">
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
                    id="membresia-phone"
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
                  language === "es" ? "Enviar" : "Submit"
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
