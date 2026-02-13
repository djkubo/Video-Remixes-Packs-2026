import { useEffect, useRef } from "react";
import { Pause, Play, X } from "lucide-react";
import { useAudioStore } from "@/store/useAudioStore";

export default function PersistentBottomPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const pauseTrack = useAudioStore((s) => s.pauseTrack);
  const resumeTrack = useAudioStore((s) => s.resumeTrack);
  const closePlayer = useAudioStore((s) => s.closePlayer);

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

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{currentTrack.title}</p>
          <p className="truncate text-xs text-zinc-400">{currentTrack.genre}</p>
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
            onClick={closePlayer}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <audio ref={audioRef} src={currentTrack.src} onEnded={pauseTrack} />
    </div>
  );
}
