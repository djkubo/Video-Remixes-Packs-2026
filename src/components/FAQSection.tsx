import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Qué diferencia a VideoRemixesPacks de otros pools?",
    answer:
      "Somos un agregador. Nosotros pagamos las membresías de múltiples pools, filtramos el contenido, corregimos los tags y te lo entregamos limpio en un solo lugar. Tú pagas una sola suscripción y accedes a todo.",
  },
  {
    question: "¿Cómo funciona la descarga masiva?",
    answer:
      "Te damos acceso FTP directo. Conectas FileZilla o Air Explorer, seleccionas las carpetas que quieres y descargas todo de golpe. Puedes sincronizar hasta 1TB mensual mientras duermes.",
  },
  {
    question: "¿La música tiene sellos o voces de otros pools?",
    answer:
      "No. Todo es Clean/Intro-Outro listo para mezclar. Sin logos de otros pools, sin marcas de agua. Archivos profesionales listos para tu set.",
  },
  {
    question: "¿Funciona con Serato/VirtualDJ/Rekordbox?",
    answer:
      "Sí, son archivos MP3 320kbps y MP4 1080p universales. Compatibles con cualquier software de DJ: Serato, VirtualDJ, Rekordbox, Traktor.",
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Sí. Sin contratos forzosos, sin letras chiquitas. Cancelas desde tu panel con un clic y listo. No hay permanencia mínima.",
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
