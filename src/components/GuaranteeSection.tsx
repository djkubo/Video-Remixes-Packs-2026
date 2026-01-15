import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const GuaranteeSection = () => {
  return (
    <section className="relative py-12 md:py-16 bg-background-carbon">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-primary/30 bg-card/30 backdrop-blur-md p-8 text-center shadow-glow md:flex-row md:gap-6 md:text-left"
        >
          <div className="mb-4 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 md:mb-0">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="mb-2 font-display text-xl font-bold text-foreground md:text-2xl">
              GARANTÍA DE CALIDAD DE PISTA
            </h3>
            <p className="font-sans text-sm text-muted-foreground md:text-base">
              Si el audio no revienta las bocinas como esperas, cancelas sin costo. 
              Sin preguntas, sin complicaciones. Tu satisfacción es nuestra prioridad.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default GuaranteeSection;
