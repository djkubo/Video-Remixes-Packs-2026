import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const GuaranteeSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative py-16 md:py-20 bg-muted/30 dark:bg-background-carbon">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-primary/30 bg-card dark:bg-card/60 backdrop-blur-md p-8 text-center shadow-lg dark:shadow-glow md:flex-row md:gap-6 md:text-left"
        >
          <div className="mb-4 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 md:mb-0">
            <ShieldCheck className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="mb-2 font-display text-xl font-bold text-foreground md:text-2xl tracking-wide">
              {t("guarantee.title")}
            </h3>
            <p className="font-sans text-sm text-muted-foreground md:text-base leading-relaxed">
              {t("guarantee.desc")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default GuaranteeSection;
