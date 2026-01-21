import { motion } from "framer-motion";
import { CloudLightning, FolderCheck, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PremiumFeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: CloudLightning,
      title: t("premium.feat1.title"),
      description: t("premium.feat1.desc"),
    },
    {
      icon: FolderCheck,
      title: t("premium.feat2.title"),
      description: t("premium.feat2.desc"),
    },
    {
      icon: ShieldCheck,
      title: t("premium.feat3.title"),
      description: t("premium.feat3.desc"),
    },
  ];

  return (
    <section className="relative py-24 md:py-32 bg-muted/20 dark:bg-background-carbon overflow-hidden">
      <div className="absolute inset-0 hero-gradient opacity-30" />

      <div className="container relative z-10 mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="badge-primary mb-6">
            {t("premium.badge")}
          </span>
          <h2 className="font-display text-display-sm md:text-display-md font-extrabold text-foreground">
            {t("premium.title")}{" "}
            <span className="text-gradient-red">{t("premium.titleHighlight")}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            {t("premium.subtitle")}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-3 md:gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group"
            >
              <div className="glass-card-hover h-full p-8">
                {/* Icon */}
                <div className="relative mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/15 group-hover:bg-primary/20 transition-all duration-300">
                    <feature.icon className="h-8 w-8 text-primary" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Content */}
                <h3 className="mb-3 font-display text-xl font-bold tracking-wide text-foreground md:text-2xl">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumFeaturesSection;