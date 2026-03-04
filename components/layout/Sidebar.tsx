"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { THEMES, type ThemeId } from "@/types";
import { useSession, signOut } from "@/lib/auth-client";

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/search", label: "Search", icon: SearchIcon },
  { href: "/categories", label: "Browse", icon: GridIcon },
  { href: "/favorites", label: "Favorites", icon: HeartIcon },
] as const;

// ── Theme display config ──────────────────────────────────────────────────────
const THEME_COLORS: Record<ThemeId, string> = {
  "sacred-night": "#c49620",
  "holy-parchment": "#7a3b1e",
  "marian-blue": "#60a5fa",
  "holy-forest": "#86c564",
  "meskel-dawn": "#e06820",
};

// ─────────────────────────────────────────────────────────────────────────────
export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, themes } = useTheme();
  const { data: session } = useSession();

  return (
    <aside className="sidebar-inner">
      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div className="logo-icon">🕊️</div>
        <div className="logo-text">
          <span className="logo-title">ቅዱሳን</span>
          <span className="logo-subtitle">Mezmur</span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        <p className="nav-section-label">Library</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`nav-item ${isActive ? "nav-item--active" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {isActive && <span className="nav-active-dot" />}
            </Link>
          );
        })}
      </nav>

      {/* ── Divider ── */}
      <div className="sidebar-divider" />

      {/* ── Theme switcher ── */}
      <div className="sidebar-section">
        <p className="nav-section-label">Appearance</p>
        <div className="theme-grid">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`theme-btn ${theme === t.id ? "theme-btn--active" : ""}`}
              title={t.label}
              aria-label={`Switch to ${t.label} theme`}
            >
              <span
                className="theme-swatch"
                style={{ background: THEME_COLORS[t.id] }}
              />
              <span className="theme-emoji">{t.emoji}</span>
              <span className="theme-name">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="sidebar-divider" />

      {/* ── Auth profile or Login link ── */}
      {session?.user ? (
        <div className="sidebar-auth logged-in">
          <div className="auth-avatar">
            {session.user.image ? (
              <img src={session.user.image} alt={session.user.name} />
            ) : (
              <span className="font-ethiopic text-sm">
                {session.user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="auth-info">
            <span className="auth-name">{session.user.name}</span>
            <span className="auth-sub">Logged in</span>
          </div>
          <button
            onClick={async () => {
              await signOut();
              router.refresh();
            }}
            className="logout-btn"
            title="Sign Out"
          >
            <LogOutIcon size={16} />
          </button>
        </div>
      ) : (
        <Link href="/auth" onClick={onClose} className="sidebar-auth">
          <div className="auth-avatar">👤</div>
          <div className="auth-info">
            <span className="auth-name">Sign In</span>
            <span className="auth-sub">to save favorites</span>
          </div>
        </Link>
      )}

      {/* ── Bottom branding ── */}
      <div className="sidebar-footer">
        <p>🕊️ Ethiopian Orthodox</p>
        <p>Tewahedo Mezmur</p>
      </div>

      <style>{sidebarStyles}</style>
    </aside>
  );
}

// ── Scoped styles ─────────────────────────────────────────────────────────────
const sidebarStyles = `
  .sidebar-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0 0 16px;
    overflow-y: auto;
  }

  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 20px 16px;
    border-bottom: 1px solid hsl(var(--color-border));
  }

  .logo-icon {
    font-size: 28px;
    line-height: 1;
    filter: drop-shadow(0 0 8px hsl(var(--color-accent) / .5));
  }

  .logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  .logo-title {
    font-size: 18px;
    font-weight: 700;
    color: hsl(var(--color-accent));
    font-family: var(--font-noto-ethiopic, serif);
    letter-spacing: 0.02em;
  }

  .logo-subtitle {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: hsl(var(--color-text-2));
    font-weight: 500;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 10px;
  }

  .nav-section-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: hsl(var(--color-text-3));
    padding: 4px 10px 8px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: var(--radius);
    color: hsl(var(--color-text-2));
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: all var(--transition);
    position: relative;
    cursor: pointer;
  }

  .nav-item:hover {
    background: hsl(var(--color-overlay));
    color: hsl(var(--color-text));
  }

  .nav-item--active {
    background: hsl(var(--color-accent) / .12);
    color: hsl(var(--color-accent));
  }

  .nav-item--active:hover {
    background: hsl(var(--color-accent) / .18);
    color: hsl(var(--color-accent));
  }

  .nav-active-dot {
    position: absolute;
    right: 12px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: hsl(var(--color-accent));
    box-shadow: 0 0 6px hsl(var(--color-accent) / .6);
  }

  .sidebar-divider {
    height: 1px;
    background: hsl(var(--color-border));
    margin: 4px 16px;
  }

  .sidebar-section {
    padding: 12px 10px;
  }

  .theme-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .theme-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: var(--radius);
    border: 1px solid transparent;
    background: transparent;
    color: hsl(var(--color-text-2));
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    transition: all var(--transition);
    text-align: left;
    width: 100%;
  }

  .theme-btn:hover {
    background: hsl(var(--color-overlay));
    color: hsl(var(--color-text));
  }

  .theme-btn--active {
    background: hsl(var(--color-accent) / .1);
    border-color: hsl(var(--color-accent) / .3);
    color: hsl(var(--color-text));
  }

  .theme-swatch {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 0 1px hsl(var(--color-border));
  }

  .theme-emoji {
    font-size: 14px;
    line-height: 1;
  }

  .theme-name {
    flex: 1;
    font-size: 13px;
  }

  .sidebar-auth {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    margin: 4px 10px;
    border-radius: var(--radius);
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    cursor: pointer;
    transition: all var(--transition);
  }

  .sidebar-auth:hover {
    border-color: hsl(var(--color-accent) / .4);
    background: hsl(var(--color-overlay));
  }

  .auth-avatar {
    font-size: 22px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: hsl(var(--color-overlay));
    border-radius: 50%;
    overflow: hidden;
  }

  .auth-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .auth-info {
    display: flex;
    flex-direction: column;
    line-height: 1.3;
  }

  .auth-name {
    font-size: 13px;
    font-weight: 600;
    color: hsl(var(--color-text));
  }

  .auth-sub {
    font-size: 11px;
    color: hsl(var(--color-text-3));
  }

  .logout-btn {
    margin-left: auto;
    background: none;
    border: none;
    color: hsl(var(--color-text-2));
    cursor: pointer;
    padding: 6px;
    border-radius: var(--radius);
    transition: all var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logout-btn:hover {
    background: hsl(0 84% 60% / 0.1);
    color: hsl(0 84% 60%);
  }

  .sidebar-footer {
    margin-top: auto;
    padding: 16px 20px 4px;
    font-size: 10px;
    color: hsl(var(--color-text-3));
    line-height: 1.6;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
`;

// ── Inline SVG icons (no dependency) ─────────────────────────────────────────
function HomeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SearchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function GridIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
    </svg>
  );
}

function HeartIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function LogOutIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
