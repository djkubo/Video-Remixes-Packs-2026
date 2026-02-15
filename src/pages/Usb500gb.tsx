import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  CreditCard,
  Crown,
  Loader2,
  Package,
  ShieldCheck,
  Truck,
  Usb,
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
import { Checkbox } from "@/components/ui/checkbox";
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

export default function Usb500gb() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isOrderOpen, setIsOrderOpen] = useState(false);
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
    document.title = "La USB Definitiva";
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

  const openOrder = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const leadId = crypto.randomUUID();
      const { url } = await createBestCheckoutUrl({
        leadId,
        product: "usb_500gb",
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
      console.error("USB500GB checkout error:", err);
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
          source: "usb_500gb",
          tags: ["usb_500gb", "usb_definitiva", "usb_order"],
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

        setIsOrderOpen(false);

        // Try to redirect to Stripe Checkout (if configured). If not, fallback to thank-you.
        try {
          const { data: checkout, error: checkoutError } = await supabase.functions.invoke(
            "stripe-checkout",
            {
              body: { leadId, product: "usb_500gb" },
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
              body: { action: "create", leadId, product: "usb_500gb" },
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

        navigate("/usb-500gb/gracias");
      } catch (err) {
        console.error("USB 500GB lead submit error:", err);
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

      {/* Top feature strip */}
      <div className="border-b border-border/40 bg-card/40 backdrop-blur">
        <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-2 px-4 py-4 text-center text-xs text-muted-foreground md:grid-cols-3 md:text-sm">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>+50,000 Canciones en MP3 (320 kbps) listas para mezclar</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span>Organizadas por géneros para máxima facilidad</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Usb className="h-4 w-4 text-primary" />
            <span>Compatible con Serato, Virtual DJ, Rekordbox y más</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#1a1a1a] via-[#AA0202] to-[#1a1a1a]" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-16 md:pb-20 md:pt-24">
          <div className="flex items-center justify-center">
            <img
              src={theme === "dark" ? logoWhite : logoDark}
              alt="VideoRemixesPacks"
              className="h-14 w-auto object-contain md:h-16"
            />
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2 md:items-start">
            {/* Product visual (stylized) */}
            <div className="glass-card overflow-hidden p-5">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/25 via-background to-background">
                <div className="absolute inset-0 opacity-70">
                  <div className="absolute -left-10 top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
                  <div className="absolute -right-12 bottom-8 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                </div>
                <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-card/40">
                    <Usb className="h-10 w-10 text-primary" />
                  </div>
                  <p className="mt-6 text-sm text-muted-foreground">USB Definitiva</p>
                  <p className="font-display text-4xl font-black tracking-wide">500 GB</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    MP3 320 kbps • Organizada • Lista para eventos
                  </p>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div>
              <h1 className="font-display text-4xl font-black leading-[0.95] md:text-5xl">
                USB Definitiva:
              </h1>
              <h2 className="mt-2 font-display text-4xl font-black leading-[0.95] md:text-5xl">
                +<span className="text-gradient-red">50,000 Canciones MP3 para DJ Latinos en USA</span>,
                {" "}Organizadas y Listas para Mezclar
              </h2>

              <p className="mt-5 text-sm text-muted-foreground md:text-base">
                Ahorra tiempo, olvídate del estrés y deslumbra en cada evento con lo mejor de cumbia, banda,
                reggaetón, bachata, salsa, dembow, corridos y mucho más.
              </p>

              <div className="mt-7">
                <Button
                  onClick={openOrder}
                  className="btn-primary-glow h-12 w-full text-base font-black md:w-auto md:px-10"
                >
                  <span className="flex w-full flex-col items-center leading-tight">
                    <span>👉 ¡QUIERO MI USB AHORA! 👈</span>
                    <span className="text-xs font-semibold opacity-90">📦 Stock limitado.</span>
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
                <p className="mt-3 text-xs text-muted-foreground">
                  También puedes pagar en cuotas al finalizar tu compra.
                </p>
              </div>
            </div>
          </div>

          {/* Problems */}
          <div className="mt-14 grid gap-8 md:grid-cols-2 md:items-start">
            <div className="glass-card p-8">
              <p className="font-display text-sm font-black uppercase tracking-[0.25em] text-primary">
                No repitas la historia
              </p>
              <h3 className="mt-3 font-display text-4xl font-black leading-[0.95] md:text-5xl">
                ¿Te Suena Familiar Alguno de Estos Problemas?
              </h3>

              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {[
                  "¿Pierdes horas cada semana descargando música de baja calidad?",
                  "¿Estás harto de archivos desorganizados que te hacen quedar mal en tus eventos?",
                  "¿Te cuesta encontrar versiones limpias y perfectas para eventos familiares?",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-sm font-semibold text-foreground">
                Si respondiste SÍ a cualquiera de estas preguntas, ¡esto es para ti!
              </p>
            </div>

            <div className="glass-card p-8">
              <p className="font-display text-sm font-black uppercase tracking-[0.25em] text-primary">
                Aquí Tienes La Solución (Oferta Única)
              </p>
              <h3 className="mt-3 font-display text-4xl font-black leading-[0.95] md:text-5xl">
                Presentamos nuestra exclusiva{" "}
                <span className="text-gradient-red">USB DJ Edición Latina</span>
              </h3>

              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Usb className="mt-0.5 h-5 w-5 text-primary" />
                  <span>
                    500 GB con +50,000 canciones MP3 (320 kbps) completamente organizadas por géneros.*
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="mt-0.5 h-5 w-5 text-primary" />
                  <span>
                    Los géneros más pedidos en eventos latinos: cumbia, banda, reggaetón, bachata, salsa, dembow,
                    corridos, sonidera, zapateado y muchos más.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <span>
                    Compatible 100% con tu software DJ favorito: Serato, Virtual DJ, Rekordbox, Traktor y cualquier otro.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Gains */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="font-display text-sm font-black uppercase tracking-[0.25em] text-primary">
              ¿Qué Ganas Comprando Esta USB Hoy?
            </p>
            <h2 className="mt-3 font-display text-5xl font-black leading-[0.95] md:text-6xl">
              Deja de Perder Tiempo y Empieza a Ganar Más con Tu Música
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="glass-card p-7">
              <h3 className="font-display text-3xl font-black">Hoy:</h3>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                {[
                  "Pierdes cientos de horas buscando, y organizando música manualmente.",
                  "No tienes acceso inmediato a intros, outros y versiones clean y explicit listas para mezclar.",
                  "Te cuesta subir tus tarifas y conseguir más eventos por no contar con música profesional.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-7">
              <h3 className="font-display text-3xl font-black">Con la USB:</h3>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                {[
                  "Ahorra cientos de horas de trabajo en búsqueda y organización.",
                  "Acceso instantáneo a versiones exclusivas listas para mezclar: intros, outros, versiones clean y explicit.",
                  "Aumenta tus tarifas y consigue más eventos al brindar shows impecables con música profesional.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 glass-card p-8 text-center">
            <p className="font-display text-3xl font-black md:text-4xl">
              Menos estrés, más ingresos y mayor prestigio en cada presentación.
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                onClick={openOrder}
                className="btn-primary-glow h-12 w-full max-w-xl text-base font-black"
              >
                ¡ORDENA TU USB AHORA MISMO! 🚀 Tu música, tu éxito
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Recibe en casa la USB más completa y organizada para DJs latinos en USA.
            </p>
          </div>
        </div>
      </section>

      {/* Bonus */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="glass-card p-8 md:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-black text-primary">
                <Crown className="h-4 w-4" />
                Bonus Irresistible (GRATIS por Tiempo Limitado)
              </div>
              <h2 className="mt-5 font-display text-5xl font-black leading-[0.95] md:text-6xl">
                Acceso Exclusivo a nuestra plataforma{" "}
                <span className="text-gradient-red">SKOOL</span>
              </h2>
            </div>

            <ul className="mt-8 space-y-3 text-sm text-muted-foreground md:text-base">
              {[
                "Reuniones semanales en vivo para enseñarte cómo generar más dinero como DJ.",
                "Conexión con cientos de DJs latinos en EE.UU. para compartir experiencias y crecer juntos.",
                "Recursos exclusivos para hacer crecer tu negocio DJ de inmediato.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex justify-center">
              <Button
                onClick={openOrder}
                className="btn-primary-glow h-12 w-full max-w-xl text-base font-black"
              >
                ¡ORDENA TU USB AHORA MISMO! No pierdas más tiempo buscando música
              </Button>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Obtén la colección definitiva y haz que cada evento sea inolvidable.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="font-display text-sm font-black uppercase tracking-[0.25em] text-primary">
              dj&apos;s que han comprado la usb definitiva
            </p>
            <h2 className="mt-3 font-display text-5xl font-black leading-[0.95] md:text-6xl">
              <span className="text-gradient-red">Lo Que Dicen Nuestros Clientes</span>
            </h2>
            <p className="mt-2 font-display text-3xl font-black md:text-4xl">
              (Testimonios Reales)
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                quote:
                  "“Olvidé lo que es descargar música cada fin de semana. Ahora solo conecto y listo, puro éxito en cada evento.\"",
                who: "- Ricardo (Houston tx)",
              },
              {
                quote:
                  "\"La mejor inversión que hice en mi carrera de DJ. Calidad de primera, organización increíble y un soporte genial.\"",
                who: "- Javier (Miami fl)",
              },
              {
                quote:
                  "\"Esta USB cambió totalmente mi negocio. Ahora tengo más eventos y gano más dinero sin estrés. ¡Súper recomendada!\"",
                who: "- Carlos (Los Angeles, CA)",
              },
            ].map((t) => (
              <div key={t.who} className="glass-card p-6">
                <p className="text-sm text-muted-foreground">{t.quote}</p>
                <p className="mt-4 font-display text-xl font-black">{t.who}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              onClick={openOrder}
              className="btn-primary-glow h-12 w-full max-w-xl text-base font-black"
            >
              ¡ORDENA TU USB AHORA MISMO! No pierdas más tiempo buscando música
            </Button>
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="glass-card p-8">
            <h2 className="text-center font-display text-4xl font-black md:text-5xl">
              Nuestra Garantía de Confianza Total
            </h2>

            <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 text-primary" />
                <span>
                  Envío rápido desde EE.UU. por USPS (Correo Regular), directo hasta tu casa en aproximadamente 5 días.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <span>Soporte personalizado en español directo por WhatsApp.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                <span>Compra segura y protegida</span>
              </li>
            </ul>

            <div className="mt-10 flex justify-center">
              <Button
                onClick={openOrder}
                className="btn-primary-glow h-12 w-full max-w-xl text-base font-black"
              >
                ¡ORDENA TU USB AHORA MISMO! No pierdas más tiempo buscando música
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Special offer */}
      <section className="relative pb-20 pt-6 md:pb-28">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="glass-card p-8 text-center">
            <h2 className="font-display text-5xl font-black leading-[0.95] md:text-6xl">
              Oferta Especial Por <span className="text-gradient-red">Tiempo Limitado</span>!
            </h2>

            <p className="mt-8 font-display text-2xl font-black md:text-3xl">
              Si contaras las horas que pierdes organizando tu librería musical
            </p>

            <p className="mt-3 font-display text-4xl font-black md:text-5xl">
              podrías perder{" "}
              <span className="text-gradient-red">cientos de dólares</span> en tiempo operativo.
            </p>

            <p className="mt-5 text-sm text-muted-foreground">
              Pero hoy tienes todo esto por un precio increíble:
            </p>

            <div className="mt-8 flex justify-center">
              <Button
                onClick={openOrder}
                className="btn-primary-glow h-14 w-full max-w-2xl text-base font-black md:text-lg"
              >
                <span className="flex w-full flex-col items-center leading-tight">
                  <span>ORDENA YA - POR $197</span>
                  <span className="text-xs font-semibold opacity-90">
                    ⚠️ Atención: Unidades limitadas disponibles, no te quedes sin la tuya.
                  </span>
                </span>
              </Button>
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Copyrights 2025 |Gustavo Garcia™ | Terms &amp; Conditions
          </p>
        </div>
      </section>

      {/* Order modal */}
      <Dialog open={isOrderOpen} onOpenChange={setIsOrderOpen}>
        <DialogContent className="glass-card border-border/60 p-0 sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {language === "es" ? "Antes de pagar" : "Before checkout"}
            </DialogTitle>
            <DialogDescription>
              {language === "es"
                ? "Déjanos tus datos para confirmación, tracking y soporte."
                : "Leave your details for confirmation, tracking, and support."}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 md:p-7">
            <h3 className="font-display text-3xl font-black">
              {language === "es" ? "Antes de pagar" : "Before checkout"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {language === "es"
                ? "Déjanos tus datos para confirmación, tracking y soporte. Después te enviamos al checkout."
                : "Leave your details for confirmation, tracking, and support. Then we’ll send you to checkout."}
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="usb500-name">{language === "es" ? "Nombre" : "Name"}</Label>
                <Input
                  id="usb500-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={language === "es" ? "Tu nombre completo" : "Your full name"}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usb500-email">Email</Label>
                <Input
                  id="usb500-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usb500-phone">{language === "es" ? "WhatsApp" : "WhatsApp"}</Label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-10 shrink-0 border-border/60 bg-card/40 px-3 text-sm text-muted-foreground"
                    title={countryData.country_name}
                  >
                    {countryData.dial_code}
                  </Badge>
                  <Input
                    id="usb500-phone"
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
                    id="usb500-consent-transactional"
                    checked={consentTransactional}
                    onCheckedChange={(checked) => {
                      setConsentTransactional(Boolean(checked));
                      if (checked) setConsentTouched(false);
                    }}
                    disabled={isSubmitting}
                    aria-required="true"
                  />
                  <Label
                    htmlFor="usb500-consent-transactional"
                    className="cursor-pointer text-xs leading-snug text-foreground"
                  >
                    {language === "es"
                      ? "Acepto recibir mensajes transaccionales y de soporte por WhatsApp/SMS/email."
                      : "I agree to receive transactional and support messages via WhatsApp/SMS/email."}
                  </Label>
                </div>

                <div className="mt-3 flex items-start gap-3">
                  <Checkbox
                    id="usb500-consent-marketing"
                    checked={consentMarketing}
                    onCheckedChange={(checked) => setConsentMarketing(Boolean(checked))}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="usb500-consent-marketing"
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
                ) : language === "es" ? (
                  "Continuar"
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
