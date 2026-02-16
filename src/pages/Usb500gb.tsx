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
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useToast } from "@/hooks/use-toast";
import logoWhite from "@/assets/logo-white.png";
import usb500Photo from "@/assets/usb500-sandisk.png";
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

  /* live purchase ticker */
  const [tickerIdx, setTickerIdx] = useState(0);
  const TICKER_NAMES = useMemo(
    () => ["Ricardo, Houston TX", "Javier, Miami FL", "Carlos, Los Angeles CA", "Miguel, Dallas TX", "Eduardo, Chicago IL", "Sandra, San Antonio TX"],
    []
  );
  useEffect(() => {
    const iv = setInterval(() => setTickerIdx((i) => (i + 1) % TICKER_NAMES.length), 4000);
    return () => clearInterval(iv);
  }, [TICKER_NAMES.length]);

  useEffect(() => {
    document.title = isSpanish
      ? "USB 500 GB – La Colección Definitiva para DJs"
      : "USB 500 GB – The Ultimate DJ Collection";
  }, [isSpanish]);

  /* ─── checkout logic ─── */
  const startExpressCheckout = useCallback(
    async (ctaId: string, prefer: CheckoutProvider, isRetry = false) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      setCheckoutError(null);
      setLastAttempt({ ctaId, prefer });

      trackEvent("checkout_redirect", {
        cta_id: ctaId, plan_id: "usb_500gb", provider: prefer,
        status: "starting", funnel_step: "checkout_handoff", is_retry: isRetry,
      });

      let redirected = false;
      try {
        const leadId = crypto.randomUUID();
        const { provider, url } = await createBestCheckoutUrl({
          leadId, product: "usb_500gb", sourcePage: window.location.pathname, prefer,
        });

        if (url) {
          redirected = true;
          trackEvent("checkout_redirect", {
            cta_id: ctaId, plan_id: "usb_500gb", provider: provider || prefer,
            status: "redirected", funnel_step: "checkout_handoff", is_retry: isRetry, lead_id: leadId,
          });
          window.location.assign(url);
          return;
        }

        trackEvent("checkout_redirect", {
          cta_id: ctaId, plan_id: "usb_500gb", provider: prefer,
          status: "missing_url", funnel_step: "checkout_handoff", is_retry: isRetry, lead_id: leadId,
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
          cta_id: ctaId, plan_id: "usb_500gb", provider: prefer,
          status: "error", funnel_step: "checkout_handoff", is_retry: isRetry,
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
      { id: "t1", text: isSpanish ? "Ya lo compré bro, ya hasta me llegó. ¡Es una locura la cantidad de música!" : "Already bought it bro, it arrived! The amount of music is crazy!", who: "Ricardo M.", city: "Houston, TX", flag: "🇲🇽", stars: 5 },
      { id: "t2", text: isSpanish ? "La mejor inversión que hice en mi carrera de DJ. Calidad de primera." : "Best investment I made in my DJ career. Top quality.", who: "Javier R.", city: "Miami, FL", flag: "🇨🇺", stars: 5 },
      { id: "t3", text: isSpanish ? "Esta USB cambió totalmente mi negocio. Más eventos y más dinero sin estrés." : "This USB totally changed my business. More events and money, no stress.", who: "Carlos L.", city: "Los Angeles, CA", flag: "🇲🇽", stars: 5 },
      { id: "t4", text: isSpanish ? "50,000 canciones organizadas por género. No encontré nada así en otro lado." : "50,000 songs organized by genre. I didn't find anything like this anywhere else.", who: "Miguel S.", city: "Dallas, TX", flag: "🇸🇻", stars: 5 },
      { id: "t5", text: isSpanish ? "La conecté a VirtualDJ y todo cargó al instante. Plug & play real." : "I plugged it into VirtualDJ and everything loaded instantly. Real plug & play.", who: "Eduardo P.", city: "Chicago, IL", flag: "🇬🇹", stars: 5 },
      { id: "t6", text: isSpanish ? "Soy DJ de bodas y esta USB me salvó. Tiene de todo: cumbia, salsa, bachata." : "I'm a wedding DJ and this USB saved me. It has everything: cumbia, salsa, bachata.", who: "Andrés V.", city: "Phoenix, AZ", flag: "🇲🇽", stars: 5 },
      { id: "t7", text: isSpanish ? "Mejor que andar buscando canción por canción. Vale cada centavo." : "Better than searching song by song. Worth every penny.", who: "Luis G.", city: "Atlanta, GA", flag: "🇭🇳", stars: 4 },
      { id: "t8", text: isSpanish ? "La USB llegó rápido. Todo funciona perfecto en Serato." : "The USB arrived fast. Everything works perfectly on Serato.", who: "Fernando T.", city: "New York, NY", flag: "🇩🇴", stars: 5 },
      { id: "t9", text: isSpanish ? "Compré la USB para mi quinceañera y el DJ quedó feliz. Todo listo." : "I bought the USB for my quinceañera and the DJ was thrilled. All set.", who: "Sandra M.", city: "San Antonio, TX", flag: "🇲🇽", stars: 5 },
    ],
    [isSpanish]
  );

  const socialStats = useMemo(
    () => [
      { value: "7,000+", label: isSpanish ? "DJs activos" : "Active DJs" },
      { value: SONGS, label: isSpanish ? "canciones" : "songs" },
      { value: "500 GB", label: isSpanish ? "de música" : "of music" },
    ],
    [isSpanish]
  );

  const features = useMemo(
    () => [
      isSpanish ? "+50,000 canciones MP3 (320 kbps) organizadas por género" : "+50,000 MP3 songs (320 kbps) organized by genre",
      isSpanish ? "Compatible con Serato, VirtualDJ, Rekordbox, Traktor" : "Compatible with Serato, VirtualDJ, Rekordbox, Traktor",
      isSpanish ? "Cumbia, banda, reggaetón, bachata, salsa, dembow, corridos y más" : "Cumbia, banda, reggaeton, bachata, salsa, dembow, corridos & more",
      isSpanish ? "Intros, outros, versiones clean y explicit listos para mezclar" : "Intros, outros, clean & explicit versions ready to mix",
      isSpanish ? "Envío rápido USPS directo a tu casa (~5 días)" : "Fast USPS shipping to your door (~5 days)",
    ],
    [isSpanish]
  );

  /* ─── render ─── */
  return (
    <main className="min-h-screen bg-[#070707] text-[#EFEFEF]">

      {/* ── Inline styles for animations ── */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(170,2,2,0.4), 0 0 40px rgba(170,2,2,0.15); }
          50% { box-shadow: 0 0 20px rgba(170,2,2,0.7), 0 0 60px rgba(170,2,2,0.3); }
        }
        .cta-pulse { animation: pulseGlow 2s ease-in-out infinite; }
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(8px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        .ticker-fade { animation: fadeSlideUp 4s ease-in-out infinite; }
        @keyframes floatGlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .float-glow { animation: floatGlow 3s ease-in-out infinite; }
      `}</style>

      {/* ── Top feature strip ── */}
      <div className="border-b border-[#5E5E5E]/50 bg-[#111111]/60">
        <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-2 px-4 py-3 text-center text-xs text-zinc-400 md:grid-cols-3 md:text-sm">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#AA0202]" />
            <span>{isSpanish ? `+${SONGS} canciones en MP3 (320 kbps) listas para mezclar` : `+${SONGS} MP3 songs (320 kbps) ready to mix`}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Package className="h-4 w-4 text-[#AA0202]" />
            <span>{isSpanish ? "Organizadas por géneros para máxima facilidad" : "Genre-organized for maximum ease"}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Usb className="h-4 w-4 text-[#AA0202]" />
            <span>{isSpanish ? "Compatible con Serato, Virtual DJ, Rekordbox y más" : "Compatible with Serato, Virtual DJ, Rekordbox & more"}</span>
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
            {/* Product photo */}
            <div className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-5">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#AA0202]/15 via-[#070707] to-[#070707]">
                <div className="absolute inset-0 opacity-60">
                  <div className="absolute -left-10 top-16 h-48 w-48 rounded-full bg-[#AA0202]/20 blur-3xl" />
                  <div className="absolute -right-12 bottom-8 h-64 w-64 rounded-full bg-[#AA0202]/10 blur-3xl" />
                </div>
                <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
                  {/* Real product photo */}
                  <img src={usb500Photo} alt="USB 500 GB SanDisk" className="float-glow h-auto w-3/4 max-w-[280px] drop-shadow-[0_20px_40px_rgba(170,2,2,0.25)] md:w-2/3" />
                  <p className="mt-5 text-sm text-zinc-400">USB Definitiva</p>
                  <p className="font-bebas text-5xl uppercase tracking-wide md:text-6xl">500 GB</p>

                  {/* Specs inside product card */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {["MP3 320 kbps", isSpanish ? "Organizada" : "Organized", isSpanish ? "Lista para eventos" : "Event-ready"].map((s) => (
                      <span key={s} className="rounded-full border border-[#5E5E5E]/50 bg-[#111111]/50 px-3 py-1 text-[10px] font-semibold text-zinc-400">{s}</span>
                    ))}
                  </div>

                  {/* Mini social proof inside product */}
                  <div className="mt-5 flex items-center gap-2 rounded-full border border-[#5E5E5E]/30 bg-[#111111]/50 px-4 py-1.5">
                    <div className="flex -space-x-1">
                      {["⭐", "⭐", "⭐", "⭐", "⭐"].map((s, i) => (
                        <span key={i} className="text-[10px]">{s}</span>
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-400">7,000+ DJs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div>
              <Badge className="border border-[#5E5E5E] bg-[#111111]/50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.11em] text-[#EFEFEF]">
                <Truck className="mr-1.5 h-3 w-3 text-[#AA0202]" />
                {isSpanish ? "Envío incluido a todo USA" : "Free shipping USA-wide"}
              </Badge>

              <h1 className="mt-4 font-bebas text-4xl uppercase leading-[0.95] md:text-5xl">
                {isSpanish ? "La USB Definitiva:" : "The Ultimate USB:"}
              </h1>
              <h2 className="mt-2 font-bebas text-3xl uppercase leading-[0.95] text-[#AA0202] md:text-4xl">
                {isSpanish
                  ? `+${SONGS} Canciones MP3 para DJ Latinos en USA, Organizadas y Listas para Mezclar`
                  : `+${SONGS} MP3 Songs for Latino DJs in the USA, Organized & Ready to Mix`}
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

              {/* CTAs with pulse animation */}
              <div className="mt-7 grid gap-3">
                <Button onClick={() => openOrder("usb500gb_hero_stripe")} disabled={isSubmitting}
                  className="cta-pulse btn-primary-glow h-14 w-full font-bebas text-xl uppercase tracking-wide">
                  {isSubmitting && lastAttempt?.ctaId === "usb500gb_hero_stripe" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando checkout seguro..." : "Loading secure checkout..."}</>
                  ) : (
                    <>
                      <span className="flex w-full flex-col items-center leading-tight">
                        <span className="flex items-center">👉 {isSpanish ? "¡QUIERO MI USB AHORA!" : "I WANT MY USB NOW!"} 👈</span>
                        <span className="text-[11px] font-semibold opacity-80">🔒 {isSpanish ? "Stock limitado. Pago 100% seguro." : "Limited stock. 100% secure payment."}</span>
                      </span>
                    </>
                  )}
                </Button>
                <Button onClick={() => openOrderPayPal("usb500gb_hero_paypal")} disabled={isSubmitting}
                  variant="outline" className="h-12 w-full border-[#5E5E5E] font-bebas text-xl uppercase tracking-wide text-[#EFEFEF] hover:bg-[#111111]">
                  {isSubmitting && lastAttempt?.ctaId === "usb500gb_hero_paypal" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando PayPal..." : "Loading PayPal..."}</>
                  ) : (
                    <><CreditCard className="mr-2 h-4 w-4 text-[#AA0202]" />{isSpanish ? "Pagar con PayPal" : "Pay with PayPal"}</>
                  )}
                </Button>
                {renderCheckoutFeedback("usb500gb_hero_stripe")}
                {renderCheckoutFeedback("usb500gb_hero_paypal")}
              </div>

              {/* Guarantee badge right next to CTA */}
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5">
                <ShieldCheck className="h-5 w-5 shrink-0 text-green-400" />
                <p className="text-xs text-green-300">
                  <span className="font-bold">{isSpanish ? "Garantía Plug & Play:" : "Plug & Play Guarantee:"}</span>{" "}
                  {isSpanish ? "Conecta y funciona, o te devolvemos tu dinero." : "Plug in and it works, or your money back."}
                </p>
              </div>

              {/* Payment badges */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {["VISA", "MASTERCARD", "AMEX", "DISCOVER", "PayPal"].map((label) => (
                  <span key={label} className="rounded-full border border-[#5E5E5E] bg-[#111111]/50 px-3 py-1 text-[10px] font-semibold text-zinc-400">
                    <CreditCard className="mr-1 inline h-3 w-3" />{label}
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

      {/* ── Live purchase ticker ── */}
      <div className="border-y border-[#5E5E5E]/30 bg-[#111111]/50 py-2.5">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="ticker-fade flex items-center justify-center gap-2 text-xs text-zinc-400">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
            <span>
              🛒 <span className="font-semibold text-[#EFEFEF]">{TICKER_NAMES[tickerIdx]}</span>{" "}
              {isSpanish ? "acaba de ordenar su USB" : "just ordered their USB"}
            </span>
          </div>
        </div>
      </div>

      {/* ── How it works (3 steps) ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#AA0202]">
              {isSpanish ? "¿Cómo funciona?" : "How does it work?"}
            </p>
            <h2 className="mt-3 font-bebas text-3xl uppercase leading-tight md:text-4xl">
              {isSpanish ? "3 Simples Pasos" : "3 Simple Steps"}
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { step: "01", icon: <CreditCard className="h-6 w-6 text-[#AA0202]" />, title: isSpanish ? "Ordena tu USB" : "Order your USB", desc: isSpanish ? "Paga seguro con tarjeta o PayPal. Proceso de 2 minutos." : "Pay securely with card or PayPal. 2-minute process." },
              { step: "02", icon: <Truck className="h-6 w-6 text-[#AA0202]" />, title: isSpanish ? "Recíbela en casa" : "Receive it at home", desc: isSpanish ? "Envío USPS directo a tu puerta en ~5 días hábiles." : "USPS shipping to your door in ~5 business days." },
              { step: "03", icon: <Usb className="h-6 w-6 text-[#AA0202]" />, title: isSpanish ? "Conecta y mezcla" : "Plug in & mix", desc: isSpanish ? "Conecta a tu laptop, abre tu software DJ y listo. Plug & Play." : "Plug into your laptop, open your DJ software and go. Plug & Play." },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6 text-center">
                <span className="font-bebas text-3xl text-[#AA0202]/30">{s.step}</span>
                <div className="mt-2 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#5E5E5E] bg-[#070707]">
                  {s.icon}
                </div>
                <h3 className="mt-3 font-bebas text-xl uppercase">{s.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem / Solution ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#AA0202]">
              {isSpanish ? "No Repitas la Historia" : "Don't Repeat the Same Story"}
            </p>
            <h2 className="mt-3 font-bebas text-3xl uppercase leading-tight md:text-4xl">
              {isSpanish ? "¿Te Suena Familiar Alguno de Estos Problemas?" : "Sound Familiar?"}
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {/* Problems — uses ✗ icons */}
            <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#AA0202]">
                {isSpanish ? "Sin la USB" : "Without the USB"}
              </p>
              <h3 className="mt-3 font-bebas text-2xl uppercase md:text-3xl">
                {isSpanish ? "¿Te suena familiar?" : "Sound familiar?"}
              </h3>
              <ul className="mt-6 space-y-3 text-sm text-zinc-400">
                {[
                  isSpanish ? "Pierdes horas cada semana descargando música de baja calidad" : "Spending hours downloading low quality music",
                  isSpanish ? "Archivos desorganizados que te hacen quedar mal en eventos" : "Disorganized files that make you look bad at events",
                  isSpanish ? "Te cuesta encontrar versiones limpias para eventos familiares" : "Can't find clean versions for family events",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500/70" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm font-semibold text-zinc-300">
                {isSpanish ? "Si respondiste SÍ a cualquiera de estas preguntas, ¡esto es para ti!" : "If you said YES to any of these, this is for you!"}
              </p>
            </article>

            {/* Solution — uses ✓ icons */}
            <article className="rounded-2xl border border-[#AA0202]/30 bg-[#111111] p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#AA0202]">
                {isSpanish ? "Aquí tienes la solución (Oferta Única)" : "Here's the solution (One-Time Offer)"}
              </p>
              <h3 className="mt-3 font-bebas text-2xl uppercase md:text-3xl">
                {isSpanish ? <>Presentamos nuestra exclusiva <span className="text-[#AA0202]">USB DJ Edición Latina</span></> : <>Presenting our exclusive <span className="text-[#AA0202]">USB DJ Latin Edition</span></>}
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
          <div className="mt-10 rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 text-center">
            <p className="font-bebas text-2xl uppercase md:text-3xl">
              {isSpanish
                ? "Menos estrés, más ingresos y mayor prestigio en cada presentación."
                : "Less stress, more income and greater prestige at every gig."}
            </p>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => openOrder("usb500gb_mid_stripe")} disabled={isSubmitting}
                className="cta-pulse btn-primary-glow h-12 w-full max-w-xl font-bebas text-xl uppercase tracking-wide">
                {isSubmitting && lastAttempt?.ctaId === "usb500gb_mid_stripe" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
                ) : (
                  <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "¡ORDENA TU USB AHORA!" : "ORDER YOUR USB NOW!"}<ArrowRight className="ml-2 h-4 w-4" /></>
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
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10">
            <div className="flex flex-col items-center text-center">
              <Badge className="border-[#AA0202]/40 bg-[#AA0202]/15 px-3 py-1 text-[11px] font-bold text-yellow-300">
                <Crown className="mr-1.5 h-3 w-3 fill-yellow-400 text-yellow-400" />
                {isSpanish ? "Bonus Irresistible (GRATIS por Tiempo Limitado)" : "Irresistible Bonus (FREE for Limited Time)"}
              </Badge>
              <h2 className="mt-5 font-bebas text-3xl uppercase leading-tight md:text-4xl">
                {isSpanish
                  ? <>Acceso Exclusivo a nuestra plataforma <span className="text-[#AA0202]">SKOOL</span></>
                  : <>Exclusive Access to our <span className="text-[#AA0202]">SKOOL</span> platform</>}
              </h2>
            </div>

            <ul className="mt-8 space-y-3 text-sm text-zinc-400 md:text-base">
              {[
                isSpanish ? "Reuniones semanales en vivo para enseñarte cómo generar más dinero como DJ." : "Weekly live meetings to teach you how to earn more as a DJ.",
                isSpanish ? "Conexión con cientos de DJs latinos en EE.UU. para compartir experiencias y crecer juntos." : "Connect with hundreds of Latino DJs in the US to share experiences and grow together.",
                isSpanish ? "Recursos exclusivos para hacer crecer tu negocio DJ de inmediato." : "Exclusive resources to grow your DJ business immediately.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#AA0202]" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex justify-center">
              <Button onClick={() => openOrder("usb500gb_bonus_stripe")} disabled={isSubmitting}
                className="btn-primary-glow h-12 w-full max-w-xl font-bebas text-xl uppercase tracking-wide">
                {isSubmitting && lastAttempt?.ctaId === "usb500gb_bonus_stripe" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
                ) : (
                  <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "¡ORDENA TU USB AHORA MISMO! No pierdas más tiempo buscando música" : "ORDER YOUR USB NOW! Stop wasting time searching for music"}<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-zinc-500">
              {isSpanish ? "Obtén la colección definitiva y haz que cada evento sea inolvidable." : "Get the ultimate collection and make every event unforgettable."}
            </p>
            {renderCheckoutFeedback("usb500gb_bonus_stripe")}
          </article>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6 md:p-8">
            <div className="text-center">
              <Badge className="border-[#AA0202]/40 bg-[#AA0202]/15 px-3 py-1 text-[11px] font-bold text-yellow-300">
                <Star className="mr-1.5 h-3 w-3 fill-yellow-400 text-yellow-400" />
                {isSpanish ? "DJ'S QUE HAN COMPRADO LA USB DEFINITIVA" : "DJS WHO BOUGHT THE ULTIMATE USB"}
              </Badge>
              <h2 className="mt-3 font-bebas text-3xl uppercase leading-tight md:text-4xl">
                {isSpanish ? "Lo Que Dicen Nuestros Clientes" : "What Our Customers Say"}
              </h2>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {testimonials.map((t) => (
                <div key={t.id} className="rounded-xl border border-[#5E5E5E] bg-[#070707] p-4">
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-[#EFEFEF]">"{t.text}"</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-base">{t.flag}</span>
                    <div>
                      <p className="text-xs font-semibold text-[#EFEFEF]">{t.who}</p>
                      <p className="text-[10px] text-zinc-500">{t.city} ✓✓</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {socialStats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-[#5E5E5E] bg-[#070707] p-2 text-center">
                  <p className="font-bebas text-2xl text-[#EFEFEF]">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-[0.07em] text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-zinc-500">
              {isSpanish ? "Testimonios reales de DJs verificados." : "Real testimonials from verified DJs."}
            </p>

            <Button onClick={() => openOrder("usb500gb_testimonials_stripe")} disabled={isSubmitting}
              className="cta-pulse btn-primary-glow mt-6 h-11 w-full font-bebas text-lg uppercase tracking-wide">
              {isSubmitting && lastAttempt?.ctaId === "usb500gb_testimonials_stripe" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
              ) : (
                <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "¡QUIERO MI USB AHORA!" : "I WANT MY USB NOW!"}<ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
            {renderCheckoutFeedback("usb500gb_testimonials_stripe")}
          </article>
        </div>
      </section>

      {/* ── Guarantee ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8">
            <h2 className="text-center font-bebas text-3xl uppercase md:text-4xl">
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
                <span>{isSpanish ? "Compra segura y protegida con cifrado SSL." : "Safe and protected purchase with SSL encryption."}</span>
              </li>
            </ul>

            {/* Prominent guarantee badge */}
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
              <ShieldCheck className="h-8 w-8 shrink-0 text-green-400" />
              <div>
                <p className="text-sm font-bold text-green-300">
                  {isSpanish ? "Garantía Plug & Play 100%" : "100% Plug & Play Guarantee"}
                </p>
                <p className="text-xs text-green-300/70">
                  {isSpanish
                    ? "Conecta y funciona al instante con cualquier software DJ, o te devolvemos tu dinero. Sin preguntas."
                    : "Plug in and it works instantly with any DJ software, or your money back. No questions asked."}
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button onClick={() => openOrder("usb500gb_guarantee_stripe")} disabled={isSubmitting}
                className="cta-pulse btn-primary-glow h-12 w-full max-w-xl font-bebas text-xl uppercase tracking-wide">
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
          <article className="rounded-2xl border border-[#AA0202]/30 bg-gradient-to-b from-[#111111] to-[#0a0a0a] p-8 text-center">
            <h2 className="font-bebas text-3xl uppercase leading-tight md:text-4xl">
              {isSpanish
                ? <>Oferta Especial Por <span className="text-[#AA0202]">Tiempo Limitado</span>!</>
                : <>Special <span className="text-[#AA0202]">Limited-Time</span> Offer!</>}
            </h2>

            <p className="mt-3 font-bebas text-xl uppercase text-zinc-300 md:text-2xl">
              {isSpanish
                ? "Si contaras las horas que pierdes organizando tu librería musical podrías perder"
                : "If you counted the hours spent organizing your music library, you could lose"}
              {" "}<span className="text-[#AA0202]">{isSpanish ? "cientos de dólares" : "hundreds of dollars"}</span>{" "}
              {isSpanish ? "en tiempo operativo." : "in operational time."}
            </p>

            <p className="mt-6 text-sm text-zinc-400">
              {isSpanish ? "Pero hoy tienes todo esto por un precio increíble:" : "But today you get all this for an incredible price:"}
            </p>

            <div className="mt-4 flex justify-center">
              <Button onClick={() => openOrder("usb500gb_offer_stripe")} disabled={isSubmitting}
                className="cta-pulse btn-primary-glow h-16 w-full max-w-2xl font-bebas text-2xl uppercase tracking-wide">
                {isSubmitting && lastAttempt?.ctaId === "usb500gb_offer_stripe" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
                ) : (
                  <span className="flex w-full flex-col items-center leading-tight">
                    <span>{isSpanish ? `ORDENA YA - POR $${PRICE}` : `ORDER NOW - $${PRICE}`}</span>
                    <span className="text-xs font-semibold opacity-90">
                      ⚠️ {isSpanish ? "Atención: Unidades limitadas disponibles, no te quedes sin la tuya." : "Attention: Limited units available, don't miss out."}
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
              {["VISA", "MASTERCARD", "AMEX", "DISCOVER", "PayPal"].map((l) => (
                <span key={l} className="rounded-full border border-[#5E5E5E] bg-[#111111]/50 px-3 py-1 text-[10px] font-semibold text-zinc-500">
                  <CreditCard className="mr-1 inline h-3 w-3" />{l}
                </span>
              ))}
            </div>
            <p className="text-center text-xs text-zinc-600">
              Copyrights {new Date().getFullYear()} IGustavo Garcia™ | <a href="/terms" className="underline hover:text-zinc-400">Terms & Conditions</a>
            </p>
          </div>
        </div>
      </section>

      {/* ── Sticky mobile CTA bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#5E5E5E]/50 bg-[#070707]/95 p-3 backdrop-blur-md md:hidden">
        <Button onClick={() => openOrder("usb500gb_sticky")} disabled={isSubmitting}
          className="cta-pulse btn-primary-glow h-12 w-full font-bebas text-lg uppercase tracking-wide">
          {isSubmitting && lastAttempt?.ctaId === "usb500gb_sticky" ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
          ) : (
            <>👉 {isSpanish ? `¡QUIERO MI USB – $${PRICE}!` : `I WANT MY USB – $${PRICE}!`} 👈</>
          )}
        </Button>
        {renderCheckoutFeedback("usb500gb_sticky")}
      </div>
    </main>
  );
}
