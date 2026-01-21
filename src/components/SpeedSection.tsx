import { motion } from "framer-motion";
import { Zap, Server, Cloud, Download, Moon } from "lucide-react";

const SpeedSection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 bg-background">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-background-carbon via-background to-background-carbon" />
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          {/* Main content - Glass card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-card/50 backdrop-blur-md border border-primary/20 p-8 md:p-14 shadow-glow"
          >
            {/* Header */}
            <div className="text-center mb-10">
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-block mb-4 px-4 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium"
              >
                SINCRONIZACIÓN MASIVA
              </motion.span>
              
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold">
                VETE A DORMIR Y DESPIERTA CON{" "}
                <span className="text-primary">TU LIBRERÍA ACTUALIZADA</span>{" "}
                EN TU DISCO DURO.
              </h2>
            </div>

            {/* Feature Highlight */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
              {/* Big Icon */}
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30">
                <Zap className="h-14 w-14 text-primary" />
              </div>
              
              <div className="text-center md:text-left">
                <h3 className="font-display text-2xl md:text-3xl font-bold">
                  Conexión FTP Directa
                </h3>
                <p className="mt-2 font-sans text-lg text-muted-foreground">
                  Compatible con FileZilla y Air Explorer. Arrastra, suelta y sincroniza 
                  <span className="text-primary font-semibold"> 1TB en minutos</span>.
                </p>
              </div>
            </div>

            {/* Features grid - Bigger icons */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Server,
                  title: "Servidores Premium",
                  description: "Infraestructura de alta velocidad sin throttling"
                },
                {
                  icon: Cloud,
                  title: "Air Explorer",
                  description: "Sincronización directa con tu nube favorita"
                },
                {
                  icon: Download,
                  title: "Sin Límites",
                  description: "Descarga masiva. Sin caps. Sin restricciones."
                },
                {
                  icon: Moon,
                  title: "Mientras Duermes",
                  description: "Programa tus descargas y despierta listo"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex flex-col items-center rounded-xl bg-secondary/40 border border-white/5 p-6 text-center transition-all duration-300 hover:bg-secondary/60 hover:border-primary/20 hover:scale-105"
                >
                  <feature.icon className="mb-4 h-12 w-12 text-primary" />
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
