import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  CreditCard,
  Headphones,
  Loader2,
  Lock,
  Sparkles,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
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
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";
import { createStripeCheckoutUrl } from "@/lib/checkout";

type PlanId = "plan_1tb_mensual" | "plan_2tb_anual";

const PLAN_DETAILS: Record<
  PlanId,
  {
    label: string;
    priceLabel: string;
    tags: string[];
  }
> = {
  plan_1tb_mensual: {
    label: "Plan PRO DJ mensual",
    priceLabel: "$35USD/m",
    tags: ["membresia", "plan_1tb_mensual"],
  },
  plan_2tb_anual: {
    label: "Plan 2 TB / Mes \u2013 195 Anual",
    priceLabel: "$195USD/a",
    tags: ["membresia", "plan_2tb_anual"],
  },
};

export default function Membresia() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<{
    ctaId: string;
    plan: PlanId;
  } | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<PlanId>("plan_2tb_anual");

  const pricingLayoutAssignment = useMemo(
    () =>
      isExperimentEnabled("pricing_layout")
        ? getExperimentAssignment("pricing_layout")
        : {
            id: "pricing_layout" as const,
            variant: "A" as const,
            assignedAt: new Date(0).toISOString(),
          },
    []
  );

  const experimentAssignments = useMemo(
    () => [pricingLayoutAssignment],
    [pricingLayoutAssignment]
  );

  const useStackedPricingLayout = pricingLayoutAssignment.variant === "A";

  const paymentBadges = useMemo(
    () => ["VISA", "MASTERCARD", "AMEX", "DISCOVER"],
    []
  );

  useEffect(() => {
    document.title =
      "La Membresía DJ Latina #1 | Audio, Video y Karaoke lista para mezclar";
  }, []);

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
          language === "es"
            ? "No pudimos abrir el checkout. Reintenta; si continúa, cambia de red o desactiva tu bloqueador de anuncios."
            : "We couldn't open checkout. Try again; if it continues, switch networks or disable your ad blocker."
        );

        toast({
          title: language === "es" ? "Checkout no disponible" : "Checkout unavailable",
          description:
            language === "es"
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
          language === "es"
            ? "Hubo un problema al iniciar el pago. Reintenta; si continúa, cambia de red o desactiva tu bloqueador de anuncios."
            : "There was a problem starting checkout. Try again; if it continues, switch networks or disable your ad blocker."
        );
        toast({
          title: language === "es" ? "Error" : "Error",
          description:
            language === "es"
              ? "Hubo un problema al iniciar el pago. Intenta de nuevo."
              : "There was a problem starting checkout. Please try again.",
          variant: "destructive",
        });
      } finally {
        if (!redirected) setIsSubmitting(false);
      }
    },
    [experimentAssignments, isSubmitting, language, selectedPlan, toast, trackEvent]
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
          <p className="mt-3 text-xs text-muted-foreground">
            {language === "es" ? "Redirigiendo a checkout seguro..." : "Redirecting to secure checkout..."}
          </p>
        );
      }

      if (!checkoutError) return null;

      return (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>{language === "es" ? "No se pudo abrir el checkout" : "Checkout failed"}</AlertTitle>
          <AlertDescription>
            <p>{checkoutError}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-10 border-destructive/40"
                onClick={retryCheckout}
                disabled={isSubmitting}
              >
                {language === "es" ? "Reintentar" : "Try again"}
              </Button>
              <Button asChild type="button" variant="ghost" className="h-10" disabled={isSubmitting}>
                <Link to="/help">{language === "es" ? "Contactar soporte" : "Contact support"}</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    },
    [checkoutError, isSubmitting, language, lastAttempt?.ctaId, retryCheckout]
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

  return (
    <main className="brand-frame min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#1a1a1a] via-[#AA0202] to-[#1a1a1a]" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-10 md:pb-20 md:pt-14">
          <div className="flex items-center justify-between gap-4">
            <img
              src={theme === "dark" ? logoWhite : logoDark}
              alt="VideoRemixesPack"
              className="h-10 w-auto object-contain md:h-12"
            />
            <p className="text-xs text-muted-foreground md:text-sm">
              soporte@videoremixpack.com
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
                  "Soporte en español por WhatsApp",
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
	                <div className="grid gap-3">
	                  <Button
	                    className="btn-primary-glow h-12 text-base font-black"
	                    disabled={isSubmitting}
	                    onClick={() => void openJoin(selectedPlan, "membresia_hero_adquiere")}
	                  >
	                    {isSubmitting && lastAttempt?.ctaId === "membresia_hero_adquiere" ? (
	                      <>
	                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                        {language === "es" ? "Cargando checkout seguro..." : "Loading secure checkout..."}
	                      </>
	                    ) : (
	                      <>
	                        <Zap className="mr-2 h-5 w-5" />
	                        {language === "es" ? "Pagar con tarjeta" : "Pay with card"}
	                      </>
	                    )}
	                  </Button>

                    {renderCheckoutFeedback("membresia_hero_adquiere")}
	                </div>
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
	              <div className="grid w-full max-w-2xl gap-3">
	                <Button
	                  onClick={() => void openJoin(selectedPlan, "membresia_socialproof_adquiere")}
	                  disabled={isSubmitting}
	                  className="btn-primary-glow h-12 w-full text-base font-black md:h-14 md:text-lg"
	                >
	                  {isSubmitting && lastAttempt?.ctaId === "membresia_socialproof_adquiere" ? (
	                    <>
	                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                      {language === "es" ? "Cargando checkout seguro..." : "Loading secure checkout..."}
	                    </>
	                  ) : (
	                    language === "es" ? "Tarjeta" : "Card"
	                  )}
	                </Button>
	              </div>
	            </div>
              <div className="mt-4 flex justify-center">
                <div className="w-full max-w-2xl">
                  {renderCheckoutFeedback("membresia_socialproof_adquiere")}
                </div>
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
            <p className="mt-3 text-sm text-muted-foreground">
              {useStackedPricingLayout
                ? "Vista simple para decidir más rápido."
                : "Vista comparativa para elegir con más contexto."}
            </p>
          </div>

          <div
            className={cn(
              "mt-10 grid gap-6",
              useStackedPricingLayout ? "mx-auto max-w-3xl grid-cols-1" : "md:grid-cols-2"
            )}
          >
            {/* Plan 1TB */}
            <div
              className={cn(
                "glass-card p-8 md:p-10",
                useStackedPricingLayout ? "order-2" : "order-none"
              )}
            >
              <p className="font-display text-3xl font-black">
                {PLAN_DETAILS.plan_1tb_mensual.label}
              </p>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                {PLAN_DETAILS.plan_1tb_mensual.priceLabel}
              </p>

	              <ul className="mt-6 space-y-3 text-sm text-muted-foreground md:text-base">
	                {[
	                  "1000 GB cada mes",
	                  "trial 7 días $0 (tarjeta)",
	                  "Acceso completo a remixes exclusivos",
	                  "Soporte VIP",
	                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

		              <div className="mt-8 grid gap-3">
		                <Button
		                  onClick={() => handlePlanClick("plan_1tb_mensual", "membresia_plan_1tb")}
		                  disabled={isSubmitting}
		                  className="btn-primary-glow h-12 w-full text-base font-black"
		                >
		                  {isSubmitting && lastAttempt?.ctaId === "membresia_plan_1tb" ? (
		                    <>
		                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
		                      {language === "es" ? "Cargando checkout seguro..." : "Loading secure checkout..."}
		                    </>
		                  ) : (
		                    language === "es" ? "Tarjeta" : "Card"
		                  )}
		                </Button>
		              </div>

                  {renderCheckoutFeedback("membresia_plan_1tb")}
	            </div>

            {/* Plan 2TB */}
            <div
              className={cn(
                "glass-card p-8 md:p-10",
                useStackedPricingLayout ? "order-1 ring-1 ring-primary/30" : "order-none"
              )}
            >
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
	                  "2000 GB cada mes",
	                  "trial 7 días $0 (tarjeta)",
	                  "Acceso completo a remixes exclusivos",
	                  "Soporte VIP",
	                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

		              <div className="mt-8 grid gap-3">
		                <Button
		                  onClick={() => handlePlanClick("plan_2tb_anual", "membresia_plan_2tb")}
		                  disabled={isSubmitting}
		                  className="btn-primary-glow h-12 w-full text-base font-black"
		                >
		                  {isSubmitting && lastAttempt?.ctaId === "membresia_plan_2tb" ? (
		                    <>
		                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
		                      {language === "es" ? "Cargando checkout seguro..." : "Loading secure checkout..."}
		                    </>
		                  ) : (
		                    language === "es" ? "Tarjeta" : "Card"
		                  )}
		                </Button>
		              </div>

                  {renderCheckoutFeedback("membresia_plan_2tb")}
	
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
	            <div className="grid w-full max-w-2xl gap-3">
	              <Button
	                onClick={() => void openJoin(selectedPlan, "membresia_faq_adquiere")}
	                disabled={isSubmitting}
	                className="btn-primary-glow h-12 w-full text-base font-black md:h-14 md:text-lg"
	              >
	                {isSubmitting && lastAttempt?.ctaId === "membresia_faq_adquiere" ? (
	                  <>
	                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                    {language === "es" ? "Cargando checkout seguro..." : "Loading secure checkout..."}
	                  </>
	                ) : (
	                  language === "es" ? "Tarjeta" : "Card"
	                )}
	              </Button>
	            </div>
	          </div>
            <div className="mt-4 flex justify-center">
              <div className="w-full max-w-2xl">
                {renderCheckoutFeedback("membresia_faq_adquiere")}
              </div>
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
    </main>
  );
}
