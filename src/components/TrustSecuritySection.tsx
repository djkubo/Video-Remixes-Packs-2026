import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCheck, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const paymentMethods = [
  { name: "Stripe", logo: "Stripe" },
  { name: "Visa", logo: "VISA" },
  { name: "MasterCard", logo: "MC" },
  { name: "PayPal", logo: "PayPal" },
];

const TrustSecuritySection = () => {
  const { t } = useLanguage();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      message: t("testimonial1.message"),
      time: "14:32",
      name: t("testimonial1.name"),
    },
    {
      id: 2,
      message: t("testimonial2.message"),
      time: "18:45",
      name: t("testimonial2.name"),
    },
    {
      id: 3,
      message: t("testimonial3.message"),
      time: "22:15",
      name: t("testimonial3.name"),
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section className="relative py-24 md:py-32 bg-background overflow-hidden">
      <div className="absolute inset-0 hero-gradient opacity-30" />

      <div className="container relative z-10 mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/15 px-4 py-2 text-sm font-semibold text-success mb-6">
            <ShieldCheck className="h-4 w-4" />
            {t("trust.badge")}
          </span>
          <h2 className="font-display text-display-sm md:text-display-md font-extrabold">
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
          className="mb-16 flex flex-wrap items-center justify-center gap-6 md:gap-10"
        >
          {paymentMethods.map((method) => (
            <div
              key={method.name}
              className="flex items-center justify-center rounded-xl bg-card/50 border border-border/50 px-6 py-4 backdrop-blur-sm transition-smooth hover:border-primary/30 hover:bg-card"
            >
              <span className="font-bebas text-xl tracking-wider text-muted-foreground">
                {method.logo}
              </span>
            </div>
          ))}
        </motion.div>

        {/* WhatsApp Style Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mb-16 max-w-lg"
        >
          <div className="rounded-2xl bg-card p-6 shadow-card border border-border">
            {/* WhatsApp Header */}
            <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-lg">
                🎧
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("trust.group")}</p>
                <p className="text-xs text-muted-foreground">{t("trust.members")}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="min-h-[120px] relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="flex justify-end"
                >
                  <div className="relative max-w-[85%]">
                    <div className="absolute -right-2 top-0 h-4 w-4 overflow-hidden">
                      <div className="h-4 w-4 origin-bottom-left rotate-45 transform bg-primary" />
                    </div>
                    
                    <div className="rounded-lg rounded-tr-none bg-primary px-4 py-3 text-primary-foreground shadow-lg">
                      <p className="text-[15px] leading-relaxed">
                        {testimonials[currentTestimonial].message}
                      </p>
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <span className="text-[11px] text-primary-foreground/70">
                          {testimonials[currentTestimonial].time}
                        </span>
                        <CheckCheck className="h-4 w-4 text-primary-foreground/80" />
                      </div>
                    </div>
                    
                    <p className="mt-1 text-right text-xs text-muted-foreground">
                      — {testimonials[currentTestimonial].name}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots */}
            <div className="mt-4 flex justify-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? "w-6 bg-primary"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-border/50 bg-card/50 px-6 py-4 backdrop-blur-sm">
            <Check className="h-5 w-5 text-success" />
            <p className="text-muted-foreground font-sans">
              <span className="font-semibold text-foreground">{t("trust.cancel")}</span>{" "}
              {t("trust.noContracts")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSecuritySection;
