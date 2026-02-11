import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Folder, Loader2, Mic2, Music, TrendingUp, Video } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchMostDownloaded,
  fetchTrending,
  formatDuration,
  getRecentDateRange,
  type ProductionFile,
  type TrendingCategory,
} from "@/lib/productionApi";

const TRENDING_CONFIG: Array<{
  key: TrendingCategory;
  icon: React.ComponentType<{ className?: string }>;
  label: { es: string; en: string };
}> = [
  { key: "Audios", icon: Music, label: { es: "Audios", en: "Audio" } },
  { key: "Videos", icon: Video, label: { es: "Videos", en: "Video" } },
  { key: "Karaoke", icon: Mic2, label: { es: "Karaoke", en: "Karaoke" } },
];

type TrendState = Record<TrendingCategory, ProductionFile[]>;
type DownloadState = { File: ProductionFile[]; Folder: ProductionFile[] };

function getItemTitle(item: ProductionFile): string {
  const base = item.title?.trim() || item.name?.trim() || "Untitled";
  return base.replace(/\.[^/.]+$/, "");
}

function getItemGenre(item: ProductionFile): string {
  return item.genre?.[0]?.trim() || "General";
}

function getFolderLabel(item: ProductionFile): string {
  const full = item.name?.trim() || "Folder";
  const parts = full.split("/").filter(Boolean);
  return parts[parts.length - 1] || full;
}

const LiveTrendsSection = () => {
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trending, setTrending] = useState<TrendState>({
    Audios: [],
    Videos: [],
    Karaoke: [],
  });
  const [downloads, setDownloads] = useState<DownloadState>({
    File: [],
    Folder: [],
  });

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const range = getRecentDateRange(31);
        const [audios, videos, karaoke, files, folders] = await Promise.all([
          fetchTrending("Audios", controller.signal),
          fetchTrending("Videos", controller.signal),
          fetchTrending("Karaoke", controller.signal),
          fetchMostDownloaded("File", range, controller.signal),
          fetchMostDownloaded("Folder", range, controller.signal),
        ]);

        setTrending({ Audios: audios, Videos: videos, Karaoke: karaoke });
        setDownloads({ File: files, Folder: folders });
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : language === "es"
              ? "No se pudieron cargar las tendencias en vivo"
              : "Could not load live trends",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [language]);

  const updatedAt = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date()),
    [language],
  );

  return (
    <section className="relative overflow-hidden bg-background py-16 md:py-24">
      <div className="absolute inset-0 hero-gradient opacity-30" />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <span className="badge-primary mb-5 inline-flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {language === "es" ? "Tendencias en vivo" : "Live trends"}
          </span>
          <h2 className="font-display text-4xl font-bold md:text-5xl lg:text-6xl">
            {language === "es" ? "Top actual de producción" : "Current production top"}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">
            {language === "es"
              ? "Datos directos desde videoremixespacks.com (actualizados en tiempo real)."
              : "Direct data from videoremixespacks.com (real-time updates)."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground/80">
            {language === "es" ? `Actualizado: ${updatedAt}` : `Updated: ${updatedAt}`}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="glass-card mx-auto max-w-3xl px-6 py-12 text-center text-sm text-destructive">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-3">
              {TRENDING_CONFIG.map(({ key, label, icon: Icon }, columnIndex) => (
                <motion.article
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: columnIndex * 0.08 }}
                  className="glass-card overflow-hidden"
                >
                  <div className="border-b border-border/40 bg-card/30 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h3 className="inline-flex items-center gap-2 font-display text-xl font-bold">
                        <Icon className="h-5 w-5 text-primary" />
                        {language === "es" ? label.es : label.en}
                      </h3>
                      <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                        Top {trending[key].length}
                      </span>
                    </div>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">
                    {trending[key].map((item, index) => (
                      <div
                        key={`${key}-${item.id || item.name}-${index}`}
                        className="grid grid-cols-[24px,1fr,50px] items-center gap-3 border-b border-border/10 px-4 py-3 text-sm"
                      >
                        <span className="text-xs font-bold text-primary">#{index + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{getItemTitle(item)}</p>
                          <p className="truncate text-xs text-muted-foreground">{getItemGenre(item)}</p>
                        </div>
                        <span className="text-right text-xs text-muted-foreground">
                          {formatDuration(item.duration)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="glass-card overflow-hidden"
              >
                <div className="border-b border-border/40 bg-card/30 px-4 py-3">
                  <h3 className="inline-flex items-center gap-2 font-display text-xl font-bold">
                    <Download className="h-5 w-5 text-primary" />
                    {language === "es" ? "Más descargados (archivos)" : "Most downloaded (files)"}
                  </h3>
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {downloads.File.slice(0, 10).map((item, index) => (
                    <div
                      key={`file-${item.id || item.name}-${index}`}
                      className="grid grid-cols-[24px,1fr] gap-3 border-b border-border/10 px-4 py-3 text-sm"
                    >
                      <span className="text-xs font-bold text-primary">#{index + 1}</span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{getItemTitle(item)}</p>
                        <p className="truncate text-xs text-muted-foreground">{getItemGenre(item)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.article>

              <motion.article
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.08 }}
                className="glass-card overflow-hidden"
              >
                <div className="border-b border-border/40 bg-card/30 px-4 py-3">
                  <h3 className="inline-flex items-center gap-2 font-display text-xl font-bold">
                    <Folder className="h-5 w-5 text-primary" />
                    {language === "es" ? "Carpetas más descargadas" : "Most downloaded folders"}
                  </h3>
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {downloads.Folder.slice(0, 10).map((item, index) => (
                    <div
                      key={`folder-${item.id || item.name}-${index}`}
                      className="grid grid-cols-[24px,1fr,66px] items-center gap-3 border-b border-border/10 px-4 py-3 text-sm"
                    >
                      <span className="text-xs font-bold text-primary">#{index + 1}</span>
                      <p className="truncate font-medium">{getFolderLabel(item)}</p>
                      <span className="text-right text-xs text-muted-foreground">
                        {(item as { downloadCount?: number }).downloadCount
                          ? `${(item as { downloadCount: number }).downloadCount}x`
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.article>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default LiveTrendsSection;
