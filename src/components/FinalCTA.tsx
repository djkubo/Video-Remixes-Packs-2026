import { motion } from "framer-motion";
import { Check, ArrowRight, Shield, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const FinalCTA = () => {
  const { t, language } = useLanguage();

  const benefits = [
    { icon: Zap, text: t("cta.benefit1") },
    { icon: Check, text: t("cta.benefit2") },
    { icon: Shield, text: t("cta.benefit3") },
    { icon: Clock, text: t("cta.benefit4") },
  ];

  return (
    <section className="relative py-24 md:py-32 bg-muted/20 dark:bg-background-carbon">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <div className="glow-border relative overflow-hidden bg-card dark:bg-gradient-to-b dark:from-card-elevated dark:to-card p-10 md:p-14">
            {/* Background accent */}
            <div className="absolute inset-0 hero-gradient opacity-50" />
            
            <div className="relative z-10 text-center">
              {/* Heading */}
              <h2 className="font-display text-display-sm md:text-display-md font-extrabold text-foreground">
                {t("cta.title")}{" "}
                <span className="text-gradient-red">{t("cta.titleHighlight")}</span>
              </h2>

              <p className="mx-auto mt-6 max-w-xl text-muted-foreground font-sans text-lg">
                {t("cta.subtitleSimple")}
              </p>

              {/* Benefits grid */}
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.text}
                    className="flex items-center gap-4 rounded-xl bg-muted/50 dark:bg-secondary/40 border border-border p-4 text-left transition-all duration-300 hover:border-primary/30 hover:shadow-md dark:hover:shadow-none"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
                      <benefit.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="font-sans text-sm font-medium text-foreground/90">{benefit.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="mt-12">
                <Button
                  asChild
                  size="lg"
                  className="btn-primary-glow animate-pulse-glow group h-16 w-full max-w-md px-10 text-lg font-bold sm:w-auto"
                >
                  <a href="https://videoremixespacks.com/plan" target="_blank" rel="noopener noreferrer">
                    {t("cta.button")}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>

              <p className="mt-8 font-bebas text-sm tracking-widest text-muted-foreground">
                FTP / AIR EXPLORER • 320KBPS / 1080P • {language === "es" ? "SOPORTE INCLUIDO" : "SUPPORT INCLUDED"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;