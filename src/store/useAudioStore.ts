import { create } from "zustand";

export type AudioTrack = {
  id: string;
  title: string;
  genre: string;
  src: string;
};

type AudioState = {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  playTrack: (track: AudioTrack) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  closePlayer: () => void;
};

export const useAudioStore = create<AudioState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  playTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  pauseTrack: () => set({ isPlaying: false }),
  resumeTrack: () => {
    const { currentTrack } = get();
    if (!currentTrack) return;
    set({ isPlaying: true });
  },
  closePlayer: () => set({ currentTrack: null, isPlaying: false }),
}));

