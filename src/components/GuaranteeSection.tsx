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
              SIN CONTRATOS. SIN COMPROMISOS.
            </h3>
            <p className="font-sans text-sm text-muted-foreground md:text-base">
              Cancela cuando quieras desde tu panel. Un clic y listo. 
              Sin llamadas, sin emails, sin letras chiquitas.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default GuaranteeSection;
