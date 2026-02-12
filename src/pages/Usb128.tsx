import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  MessageCircle,
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
  const navigate = useNavigate();

  const isSpanish = language === "es";

  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const faqItems = useMemo(
    () => [
      {
        id: "faq-1",
        q: isSpanish ? "¿Cuánto cuesta la USB 128 GB?" : "How much is the 128 GB USB?",
        a: isSpanish
          ? "La oferta es $147 USD pago único. Puedes pagar en checkout con tarjeta o PayPal, y si aplica, en cuotas con Klarna/Afterpay."
          : "The offer is a one-time $147 USD payment. You can pay at checkout with card or PayPal, and if available, in installments via Klarna/Afterpay.",
      },
      {
        id: "faq-2",
        q: isSpanish ? "¿Qué incluye exactamente?" : "What exactly is included?",
        a: isSpanish
          ? "+10,000 canciones latinas en MP3 (320 kbps), organizadas por género para DJs. Incluye acceso al grupo y soporte en español por WhatsApp."
          : "+10,000 Latin MP3 songs (320 kbps), organized by genre for DJs. Includes group access and Spanish WhatsApp support.",
      },
      {
        id: "faq-3",
        q: isSpanish
          ? "¿Funciona con Serato, VirtualDJ y Rekordbox?"
          : "Does it work with Serato, VirtualDJ, and Rekordbox?",
        a: isSpanish
          ? "Sí. El formato MP3 es compatible con Serato, VirtualDJ, Rekordbox y setups DJ estándar en Mac/Windows."
          : "Yes. MP3 format is compatible with Serato, VirtualDJ, Rekordbox, and standard DJ setups on Mac/Windows.",
      },
      {
        id: "faq-4",
        q: isSpanish ? "¿Envían fuera de Estados Unidos?" : "Do you ship outside the United States?",
        a: isSpanish
          ? "Esta oferta de envío gratis aplica dentro de EE. UU. Si necesitas otro país, escríbenos antes de pagar para revisar opciones."
          : "This free-shipping offer applies within the U.S. If you need another country, contact us before paying to check options.",
      },
      {
        id: "faq-5",
        q: isSpanish ? "¿Puedo escuchar demos antes?" : "Can I hear demos first?",
        a: isSpanish
          ? "Sí. Puedes ir al explorador y escuchar previews por género antes de pagar."
          : "Yes. You can go to the explorer and hear genre previews before paying.",
      },
      {
        id: "faq-6",
        q: isSpanish ? "¿Qué pasa si tengo problemas de acceso o soporte?" : "What if I need technical support?",
        a: isSpanish
          ? "Te atendemos por WhatsApp en español. El objetivo es que quedes listo para tocar, no dejarte solo con un link."
          : "You get Spanish WhatsApp support. The goal is to get you ready to play, not leave you with just a link.",
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
        quote: "Muy buena música. Todo más ordenado para tocar.",
        who: "DJ Andrea · Los Angeles, CA",
      },
      {
        quote: "Excelente, gracias. Me ahorró horas de búsqueda.",
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

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
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
        cta_id: "usb128_submit",
        plan_id: "usb128",
        funnel_step: "lead_capture",
      });

      try {
        const leadId = crypto.randomUUID();
        const sourcePage = window.location.pathname;

        const { error: insertError } = await supabase.from("leads").insert({
          id: leadId,
          name,
          email,
          phone: cleanPhone,
          country_code: countryData.country_code,
          country_name: countryData.country_name,
          source: "usb128",
          tags: ["usb128", "usb_order", "lead_hot"],
          funnel_step: "lead_submit",
          source_page: sourcePage,
          experiment_assignments: [],
          intent_plan: "usb128",
        });

        if (insertError) throw insertError;

        trackEvent("lead_submit_success", {
          cta_id: "usb128_submit",
          plan_id: "usb128",
          lead_id: leadId,
          funnel_step: "lead_capture",
        });

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

        setIsOrderOpen(false);

        try {
          const { data: checkout, error: checkoutError } = await supabase.functions.invoke(
            "stripe-checkout",
            {
              body: { leadId, product: "usb128" },
            }
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
            window.location.assign(url);
            return;
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

        try {
          const { data: paypal, error: paypalError } = await supabase.functions.invoke(
            "paypal-checkout",
            {
              body: { action: "create", leadId, product: "usb128" },
            }
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
            window.location.assign(approveUrl);
            return;
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

        navigate("/usb128/gracias");
      } catch (err) {
        console.error("USB128 lead submit error:", err);
        trackEvent("lead_submit_failed", {
          cta_id: "usb128_submit",
          plan_id: "usb128",
          funnel_step: "lead_capture",
        });
        toast({
          title: isSpanish ? "Error" : "Error",
          description: isSpanish
            ? "No pudimos enviar tus datos. Intenta de nuevo."
            : "We couldn't submit your details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      countryData.country_code,
      countryData.country_name,
      formData,
      isSpanish,
      isSubmitting,
      navigate,
      toast,
      trackEvent,
      validateLeadForm,
    ]
  );

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-[#111827] dark:bg-background dark:text-foreground">
      <section className="relative overflow-hidden bg-[#0f1115]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(224,6,19,0.55),transparent_55%),radial-gradient(circle_at_82%_18%,rgba(224,6,19,0.3),transparent_46%),linear-gradient(135deg,#1a0005_0%,#71010b_30%,#ba0916_62%,#e10613_100%)]" />
        <div className="relative container mx-auto max-w-6xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Badge className="border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                {isSpanish ? "USB física · envío gratis USA" : "Physical USB · free USA shipping"}
              </Badge>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.95] text-white sm:text-5xl lg:text-6xl">
                {isSpanish ? "Tu música latina lista para conectar y mezclar" : "Your Latin library ready to plug and mix"}
              </h1>

              <p className="mt-5 max-w-2xl text-sm text-white/88 sm:text-base">
                {isSpanish
                  ? "+10,000 canciones en MP3 (320 kbps), organizadas por género para DJs latinos en Estados Unidos."
                  : "+10,000 MP3 songs (320 kbps), organized by genre for Latino DJs in the United States."}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                {[
                  isSpanish ? "Pago único" : "One-time payment",
                  "$147 USD",
                  isSpanish ? "4 pagos de $36.75" : "4 payments of $36.75",
                ].map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-white/28 bg-black/25 px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    {pill}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => openOrder("usb128_hero_buy")}
                  className="btn-primary-glow h-12 px-8 text-base font-black"
                >
                  {isSpanish ? "Comprar USB 128GB" : "Buy USB 128GB"}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-12 border-white/45 bg-white/10 px-8 text-base font-bold text-white hover:bg-white/18"
                >
                  <Link
                    to="/explorer"
                    onClick={() =>
                      trackEvent("cta_click", {
                        cta_id: "usb128_hero_demos",
                        plan_id: "usb128",
                        funnel_step: "consideration",
                      })
                    }
                  >
                    {isSpanish ? "Escuchar demos" : "Listen to demos"}
                  </Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                {paymentBadges.map((label) => (
                  <Badge
                    key={label}
                    className="border border-white/30 bg-white/8 px-3 py-1 text-[11px] font-semibold text-white"
                  >
                    <CreditCard className="mr-1.5 h-3 w-3" />
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white p-4 text-[#121722] shadow-[0_24px_54px_rgba(0,0,0,0.35)] md:p-5">
              <div className="overflow-hidden rounded-2xl border border-[#d7dbe1] bg-[#eef1f4] p-2">
                <img
                  src={usbSamsungBarPlus}
                  alt="Samsung BAR Plus 128GB"
                  className="h-auto w-full rounded-xl object-contain"
                  loading="eager"
                />
              </div>

              <div className="mt-4 rounded-2xl border border-[#e4e7eb] bg-[#f8fafc] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#6b7280]">USB 128 GB</p>
                    <p className="mt-1 text-3xl font-black text-[#e10613]">$147 USD</p>
                    <p className="text-xs text-[#667085]">
                      {isSpanish ? "Envío gratis USA · pago único" : "Free USA shipping · one-time payment"}
                    </p>
                  </div>
                  <Badge className="border border-[#f8c9cf] bg-[#fff1f2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#b10010]">
                    {isSpanish ? "Top oferta" : "Top offer"}
                  </Badge>
                </div>

                <ul className="mt-4 space-y-2 text-sm text-[#374151]">
                  {[
                    isSpanish ? "+10,000 canciones listas para evento" : "+10,000 event-ready songs",
                    isSpanish ? "Organizada por género para DJ" : "Genre-organized for DJs",
                    isSpanish ? "Compatible con Serato / VDJ / Rekordbox" : "Works with Serato / VDJ / Rekordbox",
                    isSpanish ? "Incluye acceso al grupo de WhatsApp" : "Includes WhatsApp group access",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#e10613]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => openOrder("usb128_card_buy")}
                  className="btn-primary-glow mt-4 h-11 w-full text-sm font-black"
                >
                  {isSpanish ? "Quiero mi USB ahora" : "I want my USB now"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: MessageCircle,
                title: isSpanish ? "Comunidad real" : "Real community",
                desc: isSpanish
                  ? "+7,000 DJs latinos ya están en el grupo"
                  : "+7,000 Latino DJs are already in the group",
              },
              {
                icon: Usb,
                title: isSpanish ? "Catálogo organizado" : "Organized catalog",
                desc: isSpanish
                  ? "Lo encuentras por género en segundos"
                  : "Find tracks by genre in seconds",
              },
              {
                icon: Truck,
                title: isSpanish ? "Entrega física" : "Physical delivery",
                desc: isSpanish
                  ? "USB Samsung BAR Plus con envío USA"
                  : "Samsung BAR Plus USB with USA shipping",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-[#d8dde5] bg-white p-5 shadow-[0_10px_24px_rgba(10,20,40,0.08)]"
              >
                <item.icon className="h-5 w-5 text-[#e10613]" />
                <h2 className="mt-3 text-xl font-black text-[#111827]">{item.title}</h2>
                <p className="mt-1 text-sm text-[#4b5563]">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="rounded-3xl border border-[#d8dde5] bg-white p-6 shadow-[0_14px_34px_rgba(10,20,40,0.08)] md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#e10613]">
                  {isSpanish ? "Cómo funciona" : "How it works"}
                </p>
                <h2 className="mt-2 text-3xl font-black leading-tight text-[#111827] md:text-4xl">
                  {isSpanish ? "Compra en 3 pasos, sin fricción" : "Buy in 3 steps, friction-free"}
                </h2>
              </div>

              <Button
                asChild
                variant="outline"
                className="h-11 border-[#d2d8e2] bg-[#f8fafc] font-bold text-[#111827] hover:bg-[#f2f5fa]"
              >
                <Link
                  to="/gratis"
                  onClick={() =>
                    trackEvent("cta_click", {
                      cta_id: "usb128_howto_join_group",
                      plan_id: "usb128",
                      funnel_step: "consideration",
                    })
                  }
                >
                  {isSpanish ? "Primero quiero entrar gratis al grupo" : "I want to join the free group first"}
                </Link>
              </Button>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {[
                {
                  n: "01",
                  title: isSpanish ? "Deja tus datos" : "Leave your details",
                  desc: isSpanish
                    ? "Nombre, email y WhatsApp para confirmar pedido y soporte."
                    : "Name, email, and WhatsApp for order confirmation and support.",
                },
                {
                  n: "02",
                  title: isSpanish ? "Checkout seguro" : "Secure checkout",
                  desc: isSpanish
                    ? "Pagas con Stripe o PayPal. Klarna/Afterpay disponibles según país."
                    : "Pay with Stripe or PayPal. Klarna/Afterpay available by country.",
                },
                {
                  n: "03",
                  title: isSpanish ? "Recibes y tocas" : "Receive and play",
                  desc: isSpanish
                    ? "Te enviamos tracking y quedas listo para tus próximos eventos."
                    : "You get tracking and stay ready for upcoming events.",
                },
              ].map((step) => (
                <article key={step.n} className="rounded-2xl border border-[#e3e8ef] bg-[#f9fbff] p-5">
                  <p className="text-sm font-black text-[#e10613]">{step.n}</p>
                  <h3 className="mt-2 text-xl font-black text-[#111827]">{step.title}</h3>
                  <p className="mt-2 text-sm text-[#4b5563]">{step.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-[#d8dde5] bg-white p-6 shadow-[0_14px_34px_rgba(10,20,40,0.08)] md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#e10613]">
                {isSpanish ? "Comparación honesta" : "Honest comparison"}
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#111827] md:text-4xl">
                {isSpanish ? "Lo que ganas con la USB vs alternativas" : "What you get with USB vs alternatives"}
              </h2>

              <div className="mt-6 overflow-hidden rounded-2xl border border-[#e1e6ee]">
                <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-[#111827] px-4 py-3 text-xs font-bold uppercase tracking-[0.07em] text-white">
                  <span>{isSpanish ? "Criterio" : "Criteria"}</span>
                  <span className="text-center">USB 128</span>
                  <span className="text-center">YouTube/DIY</span>
                </div>

                {[
                  {
                    label: isSpanish ? "Organización por género" : "Genre organization",
                    left: isSpanish ? "Sí, lista para DJ" : "Yes, DJ-ready",
                    right: isSpanish ? "Manual" : "Manual",
                  },
                  {
                    label: isSpanish ? "Calidad de audio" : "Audio quality",
                    left: "MP3 320 kbps",
                    right: isSpanish ? "Variable" : "Variable",
                  },
                  {
                    label: isSpanish ? "Compatibilidad DJ" : "DJ compatibility",
                    left: "Serato / VDJ / Rekordbox",
                    right: isSpanish ? "No optimizada" : "Not optimized",
                  },
                  {
                    label: isSpanish ? "Tiempo de preparación" : "Prep time",
                    left: isSpanish ? "Rápido" : "Fast",
                    right: isSpanish ? "Horas" : "Hours",
                  },
                  {
                    label: isSpanish ? "Soporte en español" : "Spanish support",
                    left: isSpanish ? "Sí" : "Yes",
                    right: isSpanish ? "No" : "No",
                  },
                ].map((row, idx) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-[1.2fr_1fr_1fr] px-4 py-3 text-sm ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"
                    }`}
                  >
                    <span className="font-semibold text-[#1f2937]">{row.label}</span>
                    <span className="text-center font-semibold text-[#b10010]">{row.left}</span>
                    <span className="text-center text-[#6b7280]">{row.right}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-[#d8dde5] bg-white p-6 shadow-[0_14px_34px_rgba(10,20,40,0.08)] md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#e10613]">
                {isSpanish ? "Prueba social" : "Social proof"}
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#111827]">
                {isSpanish ? "DJs reales, resultados reales" : "Real DJs, real outcomes"}
              </h2>

              <div className="mt-5 grid gap-3">
                {testimonials.map((item) => (
                  <blockquote
                    key={item.who}
                    className="rounded-2xl border border-[#e2e8f0] bg-[#f9fbff] p-4"
                  >
                    <p className="text-sm text-[#1f2937]">“{item.quote}”</p>
                    <footer className="mt-2 text-xs font-bold uppercase tracking-[0.07em] text-[#b10010]">
                      {item.who}
                    </footer>
                  </blockquote>
                ))}
              </div>

              <Button
                onClick={() => openOrder("usb128_social_buy")}
                className="btn-primary-glow mt-6 h-11 w-full text-sm font-black"
              >
                {isSpanish ? "Asegurar mi USB" : "Secure my USB"}
              </Button>
            </article>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="rounded-3xl border border-[#d8dde5] bg-white p-6 shadow-[0_14px_34px_rgba(10,20,40,0.08)] md:p-8">
            <h2 className="text-center text-3xl font-black text-[#111827] md:text-4xl">
              {isSpanish ? "Preguntas frecuentes" : "Frequently asked questions"}
            </h2>
            <p className="mt-2 text-center text-sm text-[#6b7280]">
              {isSpanish
                ? "Respuestas directas basadas en dudas reales de compra."
                : "Direct answers based on real purchase questions."}
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

      <section className="pb-28 pt-6 md:pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="rounded-3xl border border-[#121212] bg-[#0d0f14] p-6 text-white shadow-[0_20px_45px_rgba(0,0,0,0.35)] md:p-8">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff7a84]">
                  {isSpanish ? "Oferta USB 128" : "USB 128 offer"}
                </p>
                <h2 className="mt-2 text-3xl font-black leading-tight md:text-4xl">
                  {isSpanish
                    ? "¿Listo para dejar de buscar música en 5 pools?"
                    : "Ready to stop searching across 5 pools?"}
                </h2>
                <p className="mt-3 text-sm text-white/80">
                  {isSpanish
                    ? "Pago único, envío gratis en USA y soporte en español por WhatsApp."
                    : "One-time payment, free USA shipping, and Spanish WhatsApp support."}
                </p>
              </div>

              <div>
                <Button
                  onClick={() => openOrder("usb128_final_buy")}
                  className="btn-primary-glow h-12 w-full text-base font-black"
                >
                  {isSpanish ? "Comprar ahora por $147" : "Buy now for $147"}
                </Button>
                <p className="mt-3 text-center text-xs text-white/70">
                  {isSpanish
                    ? "Al continuar aceptas recibir confirmaciones de pedido y soporte."
                    : "By continuing, you agree to receive order confirmations and support messages."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#240306] bg-[#ffffffee] p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Button
            onClick={() => openOrder("usb128_mobile_sticky_buy")}
            className="btn-primary-glow h-11 flex-1 text-sm font-black"
          >
            <Zap className="mr-2 h-4 w-4" />
            {isSpanish ? "Comprar USB $147" : "Buy USB $147"}
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 border-[#cfd6df] bg-white px-3"
          >
            <Link
              to="/explorer"
              onClick={() =>
                trackEvent("cta_click", {
                  cta_id: "usb128_mobile_sticky_demos",
                  plan_id: "usb128",
                  funnel_step: "consideration",
                })
              }
            >
              <Package className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Footer />

      <Dialog open={isOrderOpen} onOpenChange={(open) => !isSubmitting && setIsOrderOpen(open)}>
        <DialogContent className="border border-[#d9dfe8] bg-white p-0 sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>{isSpanish ? "Finalizar pedido" : "Complete order"}</DialogTitle>
            <DialogDescription>
              {isSpanish
                ? "Déjanos tus datos para confirmar el pedido y enviarte al checkout."
                : "Leave your details to confirm your order and continue to checkout."}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 md:p-7">
            <h3 className="text-3xl font-black text-[#111827]">
              {isSpanish ? "Finalizar pedido" : "Complete order"}
            </h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              {isSpanish
                ? "Solo pedimos lo esencial para confirmación, tracking y soporte en español."
                : "We only ask for essentials for confirmation, tracking, and Spanish support."}
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
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
                <Label htmlFor="usb128-phone">WhatsApp</Label>
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
                    ? "Envío gratis solo dentro de Estados Unidos para esta oferta USB."
                    : "Free shipping for this USB offer applies only within the United States."}
                </p>
              </div>

              <Button type="submit" className="btn-primary-glow h-12 w-full text-base font-black" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSpanish ? "Enviando..." : "Submitting..."}
                  </>
                ) : (
                  isSpanish ? "Continuar al checkout" : "Continue to checkout"
                )}
              </Button>

              <p className="text-center text-xs text-[#6b7280]">
                {isSpanish
                  ? "Al continuar, aceptas mensajes de confirmación y soporte sobre tu pedido."
                  : "By continuing, you accept confirmation and support messages about your order."}
              </p>
              <p className="text-center text-xs text-[#6b7280]">
                {isSpanish
                  ? "Si ya no quieres mensajes promocionales, puedes solicitar baja (STOP/BAJA) en cualquier momento."
                  : "If you no longer want promotional messages, you can opt out anytime (STOP/BAJA)."}
              </p>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
