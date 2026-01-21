import { motion } from "framer-motion";
import { FolderCheck, MonitorPlay, HeadphonesIcon } from "lucide-react";

const TrustBar = () => {
  const rules = [
    {
      icon: FolderCheck,
      title: "Organización Suprema",
      description: "Por género, BPM y año. Nunca 'Varios'."
    },
    {
      icon: MonitorPlay,
      title: "Calidad Profesional",
      description: "MP3 320kbps + Video 1080p."
    },
    {
      icon: HeadphonesIcon,
      title: "Archivos Clean",
      description: "Sin logos. Sin marcas de agua."
    }
  ];

  return (
    <section className="relative py-12 md:py-16 bg-background border-t border-white/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h3 className="font-display text-xl md:text-2xl font-bold text-muted-foreground">
            REGLAS DE ORO
          </h3>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
          {rules.map((rule, index) => (
            <motion.div
              key={rule.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-card/30 backdrop-blur-sm border border-white/5 transition-all duration-300 hover:border-primary/20"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <rule.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-foreground">{rule.title}</h4>
                <p className="font-sans text-xs text-muted-foreground">{rule.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
