import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

const FAQSection = () => {
  const { t } = useLanguage();

  const faqs = [
    { question: t("faq1.question"), answer: t("faq1.answer") },
    { question: t("faq2.question"), answer: t("faq2.answer") },
    { question: t("faq3.question"), answer: t("faq3.answer") },
    { question: t("faq4.question"), answer: t("faq4.answer") },
    { question: t("faq5.question"), answer: t("faq5.answer") },
  ];

  return (
    <section className="relative py-16 md:py-24 bg-background">
      <div className="container mx-auto max-w-3xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 font-display text-4xl font-bold md:text-5xl lg:text-6xl">
            {t("faq.title")}{" "}
            <span className="text-gradient-red">{t("faq.titleHighlight")}</span>
          </h2>
          <p className="font-sans text-lg text-muted-foreground">
            {t("faq.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm px-6 transition-all duration-300 data-[state=open]:border-primary/50 data-[state=open]:shadow-glow"
              >
                <AccordionTrigger className="py-5 font-display text-base font-semibold text-foreground hover:text-primary hover:no-underline md:text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 font-sans text-sm text-muted-foreground md:text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
