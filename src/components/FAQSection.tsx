import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Cómo funciona la Prueba Gratis?",
    answer:
      "Tienes 7 días y 100GB para descargar todo lo que quieras. Si no te gusta, cancelas con un clic desde tu panel. Sin preguntas, sin compromisos.",
  },
  {
    question: "¿Puedo usar gestores de descarga?",
    answer:
      "Sí, soportamos FileZilla y Air Explorer para descarga masiva. Te damos acceso FTP directo para sincronizar tu librería completa en minutos.",
  },
  {
    question: "¿La música tiene sellos o voces?",
    answer:
      "No. Todo es Clean/Intro-Outro listo para mezclar. Sin logos de otros pools, sin marcas de agua. Archivos profesionales listos para tu set.",
  },
  {
    question: "¿Funciona con Serato/VirtualDJ?",
    answer:
      "Sí, son archivos MP3 320kbps y MP4 1080p universales. Compatibles con cualquier software de DJ: Serato, VirtualDJ, Rekordbox, Traktor.",
  },
];

const FAQSection = () => {
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
            PREGUNTAS FRECUENTES
          </h2>
          <p className="font-sans text-lg text-muted-foreground">
            Todo lo que necesitas saber antes de empezar
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
                className="rounded-xl border border-white/10 bg-card/30 backdrop-blur-sm px-6 transition-all duration-300 data-[state=open]:border-primary/50 data-[state=open]:shadow-glow"
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
