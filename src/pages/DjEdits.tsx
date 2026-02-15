import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Headphones,
  Loader2,
  Lock,
  Sparkles,
  Zap,
} from "lucide-react";
import SettingsToggle from "@/components/SettingsToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import HlsVideo from "@/components/HlsVideo";
import djEditsPoster from "@/assets/dj-edits-poster.jpg";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";
import { createBestCheckoutUrl } from "@/lib/checkout";

const PREVIEW_HLS_URL =
  "https://content.apisystem.tech/hls/medias/kIG3EUjfgGLoNW0QsJLS/media/transcoded_videos/cts-824a03253a87c3fb_,360,480,720,1080,p.mp4.urlset/master.m3u8";

export default function DjEdits() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentBadges = useMemo(
    () => ["VISA", "MASTERCARD", "AMEX", "DISCOVER", "PayPal"],
    []
  );

  useEffect(() => {
    document.title = "DJ Edits | Aprende a crear DJ edits desde cero";
  }, []);

  const startCheckout = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const leadId = crypto.randomUUID();
      const { url } = await createBestCheckoutUrl({
        leadId,
        product: "djedits",
        sourcePage: window.location.pathname,
      });

      if (url) {
        window.location.assign(url);
        return;
      }

      toast({
        title: language === "es" ? "Checkout no disponible" : "Checkout unavailable",
        description:
          language === "es"
            ? "Intenta de nuevo en unos segundos. Si continúa, contáctanos en Soporte."
            : "Please try again in a few seconds. If it continues, contact Support.",
        variant: "destructive",
      });
    } catch (err) {
      console.error("DJEDITS checkout error:", err);
      toast({
        title: language === "es" ? "Error" : "Error",
        description:
          language === "es"
            ? "Hubo un problema al iniciar el pago. Intenta de nuevo."
            : "There was a problem starting checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, language, toast]);

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
              alt="VideoRemixesPacks"
              className="h-10 w-auto object-contain md:h-12"
            />
            <p className="text-xs text-muted-foreground md:text-sm">
              soporte@videoremixpack.com
            </p>
          </div>

          <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-start">
            <div className="glass-card p-8 md:p-10">
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                CURSO
              </Badge>
              <h1 className="mt-5 font-display text-4xl font-black leading-[0.95] md:text-5xl">
                Como Hacer Tus Propios{" "}
                <span className="text-gradient-red">DJ EDITS</span>
              </h1>
              <p className="mt-6 text-sm text-muted-foreground md:text-base">
                Aprende paso a paso a crear tus primeros <strong>DJ edits</strong>{" "}
                y adapta canciones a tu estilo y tus sets.
              </p>
              <p className="mt-4 text-sm text-muted-foreground md:text-base">
                Un curso exclusivo, claro y sin tecnicismos para que logres
                resultados reales desde el <strong>PRIMER DIA</strong>.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={startCheckout}
                  disabled={isSubmitting}
                  className="btn-primary-glow h-12 flex-1 text-base font-black"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {language === "es" ? "Abriendo checkout..." : "Opening checkout..."}
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Empezar ahora
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 flex-1 text-base font-black"
                  onClick={() => navigate("/")}
                >
                  <Headphones className="mr-2 h-5 w-5 text-primary" />
                  Ver VRP
                </Button>
              </div>

              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-4 w-4 text-primary" />
                Tu información está 100% segura con nosotros
              </p>
            </div>

            <div className="glass-card p-8 md:p-10">
              <p className="text-sm font-semibold text-muted-foreground">
                ¡Hola! Soy <strong>DJ NACH</strong> y te doy la bienvenida al
                curso de <strong>DJ Edits</strong>.
              </p>

              <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-black">
                <div className="aspect-video">
                  <HlsVideo
                    src={PREVIEW_HLS_URL}
                    poster={djEditsPoster}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="mt-8 grid gap-3">
                <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <p className="text-sm font-black text-foreground">QUE INCLUYE:</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {[
                      "Acceso instantáneo a todas las lecciones.",
                      "Aprende paso a paso cómo transformar una canción original en una versión adaptada para cabina.",
                      "Descubre por qué los DJ edits son esenciales, cómo optimizar el sonido para entornos de club y domina el flujo completo desde la idea hasta el track listo para mezclar.",
                      "Aprende a crear tus primeros DJ edits desde cero.",
                      "Explicaciones simples, sin tecnicismos.",
                      "Resultados reales desde el primer día.",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <p className="text-sm font-black text-foreground">QUE NO INCLUYE:</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {[
                      "No necesitas experiencia previa.",
                      "No requieres equipo profesional ni software costoso.",
                      "No es teoría aburrida: todo es práctico y aplicable.",
                      "No pierdes tiempo con relleno, solo lo que realmente funciona.",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <BadgeCheck className="mt-0.5 h-5 w-5 text-primary" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learn */}
      <section className="relative py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="glass-card p-8 md:p-10">
            <h2 className="font-display text-4xl font-black leading-[0.95] md:text-5xl">
              ¿Qué <span className="text-gradient-red">aprenderás</span>?
            </h2>
            <p className="mt-5 text-sm text-muted-foreground md:text-base">
              En este curso aprenderás, de forma clara y práctica, a crear
              distintos tipos de <strong>DJ edits</strong>, para que tus sesiones
              sean mucho más fluidas, creativas y profesionales.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Flujo completo",
                  body: "Desde la idea hasta el track listo para mezclar.",
                },
                {
                  title: "Club ready",
                  body: "Optimiza el sonido para entornos de club.",
                },
                {
                  title: "Sin tecnicismos",
                  body: "Explicaciones simples y prácticas.",
                },
              ].map((c) => (
                <div key={c.title} className="glass-card p-6">
                  <p className="font-display text-2xl font-black">{c.title}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Price / CTA */}
      <section className="relative pb-20 pt-6 md:pb-28">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="glass-card p-8 md:p-10 text-center">
            <p className="font-display text-4xl font-black">
              Empieza <span className="text-gradient-red">Ahora</span>!
            </p>
            <p className="mt-3 font-display text-2xl font-black">
              <span className="text-gradient-red">PAGO UNICO</span> 70 USD
            </p>
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              *Oferta Por Tiempo Limitado*
            </p>

            <div className="mt-8 flex flex-col items-center gap-3">
              <Button
                onClick={startCheckout}
                disabled={isSubmitting}
                className="btn-primary-glow h-12 w-full max-w-md text-base font-black"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {language === "es" ? "Abriendo checkout..." : "Opening checkout..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    CLICK AQUI
                  </>
                )}
              </Button>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
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

            <p className="mt-8 text-xs text-muted-foreground">
              Video Remixes Packs © {new Date().getFullYear()}. Derechos
              Reservados
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
