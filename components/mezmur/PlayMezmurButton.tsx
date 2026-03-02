"use client";

import { usePlayerStore } from "@/store/playerStore";
import type { PlayerTrack } from "@/types";

interface PlayMezmurButtonProps {
  track: PlayerTrack;
  queue?: PlayerTrack[]; // Pass the full page list so Next/Prev work
  variant?: "icon" | "full";
}

export function PlayMezmurButton({
  track,
  queue,
  variant = "icon",
}: PlayMezmurButtonProps) {
  const { play, pause, resume, currentTrack, isPlaying } = usePlayerStore();

  const isActive = currentTrack?.id === track.id;
  const isActuallyPlaying = isActive && isPlaying;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isActive) {
      if (isPlaying) pause();
      else resume();
    } else {
      // Pass the full queue so Next/Prev and auto-play work correctly
      play(track, queue ?? [track]);
    }
  };

  if (variant === "full") {
    return (
      <button
        onClick={handleToggle}
        className="play-btn-full accent-gradient animate-in"
        style={{ animationDelay: "100ms" }}
      >
        <span className="play-icon">
          {isActuallyPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
        </span>
        <span className="play-text">
          {isActuallyPlaying ? "Pause Audio" : "Listen Now"}
        </span>
        <style>{styles}</style>
      </button>
    );
  }

  // Icon variant (for lists)
  return (
    <button
      onClick={handleToggle}
      className={`play-btn-icon ${isActive ? "is-active" : ""}`}
      aria-label={isActuallyPlaying ? "Pause" : "Play"}
    >
      {isActuallyPlaying ? (
        <span className="playing-bars">
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </span>
      ) : (
        <PlayIcon size={18} />
      )}
      <style>{styles}</style>
    </button>
  );
}

const styles = `
  .play-btn-full {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 14px 28px;
    border-radius: 99px;
    border: none;
    cursor: pointer;
    box-shadow: var(--shadow-accent);
    transition: all var(--transition);
  }
  
  .play-btn-full:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 12px 28px hsl(var(--color-accent) / .3);
  }

  .play-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .play-text {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .play-btn-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: hsl(var(--color-surface-2));
    color: hsl(var(--color-text-2));
    cursor: pointer;
    transition: all var(--transition);
    flex-shrink: 0;
  }

  .play-btn-icon:hover {
    background: hsl(var(--color-accent));
    color: hsl(var(--color-text-on-accent));
    transform: scale(1.1);
    box-shadow: var(--shadow-sm);
  }

  .play-btn-icon.is-active {
    background: hsl(var(--color-accent) / .15);
    color: hsl(var(--color-accent));
  }

  .playing-bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 12px;
  }

  .playing-bars .bar {
    width: 3px;
    background-color: currentColor;
    border-radius: 1px;
    animation: eq 1s ease-in-out infinite;
  }

  .playing-bars .bar:nth-child(1) { height: 100%; animation-delay: 0s; }
  .playing-bars .bar:nth-child(2) { height: 60%;  animation-delay: 0.2s; }
  .playing-bars .bar:nth-child(3) { height: 80%;  animation-delay: 0.4s; }

  @keyframes eq {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(0.4); }
  }
`;

function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}
