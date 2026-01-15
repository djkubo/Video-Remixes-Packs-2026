import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "DJ Alex Mix",
    location: "Miami",
    text: "Bro, la organización por BPM me salvó la vida en la boda de ayer. Calidad impecable.",
  },
  {
    name: "Carlos DJ",
    location: "CDMX",
    text: "He probado 5 pools y este es el único que descargas 1TB real sin errores. Air Explorer vuela.",
  },
  {
    name: "DJ Tona",
    location: "Residente",
    text: "Los videos intro/outro vienen limpios sin logos. Mis pantallas se ven pro. 10/10.",
  },
];

const StarRating = () => (
  <div className="mb-3 flex gap-1">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className="h-4 w-4 fill-primary text-primary"
      />
    ))}
  </div>
);

const TestimonialsSection = () => {
  return (
    <section className="relative py-16 md:py-24 bg-background-carbon">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 font-display text-4xl font-bold md:text-5xl lg:text-6xl">
            LO QUE DICEN LOS DJS
          </h2>
          <p className="font-sans text-lg text-muted-foreground">
            Profesionales que ya transformaron su flujo de trabajo
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="group rounded-2xl bg-card/50 backdrop-blur-md border border-white/10 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-glow"
            >
              <StarRating />
              <p className="mb-4 font-sans text-base text-foreground/90 italic">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-display text-sm font-bold text-primary">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="font-sans text-xs text-muted-foreground">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
