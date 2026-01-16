import { motion } from "framer-motion";
import { DollarSign, Trash2, Tag, Gift } from "lucide-react";

const AggregatorSection = () => {
  const features = [
    {
      icon: DollarSign,
      title: "Pagamos los Pools",
      description: "Nosotros nos suscribimos a múltiples fuentes. Tú solo pagas una."
    },
    {
      icon: Trash2,
      title: "Filtramos la Basura",
      description: "Solo los éxitos. Cero relleno. Cero versiones inútiles."
    },
    {
      icon: Tag,
      title: "Corregimos los Tags",
      description: "Metadata perfecta: Artista, Título, BPM, Género. Listo para tu software."
    },
    {
      icon: Gift,
      title: "Te lo Entregamos Limpio",
      description: "Sin logos, sin marcas de agua, sin voces molestas. Archivos profesionales."
    }
  ];

  return (
    <section className="relative py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-5xl"
        >
          <div className="rounded-2xl border border-primary/30 bg-card/50 backdrop-blur-md p-8 md:p-12 shadow-glow">
            {/* Header */}
            <div className="text-center mb-12">
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-block mb-4 px-4 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium"
              >
                EL MODELO AGREGADOR
              </motion.span>
              
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold">
                NOSOTROS PAGAMOS LOS POOLS{" "}
                <span className="text-gradient-red">POR TI.</span>
              </h2>
              
              <p className="mt-6 max-w-2xl mx-auto font-sans text-lg text-muted-foreground">
                No pagues 5 membresías. Paga solo una. Nosotros hacemos el trabajo sucio 
                y te lo entregamos en bandeja de plata.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex flex-col items-center text-center p-6 rounded-xl bg-secondary/30 border border-white/5 transition-all duration-300 hover:border-primary/20 hover:bg-secondary/50"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-bold">{feature.title}</h3>
                  <p className="mt-2 font-sans text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AggregatorSection;
