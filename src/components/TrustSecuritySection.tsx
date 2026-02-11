import { motion } from "framer-motion";
import { Check, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";

const paymentMethods = [
  { name: "Stripe", logo: "Stripe" },
  { name: "Visa", logo: "VISA" },
  { name: "MasterCard", logo: "MC" },
  { name: "PayPal", logo: "PayPal" },
];

const TrustSecuritySection = () => {
  const { t } = useLanguage();
  const { trackEvent } = useAnalytics();

  return (
    <section className="relative py-20 md:py-28 bg-background overflow-hidden">
      <div className="absolute inset-0 hero-gradient opacity-30" />

      <div className="container relative z-10 mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/15 px-4 py-2 text-sm font-semibold text-success mb-6">
            <ShieldCheck className="h-4 w-4" />
            {t("trust.badge")}
          </span>
          <h2 className="font-display text-display-sm md:text-display-md font-extrabold text-foreground">
            {t("trust.title")}{" "}
            <span className="text-gradient-red">{t("trust.titleHighlight")}</span>
          </h2>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12 flex flex-wrap items-center justify-center gap-6 md:gap-10"
        >
          {paymentMethods.map((method) => (
            <div
              key={method.name}
              className="flex items-center justify-center rounded-xl bg-card border border-border px-6 py-4 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-muted dark:hover:bg-card/80 hover:shadow-md dark:hover:shadow-none"
            >
              <span className="font-bebas text-xl tracking-wider text-muted-foreground">
                {method.logo}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Guarantee & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-6 py-4 backdrop-blur-sm shadow-md dark:shadow-none">
            <Check className="h-5 w-5 text-success" />
            <p className="text-muted-foreground font-sans">
              <span className="font-semibold text-foreground">{t("trust.cancel")}</span>{" "}
              {t("trust.noContracts")}
            </p>
          </div>
          
          {/* CTA Button */}
          <div>
            <Button
              asChild
              size="lg"
              className="btn-primary-glow group h-14 px-10 text-base font-bold"
              onClick={() =>
                trackEvent("click", {
                  button_text: t("cta.button"),
                  section: "trust_security",
                  cta_id: "trust_ver_planes",
                  plan_id: "plan_2tb_anual",
                  funnel_step: "decision",
                })
              }
            >
              <Link to="/plan">
                {t("cta.button")}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSecuritySection;
