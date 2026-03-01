"use client";

import { usePlayerStore } from "@/store/playerStore";

export function GlobalAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    isMuted,
    volume,
    togglePlay,
    next,
    previous,
    setVolume,
    toggleMute,
    stop,
  } = usePlayerStore();

  // Empty state
  if (!currentTrack) {
    return (
      <div className="player-empty">
        <span className="player-empty-icon">🎵</span>
        <span className="player-empty-text">
          Select a Mezmur to begin listening
        </span>
        <style>{playerStyles}</style>
      </div>
    );
  }

  return (
    <div className="player-bar">
      {/* ── Track info ── */}
      <div className="player-track">
        <div className="player-track-thumb">
          <span className="playing-icon">🕊️</span>
          {isPlaying && <span className="playing-pulse animate-pulse-glow" />}
        </div>
        <div className="player-track-info">
          <p className="player-track-title font-ethiopic">
            {currentTrack.title}
          </p>
          <p className="player-track-sub">{currentTrack.subCategoryName}</p>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="player-controls">
        <button className="player-btn" onClick={previous} aria-label="Previous">
          <PrevIcon />
        </button>

        <button
          className="player-btn player-btn--play"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button className="player-btn" onClick={next} aria-label="Next">
          <NextIcon />
        </button>
      </div>

      {/* ── Volume + close ── */}
      <div className="player-right">
        <button
          className="player-btn player-btn--sm"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="volume-slider"
          aria-label="Volume"
        />

        <button
          className="player-btn player-btn--sm"
          onClick={stop}
          aria-label="Stop playback"
          title="Stop"
        >
          <CloseIcon />
        </button>
      </div>

      <style>{playerStyles}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const playerStyles = `
  .player-empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 0 24px;
  }

  .player-empty-icon {
    font-size: 18px;
    opacity: .5;
  }

  .player-empty-text {
    font-size: 13px;
    color: hsl(var(--color-text-3));
    font-style: italic;
  }

  .player-bar {
    height: 100%;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 0 24px;
    gap: 16px;
  }

  @media (max-width: 640px) {
    .player-bar {
      grid-template-columns: 1fr auto;
      padding: 0 12px;
      gap: 8px;
    }
  }

  .player-track {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .player-track-thumb {
    position: relative;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: var(--radius);
    background: hsl(var(--color-accent) / .15);
    border: 1px solid hsl(var(--color-accent) / .25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
  }

  .playing-pulse {
    position: absolute;
    inset: -4px;
    border-radius: calc(var(--radius) + 4px);
    border: 1.5px solid hsl(var(--color-accent) / .4);
  }

  .player-track-info {
    min-width: 0;
  }

  .player-track-title {
    font-size: 14px;
    font-weight: 600;
    color: hsl(var(--color-text));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .player-track-sub {
    font-size: 11px;
    color: hsl(var(--color-text-2));
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .player-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .player-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: hsl(var(--color-text-2));
    cursor: pointer;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    transition: all var(--transition);
    flex-shrink: 0;
  }

  .player-btn:hover {
    color: hsl(var(--color-text));
    background: hsl(var(--color-overlay));
  }

  .player-btn--play {
    width: 46px;
    height: 46px;
    background: hsl(var(--color-accent));
    color: hsl(var(--color-text-on-accent));
    box-shadow: var(--shadow-accent);
  }

  .player-btn--play:hover {
    filter: brightness(1.1);
    background: hsl(var(--color-accent));
    color: hsl(var(--color-text-on-accent));
    transform: scale(1.05);
  }

  .player-btn--sm {
    width: 30px;
    height: 30px;
  }

  .player-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }

  .volume-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 80px;
    height: 4px;
    border-radius: 2px;
    background: hsl(var(--color-border));
    outline: none;
    cursor: pointer;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: hsl(var(--color-accent));
    cursor: pointer;
    transition: transform var(--transition);
  }

  .volume-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  @media (max-width: 640px) {
    .player-right {
      display: none;
    }
    .volume-slider {
      display: none;
    }
  }
`;

// ── Inline SVG Icons ──────────────────────────────────────────────────────────
function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}
function PrevIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polygon points="19 20 9 12 19 4 19 20" />
      <line x1="5" y1="19" x2="5" y2="5" />
    </svg>
  );
}
function NextIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  );
}
function VolumeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}
function MuteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
