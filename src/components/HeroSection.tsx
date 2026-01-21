import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      {/* Video Background */}
      <div className="absolute inset-0">
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
        {/* Dark overlay 60% */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Subtle tech grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }}
      />

      <div className="container relative z-10 mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-20 text-center">
        {/* Anti-Confusion Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-bold uppercase tracking-wider text-red-400 backdrop-blur-sm">
            🔴 ACCESO 100% DIGITAL & INMEDIATO (NO USB)
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-5xl font-display text-4xl font-black leading-none tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
        >
          El Hub Definitivo del{" "}
          <span className="bg-gradient-to-r from-primary via-red-500 to-orange-500 bg-clip-text text-transparent">
            DJ Latino
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 max-w-3xl font-sans text-lg text-gray-300 md:text-xl lg:text-2xl"
        >
          Deja de pagar 4 membresías. Centralizamos los mejores pools en un solo lugar.{" "}
          <span className="font-semibold text-white">
            1TB de Descarga Masiva mensual vía FTP / Air Explorer.
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
            className="group h-16 gap-3 bg-gradient-to-r from-primary via-red-600 to-orange-500 px-10 text-lg font-bold shadow-2xl shadow-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-primary/50"
          >
            <a href="https://videoremixespacks.com/plan">
              <Zap className="h-5 w-5" />
              Ver Planes y Precios
            </a>
          </Button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 flex flex-wrap items-center justify-center gap-10 md:gap-20"
        >
          {[
            { value: "50K+", label: "Archivos Clean" },
            { value: "60+", label: "Géneros Organizados" },
            { value: "1TB", label: "Descarga Mensual" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-4xl font-bold text-primary md:text-5xl">
                {stat.value}
              </div>
              <div className="mt-2 font-sans text-sm uppercase tracking-wider text-gray-400">
                {stat.label}
              </div>
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
