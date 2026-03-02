"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";

/**
 * Global keyboard shortcuts for the audio player.
 * Attach this once inside the AppShell.
 *
 * Shortcuts:
 *  Space          → Play / Pause
 *  M              → Toggle Mute
 *  ArrowRight     → Seek +10s
 *  ArrowLeft      → Seek -10s
 *  N              → Next track
 *  P              → Previous track
 */
export function usePlayerKeyboardShortcuts() {
  const { currentTrack, isPlaying, togglePlay, toggleMute, next, previous } =
    usePlayerStore();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Don't intercept when user is typing in an input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      if (!currentTrack) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
        case "M":
          toggleMute();
          break;
        case "n":
        case "N":
          next();
          break;
        case "p":
        case "P":
          previous();
          break;
        case "ArrowRight":
          // Seek forward 10s — we do this via postMessage to the YT iframe
          e.preventDefault();
          seekYTPlayer(10);
          break;
        case "ArrowLeft":
          // Seek backward 10s
          e.preventDefault();
          seekYTPlayer(-10);
          break;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentTrack, isPlaying, togglePlay, toggleMute, next, previous]);
}

/**
 * Seeks the YouTube IFrame player by +/- deltaSeconds.
 * We access the YT.Player instance stored on the div element by the GlobalAudioPlayer.
 * This uses the globally available window.ytPlayerInstance if it exists.
 */
function seekYTPlayer(deltaSeconds: number) {
  try {
    const player = (window as any).__ytPlayer;
    if (!player) return;
    const current = player.getCurrentTime?.() ?? 0;
    player.seekTo?.(Math.max(0, current + deltaSeconds), true);
  } catch {}
}
