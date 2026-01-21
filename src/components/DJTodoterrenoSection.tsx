import { motion } from "framer-motion";
import { Music, Mic2, PartyPopper, Disc, Radio } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const DJTodoterrenoSection = () => {
  const { t, language } = useLanguage();

  const genres = [
    { icon: Music, name: "Cumbia Wepa" },
    { icon: Disc, name: "Afro House" },
    { icon: Mic2, name: "Karaoke HD" },
    { icon: PartyPopper, name: "Reggaeton Old School" },
    { icon: Radio, name: "Bachata Sensual" },
  ];

  const stats = [
    { value: "60+", label: language === "es" ? "Géneros" : "Genres" },
    { value: "50K+", label: language === "es" ? "Archivos" : "Files" },
    { value: "1080p", label: "Video HD" },
    { value: "320k", label: "Audio MP3" },
  ];

  return (
    <section className="relative py-24 md:py-32 bg-muted/20 dark:bg-background-carbon">
      <div className="container mx-auto">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-display-sm md:text-display-md font-extrabold text-foreground">
              {t("dj.title")}{" "}
              <span className="text-gradient-red">{t("dj.titleHighlight")}</span>
            </h2>
          </motion.div>

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-8 md:p-12"
          >
            <div className="text-center">
              <p className="font-sans text-xl md:text-2xl text-muted-foreground leading-relaxed">
                {t("dj.question")}{" "}
                <span className="text-foreground font-semibold">Cumbia Wepa</span>,{" "}
                {language === "es" ? "luego" : "then"}{" "}
                <span className="text-foreground font-semibold">Afro House</span>{" "}
                {language === "es" ? "y cierras con" : "and close with"}{" "}
                <span className="text-foreground font-semibold">Karaoke</span>?
              </p>
              
              <p className="mt-6 font-display text-2xl md:text-3xl font-bold text-primary">
                {t("dj.covered")}
              </p>
              
              <p className="mt-4 font-sans text-lg text-muted-foreground">
                {t("dj.from")}{" "}
                <span className="text-foreground font-bold">{t("dj.never")}</span>
              </p>
            </div>

            {/* Genre Pills */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {genres.map((genre, index) => (
                <motion.div
                  key={genre.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.08 }}
                  className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-5 py-3 transition-all duration-300 hover:bg-primary/20 hover:scale-105"
                >
                  <genre.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  <span className="font-sans font-medium text-foreground">{genre.name}</span>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="font-display text-3xl md:text-4xl font-extrabold text-primary dark:text-shadow-glow">
                    {stat.value}
                  </div>
                  <div className="mt-1 font-bebas text-sm tracking-widest text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DJTodoterrenoSection;