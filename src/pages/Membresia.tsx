import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import { isExperimentEnabled } from "@/lib/croFlags";
import { getExperimentAssignment } from "@/lib/experiments";
import { cn } from "@/lib/utils";
import logoWhite from "@/assets/logo-white.webp";
import { createStripeCheckoutUrl } from "@/lib/checkout";

type PlanId = "plan_1tb_mensual" | "plan_1tb_trimestral" | "plan_2tb_anual";

const PLAN_DETAILS: Record<
  PlanId,
  { label: string; priceLabel: string; tags: string[] }
> = {
  plan_1tb_mensual: {
    label: "Plan PRO DJ mensual",
    priceLabel: "$35 USD/mes",
    tags: ["membresia", "plan_1tb_mensual"],
  },
  plan_1tb_trimestral: {
    label: "Plan PRO DJ trimestral",
    priceLabel: "$90 USD/3 meses",
    tags: ["membresia", "plan_1tb_trimestral"],
  },
  plan_2tb_anual: {
    label: "Plan 2 TB / Mes – 195 Anual",
    priceLabel: "$195 USD/año",
    tags: ["membresia", "plan_2tb_anual"],
  },
};

export default function Membresia() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const [searchParams] = useSearchParams();
  const isSpanish = language === "es";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<{ ctaId: string; plan: PlanId } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("plan_2tb_anual");

  const pricingLayoutAssignment = useMemo(
    () =>
      isExperimentEnabled("pricing_layout")
        ? getExperimentAssignment("pricing_layout")
        : { id: "pricing_layout" as const, variant: "A" as const, assignedAt: new Date(0).toISOString() },
    []
  );

  const experimentAssignments = useMemo(() => [pricingLayoutAssignment], [pricingLayoutAssignment]);
  const useStackedPricingLayout = pricingLayoutAssignment.variant === "A";

  const testimonials = useMemo(
    () => [
      { id: "m1", text: "Nunca había encontrado un pool con tanta variedad de música latina. Me ahorra horas de búsqueda." },
      { id: "m2", text: "Descargar por carpetas y FileZilla es una bendición. Todo más ordenado para mis eventos." },
      { id: "m3", text: "Soporte en español rápido. Los remixes exclusivos están duros." },
      { id: "m4", text: "Me suscribí hace 6 meses y ya tengo una biblioteca monstruosa. Mejor inversión." },
      { id: "m5", text: "Antes pagaba 3 pools distintos. Ahora pago uno solo y tiene más contenido." },
      { id: "m6", text: "La descarga masiva por FTP es increíble. Descargo mientras duermo." },
      { id: "m7", text: "Calidad 320kbps en todo. Sin logos, sin marcas de agua. Profesional de verdad." },
      { id: "m8", text: "El trial de 7 días me convenció. Ahora soy anual y no me arrepiento." },
      { id: "m9", text: "Lo mejor es que actualizan cada semana con lo más nuevo. Siempre estoy al día." },
    ],
    []
  );

  useEffect(() => {
    document.title = isSpanish
      ? "La Membresía DJ Latina #1 | Audio, Video y Karaoke lista para mezclar"
      : "The #1 Latino DJ Membership | Audio, Video & Karaoke ready to mix";
  }, [isSpanish]);

  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan === "plan_1tb_mensual" || plan === "plan_1tb_trimestral" || plan === "plan_2tb_anual") {
      setSelectedPlan(plan);
    }
  }, [searchParams]);

  useEffect(() => {
    trackEvent("experiment_exposure", {
      funnel_step: "pricing",
      experiment_assignments: experimentAssignments,
    });
    trackEvent("funnel_step_view", {
      funnel_step: "pricing",
      experiment_assignments: experimentAssignments,
    });
  }, [experimentAssignments, trackEvent]);

  /* ─── checkout ─── */
  const openJoin = useCallback(
    async (plan?: PlanId, sourceCta: string = "membresia_open_join", isRetry = false) => {
      const nextPlan = plan || selectedPlan;
      if (isSubmitting) return;
      if (plan) setSelectedPlan(plan);

      setIsSubmitting(true);
      setCheckoutError(null);
      setLastAttempt({ ctaId: sourceCta, plan: nextPlan });
      trackEvent("checkout_redirect", {
        cta_id: sourceCta,
        plan_id: nextPlan,
        funnel_step: "checkout_handoff",
        experiment_assignments: experimentAssignments,
        provider: "stripe",
        status: "starting",
        is_retry: isRetry,
      });

      let redirected = false;
      try {
        const leadId = crypto.randomUUID();
        const url = await createStripeCheckoutUrl({
          leadId,
          product: nextPlan,
          sourcePage: window.location.pathname,
        });

        if (url) {
          redirected = true;
          trackEvent("checkout_redirect", {
            cta_id: sourceCta,
            plan_id: nextPlan,
            funnel_step: "checkout_handoff",
            experiment_assignments: experimentAssignments,
            provider: "stripe",
            status: "redirected",
            is_retry: isRetry,
            lead_id: leadId,
          });
          window.location.assign(url);
          return;
        }

        trackEvent("checkout_redirect", {
          cta_id: sourceCta,
          plan_id: nextPlan,
          funnel_step: "checkout_handoff",
          experiment_assignments: experimentAssignments,
          provider: "stripe",
          status: "missing_url",
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
        console.error("MEMBRESIA checkout error:", err);
        trackEvent("checkout_redirect", {
          cta_id: sourceCta,
          plan_id: nextPlan,
          funnel_step: "checkout_handoff",
          experiment_assignments: experimentAssignments,
          provider: "stripe",
          status: "error",
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
    [experimentAssignments, isSubmitting, isSpanish, selectedPlan, toast, trackEvent]
  );

  const retryCheckout = useCallback(() => {
    if (!lastAttempt) return;
    void openJoin(lastAttempt.plan, lastAttempt.ctaId, true);
  }, [lastAttempt, openJoin]);

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
              <Button asChild type="button" variant="ghost" className="h-10" disabled={isSubmitting}>
                <Link to="/help">{isSpanish ? "Contactar soporte" : "Contact support"}</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    },
    [checkoutError, isSubmitting, isSpanish, lastAttempt?.ctaId, retryCheckout]
  );

  const handlePlanClick = useCallback(
    (plan: PlanId, ctaId: string) => {
      trackEvent("plan_click", {
        cta_id: ctaId,
        plan_id: plan,
        funnel_step: "pricing",
        experiment_assignments: experimentAssignments,
      });
      void openJoin(plan, ctaId);
    },
    [experimentAssignments, openJoin, trackEvent]
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

          <div className="mt-12 grid gap-10 md:grid-cols-2 md:items-start">
            <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10">
              <h1 className="font-bebas text-4xl uppercase leading-[0.92] md:text-5xl">
                {isSpanish
                  ? <>La <span className="text-[#AA0202]">Membresía DJ Latina</span> #1</>
                  : <>The #1 <span className="text-[#AA0202]">Latino DJ Membership</span></>}
              </h1>
              <p className="mt-4 font-bebas text-2xl uppercase leading-[0.95] md:text-3xl">
                {isSpanish
                  ? "música organizada, actualizada y lista para romper la pista."
                  : "organized, updated music ready to rock the floor."}
              </p>

              <p className="mt-6 text-sm text-zinc-400 md:text-base">
                {isSpanish
                  ? "Descarga +50,000 canciones latinas y regionales en calidad profesional. Música 100% organizada por género."
                  : "Download +50,000 Latin & regional songs in pro quality. 100% genre-organized music."}
              </p>

              {/* Value anchoring */}
              <div className="mt-5 flex items-center gap-3">
                <span className="text-sm text-zinc-400 line-through decoration-[#AA0202] decoration-2">
                  {isSpanish ? "$500+/mes en pools separados" : "$500+/mo in separate pools"}
                </span>
                <Badge className="border-[#AA0202]/50 bg-[#AA0202]/15 px-2 py-0.5 text-[10px] font-bold text-[#ff6b6b]">
                  {isSpanish ? "AHORRA 90%+" : "SAVE 90%+"}
                </Badge>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-zinc-400 md:text-base">
                {[
                  isSpanish ? "Descarga por carpetas, sin perder tiempo" : "Download by folders, no wasted time",
                  isSpanish ? "Escucha todos los demos antes de suscribirte" : "Listen to all demos before subscribing",
                  isSpanish ? "Actualización semanal con los últimos éxitos" : "Weekly updates with the latest hits",
                  isSpanish ? "Compatible con Serato, Rekordbox y VirtualDJ" : "Compatible with Serato, Rekordbox & VirtualDJ",
                  isSpanish ? "Soporte en español por WhatsApp" : "Spanish support via WhatsApp",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#AA0202]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Button asChild className="btn-primary-glow h-12 font-bebas text-xl uppercase tracking-wide">
                  <Link to="/explorer">
                    <Headphones className="mr-2 h-5 w-5" />
                    {isSpanish ? "Escuchar demos" : "Listen to demos"}
                  </Link>
                </Button>
                <div className="grid gap-3">
                  <Button className="btn-primary-glow h-12 font-bebas text-xl uppercase tracking-wide" disabled={isSubmitting}
                    onClick={() => void openJoin(selectedPlan, "membresia_hero_adquiere")}>
                    {isSubmitting && lastAttempt?.ctaId === "membresia_hero_adquiere" ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
                    ) : (
                      <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "Suscribirme ahora" : "Subscribe now"}<ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                  {renderCheckoutFeedback("membresia_hero_adquiere")}
                </div>
              </div>

              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
                <Lock className="h-4 w-4 text-[#AA0202]" />
                {isSpanish ? "Tu información está 100% segura" : "Your info is 100% secure"}
              </p>
            </article>

            <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10">
              <p className="text-sm font-semibold text-zinc-400">
                {isSpanish ? "🎧 Todo lo que un DJ latino necesita, en un solo lugar" : "🎧 Everything a Latino DJ needs, in one place"}
              </p>
              <p className="mt-4 text-sm text-zinc-400 md:text-base">
                {isSpanish
                  ? "¿Cansado de perder horas buscando música en diferentes fuentes? Olvídate de descargar track por track o pagar varias suscripciones."
                  : "Tired of spending hours searching for music across different sources? Forget downloading track by track or paying multiple subscriptions."}
              </p>

              <div className="mt-8 space-y-3 text-sm text-zinc-400 md:text-base">
                {[
                  isSpanish ? "+50,000 canciones en MP3 320kbps & MP4 HD" : "+50,000 songs in MP3 320kbps & MP4 HD",
                  isSpanish ? "Descarga por carpetas completas o FileZilla ultrarrápido" : "Download by full folders or ultra-fast FileZilla",
                  isSpanish ? "Géneros: Reggaetón, Salsa, Cumbia, Regional, Pop Latino y más" : "Genres: Reggaeton, Salsa, Cumbia, Regional, Latin Pop & more",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#AA0202]" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Button asChild className="btn-primary-glow h-12 w-full font-bebas text-xl uppercase tracking-wide">
                  <Link to="/explorer">
                    <Headphones className="mr-2 h-5 w-5" />
                    {isSpanish ? "Escuchar demos" : "Listen to demos"}
                  </Link>
                </Button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── Social proof (3×3 grid) ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6 md:p-8">
            <Badge className="border-[#AA0202]/40 bg-[#AA0202]/15 px-3 py-1 text-[11px] font-bold text-yellow-300">
              <Star className="mr-1.5 h-3 w-3 fill-yellow-400 text-yellow-400" />
              {isSpanish ? "+4,800 DJs CONFÍAN EN NOSOTROS" : "+4,800 DJs TRUST US"}
            </Badge>
            <h2 className="mt-3 font-bebas text-3xl uppercase leading-tight md:text-4xl">
              {isSpanish ? "DJs reales. Resultados reales." : "Real DJs. Real results."}
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {testimonials.map((t) => (
                <div key={t.id} className="rounded-xl border border-[#5E5E5E] bg-[#070707] p-4">
                  <p className="text-sm text-[#EFEFEF]">{t.text}</p>
                  <p className="mt-2 text-right text-[10px] text-zinc-500">✓✓</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-zinc-500">
              {isSpanish ? "Mensajes reales de DJs. Sin inventos." : "Real DJ messages. No fakes."}
            </p>

            <div className="mt-6 flex justify-center">
              <Button onClick={() => void openJoin(selectedPlan, "membresia_socialproof_adquiere")}
                disabled={isSubmitting}
                className="btn-primary-glow h-12 w-full max-w-2xl font-bebas text-xl uppercase tracking-wide md:h-14 md:text-lg">
                {isSubmitting && lastAttempt?.ctaId === "membresia_socialproof_adquiere" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
                ) : (
                  <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "Suscribirme ahora" : "Subscribe now"}<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
            {renderCheckoutFeedback("membresia_socialproof_adquiere")}
          </article>
        </div>
      </section>

      {/* ── Plans ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="font-bebas text-3xl uppercase leading-tight md:text-4xl">
              {isSpanish
                ? <>Escoge el plan que <span className="text-[#AA0202]">mejor</span> se adapte a tus necesidades</>
                : <>Choose the plan that <span className="text-[#AA0202]">best</span> fits your needs</>}
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              {useStackedPricingLayout
                ? (isSpanish ? "Vista simple para decidir más rápido." : "Simple view for faster decisions.")
                : (isSpanish ? "Vista comparativa para elegir con más contexto." : "Comparative view for more context.")}
            </p>
          </div>

          <div className={cn("mt-10 grid gap-6", useStackedPricingLayout ? "mx-auto max-w-3xl grid-cols-1" : "md:grid-cols-3")}>

            {/* Plan 1TB */}
            <article className={cn("rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10", useStackedPricingLayout ? "order-3" : "order-none")}>
              <p className="font-bebas text-2xl uppercase">{PLAN_DETAILS.plan_1tb_mensual.label}</p>
              <p className="mt-2 text-sm font-semibold text-zinc-400">{PLAN_DETAILS.plan_1tb_mensual.priceLabel}</p>
              <ul className="mt-6 space-y-3 text-sm text-zinc-400 md:text-base">
                {[
                  isSpanish ? "1000 GB cada mes" : "1000 GB per month",
                  isSpanish ? "Trial 7 días $0 (tarjeta)" : "7-day trial $0 (card)",
                  isSpanish ? "Acceso completo a remixes exclusivos" : "Full access to exclusive remixes",
                  "Soporte VIP",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#AA0202]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button onClick={() => handlePlanClick("plan_1tb_mensual", "membresia_plan_1tb")}
                  disabled={isSubmitting} className="btn-primary-glow h-12 w-full font-bebas text-xl uppercase tracking-wide">
                  {isSubmitting && lastAttempt?.ctaId === "membresia_plan_1tb" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
                  ) : (
                    <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "Suscribirme" : "Subscribe"}<ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </div>
              {renderCheckoutFeedback("membresia_plan_1tb")}
            </article>

            {/* Plan Trimestral */}
            <article className={cn("rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10", useStackedPricingLayout ? "order-2" : "order-none")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-bebas text-2xl uppercase">{PLAN_DETAILS.plan_1tb_trimestral.label}</p>
                <Badge className="border-[#AA0202]/40 bg-[#AA0202]/15 px-2 py-0.5 text-[10px] font-bold text-[#ff6b6b]">
                  {isSpanish ? "Menos fricción" : "Less friction"}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-semibold text-zinc-400">{PLAN_DETAILS.plan_1tb_trimestral.priceLabel}</p>
              <p className="mt-2 text-sm font-semibold text-[#AA0202]">
                {isSpanish ? "Equivale a $30 / mes" : "Equals $30 / month"}
              </p>
              <ul className="mt-6 space-y-3 text-sm text-zinc-400 md:text-base">
                {[
                  isSpanish ? "1000 GB cada mes" : "1000 GB per month",
                  isSpanish ? "Trial 7 días $0 (tarjeta)" : "7-day trial $0 (card)",
                  isSpanish ? "Pago cada 3 meses (renovación automática)" : "Payment every 3 months (auto-renew)",
                  isSpanish ? "Acceso completo a remixes exclusivos" : "Full access to exclusive remixes",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#AA0202]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button onClick={() => handlePlanClick("plan_1tb_trimestral", "membresia_plan_1tb_trimestral")}
                  disabled={isSubmitting} className="btn-primary-glow h-12 w-full font-bebas text-xl uppercase tracking-wide">
                  {isSubmitting && lastAttempt?.ctaId === "membresia_plan_1tb_trimestral" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
                  ) : (
                    <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "Suscribirme" : "Subscribe"}<ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </div>
              {renderCheckoutFeedback("membresia_plan_1tb_trimestral")}
            </article>

            {/* Plan 2TB (Recommended) */}
            <article className={cn(
              "rounded-2xl border bg-[#111111] p-8 md:p-10",
              useStackedPricingLayout
                ? "order-1 border-[#AA0202]/50 ring-1 ring-[#AA0202]/30 shadow-[0_0_30px_rgba(170,2,2,0.15)]"
                : "order-none border-[#5E5E5E]"
            )}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-bebas text-2xl uppercase">{PLAN_DETAILS.plan_2tb_anual.label}</p>
                <Badge className="border-[#AA0202]/40 bg-[#AA0202]/15 px-3 py-1 text-[11px] font-bold text-yellow-300">
                  <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {isSpanish ? "RECOMENDADO" : "RECOMMENDED"}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-semibold text-zinc-400">{PLAN_DETAILS.plan_2tb_anual.priceLabel}</p>
              <ul className="mt-6 space-y-3 text-sm text-zinc-400 md:text-base">
                {[
                  isSpanish ? "2000 GB cada mes" : "2000 GB per month",
                  isSpanish ? "Trial 7 días $0 (tarjeta)" : "7-day trial $0 (card)",
                  isSpanish ? "Acceso completo a remixes exclusivos" : "Full access to exclusive remixes",
                  "Soporte VIP",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#AA0202]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button onClick={() => handlePlanClick("plan_2tb_anual", "membresia_plan_2tb")}
                  disabled={isSubmitting} className="btn-primary-glow h-12 w-full font-bebas text-xl uppercase tracking-wide">
                  {isSubmitting && lastAttempt?.ctaId === "membresia_plan_2tb" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
                  ) : (
                    <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "Suscribirme ahora" : "Subscribe now"}<ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </div>
              {renderCheckoutFeedback("membresia_plan_2tb")}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {["VISA", "MASTERCARD", "AMEX"].map((label) => (
                  <span key={label} className="rounded-full border border-[#5E5E5E] bg-[#070707] px-3 py-1 text-[10px] font-semibold text-zinc-500">
                    {label}
                  </span>
                ))}
              </div>
            </article>
          </div>

          <div className="mt-10 flex justify-center">
            <Button asChild className="btn-primary-glow h-12 w-full max-w-2xl font-bebas text-xl uppercase tracking-wide md:h-14 md:text-lg">
              <Link to="/explorer">
                <Headphones className="mr-2 h-5 w-5" />
                {isSpanish ? "Escuchar demos primero" : "Listen to demos first"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center">
            <h2 className="font-bebas text-3xl uppercase leading-tight md:text-4xl">
              {isSpanish
                ? <><span className="text-[#AA0202]">Preguntas</span> Frecuentes</>
                : <>Frequently Asked <span className="text-[#AA0202]">Questions</span></>}
            </h2>
          </div>

          <div className="mt-10 rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>{isSpanish ? "¿Puedo cancelar cuando quiera?" : "Can I cancel anytime?"}</AccordionTrigger>
                <AccordionContent>{isSpanish ? "Sí, sin permanencia." : "Yes, no commitment."}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>{isSpanish ? "¿Puedo escuchar la música antes de pagar?" : "Can I listen before paying?"}</AccordionTrigger>
                <AccordionContent>
                  {isSpanish ? "Sí, puedes registrarte y escuchar los demos." : "Yes, you can register and listen to demos."}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>{isSpanish ? "¿Cómo descargo la música?" : "How do I download music?"}</AccordionTrigger>
                <AccordionContent>
                  {isSpanish ? "Puedes descargar por carpetas o usar FileZilla." : "You can download by folders or use FileZilla."}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>{isSpanish ? "¿Qué pasa si no encuentro una canción?" : "What if I can't find a song?"}</AccordionTrigger>
                <AccordionContent>
                  {isSpanish ? "Pide una edición personalizada y la creamos para ti." : "Request a custom edit and we'll create it for you."}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mt-10 flex justify-center">
            <Button onClick={() => void openJoin(selectedPlan, "membresia_faq_adquiere")}
              disabled={isSubmitting}
              className="btn-primary-glow h-12 w-full max-w-2xl font-bebas text-xl uppercase tracking-wide md:h-14 md:text-lg">
              {isSubmitting && lastAttempt?.ctaId === "membresia_faq_adquiere" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "Cargando..." : "Loading..."}</>
              ) : (
                <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "Suscribirme ahora" : "Subscribe now"}<ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
          {renderCheckoutFeedback("membresia_faq_adquiere")}
        </div>
      </section>

      {/* ── Footer ── */}
      <section className="pb-20 pt-6 md:pb-28">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {["VISA", "MASTERCARD", "AMEX"].map((l) => (
                <span key={l} className="rounded-full border border-[#5E5E5E] bg-[#111111]/50 px-3 py-1 text-[10px] font-semibold text-zinc-500">{l}</span>
              ))}
            </div>

            {/* Guarantee badge */}
            <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-green-400" />
              <p className="text-xs text-green-300/70">
                {isSpanish ? "7 días gratis • Cancela cuando quieras • Pago 100% seguro" : "7 free days • Cancel anytime • 100% secure payment"}
              </p>
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
