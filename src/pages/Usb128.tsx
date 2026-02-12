import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  Package,
  ShieldCheck,
  Truck,
  Usb,
  Zap,
} from "lucide-react";

import Footer from "@/components/Footer";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { countryNameFromCode, detectCountryCodeFromTimezone } from "@/lib/country";
import usbSamsungBarPlus from "@/assets/usb128-samsung-bar-plus.jpg";

type CountryData = {
  country_code: string;
  country_name: string;
  dial_code: string;
};

type LeadFormData = {
  name: string;
  email: string;
  phone: string;
};

type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
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

export default function Usb128() {
  const { language } = useLanguage();
  const { trackEvent } = useAnalytics();
  const { toast } = useToast();

  const isSpanish = language === "es";

  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);

  const [countryData, setCountryData] = useState<CountryData>({
    country_code: "US",
    country_name: "United States",
    dial_code: "+1",
  });

  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    phone: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof LeadFormData, boolean>>({
    name: false,
    email: false,
    phone: false,
  });

  const paymentBadges = useMemo(
    () => ["VISA", "MASTERCARD", "AMEX", "DISCOVER", "PayPal", "Klarna", "Afterpay"],
    []
  );

  const socialStats = useMemo(
    () => [
      {
        label: isSpanish ? "DJs latinos" : "Latino DJs",
        value: "7,000+",
      },
      {
        label: isSpanish ? "Canciones en la USB" : "Songs on USB",
        value: "10,000+",
      },
      {
        label: isSpanish ? "Calificación soporte" : "Support rating",
        value: "4.9/5",
      },
    ],
    [isSpanish]
  );

  const valueBullets = useMemo(
    () => [
      isSpanish
        ? "Biblioteca latina lista para tocar: cumbia, salsa, bachata, reggaetón, regional y más"
        : "Latin library ready for gigs: cumbia, salsa, bachata, reggaeton, regional, and more",
      isSpanish
        ? "Estructura por género para encontrar rápido lo que te pide la pista"
        : "Genre-first structure so you find requested tracks fast",
      isSpanish
        ? "Compatibilidad real con Serato, VirtualDJ y Rekordbox"
        : "Real compatibility with Serato, VirtualDJ, and Rekordbox",
      isSpanish
        ? "Soporte humano por WhatsApp en español"
        : "Human Spanish WhatsApp support",
    ],
    [isSpanish]
  );

  const faqItems = useMemo(
    () => [
      {
        id: "faq-1",
        q: isSpanish ? "¿Cuánto cuesta la USB 128 GB?" : "How much is the 128 GB USB?",
        a: isSpanish
          ? "La oferta es $147 USD pago único. Puedes pagar con tarjeta o PayPal, y según país también en cuotas con Klarna/Afterpay."
          : "The offer is a one-time $147 USD payment. You can pay with card or PayPal, and depending on country also in installments via Klarna/Afterpay.",
      },
      {
        id: "faq-2",
        q: isSpanish ? "¿Qué incluye exactamente?" : "What exactly is included?",
        a: isSpanish
          ? "Incluye +10,000 canciones latinas en MP3 (320 kbps), organizadas por género para DJs, más soporte en español."
          : "It includes +10,000 Latin MP3 songs (320 kbps), organized by genre for DJs, plus Spanish support.",
      },
      {
        id: "faq-3",
        q: isSpanish
          ? "¿Funciona con Serato, VirtualDJ y Rekordbox?"
          : "Does it work with Serato, VirtualDJ, and Rekordbox?",
        a: isSpanish
          ? "Sí. El formato MP3 funciona en Serato, VirtualDJ, Rekordbox y setups DJ estándar en Mac/Windows."
          : "Yes. MP3 works with Serato, VirtualDJ, Rekordbox, and standard DJ setups on Mac/Windows.",
      },
      {
        id: "faq-4",
        q: isSpanish ? "¿Puedo escuchar demos antes?" : "Can I hear demos before buying?",
        a: isSpanish
          ? "Sí. Puedes revisar previews por género en el explorador antes de pagar."
          : "Yes. You can review genre previews in the explorer before paying.",
      },
      {
        id: "faq-5",
        q: isSpanish ? "¿Envían fuera de Estados Unidos?" : "Do you ship outside the U.S.?",
        a: isSpanish
          ? "Esta oferta de envío gratis aplica dentro de EE. UU. Si necesitas otro destino, escríbenos antes de pagar para confirmarlo."
          : "This free-shipping offer applies within the U.S. If you need another destination, contact us before checkout to confirm.",
      },
      {
        id: "faq-6",
        q: isSpanish ? "¿Qué pasa si necesito ayuda técnica?" : "What if I need technical help?",
        a: isSpanish
          ? "Te atendemos por WhatsApp en español para acceso, descarga y configuración básica."
          : "We support you via Spanish WhatsApp for access, downloads, and basic setup.",
      },
    ],
    [isSpanish]
  );

  const testimonials = useMemo(
    () => [
      {
        quote: "Ya lo compré bro, ya hasta me llegó.",
        who: "DJ Carlos · Miami, FL",
      },
      {
        quote: "Muy buena música, todo más ordenado para mis eventos.",
        who: "DJ Andrea · Los Angeles, CA",
      },
      {
        quote: "Excelente, me ahorró horas de búsqueda cada semana.",
        who: "DJ Javier · Houston, TX",
      },
    ],
    []
  );

  const validateLeadForm = useCallback(
    (data: LeadFormData): FormErrors => {
      const nextErrors: FormErrors = {};
      const name = data.name.trim();
      const email = data.email.trim().toLowerCase();
      const { clean: cleanPhone, digits: phoneDigits } = normalizePhoneInput(data.phone);

      if (!name) {
        nextErrors.name = isSpanish ? "Ingresa tu nombre." : "Enter your name.";
      }

      if (!email) {
        nextErrors.email = isSpanish ? "Ingresa tu email." : "Enter your email.";
      } else if (!isValidEmail(email)) {
        nextErrors.email = isSpanish ? "Email inválido." : "Invalid email.";
      }

      if (!cleanPhone) {
        nextErrors.phone = isSpanish ? "Ingresa tu WhatsApp." : "Enter your WhatsApp.";
      } else if (
        cleanPhone.length > 20 ||
        !/^\+?\d{7,20}$/.test(cleanPhone) ||
        !/[1-9]/.test(phoneDigits)
      ) {
        nextErrors.phone = isSpanish ? "Número inválido." : "Invalid number.";
      }

      return nextErrors;
    },
    [isSpanish]
  );

  useEffect(() => {
    document.title =
      "USB 128 GB para DJs Latinos en USA | +10,000 canciones organizadas por $147";
  }, []);

  useEffect(() => {
    const code = detectCountryCodeFromTimezone() || "US";
    const dialCode = COUNTRY_DIAL_CODES[code] || "+1";

    setCountryData({
      country_code: code,
      country_name: countryNameFromCode(code, isSpanish ? "es" : "en"),
      dial_code: dialCode,
    });
  }, [isSpanish]);

  const trackCta = useCallback(
    (ctaId: string, funnelStep: string = "consideration") => {
      trackEvent("cta_click", {
        cta_id: ctaId,
        plan_id: "usb128",
        funnel_step: funnelStep,
      });
    },
    [trackEvent]
  );

  const openOrder = useCallback(
    (ctaId: string) => {
      setIsOrderOpen(true);
      trackEvent("lead_form_open", {
        cta_id: ctaId,
        plan_id: "usb128",
        funnel_step: "lead_capture",
      });
    },
    [trackEvent]
  );

  const handleFieldChange = useCallback(
    (field: keyof LeadFormData, value: string) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        if (touched[field]) {
          setFormErrors(validateLeadForm(next));
        }
        return next;
      });
    },
    [touched, validateLeadForm]
  );

  const handleFieldBlur = useCallback(
    (field: keyof LeadFormData) => {
      setTouched((prev) => {
        const nextTouched = { ...prev, [field]: true };
        setFormErrors(validateLeadForm(formData));
        return nextTouched;
      });
    },
    [formData, validateLeadForm]
  );

  const startCheckout = useCallback(
    async (preferredProvider: "stripe" | "paypal") => {
      if (isSubmitting) return;

      const validationErrors = validateLeadForm(formData);
      setFormErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        setTouched({ name: true, email: true, phone: true });
        trackEvent("lead_form_error", {
          cta_id: "usb128_submit",
          plan_id: "usb128",
          funnel_step: "lead_capture",
          error_fields: Object.keys(validationErrors),
        });
        return;
      }

      const name = formData.name.trim();
      const email = formData.email.trim().toLowerCase();
      const { clean: cleanPhone } = normalizePhoneInput(formData.phone);

      setIsSubmitting(true);
      trackEvent("lead_submit_attempt", {
        cta_id: preferredProvider === "paypal" ? "usb128_submit_paypal" : "usb128_submit",
        plan_id: "usb128",
        funnel_step: "lead_capture",
      });

      let leadId = createdLeadId;

      try {
        if (!leadId) {
          leadId = crypto.randomUUID();
          const sourcePage = window.location.pathname;

          const { error: insertError } = await supabase.from("leads").insert({
            id: leadId,
            name,
            email,
            phone: cleanPhone,
            // ManyChat expects dial code (e.g. +1) not ISO country code (e.g. US).
            country_code: countryData.dial_code,
            country_name: countryData.country_name,
            source: "usb128",
            tags: ["usb128", "usb_order", "lead_hot"],
            funnel_step: "lead_submit",
            source_page: sourcePage,
            experiment_assignments: [],
            intent_plan: "usb128",
          });

          if (insertError) throw insertError;
          setCreatedLeadId(leadId);

          trackEvent("lead_submit_success", {
            cta_id: preferredProvider === "paypal" ? "usb128_submit_paypal" : "usb128_submit",
            plan_id: "usb128",
            lead_id: leadId,
            funnel_step: "lead_capture",
          });

          // Best-effort ManyChat sync (should never block checkout).
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
        }

        const tryStripe = async (): Promise<string | null> => {
          try {
            const { data: checkout, error: checkoutError } = await supabase.functions.invoke(
              "stripe-checkout",
              { body: { leadId, product: "usb128" } }
            );

            if (checkoutError && import.meta.env.DEV) {
              console.warn("Stripe checkout error:", checkoutError);
            }

            const url = (checkout as { url?: unknown } | null)?.url;
            if (typeof url === "string" && url.length > 0) {
              trackEvent("checkout_redirect", {
                cta_id: "usb128_checkout_stripe",
                plan_id: "usb128",
                provider: "stripe",
                status: "redirected",
                funnel_step: "checkout_handoff",
              });
              return url;
            }

            trackEvent("checkout_redirect", {
              cta_id: "usb128_checkout_stripe",
              plan_id: "usb128",
              provider: "stripe",
              status: "missing_url",
              funnel_step: "checkout_handoff",
            });
          } catch (stripeErr) {
            if (import.meta.env.DEV) console.warn("Stripe invoke threw:", stripeErr);
            trackEvent("checkout_redirect", {
              cta_id: "usb128_checkout_stripe",
              plan_id: "usb128",
              provider: "stripe",
              status: "error",
              funnel_step: "checkout_handoff",
            });
          }
          return null;
        };

        const tryPayPal = async (): Promise<string | null> => {
          try {
            const { data: paypal, error: paypalError } = await supabase.functions.invoke(
              "paypal-checkout",
              { body: { action: "create", leadId, product: "usb128" } }
            );

            if (paypalError && import.meta.env.DEV) {
              console.warn("PayPal checkout error:", paypalError);
            }

            const approveUrl = (paypal as { approveUrl?: unknown } | null)?.approveUrl;
            if (typeof approveUrl === "string" && approveUrl.length > 0) {
              trackEvent("checkout_redirect", {
                cta_id: "usb128_checkout_paypal",
                plan_id: "usb128",
                provider: "paypal",
                status: "redirected",
                funnel_step: "checkout_handoff",
              });
              return approveUrl;
            }

            trackEvent("checkout_redirect", {
              cta_id: "usb128_checkout_paypal",
              plan_id: "usb128",
              provider: "paypal",
              status: "missing_url",
              funnel_step: "checkout_handoff",
            });
          } catch (paypalErr) {
            if (import.meta.env.DEV) console.warn("PayPal invoke threw:", paypalErr);
            trackEvent("checkout_redirect", {
              cta_id: "usb128_checkout_paypal",
              plan_id: "usb128",
              provider: "paypal",
              status: "error",
              funnel_step: "checkout_handoff",
            });
          }
          return null;
        };

        // Preferred provider first, then fallback.
        const primary = preferredProvider === "paypal" ? tryPayPal : tryStripe;
        const secondary = preferredProvider === "paypal" ? tryStripe : tryPayPal;

        const primaryUrl = await primary();
        if (primaryUrl) {
          setIsOrderOpen(false);
          window.location.assign(primaryUrl);
          return;
        }

        const secondaryUrl = await secondary();
        if (secondaryUrl) {
          setIsOrderOpen(false);
          window.location.assign(secondaryUrl);
          return;
        }

        // No redirect: keep the user in the modal and show a clear error.
        toast({
          title: isSpanish ? "No pudimos abrir el checkout" : "Checkout unavailable",
          description: isSpanish
            ? "Intenta de nuevo en unos segundos. Si continúa, contáctanos en Soporte."
            : "Please try again in a few seconds. If it continues, contact Support.",
          variant: "destructive",
        });
      } catch (err) {
        console.error("USB128 lead/checkout error:", err);
        trackEvent("lead_submit_failed", {
          cta_id: "usb128_submit",
          plan_id: "usb128",
          funnel_step: "lead_capture",
        });
        toast({
          title: isSpanish ? "Error" : "Error",
          description: isSpanish
            ? "No pudimos procesar tu solicitud. Intenta de nuevo."
            : "We couldn't process your request. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      countryData.country_name,
      countryData.dial_code,
      createdLeadId,
      formData,
      isSpanish,
      isSubmitting,
      toast,
      trackEvent,
      validateLeadForm,
    ]
  );

  return (
    <main className="min-h-screen bg-[#edf1f5] text-[#0f172a] dark:bg-background dark:text-foreground">
      <section className="relative overflow-hidden bg-[#090b0f]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(225,6,19,0.45),transparent_52%),radial-gradient(circle_at_80%_15%,rgba(225,6,19,0.25),transparent_44%),linear-gradient(130deg,#140003_0%,#5e0008_35%,#9c020d_60%,#d90413_100%)]" />

        <div className="relative container mx-auto max-w-6xl px-4 pb-12 pt-8 md:pb-16 md:pt-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <Badge className="border border-white/35 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.11em] text-white">
                <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                {isSpanish ? "USB física · envío gratis USA" : "Physical USB · free USA shipping"}
              </Badge>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.94] text-white sm:text-5xl lg:text-6xl">
                {isSpanish
                  ? "Tu música latina lista para conectar y mezclar"
                  : "Your Latin music ready to plug and mix"}
              </h1>

              <p className="mt-4 max-w-2xl text-sm text-white/90 sm:text-base">
                {isSpanish
                  ? "+10,000 canciones en MP3 320 kbps, organizadas por género para DJs latinos en Estados Unidos."
                  : "+10,000 MP3 320 kbps songs, genre-organized for Latino DJs in the United States."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                {[
                  isSpanish ? "Pago único" : "One-time payment",
                  "$147 USD",
                  isSpanish ? "4 pagos de $36.75" : "4 payments of $36.75",
                ].map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-white/35 bg-black/25 px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    {pill}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => openOrder("usb128_hero_buy")}
                  className="btn-primary-glow h-12 px-8 text-base font-black"
                >
                  {isSpanish ? "Comprar USB 128GB" : "Buy USB 128GB"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-12 border-white/45 bg-white/10 px-8 text-base font-bold text-white hover:bg-white/20"
                >
                  <Link
                    to="/explorer"
                    onClick={() => trackCta("usb128_hero_demos")}
                  >
                    {isSpanish ? "Escuchar demos" : "Listen to demos"}
                  </Link>
                </Button>
              </div>

              <p className="mt-3 text-xs text-white/80">
                {isSpanish
                  ? "¿Primero quieres valor gratis? Entra al grupo y recibe contenido antes de comprar."
                  : "Want free value first? Join the group and receive content before buying."}{" "}
                <Link
                  to="/gratis"
                  onClick={() => trackCta("usb128_hero_group", "awareness")}
                  className="font-semibold text-white underline underline-offset-2"
                >
                  {isSpanish ? "Ir al acceso gratis" : "Go to free access"}
                </Link>
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {paymentBadges.map((label) => (
                  <Badge
                    key={label}
                    className="border border-white/35 bg-white/10 px-3 py-1 text-[11px] text-white"
                  >
                    <CreditCard className="mr-1.5 h-3 w-3" />
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/25 bg-white p-4 text-[#111827] shadow-[0_24px_52px_rgba(0,0,0,0.35)] md:p-5">
              <div className="overflow-hidden rounded-2xl border border-[#d7dbe2] bg-[#eef1f4] p-2">
                <img
                  src={usbSamsungBarPlus}
                  alt="Samsung BAR Plus 128GB"
                  className="h-auto w-full rounded-xl object-contain"
                  loading="eager"
                />
              </div>

              <div className="mt-4 rounded-2xl border border-[#e0e5ec] bg-[#f9fbff] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#6b7280]">USB 128 GB</p>
                    <p className="mt-1 text-3xl font-black text-[#d90413]">$147 USD</p>
                    <p className="text-xs text-[#5f6b7a]">
                      {isSpanish
                        ? "Envío gratis en USA · pago único"
                        : "Free shipping in USA · one-time payment"}
                    </p>
                  </div>

                  <Badge className="border border-[#d90413] bg-[#d90413] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-sm">
                    {isSpanish ? "Top oferta" : "Top offer"}
                  </Badge>
                </div>

                <ul className="mt-4 space-y-2 text-sm text-[#344054]">
                  {valueBullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d90413]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => openOrder("usb128_product_card_buy")}
                  className="btn-primary-glow mt-4 h-11 w-full text-sm font-black"
                >
                  {isSpanish ? "Asegurar mi USB" : "Secure my USB"}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {socialStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/25 bg-black/25 px-4 py-3">
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.08em] text-white/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="rounded-3xl border border-[#d8dee8] bg-white p-6 shadow-[0_12px_30px_rgba(10,20,40,0.08)] md:p-8">
            <p className="text-center text-xs font-bold uppercase tracking-[0.12em] text-[#d90413]">
              {isSpanish ? "Oferta clara" : "Clear offer"}
            </p>
            <h2 className="mt-2 text-center text-3xl font-black leading-tight text-[#111827] md:text-4xl">
              {isSpanish
                ? "Elige la opción con mejor retorno para ti"
                : "Choose the option with the best return for you"}
            </h2>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <article className="rounded-2xl border border-[#dce2ec] bg-[#f9fbff] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#667085]">
                  {isSpanish ? "Pack individual" : "Single pack"}
                </p>
                <p className="mt-2 text-3xl font-black text-[#111827]">$35 USD</p>
                <p className="mt-2 text-sm text-[#4b5563]">
                  {isSpanish ? "3,000 canciones · descarga digital" : "3,000 songs · digital download"}
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-4 h-10 w-full border-[#cfd7e3] bg-white font-bold"
                >
                  <Link to="/explorer" onClick={() => trackCta("usb128_compare_pack_demos")}> 
                    {isSpanish ? "Ver demos" : "See demos"}
                  </Link>
                </Button>
              </article>

              <article className="rounded-2xl border border-[#dce2ec] bg-[#f9fbff] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#667085]">
                  {isSpanish ? "Membresía" : "Membership"}
                </p>
                <p className="mt-2 text-3xl font-black text-[#111827]">$19.50/mes</p>
                <p className="mt-2 text-sm text-[#4b5563]">
                  {isSpanish
                    ? "Actualización constante · ideal para DJs activos"
                    : "Continuous updates · ideal for active DJs"}
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-4 h-10 w-full border-[#cfd7e3] bg-white font-bold"
                >
                  <Link to="/plan" onClick={() => trackCta("usb128_compare_membership")}> 
                    {isSpanish ? "Ver membresía" : "See membership"}
                  </Link>
                </Button>
              </article>

              <article className="rounded-2xl border-2 border-[#d90413] bg-white p-5 shadow-[0_14px_28px_rgba(217,4,19,0.2)]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#d90413]">USB 128 GB</p>
                  <Badge className="bg-[#d90413] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                    {isSpanish ? "Top" : "Top"}
                  </Badge>
                </div>
                <p className="mt-2 text-3xl font-black text-[#d90413]">$147 USD</p>
                <p className="mt-2 text-sm text-[#4b5563]">
                  {isSpanish
                    ? "10,000+ canciones · física · plug and play"
                    : "10,000+ songs · physical · plug and play"}
                </p>
                <Button
                  onClick={() => openOrder("usb128_compare_usb_buy")}
                  className="btn-primary-glow mt-4 h-10 w-full font-black"
                >
                  {isSpanish ? "Comprar USB" : "Buy USB"}
                </Button>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-3xl border border-[#d8dee8] bg-white p-6 shadow-[0_14px_34px_rgba(10,20,40,0.08)] md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#d90413]">
                {isSpanish ? "Cómo funciona" : "How it works"}
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#111827] md:text-4xl">
                {isSpanish ? "Compra en 3 pasos, sin fricción" : "Buy in 3 steps, friction-free"}
              </h2>

              <div className="mt-6 grid gap-3">
                {[
                  {
                    title: isSpanish ? "1. Deja tus datos" : "1. Share your details",
                    desc: isSpanish
                      ? "Nombre, email y WhatsApp para confirmar pedido y soporte."
                      : "Name, email, and WhatsApp for order confirmation and support.",
                  },
                  {
                    title: isSpanish ? "2. Checkout seguro" : "2. Secure checkout",
                    desc: isSpanish
                      ? "Pagas con Stripe o PayPal, y si aplica en cuotas."
                      : "Pay with Stripe or PayPal, and if available in installments.",
                  },
                  {
                    title: isSpanish ? "3. Recibes y tocas" : "3. Receive and play",
                    desc: isSpanish
                      ? "Te enviamos seguimiento y quedas listo para tus eventos."
                      : "You get tracking and stay ready for your gigs.",
                  },
                ].map((step) => (
                  <div key={step.title} className="rounded-2xl border border-[#e3e8ef] bg-[#f9fbff] p-4">
                    <p className="text-sm font-black text-[#111827]">{step.title}</p>
                    <p className="mt-1 text-sm text-[#4b5563]">{step.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => openOrder("usb128_how_buy")}
                  className="btn-primary-glow h-11 px-6 text-sm font-black"
                >
                  {isSpanish ? "Continuar compra" : "Continue purchase"}
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-11 border-[#cfd7e3] bg-white px-6 text-sm font-bold"
                >
                  <Link
                    to="/gratis"
                    onClick={() => trackCta("usb128_how_group", "awareness")}
                  >
                    {isSpanish ? "Entrar primero al grupo gratis" : "Join free group first"}
                  </Link>
                </Button>
              </div>
            </article>

            <article className="rounded-3xl border border-[#151924] bg-[#0f131b] p-6 text-white shadow-[0_18px_40px_rgba(0,0,0,0.32)] md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff5a66]">
                {isSpanish ? "Prueba social" : "Social proof"}
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight md:text-4xl">
                {isSpanish ? "DJs reales, resultados reales" : "Real DJs, real outcomes"}
              </h2>

              <div className="mt-5 grid gap-3">
                {testimonials.map((item) => (
                  <blockquote key={item.who} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                    <p className="text-sm text-white/90">“{item.quote}”</p>
                    <footer className="mt-2 text-xs font-bold uppercase tracking-[0.07em] text-[#ff5a66]">
                      {item.who}
                    </footer>
                  </blockquote>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {socialStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/12 bg-white/5 p-2 text-center">
                    <p className="text-lg font-black text-white">{stat.value}</p>
                    <p className="text-[10px] uppercase tracking-[0.07em] text-white/70">{stat.label}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => openOrder("usb128_social_buy")}
                className="btn-primary-glow mt-6 h-11 w-full text-sm font-black"
              >
                {isSpanish ? "Comprar ahora" : "Buy now"}
              </Button>
            </article>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="rounded-3xl border border-[#d8dee8] bg-white p-6 shadow-[0_14px_34px_rgba(10,20,40,0.08)] md:p-8">
            <h2 className="text-center text-3xl font-black text-[#111827] md:text-4xl">
              {isSpanish ? "Preguntas frecuentes" : "Frequently asked questions"}
            </h2>
            <p className="mt-2 text-center text-sm text-[#667085]">
              {isSpanish
                ? "Respuestas directas a objeciones reales antes de pagar."
                : "Direct answers to real objections before checkout."}
            </p>

            <Accordion type="single" collapsible className="mt-6 w-full">
              {faqItems.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger
                    onClick={() =>
                      trackEvent("faq_toggle", {
                        cta_id: `usb128_${item.id}`,
                        plan_id: "usb128",
                        funnel_step: "objection_handling",
                      })
                    }
                  >
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="pb-28 pt-4 md:pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="rounded-3xl border border-[#141823] bg-[#0c1018] p-6 text-white shadow-[0_20px_45px_rgba(0,0,0,0.35)] md:p-8">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff5a66]">
                  {isSpanish ? "Cierre" : "Final step"}
                </p>
                <h2 className="mt-2 text-3xl font-black leading-tight md:text-4xl">
                  {isSpanish
                    ? "¿Listo para dejar de buscar música en 5 pools?"
                    : "Ready to stop searching in 5 different pools?"}
                </h2>
                <p className="mt-3 text-sm text-white/80">
                  {isSpanish
                    ? "Oferta USB 128GB: $147 USD, envío gratis USA y soporte en español."
                    : "USB 128GB offer: $147 USD, free USA shipping, and Spanish support."}
                </p>
              </div>

              <div>
                <Button
                  onClick={() => openOrder("usb128_final_buy")}
                  className="btn-primary-glow h-12 w-full text-base font-black"
                >
                  {isSpanish ? "Comprar USB por $147" : "Buy USB for $147"}
                </Button>
                <p className="mt-3 text-center text-xs text-white/70">
                  {isSpanish
                    ? "Al continuar, te enviaremos confirmación y seguimiento por email."
                    : "By continuing, we’ll send confirmation and tracking by email."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2b0206] bg-[#ffffffee] p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Button
            onClick={() => openOrder("usb128_mobile_sticky_buy")}
            className="btn-primary-glow h-11 flex-1 text-sm font-black"
          >
            <Zap className="mr-1.5 h-4 w-4" />
            {isSpanish ? "Comprar USB $147" : "Buy USB $147"}
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 border-[#cdd6e1] bg-white px-3 text-xs font-bold"
          >
            <Link
              to="/explorer"
              onClick={() => trackCta("usb128_mobile_sticky_demos")}
            >
              {isSpanish ? "Demos" : "Demos"}
            </Link>
          </Button>
        </div>
      </div>

      <Footer />

      <Dialog open={isOrderOpen} onOpenChange={(open) => !isSubmitting && setIsOrderOpen(open)}>
        <DialogContent className="border border-[#d8dee8] bg-white p-0 sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>{isSpanish ? "Finalizar pedido" : "Complete order"}</DialogTitle>
            <DialogDescription>
              {isSpanish
                ? "Déjanos tus datos para confirmar tu pedido y enviarte al checkout."
                : "Share your details to confirm your order and continue to checkout."}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 md:p-7">
            <h3 className="text-3xl font-black text-[#111827]">
              {isSpanish ? "Finalizar pedido" : "Complete order"}
            </h3>
            <p className="mt-2 text-sm text-[#667085]">
              {isSpanish
                ? "Solo pedimos lo esencial para confirmar tu pedido y enviarte el tracking por email."
                : "We only ask for essentials to confirm your order and email your tracking."}
            </p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void startCheckout("stripe");
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="usb128-name">{isSpanish ? "Nombre" : "Name"}</Label>
                <Input
                  id="usb128-name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  onBlur={() => handleFieldBlur("name")}
                  placeholder={isSpanish ? "Tu nombre completo" : "Your full name"}
                  autoComplete="name"
                  aria-invalid={Boolean(formErrors.name)}
                />
                {touched.name && formErrors.name && (
                  <p className="text-xs font-semibold text-[#b10010]">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="usb128-email">Email</Label>
                <Input
                  id="usb128-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  onBlur={() => handleFieldBlur("email")}
                  placeholder="you@email.com"
                  autoComplete="email"
                  aria-invalid={Boolean(formErrors.email)}
                />
                {touched.email && formErrors.email && (
                  <p className="text-xs font-semibold text-[#b10010]">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="usb128-phone">
                  {isSpanish ? "WhatsApp (soporte)" : "WhatsApp (support)"}
                </Label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-10 shrink-0 border-[#d1d7e0] bg-[#f8fafc] px-3 text-sm text-[#4b5563]"
                    title={countryData.country_name}
                  >
                    {countryData.dial_code}
                  </Badge>
                  <Input
                    id="usb128-phone"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    onBlur={() => handleFieldBlur("phone")}
                    placeholder={isSpanish ? "Tu número" : "Your number"}
                    inputMode="tel"
                    autoComplete="tel"
                    aria-invalid={Boolean(formErrors.phone)}
                  />
                </div>
                {touched.phone && formErrors.phone && (
                  <p className="text-xs font-semibold text-[#b10010]">{formErrors.phone}</p>
                )}
                <p className="text-xs text-[#667085]">
                  {isSpanish
                    ? "Usaremos WhatsApp solo si hace falta para soporte o confirmar detalles del envío."
                    : "We’ll only use WhatsApp if needed for support or to confirm shipping details."}
                </p>
              </div>

              <Button
                type="submit"
                className="btn-primary-glow h-12 w-full text-base font-black"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSpanish ? "Enviando..." : "Submitting..."}
                  </>
                ) : (
                  isSpanish ? "Pagar con tarjeta" : "Pay with card"
                )}
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-x-0 top-1/2 h-px bg-[#e5e7eb]" />
                <p className="relative mx-auto w-fit bg-white px-3 text-xs font-bold uppercase tracking-[0.12em] text-[#667085]">
                  {isSpanish ? "o" : "or"}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-12 w-full border-[#cfd7e3] bg-white text-base font-black text-[#111827] hover:bg-[#f8fafc]"
                disabled={isSubmitting}
                onClick={() => void startCheckout("paypal")}
              >
                {isSpanish ? "Pagar con PayPal" : "Pay with PayPal"}
              </Button>

              <p className="text-center text-xs text-[#667085]">
                {isSpanish
                  ? "Confirmación y seguimiento se envían por email."
                  : "Confirmation and tracking are sent by email."}{" "}
                <Link to="/privacy" className="font-semibold text-[#d90413] underline underline-offset-2">
                  {isSpanish ? "Privacidad" : "Privacy"}
                </Link>{" "}
                ·{" "}
                <Link to="/terms" className="font-semibold text-[#d90413] underline underline-offset-2">
                  {isSpanish ? "Términos" : "Terms"}
                </Link>
              </p>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
