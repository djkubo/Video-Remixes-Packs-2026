import { motion } from "framer-motion";
import { ArrowRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Background with radial gradient */}
      <div className="hero-gradient absolute inset-0" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(0 0% 50%) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(0 0% 50%) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }}
      />

      <div className="container relative z-10 mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-20 text-center">
        {/* Badge - Air Explorer Compatible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Rocket className="h-4 w-4" />
            Tecnología Air Explorer Compatible
          </span>
        </motion.div>

        {/* Main Heading - Brand Core 2026 */}
        <h1 className="animate-fade-in-up max-w-6xl font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
          EL HUB DEFINITIVO DEL DJ LATINO:{" "}
          <span className="text-gradient-red">TU LIBRERÍA LISTA EN MINUTOS, NO EN DÍAS.</span>
        </h1>

        {/* Subtitle - Value Proposition */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 max-w-3xl font-sans text-lg text-muted-foreground md:text-xl"
        >
          Ahorra miles de dólares en suscripciones. Centralizamos los éxitos de todos los pools, 
          los organizamos por género y te permitimos bajarlos{" "}
          <span className="text-foreground font-semibold">masivamente vía FTP.</span>
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
            className="group h-16 px-10 text-lg font-bold shadow-glow-intense animate-pulse-glow transition-transform duration-300 hover:scale-105"
          >
            <a href="https://videoremixespacks.com/plan">
              VER PLANES Y PRUEBA GRATIS
              <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </motion.div>

        {/* Stats row - Updated */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 flex flex-wrap items-center justify-center gap-10 md:gap-20"
        >
          {[
            { value: "50K+", label: "Archivos Clean" },
            { value: "60+", label: "Géneros Organizados" },
            { value: "FTP", label: "Descarga Masiva" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-4xl font-bold text-primary md:text-5xl">
                {stat.value}
              </div>
              <div className="mt-2 font-sans text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
