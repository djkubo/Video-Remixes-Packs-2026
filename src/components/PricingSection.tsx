import { motion } from "framer-motion";
import { Check, ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";

const PricingSection = () => {
  const { t, language } = useLanguage();
  const { convertPrice, currency } = useCurrency();

  const plans = [
    {
      name: t("pricing.monthly"),
      priceUSD: 35,
      period: currency.code === "USD" ? t("pricing.monthlyPrice") : `${currency.code} / ${language === "es" ? "mes" : "month"}`,
      badge: null,
      features: [
        t("pricing.feat1"),
        t("pricing.feat2"),
        t("pricing.feat3"),
      ],
      highlighted: false,
      cta: t("pricing.ctaMonthly"),
    },
    {
      name: t("pricing.annual"),
      priceUSD: 195,
      period: currency.code === "USD" ? t("pricing.annualPrice") : `${currency.code} / ${language === "es" ? "año" : "year"}`,
      badge: t("pricing.bestValue"),
      equivalentMonthly: 16.25,
      features: [
        t("pricing.feat4"),
        t("pricing.feat5"),
        t("pricing.feat6"),
      ],
      highlighted: true,
      cta: t("pricing.ctaAnnual"),
    },
  ];

  return (
    <section id="pricing" className="relative py-24 md:py-32 bg-background overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />
      
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
            {t("pricing.badge")}
          </span>
          <h2 className="font-display text-display-md md:text-display-lg font-extrabold">
            {t("pricing.title")}{" "}
            <span className="text-gradient-red">{t("pricing.titleHighlight")}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-sans text-lg text-muted-foreground">
            {t("pricing.subtitle")}
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2 md:items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`group relative ${
                plan.highlighted ? "md:-my-4 z-10" : ""
              }`}
            >
              {/* Gold glow for highlighted */}
              {plan.highlighted && (
                <div className="absolute -inset-[3px] rounded-3xl bg-gradient-to-r from-gold via-gold-light to-gold animate-pulse-gold opacity-70" />
              )}

              {/* Card */}
              <div
                className={`relative h-full flex flex-col rounded-3xl p-8 md:p-10 transition-all duration-500 ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-card-elevated to-card border-2 border-gold/50 shadow-glow-gold"
                    : "glass-card-hover"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="badge-gold">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className={`text-center ${plan.badge ? "mt-4" : ""}`}>
                  <h3 className="font-bebas text-2xl tracking-wider text-muted-foreground">
                    {plan.name}
                  </h3>
                  
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className={`font-display text-5xl md:text-6xl font-extrabold ${
                      plan.highlighted ? "text-gradient-gold" : "text-foreground"
                    }`}>
                      {convertPrice(plan.priceUSD)}
                    </span>
                  </div>
                  <span className="font-sans text-sm text-muted-foreground">
                    {plan.period}
                  </span>

                  {plan.highlighted && plan.equivalentMonthly && (
                    <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-success/20 px-4 py-1 text-sm font-semibold text-success">
                      <Check className="h-4 w-4" />
                      {language === "es" ? "Equivale a" : "Equivalent to"} {convertPrice(plan.equivalentMonthly)}/{language === "es" ? "mes" : "month"}
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="my-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Features */}
                <ul className="mb-8 flex-1 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        plan.highlighted
                          ? "bg-gold/20 text-gold"
                          : "bg-primary/20 text-primary"
                      }`}>
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                      <span className="font-sans text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  asChild
                  size="lg"
                  className={`w-full h-14 text-base font-bold transition-smooth ${
                    plan.highlighted
                      ? "btn-gold-glow"
                      : "bg-secondary hover:bg-secondary/80 text-foreground"
                  }`}
                >
                  <a href="https://videoremixespacks.com/plan">
                    {plan.highlighted && <Crown className="mr-2 h-5 w-5" />}
                    {plan.cta}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Currency notice */}
        {currency.code !== "USD" && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-sm text-muted-foreground"
          >
            {language === "es" 
              ? `* Precios mostrados en ${currency.name} como referencia. El cobro se realiza en USD.`
              : `* Prices shown in ${currency.name} for reference. Charged in USD.`
            }
          </motion.p>
        )}
      </div>
    </section>
  );
};

export default PricingSection;