import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { createBestCheckoutUrl } from "@/lib/checkout";

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

export default function Anual() {
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

  const [consentTransactional, setConsentTransactional] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);

  const paymentBadges = useMemo(
    () => ["VISA", "MASTERCARD", "AMEX", "DISCOVER", "PayPal"],
    []
  );

  useEffect(() => {
    document.title =
      "Video Remixes Packs. La mejor plataforma de música y video para profesionales de la música de habla hispana";
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

  const openJoin = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const leadId = crypto.randomUUID();
      const { url } = await createBestCheckoutUrl({
        leadId,
        product: "anual",
        sourcePage: window.location.pathname,
      });

      if (url) {
        window.location.assign(url);
        return;
      }

      toast({
        title: language === "es" ? "Checkout no disponible" : "Checkout unavailable",
        description:
          language === "es"
            ? "Intenta de nuevo en unos segundos. Si continúa, contáctanos en Soporte."
            : "Please try again in a few seconds. If it continues, contact Support.",
        variant: "destructive",
      });
    } catch (err) {
      console.error("ANUAL checkout error:", err);
      toast({
        title: language === "es" ? "Error" : "Error",
        description:
          language === "es"
            ? "Hubo un problema al iniciar el pago. Intenta de nuevo."
            : "There was a problem starting checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, language, toast]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      const name = formData.name.trim();
      const email = formData.email.trim().toLowerCase();
      const { clean: cleanPhone, digits: phoneDigits } = normalizePhoneInput(formData.phone);

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
        const leadId = crypto.randomUUID();

        const leadBase = {
          id: leadId,
          name,
          email,
          phone: cleanPhone,
          country_code: countryData.dial_code,
          country_name: countryData.country_name,
          source: "anual",
          tags: ["anual", "membresia_anual"],
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

        try {
          const { error: syncError } = await supabase.functions.invoke("sync-manychat", {
            body: { leadId },
          });
          if (syncError && import.meta.env.DEV) console.warn("ManyChat sync error:", syncError);
        } catch (syncErr) {
          if (import.meta.env.DEV) console.warn("ManyChat sync threw:", syncErr);
        }

        setIsJoinOpen(false);

        // Try to redirect to Stripe Checkout (if configured). If not, fallback to thank-you.
        try {
          const { data: checkout, error: checkoutError } = await supabase.functions.invoke(
            "stripe-checkout",
            {
              body: { leadId, product: "anual" },
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
              body: { action: "create", leadId, product: "anual" },
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

        navigate("/anual/gracias");
      } catch (err) {
        console.error("ANUAL lead submit error:", err);
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
    ]
  );

  return (
    <main className="brand-frame min-h-screen bg-background">
      <SettingsToggle />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#1a1a1a] via-[#AA0202] to-[#1a1a1a]" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-10 md:pb-20 md:pt-14">
          <div className="flex items-center justify-between gap-4">
            <img
              src={theme === "dark" ? logoWhite : logoDark}
              alt="VideoRemixesPacks"
              className="h-10 w-auto object-contain md:h-12"
            />
            <p className="text-xs text-muted-foreground md:text-sm">
              soporte@videoremixpack.com
            </p>
          </div>

          <div className="mt-8 rounded-2xl bg-primary px-4 py-3 text-center text-sm font-black text-primary-foreground md:text-base">
            <span className="uppercase tracking-wide">AMIGO DJ:</span>{" "}
            Sigues perdiendo tiempo buscando material nuevo?
          </div>

          <div className="mt-10 grid gap-10 md:grid-cols-2 md:items-start">
            <div className="glass-card p-8 md:p-10">
              <p className="text-sm font-semibold text-muted-foreground">
                ¿Cansado de buscar material nuevo para tus eventos?
              </p>

              <h1 className="mt-4 font-display text-4xl font-black leading-[0.95] md:text-5xl">
                Compra tu{" "}
                <span className="text-gradient-red">acceso anual</span> a la membresía
                video remix packs y{" "}
                <span className="text-gradient-red">olvídate de buscar música</span>{" "}
                nuevamente
              </h1>

              <ul className="mt-6 space-y-3 text-sm text-muted-foreground md:text-base">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <span>7,000 videos en formato MP4</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <span>Los 30 géneros más populares</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <span>Listo para conectar y comenzar a tocar</span>
                </li>
              </ul>

              <div className="mt-8 flex items-end gap-6">
                <div>
                  <p className="text-sm font-black text-muted-foreground">
                    Precio anual
                  </p>
                  <p className="text-2xl font-black text-foreground md:text-3xl">
                    A sólo <span className="text-gradient-red">$195 USD</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>Tu información está 100% segura con nosotros</span>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  onClick={openJoin}
                  className="btn-primary-glow h-12 w-full text-base font-black md:h-14 md:text-lg"
                >
                  <span className="flex w-full flex-col items-center leading-tight">
                    <span>Acceder ahora</span>
                    <span className="text-xs font-semibold opacity-90">
                      Aprovecha el precio especial de $195 USD
                    </span>
                  </span>
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

            {/* Supporting image area (brand-style) */}
            <div className="glass-card p-8 md:p-10">
              <p className="text-sm font-semibold text-muted-foreground">¿Te ha pasado algo así?</p>
              <h2 className="mt-4 font-display text-4xl font-black leading-[0.95] md:text-5xl">
                El dilema eterno del{" "}
                <span className="text-gradient-red">dJ amateur</span> que{" "}
                <span className="text-gradient-red">quiere ser profesional</span>
              </h2>

              <div className="mt-6 space-y-3 text-sm text-muted-foreground md:text-base">
                <p>
                  Todos tenemos un amigo así: Quiere ser un DJ profesional, quiere cobrar caro, que lo recomienden
                  y tener muchos eventos...
                </p>
                <p>Pero NO quiere pagar por su música.</p>
                <p>- ¿Para qué? Es siempre su respuesta.</p>
                <p>- Hay muchas plataformas para bajar música sin pagar.</p>
                <p>
                  Este mismo amigo usa canciones con marcas de agua, con calidad de audio bastante baja y con sonidos
                  de fondo muy desagradables.
                </p>
                <p>
                  Desafortunadamente no podrá llegar muy lejos, ni cobrar caro si sigue usando esta estrategia...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expert section */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="glass-card p-8 md:p-10">
              <p className="text-sm font-semibold text-muted-foreground">Los DJ&apos;s expertos lo saben...</p>
              <h2 className="mt-4 font-display text-4xl font-black leading-[0.95] md:text-5xl">
                para <span className="text-gradient-red">ser un profesional</span> hay que tener{" "}
                <span className="text-gradient-red">música de la mejor calidad</span>
              </h2>

              <p className="mt-6 text-sm text-muted-foreground md:text-base">
                En Video Remix Packs tenemos más de 15 años de experiencia en la industria de la música. Y sabemos que
                es de vital importancia tener material de calidad para un evento.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-muted-foreground md:text-base">
                {[
                  "No pistas de dudosa procedencia",
                  "No material de plataformas gratuitas",
                  "No descargas con marcas de agua que sólo dañan tu reputación",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 space-y-2 text-sm text-muted-foreground md:text-base">
                <p>Sabemos que eres un profesional.</p>
                <p>Y por eso sólo buscas música y video de la mejor calidad.</p>
                <p>Preparado por expertos.</p>
                <p>Que se dedican a esto y que lo usan en sus eventos.</p>
                <p>Y tenemos la solución para ti:</p>
              </div>

              <p className="mt-8 font-display text-2xl font-black md:text-3xl">
                toda la música que necesitas para ambientar tu evento por un año! Te presentamos la...
              </p>
            </div>

            <div className="glass-card p-8 md:p-10">
              <h2 className="font-display text-4xl font-black leading-[0.95] md:text-5xl">
                <span className="text-gradient-red">membresía anual</span> video remix packs
              </h2>

              <div className="mt-6 space-y-3 text-sm text-muted-foreground md:text-base">
                <p>Una plataforma hecha por DJ&apos;s para DJ&apos;s.</p>
                <p>La mejor selección de música lista para descargar y usar en tus eventos.</p>
                <p>Sé parte de la mejor comunidad de DJ&apos;s de habla hispana.</p>
              </div>

              <p className="mt-8 font-display text-2xl font-black md:text-3xl">
                aprovecha esta oferta por tiempo limitado
              </p>

              <div className="mt-6">
                <p className="text-sm font-black text-muted-foreground">Precio anual</p>
                <p className="text-3xl font-black">
                  a sólo <span className="text-gradient-red">$195 USD</span>
                </p>
              </div>

              <div className="mt-8">
                <Button
                  onClick={openJoin}
                  className="btn-primary-glow h-12 w-full text-base font-black md:h-14 md:text-lg"
                >
                  <span className="flex w-full flex-col items-center leading-tight">
                    <span>Quiero un año de música ilimitada</span>
                    <span className="text-xs font-semibold opacity-90">
                      Menos de $16.25 USD por mes
                    </span>
                  </span>
                </Button>
                <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-4 w-4 text-primary" />
                  Tu información está 100% segura con nosotros
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="glass-card p-8 md:p-10">
            <h2 className="font-display text-4xl font-black leading-[0.95] md:text-5xl">
              ¿Qué obtienes con la <span className="text-gradient-red">membresía anual</span> video remix packs?
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <ul className="space-y-3 text-sm text-muted-foreground md:text-base">
                {[
                  "Más de 10,000 horas de música, videos y karaoke listos para usarse",
                  "Pistas revisadas y editadas por profesionales",
                  "Los 40 géneros más buscados incluyendo latino, reggaeton, tribal, bachata y más...",
                  "Música libre de sellos o marcas de agua",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <ul className="space-y-3 text-sm text-muted-foreground md:text-base">
                {[
                  "Excelente calidad de audio",
                  "Descarga segura",
                  "Actualizaciones constantes",
                  "Biblioteca ordenada por géneros y carpetas para facilitar tu búsqueda",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bonus */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="glass-card p-8 md:p-10">
            <p className="text-sm font-black text-primary">
              BONO ESPECIAL: asesoría <span className="underline">GRATIS</span> con
            </p>
            <h2 className="mt-3 font-display text-5xl font-black leading-[0.95] md:text-6xl">
              Gustavo <span className="text-gradient-red">García</span>
            </h2>

            <ul className="mt-8 space-y-3 text-sm text-muted-foreground md:text-base">
              {[
                "DJ profesional con más de 15 años de experiencia",
                "Ha tenido la oportunidad de tocar en bares y clubes de México y Estados Unidos",
                "Ha colaborado con grandes colegas de la industria",
                "Creador de la Plataforma Video Remixes Packs",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Star className="mt-0.5 h-5 w-5 text-primary" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            <p className="mt-10 text-sm text-muted-foreground md:text-base">
              ¿Quieres recibir tips y sugerencias de un experto? ¿Quieres saber cómo aprovechar tus aparatos al máximo?
              ¿Quieres saber qué aparatos son los mejores? O simplemente, ¿quieres charlar con un profesional de la música?
            </p>

            <p className="mt-6 text-sm font-semibold text-foreground md:text-base">
              Esta asesoría por separado te costaría más de $500 USD Y la obtienes GRATIS al adquirir tu membresía anual Video
              Remix Packs. Aprovecha la oferta hoy.
            </p>

            <div className="mt-10 flex justify-center">
              <Button
                onClick={openJoin}
                className="btn-primary-glow h-12 w-full max-w-2xl text-base font-black md:h-14 md:text-lg"
              >
                <span className="flex w-full flex-col items-center leading-tight">
                  <span>Sí, quiero música ilimitada por un año</span>
                  <span className="text-xs font-semibold opacity-90">
                    Quiero aprovechar el precio especial de $195 USD
                  </span>
                </span>
              </Button>
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-4 w-4 text-primary" />
              Tu información está 100% segura con nosotros
            </p>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="font-display text-5xl font-black leading-[0.95] md:text-6xl">
              ¿Qué dicen <span className="text-gradient-red">nuestros usuarios</span>?
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Lo recomiendo!",
                body: [
                  "La verdad primero fue un poco difícil creer o confiar en alguien que no conoces.",
                  "He probado el sonido y el contenido y tiene muy buena variedad y además muy bien organizado.",
                  "- Jerry H.",
                ],
              },
              {
                title: "Excelente!",
                body: [
                  "Muy satisfecho, muy bien organizada y de muy buena calidad.",
                  "También cabe destacar la gran variedad en los géneros.",
                  "- Leobardo M.",
                ],
              },
              {
                title: "De primera calidad!",
                body: [
                  "Las mezclas y el material original que tienen aquí no se encuentran en cualquier lado.",
                  "Definitivamente vale la pena.",
                  "- Roberto C.",
                ],
              },
            ].map((t) => (
              <div key={t.title} className="glass-card p-7">
                <p className="font-display text-2xl font-black">{t.title}</p>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {t.body.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              onClick={openJoin}
              className="btn-primary-glow h-12 w-full max-w-2xl text-base font-black md:h-14 md:text-lg"
            >
              <span className="flex w-full flex-col items-center leading-tight">
                <span>Sí, quiero acceso a la membresía anual</span>
                <span className="text-xs font-semibold opacity-90">
                  Quiero aprovechar el precio especial de $195 USD
                </span>
              </span>
            </Button>
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-4 w-4 text-primary" />
            Tu información está 100% segura con nosotros
          </p>
        </div>
      </section>

      {/* Who is it for */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="glass-card p-8 md:p-10">
            <h2 className="font-display text-4xl font-black leading-[0.95] md:text-5xl">
              ¿Para quién es la <span className="text-gradient-red">membresía anual</span>?
            </h2>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">
              Si eres DJ de tiempo completo o estás en el proceso de serlo, esta membresía es PARA TI!
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="glass-card p-7">
                <p className="font-display text-2xl font-black">
                  DJ&apos;s que <span className="text-gradient-red">NO</span> usan Video Remix Packs
                </p>
                <ul className="mt-5 space-y-3 text-sm text-muted-foreground md:text-base">
                  {[
                    "Pasan horas buscando música nueva",
                    "Encuentran material de dudosa calidad",
                    "Usan plataformas gratuitas que no son profesionales",
                    "No invierten en mejorar su negocio",
                    "Quieren ahorrar dinero y a la vez cobrar más",
                    "Siguen usando las mismas canciones de hace 20 años",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <TrendingUp className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card p-7">
                <p className="font-display text-2xl font-black">
                  DJ&apos;s que <span className="text-gradient-red">SÍ</span> usan Video Remix Packs
                </p>
                <ul className="mt-5 space-y-3 text-sm text-muted-foreground md:text-base">
                  {[
                    "Aprovechan el tiempo creciendo su negocio",
                    "Tienen material de la mejor calidad",
                    "Pagan por usar la música",
                    "Invierten en herramientas para se negocio",
                    "Pueden cobrar más por su servicio",
                    "Tienen la música más actual",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <Users className="mt-0.5 h-5 w-5 text-primary" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center">
            <h2 className="font-display text-5xl font-black leading-[0.95] md:text-6xl">
              Estas son las <span className="text-gradient-red">Preguntas Frecuentes</span>
            </h2>
          </div>

          <div className="mt-10 glass-card p-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>¿Qué incluye la membresía?</AccordionTrigger>
                <AccordionContent>
                  Más de 10,000 horas de música, videos y karaoke listos para usarse. Pistas revisadas y editadas por profesionales.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>¿Qué géneros hay en la plataforma?</AccordionTrigger>
                <AccordionContent>
                  Los 40 géneros más buscados incluyendo latino, reggaeton, tribal, bachata y más...
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>¿Hay límite de descargas?</AccordionTrigger>
                <AccordionContent>
                  Acceso anual a la plataforma con descargas seguras y actualizaciones constantes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>¿Puedo acceder a un demo?</AccordionTrigger>
                <AccordionContent>
                  Regístrate y te contactamos por WhatsApp para darte indicaciones y el acceso correspondiente.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              onClick={openJoin}
              className="btn-primary-glow h-12 w-full max-w-2xl text-base font-black md:h-14 md:text-lg"
            >
              <span className="flex w-full flex-col items-center leading-tight">
                <span>Acceder a la membresía anual</span>
                <span className="text-xs font-semibold opacity-90">
                  Quiero aprovechar el precio especial de $195 USD
                </span>
              </span>
            </Button>
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-4 w-4 text-primary" />
            Tu información está 100% segura con nosotros
          </p>
        </div>
      </section>

      {/* Still not sure */}
      <section className="relative pb-20 pt-6 md:pb-28">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="glass-card p-8 md:p-10">
            <h2 className="font-display text-5xl font-black leading-[0.95] md:text-6xl">
              ¿aún no <span className="text-gradient-red">estás seguro</span>?
            </h2>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">
              Aquí hay más recomendaciones de usuarios satisfechos
            </p>

            <div className="mt-10 glass-card p-7">
              <h3 className="font-display text-3xl font-black">Haciendo cuentas...</h3>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                Si para este momento no estás convencido de que somos tu mejor opción, te dejamos estos números
              </p>

              <div className="mt-6 space-y-3 text-sm text-muted-foreground md:text-base">
                <p>
                  Si pasas una hora a la semana (cuando menos) buscando música nueva, estás invirtiendo $29 USD (si ganaras el
                  salario mínimo en USA). La membresía es más económica (SÓLO $16.25 USD por mes).
                </p>
                <p>
                  Como DJ, puedes cobrar 25 USD por hora aproximadamente. Si ahorraras una hora al mes porque tienes música
                  ilimitada, podrías pagar la membresía.
                </p>
                <p>
                  ¿Te gusta el café de Starbucks? Un café cuesta alrededor de $3 USD. Deja de comprar un café a la semana y tienes
                  $24 USD al mes para invertir en tu membresía.
                </p>
                <p>El tiempo es tu recurso más valioso y NO se recupera.</p>
                <p>No pongas en riesgo tu reputación, invierte en tu herramienta más importante!</p>
                <p>Adquiere hoy tu membresía anual y olvídate de buscar música, videos y karaoke por UN AÑO!</p>
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  onClick={openJoin}
                  className="btn-primary-glow h-12 w-full max-w-2xl text-base font-black md:h-14 md:text-lg"
                >
                  <span className="flex w-full flex-col items-center leading-tight">
                    <span>Acceder a la membresía anual</span>
                    <span className="text-xs font-semibold opacity-90">
                      Quiero aprovechar el precio especial de $195 USD
                    </span>
                  </span>
                </Button>
              </div>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-4 w-4 text-primary" />
                Tu información está 100% segura con nosotros
              </p>
            </div>

            <div className="mt-10">
              <p className="font-display text-4xl font-black leading-[0.95] md:text-5xl">
                Paso 1. <span className="text-gradient-red">Ingresa tus Datos</span>
              </p>
            </div>

            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <Button
                onClick={openJoin}
                className="btn-primary-glow h-12 w-full max-w-2xl text-base font-black md:h-14 md:text-lg"
              >
                Registrarme ahora
              </Button>
              <p className="text-xs text-muted-foreground">
                Video Remixes Packs © 2024. Derechos Reservados
              </p>
              <p className="text-xs text-muted-foreground">
                Política de Privacidad | Términos y Condiciones
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join modal */}
      <Dialog open={isJoinOpen} onOpenChange={(open) => !isSubmitting && setIsJoinOpen(open)}>
        <DialogContent className="glass-card border-border/60 p-0 sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>{language === "es" ? "Acceso anual" : "Annual access"}</DialogTitle>
            <DialogDescription>
              {language === "es"
                ? "Déjanos tus datos para enviarte el acceso."
                : "Leave your details so we can send access."}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 md:p-7">
            <h3 className="font-display text-3xl font-black">
              {language === "es" ? "Paso 1. Ingresa tus Datos" : "Step 1. Enter your details"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {language === "es"
                ? "Déjanos tus datos para confirmación y soporte. Te contactamos por WhatsApp."
                : "Leave your details for confirmation and support. We’ll contact you on WhatsApp."}
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="anual-name">{language === "es" ? "Nombre" : "Name"}</Label>
                <Input
                  id="anual-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={language === "es" ? "Tu nombre completo" : "Your full name"}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="anual-email">Email</Label>
                <Input
                  id="anual-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="anual-phone">{language === "es" ? "WhatsApp" : "WhatsApp"}</Label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-10 shrink-0 border-border/60 bg-card/40 px-3 text-sm text-muted-foreground"
                    title={countryData.country_name}
                  >
                    {countryData.dial_code}
                  </Badge>
                  <Input
                    id="anual-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder={language === "es" ? "Tu número" : "Your number"}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="anual-consent-transactional"
                    checked={consentTransactional}
                    onCheckedChange={(checked) => {
                      setConsentTransactional(Boolean(checked));
                      if (checked) setConsentTouched(false);
                    }}
                    disabled={isSubmitting}
                    aria-required="true"
                  />
                  <Label
                    htmlFor="anual-consent-transactional"
                    className="cursor-pointer text-xs leading-snug text-foreground"
                  >
                    {language === "es"
                      ? "Acepto recibir mensajes transaccionales y de soporte por WhatsApp/SMS/email."
                      : "I agree to receive transactional and support messages via WhatsApp/SMS/email."}
                  </Label>
                </div>

                <div className="mt-3 flex items-start gap-3">
                  <Checkbox
                    id="anual-consent-marketing"
                    checked={consentMarketing}
                    onCheckedChange={(checked) => setConsentMarketing(Boolean(checked))}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="anual-consent-marketing"
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
