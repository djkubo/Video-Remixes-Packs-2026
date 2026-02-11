import { motion } from "framer-motion";
import { CircleHelp, FolderSearch, Rocket } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const HowItWorksSection = () => {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  const steps = [
    {
      icon: CircleHelp,
      title: isSpanish ? "Problema real" : "Real problem",
      description: isSpanish
        ? "Perder horas buscando música entre pools y carpetas sueltas."
        : "Losing hours searching across pools and scattered folders.",
    },
    {
      icon: FolderSearch,
      title: isSpanish ? "Solución simple" : "Simple solution",
      description: isSpanish
        ? "Un solo catálogo con demos por género y estructura clara."
        : "One catalog with genre demos and clear structure.",
    },
    {
      icon: Rocket,
      title: isSpanish ? "Resultado" : "Outcome",
      description: isSpanish
        ? "Más tiempo para tocar mejor y menos fricción antes de cada evento."
        : "More time to perform better with less pre-gig friction.",
    },
  ];

  return (
    <section className="relative bg-background py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {isSpanish ? "Cómo funciona" : "How it works"}
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl lg:text-6xl">
            {isSpanish ? "Más claro, más rápido, más rentable" : "Clearer, faster, more profitable"}
          </h2>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border/80 bg-card p-6 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                {step.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
