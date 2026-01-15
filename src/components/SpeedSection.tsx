import { motion } from "framer-motion";
import { Zap, Server, Cloud, Download } from "lucide-react";

const SpeedSection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 bg-background">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-background-carbon via-background to-background-carbon" />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Main content - Glass card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-card/50 backdrop-blur-md border border-white/10 p-8 md:p-14"
          >
            <div className="flex flex-col items-center text-center md:flex-row md:text-left">
              {/* Icon - Big */}
              <div className="mb-8 flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary/10 md:mb-0 md:mr-10">
                <Zap className="h-12 w-12 text-primary" />
              </div>

              {/* Text content */}
              <div className="flex-1">
                <h2 className="font-display text-4xl font-bold md:text-5xl lg:text-6xl">
                  SINCRONIZA <span className="text-primary">1TB EN MINUTOS</span>
                </h2>
                <p className="mt-4 font-sans text-lg text-muted-foreground md:text-xl">
                  Conexión directa FTP / Air Explorer. Arrastra y suelta. Sin límites de velocidad.
                </p>
              </div>
            </div>

            {/* Features grid */}
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: Server,
                  title: "Servidores Premium",
                  description: "Infraestructura de alta velocidad"
                },
                {
                  icon: Cloud,
                  title: "Air Explorer",
                  description: "Integración directa con la nube"
                },
                {
                  icon: Download,
                  title: "Sin Límites",
                  description: "Descarga todo lo que necesites"
                }
              ].map((feature) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center rounded-xl bg-secondary/40 border border-white/5 p-6 text-center transition-all duration-300 hover:bg-secondary/60 hover:border-primary/20 hover:scale-105"
                >
                  <feature.icon className="mb-4 h-10 w-10 text-primary" />
                  <h3 className="font-display text-lg font-bold">{feature.title}</h3>
                  <p className="mt-2 font-sans text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SpeedSection;
