import { create } from "zustand";
import type { PlayerTrack } from "@/types";

interface PlayerState {
  // ── Current track ───────────────────────────────────────────────────────────
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number; // 0–1
  progress: number; // 0–1 (for seeking UI — actual playback is YouTube iframe)
  duration: number; // seconds

  // ── Queue ───────────────────────────────────────────────────────────────────
  queue: PlayerTrack[];
  queueIndex: number;

  // ── Actions ─────────────────────────────────────────────────────────────────
  play: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setProgress: (p: number) => void;
  setDuration: (d: number) => void;
  addToQueue: (track: PlayerTrack) => void;
  clearQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  currentTrack: null,
  isPlaying: false,
  isMuted: false,
  volume: 0.8,
  progress: 0,
  duration: 0,
  queue: [],
  queueIndex: -1,

  // ── Actions ────────────────────────────────────────────────────────────────

  play: (track, queue) => {
    const newQueue = queue ?? [track];
    const idx = newQueue.findIndex((t) => t.id === track.id);
    set({
      currentTrack: track,
      isPlaying: true,
      progress: 0,
      queue: newQueue,
      queueIndex: idx === -1 ? 0 : idx,
    });
  },

  pause: () => set({ isPlaying: false }),

  resume: () => {
    if (get().currentTrack) set({ isPlaying: true });
  },

  togglePlay: () => {
    const { isPlaying, currentTrack } = get();
    if (!currentTrack) return;
    set({ isPlaying: !isPlaying });
  },

  stop: () =>
    set({
      isPlaying: false,
      currentTrack: null,
      progress: 0,
      queue: [],
      queueIndex: -1,
    }),

  next: () => {
    const { queue, queueIndex } = get();
    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      set({
        currentTrack: queue[nextIdx],
        queueIndex: nextIdx,
        isPlaying: true,
        progress: 0,
      });
    }
  },

  previous: () => {
    const { queue, queueIndex, progress } = get();
    // If more than 3s in, restart current track; otherwise go back
    if (progress > 0.05) {
      set({ progress: 0 });
      return;
    }
    const prevIdx = queueIndex - 1;
    if (prevIdx >= 0) {
      set({
        currentTrack: queue[prevIdx],
        queueIndex: prevIdx,
        isPlaying: true,
        progress: 0,
      });
    }
  },

  setVolume: (v) =>
    set({ volume: Math.max(0, Math.min(1, v)), isMuted: false }),

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  setProgress: (p) => set({ progress: Math.max(0, Math.min(1, p)) }),

  setDuration: (d) => set({ duration: d }),

  addToQueue: (track) =>
    set((s) => ({
      queue: [...s.queue, track],
      // If nothing is playing, start this track
      ...(s.currentTrack === null && {
        currentTrack: track,
        queueIndex: s.queue.length,
        isPlaying: true,
      }),
    })),

  clearQueue: () => set({ queue: [], queueIndex: -1 }),
}));
