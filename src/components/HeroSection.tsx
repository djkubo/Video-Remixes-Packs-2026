import { motion } from "framer-motion";
import { CheckCircle2, Headphones, PlayCircle, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useDataLayer } from "@/hooks/useDataLayer";
import { useAnalytics } from "@/hooks/useAnalytics";
import { isExperimentEnabled } from "@/lib/croFlags";
import { getExperimentAssignment } from "@/lib/experiments";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";

const HeroSection = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { trackClick } = useDataLayer();
  const { trackEvent } = useAnalytics();
  const isSpanish = language === "es";
  const heroAssignment = isExperimentEnabled("home_hero_cta")
    ? getExperimentAssignment("home_hero_cta")
    : {
        id: "home_hero_cta" as const,
        variant: "A" as const,
        assignedAt: new Date(0).toISOString(),
      };

  const primaryCta =
    heroAssignment.variant === "A"
      ? {
          label: isSpanish ? "Ver Planes" : "View Plans",
          to: "/plan",
          ctaId: "hero_ver_planes",
          planId: "plan_2tb_anual",
          icon: Zap,
        }
      : {
          label: isSpanish ? "Escuchar demos primero" : "Listen to demos first",
          to: "/explorer",
          ctaId: "hero_listen_demos_primary",
          planId: null,
          icon: PlayCircle,
        };

  const secondaryCta =
    heroAssignment.variant === "A"
      ? {
          label: isSpanish ? "Escuchar demos" : "Listen to demos",
          to: "/explorer",
          ctaId: "hero_listen_demos_secondary",
          planId: null,
          icon: Headphones,
        }
      : {
          label: isSpanish ? "Ir a membresía" : "Go to membership",
          to: "/plan",
          ctaId: "hero_go_membership_secondary",
          planId: "plan_2tb_anual",
          icon: Zap,
        };

  const handleCTAClick = (
    buttonText: string,
    destination: string,
    ctaId: string,
    planId: string | null
  ) => {
    trackClick(buttonText);
    trackEvent("click", {
      button_text: buttonText,
      section: "hero",
      destination,
      cta_id: ctaId,
      plan_id: planId,
      funnel_step: "hero",
      experiment_assignments: [heroAssignment],
    });
  };

  return (
    <section className="relative overflow-hidden border-b border-border/75 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,9,50,0.035),transparent_70%)]" />
      <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-10 md:pb-20 md:pt-16">
        <div className="grid items-center gap-9 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <img
              src={theme === "dark" ? logoWhite : logoDark}
              alt="VideoRemixesPacks"
              className="mb-7 h-11 w-auto object-contain"
            />

            <p className="inline-flex items-center gap-2 rounded-full border border-primary/55 bg-card px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              {isSpanish ? "DJs latinos USA · actualización semanal" : "US Latin DJs · weekly updates"}
            </p>

            <h1 className="mt-4 max-w-xl font-display text-5xl font-bold leading-tight text-foreground md:text-6xl">
              {isSpanish ? "Tu música lista para tocar" : "Your music ready to perform"}
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {isSpanish
                ? "Un solo lugar para demos, catálogo y membresía. Menos tiempo buscando, más tiempo facturando."
                : "One place for demos, catalog, and membership. Less search, more paid gigs."}
            </p>

            <ul className="mt-6 space-y-2.5">
              {[
                isSpanish ? "Audio y video organizados por género" : "Audio and video organized by genre",
                isSpanish ? "Compatible con Serato, Rekordbox y VirtualDJ" : "Compatible with Serato, Rekordbox, and VirtualDJ",
                isSpanish ? "Soporte real en español por WhatsApp" : "Real Spanish support on WhatsApp",
              ].map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-sm text-foreground/92">
                  <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="btn-primary-glow h-12 gap-2.5 px-6 text-sm font-bold md:text-base"
                onClick={() =>
                  handleCTAClick(primaryCta.label, primaryCta.to, primaryCta.ctaId, primaryCta.planId)
                }
              >
                <Link to={primaryCta.to}>
                  <primaryCta.icon className="h-4.5 w-4.5" />
                  {primaryCta.label}
                </Link>
              </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 gap-2.5 border-border bg-background px-6 text-sm font-bold hover:bg-muted md:text-base"
                onClick={() =>
                  handleCTAClick(
                    secondaryCta.label,
                    secondaryCta.to,
                    secondaryCta.ctaId,
                    secondaryCta.planId
                  )
                }
              >
                <Link to={secondaryCta.to}>
                  <secondaryCta.icon className="h-4.5 w-4.5 text-primary" />
                  {secondaryCta.label}
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              {isSpanish
                ? "Pagos seguros con Stripe y PayPal. Cancela cuando quieras."
                : "Secure payments with Stripe and PayPal. Cancel anytime."}
            </p>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="rounded-3xl border border-border/90 bg-card p-5 shadow-[0_18px_36px_rgba(15,23,42,0.12)]"
          >
            <div className="rounded-2xl border border-border/85 bg-background p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {isSpanish ? "Plan recomendado" : "Recommended plan"}
                </p>
                <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  {isSpanish ? "Más vendido" : "Best seller"}
                </span>
              </div>
              <p className="mt-3 font-display text-3xl font-bold text-foreground">
                {isSpanish ? "Membresía 2TB" : "2TB Membership"}
              </p>
              <p className="text-sm text-muted-foreground">{isSpanish ? "$195 anual" : "$195 yearly"}</p>

              <div className="mt-5 space-y-3">
                {[
                  isSpanish ? "Actualizaciones semanales" : "Weekly updates",
                  isSpanish ? "Acceso por carpetas y FTP" : "Folder and FTP access",
                  isSpanish ? "Soporte VIP en español" : "VIP Spanish support",
                ].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-xl border border-border/75 bg-card px-3 py-2.5">
                    <span className="text-sm text-foreground/90">{item}</span>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { value: "7K+", label: isSpanish ? "DJs" : "DJs" },
                { value: "50K+", label: isSpanish ? "Tracks" : "Tracks" },
                { value: "4.9", label: isSpanish ? "Rating" : "Rating" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border/80 bg-background px-2 py-3 text-center">
                  <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
