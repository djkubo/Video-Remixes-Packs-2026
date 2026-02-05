import { useState, useRef, useCallback, useEffect } from "react";

interface Track {
  id: string;
  file_url: string;
  title?: string;
  artist?: string;
}

interface UseAudioPlayerOptions {
  onTrackEnd?: () => void;
  onError?: (error: Error) => void;
}

interface UseAudioPlayerReturn {
  playingId: string | null;
  isLoading: boolean;
  error: string | null;
  play: (track: Track) => void;
  pause: () => void;
  stop: () => void;
  toggle: (track: Track) => void;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}): UseAudioPlayerReturn {
  const { onTrackEnd, onError } = options;
  
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackId = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const stopCurrentAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.oncanplaythrough = null;
      audioRef.current = null;
    }
    currentTrackId.current = null;
    setPlayingId(null);
    setIsLoading(false);
    setError(null);
  }, []);

  const play = useCallback((track: Track) => {
    // Stop any currently playing audio
    stopCurrentAudio();
    
    setIsLoading(true);
    setError(null);
    currentTrackId.current = track.id;

    const audio = new Audio();
    audioRef.current = audio;

    // Handle successful load
    audio.oncanplaythrough = () => {
      if (currentTrackId.current === track.id) {
        setIsLoading(false);
        audio.play().catch((err) => {
          console.error("Play error:", err);
          setError("Error al reproducir");
          setPlayingId(null);
          onError?.(err);
        });
      }
    };

    // Handle playback end
    audio.onended = () => {
      setPlayingId(null);
      currentTrackId.current = null;
      onTrackEnd?.();
    };

    // Handle errors
    audio.onerror = () => {
      const errorMessage = "Error al cargar el audio";
      console.error("Audio load error for track:", track.id);
      setError(errorMessage);
      setIsLoading(false);
      setPlayingId(null);
      currentTrackId.current = null;
      onError?.(new Error(errorMessage));
    };

    // Start loading
    audio.src = track.file_url;
    audio.load();
    setPlayingId(track.id);
  }, [stopCurrentAudio, onTrackEnd, onError]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
  }, []);

  const stop = useCallback(() => {
    stopCurrentAudio();
  }, [stopCurrentAudio]);

  const toggle = useCallback((track: Track) => {
    if (playingId === track.id) {
      pause();
    } else {
      play(track);
    }
  }, [playingId, play, pause]);

  return {
    playingId,
    isLoading,
    error,
    play,
    pause,
    stop,
    toggle,
  };
}
