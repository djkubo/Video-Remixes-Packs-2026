import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

const FAQSection = () => {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  const faqs = isSpanish
    ? [
        {
          question: "¿Puedo cancelar cuando quiera?",
          answer: "Sí. No hay contrato forzoso ni permanencia mínima.",
        },
        {
          question: "¿Puedo escuchar demos antes de pagar?",
          answer: "Sí. Puedes validar catálogo, género y calidad antes de elegir plan.",
        },
        {
          question: "¿Funciona con Serato, VirtualDJ y Rekordbox?",
          answer: "Sí. Entregamos archivos compatibles y listos para mezclar.",
        },
        {
          question: "¿Qué soporte recibo si tengo dudas?",
          answer: "Soporte en español por WhatsApp y ayuda para acceso/descargas.",
        },
      ]
    : [
        {
          question: "Can I cancel anytime?",
          answer: "Yes. There are no forced contracts or minimum terms.",
        },
        {
          question: "Can I listen to demos before paying?",
          answer: "Yes. You can validate catalog quality and genres before choosing a plan.",
        },
        {
          question: "Does it work with Serato, VirtualDJ, and Rekordbox?",
          answer: "Yes. Files are delivered in formats ready to mix.",
        },
        {
          question: "What support do I get if I need help?",
          answer: "Spanish support via WhatsApp for account and download issues.",
        },
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
            {isSpanish ? "Objeciones antes de comprar" : "Buying objections answered"}
          </h2>
          <p className="font-sans text-lg text-muted-foreground">
            {isSpanish
              ? "Lo esencial sobre pago, compatibilidad, cancelación y soporte."
              : "The essentials about payment, compatibility, cancellation, and support."}
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
