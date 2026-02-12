import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Filter, Folder, Loader2, Music2, Search, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataLayer } from "@/hooks/useDataLayer";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  extractBpm,
  extractGenreFromPath,
  fetchGenresSelect,
  fetchLastWeeks,
  formatDuration,
  type ProductionFile,
} from "@/lib/productionApi";

type ExplorerTrack = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  durationFormatted: string;
  bpm: number | null;
  path: string;
};

type MusicExplorerProps = {
  compact?: boolean;
};

function toTrack(file: ProductionFile, index: number): ExplorerTrack {
  const titleFromName = file.name.replace(/\.[^/.]+$/, "");
  const title = file.title?.trim() || titleFromName;
  const artistFromName = file.name.includes(" - ") ? file.name.split(" - ")[0]?.trim() : "";
  const artist = file.artist?.trim() || artistFromName || "VideoRemixesPack";
  const genreFromList = file.genre?.[0]?.trim();
  const genre = genreFromList || extractGenreFromPath(file.path) || "Sin género";

  return {
    id: file.id || file.path || `${title}-${index}`,
    title,
    artist,
    genre,
    durationFormatted: formatDuration(file.duration),
    bpm: extractBpm(file.name) ?? extractBpm(file.title),
    path: file.path || "",
  };
}

const MusicExplorer = ({ compact = false }: MusicExplorerProps) => {
  const { t, language } = useLanguage();
  const { trackClick } = useDataLayer();
  const { trackEvent } = useAnalytics();
  const location = useLocation();

  const isGenresRoute = location.pathname === "/genres";
  const isCompactPreview = compact && !isGenresRoute;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTracks, setAllTracks] = useState<ExplorerTrack[]>([]);
  const [knownGenres, setKnownGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<ExplorerTrack | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [genresResult, weeksResult] = await Promise.allSettled([
          fetchGenresSelect(controller.signal),
          fetchLastWeeks(controller.signal),
        ]);

        const genresFromApi =
          genresResult.status === "fulfilled"
            ? genresResult.value.data
                .map((item) => item.name?.trim())
                .filter((name): name is string => Boolean(name))
            : [];

        const tracksFromApi =
          weeksResult.status === "fulfilled"
            ? weeksResult.value
                .flatMap((week) => week.files || [])
                .map((file, index) => toTrack(file, index))
            : [];

        const dedupedTracks = Array.from(
          new Map(tracksFromApi.map((track) => [track.id, track])).values(),
        );

        const dedupedGenres = Array.from(
          new Set([
            ...genresFromApi,
            ...dedupedTracks.map((track) => track.genre).filter(Boolean),
          ]),
        ).sort((a, b) => a.localeCompare(b));

        if (dedupedGenres.length === 0 && dedupedTracks.length === 0) {
          throw new Error("No se pudo cargar contenido de producción");
        }

        setKnownGenres(dedupedGenres);
        setAllTracks(dedupedTracks);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : language === "es"
              ? "No se pudo cargar el contenido en vivo"
              : "Could not load live content";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => controller.abort();
  }, [language]);

  useEffect(() => {
    setSelectedGenre(null);
    setSearchQuery("");
  }, [location.pathname]);

  const genreCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const track of allTracks) {
      counts.set(track.genre, (counts.get(track.genre) || 0) + 1);
    }
    return counts;
  }, [allTracks]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredGenres = useMemo(() => {
    if (isCompactPreview) return knownGenres;
    if (!normalizedSearch) return knownGenres;
    return knownGenres.filter((genre) => genre.toLowerCase().includes(normalizedSearch));
  }, [knownGenres, normalizedSearch, isCompactPreview]);

  const filteredTracks = useMemo(() => {
    return allTracks.filter((track) => {
      const matchesGenre = selectedGenre ? track.genre === selectedGenre : true;
      if (!matchesGenre) return false;

      if (isCompactPreview || !normalizedSearch) return true;

      const haystack = `${track.title} ${track.artist} ${track.genre}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [allTracks, isCompactPreview, normalizedSearch, selectedGenre]);

  const visibleGenrePills = useMemo(
    () => filteredGenres.slice(0, isCompactPreview ? 10 : 260),
    [filteredGenres, isCompactPreview],
  );

  const visibleTracks = useMemo(
    () => filteredTracks.slice(0, isCompactPreview ? 8 : 80),
    [filteredTracks, isCompactPreview],
  );

  const showTracksByDefault = !isGenresRoute;
  const shouldShowTrackList =
    isCompactPreview || showTracksByDefault || Boolean(selectedGenre) || normalizedSearch.length >= 2;

  const handleDownloadClick = (track: ExplorerTrack) => {
    setSelectedTrack(track);
    setShowModal(true);
  };

  return (
    <section className={`relative ${isCompactPreview ? "bg-background-carbon/58 py-10 md:py-12" : "bg-background py-16 md:py-24"}`}>
      <div className="absolute inset-0 hero-gradient opacity-8" />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`text-center ${isCompactPreview ? "mb-6" : "mb-8"}`}
        >
          <h2
            className={`mb-4 font-display font-bold ${
              isCompactPreview ? "text-3xl md:text-4xl" : "text-3xl md:text-4xl lg:text-5xl"
            }`}
          >
            {isGenresRoute
              ? language === "es"
                ? "Géneros en vivo"
                : "Live genres"
              : isCompactPreview
                ? language === "es"
                  ? "Preview del catálogo en vivo"
                  : "Live catalog preview"
                : (
                  <>
                    {t("explorer.title")} <span className="text-gradient-red">{t("explorer.titleHighlight")}</span>
                  </>
                )}
          </h2>

          <p className={`mx-auto text-muted-foreground ${isCompactPreview ? "max-w-2xl text-sm md:text-base" : "max-w-3xl"}`}>
            {isGenresRoute
              ? language === "es"
                ? "Listado actualizado desde la API de producción. Selecciona un género para ver ejemplos recientes."
                : "Live list from the production API. Select a genre to view recent examples."
              : isCompactPreview
                ? language === "es"
                  ? "Muestra real y simplificada del contenido actualizado. Para búsqueda avanzada usa el explorador completo."
                  : "Real and simplified sample of updated content. Use full explorer for advanced search."
                : t("explorer.subtitle")}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/55 bg-card px-4 py-2 text-xs font-bold text-primary">
            <Sparkles className="h-4 w-4" />
            {language === "es"
              ? `${knownGenres.length.toLocaleString()} géneros disponibles`
              : `${knownGenres.length.toLocaleString()} available genres`}
          </div>
        </motion.div>

        {!isCompactPreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mb-8 max-w-3xl"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  isGenresRoute
                    ? language === "es"
                      ? "Buscar género..."
                      : "Search genre..."
                    : t("explorer.search")
                }
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-14 border-border/70 bg-card pl-12 text-lg focus:border-primary"
              />
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className={`mx-auto overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[0_12px_26px_rgba(15,23,42,0.1)] ${
            isCompactPreview ? "max-w-5xl" : "max-w-6xl"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center text-sm text-destructive">{error}</div>
          ) : (
            <>
              <div className={`border-b border-border/75 bg-background-carbon/52 ${isCompactPreview ? "p-4" : "p-4"}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    {language === "es" ? "Filtrar por género" : "Filter by genre"}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedGenre(null)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      selectedGenre === null
                        ? "border-primary/60 bg-card text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {language === "es" ? "Todos" : "All"}
                  </button>
                </div>

                <div className={`${isCompactPreview ? "" : "max-h-52 overflow-y-auto pr-1"}`}>
                  <div className="flex flex-wrap gap-2">
                    {visibleGenrePills.map((genre) => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => setSelectedGenre(genre)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedGenre === genre
                            ? "border-primary/60 bg-card text-primary"
                            : "border-border/90 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        }`}
                      >
                        <Folder className="h-3.5 w-3.5" />
                        {genre}
                        {!isCompactPreview && genreCounts.has(genre) && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                            {genreCounts.get(genre)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {shouldShowTrackList ? (
                isCompactPreview ? (
                  <div className="grid gap-3 p-4 md:grid-cols-2 md:p-5">
                    {visibleTracks.map((track, index) => (
                      <article
                        key={`${track.id}-${index}`}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-border/75 bg-background px-4 py-3"
                      >
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => handleDownloadClick(track)}
                            className="truncate text-left text-sm font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {track.title}
                          </button>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{track.artist}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
                              {track.genre}
                            </span>
                            <span>{track.durationFormatted}</span>
                            {track.bpm ? <span>{track.bpm} BPM</span> : null}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDownloadClick(track)}
                          aria-label={
                            language === "es"
                              ? `Ver como descargar: ${track.title}`
                              : `See how to download: ${track.title}`
                          }
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-background text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <>
                    {visibleTracks.length > 0 && (
                      <div className="grid grid-cols-12 gap-4 border-b border-border/55 bg-background-carbon/52 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:px-6">
                        <div className="col-span-6 md:col-span-4">{language === "es" ? "Título" : "Title"}</div>
                        <div className="col-span-3 hidden md:block">{language === "es" ? "Género" : "Genre"}</div>
                        <div className="col-span-2 hidden md:block">{language === "es" ? "Duración" : "Duration"}</div>
                        <div className="col-span-6 text-right md:col-span-3">{language === "es" ? "Acción" : "Action"}</div>
                      </div>
                    )}

                    <div className="max-h-[480px] overflow-y-auto">
                      {visibleTracks.map((track, index) => (
                        <div
                          key={`${track.id}-${index}`}
                          className="grid grid-cols-12 gap-4 border-b border-border/28 px-4 py-4 transition-colors hover:bg-background-carbon/24 md:px-6"
                        >
                          <div className="col-span-6 md:col-span-4">
                            <button
                              type="button"
                              onClick={() => handleDownloadClick(track)}
                              className="text-left font-medium text-foreground transition-colors hover:text-primary"
                            >
                              {track.title}
                            </button>
                            <p className="mt-1 truncate text-sm text-muted-foreground">{track.artist}</p>
                          </div>

                          <div className="col-span-3 hidden items-center md:flex">
                            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                              {track.genre}
                            </span>
                          </div>

                          <div className="col-span-2 hidden items-center text-sm text-muted-foreground md:flex">
                            {track.durationFormatted}
                          </div>

                          <div className="col-span-6 flex items-center justify-end gap-2 md:col-span-3">
                            {track.bpm && (
                              <span className="hidden text-xs text-muted-foreground md:block">{track.bpm} BPM</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDownloadClick(track)}
                              aria-label={
                                language === "es"
                                  ? `Ver como descargar: ${track.title}`
                                  : `See how to download: ${track.title}`
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/40 bg-background text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center text-muted-foreground">
                  <Music2 className="h-10 w-10 opacity-60" />
                  <p>
                    {language === "es"
                      ? "Selecciona un género para ver ejemplos recientes del catálogo."
                      : "Select a genre to view recent catalog examples."}
                  </p>
                </div>
              )}

              {shouldShowTrackList && visibleTracks.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center text-muted-foreground">
                  <Music2 className="h-10 w-10 opacity-60" />
                  <p>
                    {language === "es"
                      ? `No se encontraron resultados para "${searchQuery}".`
                      : `No results found for "${searchQuery}".`}
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            {language === "es"
              ? `Mostrando ${visibleTracks.length} de ${filteredTracks.length} resultados (${allTracks.length.toLocaleString()} tracks recientes).`
              : `Showing ${visibleTracks.length} of ${filteredTracks.length} results (${allTracks.length.toLocaleString()} recent tracks).`}
          </p>
          {isCompactPreview && (
            <Button asChild variant="outline" className="mt-4 h-10 font-semibold">
              <Link to="/explorer">
                {language === "es" ? "Abrir explorador completo" : "Open full explorer"}
              </Link>
            </Button>
          )}
        </motion.div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="glass-card border-primary/30 sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/45 bg-card">
              <Download className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold">🔒 {t("explorer.modalTitle")}</DialogTitle>
            <DialogDescription className="mt-4 text-base text-muted-foreground">
              {language === "es"
                ? "Este archivo forma parte del catálogo premium. Activa tu plan para descarga inmediata."
                : "This file is part of the premium catalog. Activate your plan for instant access."}
            </DialogDescription>
          </DialogHeader>

          {selectedTrack && (
            <div className="my-4 rounded-lg border border-border/70 bg-background-carbon/38 p-4">
              <p className="font-medium text-foreground">{selectedTrack.title}</p>
              <p className="text-sm text-muted-foreground">{selectedTrack.artist}</p>
              <p className="mt-1 text-xs text-muted-foreground">{selectedTrack.path}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              asChild
              size="lg"
              className="btn-primary-glow h-14 text-lg font-bold transition-transform hover:scale-[1.02]"
              onClick={() => {
                trackClick(t("explorer.modalCta"));
                trackEvent("click", { button_text: t("explorer.modalCta"), section: "music_explorer" });
              }}
            >
              <Link to="/plan">{t("explorer.modalCta")}</Link>
            </Button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("explorer.modalClose")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default MusicExplorer;
