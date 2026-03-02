"use client";

import { usePlayerStore } from "@/store/playerStore";
import type { PlayerTrack } from "@/types";

interface PlayAllButtonProps {
  tracks: PlayerTrack[];
  label?: string;
}

export function PlayAllButton({
  tracks,
  label = "Play All",
}: PlayAllButtonProps) {
  const { play, currentTrack, isPlaying, pause, resume } = usePlayerStore();

  if (tracks.length === 0) return null;

  // Check if we're currently playing from this exact queue
  const isThisQueuePlaying =
    currentTrack !== null && tracks.some((t) => t.id === currentTrack.id);

  const handleClick = () => {
    if (isThisQueuePlaying) {
      if (isPlaying) pause();
      else resume();
    } else {
      play(tracks[0], tracks);
    }
  };

  return (
    <button className="play-all-btn" onClick={handleClick} aria-label={label}>
      {isThisQueuePlaying && isPlaying ? (
        <>
          <PauseIcon />
          <span>Pause</span>
        </>
      ) : (
        <>
          <PlayIcon />
          <span>{label}</span>
        </>
      )}
      <style>{styles}</style>
    </button>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

const styles = `
  .play-all-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    border-radius: 99px;
    border: none;
    background: hsl(var(--color-accent));
    color: hsl(var(--color-text-on-accent));
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition);
    box-shadow: var(--shadow-accent);
    letter-spacing: 0.02em;
  }
  .play-all-btn:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
  .play-all-btn:active {
    transform: translateY(0);
  }
`;
