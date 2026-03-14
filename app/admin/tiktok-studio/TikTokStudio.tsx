"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";

interface Mezmur {
  id: string;
  title: string;
  lyrics: string[];
  youtubeUrl: string | null;
  zemari: { name: string } | null;
}

// ── Canvas constants ──
const CANVAS_W = 1080;
const CANVAS_H = 1920;
const FPS = 30;

// ── Background presets ──
const BG_PRESETS = [
  { name: "Sacred Night", colors: ["#0a0807", "#1a1510", "#0d0a05"], accent: "#c49620" },
  { name: "Marian Blue", colors: ["#070e1a", "#0f2744", "#091a2e"], accent: "#60a5fa" },
  { name: "Holy Forest", colors: ["#060f08", "#0f2a14", "#071209"], accent: "#86c564" },
  { name: "Meskel Dawn", colors: ["#1a0f08", "#2a1810", "#140a05"], accent: "#e88030" },
  { name: "Royal Purple", colors: ["#0e0818", "#1f0f2e", "#0d0514"], accent: "#b78cff" },
];

// ── Parse lyrics into verse groups ──
function parseVerses(lyrics: string[]): string[][] {
  const verses: string[][] = [];
  let current: string[] = [];

  for (const line of lyrics) {
    if (line.trim() === "") {
      if (current.length > 0) {
        verses.push(current);
        current = [];
      }
    } else {
      current.push(line.trim());
    }
  }
  if (current.length > 0) verses.push(current);

  // If no empty-line separators found, chunk into groups of 4
  if (verses.length <= 1 && lyrics.filter((l) => l.trim()).length > 4) {
    const allLines = lyrics.filter((l) => l.trim() !== "");
    const chunked: string[][] = [];
    for (let i = 0; i < allLines.length; i += 4) {
      chunked.push(allLines.slice(i, i + 4));
    }
    return chunked;
  }

  return verses;
}

// ── Extract YouTube ID ──
function getYouTubeId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : "";
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════

