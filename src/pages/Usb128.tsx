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
} from "lucide-react";

import Footer from "@/components/Footer";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { createBestCheckoutUrl, type CheckoutProvider } from "@/lib/checkout";
import usbSamsungBarPlus from "@/assets/usb128-samsung-bar-plus.jpg";

const BUY_ANCHOR_ID = "usb128-comprar";

export default function Usb128() {
  const { language } = useLanguage();
  const { trackEvent } = useAnalytics();
  const { toast } = useToast();

  const isSpanish = language === "es";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<{ ctaId: string; prefer: CheckoutProvider } | null>(null);

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
          ? "Soporte humano por WhatsApp en español para acceso, descarga y configuración básica."
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

  useEffect(() => {
    document.title =
      "USB 128 GB para DJs Latinos en USA | +10,000 canciones organizadas por $147";
  }, []);

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

  const startExpressCheckout = useCallback(
    async (ctaId: string, prefer: CheckoutProvider, isRetry = false) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      setCheckoutError(null);
      setLastAttempt({ ctaId, prefer });

      trackEvent("checkout_redirect", {
        cta_id: ctaId,
        plan_id: "usb128",
        provider: prefer,
        status: "starting",
        funnel_step: "checkout_handoff",
        is_retry: isRetry,
      });

      let redirected = false;
      try {
        const leadId = crypto.randomUUID();
        const { provider, url } = await createBestCheckoutUrl({
          leadId,
          product: "usb128",
          sourcePage: window.location.pathname,
          prefer,
        });

        if (url) {
          redirected = true;
          trackEvent("checkout_redirect", {
            cta_id: ctaId,
            plan_id: "usb128",
            provider: provider || prefer,
            status: "redirected",
            funnel_step: "checkout_handoff",
            is_retry: isRetry,
            lead_id: leadId,
          });
          window.location.assign(url);
          return;
        }

        trackEvent("checkout_redirect", {
          cta_id: ctaId,
          plan_id: "usb128",
          provider: prefer,
          status: "missing_url",
          funnel_step: "checkout_handoff",
          is_retry: isRetry,
          lead_id: leadId,
        });

        setCheckoutError(
          isSpanish
            ? "No pudimos abrir el checkout. Reintenta; si continúa, cambia de red o desactiva tu bloqueador de anuncios."
            : "We couldn't open checkout. Try again; if it continues, switch networks or disable your ad blocker."
        );

        toast({
          title: isSpanish ? "Checkout no disponible" : "Checkout unavailable",
          description: isSpanish
            ? "Intenta de nuevo en unos segundos."
            : "Please try again in a few seconds.",
          variant: "destructive",
        });
      } catch (err) {
        console.error("USB128 checkout error:", err);
        trackEvent("checkout_redirect", {
          cta_id: ctaId,
          plan_id: "usb128",
          provider: prefer,
          status: "error",
          funnel_step: "checkout_handoff",
          is_retry: isRetry,
          error_message: err instanceof Error ? err.message : String(err),
        });
        setCheckoutError(
          isSpanish
            ? "Hubo un problema al iniciar el pago. Reintenta; si continúa, cambia de red o desactiva tu bloqueador de anuncios."
            : "There was a problem starting checkout. Try again; if it continues, switch networks or disable your ad blocker."
        );
        toast({
          title: isSpanish ? "Error" : "Error",
          description: isSpanish
            ? "Hubo un problema al iniciar el pago. Intenta de nuevo."
            : "There was a problem starting checkout. Please try again.",
          variant: "destructive",
        });
      } finally {
        if (!redirected) setIsSubmitting(false);
      }
    },
    [isSpanish, isSubmitting, toast, trackEvent]
  );

  const openOrder = useCallback(
    (ctaId: string) => {
      trackCta(ctaId, "checkout_handoff");
      void startExpressCheckout(ctaId, "stripe");
    },
    [startExpressCheckout, trackCta]
  );

  const openOrderPayPal = useCallback(
    (ctaId: string) => {
      trackCta(ctaId, "checkout_handoff");
      void startExpressCheckout(ctaId, "paypal");
    },
    [startExpressCheckout, trackCta]
  );

  const retryCheckout = useCallback(() => {
    if (!lastAttempt) return;
    void startExpressCheckout(lastAttempt.ctaId, lastAttempt.prefer, true);
  }, [lastAttempt, startExpressCheckout]);

  const renderCheckoutFeedback = useCallback(
    (ctaId: string) => {
      if (lastAttempt?.ctaId !== ctaId) return null;

      if (isSubmitting) {
        return (
          <p className="mt-3 text-xs text-white/80">
            {isSpanish ? "Redirigiendo a checkout seguro..." : "Redirecting to secure checkout..."}
          </p>
        );
      }

      if (!checkoutError) return null;

      return (
        <Alert variant="destructive" className="mt-4 border-[#AA0202]/50 bg-[#111111] text-[#EFEFEF] [&>svg]:text-[#AA0202]">
          <AlertTitle>{isSpanish ? "No se pudo abrir el checkout" : "Checkout failed"}</AlertTitle>
          <AlertDescription>
            <p>{checkoutError}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-10 border-[#AA0202] bg-transparent text-[#EFEFEF] hover:bg-[#AA0202]/15 hover:text-[#EFEFEF]"
                onClick={retryCheckout}
                disabled={isSubmitting}
              >
                {isSpanish ? "Reintentar" : "Try again"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-10 text-[#EFEFEF] hover:bg-white/10"
                onClick={() => (window.location.href = "/help")}
                disabled={isSubmitting}
              >
                {isSpanish ? "Contactar soporte" : "Contact support"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    },
    [checkoutError, isSpanish, isSubmitting, lastAttempt?.ctaId, retryCheckout]
  );

  return (
    <main className="brand-frame min-h-screen bg-[#070707] pb-28 text-[#EFEFEF]">
      <section className="relative overflow-hidden bg-[#070707]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(170,2,2,0.45),transparent_52%),radial-gradient(circle_at_80%_15%,rgba(170,2,2,0.25),transparent_44%),linear-gradient(130deg,#140003_0%,#5e0008_35%,#9c020d_60%,#AA0202_100%)]" />

        <div className="relative container mx-auto max-w-6xl px-4 pb-12 pt-8 md:pb-16 md:pt-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <Badge className="border border-[#5E5E5E] bg-[#111111]/50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.11em] text-[#EFEFEF]">
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
                    className="rounded-full border border-[#5E5E5E] bg-[#111111]/50 px-4 py-1.5 text-xs font-semibold text-[#EFEFEF]"
                  >
                    {pill}
                  </span>
                ))}
              </div>

	              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
	                <Button
	                  id={BUY_ANCHOR_ID}
	                  onClick={() => openOrder("usb128_hero_buy")}
	                  disabled={isSubmitting}
	                  className="btn-primary-glow h-12 px-8 text-base font-black"
	                >
	                  {isSubmitting && lastAttempt?.ctaId === "usb128_hero_buy" ? (
	                    <>
	                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                      {isSpanish ? "Cargando checkout seguro..." : "Loading secure checkout..."}
	                    </>
	                  ) : (
	                    <>
	                      {isSpanish ? "Comprar USB 128GB" : "Buy USB 128GB"}
	                      <ArrowRight className="ml-2 h-4 w-4" />
	                    </>
	                  )}
	                </Button>
	                <Button
	                  onClick={() => openOrderPayPal("usb128_hero_buy_paypal")}
	                  disabled={isSubmitting}
	                  variant="outline"
	                  className="h-12 px-8 text-base font-black"
	                >
	                  {isSubmitting ? (
	                    <>
	                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                      {isSpanish ? "Cargando PayPal..." : "Loading PayPal..."}
	                    </>
	                  ) : (
	                    <>
	                      <CreditCard className="mr-2 h-4 w-4 text-primary" />
	                      {isSpanish ? "Pagar con PayPal" : "Pay with PayPal"}
	                    </>
	                  )}
	                </Button>
	              </div>

                {renderCheckoutFeedback("usb128_hero_buy")}
                {renderCheckoutFeedback("usb128_hero_buy_paypal")}

	              <p className="text-xs text-yellow-500 mt-4 flex items-center justify-center gap-1.5 font-medium">
	                ⚡ Stock limitado: Pídelo en las próximas 2 horas y se envía HOY mismo.
	              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {paymentBadges.map((label) => (
                  <Badge
                    key={label}
                    className="border border-[#5E5E5E] bg-[#111111]/40 px-3 py-1 text-[11px] text-[#EFEFEF]"
                  >
                    <CreditCard className="mr-1.5 h-3 w-3" />
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#5E5E5E] bg-[#111111] p-4 text-[#EFEFEF] shadow-[0_24px_52px_rgba(0,0,0,0.35)] md:p-5">
              <div className="overflow-hidden rounded-2xl border border-[#5E5E5E] bg-[#070707] p-2">
                <img
                  src={usbSamsungBarPlus}
                  alt="Samsung BAR Plus 128GB"
                  className="h-auto w-full rounded-xl object-contain"
                  loading="eager"
                />
              </div>

              <div className="mt-4 rounded-2xl border border-[#5E5E5E] bg-[#070707] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">USB 128 GB</p>
                    <p className="mt-1 text-3xl font-black text-[#AA0202]">$147 USD</p>
                    <p className="text-xs text-muted-foreground">
                      {isSpanish
                        ? "Envío gratis en USA · pago único"
                        : "Free shipping in USA · one-time payment"}
                    </p>
                  </div>

                  <Badge className="border border-[#AA0202] bg-[#AA0202] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-sm">
                    {isSpanish ? "Top oferta" : "Top offer"}
                  </Badge>
                </div>

                <ul className="mt-4 space-y-2 text-sm text-[#EFEFEF]">
                  {valueBullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#AA0202]" />
                      <span>{item}</span>
                    </li>
                  ))}
                  <li className="text-sm text-zinc-200 mt-2 flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#AA0202]" />
                    <span>
                      Garantía Plug &amp; Play 100%: Conecta y funciona al instante en Serato/VDJ, o te devolvemos tu dinero.
                    </span>
                  </li>
                </ul>

	                <div className="mt-4 grid gap-3 sm:grid-cols-2">
	                  <Button
	                    onClick={() => openOrder("usb128_product_card_buy")}
	                    disabled={isSubmitting}
	                    className="btn-primary-glow h-11 w-full text-sm font-black"
	                  >
	                    {isSubmitting && lastAttempt?.ctaId === "usb128_product_card_buy" ? (
	                      <>
	                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                        {isSpanish ? "Cargando checkout seguro..." : "Loading secure checkout..."}
	                      </>
	                    ) : (
	                      isSpanish ? "Asegurar mi USB" : "Secure my USB"
	                    )}
	                  </Button>
	                  <Button
	                    onClick={() => openOrderPayPal("usb128_product_card_buy_paypal")}
	                    disabled={isSubmitting}
	                    variant="outline"
	                    className="h-11 w-full text-sm font-black"
	                  >
	                    {isSubmitting ? (
	                      <>
	                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                        {isSpanish ? "Cargando PayPal..." : "Loading PayPal..."}
	                      </>
	                    ) : (
	                      <>
	                        <CreditCard className="mr-2 h-4 w-4 text-primary" />
	                        {isSpanish ? "PayPal" : "PayPal"}
	                      </>
	                    )}
	                  </Button>
	                </div>

                  {renderCheckoutFeedback("usb128_product_card_buy")}
                  {renderCheckoutFeedback("usb128_product_card_buy_paypal")}
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

	      <section className="py-10 md:py-16">
	        <div className="container mx-auto max-w-6xl px-4">
	          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
	            <article className="rounded-3xl border border-[#5E5E5E] bg-[#111111] p-6 shadow-[0_14px_34px_rgba(0,0,0,0.45)] md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#AA0202]">
                {isSpanish ? "Cómo funciona" : "How it works"}
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#EFEFEF] md:text-4xl">
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
                  <div key={step.title} className="rounded-2xl border border-[#5E5E5E] bg-[#070707] p-4">
                    <p className="text-sm font-black text-[#EFEFEF]">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                ))}
              </div>

	              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
	                <Button
	                  onClick={() => openOrder("usb128_how_buy")}
	                  disabled={isSubmitting}
	                  className="btn-primary-glow h-11 px-6 text-sm font-black"
	                >
	                  {isSubmitting && lastAttempt?.ctaId === "usb128_how_buy" ? (
	                    <>
	                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                      {isSpanish ? "Cargando checkout seguro..." : "Loading secure checkout..."}
	                    </>
	                  ) : (
	                    isSpanish ? "Continuar compra" : "Continue purchase"
	                  )}
	                </Button>
	              </div>
                {renderCheckoutFeedback("usb128_how_buy")}
	            </article>

            <article className="rounded-3xl border border-[#5E5E5E] bg-[#111111] p-6 text-[#EFEFEF] shadow-[0_18px_40px_rgba(0,0,0,0.45)] md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#AA0202]">
                {isSpanish ? "Prueba social" : "Social proof"}
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight md:text-4xl">
                {isSpanish ? "DJs reales, resultados reales" : "Real DJs, real outcomes"}
              </h2>

              <div className="mt-5 grid gap-3">
                {testimonials.map((item) => (
                  <blockquote key={item.who} className="rounded-2xl border border-[#5E5E5E] bg-[#070707] p-4">
                    <p className="text-sm text-[#EFEFEF]">“{item.quote}”</p>
                    <footer className="mt-2 text-xs font-bold uppercase tracking-[0.07em] text-[#AA0202]">
                      {item.who}
                    </footer>
                  </blockquote>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {socialStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-[#5E5E5E] bg-[#070707] p-2 text-center">
                    <p className="text-lg font-black text-[#EFEFEF]">{stat.value}</p>
                    <p className="text-[10px] uppercase tracking-[0.07em] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

	              <Button
	                onClick={() => openOrder("usb128_social_buy")}
	                disabled={isSubmitting}
	                className="btn-primary-glow mt-6 h-11 w-full text-sm font-black"
	              >
	                {isSubmitting && lastAttempt?.ctaId === "usb128_social_buy" ? (
	                  <>
	                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                    {isSpanish ? "Cargando checkout seguro..." : "Loading secure checkout..."}
	                  </>
	                ) : (
	                  isSpanish ? "Comprar ahora" : "Buy now"
	                )}
	              </Button>
                {renderCheckoutFeedback("usb128_social_buy")}
	            </article>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="rounded-3xl border border-[#5E5E5E] bg-[#111111] p-6 shadow-[0_14px_34px_rgba(0,0,0,0.45)] md:p-8">
            <h2 className="text-center text-3xl font-black text-[#EFEFEF] md:text-4xl">
              {isSpanish ? "Preguntas frecuentes" : "Frequently asked questions"}
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
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
          <div className="rounded-3xl border border-[#5E5E5E] bg-[#111111] p-6 text-[#EFEFEF] shadow-[0_20px_45px_rgba(0,0,0,0.45)] md:p-8">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#AA0202]">
                  {isSpanish ? "Cierre" : "Final step"}
                </p>
                <h2 className="mt-2 text-3xl font-black leading-tight md:text-4xl">
                  {isSpanish
                    ? "¿Listo para dejar de buscar música en 5 pools?"
                    : "Ready to stop searching in 5 different pools?"}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  {isSpanish
                    ? "Oferta USB 128GB: $147 USD, envío gratis USA y soporte en español."
                    : "USB 128GB offer: $147 USD, free USA shipping, and Spanish support."}
                </p>
              </div>

	              <div>
	                <Button
	                  onClick={() => openOrder("usb128_final_buy")}
	                  disabled={isSubmitting}
	                  className="btn-primary-glow h-12 w-full text-base font-black"
	                >
	                  {isSubmitting && lastAttempt?.ctaId === "usb128_final_buy" ? (
	                    <>
	                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                      {isSpanish ? "Cargando checkout seguro..." : "Loading secure checkout..."}
	                    </>
	                  ) : (
	                    isSpanish ? "Comprar USB por $147" : "Buy USB for $147"
	                  )}
	                </Button>
                  {renderCheckoutFeedback("usb128_final_buy")}
	                <p className="mt-3 text-center text-xs text-muted-foreground">
	                  {isSpanish
	                    ? "Al continuar, te enviaremos confirmación y seguimiento por email."
	                    : "By continuing, we’ll send confirmation and tracking by email."}
	                </p>
	              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-between bg-[#070707]/95 backdrop-blur-md border-t border-[#222222] p-4 shadow-[0_-10px_30px_rgba(170,2,2,0.15)]">
        <div className="flex flex-col">
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest">ENVÍO GRATIS USA</p>
          <p className="font-bebas text-2xl text-white leading-none">$147 USD</p>
        </div>

        <a
          href={`#${BUY_ANCHOR_ID}`}
          className="bg-[#AA0202] hover:bg-[#8A0101] text-white px-8 py-3 rounded-lg font-bebas text-xl animate-[pulse_2s_ease-in-out_infinite] transition-all"
          onClick={(event) => {
            event.preventDefault();
            document.getElementById(BUY_ANCHOR_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
            openOrder("usb128_mobile_sticky_buy");
          }}
        >
          COMPRAR AHORA
        </a>
      </div>

      <Footer />
    </main>
  );
}
