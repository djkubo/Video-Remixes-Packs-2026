import { motion } from "framer-motion";
import { Check, ArrowRight, Zap, Crown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const PricingSection = () => {
  const plans = [
    {
      name: "MENSUAL",
      price: "$35",
      period: "/mes",
      subtitle: "Para el DJ activo",
      badge: null,
      features: [
        "1TB Mensual de descargas",
        "Actualizaciones semanales",
        "Acceso FTP / Air Explorer",
        "+60 géneros organizados",
        "Archivos Clean sin logos",
        "Soporte por email"
      ],
      highlighted: false
    },
    {
      name: "ANUAL",
      price: "$195",
      period: "/año",
      subtitle: "Equivale a $16.25/mes",
      badge: "MEJOR OPCIÓN • TAX DEDUCTIBLE",
      features: [
        "2TB Mensuales de descargas",
        "Actualizaciones diarias",
        "Doble velocidad de descarga",
        "Acceso prioritario a nuevo contenido",
        "Soporte prioritario",
        "Ahorro masivo: Paga una vez y olvídate"
      ],
      highlighted: true
    }
  ];

  return (
    <section className="relative py-20 md:py-28 bg-background-carbon">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold">
            PLANES SIMPLES.{" "}
            <span className="text-gradient-red">VALOR REAL.</span>
          </h2>
          <p className="mt-4 font-sans text-lg text-muted-foreground max-w-2xl mx-auto">
            El tiempo es tu activo más caro. Deja de perderlo buscando música en 5 lugares diferentes.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mx-auto max-w-4xl grid gap-8 md:grid-cols-2">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 md:p-10 ${
                plan.highlighted
                  ? "bg-card/60 backdrop-blur-md border-2 border-primary shadow-glow-intense"
                  : "bg-card/40 backdrop-blur-md border border-white/10"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
                    <Crown className="h-3 w-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="font-display text-xl font-bold text-muted-foreground">
                  PLAN {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="font-display text-5xl md:text-6xl font-bold text-primary">
                    {plan.price}
                  </span>
                  <span className="font-sans text-lg text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-2 font-sans text-sm text-muted-foreground">{plan.subtitle}</p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <span className="font-sans text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                asChild
                size="lg"
                className={`w-full h-14 font-bold transition-all duration-300 hover:scale-105 ${
                  plan.highlighted
                    ? "shadow-glow-intense animate-pulse-glow"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
                variant={plan.highlighted ? "default" : "secondary"}
              >
                <a href="https://videoremixespacks.com/plan">
                  {plan.highlighted ? "ELEGIR PLAN ANUAL" : "ELEGIR PLAN MENSUAL"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Guarantee Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full bg-card/50 backdrop-blur-sm border border-primary/20 px-6 py-4">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-sans text-foreground">
              <strong className="text-primary">Prueba de Fuego:</strong> 7 Días Gratis (100GB). 
              Entra, mira y descarga. Si no te gusta, cancelas.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
