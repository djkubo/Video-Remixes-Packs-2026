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
  const { t, language } = useLanguage();
  const { trackEvent } = useAnalytics();
  const isSpanish = language === "es";

  return (
    <section className="relative bg-background py-16 md:py-22">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-border/88 bg-card p-6 shadow-[0_14px_30px_rgba(15,23,42,0.1)] md:p-10"
        >
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-success/35 bg-success/12 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-success">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("trust.badge")}
              </span>
              <h2 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight md:text-5xl">
                {t("trust.title")} <span className="text-primary">{t("trust.titleHighlight")}</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {isSpanish
                  ? "Pagos protegidos, acceso claro y soporte real para que compres con confianza."
                  : "Protected payments, clear access, and real support so you buy with confidence."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                {paymentMethods.map((method) => (
                  <div
                    key={method.name}
                    className="rounded-lg border border-border/88 bg-card px-3 py-2 text-xs font-semibold text-foreground/85"
                  >
                    {method.logo}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/88 bg-background-carbon/35 p-5">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2.5 text-foreground/90">
                  <Check className="h-4 w-4 text-success" />
                  <span>{t("trust.cancel")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground/90">
                  <Check className="h-4 w-4 text-success" />
                  <span>{t("trust.noContracts")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground/90">
                  <Check className="h-4 w-4 text-success" />
                  <span>{isSpanish ? "Checkout seguro en segundos" : "Secure checkout in seconds"}</span>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className="btn-primary-glow mt-6 h-12 w-full text-sm font-bold"
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
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSecuritySection;
