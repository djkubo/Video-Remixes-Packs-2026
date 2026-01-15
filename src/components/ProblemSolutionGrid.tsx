import { motion } from "framer-motion";
import { AlertTriangle, Database, X, Check, Folder, Sparkles } from "lucide-react";

const ProblemSolutionGrid = () => {
  return (
    <section className="relative py-20 md:py-28 bg-background-carbon">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-3xl font-bold md:text-5xl lg:text-6xl">
            EL PROBLEMA VS LA SOLUCIÓN
          </h2>
        </motion.div>

        {/* Grid - Dark Glassmorphism */}
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          {/* Problem Card - Glass Effect */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl bg-card/50 backdrop-blur-md border border-white/10 p-8 md:p-10 transition-all duration-300 hover:border-white/20"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <h3 className="mb-6 font-display text-2xl font-bold md:text-3xl">EL DOLOR</h3>
            
            <ul className="space-y-5">
              {[
                "Pagar 5 pools diferentes y aún así no tener lo que necesitas",
                "Perder horas borrando logos y marcas de agua ajenas",
                "Archivos desorganizados, mal etiquetados, duplicados",
                "Formatos inconsistentes y calidad variable"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-4 font-sans text-muted-foreground">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Solution Card - Glass Effect with red border */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-xl bg-card/50 backdrop-blur-md border border-primary/20 p-8 md:p-10 transition-all duration-300 hover:border-primary/40 shadow-glow"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
              <Database className="h-8 w-8 text-primary" />
            </div>
            
            <h3 className="mb-6 font-display text-2xl font-bold md:text-3xl">LA SOLUCIÓN</h3>
            
            <ul className="space-y-5">
              {[
                { text: "Una sola suscripción = Todo el contenido que necesitas", icon: Sparkles },
                { text: "Archivos 100% limpios, sin logos, listos para usar", icon: Check },
                { text: "Organización Inteligente por Género, BPM y Año", icon: Folder },
                { text: "Calidad consistente: 320kbps MP3 / 1080p Video", icon: Check }
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-4 font-sans text-muted-foreground">
                  <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionGrid;
