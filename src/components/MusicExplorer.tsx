import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Play, Pause, Download, Music2, Clock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Sample music data - in production this would come from an API
const sampleTracks = [
  { id: 1, artist: "Bad Bunny", title: "Tití Me Preguntó (Clean Extended)", genre: "Reggaeton", duration: "4:23", bpm: 110, preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, artist: "Shakira ft. Rauw Alejandro", title: "Te Felicito (DJ Intro Edit)", genre: "Latin Pop", duration: "3:45", bpm: 96, preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, artist: "Daddy Yankee", title: "Gasolina (2024 Remix)", genre: "Reggaeton", duration: "4:01", bpm: 100, preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: 4, artist: "Karol G", title: "Provenza (Extended Mix)", genre: "Reggaeton", duration: "4:56", bpm: 98, preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: 5, artist: "J Balvin", title: "Mi Gente (Festival Edit)", genre: "Reggaeton", duration: "3:33", bpm: 105, preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { id: 6, artist: "Ozuna", title: "Baila Baila Baila (Clean)", genre: "Reggaeton", duration: "3:28", bpm: 92, preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
  { id: 7, artist: "Nicky Jam", title: "El Perdón (Intro Edit)", genre: "Reggaeton", duration: "4:15", bpm: 95, preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
  { id: 8, artist: "Maluma", title: "Hawái (Extended)", genre: "Reggaeton", duration: "4:42", bpm: 100, preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
];

const MusicExplorer = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<typeof sampleTracks[0] | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredTracks = sampleTracks.filter(
    (track) =>
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlay = (track: typeof sampleTracks[0]) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.preview);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(track.id);
    }
  };

  const handleDownloadClick = (track: typeof sampleTracks[0]) => {
    setSelectedTrack(track);
    setShowModal(true);
  };

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
            Transparencia Total:{" "}
            <span className="text-gradient-red">Mira lo que hay dentro antes de pagar</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Busca cualquier artista, escucha el preview y comprueba la calidad antes de suscribirte.
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
              placeholder="Buscar artista, título o género..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 bg-card/50 pl-12 text-lg backdrop-blur-sm border-border/50 focus:border-primary"
            />
          </div>
        </motion.div>

        {/* Track List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card mx-auto max-w-4xl overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 border-b border-border/30 bg-card/30 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:px-6">
            <div className="col-span-1"></div>
            <div className="col-span-5 md:col-span-4">Título</div>
            <div className="col-span-3 hidden md:block">Género</div>
            <div className="col-span-2 hidden md:block">
              <Clock className="h-4 w-4" />
            </div>
            <div className="col-span-6 md:col-span-2 text-right">Acción</div>
          </div>

          {/* Tracks */}
          <div className="max-h-[400px] overflow-y-auto">
            <AnimatePresence>
              {filteredTracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
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
                      {track.genre}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="col-span-2 hidden items-center text-sm text-muted-foreground md:flex">
                    {track.duration}
                  </div>

                  {/* Download Action */}
                  <div className="col-span-6 md:col-span-2 flex items-center justify-end gap-2">
                    <span className="text-xs text-muted-foreground hidden md:block">
                      {track.bpm} BPM
                    </span>
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

            {filteredTracks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Music2 className="mb-4 h-12 w-12 opacity-50" />
                <p>No se encontraron resultados para "{searchQuery}"</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Track count */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          Mostrando {filteredTracks.length} de 50,000+ archivos disponibles
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
              🔒 Archivo Exclusivo para Miembros PRO
            </DialogTitle>
            <DialogDescription className="mt-4 text-base text-muted-foreground">
              Activa tu cuenta hoy para descargar este archivo y{" "}
              <span className="font-semibold text-foreground">1TB más</span> a máxima velocidad.
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
            >
              <a href="https://videoremixespacks.com/plan">
                Activar Cuenta Ahora ($35)
              </a>
            </Button>
            <button
              onClick={() => setShowModal(false)}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Seguir explorando gratis
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default MusicExplorer;
