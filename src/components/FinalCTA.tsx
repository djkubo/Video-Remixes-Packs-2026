import { motion } from "framer-motion";
import { Check, ArrowRight, Shield, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const FinalCTA = () => {
  const benefits = [
    { icon: Zap, text: "Descarga masiva vía FTP (hasta 1TB/mes)" },
    { icon: Check, text: "Archivos Clean, listos para mezclar" },
    { icon: Shield, text: "Cancela cuando quieras, sin preguntas" },
    { icon: Clock, text: "Updates semanales con lo más nuevo" },
  ];

  return (
    <section className="relative py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          {/* Glowing border card */}
          <div className="glow-border relative overflow-hidden bg-background-carbon p-8 md:p-12">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            
            <div className="relative z-10 text-center">
              {/* Heading */}
              <h2 className="font-display text-3xl font-bold md:text-4xl lg:text-5xl">
                ¿LISTO PARA DEJAR DE BUSCAR{" "}
                <span className="text-gradient-red">EN 5 POOLS DIFERENTES?</span>
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-muted-foreground font-sans text-lg">
                Únete al Hub Definitivo del DJ Latino. Una sola suscripción. Todo el contenido que necesitas. Desde $35/mes.
              </p>

              {/* Benefits grid */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.text}
                    className="flex items-center gap-3 rounded-lg bg-secondary/30 p-4 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-sans font-medium">{benefit.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="mt-10">
                <Button
                  asChild
                  size="lg"
                  className="group h-16 w-full max-w-md animate-pulse-glow px-8 text-lg font-bold shadow-glow-intense transition-all duration-300 hover:scale-105 sm:w-auto"
                >
                  <a href="https://videoremixespacks.com/plan">
                    QUIERO MI ACCESO TOTAL AHORA
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>

              <p className="mt-6 text-sm text-muted-foreground font-sans">
                Somos tu socio experto • FTP / Air Explorer • 320kbps / 1080p
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
