"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { transliterate, isLatinText } from "@/lib/amharic-transliterate";
import { usePlayerStore } from "@/store/playerStore";

interface SearchResult {
  id: string;
  title: string;
  subCategoryName: string;
  youtubeUrl: string | null;
  matchingLine: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [transliterated, setTransliterated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { play } = usePlayerStore();

  // ── Debounced search ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTransliterated(null);
      setHasSearched(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
        );
        const data = await res.json();
        setResults(data.results || []);
        setTransliterated(data.transliterated || null);
        setHasSearched(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeout);
  }, [query]);

  // ── Live transliteration preview ────────────────────────────────────────────
  const liveAmharic =
    query.trim() && isLatinText(query.trim())
      ? transliterate(query.trim())
      : null;

  // ── Cmd+K / Ctrl+K global shortcut ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Auto-focus on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handlePlay = useCallback(
    (result: SearchResult) => {
      play(
        {
          id: result.id,
          title: result.title,
          youtubeUrl: result.youtubeUrl,
          subCategoryName: result.subCategoryName,
        },
        results.map((r) => ({
          id: r.id,
          title: r.title,
          youtubeUrl: r.youtubeUrl,
          subCategoryName: r.subCategoryName,
        })),
      );
    },
    [results, play],
  );

  return (
    <div className="search-page">
      {/* Search Input */}
      <div className="search-box animate-in">
        <div className="search-input-wrapper">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search mezmurs... (type in English or Amharic)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              className="search-clear"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              ✕
            </button>
          )}
          <span className="search-shortcut">Ctrl+K</span>
        </div>

        {/* Live transliteration preview */}
        {liveAmharic && (
          <div className="transliteration-preview animate-in">
            <span className="translit-label">Searching as:</span>
            <span className="translit-text font-ethiopic">{liveAmharic}</span>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="search-results">
        {isLoading && (
          <div className="search-loading">
            <span className="loading-spinner" />
            <span>Searching...</span>
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="search-empty animate-in">
            <div className="empty-icon">🔍</div>
            <h2 className="empty-title">No results found</h2>
            <p className="empty-text">
              Try a different search term, or search in Amharic directly.
            </p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <>
            <p className="results-count">
              {results.length} result{results.length !== 1 ? "s" : ""} found
              {transliterated && (
                <span className="results-translit">
                  {" "}
                  — also searched{" "}
                  <span className="font-ethiopic">{transliterated}</span>
                </span>
              )}
            </p>
            <div className="results-list">
              {results.map((r, i) => (
                <div
                  key={r.id}
                  className="result-card animate-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <Link href={`/mezmurs/${r.id}`} className="result-link">
                    <div className="result-main">
                      <h3 className="result-title font-ethiopic">{r.title}</h3>
                      <p className="result-sub">{r.subCategoryName}</p>
                      {r.matchingLine && (
                        <p className="result-lyric font-ethiopic">
                          &ldquo;{r.matchingLine.slice(0, 80)}
                          {r.matchingLine.length > 80 ? "..." : ""}&rdquo;
                        </p>
                      )}
                    </div>
                  </Link>
                  <button
                    className="result-play"
                    onClick={() => handlePlay(r)}
                    title="Play"
                  >
                    <PlayIcon />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {!isLoading && !hasSearched && (
          <div className="search-hint animate-in">
            <p className="hint-title">🎵 Search Tips</p>
            <ul className="hint-list">
              <li>
                Type in <strong>Amharic</strong>: ላመስግንህ
              </li>
              <li>
                Type in <strong>English phonetics</strong>: lamesgnh → will
                auto-convert to ላመስግንህ
              </li>
              <li>
                Search by <strong>lyrics</strong>: any lyric line will match
              </li>
              <li>
                Press <strong>Ctrl+K</strong> from any page to jump here
              </li>
            </ul>
          </div>
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="search-icon"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  .search-page {
    padding: 12px 0 60px;
    max-width: 720px;
    margin: 0 auto;
  }

  /* Search Box */
  .search-box {
    margin-bottom: 32px;
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    background: hsl(var(--color-surface));
    border: 2px solid hsl(var(--color-border));
    border-radius: 16px;
    transition: all var(--transition);
  }

  .search-input-wrapper:focus-within {
    border-color: hsl(var(--color-accent));
    box-shadow: 0 0 0 4px hsl(var(--color-accent) / 0.1);
  }

  .search-icon {
    color: hsl(var(--color-text-3));
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 17px;
    color: hsl(var(--color-text));
    outline: none;
    font-family: inherit;
  }

  .search-input::placeholder {
    color: hsl(var(--color-text-3));
  }

  .search-clear {
    background: hsl(var(--color-surface-2));
    border: none;
    color: hsl(var(--color-text-3));
    cursor: pointer;
    font-size: 14px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition);
  }

  .search-clear:hover {
    background: hsl(var(--color-overlay));
    color: hsl(var(--color-text));
  }

  .search-shortcut {
    font-size: 11px;
    font-weight: 500;
    color: hsl(var(--color-text-3));
    background: hsl(var(--color-surface-2));
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid hsl(var(--color-border));
    flex-shrink: 0;
    user-select: none;
  }

  /* Transliteration preview */
  .transliteration-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 10px 18px;
    background: hsl(var(--color-accent) / 0.08);
    border-radius: 12px;
    border: 1px solid hsl(var(--color-accent) / 0.15);
  }

  .translit-label {
    font-size: 12px;
    color: hsl(var(--color-text-2));
    font-weight: 500;
  }

  .translit-text {
    font-size: 18px;
    color: hsl(var(--color-accent));
    font-weight: 600;
  }

  /* Results */
  .results-count {
    font-size: 13px;
    color: hsl(var(--color-text-2));
    margin-bottom: 16px;
  }

  .results-translit {
    color: hsl(var(--color-text-3));
  }

  .result-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: var(--radius);
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    margin-bottom: 8px;
    transition: all var(--transition);
  }

  .result-card:hover {
    border-color: hsl(var(--color-accent) / 0.4);
    background: hsl(var(--color-surface-2));
    transform: translateX(4px);
  }

  .result-link {
    flex: 1;
    text-decoration: none;
    min-width: 0;
  }

  .result-title {
    font-size: 16px;
    font-weight: 600;
    color: hsl(var(--color-text));
    margin-bottom: 4px;
    line-height: 1.4;
  }

  .result-sub {
    font-size: 12px;
    color: hsl(var(--color-text-3));
    margin-bottom: 6px;
  }

  .result-lyric {
    font-size: 13px;
    color: hsl(var(--color-text-2));
    font-style: italic;
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .result-play {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: hsl(var(--color-surface-2));
    color: hsl(var(--color-text-2));
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all var(--transition);
  }

  .result-play:hover {
    background: hsl(var(--color-accent));
    color: hsl(var(--color-text-on-accent));
    transform: scale(1.1);
  }

  /* Loading */
  .search-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px;
    font-size: 15px;
    color: hsl(var(--color-text-2));
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid hsl(var(--color-border));
    border-top-color: hsl(var(--color-accent));
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Empty */
  .search-empty {
    text-align: center;
    padding: 60px 24px;
    background: hsl(var(--color-surface));
    border: 1px dashed hsl(var(--color-border));
    border-radius: var(--radius-lg);
  }

  .empty-icon { font-size: 48px; margin-bottom: 16px; }

  .empty-title {
    font-size: 20px;
    font-weight: 600;
    color: hsl(var(--color-text));
    margin-bottom: 8px;
  }

  .empty-text {
    font-size: 15px;
    color: hsl(var(--color-text-2));
    max-width: 360px;
    margin: 0 auto;
  }

  /* Hints */
  .search-hint {
    padding: 32px;
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-lg);
  }

  .hint-title {
    font-size: 16px;
    font-weight: 600;
    color: hsl(var(--color-text));
    margin-bottom: 16px;
  }

  .hint-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .hint-list li {
    font-size: 14px;
    color: hsl(var(--color-text-2));
    line-height: 1.5;
    padding-left: 24px;
    position: relative;
  }

  .hint-list li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: hsl(var(--color-accent));
  }

  @media (max-width: 640px) {
    .search-shortcut { display: none; }
    .search-input { font-size: 16px; }
  }
`;
