import { motion } from "framer-motion";
import { Headphones, PlayCircle, Zap } from "lucide-react";
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
  const { t, language } = useLanguage();
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
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Video Background - Only visible in dark mode */}
      <div className="absolute inset-0 hidden dark:block">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
          poster="https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?auto=format&fit=crop&w=1920&q=80"
        >
          <source
            src="https://cdn.coverr.co/videos/coverr-dj-mixing-music-at-a-club-3790/1080p.mp4"
            type="video/mp4"
          />
        </video>
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
      </div>

      {/* Light mode background - clean with subtle accent */}
      <div className="absolute inset-0 block dark:hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-primary/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-0 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-3xl" />
      </div>

      {/* Red glow from top */}
      <div className="absolute inset-0 hero-gradient" />

      <div className="container relative z-10 mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-20 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <img
            src={theme === "dark" ? logoWhite : logoDark}
            alt="VideoRemixesPacks"
            className="h-20 md:h-28 w-auto object-contain mx-auto"
          />
        </motion.div>

        {/* Anti-Confusion Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 dark:bg-primary/20 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-primary dark:text-white backdrop-blur-sm shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            {t("hero.badge")}
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl font-display text-5xl font-extrabold leading-none tracking-tight text-foreground dark:text-shadow sm:text-6xl md:text-7xl lg:text-8xl"
        >
          {isSpanish ? "Música latina profesional" : "Professional Latin music"}{" "}
          <span className="text-gradient-red">{isSpanish ? "en un solo plan" : "in one plan"}</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 max-w-2xl font-sans text-lg text-muted-foreground dark:text-white/80 md:text-xl"
        >
          {isSpanish
            ? "Para DJs latinos en USA: demos por género, catálogo actualizado y acceso listo para mezclar."
            : "For Latin DJs in the US: genre demos, updated catalog, and instant gig-ready access."}{" "}
          <span className="font-semibold text-foreground dark:text-white">
            {isSpanish ? "Todo claro, sin fricción y sin letras chiquitas." : "Clear value, low friction, no fine print."}
          </span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-center"
        >
          <Button
            asChild
            size="lg"
            className="btn-primary-glow group h-16 gap-3 px-10 text-lg font-bold"
            onClick={() =>
              handleCTAClick(
                primaryCta.label,
                primaryCta.to,
                primaryCta.ctaId,
                primaryCta.planId
              )
            }
          >
            <Link to={primaryCta.to}>
              <primaryCta.icon className="h-5 w-5" />
              {primaryCta.label}
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="group h-16 gap-3 px-10 text-lg font-bold"
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
              <secondaryCta.icon className="h-5 w-5 text-primary" />
              {secondaryCta.label}
            </Link>
          </Button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 flex flex-wrap items-center justify-center gap-12 md:gap-20"
        >
          {[
            { value: "50K+", label: t("hero.stat1") },
            { value: "60+", label: t("hero.stat2") },
            { value: "1TB", label: t("hero.stat3") },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-4xl font-extrabold text-primary md:text-5xl dark:text-shadow-glow">
                {stat.value}
              </div>
              <div className="mt-2 font-bebas text-sm uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
