import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const GuaranteeSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative py-16 md:py-20 bg-muted/30 dark:bg-background-carbon">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-primary/30 bg-card dark:bg-card/60 backdrop-blur-md p-8 text-center shadow-lg dark:shadow-glow"
        >
          <div className="mb-4 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
            <ShieldCheck className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h3 className="mb-2 font-display text-xl font-bold text-foreground md:text-2xl tracking-wide">
              {t("guarantee.title")}
            </h3>
            <p className="font-sans text-sm text-muted-foreground md:text-base leading-relaxed mb-6">
              {t("guarantee.desc")}
            </p>
            <Button
              asChild
              size="lg"
              className="btn-primary-glow group h-14 px-8 text-base font-bold"
            >
              <Link to="/gratis">
                {t("hero.cta")}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default GuaranteeSection;
