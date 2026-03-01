// ─── Theme ────────────────────────────────────────────────────────────────────

export type ThemeId =
  | "sacred-night" // 🕯️  Dark  — default dark
  | "holy-parchment" // 📜  Light — default light
  | "marian-blue" // 🌊  Dark  — deep navy + celestial blue
  | "holy-forest" // 🌿  Dark  — deep green + sage
  | "meskel-dawn"; // 🌅  Light — warm white + flame orange

export interface Theme {
  id: ThemeId;
  label: string;
  emoji: string;
  isDark: boolean;
}

export const THEMES: Theme[] = [
  { id: "sacred-night", label: "Sacred Night", emoji: "🕯️", isDark: true },
  { id: "holy-parchment", label: "Holy Parchment", emoji: "📜", isDark: false },
  { id: "marian-blue", label: "Marian Blue", emoji: "🌊", isDark: true },
  { id: "holy-forest", label: "Holy Forest", emoji: "🌿", isDark: true },
  { id: "meskel-dawn", label: "Meskel Dawn", emoji: "🌅", isDark: false },
];

// ─── Mezmur (API response shape) ─────────────────────────────────────────────

export interface MezmurCategory {
  id: string;
  name: string;
  nameTransliterated: string | null;
}

export interface MezmurSubCategory {
  id: string;
  name: string;
  nameTransliterated: string | null;
  category: MezmurCategory;
}

export interface Mezmur {
  id: string;
  title: string;
  lyrics: string[];
  meaning: string | null;
  youtubeUrl: string | null;
  youtubeUrlSource: "AUTO_FETCHED" | "ADMIN_OVERRIDE" | null;
  subCategory: MezmurSubCategory;
  createdAt: string;
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface PlayerTrack {
  id: string;
  title: string;
  youtubeUrl: string | null;
  subCategoryName: string;
}
