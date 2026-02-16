import { motion } from "framer-motion";
import { Check, ShieldCheck, ArrowRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";

/* Inline SVG payment logos — compact, dark-theme-ready */

const StripeLogo = () => (
  <svg viewBox="0 0 60 25" className="h-6 w-auto" fill="none">
    <path
      d="M6.3 8.3c0-.8.7-1.2 1.8-1.2 1.6 0 3.6.5 5.2 1.4V3.8C11.6 3.1 9.9 2.8 8.1 2.8 3.5 2.8.5 5.1.5 8.6c0 5.4 7.4 4.6 7.4 6.9 0 1-.9 1.3-2 1.3-1.8 0-4-.7-5.8-1.7v4.8C2 21.1 4 21.7 5.9 21.7c5 0 8-2.5 8-6 0-5.8-7.6-4.8-7.6-7.4z"
      fill="#EFEFEF"
    />
    <text x="18" y="17" fill="#EFEFEF" fontSize="11" fontWeight="700" fontFamily="sans-serif">Stripe</text>
  </svg>
);

const VisaLogo = () => (
  <svg viewBox="0 0 48 16" className="h-4 w-auto" fill="none">
    <text x="0" y="13" fill="#1A1F71" fontSize="15" fontWeight="900" fontFamily="sans-serif" letterSpacing="-0.5">VISA</text>
    <rect x="0" y="0" width="48" height="16" rx="2" fill="none" stroke="#5E5E5E" strokeWidth="0.5" />
  </svg>
);

const MCLogo = () => (
  <svg viewBox="0 0 36 22" className="h-5 w-auto" fill="none">
    <circle cx="13" cy="11" r="8" fill="#EB001B" />
    <circle cx="23" cy="11" r="8" fill="#F79E1B" />
    <path d="M18 4.9a8 8 0 010 12.2 8 8 0 000-12.2z" fill="#FF5F00" />
  </svg>
);

const PayPalLogo = () => (
  <svg viewBox="0 0 60 18" className="h-5 w-auto" fill="none">
    <text x="0" y="14" fill="#009CDE" fontSize="13" fontWeight="800" fontFamily="sans-serif">Pay</text>
    <text x="24" y="14" fill="#012169" fontSize="13" fontWeight="800" fontFamily="sans-serif">Pal</text>
  </svg>
);

const paymentLogos = [
  { name: "Stripe", Component: StripeLogo },
  { name: "Visa", Component: VisaLogo },
  { name: "MasterCard", Component: MCLogo },
  { name: "PayPal", Component: PayPalLogo },
];

const TrustSecuritySection = () => {
  const { t, language } = useLanguage();
  const { trackEvent } = useAnalytics();
  const isSpanish = language === "es";

  return (
    <section className="relative bg-background-carbon/62 py-16 md:py-22">
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

              {/* Payment logos — real SVGs */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {paymentLogos.map(({ name, Component }) => (
                  <div
                    key={name}
                    className="flex items-center justify-center rounded-lg border border-border/88 bg-card px-3 py-2"
                  >
                    <Component />
                  </div>
                ))}
              </div>

              {/* Guarantee badge */}
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#AA0202]/40 bg-[#AA0202]/10 px-4 py-2">
                <Lock className="h-4 w-4 text-[#AA0202]" />
                <span className="font-sans text-sm font-semibold text-[#EFEFEF]">
                  {isSpanish
                    ? "Garantía 7 días · Devolución completa si no te convence"
                    : "7-day guarantee · Full refund if you're not convinced"}
                </span>
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
                <div className="flex items-center gap-2.5 text-foreground/90">
                  <Check className="h-4 w-4 text-success" />
                  <span>{isSpanish ? "Soporte en español vía WhatsApp" : "Support in Spanish via WhatsApp"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground/90">
                  <Check className="h-4 w-4 text-success" />
                  <span>{isSpanish ? "Más de 4,800 DJs activos" : "4,800+ active DJs"}</span>
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
