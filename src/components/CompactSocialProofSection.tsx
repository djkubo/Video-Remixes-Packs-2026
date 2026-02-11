import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const CompactSocialProofSection = () => {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  const highlights = [
    {
      value: "7,000+",
      label: isSpanish ? "DJs latinos en comunidad" : "Latin DJs in community",
    },
    {
      value: "4.9/5",
      label: isSpanish ? "Satisfacción en soporte" : "Support satisfaction",
    },
    {
      value: "50K+",
      label: isSpanish ? "Canciones listas para mezclar" : "Gig-ready tracks",
    },
  ];

  const quotes = isSpanish
    ? [
        "“Entré por los demos y terminé quedándome por la organización.”",
        "“Con FTP dejo todo sincronizando y me levanto con biblioteca nueva.”",
      ]
    : [
        '"I joined for the demos and stayed for the organization."',
        '"With FTP I sync overnight and wake up with a fresh library."',
      ];

  return (
    <section className="relative bg-muted/20 py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="glass-card p-6 md:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                <Star className="h-3.5 w-3.5" />
                {isSpanish ? "Prueba social" : "Social proof"}
              </p>
              <h2 className="mt-3 font-display text-3xl font-black md:text-4xl">
                {isSpanish ? "DJs reales, resultados medibles" : "Real DJs, measurable results"}
              </h2>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-3 md:w-auto">
              {highlights.map((item) => (
                <div key={item.value} className="rounded-xl border border-border/70 bg-card/70 px-4 py-3 text-center">
                  <p className="font-display text-2xl font-black text-primary">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {quotes.map((quote, index) => (
              <motion.blockquote
                key={quote}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="rounded-xl border border-border/60 bg-background/85 px-4 py-3 text-sm text-muted-foreground"
              >
                {quote}
              </motion.blockquote>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompactSocialProofSection;
