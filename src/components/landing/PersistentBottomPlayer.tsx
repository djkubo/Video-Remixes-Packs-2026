import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Pause, Play, X } from "lucide-react";
import { useAudioStore } from "@/store/useAudioStore";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDataLayer } from "@/hooks/useDataLayer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PREVIEW_LIMIT_SECONDS = 30;

function hasPaidAccess(): boolean {
  try {
    return Boolean(sessionStorage.getItem("vr_access_token"));
  } catch {
    return false;
  }
}

export default function PersistentBottomPlayer() {
  const { language } = useLanguage();
  const { trackEvent } = useAnalytics();
  const { trackEvent: trackDataLayerEvent } = useDataLayer();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const limitReachedRef = useRef(false);

  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const pauseTrack = useAudioStore((s) => s.pauseTrack);
  const resumeTrack = useAudioStore((s) => s.resumeTrack);
  const closePlayer = useAudioStore((s) => s.closePlayer);

  const isPreviewLimited = !hasPaidAccess();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    limitReachedRef.current = false;
    setUpgradeOpen(false);
  }, [currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    // Keep the <audio> element in sync with the store.
    if (audio.getAttribute("src") !== currentTrack.src) {
      audio.src = currentTrack.src;
      audio.load();
    }

    if (!isPlaying) {
      audio.pause();
      return;
    }

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // If playback fails (autoplay policy, etc.), reflect paused state.
        pauseTrack();
      });
    }
  }, [currentTrack, isPlaying, pauseTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentTrack) return;
    if (!isPreviewLimited) return;

    const enforceLimit = () => {
      if (limitReachedRef.current) return;

      if (audio.currentTime >= PREVIEW_LIMIT_SECONDS) {
        limitReachedRef.current = true;
        audio.pause();
        pauseTrack();
        setUpgradeOpen(true);

        const payload = {
          seconds: PREVIEW_LIMIT_SECONDS,
          track_id: currentTrack.id,
          track_title: currentTrack.title,
          track_genre: currentTrack.genre,
          page_path: window.location.pathname,
        };

        trackEvent("audio_preview_limit_reached", payload);
        trackDataLayerEvent("audio_preview_limit_reached", payload);
      }
    };

    const handleSeeking = () => {
      if (limitReachedRef.current) return;
      if (audio.currentTime <= PREVIEW_LIMIT_SECONDS) return;
      audio.currentTime = PREVIEW_LIMIT_SECONDS;
      enforceLimit();
    };

    audio.addEventListener("timeupdate", enforceLimit);
    audio.addEventListener("seeking", handleSeeking);

    return () => {
      audio.removeEventListener("timeupdate", enforceLimit);
      audio.removeEventListener("seeking", handleSeeking);
    };
  }, [currentTrack, isPreviewLimited, pauseTrack, trackDataLayerEvent, trackEvent]);

  if (!currentTrack) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{currentTrack.title}</p>
          <p className="truncate text-xs text-zinc-400">{currentTrack.genre}</p>
          {isPreviewLimited ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              <Lock className="h-3 w-3" />
              {language === "es" ? "Preview 30s" : "30s preview"}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (isPlaying ? pauseTrack() : resumeTrack())}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setUpgradeOpen(false);
              limitReachedRef.current = false;
              closePlayer();
            }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <audio ref={audioRef} src={currentTrack.src} onEnded={pauseTrack} />
    </div>
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="glass-card border-primary/30 sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/45 bg-card">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              {language === "es" ? "Preview terminado" : "Preview ended"}
            </DialogTitle>
            <DialogDescription className="mt-3 text-base text-muted-foreground">
              {language === "es"
                ? "Activa tu plan para escuchar completo y descargar por carpetas. Trial 7 días $0."
                : "Activate your plan to listen fully and download by folders. 7-day $0 trial."}
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 rounded-lg border border-border/70 bg-background-carbon/38 p-4 text-left">
            <p className="font-medium text-foreground">{currentTrack.title}</p>
            <p className="text-xs text-muted-foreground">{currentTrack.genre}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              asChild
              size="lg"
              className="btn-primary-glow h-12 text-base font-black transition-transform hover:scale-[1.01]"
              onClick={() => {
                const payload = {
                  cta_id: "audio_preview_unlock",
                  track_id: currentTrack.id,
                  track_title: currentTrack.title,
                  track_genre: currentTrack.genre,
                  page_path: window.location.pathname,
                };
                trackEvent("cta_click", payload);
                trackDataLayerEvent("cta_click", payload);
              }}
            >
              <Link to="/plan">{language === "es" ? "Ver planes" : "See plans"}</Link>
            </Button>
            <Button variant="outline" size="lg" onClick={() => setUpgradeOpen(false)}>
              {language === "es" ? "Cerrar" : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
