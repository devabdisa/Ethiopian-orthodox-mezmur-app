"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { GlobalAudioPlayer } from "./GlobalAudioPlayer";
import { usePlayerKeyboardShortcuts } from "@/hooks/usePlayerKeyboardShortcuts";
import { usePlayerStore } from "@/store/playerStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  usePlayerKeyboardShortcuts(); // ← Global keyboard shortcuts (Space, M, N, P, ←, →)

  // ── Sync lyrics page with player track changes (Next/Prev) ──────────────
  const pathname = usePathname();
  const router = useRouter();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const prevTrackIdRef = useRef<string | null>(currentTrack?.id ?? null);

  useEffect(() => {
    const newId = currentTrack?.id ?? null;
    const prevId = prevTrackIdRef.current;
    prevTrackIdRef.current = newId;

    // Only navigate when:
    // 1. The track actually changed to a *different* track (not null → null or same → same)
    // 2. The user is already on a mezmur lyrics page
    if (newId && newId !== prevId && pathname.startsWith("/mezmurs/")) {
      router.push(`/mezmurs/${newId}`);
    }
  }, [currentTrack?.id, pathname, router]);

  const open = () => setSidebarOpen(true);
  const close = () => setSidebarOpen(false);

  return (
    <div className="app-shell">
      {/* ── Mobile overlay (dims content when sidebar is open) ── */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "is-open" : ""}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* ── Sidebar (hidden off-screen on mobile, visible on desktop) ── */}
      <aside className={`app-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <Sidebar onClose={close} />
      </aside>

      {/* ── Main content ── */}
      <main className="app-main">
        {/* Mobile topbar with hamburger */}
        <div className="mobile-topbar">
          <button
            className="hamburger-btn"
            onClick={open}
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </button>
          <span className="mobile-logo">🕊️ ቅዱሳን Mezmur</span>
        </div>

        {/* Page content */}
        <div className="page-content">{children}</div>
      </main>

      {/* ── Global audio player bar (always visible at bottom) ── */}
      <div className="app-player">
        <GlobalAudioPlayer />
      </div>

      <style>{shellStyles}</style>
    </div>
  );
}

// ── Scoped styles ─────────────────────────────────────────────────────────────
const shellStyles = `
  .mobile-topbar {
    display: none;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    border-bottom: 1px solid hsl(var(--color-border));
    position: sticky;
    top: 0;
    z-index: 30;
    background: hsl(var(--color-bg));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  @media (max-width: 768px) {
    .mobile-topbar {
      display: flex;
    }
  }

  .hamburger-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: var(--radius);
    border: 1px solid hsl(var(--color-border));
    background: hsl(var(--color-surface));
    color: hsl(var(--color-text));
    cursor: pointer;
    transition: all var(--transition);
    flex-shrink: 0;
  }

  .hamburger-btn:hover {
    background: hsl(var(--color-overlay));
    border-color: hsl(var(--color-accent) / .4);
    color: hsl(var(--color-accent));
  }

  .mobile-logo {
    font-size: 15px;
    font-weight: 600;
    color: hsl(var(--color-text));
    font-family: var(--font-noto-ethiopic, serif);
  }

  .page-content {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  @media (max-width: 640px) {
    .page-content {
      padding: 16px;
    }
  }
`;

// ── Inline hamburger icon ─────────────────────────────────────────────────────
function HamburgerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
