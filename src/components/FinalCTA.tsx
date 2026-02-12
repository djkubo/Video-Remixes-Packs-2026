import { motion } from "framer-motion";
import { Check, ArrowRight, Shield, Clock, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataLayer } from "@/hooks/useDataLayer";
import { useAnalytics } from "@/hooks/useAnalytics";

const FinalCTA = () => {
  const { t, language } = useLanguage();
  const { trackClick } = useDataLayer();
  const { trackEvent } = useAnalytics();

  const handleCTAClick = (buttonText: string) => {
    trackClick(buttonText);
    trackEvent("click", {
      button_text: buttonText,
      section: "final_cta",
      cta_id: "final_cta_ver_planes",
      plan_id: "plan_2tb_anual",
      funnel_step: "decision",
    });
  };

  const benefits = [
    { icon: Zap, text: t("cta.benefit1") },
    { icon: Check, text: t("cta.benefit2") },
    { icon: Shield, text: t("cta.benefit3") },
    { icon: Clock, text: t("cta.benefit4") },
  ];

  return (
    <section className="relative border-y border-border/75 bg-background-carbon/58 py-18 md:py-22">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto max-w-5xl"
        >
          <div className="rounded-3xl border border-border/88 bg-card p-8 shadow-[0_14px_30px_rgba(15,23,42,0.1)] md:p-12">
            <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:items-center">
              <div>
                <h2 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
                  {t("cta.title")} <span className="text-primary">{t("cta.titleHighlight")}</span>
                </h2>

                <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                  {t("cta.subtitleSimple")}
                </p>

                <Button
                  asChild
                  size="lg"
                  className="btn-primary-glow mt-7 h-12 w-full gap-2 px-6 text-sm font-bold md:w-auto md:text-base"
                  onClick={() => handleCTAClick(t("cta.button"))}
                >
                  <Link to="/plan">
                    {t("cta.button")}
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Link>
                </Button>

                <p className="mt-4 text-xs tracking-wide text-muted-foreground">
                  FTP / AIR EXPLORER • 320KBPS / 1080P •{" "}
                  {language === "es" ? "soporte incluido" : "support included"}
                </p>
              </div>

              <div className="grid gap-3">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.text}
                    className="flex items-center gap-3 rounded-xl border border-border/85 bg-background px-4 py-3 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/45 bg-card">
                      <benefit.icon className="h-4.5 w-4.5 text-primary" strokeWidth={1.8} />
                    </div>
                    <span className="text-sm font-medium text-foreground/95">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
