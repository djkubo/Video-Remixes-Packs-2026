import { CheckCheck } from "lucide-react";
import { motion } from "framer-motion";

interface Testimonial {
  id: string;
  name: string;
  city: string;
  flag: string;
  text: string;
  time: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "DJ Carlos R.",
    city: "CDMX, México",
    flag: "🇲🇽",
    text: "Ya lo compré bro, ya hasta me llegó. ¡Es una locura la cantidad de música! Saludos!",
    time: "14:32",
  },
  {
    id: "t2",
    name: "DJ Miguel Á.",
    city: "Miami, USA",
    flag: "🇺🇸",
    text: "Muchas gracias, ya las descargué todas. Muy buena música y todo organizado por género.",
    time: "18:45",
  },
  {
    id: "t3",
    name: "DJ Paola S.",
    city: "Bogotá, Colombia",
    flag: "🇨🇴",
    text: "Si el material es bueno, vale la pena. Excelente Gustavo, te la rifaste.",
    time: "21:15",
  },
  {
    id: "t4",
    name: "DJ Roberto L.",
    city: "Buenos Aires, Argentina",
    flag: "🇦🇷",
    text: "Llevo 3 meses y cada semana hay música nueva. Ya cancelé los otros 2 pools que tenía.",
    time: "09:12",
  },
  {
    id: "t5",
    name: "DJ Andrés M.",
    city: "Madrid, España",
    flag: "🇪🇸",
    text: "El FTP es un antes y después. Descargué 200GB en una noche mientras dormía. Brutal.",
    time: "23:05",
  },
  {
    id: "t6",
    name: "DJ Fernanda G.",
    city: "Lima, Perú",
    flag: "🇵🇪",
    text: "Lo probé 7 días gratis y al segundo día ya sabía que me iba a quedar. Los videos están increíbles.",
    time: "16:48",
  },
  {
    id: "t7",
    name: "DJ Tomás V.",
    city: "Santiago, Chile",
    flag: "🇨🇱",
    text: "El plan anual es la mejor decisión que tomé. Sale a $16/mes y tengo todo ilimitado.",
    time: "11:30",
  },
  {
    id: "t8",
    name: "DJ Luis E.",
    city: "Guadalajara, México",
    flag: "🇲🇽",
    text: "Los intros y outros limpios son la clave. Ningún otro pool me daba eso. 100% recomendado.",
    time: "20:18",
  },
  {
    id: "t9",
    name: "DJ Karen R.",
    city: "Houston, USA",
    flag: "🇺🇸",
    text: "Soy DJ de quinceañeras y bodas. Aquí encuentro TODO lo que necesito. Mejor que BPM y DJCity juntos.",
    time: "15:55",
  },
];

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      viewport={{ once: true }}
      className="rounded-xl border border-[#2A3942] bg-[#0B141A] p-4 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#202C33] text-lg">
          {testimonial.flag}
        </div>
        <div className="min-w-0">
          <p className="truncate font-sans text-sm font-semibold text-[#E9EDEF]">
            {testimonial.name}
          </p>
          <p className="font-sans text-[11px] text-[#8696A0]">{testimonial.city}</p>
        </div>
      </div>

      {/* Message bubble */}
      <div className="mt-3 rounded-lg rounded-tl-none border border-[#2A3942] bg-[#202C33] px-3 py-2.5">
        <p className="font-sans text-sm leading-relaxed text-[#E9EDEF]">
          {testimonial.text}
        </p>
        <div className="mt-1.5 flex items-center justify-end gap-1">
          <span className="text-[10px] text-[#8696A0]">{testimonial.time}</span>
          <CheckCheck className="h-3 w-3 text-[#53BDEB]" />
        </div>
      </div>
    </motion.div>
  );
}

export default function SocialProofSection() {
  return (
    <section className="bg-[#070707] px-4 pb-16 pt-12 md:pb-20 md:pt-16">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-3 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#AA0202]/30 bg-[#AA0202]/10 px-3 py-1 font-bebas text-xs uppercase tracking-widest text-[#AA0202]">
            ⭐ +4,800 DJs CONFÍAN EN NOSOTROS
          </span>
        </motion.div>

        <h2 className="text-center font-bebas text-4xl uppercase text-[#EFEFEF] md:text-5xl">
          DJs reales. Resultados reales.
        </h2>
        <p className="mb-10 mt-3 text-center font-sans text-muted-foreground">
          Cero inventos. Mensajes reales de DJs que ya descargan y mezclan nuestra música.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
