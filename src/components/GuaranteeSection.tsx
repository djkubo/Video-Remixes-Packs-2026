import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const GuaranteeSection = () => {
  const { t, language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <section className="relative bg-background-carbon/66 py-14 md:py-18">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-[#5E5E5E]/88 bg-[#111111] p-8 text-center shadow-[0_12px_24px_rgba(15,23,42,0.1)]"
        >
          <div className="mb-4 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-primary/45 bg-[#111111]">
            <ShieldCheck className="h-7 w-7 text-primary" strokeWidth={1.6} />
          </div>
          <div className="text-center">
            <h3 className="mb-2 font-bebas text-2xl font-bold text-[#EFEFEF] md:text-3xl">
              {t("guarantee.title")}
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-zinc-400 md:text-base">
              {t("guarantee.desc")}
            </p>
            <p className="mb-4 text-xs uppercase tracking-[0.12em] text-zinc-400">
              {isSpanish ? "Sin riesgo · sin permanencia · soporte humano" : "No risk · no lock-in · human support"}
            </p>
            <Button
              asChild
              size="lg"
              className="btn-primary-glow group h-12 px-7 text-sm font-bold md:text-base"
            >
              <a href="https://videoremixespacks.com/plan" rel="noopener noreferrer">
                {t("cta.button")}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default GuaranteeSection;
