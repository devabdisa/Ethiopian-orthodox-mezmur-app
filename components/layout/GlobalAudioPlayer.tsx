"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { logListen } from "@/app/actions/history";
import {
  PrevIcon,
  PlayIcon,
  PauseIcon,
  NextIcon,
  MuteIcon,
  VolumeIcon,
  CloseIcon,
} from "./PlayerIcons";

// ── YouTube IFrame API global bootstrap ──────────────────────────────────────

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// We only need to inject the script once, even across fast-refreshes.
let _ytApiReady = false;
const _ytReadyCbs: Array<() => void> = [];

function loadYTApi(): Promise<void> {
  return new Promise((resolve) => {
    if (_ytApiReady) {
      resolve();
      return;
    }
    _ytReadyCbs.push(resolve);
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      _ytApiReady = true;
      _ytReadyCbs.forEach((cb) => cb());
      _ytReadyCbs.length = 0;
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
}

function extractVideoId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  );
  return m?.[1] ?? null;
}

function fmt(secs: number): string {
  if (!secs || isNaN(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Main Component ─────────────────────────────────────────────────────────

export function GlobalAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    isMuted,
    volume,
    progress,
    duration,
    togglePlay,
    next,
    previous,
    setVolume,
    toggleMute,
    stop,
    setProgress,
    setDuration,
  } = usePlayerStore();

  const [ytUrl, setYtUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  // Refs for stable access inside callbacks/intervals
  const playerRef = useRef<any>(null); // YT.Player instance
  // ytContainerRef: a STABLE container always in the DOM that React owns.
  // We manually create an inner div for YT.Player to replace — so React
  // never tries to removeChild a node that YouTube has already swapped out.
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null); // ← fixed: needs initial value
  const isPlayingRef = useRef(isPlaying);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);
  const isSeekingRef = useRef(false);
  // nextRef: always holds the latest next() so YT callbacks never use stale closures
  const nextRef = useRef(next);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);
  useEffect(() => {
    isSeekingRef.current = isSeeking;
  }, [isSeeking]);
  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  // ── Sync OS Media Session (Lockscreen Controls) ──────────────────────────
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.subCategoryName || "Orthodox Mezmur",
        album: "ቅዱሳን Mezmur",
        artwork: [
          {
            src: "/logo.png", // Fallback to our app logo since we don't have track arts yet
            sizes: "512x512",
            type: "image/png",
          },
        ],
      });

      // Map physical/OS buttons to our Zustand store actions
      navigator.mediaSession.setActionHandler("play", togglePlay);
      navigator.mediaSession.setActionHandler("pause", togglePlay);
      navigator.mediaSession.setActionHandler("previoustrack", previous);
      navigator.mediaSession.setActionHandler("nexttrack", next);
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.fastSeek && "fastSeek" in playerRef.current) {
          playerRef.current.fastSeek(details.seekTime ?? 0);
        } else if (playerRef.current?.seekTo) {
          playerRef.current.seekTo(details.seekTime ?? 0, true);
        }
      });
    } else {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("seekto", null);
    }
  }, [currentTrack, togglePlay, previous, next]);

  // ── Step 1: Tear down + resolve URL whenever the track changes ───────────
  // This effect is the single source of truth for player lifecycle.
  // It IMMEDIATELY destroys the old player and clears the container,
  // then resolves the YouTube URL (from cache or API fetch).

  useEffect(() => {
    // ── Immediate teardown ──────────────────────────────────────────────────
    // Stop the old player and wipe the container RIGHT NOW, before any async work.
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {}
      playerRef.current = null;
    }
    if (ytContainerRef.current) {
      ytContainerRef.current.innerHTML = "";
    }
    setYtUrl(null);
    setCurrentTime(0);
    setLocalDuration(0);

    // ── No track selected ───────────────────────────────────────────────────
    if (!currentTrack) {
      setIsLoadingUrl(false);
      setUrlError(false);
      return;
    }

    // ── Log the listen (fire and forget) ────────────────────────────────────
    logListen(currentTrack.id).catch(console.error);

    // ── URL already cached on this track object ─────────────────────────────
    if (currentTrack.youtubeUrl) {
      setYtUrl(currentTrack.youtubeUrl);
      setUrlError(false);
      setIsLoadingUrl(false);
      return;
    }

    // ── Fetch URL from API with race-condition protection ───────────────────
    setIsLoadingUrl(true);
    setUrlError(false);
    let cancelled = false; // ← prevents stale fetch from overwriting newer track

    fetch(`/api/audio-url/${currentTrack.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return; // ← this track was skipped, discard result
        if (data.url) {
          currentTrack.youtubeUrl = data.url; // cache so next play is instant
          setYtUrl(data.url);
        } else {
          setUrlError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setUrlError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUrl(false);
      });

    return () => {
      cancelled = true; // cancel if user navigates to another track while fetching
    };
  }, [currentTrack?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 2: Create YT.Player when a valid URL is ready ────────────────────
  // This effect ONLY runs when ytUrl becomes a non-null value.
  // All teardown has already happened in Step 1.

  useEffect(() => {
    if (!ytUrl) return;

    const videoId = extractVideoId(ytUrl);
    if (!videoId) return;

    loadYTApi().then(() => {
      if (!ytContainerRef.current) return;

      // Create a fresh inner div for YouTube to replace with its iframe.
      // React owns ytContainerRef; YouTube owns only this ephemeral inner div.
      const innerDiv = document.createElement("div");
      ytContainerRef.current.innerHTML = "";
      ytContainerRef.current.appendChild(innerDiv);

      playerRef.current = new window.YT.Player(innerDiv, {
        videoId,
        width: "120",
        height: "68",
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          playsinline: 1,
          vq: "tiny", // 144p — minimal bandwidth, audio quality unaffected
          origin: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
        },
        events: {
          onReady: (e: any) => {
            (window as any).__ytPlayer = e.target;
            try {
              e.target.setPlaybackQuality("tiny");
              e.target.setVolume(
                isMutedRef.current ? 0 : Math.round(volumeRef.current * 100),
              );
              // Only pause if the store says we're not playing
              if (!isPlayingRef.current) e.target.pauseVideo();
            } catch {}

            // Start polling currentTime + duration every 500ms
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(() => {
              if (!playerRef.current) return;
              try {
                const ct = playerRef.current.getCurrentTime() ?? 0;
                const dur = playerRef.current.getDuration() ?? 0;
                if (!isSeekingRef.current) setCurrentTime(ct);
                setLocalDuration(dur);

                // Sync lockscreen progress bar
                if ("mediaSession" in navigator && dur > 0 && !isSeekingRef.current) {
                  navigator.mediaSession.setPositionState({
                    duration: dur,
                    playbackRate: 1,
                    position: ct,
                  });
                }
              } catch {}
            }, 500);
          },
          onStateChange: (e: any) => {
            // YT.PlayerState: 0=ENDED — use nextRef to avoid stale closure
            if (e.data === 0) nextRef.current();
          },
        },
      });
    });

    return () => {
      // Cleanup when ytUrl changes (e.g. track manually re-queued)
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [ytUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 3: Sync isPlaying → YT player & OS ────────────────────────────

  useEffect(() => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.playVideo?.();
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing";
        }
      } else {
        playerRef.current.pauseVideo?.();
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "paused";
        }
      }
    } catch {}
  }, [isPlaying]);

  // ── Step 4: Sync volume/mute → YT player (the fix!) ─────────────────────

  useEffect(() => {
    if (!playerRef.current) return;
    try {
      const ytVol = isMuted ? 0 : Math.round(volume * 100);
      playerRef.current.setVolume?.(ytVol);
    } catch {}
  }, [volume, isMuted]);

  // ── Seeking handlers ─────────────────────────────────────────────────────

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    setSeekValue(t);
    setCurrentTime(t);
    setIsSeeking(true);
  };

  const handleSeekCommit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    try {
      playerRef.current?.seekTo?.(t, true);
    } catch {}
    setCurrentTime(t);
    setIsSeeking(false);
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const isFetchingUrl = isLoadingUrl;
  const showPulse = isPlaying && !isFetchingUrl && !!ytUrl;
  const progressPercent =
    localDuration > 0 ? (currentTime / localDuration) * 100 : 0;

  // ── Empty state ───────────────────────────────────────────────────────────

  if (!currentTrack) {
    return (
      <div className="player-empty">
        <span className="player-empty-icon">🎵</span>
        <span className="player-empty-text">
          Select a Mezmur to begin listening
        </span>
        <style>{styles}</style>
      </div>
    );
  }

  // ── Full player render ────────────────────────────────────────────────────

  return (
    <div className="player-bar">
      {/* ── Track thumbnail (the YT player lives here, clipped to 44×44) ── */}
      <div className="player-track">
        <div className="player-track-thumb">
          {/* 
            The YT.Player API REQUIRES a real DOM element to replace.
            The div must be visible in the viewport — we clip it to 44×44.
            This also gives a nice "live video thumbnail" effect.
          */}
          <div className="yt-clip" ref={ytContainerRef}>
            {/* ytContainerRef is the stable React-owned container.
                YouTube's iframe is injected inside it via document.createElement in the effect.
                We render placeholder UI on top when no audio is loaded. */}
          </div>

          {!ytUrl && isFetchingUrl && <span className="loading-spinner" />}
          {!ytUrl && !isFetchingUrl && !urlError && (
            <span className="playing-icon">🕊️</span>
          )}
          {!ytUrl && urlError && <span style={{ fontSize: 16 }}>⚠️</span>}

          {showPulse && <span className="playing-pulse" />}
        </div>

        <div className="player-track-info">
          <p className="player-track-title font-ethiopic">
            {currentTrack.title}
          </p>
          <p className="player-track-sub">
            {isFetchingUrl
              ? "Finding audio stream..."
              : urlError
                ? "Audio unavailable"
                : currentTrack.subCategoryName}
          </p>
        </div>
      </div>

      {/* ── Center: Controls + Progress bar ── */}
      <div className="player-center">
        {/* Playback Buttons */}
        <div className="player-controls">
          <button
            className="player-btn"
            onClick={previous}
            aria-label="Previous"
          >
            <PrevIcon />
          </button>
          <button
            className="player-btn player-btn--play"
            onClick={togglePlay}
            disabled={isFetchingUrl || !ytUrl}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying && ytUrl ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="player-btn" onClick={next} aria-label="Next">
            <NextIcon />
          </button>
        </div>

        {/* Progress / Scrubber */}
        <div className="progress-row">
          <span className="progress-time">{fmt(currentTime)}</span>
          <input
            type="range"
            className="progress-slider"
            min={0}
            max={localDuration || 100}
            step={0.5}
            value={isSeeking ? seekValue : currentTime}
            onChange={handleSeekChange}
            onMouseUp={(e) => handleSeekCommit(e as any)}
            onTouchEnd={(e) => handleSeekCommit(e as any)}
            aria-label="Seek"
            style={
              { "--progress": `${progressPercent}%` } as React.CSSProperties
            }
          />
          <span className="progress-time">{fmt(localDuration)}</span>
        </div>
      </div>

      {/* ── Right: Volume + Stop ── */}
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
          aria-label="Stop"
          title="Stop"
        >
          <CloseIcon />
        </button>
      </div>

      <style>{styles}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  .player-empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 0 24px;
  }
  .player-empty-icon { font-size: 18px; opacity: .5; }
  .player-empty-text { font-size: 13px; color: hsl(var(--color-text-3)); font-style: italic; }

  .player-bar {
    height: 100%;
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1.6fr 1fr;
    align-items: center;
    padding: 0 20px;
    gap: 12px;
  }

  @media (max-width: 768px) {
    .player-bar { 
      display: flex; 
      justify-content: space-between; 
      padding: 0 16px; 
      gap: 12px; 
    }
    .player-track {
      flex: 1;
      min-width: 0;
    }
  }

  /* ── Track area ── */
  .player-track { display: flex; align-items: center; gap: 12px; min-width: 0; }

  .player-track-thumb {
    position: relative;
    width: 44px; height: 44px;
    flex-shrink: 0;
    border-radius: var(--radius);
    background: hsl(var(--color-accent) / .12);
    border: 1px solid hsl(var(--color-accent) / .2);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    overflow: hidden;
  }

  /* Clip the YouTube player to the thumbnail area */
  .yt-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  .yt-clip iframe,
  .yt-clip > div {
    position: absolute;
    width: 120px !important;
    height: 68px !important;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    border: none;
    pointer-events: none;
  }

  .playing-pulse {
    position: absolute;
    inset: -4px;
    border-radius: calc(var(--radius) + 4px);
    border: 1.5px solid hsl(var(--color-accent) / .5);
    animation: pulse-ring 2s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes pulse-ring {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.3; transform: scale(1.1); }
  }

  .player-track-info { min-width: 0; }
  .player-track-title {
    font-size: 14px; font-weight: 600; color: hsl(var(--color-text));
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .player-track-sub {
    font-size: 11px; color: hsl(var(--color-text-2)); margin-top: 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* ── Center column ── */
  .player-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 100%;
  }

  .player-controls { display: flex; align-items: center; gap: 8px; }

  .player-btn {
    display: flex; align-items: center; justify-content: center;
    border: none; background: transparent;
    color: hsl(var(--color-text-2));
    cursor: pointer; border-radius: 50%;
    width: 36px; height: 36px;
    transition: all var(--transition); flex-shrink: 0;
  }
  .player-btn:hover { color: hsl(var(--color-text)); background: hsl(var(--color-overlay)); }
  .player-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .player-btn--play {
    width: 42px; height: 42px;
    background: hsl(var(--color-accent));
    color: hsl(var(--color-text-on-accent));
    box-shadow: var(--shadow-accent);
  }
  .player-btn--play:hover:not(:disabled) {
    filter: brightness(1.1); transform: scale(1.06);
    background: hsl(var(--color-accent));
    color: hsl(var(--color-text-on-accent));
  }
  .player-btn--sm { width: 30px; height: 30px; }

  /* ── Progress scrubber ── */
  .progress-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    max-width: 420px;
  }

  .progress-time {
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: hsl(var(--color-text-3));
    white-space: nowrap;
    min-width: 32px;
    text-align: center;
  }

  .progress-slider {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: 2px;
    cursor: pointer;
    outline: none;
    /* Two-tone fill: accent up to current position, then border color */
    background: linear-gradient(
      to right,
      hsl(var(--color-accent)) var(--progress, 0%),
      hsl(var(--color-border)) var(--progress, 0%)
    );
  }
  .progress-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 13px; height: 13px;
    border-radius: 50%;
    background: hsl(var(--color-accent));
    border: 2px solid hsl(var(--color-surface));
    cursor: pointer;
    transition: transform var(--transition), box-shadow var(--transition);
    box-shadow: 0 0 0 0 hsl(var(--color-accent) / .3);
  }
  .progress-slider::-webkit-slider-thumb:hover {
    transform: scale(1.3);
    box-shadow: 0 0 0 6px hsl(var(--color-accent) / .15);
  }
  .progress-slider::-moz-range-thumb {
    width: 13px; height: 13px; border-radius: 50%;
    background: hsl(var(--color-accent));
    border: 2px solid hsl(var(--color-surface));
    cursor: pointer;
  }

  /* ── Right: Volume ── */
  .player-right {
    display: flex; align-items: center;
    justify-content: flex-end; gap: 8px;
  }

  .volume-slider {
    -webkit-appearance: none; appearance: none;
    width: 70px; height: 4px; border-radius: 2px;
    background: hsl(var(--color-border));
    outline: none; cursor: pointer;
  }
  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 13px; height: 13px; border-radius: 50%;
    background: hsl(var(--color-accent)); cursor: pointer;
    transition: transform var(--transition);
  }
  .volume-slider::-webkit-slider-thumb:hover { transform: scale(1.25); }

  .loading-spinner {
    width: 20px; height: 20px;
    border: 2px solid hsl(var(--color-accent) / .2);
    border-bottom-color: hsl(var(--color-accent));
    border-radius: 50%;
    display: inline-block; box-sizing: border-box;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    /* The center section now holds the playback controls on the right */
    .player-center {
      display: flex;
      flex-direction: row;
      width: auto;
      align-items: center;
      flex-shrink: 0; /* Crucial: prevent long titles from pushing controls off screen */
    }

    .player-controls {
      gap: 2px;
    }

    /* Increase touch target areas */
    .player-btn {
      width: 44px;
      height: 44px;
    }

    .player-btn--play {
      width: 44px;
      height: 44px;
    }

    /* Pin progress bar to the absolute top edge of the player */
    .progress-row {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      max-width: 100%;
      padding: 0;
      gap: 0;
      transform: translateY(-50%);
      z-index: 10;
    }

    /* Hide text timestamps to save space */
    .progress-time {
      display: none;
    }

    /* Slimline the slider track */
    .progress-slider {
      height: 3px;
      border-radius: 0;
      /* Remove safe-area padding gaps on edges */
      width: 100%;
    }

    /* Hide slider thumb unless interacting */
    .progress-slider::-webkit-slider-thumb {
      width: 12px; height: 12px;
      opacity: 0;
    }
    .progress-slider:active::-webkit-slider-thumb {
      opacity: 1;
    }

    /* Hide volume controls on mobile */
    .player-right {
      display: none;
    }

    /* Adjust thumbnail slightly */
    .player-track-thumb {
      width: 40px; height: 40px;
    }
    
    .player-track-info {
      flex: 1;
      min-width: 0; /* Let flexbox handle truncation naturally */
    }
  }
`;
