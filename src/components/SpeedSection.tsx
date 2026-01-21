import { motion } from "framer-motion";
import { Zap, Server, Cloud, Download, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const SpeedSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Server,
      title: t("speed.feat1.title"),
      description: t("speed.feat1.desc"),
    },
    {
      icon: Cloud,
      title: t("speed.feat2.title"),
      description: t("speed.feat2.desc"),
    },
    {
      icon: Download,
      title: t("speed.feat3.title"),
      description: t("speed.feat3.desc"),
    },
    {
      icon: Clock,
      title: t("speed.feat4.title"),
      description: t("speed.feat4.desc"),
    },
  ];

  return (
    <section className="relative overflow-hidden py-24 md:py-32 bg-background">
      <div className="absolute inset-0 hero-gradient opacity-40" />
      
      <div className="container relative z-10 mx-auto">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glow-border bg-gradient-to-b from-card-elevated to-card p-8 md:p-14"
          >
            {/* Header */}
            <div className="text-center mb-12">
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="badge-primary mb-6"
              >
                {t("speed.badge")}
              </motion.span>
              
              <h2 className="font-display text-display-sm md:text-display-md font-extrabold leading-tight">
                {t("speed.title1")}{" "}
                <span className="text-gradient-red">{t("speed.title2")}</span>{" "}
                {t("speed.title3")}
              </h2>
              
              <p className="mt-6 max-w-2xl mx-auto font-sans text-lg text-muted-foreground">
                {t("speed.subtitle")}
              </p>
            </div>

            {/* Main Feature */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30 animate-float">
                <Zap className="h-12 w-12 text-primary" strokeWidth={1.5} />
              </div>
              
              <div className="text-center md:text-left">
                <h3 className="font-display text-2xl md:text-3xl font-bold">
                  {t("speed.ftpTitle")}
                </h3>
                <p className="mt-2 font-sans text-lg text-muted-foreground">
                  {t("speed.ftpDesc")}
                </p>
              </div>
            </div>

            {/* Features grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group flex flex-col items-center rounded-2xl bg-secondary/40 border border-border/50 p-6 text-center transition-smooth hover:bg-secondary/60 hover:border-primary/30"
                >
                  <feature.icon className="mb-4 h-10 w-10 text-primary group-hover:scale-110 transition-smooth" strokeWidth={1.5} />
                  <h3 className="font-display text-lg font-bold tracking-wide">{feature.title}</h3>
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