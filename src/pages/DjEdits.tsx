import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Headphones,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useToast } from "@/hooks/use-toast";
import HlsVideo from "@/components/HlsVideo";
import djEditsPoster from "@/assets/dj-edits-poster.webp";
import logoWhite from "@/assets/logo-white.webp";
import { createBestCheckoutUrl, type CheckoutProvider } from "@/lib/checkout";

const PREVIEW_HLS_URL =
  "https://content.apisystem.tech/hls/medias/kIG3EUjfgGLoNW0QsJLS/media/transcoded_videos/cts-824a03253a87c3fb_,360,480,720,1080,p.mp4.urlset/master.m3u8";

export default function DjEdits() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<{ ctaId: string; prefer: CheckoutProvider } | null>(null);

  const isSpanish = language === "es";

  useEffect(() => {
    document.title = "DJ Edits | Aprende a crear DJ edits desde cero";
  }, []);

  /* ─── checkout logic ─── */
  const startCheckout = useCallback(async (prefer: CheckoutProvider, ctaId: string, isRetry = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setCheckoutError(null);
    setLastAttempt({ ctaId, prefer });

    trackEvent("checkout_redirect", {
      cta_id: ctaId, plan_id: "djedits", provider: prefer,
      status: "starting", funnel_step: "checkout_handoff", is_retry: isRetry,
    });

    let redirected = false;
    try {
      const leadId = crypto.randomUUID();
      const { url } = await createBestCheckoutUrl({
        leadId, product: "djedits", sourcePage: window.location.pathname, prefer,
      });

      if (url) {
        redirected = true;
        trackEvent("checkout_redirect", {
          cta_id: ctaId, plan_id: "djedits", provider: prefer,
          status: "redirected", funnel_step: "checkout_handoff", is_retry: isRetry, lead_id: leadId,
        });
        window.location.assign(url);
        return;
      }

      trackEvent("checkout_redirect", {
        cta_id: ctaId, plan_id: "djedits", provider: prefer,
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
          ? "Intenta de nuevo en unos segundos."
          : "Please try again in a few seconds.",
        variant: "destructive",
      });
    } catch (err) {
      console.error("DJEDITS checkout error:", err);
      trackEvent("checkout_redirect", {
        cta_id: ctaId, plan_id: "djedits", provider: prefer,
        status: "error", funnel_step: "checkout_handoff", is_retry: isRetry,
        error_message: err instanceof Error ? err.message : String(err),
      });
      setCheckoutError(
        isSpanish
          ? "Hubo un problema al iniciar el pago. Reintenta."
          : "There was a problem starting checkout. Try again."
      );
      toast({
        title: "Error",
        description: isSpanish
          ? "Hubo un problema al iniciar el pago."
          : "There was a problem starting checkout.",
        variant: "destructive",
      });
    } finally {
      if (!redirected) setIsSubmitting(false);
    }
  }, [isSubmitting, isSpanish, toast, trackEvent]);

  const retryCheckout = useCallback(() => {
    if (!lastAttempt) return;
    void startCheckout(lastAttempt.prefer, lastAttempt.ctaId, true);
  }, [lastAttempt, startCheckout]);

  const renderCheckoutFeedback = useCallback(
    (ctaPrefix: string) => {
      const activeCtaId = lastAttempt?.ctaId || "";
      const isActive = activeCtaId.startsWith(ctaPrefix);
      if (!isActive) return null;
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

  /* ─── render ─── */
  return (
    <main className="min-h-screen bg-[#070707] text-[#EFEFEF]">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#1a1a1a] via-[#AA0202] to-[#1a1a1a]" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-10 md:pb-20 md:pt-14">
          <div className="flex items-center justify-between gap-4">
            <img src={logoWhite} alt="VideoRemixesPack" className="h-10 w-auto object-contain md:h-12" />
            <p className="text-xs text-zinc-500 md:text-sm">soporte@videoremixpack.com</p>
          </div>

          <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-start">
            {/* Left – copy */}
            <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10">
              <Badge className="border-[#AA0202]/40 bg-[#AA0202]/15 px-3 py-1 font-bebas text-xs uppercase tracking-widest text-[#EFEFEF]">
                CURSO
              </Badge>
              <h1 className="mt-5 font-bebas text-4xl uppercase leading-[0.92] md:text-5xl">
                {isSpanish ? (
                  <>CÓMO HACER TUS PROPIOS <span className="text-[#AA0202]">DJ EDITS</span></>
                ) : (
                  <>HOW TO MAKE YOUR OWN <span className="text-[#AA0202]">DJ EDITS</span></>
                )}
              </h1>
              <p className="mt-6 font-sans text-sm text-zinc-400 md:text-base">
                {isSpanish
                  ? "Aprende paso a paso a crear tus primeros DJ edits y adapta canciones a tu estilo y tus sets."
                  : "Learn step by step how to create your first DJ edits and adapt songs to your style."}
              </p>
              <p className="mt-4 font-sans text-sm text-zinc-400 md:text-base">
                {isSpanish
                  ? "Un curso exclusivo, claro y sin tecnicismos para que logres resultados reales desde el PRIMER DÍA."
                  : "An exclusive, clear course with no jargon for real results from DAY ONE."}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => void startCheckout("stripe", "djedits_hero_stripe")}
                  disabled={isSubmitting}
                  className="btn-primary-glow min-h-[56px] flex-1 font-bebas text-xl uppercase tracking-wide">
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{isSpanish ? "CARGANDO..." : "LOADING..."}</>
                  ) : (
                    <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "EMPEZAR AHORA" : "START NOW"}<ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
                <Button variant="outline"
                  onClick={() => void startCheckout("paypal", "djedits_hero_paypal")}
                  disabled={isSubmitting}
                  className="min-h-[56px] flex-1 border-[#5E5E5E] bg-transparent font-bebas text-xl uppercase tracking-wide text-[#EFEFEF] hover:bg-[#111111]">
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{isSpanish ? "CARGANDO..." : "LOADING..."}</>
                  ) : (
                    <><CreditCard className="mr-2 h-5 w-5 text-[#AA0202]" />{isSpanish ? "PAYPAL" : "PAYPAL"}</>
                  )}
                </Button>
                <Button variant="outline"
                  className="min-h-[56px] flex-1 border-[#5E5E5E] bg-transparent font-bebas text-xl uppercase tracking-wide text-[#EFEFEF] hover:bg-[#111111]"
                  onClick={() => navigate("/")}>
                  <Headphones className="mr-2 h-5 w-5 text-[#AA0202]" />
                  VER VRP
                </Button>
              </div>

              {renderCheckoutFeedback("djedits_hero")}

              <p className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
                <Lock className="h-4 w-4 text-[#AA0202]" />
                {isSpanish ? "Tu información está 100% segura" : "Your info is 100% secure"}
              </p>
            </article>

            {/* Right – video + inclusions */}
            <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10">
              <p className="font-sans text-sm font-semibold text-zinc-400">
                {isSpanish
                  ? "¡Hola! Soy DJ NACH y te doy la bienvenida al curso de DJ Edits."
                  : "Hi! I'm DJ NACH and welcome to the DJ Edits course."}
              </p>

              <div className="mt-6 overflow-hidden rounded-2xl border border-[#5E5E5E] bg-black">
                <div className="aspect-video">
                  <HlsVideo src={PREVIEW_HLS_URL} poster={djEditsPoster} className="h-full w-full object-cover" />
                </div>
              </div>

              <div className="mt-8 grid gap-3">
                <div className="rounded-xl border border-[#5E5E5E] bg-[#070707] p-4">
                  <p className="font-bebas text-lg uppercase tracking-wide text-[#EFEFEF]">{isSpanish ? "QUÉ INCLUYE:" : "WHAT'S INCLUDED:"}</p>
                  <ul className="mt-3 space-y-2 font-sans text-sm text-zinc-400">
                    {[
                      isSpanish ? "Acceso instantáneo a todas las lecciones." : "Instant access to all lessons.",
                      isSpanish ? "Aprende a transformar una canción para cabina." : "Learn to transform songs for the booth.",
                      isSpanish ? "Domina el flujo completo desde la idea hasta el track listo." : "Master the full flow from idea to finished track.",
                      isSpanish ? "Crea tus primeros DJ edits desde cero." : "Create your first DJ edits from scratch.",
                      isSpanish ? "Explicaciones simples, sin tecnicismos." : "Simple explanations, no jargon.",
                      isSpanish ? "Resultados reales desde el primer día." : "Real results from day one.",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#AA0202]" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-[#5E5E5E] bg-[#070707] p-4">
                  <p className="font-bebas text-lg uppercase tracking-wide text-[#EFEFEF]">{isSpanish ? "QUÉ NO INCLUYE:" : "WHAT'S NOT INCLUDED:"}</p>
                  <ul className="mt-3 space-y-2 font-sans text-sm text-zinc-400">
                    {[
                      isSpanish ? "No necesitas experiencia previa." : "No prior experience required.",
                      isSpanish ? "No requieres equipo profesional ni software costoso." : "No pro gear or expensive software needed.",
                      isSpanish ? "No es teoría aburrida: todo es práctico." : "No boring theory: everything is hands-on.",
                      isSpanish ? "No pierdes tiempo con relleno." : "No time wasted on filler.",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <BadgeCheck className="mt-0.5 h-5 w-5 text-[#AA0202]" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── Learn ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10">
            <h2 className="font-bebas text-4xl uppercase leading-[0.92] md:text-5xl">
              {isSpanish ? (
                <>¿QUÉ <span className="text-[#AA0202]">APRENDERÁS</span>?</>
              ) : (
                <>WHAT WILL YOU <span className="text-[#AA0202]">LEARN</span>?</>
              )}
            </h2>
            <p className="mt-5 font-sans text-sm text-zinc-400 md:text-base">
              {isSpanish
                ? "En este curso aprenderás a crear distintos tipos de DJ edits, para que tus sesiones sean mucho más fluidas, creativas y profesionales."
                : "In this course you'll learn to create different types of DJ edits for more fluid, creative and professional sets."}
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { title: isSpanish ? "FLUJO COMPLETO" : "FULL FLOW", body: isSpanish ? "Desde la idea hasta el track listo para mezclar." : "From idea to mix-ready track." },
                { title: isSpanish ? "CLUB READY" : "CLUB READY", body: isSpanish ? "Optimiza el sonido para entornos de club." : "Optimize sound for club environments." },
                { title: isSpanish ? "SIN TECNICISMOS" : "NO JARGON", body: isSpanish ? "Explicaciones simples y prácticas." : "Simple, practical explanations." },
              ].map((c) => (
                <div key={c.title} className="rounded-2xl border border-[#5E5E5E] bg-[#070707] p-6">
                  <p className="font-bebas text-2xl uppercase">{c.title}</p>
                  <p className="mt-3 font-sans text-sm text-zinc-400">{c.body}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {/* ── Price / CTA ── */}
      <section className="pb-20 pt-6 md:pb-28">
        <div className="container mx-auto max-w-4xl px-4">
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10 text-center">
            <p className="font-bebas text-4xl uppercase">
              {isSpanish ? "EMPIEZA " : "START "}<span className="text-[#AA0202]">{isSpanish ? "AHORA" : "NOW"}</span>!
            </p>
            <p className="mt-3 font-bebas text-2xl uppercase text-[#AA0202]">
              {isSpanish ? "PAGO ÚNICO" : "ONE-TIME PAYMENT"} 70 USD
            </p>
            <p className="mt-3 font-sans text-sm font-semibold text-zinc-400">
              {isSpanish ? "*Oferta Por Tiempo Limitado*" : "*Limited Time Offer*"}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3">
              <div className="grid w-full max-w-md gap-3 sm:grid-cols-2">
                <Button onClick={() => void startCheckout("stripe", "djedits_pricing_stripe")}
                  disabled={isSubmitting}
                  className="btn-primary-glow min-h-[56px] w-full font-bebas text-xl uppercase tracking-wide">
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{isSpanish ? "CARGANDO..." : "LOADING..."}</>
                  ) : (
                    <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "COMPRAR AHORA" : "BUY NOW"}<ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
                <Button variant="outline"
                  onClick={() => void startCheckout("paypal", "djedits_pricing_paypal")}
                  disabled={isSubmitting}
                  className="min-h-[56px] w-full border-[#5E5E5E] bg-transparent font-bebas text-xl uppercase tracking-wide text-[#EFEFEF] hover:bg-[#111111]">
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{isSpanish ? "CARGANDO..." : "LOADING..."}</>
                  ) : (
                    <><CreditCard className="mr-2 h-5 w-5 text-[#AA0202]" />PAYPAL</>
                  )}
                </Button>
              </div>

              {renderCheckoutFeedback("djedits_pricing")}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {["VISA", "MASTERCARD", "AMEX", "PayPal"].map((l) => (
                  <span key={l} className="rounded-full border border-[#5E5E5E] bg-[#111111]/50 px-3 py-1 text-[10px] font-semibold text-zinc-500">{l}</span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-green-400" />
              <p className="font-sans text-xs text-green-300/70">
                {isSpanish ? "Pago 100% seguro" : "100% secure payment"}
              </p>
            </div>

            <p className="mt-8 font-sans text-xs text-zinc-600">
              VideoRemixesPack © {new Date().getFullYear()}. {isSpanish ? "Derechos Reservados" : "All Rights Reserved"}
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
