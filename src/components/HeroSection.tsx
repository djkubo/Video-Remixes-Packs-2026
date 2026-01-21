import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();

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
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
      </div>

      {/* Light mode background - elegant gradient */}
      <div className="absolute inset-0 block dark:hidden bg-gradient-to-b from-background via-background to-background-carbon">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Red glow from top */}
      <div className="absolute inset-0 hero-gradient" />

      <div className="container relative z-10 mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-20 text-center">
        {/* Anti-Confusion Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-primary/60 bg-primary/20 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-primary-foreground dark:text-white backdrop-blur-sm">
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
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-5xl font-display text-5xl font-extrabold leading-none tracking-tight text-foreground dark:text-white text-shadow sm:text-6xl md:text-7xl lg:text-8xl"
        >
          {t("hero.title")}{" "}
          <span className="text-gradient-red">
            {t("hero.titleHighlight")}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 max-w-2xl font-sans text-lg text-muted-foreground dark:text-white/80 md:text-xl"
        >
          {t("hero.subtitle")}{" "}
          <span className="font-semibold text-foreground dark:text-white">
            {t("hero.subtitleBold")}
          </span>
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12"
        >
          <Button
            asChild
            size="lg"
            className="btn-primary-glow group h-16 gap-3 px-10 text-lg font-bold"
          >
            <a href="#pricing">
              <Zap className="h-5 w-5" />
              {t("hero.cta")}
            </a>
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
              <div className="font-display text-4xl font-extrabold text-primary md:text-5xl text-shadow-glow">
                {stat.value}
              </div>
              <div className="mt-2 font-bebas text-sm uppercase tracking-widest text-muted-foreground dark:text-white/60">
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