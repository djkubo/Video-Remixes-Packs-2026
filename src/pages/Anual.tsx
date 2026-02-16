import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
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
import { useAnalytics } from "@/hooks/useAnalytics";
import { useToast } from "@/hooks/use-toast";
import logoWhite from "@/assets/logo-white.webp";
import { createBestCheckoutUrl, type CheckoutProvider } from "@/lib/checkout";

export default function Anual() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<{ ctaId: string; prefer: CheckoutProvider } | null>(null);

  const isSpanish = language === "es";

  useEffect(() => {
    document.title =
      "VideoRemixesPack. La mejor plataforma de música y video para profesionales de la música de habla hispana";
  }, []);

  /* ─── checkout logic ─── */
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

  const openJoin = useCallback(
    (ctaId: string) => { void startExpressCheckout(ctaId, "stripe"); },
    [startExpressCheckout]
  );

  const openJoinPayPal = useCallback(
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
      { id: "a1", text: "Lo recomiendo! Primero fue difícil confiar pero la calidad y la variedad me convencieron.", who: "Jerry H." },
      { id: "a2", text: "Muy satisfecho, muy bien organizada y de muy buena calidad. Gran variedad en los géneros.", who: "Leobardo M." },
      { id: "a3", text: "Las mezclas y el material original que tienen aquí no se encuentran en cualquier lado.", who: "Roberto C." },
      { id: "a4", text: "Llevo 6 meses con la membresía y ya recuperé la inversión diez veces. Vale cada dólar.", who: "Eduardo P." },
      { id: "a5", text: "Lo mejor es el FTP. Descargué 300GB en una noche mientras dormía. Brutal.", who: "Fernando T." },
      { id: "a6", text: "Cancelé mis otros 2 pools. Aquí tengo todo lo que necesito y en mejor calidad.", who: "Miguel R." },
      { id: "a7", text: "El plan anual sale a $16/mes. Es la mejor inversión que he hecho como DJ.", who: "Carlos V." },
      { id: "a8", text: "Soporte en español rápido. Me ayudaron a configurar FileZilla en 5 minutos.", who: "Sandra L." },
      { id: "a9", text: "Los intros y outros limpios son la clave. Ningún otro pool me daba eso.", who: "Karen R." },
    ],
    []
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

          <div className="mt-8 rounded-2xl bg-[#AA0202] px-4 py-3 text-center font-bebas text-xl uppercase tracking-wide text-[#EFEFEF] md:text-2xl">
            <span>AMIGO DJ:</span>{" "}
            {isSpanish ? "¿Sigues perdiendo tiempo buscando material nuevo?" : "Still wasting time searching for new material?"}
          </div>

          <div className="mt-10 grid gap-10 md:grid-cols-2 md:items-start">
            <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10">
              <p className="font-sans text-sm font-semibold text-zinc-400">
                {isSpanish ? "¿Cansado de buscar material nuevo para tus eventos?" : "Tired of searching for new material?"}
              </p>

              <h1 className="mt-4 font-bebas text-4xl uppercase leading-[0.92] md:text-5xl">
                {isSpanish ? (
                  <>COMPRA TU <span className="text-[#AA0202]">ACCESO ANUAL</span> A LA MEMBRESÍA VIDEO REMIX PACKS Y <span className="text-[#AA0202]">OLVÍDATE DE BUSCAR MÚSICA</span> NUEVAMENTE</>
                ) : (
                  <>GET YOUR <span className="text-[#AA0202]">ANNUAL ACCESS</span> TO THE VIDEO REMIX PACKS MEMBERSHIP AND <span className="text-[#AA0202]">FORGET ABOUT SEARCHING</span> FOR MUSIC</>
                )}
              </h1>

              <ul className="mt-6 space-y-3 font-sans text-sm text-zinc-400 md:text-base">
                {[
                  isSpanish ? "7,000 videos en formato MP4" : "7,000 videos in MP4 format",
                  isSpanish ? "Los 30 géneros más populares" : "30 most popular genres",
                  isSpanish ? "Listo para conectar y comenzar a tocar" : "Ready to plug in and play",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#AA0202]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-end gap-6">
                <div>
                  <p className="font-sans text-sm font-black text-zinc-400">{isSpanish ? "Precio anual" : "Annual price"}</p>
                  <p className="font-bebas text-4xl uppercase text-[#EFEFEF]">
                    {isSpanish ? "A SÓLO " : "ONLY "}<span className="text-[#AA0202]">$195 USD</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Lock className="h-4 w-4 text-[#AA0202]" />
                  <span>{isSpanish ? "Tu información está 100% segura" : "Your info is 100% secure"}</span>
                </div>
              </div>

              <div className="mt-8 grid gap-3">
                <Button onClick={() => openJoin("anual_hero_stripe")} disabled={isSubmitting}
                  className="btn-primary-glow min-h-[56px] w-full font-bebas text-xl uppercase tracking-wide">
                  {isSubmitting && lastAttempt?.ctaId === "anual_hero_stripe" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "CARGANDO..." : "LOADING..."}</>
                  ) : (
                    <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "ACCEDER AHORA – $195 USD" : "ACCESS NOW – $195 USD"}<ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
                <Button onClick={() => openJoinPayPal("anual_hero_paypal")} disabled={isSubmitting}
                  variant="outline" className="min-h-[56px] w-full border-[#5E5E5E] bg-transparent font-bebas text-xl uppercase tracking-wide text-[#EFEFEF] hover:bg-[#111111]">
                  {isSubmitting && lastAttempt?.ctaId === "anual_hero_paypal" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "CARGANDO PAYPAL..." : "LOADING PAYPAL..."}</>
                  ) : (
                    <><CreditCard className="mr-2 h-4 w-4 text-[#AA0202]" />{isSpanish ? "PAGAR CON PAYPAL" : "PAY WITH PAYPAL"}</>
                  )}
                </Button>
                {renderCheckoutFeedback("anual_hero_stripe")}
                {renderCheckoutFeedback("anual_hero_paypal")}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {["VISA", "MASTERCARD", "AMEX", "PayPal"].map((l) => (
                  <span key={l} className="rounded-full border border-[#5E5E5E] bg-[#111111]/50 px-3 py-1 text-[10px] font-semibold text-zinc-500">{l}</span>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10">
              <p className="font-sans text-sm font-semibold text-zinc-400">
                {isSpanish ? "¿Te ha pasado algo así?" : "Sound familiar?"}
              </p>
              <h2 className="mt-4 font-bebas text-4xl uppercase leading-[0.92] md:text-5xl">
                {isSpanish ? (
                  <>EL DILEMA ETERNO DEL <span className="text-[#AA0202]">DJ AMATEUR</span> QUE <span className="text-[#AA0202]">QUIERE SER PROFESIONAL</span></>
                ) : (
                  <>THE ETERNAL DILEMMA OF THE <span className="text-[#AA0202]">AMATEUR DJ</span> WHO <span className="text-[#AA0202]">WANTS TO GO PRO</span></>
                )}
              </h2>

              <div className="mt-6 space-y-3 font-sans text-sm text-zinc-400 md:text-base">
                <p>{isSpanish ? "Todos tenemos un amigo así: Quiere ser un DJ profesional, quiere cobrar caro, que lo recomienden y tener muchos eventos..." : "We all know someone like this: Wants to be a pro DJ, charge premium, get referrals..."}</p>
                <p>{isSpanish ? "Pero NO quiere pagar por su música." : "But DOESN'T want to pay for music."}</p>
                <p>{isSpanish ? "Este mismo amigo usa canciones con marcas de agua, con calidad de audio baja y sonidos de fondo desagradables." : "Uses tracks with watermarks, low audio quality and unpleasant background sounds."}</p>
                <p>{isSpanish ? "No podrá llegar muy lejos si sigue usando esta estrategia..." : "They won't go far with this strategy..."}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── Expert section ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10">
              <p className="font-sans text-sm font-semibold text-zinc-400">{isSpanish ? "Los DJ's expertos lo saben..." : "Expert DJs know this..."}</p>
              <h2 className="mt-4 font-bebas text-4xl uppercase leading-[0.92] md:text-5xl">
                {isSpanish ? (
                  <>PARA <span className="text-[#AA0202]">SER UN PROFESIONAL</span> HAY QUE TENER <span className="text-[#AA0202]">MÚSICA DE LA MEJOR CALIDAD</span></>
                ) : (
                  <>TO <span className="text-[#AA0202]">BE A PRO</span> YOU NEED <span className="text-[#AA0202]">TOP QUALITY MUSIC</span></>
                )}
              </h2>

              <p className="mt-6 font-sans text-sm text-zinc-400 md:text-base">
                {isSpanish
                  ? "En VideoRemixesPack tenemos más de 15 años de experiencia en la industria de la música."
                  : "At VideoRemixesPack we have 15+ years of experience in the music industry."}
              </p>

              <ul className="mt-6 space-y-3 font-sans text-sm text-zinc-400 md:text-base">
                {[
                  isSpanish ? "No pistas de dudosa procedencia" : "No dubious source tracks",
                  isSpanish ? "No material de plataformas gratuitas" : "No free platform material",
                  isSpanish ? "No descargas con marcas de agua" : "No watermarked downloads",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-[#AA0202]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-8 font-bebas text-2xl uppercase">
                {isSpanish
                  ? "TODA LA MÚSICA QUE NECESITAS PARA AMBIENTAR TU EVENTO POR UN AÑO!"
                  : "ALL THE MUSIC YOU NEED FOR YOUR EVENTS FOR A YEAR!"}
              </p>
            </article>

            <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10">
              <h2 className="font-bebas text-4xl uppercase leading-[0.92] md:text-5xl">
                <span className="text-[#AA0202]">{isSpanish ? "MEMBRESÍA ANUAL" : "ANNUAL MEMBERSHIP"}</span> VIDEO REMIX PACKS
              </h2>

              <div className="mt-6 space-y-3 font-sans text-sm text-zinc-400 md:text-base">
                <p>{isSpanish ? "Una plataforma hecha por DJ's para DJ's." : "A platform made by DJs for DJs."}</p>
                <p>{isSpanish ? "La mejor selección de música lista para descargar y usar en tus eventos." : "The best selection of music ready to download and use at your events."}</p>
                <p>{isSpanish ? "Sé parte de la mejor comunidad de DJ's de habla hispana." : "Join the best Spanish-speaking DJ community."}</p>
              </div>

              <p className="mt-8 font-bebas text-2xl uppercase text-[#AA0202]">
                {isSpanish ? "APROVECHA ESTA OFERTA POR TIEMPO LIMITADO" : "LIMITED TIME OFFER"}
              </p>

              <div className="mt-6">
                <p className="font-sans text-sm font-black text-zinc-400">{isSpanish ? "Precio anual" : "Annual price"}</p>
                <p className="font-bebas text-4xl uppercase">
                  {isSpanish ? "A SÓLO " : "ONLY "}<span className="text-[#AA0202]">$195 USD</span>
                </p>
              </div>

              <div className="mt-8">
                <Button onClick={() => openJoin("anual_offer_stripe")} disabled={isSubmitting}
                  className="btn-primary-glow min-h-[56px] w-full font-bebas text-xl uppercase tracking-wide">
                  {isSubmitting && lastAttempt?.ctaId === "anual_offer_stripe" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "CARGANDO..." : "LOADING..."}</>
                  ) : (
                    <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "QUIERO UN AÑO DE MÚSICA ILIMITADA" : "I WANT A YEAR OF UNLIMITED MUSIC"}<ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
                {renderCheckoutFeedback("anual_offer_stripe")}
                <p className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
                  <Lock className="h-4 w-4 text-[#AA0202]" />
                  {isSpanish ? "Tu información está 100% segura" : "Your info is 100% secure"}
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10">
            <h2 className="font-bebas text-4xl uppercase leading-[0.92] md:text-5xl">
              {isSpanish ? (
                <>¿QUÉ OBTIENES CON LA <span className="text-[#AA0202]">MEMBRESÍA ANUAL</span> VIDEO REMIX PACKS?</>
              ) : (
                <>WHAT DO YOU GET WITH THE <span className="text-[#AA0202]">ANNUAL MEMBERSHIP</span>?</>
              )}
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <ul className="space-y-3 font-sans text-sm text-zinc-400 md:text-base">
                {[
                  isSpanish ? "Más de 10,000 horas de música, videos y karaoke listos para usarse" : "10,000+ hours of music, video & karaoke ready to use",
                  isSpanish ? "Pistas revisadas y editadas por profesionales" : "Professionally reviewed and edited tracks",
                  isSpanish ? "Los 40 géneros más buscados" : "40 most searched genres",
                  isSpanish ? "Música libre de sellos o marcas de agua" : "Watermark-free, label-free music",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#AA0202]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <ul className="space-y-3 font-sans text-sm text-zinc-400 md:text-base">
                {[
                  isSpanish ? "Excelente calidad de audio" : "Excellent audio quality",
                  isSpanish ? "Descarga segura" : "Secure downloads",
                  isSpanish ? "Actualizaciones constantes" : "Constant updates",
                  isSpanish ? "Biblioteca ordenada por géneros y carpetas" : "Library organized by genre & folders",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#AA0202]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </section>

      {/* ── Bonus ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10">
            <p className="font-bebas text-sm uppercase tracking-widest text-[#AA0202]">
              {isSpanish ? "BONO ESPECIAL: ASESORÍA GRATIS CON" : "SPECIAL BONUS: FREE COACHING WITH"}
            </p>
            <h2 className="mt-3 font-bebas text-5xl uppercase md:text-6xl">
              GUSTAVO <span className="text-[#AA0202]">GARCÍA</span>
            </h2>

            <ul className="mt-8 space-y-3 font-sans text-sm text-zinc-400 md:text-base">
              {[
                isSpanish ? "DJ profesional con más de 15 años de experiencia" : "Professional DJ with 15+ years of experience",
                isSpanish ? "Ha tenido la oportunidad de tocar en bares y clubes de México y Estados Unidos" : "Performed at bars and clubs in Mexico and the US",
                isSpanish ? "Creador de la Plataforma VideoRemixesPack" : "Creator of the VideoRemixesPack Platform",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Star className="mt-0.5 h-5 w-5 text-[#AA0202]" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            <p className="mt-10 font-sans text-sm text-zinc-400 md:text-base">
              {isSpanish
                ? "Esta asesoría por separado te costaría más de $500 USD Y la obtienes GRATIS al adquirir tu membresía anual."
                : "This coaching alone would cost $500+ USD and you get it FREE with your annual membership."}
            </p>

            <div className="mt-10 flex justify-center">
              <Button onClick={() => openJoin("anual_bonus_stripe")} disabled={isSubmitting}
                className="btn-primary-glow min-h-[56px] w-full max-w-2xl font-bebas text-xl uppercase tracking-wide">
                {isSubmitting && lastAttempt?.ctaId === "anual_bonus_stripe" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "CARGANDO..." : "LOADING..."}</>
                ) : (
                  <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "SÍ, QUIERO MÚSICA ILIMITADA POR UN AÑO" : "YES, I WANT UNLIMITED MUSIC FOR A YEAR"}<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
            {renderCheckoutFeedback("anual_bonus_stripe")}
          </article>
        </div>
      </section>

      {/* ── Social proof (3×3 grid) ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6 md:p-8">
            <Badge className="border-[#AA0202]/40 bg-[#AA0202]/15 px-3 py-1 font-bebas text-xs uppercase tracking-widest text-yellow-300">
              <Star className="mr-1.5 h-3 w-3 fill-yellow-400 text-yellow-400" />
              {isSpanish ? "+4,800 DJs CONFÍAN EN NOSOTROS" : "+4,800 DJs TRUST US"}
            </Badge>
            <h2 className="mt-3 font-bebas text-4xl uppercase md:text-5xl">
              {isSpanish ? "¿QUÉ DICEN NUESTROS USUARIOS?" : "WHAT DO OUR USERS SAY?"}
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {testimonials.map((t) => (
                <div key={t.id} className="rounded-xl border border-[#5E5E5E] bg-[#070707] p-4">
                  <p className="font-sans text-sm text-[#EFEFEF]">"{t.text}"</p>
                  <p className="mt-2 text-right font-sans text-[10px] text-zinc-500">{t.who} ✓✓</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <Button onClick={() => openJoin("anual_reviews_stripe")} disabled={isSubmitting}
                className="btn-primary-glow min-h-[56px] w-full max-w-2xl font-bebas text-xl uppercase tracking-wide">
                {isSubmitting && lastAttempt?.ctaId === "anual_reviews_stripe" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "CARGANDO..." : "LOADING..."}</>
                ) : (
                  <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "ACCEDER A LA MEMBRESÍA ANUAL" : "ACCESS THE ANNUAL MEMBERSHIP"}<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
            {renderCheckoutFeedback("anual_reviews_stripe")}
          </article>
        </div>
      </section>

      {/* ── Who is it for ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10">
            <h2 className="font-bebas text-4xl uppercase leading-[0.92] md:text-5xl">
              {isSpanish ? (
                <>¿PARA QUIÉN ES LA <span className="text-[#AA0202]">MEMBRESÍA ANUAL</span>?</>
              ) : (
                <>WHO IS THE <span className="text-[#AA0202]">ANNUAL MEMBERSHIP</span> FOR?</>
              )}
            </h2>
            <p className="mt-4 font-sans text-sm text-zinc-400 md:text-base">
              {isSpanish
                ? "Si eres DJ de tiempo completo o estás en el proceso de serlo, esta membresía es PARA TI!"
                : "If you're a full-time DJ or working to become one, this membership is FOR YOU!"}
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[#5E5E5E] bg-[#070707] p-7">
                <p className="font-bebas text-2xl uppercase">
                  DJ&apos;S QUE <span className="text-[#AA0202]">NO</span> USAN VIDEOREMIXESPACKS
                </p>
                <ul className="mt-5 space-y-3 font-sans text-sm text-zinc-400 md:text-base">
                  {[
                    isSpanish ? "Pasan horas buscando música nueva" : "Spend hours searching for new music",
                    isSpanish ? "Encuentran material de dudosa calidad" : "Find questionable quality material",
                    isSpanish ? "Usan plataformas gratuitas" : "Use free platforms",
                    isSpanish ? "No invierten en mejorar su negocio" : "Don't invest in their business",
                    isSpanish ? "Siguen usando las mismas canciones de hace 20 años" : "Still using the same songs from 20 years ago",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <TrendingUp className="mt-0.5 h-5 w-5 text-zinc-500" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-[#5E5E5E] bg-[#070707] p-7">
                <p className="font-bebas text-2xl uppercase">
                  DJ&apos;S QUE <span className="text-[#AA0202]">SÍ</span> USAN VIDEOREMIXESPACKS
                </p>
                <ul className="mt-5 space-y-3 font-sans text-sm text-zinc-400 md:text-base">
                  {[
                    isSpanish ? "Aprovechan el tiempo creciendo su negocio" : "Spend time growing their business",
                    isSpanish ? "Tienen material de la mejor calidad" : "Have the best quality material",
                    isSpanish ? "Pueden cobrar más por su servicio" : "Can charge more for their service",
                    isSpanish ? "Tienen la música más actual" : "Have the most current music",
                    isSpanish ? "Invierten en herramientas para su negocio" : "Invest in tools for their business",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <Users className="mt-0.5 h-5 w-5 text-[#AA0202]" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-center font-bebas text-4xl uppercase md:text-5xl">
            {isSpanish ? (
              <>ESTAS SON LAS <span className="text-[#AA0202]">PREGUNTAS FRECUENTES</span></>
            ) : (
              <>FREQUENTLY ASKED <span className="text-[#AA0202]">QUESTIONS</span></>
            )}
          </h2>

          <div className="mt-10 rounded-2xl border border-[#5E5E5E] bg-[#111111] p-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>{isSpanish ? "¿Qué incluye la membresía?" : "What does the membership include?"}</AccordionTrigger>
                <AccordionContent>{isSpanish ? "Más de 10,000 horas de música, videos y karaoke listos para usarse." : "10,000+ hours of music, video & karaoke ready to use."}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>{isSpanish ? "¿Qué géneros hay en la plataforma?" : "What genres are available?"}</AccordionTrigger>
                <AccordionContent>{isSpanish ? "Los 40 géneros más buscados incluyendo latino, reggaeton, tribal, bachata y más." : "40 most searched genres including Latin, reggaeton, tribal, bachata and more."}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>{isSpanish ? "¿Hay límite de descargas?" : "Is there a download limit?"}</AccordionTrigger>
                <AccordionContent>{isSpanish ? "Acceso anual con descargas seguras y actualizaciones constantes." : "Annual access with secure downloads and constant updates."}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>{isSpanish ? "¿Puedo acceder a un demo?" : "Can I access a demo?"}</AccordionTrigger>
                <AccordionContent>{isSpanish ? "Regístrate y te contactamos por WhatsApp." : "Register and we'll contact you via WhatsApp."}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mt-10 flex justify-center">
            <Button onClick={() => openJoin("anual_faq_stripe")} disabled={isSubmitting}
              className="btn-primary-glow min-h-[56px] w-full max-w-2xl font-bebas text-xl uppercase tracking-wide">
              {isSubmitting && lastAttempt?.ctaId === "anual_faq_stripe" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "CARGANDO..." : "LOADING..."}</>
              ) : (
                <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "ACCEDER A LA MEMBRESÍA ANUAL" : "ACCESS THE ANNUAL MEMBERSHIP"}<ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
          {renderCheckoutFeedback("anual_faq_stripe")}
        </div>
      </section>

      {/* ── Final CTA + Footer ── */}
      <section className="pb-20 pt-6 md:pb-28">
        <div className="container mx-auto max-w-4xl px-4">
          <article className="rounded-2xl border border-[#5E5E5E] bg-[#111111] p-8 md:p-10 text-center">
            <h2 className="font-bebas text-4xl uppercase md:text-5xl">
              {isSpanish ? (
                <>PASO 1. <span className="text-[#AA0202]">ABRE TU CHECKOUT SEGURO</span></>
              ) : (
                <>STEP 1. <span className="text-[#AA0202]">OPEN SECURE CHECKOUT</span></>
              )}
            </h2>

            <div className="mt-10 flex justify-center">
              <Button onClick={() => openJoin("anual_register_stripe")} disabled={isSubmitting}
                className="btn-primary-glow min-h-[56px] w-full max-w-2xl font-bebas text-xl uppercase tracking-wide">
                {isSubmitting && lastAttempt?.ctaId === "anual_register_stripe" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSpanish ? "CARGANDO..." : "LOADING..."}</>
                ) : (
                  <><Zap className="mr-2 h-5 w-5" />{isSpanish ? "REGISTRARME AHORA" : "REGISTER NOW"}<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
            {renderCheckoutFeedback("anual_register_stripe")}
          </article>

          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-green-400" />
              <p className="font-sans text-xs text-green-300/70">
                {isSpanish ? "Pago 100% seguro • Soporte en español" : "100% secure payment • Spanish support"}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {["VISA", "MASTERCARD", "AMEX", "PayPal"].map((l) => (
                <span key={l} className="rounded-full border border-[#5E5E5E] bg-[#111111]/50 px-3 py-1 text-[10px] font-semibold text-zinc-500">{l}</span>
              ))}
            </div>
            <p className="text-center font-sans text-xs text-zinc-600">
              © {new Date().getFullYear()} VideoRemixesPack™ | {isSpanish ? "Todos los derechos reservados" : "All rights reserved"}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
