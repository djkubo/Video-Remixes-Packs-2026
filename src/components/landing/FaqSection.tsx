import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FaqItem = {
  id: string;
  q: string;
  a: string;
};

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    q: "¿Cuánto cuesta?",
    a: "Pack Individual: $35 USD (pago único). Membresía: $35 USD/mes (acceso completo). USB 128GB: $147 USD (envío gratis).",
  },
  {
    id: "faq-2",
    q: "¿Cómo hago para descargar?",
    a: "Al completar tu pago, recibes acceso inmediato a nuestras carpetas privadas en Google Drive. Descarga la carpeta completa por género o canción por canción.",
  },
  {
    id: "faq-3",
    q: "¿Funciona con Serato o Virtual DJ?",
    a: "Sí. Son archivos MP3 universales a 320kbps, listos para arrastrar a Serato, Virtual DJ, Rekordbox, Traktor o cualquier software.",
  },
  {
    id: "faq-4",
    q: "¿Es mensual o pago único?",
    a: "Tienes las dos opciones. El pack individual de $35 y la USB de $147 son PAGO ÚNICO (tuyos para siempre). La membresía de $35 es MENSUAL y puedes cancelar cuando quieras con un solo clic.",
  },
];

export default function FaqSection() {
  return (
    <section className="bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Preguntas Frecuentes</h2>
        <p className="mt-3 text-center text-zinc-400">Todo claro, sin letras pequeñas.</p>

        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {FAQS.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4"
            >
              <AccordionTrigger className="py-4 text-left text-zinc-100 hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-zinc-400">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

