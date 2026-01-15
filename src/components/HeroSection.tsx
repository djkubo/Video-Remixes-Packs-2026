import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background with radial gradient */}
      <div className="hero-gradient absolute inset-0" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(0 0% 50%) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(0 0% 50%) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }}
      />

      <div className="container relative z-10 mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-20 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Play className="h-3 w-3 fill-current" />
            +50,000 Archivos Profesionales
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-5xl font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl"
        >
          LA LIBRERÍA MÁS GRANDE Y ORGANIZADA PARA EL{" "}
          <span className="text-gradient-red">DJ LATINO PROFESIONAL</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          +50,000 Audios, Videos y Karaokes con Organización Premium.{" "}
          <span className="text-foreground">Olvida la basura, descarga solo Hits.</span>
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10"
        >
          <Button
            asChild
            size="lg"
            className="group h-14 px-8 text-lg font-semibold shadow-glow transition-all duration-300 hover:shadow-glow-intense"
          >
            <a href="https://videoremixespacks.com/plan">
              VER PLANES Y PRUEBA GRATIS (7 DÍAS)
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-16"
        >
          {[
            { value: "50K+", label: "Archivos" },
            { value: "60+", label: "Géneros" },
            { value: "1TB", label: "Sincronización" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl font-bold text-primary md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
