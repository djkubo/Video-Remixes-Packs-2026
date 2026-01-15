import { motion } from "framer-motion";
import { Zap, Server, Cloud, Download } from "lucide-react";

const SpeedSection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background-carbon to-background" />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8 md:p-12"
          >
            <div className="flex flex-col items-center text-center md:flex-row md:text-left">
              {/* Icon */}
              <div className="mb-6 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 md:mb-0 md:mr-8">
                <Zap className="h-10 w-10 text-primary" />
              </div>

              {/* Text content */}
              <div className="flex-1">
                <h2 className="font-display text-3xl font-bold md:text-4xl lg:text-5xl">
                  SINCRONIZA <span className="text-gradient-red">1TB EN MINUTOS</span>
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Conexión directa FTP / Air Explorer. Arrastra y suelta. Sin límites de velocidad.
                </p>
              </div>
            </div>

            {/* Features grid */}
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
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
                  className="flex flex-col items-center rounded-xl bg-secondary/30 p-6 text-center transition-colors hover:bg-secondary/50"
                >
                  <feature.icon className="mb-3 h-8 w-8 text-primary" />
                  <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
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
