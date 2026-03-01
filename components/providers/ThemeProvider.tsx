"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { THEMES, type ThemeId } from "@/types";

// ── Detect OS preference ──────────────────────────────────────────────────────
function getOsDefault(): ThemeId {
  if (typeof window === "undefined") return "sacred-night";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "holy-parchment"
    : "sacred-night";
}

const STORAGE_KEY = "mezmur-theme";

// ── Context ───────────────────────────────────────────────────────────────────
interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "sacred-night",
  setTheme: () => {},
  themes: THEMES,
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with null — let the inline <script> in layout.tsx handle initial render
  const [theme, setThemeState] = useState<ThemeId>("sacred-night");

  // On mount, sync state with whatever the inline script already applied
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    const active =
      (document.documentElement.getAttribute("data-theme") as ThemeId) ||
      saved ||
      getOsDefault();
    setThemeState(active);
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    document.documentElement.setAttribute("data-theme", id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}
