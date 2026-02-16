import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Crown,
  Loader2,
  Package,
  ShieldCheck,
  Star,
  Truck,
  Usb,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import logoWhite from "@/assets/logo-white.png";
import { createBestCheckoutUrl, type CheckoutProvider } from "@/lib/checkout";

/* ─── constants ─── */
const PRICE = 197;
const SONGS = "50,000+";

export default function Usb500gb() {
  const { language } = useLanguage();
  const { trackEvent } = useAnalytics();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isSpanish = language === "es";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<{ ctaId: string; prefer: CheckoutProvider } | null>(null);

  useEffect(() => {
    document.title = isSpanish
      ? "USB 500 GB – La Colección Definitiva para DJs"
      : "USB 500 GB – The Ultimate DJ Collection";
  }, [isSpanish]);

  /* ─── checkout logic (unchanged) ─── */
  const startExpressCheckout = useCallback(
    async (ctaId: string, prefer: CheckoutProvider, isRetry = false) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      setCheckoutError(null);
      setLastAttempt({ ctaId, prefer });

      trackEvent("checkout_redirect", {
        cta_id: ctaId,
        plan_id: "usb_500gb",
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
          product: "usb_500gb",
          sourcePage: window.location.pathname,
          prefer,
        });

        if (url) {
          redirected = true;
          trackEvent("checkout_redirect", {
            cta_id: ctaId,
            plan_id: "usb_500gb",
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
          plan_id: "usb_500gb",
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
            ? "Intenta de nuevo en unos segundos. Si continúa, contáctanos en Soporte."
            : "Please try again in a few seconds. If it continues, contact Support.",
          variant: "destructive",
        });
      } catch (err) {
        console.error("USB500GB checkout error:", err);
        trackEvent("checkout_redirect", {
          cta_id: ctaId,
          plan_id: "usb_500gb",
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
          title: "Error",
          description: isSpanish
            ? "Hubo un problema al iniciar el pago. Intenta de nuevo."
            : "There was a problem starting checkout. Please try again.",
          variant: "destructive",
        });
      } finally {
        if (!redirected) setIsSubmitting(false);
      }
    },
    [isSubmitting, isSpanish, toast, trackEvent]
  );

  const openOrder = useCallback(
    (ctaId: string) => { void startExpressCheckout(ctaId, "stripe"); },
    [startExpressCheckout]
  );

  const openOrderPayPal = useCallback(
    (ctaId: string) => { void startExpressCheckout(ctaId, "paypal"); },
    [startExpressCheckout]
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
          <p className="mt-3 text-xs text-zinc-400">
            {isSpanish ? "Redirigiendo a checkout seguro..." : "Redirecting to secure checkout..."}
          </p>
        );
      }
      if (!checkoutError) return null;
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>{isSpanish ? "No se pudo abrir el checkout" : "Checkout failed"}</AlertTitle>
          <AlertDescription>
            <p>{checkoutError}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="h-10 border-destructive/40"
                onClick={retryCheckout} disabled={isSubmitting}>
                {isSpanish ? "Reintentar" : "Try again"}
              </Button>
              <Button type="button" variant="ghost" className="h-10"
                onClick={() => navigate("/help")} disabled={isSubmitting}>
                {isSpanish ? "Contactar soporte" : "Contact support"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    },
    [checkoutError, isSubmitting, isSpanish, lastAttempt?.ctaId, navigate, retryCheckout]
  );

  /* ─── data ─── */
  const testimonials = useMemo(
    () => [
      { id: "t1", text: "Olvidé lo que es descargar música cada fin de semana. Ahora solo conecto y listo.", who: "Ricardo – Houston, TX" },
      { id: "t2", text: "La mejor inversión que hice en mi carrera de DJ. Calidad de primera.", who: "Javier – Miami, FL" },
      { id: "t3", text: "Esta USB cambió totalmente mi negocio. Más eventos y más dinero sin estrés.", who: "Carlos – Los Angeles, CA" },
      { id: "t4", text: "50,000 canciones organizadas por género. No encontré nada así en otro lado.", who: "Miguel – Dallas, TX" },
      { id: "t5", text: "La conecté a VirtualDJ y todo cargó al instante. Plug & play real.", who: "Eduardo – Chicago, IL" },
      { id: "t6", text: "Soy DJ de bodas y esta USB me salvó. Tiene de todo: cumbia, salsa, bachata.", who: "Andrés – Phoenix, AZ" },
      { id: "t7", text: "Mejor que andar buscando canción por canción. Vale cada centavo.", who: "Luis – Atlanta, GA" },
      { id: "t8", text: "La USB llegó rápido. Todo funciona perfecto en Serato.", who: "Fernando – New York, NY" },
      { id: "t9", text: "Compré la USB para mi quinceañera y el DJ quedó feliz. Todo listo.", who: "Sandra – San Antonio, TX" },
    ],
    []
  );

  const socialStats = useMemo(
    () => [
      { value: "7,000+", label: "DJs activos" },
      { value: SONGS, label: "canciones" },
      { value: "500 GB", label: "de música" },
    ],
    []
  );

  const features = useMemo(
    () => [
      isSpanish ? "+50,000 canciones MP3 320 kbps organizadas por género" : "+50,000 MP3 320 kbps songs organized by genre",
      isSpanish ? "Compatible con Serato, VirtualDJ, Rekordbox, Traktor" : "Compatible with Serato, VirtualDJ, Rekordbox, Traktor",
      isSpanish ? "Cumbia, banda, reggaetón, bachata, salsa, dembow, corridos y más" : "Cumbia, banda, reggaeton, bachata, salsa, dembow, corridos & more",
      isSpanish ? "Intros, outros, versiones clean y explicit listos para mezclar" : "Intros, outros, clean & explicit versions ready to mix",
      isSpanish ? "Envío rápido USPS directo a tu casa" : "Fast USPS shipping to your door",
    ],
    [isSpanish]
  );

  /* ─── render ─── */
  return (
    <main className="min-h-screen bg-[#070707] text-[#EFEFEF]">

      {/* ── Top feature strip ── */}
      <div className="border-b border-[#5E5E5E]/50 bg-[#111111]/60">
        <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-2 px-4 py-3 text-center text-xs text-zinc-400 md:grid-cols-3 md:text-sm">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#AA0202]" />
            <span>{isSpanish ? `+${SONGS} canciones MP3 listas para mezclar` : `+${SONGS} MP3 songs ready to mix`}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Package className="h-4 w-4 text-[#AA0202]" />
            <span>{isSpanish ? "Organizadas por géneros" : "Genre-organized"}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Usb className="h-4 w-4 text-[#AA0202]" />
            <span>{isSpanish ? "Compatible con cualquier software DJ" : "Compatible with any DJ software"}</span>
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#1a1a1a] via-[#AA0202] to-[#1a1a1a]" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-12 md:pb-20 md:pt-16">
          <div className="flex items-center justify-center">
            <img src={logoWhite} alt="VideoRemixesPack" className="h-14 w-auto object-contain md:h-16" />
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2 md:items-start">
            {/* Product visual */}
            <div className="rounded-3xl border border-[#5E5E5E] bg-[#111111] p-5">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#AA0202]/25 via-[#070707] to-[#070707]">
                <div className="absolute inset-0 opacity-70">
                  <div className="absolute -left-10 top-16 h-48 w-48 rounded-full bg-[#AA0202]/20 blur-3xl" />
                  <div className="absolute -right-12 bottom-8 h-64 w-64 rounded-full bg-[#AA0202]/10 blur-3xl" />
                </div>
                <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-[#AA0202]/20 bg-[#111111]/40">
                    <Usb className="h-10 w-10 text-[#AA0202]" />
                  </div>
                  <p className="mt-6 text-sm text-zinc-400">USB Definitiva</p>
                  <p className="font-display text-4xl font-black tracking-wide">500 GB</p>
                  <p className="mt-3 text-xs text-zinc-400">
                    MP3 320 kbps • Organizada • Lista para eventos
                  </p>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div>
              <Badge className="border border-[#5E5E5E] bg-[#111111]/50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.11em] text-[#EFEFEF]">
                <Truck className="mr-1.5 h-3 w-3 text-[#AA0202]" />
                {isSpanish ? "Envío incluido a todo USA" : "Free shipping USA-wide"}
              </Badge>

              <h1 className="mt-4 text-4xl font-black leading-[0.95] md:text-5xl">
                {isSpanish ? "La USB Definitiva:" : "The Ultimate USB:"}
              </h1>
              <h2 className="mt-2 text-3xl font-black leading-[0.95] text-[#AA0202] md:text-4xl">
                {isSpanish
                  ? `+${SONGS} Canciones MP3 para DJ Latinos en USA`
                  : `+${SONGS} MP3 Songs for Latino DJs in the USA`}
              </h2>

              <p className="mt-5 text-sm text-zinc-400 md:text-base">
                {isSpanish
                  ? "Ahorra tiempo, olvídate del estrés y deslumbra en cada evento con lo mejor de cumbia, banda, reggaetón, bachata, salsa, dembow, corridos y mucho más."
                  : "Save time, forget stress and shine at every event with the best of cumbia, banda, reggaeton, bachata, salsa, dembow, corridos and more."}
              </p>

              {/* Value anchoring */}
              <div className="mt-5 flex items-center gap-3">
                <span className="text-sm text-zinc-400 line-through decoration-[#AA0202] decoration-2">
                  {isSpanish ? "$500+ USD en pools y descargas separadas" : "$500+ USD in separate pools & downloads"}
                </span>
                <Badge className="border-[#AA0202]/50 bg-[#AA0202]/15 px-2 py-0.5 text-[10px] font-bold text-[#ff6b6b]">
                  {isSpanish ? "AHORRA 60%+" : "SAVE 60%+"}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {[
                  isSpanish ? "Pago único" : "One-time payment",
                  `$${PRICE} USD`,
                  isSpanish ? "4 pagos de $49.25" : "4 payments of $49.25",
                ].map((pill) => (
                  <span key={pill} className="rounded-full border border-[#5E5E5E] bg-[#111111]/50 px-4 py-1.5 text-xs font-semibold text-[#EFEFEF]">
                    {pill}
                  </span>
                ))}
              </div>

              <div className="mt-7 grid gap-3">
                <Button onClick={() => openOrder("usb500gb_hero_stripe")} disabled={isSubmitting}
                  className="btn-primary-glow h-12 w-full text-base font-black">
                  {isSubmitting && lastAttempt?.ctaId === "usb500gb_hero_stripe" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando checkout seguro..." : "Loading secure checkout..."}</>
                  ) : (
                    <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "¡QUIERO MI USB AHORA!" : "I WANT MY USB NOW!"}<ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
                <Button onClick={() => openOrderPayPal("usb500gb_hero_paypal")} disabled={isSubmitting}
                  variant="outline" className="h-12 w-full border-[#5E5E5E] text-base font-black text-[#EFEFEF] hover:bg-[#111111]">
                  {isSubmitting && lastAttempt?.ctaId === "usb500gb_hero_paypal" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando PayPal..." : "Loading PayPal..."}</>
                  ) : (
                    <><CreditCard className="mr-2 h-4 w-4 text-[#AA0202]" />{isSpanish ? "Pagar con PayPal" : "Pay with PayPal"}</>
                  )}
                </Button>
                {renderCheckoutFeedback("usb500gb_hero_stripe")}
                {renderCheckoutFeedback("usb500gb_hero_paypal")}
              </div>

              {/* Payment badges */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {["VISA", "MASTERCARD", "AMEX", "PayPal"].map((label) => (
                  <span key={label} className="rounded-full border border-[#5E5E5E] bg-[#111111]/50 px-3 py-1 text-[10px] font-semibold text-zinc-400">
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {isSpanish ? "Pago seguro • Envío 3-5 días • Soporte en español" : "Secure payment • 3-5 day shipping • Spanish support"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What's inside ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#AA0202]">
              {isSpanish ? "¿Qué incluye?" : "What's inside?"}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
              {isSpanish ? "Todo lo que necesitas en una sola USB" : "Everything you need in one USB"}
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {/* Problems */}
            <article className="rounded-3xl border border-[#5E5E5E] bg-[#111111] p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#AA0202]">
                {isSpanish ? "Sin la USB" : "Without the USB"}
              </p>
              <h3 className="mt-3 text-2xl font-black md:text-3xl">
                {isSpanish ? "¿Te suena familiar?" : "Sound familiar?"}
              </h3>
              <ul className="mt-6 space-y-3 text-sm text-zinc-400">
                {[
                  isSpanish ? "Pierdes horas cada semana descargando música de baja calidad" : "Spending hours downloading low quality music",
                  isSpanish ? "Archivos desorganizados que te hacen quedar mal en eventos" : "Disorganized files that make you look bad at events",
                  isSpanish ? "Te cuesta encontrar versiones limpias para eventos familiares" : "Can't find clean versions for family events",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </article>

            {/* Solution */}
            <article className="rounded-3xl border border-[#5E5E5E] bg-[#111111] p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#AA0202]">
                {isSpanish ? "Con la USB" : "With the USB"}
              </p>
              <h3 className="mt-3 text-2xl font-black md:text-3xl">
                {isSpanish ? "Solución instantánea" : "Instant solution"}
              </h3>
              <ul className="mt-6 space-y-3 text-sm text-zinc-400">
                {features.map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#AA0202]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          {/* Mid CTA */}
          <div className="mt-10 rounded-3xl border border-[#5E5E5E] bg-[#111111] p-8 text-center">
            <p className="text-2xl font-black md:text-3xl">
              {isSpanish
                ? "Menos estrés, más ingresos y mayor prestigio en cada presentación."
                : "Less stress, more income and greater prestige at every gig."}
            </p>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => openOrder("usb500gb_mid_stripe")} disabled={isSubmitting}
                className="btn-primary-glow h-12 w-full max-w-xl text-base font-black">
                {isSubmitting && lastAttempt?.ctaId === "usb500gb_mid_stripe" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
                ) : (
                  <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "ORDENA TU USB AHORA" : "ORDER YOUR USB NOW"}<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
            {renderCheckoutFeedback("usb500gb_mid_stripe")}
          </div>
        </div>
      </section>

      {/* ── Bonus ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <article className="rounded-3xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10">
            <div className="flex flex-col items-center text-center">
              <Badge className="border-[#AA0202]/40 bg-[#AA0202]/15 px-3 py-1 text-[11px] font-bold text-yellow-300">
                <Crown className="mr-1.5 h-3 w-3 fill-yellow-400 text-yellow-400" />
                {isSpanish ? "BONUS GRATIS por Tiempo Limitado" : "FREE BONUS for Limited Time"}
              </Badge>
              <h2 className="mt-5 text-3xl font-black leading-tight md:text-4xl">
                {isSpanish
                  ? <>Acceso Exclusivo a nuestra plataforma <span className="text-[#AA0202]">SKOOL</span></>
                  : <>Exclusive Access to our <span className="text-[#AA0202]">SKOOL</span> platform</>}
              </h2>
            </div>

            <ul className="mt-8 space-y-3 text-sm text-zinc-400 md:text-base">
              {[
                isSpanish ? "Reuniones semanales en vivo para generar más dinero como DJ" : "Weekly live meetings to earn more as a DJ",
                isSpanish ? "Conexión con cientos de DJs latinos en EE.UU." : "Connect with hundreds of Latino DJs in the US",
                isSpanish ? "Recursos exclusivos para hacer crecer tu negocio DJ" : "Exclusive resources to grow your DJ business",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#AA0202]" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex justify-center">
              <Button onClick={() => openOrder("usb500gb_bonus_stripe")} disabled={isSubmitting}
                className="btn-primary-glow h-12 w-full max-w-xl text-base font-black">
                {isSubmitting && lastAttempt?.ctaId === "usb500gb_bonus_stripe" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
                ) : (
                  <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "ORDENA TU USB AHORA" : "ORDER YOUR USB NOW"}<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
            {renderCheckoutFeedback("usb500gb_bonus_stripe")}
          </article>
        </div>
      </section>

      {/* ── Social proof (3×3 grid) ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <article className="rounded-3xl border border-[#5E5E5E] bg-[#111111] p-6 md:p-8">
            <Badge className="border-[#AA0202]/40 bg-[#AA0202]/15 px-3 py-1 text-[11px] font-bold text-yellow-300">
              <Star className="mr-1.5 h-3 w-3 fill-yellow-400 text-yellow-400" />
              {isSpanish ? "+7,000 DJs CONFÍAN EN NOSOTROS" : "+7,000 DJs TRUST US"}
            </Badge>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
              {isSpanish ? "DJs reales, resultados reales" : "Real DJs, real outcomes"}
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {testimonials.map((t) => (
                <div key={t.id} className="rounded-xl border border-[#5E5E5E] bg-[#070707] p-4">
                  <p className="text-sm text-[#EFEFEF]">"{t.text}"</p>
                  <p className="mt-2 text-right text-[10px] text-zinc-500">{t.who} ✓✓</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-zinc-500">
              {isSpanish ? "Testimonios reales de DJs. Sin inventos." : "Real DJ testimonials. No fakes."}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {socialStats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-[#5E5E5E] bg-[#070707] p-2 text-center">
                  <p className="text-lg font-black text-[#EFEFEF]">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-[0.07em] text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <Button onClick={() => openOrder("usb500gb_testimonials_stripe")} disabled={isSubmitting}
              className="btn-primary-glow mt-6 h-11 w-full text-sm font-black">
              {isSubmitting && lastAttempt?.ctaId === "usb500gb_testimonials_stripe" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
              ) : (
                isSpanish ? "Comprar ahora" : "Buy now"
              )}
            </Button>
            {renderCheckoutFeedback("usb500gb_testimonials_stripe")}
          </article>
        </div>
      </section>

      {/* ── Guarantee ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <article className="rounded-3xl border border-[#5E5E5E] bg-[#111111] p-8">
            <h2 className="text-center text-3xl font-black md:text-4xl">
              {isSpanish ? "Nuestra Garantía de Confianza Total" : "Our Total Trust Guarantee"}
            </h2>

            <ul className="mt-8 space-y-4 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 shrink-0 text-[#AA0202]" />
                <span>{isSpanish ? "Envío rápido desde EE.UU. por USPS, directo hasta tu casa en ~5 días." : "Fast USPS shipping from the US, to your door in ~5 days."}</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#AA0202]" />
                <span>{isSpanish ? "Soporte personalizado en español directo por WhatsApp." : "Personalized Spanish support via WhatsApp."}</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#AA0202]" />
                <span>{isSpanish ? "Compra segura y protegida." : "Safe and secured purchase."}</span>
              </li>
            </ul>

            {/* Standalone guarantee badge */}
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
              <ShieldCheck className="h-6 w-6 shrink-0 text-green-400" />
              <div>
                <p className="text-sm font-bold text-green-300">
                  {isSpanish ? "Garantía Plug & Play 100%" : "100% Plug & Play Guarantee"}
                </p>
                <p className="text-xs text-green-300/70">
                  {isSpanish
                    ? "Conecta y funciona al instante, o te devolvemos tu dinero."
                    : "Plug in and it works instantly, or your money back."}
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button onClick={() => openOrder("usb500gb_guarantee_stripe")} disabled={isSubmitting}
                className="btn-primary-glow h-12 w-full max-w-xl text-base font-black">
                {isSubmitting && lastAttempt?.ctaId === "usb500gb_guarantee_stripe" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
                ) : (
                  <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "ORDENA TU USB AHORA" : "ORDER YOUR USB NOW"}<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
            {renderCheckoutFeedback("usb500gb_guarantee_stripe")}
          </article>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="pb-20 pt-6 md:pb-28">
        <div className="container mx-auto max-w-4xl px-4">
          <article className="rounded-3xl border border-[#5E5E5E] bg-[#111111] p-8 text-center">
            <h2 className="text-3xl font-black leading-tight md:text-4xl">
              {isSpanish
                ? <>Oferta Especial Por <span className="text-[#AA0202]">Tiempo Limitado</span>!</>
                : <>Special <span className="text-[#AA0202]">Limited-Time</span> Offer!</>}
            </h2>

            <p className="mt-6 text-sm text-zinc-400">
              {isSpanish ? "Pero hoy tienes todo esto por un precio increíble:" : "But today you get all this for an incredible price:"}
            </p>

            <div className="mt-4 flex justify-center">
              <Button onClick={() => openOrder("usb500gb_offer_stripe")} disabled={isSubmitting}
                className="btn-primary-glow h-14 w-full max-w-2xl text-base font-black md:text-lg">
                {isSubmitting && lastAttempt?.ctaId === "usb500gb_offer_stripe" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
                ) : (
                  <span className="flex w-full flex-col items-center leading-tight">
                    <span>{isSpanish ? `ORDENA YA – $${PRICE} USD` : `ORDER NOW – $${PRICE} USD`}</span>
                    <span className="text-xs font-semibold opacity-90">
                      {isSpanish ? "⚠️ Unidades limitadas disponibles" : "⚠️ Limited units available"}
                    </span>
                  </span>
                )}
              </Button>
            </div>
            {renderCheckoutFeedback("usb500gb_offer_stripe")}
          </article>

          {/* Trust footer */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {["VISA", "MASTERCARD", "AMEX", "PayPal"].map((l) => (
                <span key={l} className="rounded-full border border-[#5E5E5E] bg-[#111111]/50 px-3 py-1 text-[10px] font-semibold text-zinc-500">{l}</span>
              ))}
            </div>
            <p className="text-center text-xs text-zinc-600">
              © {new Date().getFullYear()} VideoRemixesPack™ | {isSpanish ? "Todos los derechos reservados" : "All rights reserved"}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
