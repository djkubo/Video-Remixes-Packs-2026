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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useToast } from "@/hooks/use-toast";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";
import { createBestCheckoutUrl, type CheckoutProvider } from "@/lib/checkout";

export default function Anual() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<{ ctaId: string; prefer: CheckoutProvider } | null>(null);

  const paymentBadges = useMemo(
    () => ["VISA", "MASTERCARD", "AMEX", "DISCOVER", "PayPal"],
    []
  );

  useEffect(() => {
    document.title =
      "VideoRemixesPack. La mejor plataforma de música y video para profesionales de la música de habla hispana";
  }, []);

  const startExpressCheckout = useCallback(
    async (ctaId: string, prefer: CheckoutProvider, isRetry = false) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      setCheckoutError(null);
      setLastAttempt({ ctaId, prefer });

      trackEvent("checkout_redirect", {
        cta_id: ctaId,
        plan_id: "anual",
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
          product: "anual",
          sourcePage: window.location.pathname,
          prefer,
        });

        if (url) {
          redirected = true;
          trackEvent("checkout_redirect", {
            cta_id: ctaId,
            plan_id: "anual",
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
          plan_id: "anual",
          provider: prefer,
          status: "missing_url",
          funnel_step: "checkout_handoff",
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
        console.error("ANUAL checkout error:", err);
        trackEvent("checkout_redirect", {
          cta_id: ctaId,
          plan_id: "anual",
          provider: prefer,
          status: "error",
          funnel_step: "checkout_handoff",
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
    [isSubmitting, language, toast, trackEvent]
  );

  const openJoin = useCallback(
    (ctaId: string) => {
      void startExpressCheckout(ctaId, "stripe");
    },
    [startExpressCheckout]
  );

  const openJoinPayPal = useCallback(
    (ctaId: string) => {
      void startExpressCheckout(ctaId, "paypal");
    },
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
              <Button
                type="button"
                variant="ghost"
                className="h-10"
                onClick={() => navigate("/help")}
                disabled={isSubmitting}
              >
                {language === "es" ? "Contactar soporte" : "Contact support"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    },
    [checkoutError, isSubmitting, language, lastAttempt?.ctaId, navigate, retryCheckout]
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
              alt="VideoRemixesPack"
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
		                  onClick={() => openJoin("anual_hero_stripe")}
		                  disabled={isSubmitting}
		                  className="btn-primary-glow h-12 w-full text-base font-black md:h-14 md:text-lg"
		                >
		                  {isSubmitting && lastAttempt?.ctaId === "anual_hero_stripe" ? (
		                    <>
		                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
		                      {language === "es" ? "Cargando checkout seguro..." : "Loading secure checkout..."}
		                    </>
		                  ) : (
		                    <span className="flex w-full flex-col items-center leading-tight">
		                      <span>Acceder ahora</span>
		                      <span className="text-xs font-semibold opacity-90">
		                        Aprovecha el precio especial de $195 USD
		                      </span>
		                    </span>
		                  )}
		                </Button>
		                <Button
		                  onClick={() => openJoinPayPal("anual_hero_paypal")}
		                  disabled={isSubmitting}
		                  variant="outline"
		                  className="mt-3 h-12 w-full text-base font-black md:h-14 md:text-lg"
		                >
		                  {isSubmitting ? (
		                    <>
		                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
		                      {language === "es" ? "Cargando PayPal..." : "Loading PayPal..."}
		                    </>
		                  ) : (
		                    <>
		                      <CreditCard className="mr-2 h-4 w-4 text-primary" />
		                      {language === "es" ? "Pagar con PayPal" : "Pay with PayPal"}
		                    </>
		                  )}
		                </Button>

                    {renderCheckoutFeedback("anual_hero_stripe")}
                    {renderCheckoutFeedback("anual_hero_paypal")}
	
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
                En VideoRemixesPack tenemos más de 15 años de experiencia en la industria de la música. Y sabemos que
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
	                  onClick={() => openJoin("anual_offer_stripe")}
	                  disabled={isSubmitting}
	                  className="btn-primary-glow h-12 w-full text-base font-black md:h-14 md:text-lg"
	                >
	                  {isSubmitting && lastAttempt?.ctaId === "anual_offer_stripe" ? (
	                    <>
	                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                      {language === "es" ? "Cargando checkout seguro..." : "Loading secure checkout..."}
	                    </>
	                  ) : (
	                    <span className="flex w-full flex-col items-center leading-tight">
	                      <span>Quiero un año de música ilimitada</span>
	                      <span className="text-xs font-semibold opacity-90">
	                        Menos de $16.25 USD por mes
	                      </span>
	                    </span>
	                  )}
	                </Button>
                  {renderCheckoutFeedback("anual_offer_stripe")}
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
                "Creador de la Plataforma VideoRemixesPack",
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
              Esta asesoría por separado te costaría más de $500 USD Y la obtienes GRATIS al adquirir tu membresía anual VideoRemixesPack. Aprovecha la oferta hoy.
            </p>

	            <div className="mt-10 flex justify-center">
	              <Button
	                onClick={() => openJoin("anual_bonus_stripe")}
	                disabled={isSubmitting}
	                className="btn-primary-glow h-12 w-full max-w-2xl text-base font-black md:h-14 md:text-lg"
	              >
	                {isSubmitting && lastAttempt?.ctaId === "anual_bonus_stripe" ? (
	                  <>
	                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                    {language === "es" ? "Cargando checkout seguro..." : "Loading secure checkout..."}
	                  </>
	                ) : (
	                  <span className="flex w-full flex-col items-center leading-tight">
	                    <span>Sí, quiero música ilimitada por un año</span>
	                    <span className="text-xs font-semibold opacity-90">
	                      Quiero aprovechar el precio especial de $195 USD
	                    </span>
	                  </span>
	                )}
	              </Button>
	            </div>
              {renderCheckoutFeedback("anual_bonus_stripe")}
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
	              onClick={() => openJoin("anual_reviews_stripe")}
	              disabled={isSubmitting}
	              className="btn-primary-glow h-12 w-full max-w-2xl text-base font-black md:h-14 md:text-lg"
	            >
	              {isSubmitting && lastAttempt?.ctaId === "anual_reviews_stripe" ? (
	                <>
	                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                  {language === "es" ? "Cargando checkout seguro..." : "Loading secure checkout..."}
	                </>
	              ) : (
	                <span className="flex w-full flex-col items-center leading-tight">
	                  <span>Sí, quiero acceso a la membresía anual</span>
	                  <span className="text-xs font-semibold opacity-90">
	                    Quiero aprovechar el precio especial de $195 USD
	                  </span>
	                </span>
	              )}
	            </Button>
	          </div>
            {renderCheckoutFeedback("anual_reviews_stripe")}
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
                  DJ&apos;s que <span className="text-gradient-red">NO</span> usan VideoRemixesPack
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
                  DJ&apos;s que <span className="text-gradient-red">SÍ</span> usan VideoRemixesPack
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
	              onClick={() => openJoin("anual_faq_stripe")}
	              disabled={isSubmitting}
	              className="btn-primary-glow h-12 w-full max-w-2xl text-base font-black md:h-14 md:text-lg"
	            >
	              {isSubmitting && lastAttempt?.ctaId === "anual_faq_stripe" ? (
	                <>
	                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                  {language === "es" ? "Cargando checkout seguro..." : "Loading secure checkout..."}
	                </>
	              ) : (
	                <span className="flex w-full flex-col items-center leading-tight">
	                  <span>Acceder a la membresía anual</span>
	                  <span className="text-xs font-semibold opacity-90">
	                    Quiero aprovechar el precio especial de $195 USD
	                  </span>
	                </span>
	              )}
	            </Button>
	          </div>
            {renderCheckoutFeedback("anual_faq_stripe")}
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
	                  onClick={() => openJoin("anual_calculator_stripe")}
	                  disabled={isSubmitting}
	                  className="btn-primary-glow h-12 w-full max-w-2xl text-base font-black md:h-14 md:text-lg"
	                >
	                  {isSubmitting && lastAttempt?.ctaId === "anual_calculator_stripe" ? (
	                    <>
	                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                      {language === "es" ? "Cargando checkout seguro..." : "Loading secure checkout..."}
	                    </>
	                  ) : (
	                    <span className="flex w-full flex-col items-center leading-tight">
	                      <span>Acceder a la membresía anual</span>
	                      <span className="text-xs font-semibold opacity-90">
	                        Quiero aprovechar el precio especial de $195 USD
	                      </span>
	                    </span>
	                  )}
	                </Button>
	              </div>
                {renderCheckoutFeedback("anual_calculator_stripe")}
	              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
	                <Lock className="h-4 w-4 text-primary" />
	                Tu información está 100% segura con nosotros
	              </p>
            </div>

            <div className="mt-10">
              <p className="font-display text-4xl font-black leading-[0.95] md:text-5xl">
                Paso 1. <span className="text-gradient-red">Abre tu checkout seguro</span>
              </p>
            </div>

	            <div className="mt-10 flex flex-col items-center gap-3 text-center">
	              <Button
	                onClick={() => openJoin("anual_register_stripe")}
	                disabled={isSubmitting}
	                className="btn-primary-glow h-12 w-full max-w-2xl text-base font-black md:h-14 md:text-lg"
	              >
	                {isSubmitting && lastAttempt?.ctaId === "anual_register_stripe" ? (
	                  <>
	                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                    {language === "es" ? "Cargando checkout seguro..." : "Loading secure checkout..."}
	                  </>
	                ) : (
	                  "Registrarme ahora"
	                )}
	              </Button>
                {renderCheckoutFeedback("anual_register_stripe")}
	              <p className="text-xs text-muted-foreground">
	                VideoRemixesPack © {new Date().getFullYear()}. Derechos Reservados
	              </p>
              <p className="text-xs text-muted-foreground">
                Política de Privacidad | Términos y Condiciones
              </p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
