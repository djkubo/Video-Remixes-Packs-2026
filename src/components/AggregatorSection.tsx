import { motion } from "framer-motion";
import { DollarSign, Trash2, Tag, Gift, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const AggregatorSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: DollarSign,
      title: t("aggregator.feat1.title"),
      description: t("aggregator.feat1.desc"),
      step: 1,
    },
    {
      icon: Trash2,
      title: t("aggregator.feat2.title"),
      description: t("aggregator.feat2.desc"),
      step: 2,
    },
    {
      icon: Tag,
      title: t("aggregator.feat3.title"),
      description: t("aggregator.feat3.desc"),
      step: 3,
    },
    {
      icon: Gift,
      title: t("aggregator.feat4.title"),
      description: t("aggregator.feat4.desc"),
      step: 4,
      isResult: true,
    },
  ];

  return (
    <section className="relative py-24 md:py-32 bg-muted/20 dark:bg-background-carbon">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-5xl"
        >
          <div className="glow-border bg-card dark:bg-gradient-to-b dark:from-card-elevated dark:to-card p-8 md:p-14">
            {/* Header */}
            <div className="text-center mb-14">
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="badge-primary mb-6"
              >
                {t("aggregator.badge")}
              </motion.span>
              
              <h2 className="font-display text-display-sm md:text-display-md font-extrabold text-foreground">
                {t("aggregator.title")}{" "}
                <span className="text-gradient-red">{t("aggregator.titleHighlight")}</span>
              </h2>
              
              <p className="mt-6 max-w-2xl mx-auto font-sans text-lg text-muted-foreground">
                {t("aggregator.subtitle")}
              </p>
            </div>

            {/* Pipeline Flow - Visual storytelling */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 relative">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="relative flex flex-col"
                >
                  {/* Connector arrow - visible between items on desktop */}
                  {index < features.length - 1 && (
                    <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-primary/40">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  )}
                  
                  <div 
                    className={`
                      group flex flex-col items-center text-center p-6 rounded-2xl 
                      bg-muted/50 dark:bg-secondary/40 border border-border 
                      transition-all duration-300 hover:border-primary/30 
                      hover:bg-muted dark:hover:bg-secondary/60 hover:shadow-md dark:hover:shadow-none
                      h-full
                      ${feature.isResult ? 'ring-1 ring-primary/20 dark:ring-primary/30' : ''}
                    `}
                  >
                    {/* Step indicator */}
                    <div className="absolute -top-2 left-4 bg-background dark:bg-card px-2 py-0.5 rounded text-xs font-mono text-muted-foreground">
                      {String(feature.step).padStart(2, '0')}
                    </div>
                    
                    {/* Icon with glow effect on final result */}
                    <div 
                      className={`
                        mb-5 flex h-14 w-14 items-center justify-center rounded-xl 
                        bg-primary/10 dark:bg-primary/15 group-hover:bg-primary/20 
                        transition-all duration-300
                        ${feature.isResult ? 'shadow-[0_0_25px_hsl(1_99%_34%/0.35)] dark:shadow-[0_0_30px_hsl(1_99%_34%/0.4)]' : ''}
                      `}
                    >
                      <feature.icon 
                        className={`h-7 w-7 text-primary ${feature.isResult ? 'drop-shadow-[0_0_8px_hsl(1_99%_34%/0.6)]' : ''}`} 
                        strokeWidth={1.5} 
                      />
                    </div>
                    
                    <h3 className="font-display text-lg font-bold tracking-wide text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 font-sans text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                    
                    {/* Result badge */}
                    {feature.isResult && (
                      <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Tu Librería
                      </div>
                    )}
                  </div>
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
