import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Play, 
  Pause, 
  Download, 
  Music2, 
  Clock, 
  Folder, 
  ChevronRight,
  Home,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useDataLayer } from "@/hooks/useDataLayer";

interface FolderType {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  file_url: string;
  duration_formatted: string | null;
  bpm: number | null;
  genre: string | null;
}

const MusicExplorer = () => {
  const { t, language } = useLanguage();
  const { convertPrice } = useCurrency();
  const { trackClick } = useDataLayer();
  
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [totalTracks, setTotalTracks] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[] | null>(null);
  const [searching, setSearching] = useState(false);
  
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load initial content
  useEffect(() => {
    loadContent();
    loadTotalCount();
  }, [currentFolderId]);

  const loadContent = async () => {
    setLoading(true);
    try {
      // Load subfolders
      let foldersQuery = supabase
        .from("folders")
        .select("id, name, slug, parent_id")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });

      if (currentFolderId) {
        foldersQuery = foldersQuery.eq("parent_id", currentFolderId);
      } else {
        foldersQuery = foldersQuery.is("parent_id", null);
      }

      const { data: foldersData } = await foldersQuery;
      setFolders(foldersData || []);

      // Load tracks in current folder
      let tracksQuery = supabase
        .from("tracks")
        .select("id, title, artist, file_url, duration_formatted, bpm, genre")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true })
        .limit(50);

      if (currentFolderId) {
        tracksQuery = tracksQuery.eq("folder_id", currentFolderId);
      } else {
        tracksQuery = tracksQuery.is("folder_id", null);
      }

      const { data: tracksData } = await tracksQuery;
      setTracks(tracksData || []);

      // Load breadcrumbs
      if (currentFolderId) {
        const { data: pathData } = await supabase.rpc("get_folder_path", { 
          folder_id: currentFolderId 
        });
        setBreadcrumbs(pathData || []);
      } else {
        setBreadcrumbs([]);
      }
    } catch (error) {
      console.error("Error loading content:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTotalCount = async () => {
    const { count } = await supabase
      .from("tracks")
      .select("*", { count: "exact", head: true })
      .eq("is_visible", true);
    setTotalTracks(count || 0);
  };

  // Search functionality
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults(null);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const performSearch = async () => {
    setSearching(true);
    try {
      const { data } = await supabase
        .from("tracks")
        .select("id, title, artist, file_url, duration_formatted, bpm, genre")
        .eq("is_visible", true)
        .or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`)
        .limit(50);
      
      setSearchResults(data || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handlePlay = (track: Track) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.file_url);
      audioRef.current.play().catch(console.error);
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(track.id);
    }
  };

  const handleDownloadClick = (track: Track) => {
    setSelectedTrack(track);
    setShowModal(true);
  };

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSearchQuery("");
    setSearchResults(null);
  };

  const displayTracks = searchResults !== null ? searchResults : tracks;
  const isSearching = searchQuery.trim().length >= 2;

  return (
    <section className="relative py-16 md:py-24 bg-background">
      {/* Background accent */}
      <div className="absolute inset-0 hero-gradient opacity-30" />
      
      <div className="container relative z-10 mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl lg:text-5xl">
            {t("explorer.title")}{" "}
            <span className="text-gradient-red">{t("explorer.titleHighlight")}</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {t("explorer.subtitle")}
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mb-8 max-w-2xl"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("explorer.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 bg-card/50 pl-12 text-lg backdrop-blur-sm border-border/50 focus:border-primary"
            />
            {searching && (
              <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </motion.div>

        {/* Breadcrumbs - Only show when not searching */}
        {!isSearching && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mb-6 text-sm justify-center flex-wrap"
          >
            <button
              onClick={() => navigateToFolder(null)}
              className={`flex items-center gap-1 transition-colors ${
                currentFolderId === null 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Home className="w-4 h-4" />
              {language === "es" ? "Inicio" : "Home"}
            </button>
            {breadcrumbs.map((crumb) => (
              <div key={crumb.id} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <button
                  onClick={() => navigateToFolder(crumb.id)}
                  className={`transition-colors ${
                    crumb.id === currentFolderId 
                      ? "text-primary font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </motion.nav>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card mx-auto max-w-4xl overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Folders Grid - Only show when not searching */}
              {!isSearching && folders.length > 0 && (
                <div className="p-4 border-b border-border/30">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {folders.map((folder) => (
                      <motion.button
                        key={folder.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => navigateToFolder(folder.id)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30 hover:border-primary hover:bg-primary/5 transition-all text-left"
                      >
                        <Folder className="w-8 h-8 text-primary flex-shrink-0" />
                        <span className="font-medium truncate">{folder.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Header */}
              {displayTracks.length > 0 && (
                <div className="grid grid-cols-12 gap-4 border-b border-border/30 bg-card/30 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:px-6">
                  <div className="col-span-1"></div>
                  <div className="col-span-5 md:col-span-4">{language === "es" ? "Título" : "Title"}</div>
                  <div className="col-span-3 hidden md:block">{language === "es" ? "Género" : "Genre"}</div>
                  <div className="col-span-2 hidden md:block">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="col-span-6 md:col-span-2 text-right">{language === "es" ? "Acción" : "Action"}</div>
                </div>
              )}

              {/* Tracks */}
              <div className="max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                  {displayTracks.map((track, index) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="group grid grid-cols-12 gap-4 border-b border-border/10 px-4 py-4 transition-colors hover:bg-card/50 md:px-6"
                    >
                      {/* Play Button */}
                      <div className="col-span-1 flex items-center">
                        <button
                          onClick={() => handlePlay(track)}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                        >
                          {playingId === track.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4 ml-0.5" />
                          )}
                        </button>
                      </div>

                      {/* Title & Artist */}
                      <div className="col-span-5 md:col-span-4 flex flex-col justify-center">
                        <button
                          onClick={() => handleDownloadClick(track)}
                          className="text-left font-medium text-foreground transition-colors hover:text-primary truncate"
                        >
                          {track.title}
                        </button>
                        <span className="text-sm text-muted-foreground truncate">
                          {track.artist}
                        </span>
                      </div>

                      {/* Genre */}
                      <div className="col-span-3 hidden items-center md:flex">
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                          {track.genre || "Music"}
                        </span>
                      </div>

                      {/* Duration */}
                      <div className="col-span-2 hidden items-center text-sm text-muted-foreground md:flex">
                        {track.duration_formatted || "--:--"}
                      </div>

                      {/* Download Action */}
                      <div className="col-span-6 md:col-span-2 flex items-center justify-end gap-2">
                        {track.bpm && (
                          <span className="text-xs text-muted-foreground hidden md:block">
                            {track.bpm} BPM
                          </span>
                        )}
                        <button
                          onClick={() => handleDownloadClick(track)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Empty state */}
                {displayTracks.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Music2 className="mb-4 h-12 w-12 opacity-50" />
                    {isSearching ? (
                      <p>{t("explorer.noResults")} "{searchQuery}"</p>
                    ) : folders.length === 0 ? (
                      <p>{language === "es" ? "No hay contenido aún" : "No content yet"}</p>
                    ) : (
                      <p>{language === "es" ? "Selecciona una carpeta para explorar" : "Select a folder to explore"}</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* Track count */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          {isSearching ? (
            <>
              {searchResults?.length || 0} {language === "es" ? "resultados encontrados" : "results found"}
            </>
          ) : (
            <>
              {t("explorer.showing")} {displayTracks.length} {t("explorer.of")} {totalTracks.toLocaleString()}+ {t("explorer.tracks")}
            </>
          )}
        </motion.p>
      </div>

      {/* PRO Member Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="glass-card border-primary/30 sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <Download className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              🔒 {t("explorer.modalTitle")}
            </DialogTitle>
            <DialogDescription className="mt-4 text-base text-muted-foreground">
              {t("explorer.modalDesc")}
            </DialogDescription>
          </DialogHeader>

          {selectedTrack && (
            <div className="my-4 rounded-lg bg-card/50 p-4">
              <p className="font-medium text-foreground">{selectedTrack.title}</p>
              <p className="text-sm text-muted-foreground">{selectedTrack.artist}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              asChild
              size="lg"
              className="h-14 bg-gradient-to-r from-primary via-red-600 to-orange-500 text-lg font-bold shadow-lg transition-transform hover:scale-105"
              onClick={() => trackClick(t("explorer.modalCta"))}
            >
              <a href="https://videoremixespacks.com/plan" target="_blank" rel="noopener noreferrer">
                {t("explorer.modalCta")}
              </a>
            </Button>
            <button
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
