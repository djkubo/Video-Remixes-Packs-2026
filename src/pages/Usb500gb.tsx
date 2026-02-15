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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useToast } from "@/hooks/use-toast";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";
import { createBestCheckoutUrl, type CheckoutProvider } from "@/lib/checkout";

export default function Usb500gb() {
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
    document.title = "La USB Definitiva";
  }, []);

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

  const openOrder = useCallback(
    (ctaId: string) => {
      void startExpressCheckout(ctaId, "stripe");
    },
    [startExpressCheckout]
  );

  const openOrderPayPal = useCallback(
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
              alt="VideoRemixesPack"
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
		                  onClick={() => openOrder("usb500gb_hero_stripe")}
		                  disabled={isSubmitting}
		                  className="btn-primary-glow h-12 w-full text-base font-black md:w-auto md:px-10"
		                >
		                  {isSubmitting && lastAttempt?.ctaId === "usb500gb_hero_stripe" ? (
		                    <>
		                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
		                      {language === "es"
		                        ? "Cargando checkout seguro..."
		                        : "Loading secure checkout..."}
		                    </>
		                  ) : (
		                    <span className="flex w-full flex-col items-center leading-tight">
		                      <span>👉 ¡QUIERO MI USB AHORA! 👈</span>
		                      <span className="text-xs font-semibold opacity-90">📦 Stock limitado.</span>
		                    </span>
		                  )}
		                </Button>
		                <Button
		                  onClick={() => openOrderPayPal("usb500gb_hero_paypal")}
		                  disabled={isSubmitting}
		                  variant="outline"
		                  className="mt-3 h-12 w-full text-base font-black md:w-auto md:px-10"
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

                    {renderCheckoutFeedback("usb500gb_hero_stripe")}
                    {renderCheckoutFeedback("usb500gb_hero_paypal")}
	
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
	                onClick={() => openOrder("usb500gb_mid_stripe")}
	                disabled={isSubmitting}
	                className="btn-primary-glow h-12 w-full max-w-xl text-base font-black"
	              >
	                {isSubmitting && lastAttempt?.ctaId === "usb500gb_mid_stripe" ? (
	                  <>
	                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                    {language === "es"
	                      ? "Cargando checkout seguro..."
	                      : "Loading secure checkout..."}
	                  </>
	                ) : (
	                  "¡ORDENA TU USB AHORA MISMO! 🚀 Tu música, tu éxito"
	                )}
	              </Button>
	            </div>
              {renderCheckoutFeedback("usb500gb_mid_stripe")}
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
	                onClick={() => openOrder("usb500gb_bonus_stripe")}
	                disabled={isSubmitting}
	                className="btn-primary-glow h-12 w-full max-w-xl text-base font-black"
	              >
	                {isSubmitting && lastAttempt?.ctaId === "usb500gb_bonus_stripe" ? (
	                  <>
	                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                    {language === "es"
	                      ? "Cargando checkout seguro..."
	                      : "Loading secure checkout..."}
	                  </>
	                ) : (
	                  "¡ORDENA TU USB AHORA MISMO! No pierdas más tiempo buscando música"
	                )}
	              </Button>
	            </div>
              {renderCheckoutFeedback("usb500gb_bonus_stripe")}
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
	              onClick={() => openOrder("usb500gb_testimonials_stripe")}
	              disabled={isSubmitting}
	              className="btn-primary-glow h-12 w-full max-w-xl text-base font-black"
	            >
	              {isSubmitting && lastAttempt?.ctaId === "usb500gb_testimonials_stripe" ? (
	                <>
	                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                  {language === "es"
	                    ? "Cargando checkout seguro..."
	                    : "Loading secure checkout..."}
	                </>
	              ) : (
	                "¡ORDENA TU USB AHORA MISMO! No pierdas más tiempo buscando música"
	              )}
	            </Button>
	          </div>
            {renderCheckoutFeedback("usb500gb_testimonials_stripe")}
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
	                onClick={() => openOrder("usb500gb_guarantee_stripe")}
	                disabled={isSubmitting}
	                className="btn-primary-glow h-12 w-full max-w-xl text-base font-black"
	              >
	                {isSubmitting && lastAttempt?.ctaId === "usb500gb_guarantee_stripe" ? (
	                  <>
	                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                    {language === "es"
	                      ? "Cargando checkout seguro..."
	                      : "Loading secure checkout..."}
	                  </>
	                ) : (
	                  "¡ORDENA TU USB AHORA MISMO! No pierdas más tiempo buscando música"
	                )}
	              </Button>
	            </div>
              {renderCheckoutFeedback("usb500gb_guarantee_stripe")}
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
	                onClick={() => openOrder("usb500gb_offer_stripe")}
	                disabled={isSubmitting}
	                className="btn-primary-glow h-14 w-full max-w-2xl text-base font-black md:text-lg"
	              >
	                {isSubmitting && lastAttempt?.ctaId === "usb500gb_offer_stripe" ? (
	                  <>
	                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
	                    {language === "es"
	                      ? "Cargando checkout seguro..."
	                      : "Loading secure checkout..."}
	                  </>
	                ) : (
	                  <span className="flex w-full flex-col items-center leading-tight">
	                    <span>ORDENA YA - POR $197</span>
	                    <span className="text-xs font-semibold opacity-90">
	                      ⚠️ Atención: Unidades limitadas disponibles, no te quedes sin la tuya.
	                    </span>
	                  </span>
	                )}
	              </Button>
	            </div>
              {renderCheckoutFeedback("usb500gb_offer_stripe")}
	          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Copyrights 2025 |Gustavo Garcia™ | Terms &amp; Conditions
          </p>
        </div>
      </section>
    </main>
  );
}