export function TikTokStudio({ mezmurs }: { mezmurs: Mezmur[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [bgPreset, setBgPreset] = useState(0);
  const [activeVerse, setActiveVerse] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0); // 3-2-1 countdown

  // Smooth transition state
  const [displayVerse, setDisplayVerse] = useState(0);
  const transitionAlphaRef = useRef(1);
  const targetAlphaRef = useRef(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef(0);
  const verseListRef = useRef<HTMLDivElement>(null);

  const selected = mezmurs.find((m) => m.id === selectedId);
  const verses = useMemo(
    () => (selected ? parseVerses(selected.lyrics) : []),
    [selected]
  );

  const filteredMezmurs = mezmurs.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  // ── Smooth verse transition trigger ──
  useEffect(() => {
    if (activeVerse === displayVerse) return;

    // Trigger fade out
    targetAlphaRef.current = 0;

    const timer = setTimeout(() => {
      // Once faded out, switch verse and trigger fade in
      setDisplayVerse(activeVerse);
      targetAlphaRef.current = 1;
    }, 400); // Wait 400ms for fade out

    return () => clearTimeout(timer);
  }, [activeVerse, displayVerse]);

  // ── Draw canvas frame ──
  const drawFrame = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!selected || verses.length === 0) return;
      const bg = BG_PRESETS[bgPreset];
      const verse = verses[displayVerse] || [];

      // ── Background ──
      const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
      grad.addColorStop(0, bg.colors[0]);
      grad.addColorStop(0.5, bg.colors[1]);
      grad.addColorStop(1, bg.colors[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Subtle radial glow
      const glow = ctx.createRadialGradient(
        CANVAS_W / 2, CANVAS_H * 0.4, 0,
        CANVAS_W / 2, CANVAS_H * 0.4, 700
      );
      glow.addColorStop(0, `${bg.accent}10`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Cross watermark
      ctx.save();
      ctx.font = "480px serif";
      ctx.fillStyle = `${bg.accent}08`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✞", CANVAS_W / 2, CANVAS_H / 2);
      ctx.restore();

      // ── Top branding ──
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.font = "bold 40px sans-serif";
      ctx.fillStyle = bg.accent;
      ctx.textAlign = "center";
      ctx.fillText("የዝማሬ ማዕድ", CANVAS_W / 2, 110);
      ctx.font = "20px sans-serif";
      ctx.globalAlpha = 0.25;
      ctx.fillText("Ethiopian Orthodox Tewahedo Mezmur", CANVAS_W / 2, 155);
      ctx.restore();

      // ── Top decorative line ──
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = bg.accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(200, 200);
      ctx.lineTo(CANVAS_W - 200, 200);
      ctx.stroke();
      ctx.restore();

      // ── Verse counter ──
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.font = "22px sans-serif";
      ctx.fillStyle = bg.accent;
      ctx.textAlign = "center";
      ctx.fillText(
        `${displayVerse + 1} / ${verses.length}`,
        CANVAS_W / 2,
        240
      );
      ctx.restore();

      // ── LYRICS (THE MAIN EVENT) ──
      ctx.save();

      // Apply fade transition (interpolated)
      transitionAlphaRef.current += (targetAlphaRef.current - transitionAlphaRef.current) * 0.15;
      const alpha = transitionAlphaRef.current;
      ctx.globalAlpha = Math.max(0, alpha);

      const lineHeight = 110;
      const totalHeight = verse.length * lineHeight;
      const startY = (CANVAS_H / 2) - (totalHeight / 2) + 20;

      verse.forEach((line, i) => {
        const y = startY + i * lineHeight;

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 54px sans-serif";
        ctx.fillStyle = "#f0e8d8";

        // Subtle glow on text
        ctx.shadowColor = `${bg.accent}40`;
        ctx.shadowBlur = 20;

        // Truncate if needed
        let text = line;
        if (ctx.measureText(text).width > CANVAS_W - 140) {
          while (ctx.measureText(text + "…").width > CANVAS_W - 140 && text.length > 0) {
            text = text.slice(0, -1);
          }
          text += "…";
        }

        ctx.fillText(text, CANVAS_W / 2, y);
        ctx.restore();
      });

      // Decorative diamond below verse
      ctx.save();
      ctx.globalAlpha = alpha * 0.2;
      ctx.font = "24px sans-serif";
      ctx.fillStyle = bg.accent;
      ctx.textAlign = "center";
      ctx.fillText("——  ✦  ——", CANVAS_W / 2, startY + verse.length * lineHeight + 40);
      ctx.restore();

      ctx.restore(); // End verse alpha

      // ── Bottom: Song info ──
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.font = "bold 36px sans-serif";
      ctx.fillStyle = bg.accent;
      ctx.textAlign = "center";
      ctx.fillText(selected.title, CANVAS_W / 2, CANVAS_H - 220);
      if (selected.zemari) {
        ctx.font = "28px sans-serif";
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#ccc";
        ctx.fillText(`♪ ${selected.zemari.name}`, CANVAS_W / 2, CANVAS_H - 170);
      }
      ctx.restore();

      // Bottom decorative line
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = bg.accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(200, CANVAS_H - 260);
      ctx.lineTo(CANVAS_W - 200, CANVAS_H - 260);
      ctx.stroke();
      ctx.restore();

      // ── Countdown overlay ──
      if (countdown > 0) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.font = "bold 200px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(countdown), CANVAS_W / 2, CANVAS_H / 2);
        ctx.font = "36px sans-serif";
        ctx.globalAlpha = 0.6;
        ctx.fillText("Recording starting...", CANVAS_W / 2, CANVAS_H / 2 + 120);
        ctx.restore();
      }

      // Recording indicator (subtle)
      if (isRecording && countdown === 0) {
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 400) * 0.3;
        ctx.fillStyle = "#e53935";
        ctx.beginPath();
        ctx.arc(CANVAS_W - 70, 70, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
    [bgPreset, displayVerse, selected, verses, transitionAlpha, isRecording, countdown]
  );

  // ── Render loop ──
  useEffect(() => {
    if (!canvasRef.current || !selected) return;
    const ctx = canvasRef.current.getContext("2d")!;

    const render = () => {
      drawFrame(ctx);
      if (isRecording) {
        setRecordTime(Math.floor((Date.now() - recordStartRef.current) / 1000));
      }
      animFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawFrame, selected, isRecording]);

  // ── Auto-scroll verse list ──
  useEffect(() => {
    if (!verseListRef.current) return;
    const el = verseListRef.current.querySelector(".verse-card--active");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeVerse]);

  // ── Keyboard: ↑↓ to switch verses ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setActiveVerse((p) => Math.min(p + 1, verses.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setActiveVerse((p) => Math.max(p - 1, 0));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [verses.length]);

  // ── Recording with countdown ──
  const startRecording = useCallback(async () => {
    if (!canvasRef.current || !selected) return;
    setDownloadUrl(null);
    chunksRef.current = [];

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) {
        alert("⚠️ No audio captured!\n\nMake sure to:\n1. Select THIS TAB\n2. Check ✅ 'Share audio' at the bottom");
        displayStream.getTracks().forEach((t) => t.stop());
        return;
      }

      const canvasStream = canvasRef.current.captureStream(FPS);
      const videoTracks = canvasStream.getVideoTracks();
      const combined = new MediaStream([...videoTracks, ...audioTracks]);
      displayStream.getVideoTracks().forEach((t) => t.stop());

      const recorder = new MediaRecorder(combined, {
        mimeType: "video/webm;codecs=vp9,opus",
        videoBitsPerSecond: 5_000_000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setDownloadUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        setCountdown(0);
        combined.getTracks().forEach((t) => t.stop());
        displayStream.getTracks().forEach((t) => t.stop());
      };

      recorderRef.current = recorder;

      // 3-2-1 countdown
      setIsRecording(true);
      setCountdown(3);
      await new Promise((r) => setTimeout(r, 1000));
      setCountdown(2);
      await new Promise((r) => setTimeout(r, 1000));
      setCountdown(1);
      await new Promise((r) => setTimeout(r, 1000));
      setCountdown(0);

      recorder.start(100);
      recordStartRef.current = Date.now();
      setRecordTime(0);
    } catch (err: any) {
      setIsRecording(false);
      setCountdown(0);
      if (err.name !== "NotAllowedError") {
        alert("Recording failed: " + err.message);
      }
    }
  }, [selected]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state !== "inactive") {
      recorderRef.current?.stop();
    }
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="studio-layout">
      {/* ── LEFT PANEL ── */}
      <div className="studio-controls">
        {/* 1. Mezmur Selector */}
        <div className="ctrl-card">
          <h3 className="ctrl-label">1. Select Mezmur</h3>
          <input
            type="text"
            className="search-input font-ethiopic"
            placeholder="Search mezmurs with lyrics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="mezmur-list">
            {filteredMezmurs.slice(0, 50).map((m) => (
              <button
                key={m.id}
                className={`mz-item font-ethiopic ${selectedId === m.id ? "mz-item--active" : ""}`}
                onClick={() => {
                  setSelectedId(m.id);
                  setActiveVerse(0);
                  setDisplayVerse(0);
                  transitionAlphaRef.current = 1;
                  targetAlphaRef.current = 1;
                  setDownloadUrl(null);
                }}
              >
                <span className="mz-title">{m.title}</span>
                <span className="mz-meta">
                  {m.zemari?.name || "—"} • {m.lyrics.filter((l) => l.trim()).length} lines
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Background */}
        <div className="ctrl-card">
          <h3 className="ctrl-label">2. Theme</h3>
          <div className="bg-grid">
            {BG_PRESETS.map((bg, i) => (
              <button
                key={i}
                className={`bg-chip ${bgPreset === i ? "bg-chip--on" : ""}`}
                onClick={() => setBgPreset(i)}
                disabled={isRecording}
              >
                <span className="bg-dot" style={{ background: bg.accent }} />
                {bg.name}
              </button>
            ))}
          </div>
        </div>

        {/* 3. YouTube Player */}
        {selected?.youtubeUrl && (
          <div className="ctrl-card">
            <h3 className="ctrl-label">
              3. Play Audio
              <span className="ctrl-hint">Must be playing before recording</span>
            </h3>
            <div className="yt-box">
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(selected.youtubeUrl)}?rel=0`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={selected.title}
              />
            </div>
          </div>
        )}

        {/* 4. Verse Navigator */}
        {selected && verses.length > 0 && (
          <div className="ctrl-card">
            <h3 className="ctrl-label">
              4. Navigate Verses
              <span className="ctrl-hint">↑↓ keys or click • {verses.length} verses</span>
            </h3>
            <div className="verse-list" ref={verseListRef}>
              {verses.map((verse, i) => (
                <button
                  key={i}
                  className={`verse-card font-ethiopic ${activeVerse === i ? "verse-card--active" : ""}`}
                  onClick={() => setActiveVerse(i)}
                >
                  <span className="verse-num">V{i + 1}</span>
                  <div className="verse-preview">
                    {verse.slice(0, 3).map((line, j) => (
                      <p key={j}>{line}</p>
                    ))}
                    {verse.length > 3 && <p className="verse-more">+{verse.length - 3} more</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Record */}
        <div className="ctrl-card">
          <h3 className="ctrl-label">5. Record & Export</h3>

          {!isRecording ? (
            <button className="btn-rec" onClick={startRecording} disabled={!selected}>
              🔴 Start Recording (3s countdown)
            </button>
          ) : (
            <div className="rec-status">
              <div className="rec-bar">
                <span className="rec-blink" />
                {countdown > 0 ? `Starting in ${countdown}...` : `REC ${fmt(recordTime)}`}
              </div>
              <button className="btn-stop" onClick={stopRecording} disabled={countdown > 0}>
                ⏹ Stop & Save
              </button>
            </div>
          )}

          {downloadUrl && (
            <a
              href={downloadUrl}
              download={`${selected?.title || "mezmur"}_tiktok.webm`}
              className="btn-dl"
            >
              ⬇️ Download Video (.webm)
            </a>
          )}
        </div>

        {/* Instructions */}
        <div className="ctrl-card ctrl-help">
          <h3 className="ctrl-label">💡 Quick Guide</h3>
          <ol>
            <li>Select a mezmur</li>
            <li><strong>Play audio</strong> from the YouTube player above</li>
            <li>Click <strong>🔴 Record</strong> → Select <strong>this tab</strong> → ✅ <strong>Share audio</strong></li>
            <li>Navigate verses with <strong>↑↓ keys</strong> or clicking as you listen</li>
            <li>Click <strong>⏹ Stop</strong> when done → Download!</li>
          </ol>
        </div>
      </div>

      {/* ── RIGHT PANEL: CANVAS ── */}
      <div className="studio-preview">
        <div className="phone-frame">
          {selected ? (
            <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="tiktok-canvas" />
          ) : (
            <div className="empty-canvas">
              <span>🎬</span>
              <p>Select a mezmur to preview</p>
            </div>
          )}
        </div>
      </div>

      <style>{css}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════════════════════════

const css = `
  .studio-layout {
    display: grid;
    grid-template-columns: 420px 1fr;
    gap: 24px;
  }

  .studio-controls {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 84vh;
    overflow-y: auto;
    padding-right: 6px;
  }

  .ctrl-card {
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    border-radius: 12px;
    padding: 14px 16px;
  }

  .ctrl-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: hsl(var(--color-text));
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ctrl-hint {
    font-size: 10px;
    font-weight: 400;
    color: hsl(var(--color-text-3));
    text-transform: none;
    letter-spacing: 0;
  }

  /* Search */
  .search-input {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid hsl(var(--color-border));
    border-radius: 8px;
    background: hsl(var(--color-bg));
    color: hsl(var(--color-text));
    font-size: 14px;
    margin-bottom: 6px;
    outline: none;
    box-sizing: border-box;
  }
  .search-input:focus { border-color: hsl(var(--color-accent)); }

  /* Mezmur List */
  .mezmur-list {
    max-height: 160px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .mz-item {
    display: flex; flex-direction: column; gap: 2px;
    padding: 7px 10px; border-radius: 6px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    transition: all 0.12s; width: 100%;
  }
  .mz-item:hover { background: hsl(var(--color-overlay)); }
  .mz-item--active { background: hsl(var(--color-accent) / 0.12); border-left: 3px solid hsl(var(--color-accent)); }
  .mz-title { font-size: 13px; font-weight: 600; color: hsl(var(--color-text)); }
  .mz-meta { font-size: 10px; color: hsl(var(--color-text-3)); }

  /* BG Theme Grid */
  .bg-grid { display: flex; flex-wrap: wrap; gap: 4px; }
  .bg-chip {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 10px; border-radius: 6px; font-size: 11px;
    border: 1px solid hsl(var(--color-border));
    background: hsl(var(--color-bg)); color: hsl(var(--color-text-2));
    cursor: pointer; transition: all 0.12s;
  }
  .bg-chip--on { border-color: hsl(var(--color-accent)); background: hsl(var(--color-accent) / 0.1); }
  .bg-chip:disabled { opacity: 0.4; }
  .bg-dot { width: 12px; height: 12px; border-radius: 50%; }

  /* YouTube Embed */
  .yt-box {
    position: relative; width: 100%; padding-bottom: 56.25%;
    border-radius: 8px; overflow: hidden; background: #000;
  }
  .yt-box iframe {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%; border: none;
  }

  /* Verse Navigator */
  .verse-list {
    max-height: 280px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    scroll-behavior: smooth;
  }

  .verse-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: hsl(var(--color-bg));
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    width: 100%;
  }

  .verse-card:hover {
    border-color: hsl(var(--color-border));
    background: hsl(var(--color-overlay));
  }

  .verse-card--active {
    border-color: hsl(var(--color-accent) / 0.4);
    background: hsl(var(--color-accent) / 0.08);
    box-shadow: 0 0 0 1px hsl(var(--color-accent) / 0.15);
  }

  .verse-num {
    font-size: 10px;
    font-weight: 700;
    color: hsl(var(--color-text-3));
    background: hsl(var(--color-surface-2));
    padding: 2px 6px;
    border-radius: 4px;
    min-width: 28px;
    text-align: center;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .verse-card--active .verse-num {
    background: hsl(var(--color-accent) / 0.15);
    color: hsl(var(--color-accent));
  }

  .verse-preview {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .verse-preview p {
    font-size: 12px;
    color: hsl(var(--color-text-2));
    margin: 0;
    line-height: 1.5;
  }

  .verse-card--active .verse-preview p {
    color: hsl(var(--color-accent));
  }

  .verse-more {
    font-size: 10px !important;
    color: hsl(var(--color-text-3)) !important;
    font-style: italic;
  }

  /* Record Buttons */
  .btn-rec, .btn-stop, .btn-dl {
    width: 100%; padding: 13px; border-radius: 10px; border: none;
    font-size: 14px; font-weight: 600; cursor: pointer;
    transition: all 0.2s; text-align: center; text-decoration: none;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }

  .btn-rec {
    background: linear-gradient(135deg, #e53935, #c62828);
    color: white;
    box-shadow: 0 4px 14px rgba(229,57,53,0.3);
  }
  .btn-rec:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(229,57,53,0.4); }
  .btn-rec:disabled { opacity: 0.35; cursor: not-allowed; }

  .rec-status { display: flex; flex-direction: column; gap: 6px; }

  .rec-bar {
    display: flex; align-items: center; gap: 8px;
    justify-content: center; padding: 10px;
    font-size: 16px; font-weight: 700; color: #e53935;
    font-variant-numeric: tabular-nums;
  }

  .rec-blink {
    width: 10px; height: 10px; border-radius: 50%;
    background: #e53935; animation: blink 1s ease infinite;
  }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }

  .btn-stop { background: #555; color: white; }
  .btn-stop:hover:not(:disabled) { background: #666; }
  .btn-stop:disabled { opacity: 0.4; }

  .btn-dl {
    margin-top: 6px;
    background: linear-gradient(135deg, hsl(var(--color-accent)), hsl(var(--color-accent) / 0.8));
    color: white; box-shadow: 0 4px 14px hsl(var(--color-accent) / 0.3);
  }
  .btn-dl:hover { transform: translateY(-1px); }

  .ctrl-help {
    background: hsl(var(--color-accent) / 0.04);
    border-color: hsl(var(--color-accent) / 0.12);
  }
  .ctrl-help ol {
    font-size: 11px; color: hsl(var(--color-text-2));
    line-height: 2; padding-left: 16px; margin: 0;
  }

  /* ── Canvas Preview ── */
  .studio-preview {
    display: flex; justify-content: center; align-items: flex-start;
    position: sticky; top: 12px;
  }

  .phone-frame {
    width: 290px;
    border-radius: 20px;
    overflow: hidden;
    border: 3px solid hsl(var(--color-border));
    box-shadow: 0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05);
    background: #000;
  }

  .tiktok-canvas { width: 100%; height: auto; display: block; }

  .empty-canvas {
    width: 290px; height: 516px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px;
    color: hsl(var(--color-text-3)); font-size: 13px;
  }
  .empty-canvas span { font-size: 40px; opacity: 0.3; }

  @media (max-width: 900px) {
    .studio-layout { grid-template-columns: 1fr; }
    .studio-preview { order: -1; position: static; }
    .phone-frame { width: 200px; margin: 0 auto; }
  }
`;
