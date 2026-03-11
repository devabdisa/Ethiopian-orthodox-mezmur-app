import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { PlayMezmurButton } from "@/components/mezmur/PlayMezmurButton";
import { FavoriteButton } from "@/components/mezmur/FavoriteButton";
import { AddToPlaylistButton } from "@/components/mezmur/AddToPlaylistButton";
import { getFavoriteIds } from "@/app/actions/favorites";

export const revalidate = 60;

export default async function MezmurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const mezmur = await prisma.mezmur.findUnique({
    where: { id },
    include: {
      subCategory: {
        include: {
          category: true,
        },
      },
      zemari: true,
    },
  });

  if (!mezmur) return notFound();

  const track = {
    id: mezmur.id,
    title: mezmur.title,
    youtubeUrl: mezmur.youtubeUrl,
    subCategoryName: mezmur.subCategory.name,
  };

  const catSlug = encodeURIComponent(mezmur.subCategory.category.name);
  const hasLyrics = mezmur.lyrics && mezmur.lyrics.length > 0 && mezmur.lyrics.some(l => l.trim() !== "");

  // Check if this mezmur is favorited by the current user
  const favIds = await getFavoriteIds([mezmur.id]);
  const isFavorited = favIds.includes(mezmur.id);

  return (
    <div className="mezmur-page animate-in">
      {/* ── Breadcrumb ── */}
      <nav className="breadcrumb">
        <Link href="/" className="crumb-link">
          Home
        </Link>
        <span className="crumb-sep">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </span>
        <Link href={`/categories/${catSlug}`} className="crumb-link">
          {mezmur.subCategory.category.nameTransliterated ||
            mezmur.subCategory.category.name}
        </Link>
        <span className="crumb-sep">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </span>
        <span
          className="crumb-current font-ethiopic"
          style={{ fontSize: "14px" }}
        >
          {mezmur.title}
        </span>
      </nav>

      {/* ── Header ── */}
      <header className="mezmur-header">
        {/* Decorative cross */}
        <div className="header-cross">✦</div>

        <div className="header-top">
          <p className="sub-cat font-ethiopic">{mezmur.subCategory.name}</p>
          <span className="dot">•</span>
          <p className="cat-en">
            {mezmur.subCategory.nameTransliterated ||
              mezmur.subCategory.category.nameTransliterated}
          </p>
        </div>

        <h1 className="mezmur-title font-ethiopic text-accent">
          {mezmur.title}
        </h1>

        {/* Zemari name if available */}
        {mezmur.zemari && (
          <Link href={`/zemari/${mezmur.zemari.id}`} className="zemari-tag">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span className="font-ethiopic">{mezmur.zemari.name}</span>
          </Link>
        )}

        <div className="play-wrapper">
          <PlayMezmurButton track={track} variant="full" />
          <FavoriteButton
            mezmurId={mezmur.id}
            initialFavorited={isFavorited}
            size={24}
          />
          <AddToPlaylistButton mezmurId={mezmur.id} />
        </div>
      </header>

      {/* ── Lyrics Layout ── */}
      <main className="mezmur-body">
        {hasLyrics ? (
          <div className="lyrics-wrapper">
            {/* Lyrics header */}
            <div className="lyrics-header">
              <div className="lyrics-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                <span>Lyrics</span>
              </div>
            </div>

            {/* Lyrics content with verse markers */}
            <div className="lyrics-content">
              {mezmur.lyrics.map((line, idx) => {
                if (line.trim() === "") {
                  return <div key={idx} className="lyric-verse-break" />;
                }
                return (
                  <p
                    key={idx}
                    className="lyric-line font-ethiopic"
                  >
                    {line}
                  </p>
                );
              })}
            </div>

            {/* Decorative bottom */}
            <div className="lyrics-footer">
              <span className="lyrics-end-mark">✦ ✦ ✦</span>
            </div>
          </div>
        ) : (
          /* ── No Lyrics State ── */
          <div className="no-lyrics-wrapper">
            <div className="no-lyrics-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <h3 className="no-lyrics-title font-ethiopic">ግጥም ገና አልተጨመረም</h3>
            <p className="no-lyrics-subtitle">Lyrics haven&apos;t been added yet for this Mezmur.</p>
            <p className="no-lyrics-cta">Know the lyrics? Help the community by contributing!</p>
            <a href={`/mezmurs/${id}/contribute`} className="contribute-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>✍️ Contribute Lyrics</span>
            </a>
          </div>
        )}

        {/* Translation / Meaning sidebar if it exists */}
        {mezmur.meaning && (
          <aside className="meaning-panel">
            <div className="meaning-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
              <h3 className="meaning-title">Ge&apos;ez Translation / Meaning</h3>
            </div>
            <p className="meaning-text font-ethiopic">{mezmur.meaning}</p>
          </aside>
        )}

        {/* ── Contribute CTA (when lyrics exist but could be improved) ── */}
        {hasLyrics && (
          <div className="contribute-section">
            <div className="contribute-inner">
              <div className="contribute-text">
                <p className="contribute-heading">🙏 Help improve these lyrics</p>
                <p className="contribute-desc">Found a mistake or have a better version? Your contribution helps the community.</p>
              </div>
              <a href={`/mezmurs/${id}/contribute`} className="contribute-btn-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                ✍️ Contribute
              </a>
            </div>
          </div>
        )}
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .mezmur-page {
    padding: 12px 0 80px;
    max-width: 800px;
    margin: 0 auto;
  }

  /* Breadcrumb */
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    margin-bottom: 32px;
    color: hsl(var(--color-text-2));
    flex-wrap: wrap;
  }
  .crumb-link {
    color: hsl(var(--color-text-3));
    text-decoration: none;
    transition: color var(--transition);
  }
  .crumb-link:hover {
    color: hsl(var(--color-accent));
  }
  .crumb-sep {
    color: hsl(var(--color-text-3));
    display: flex;
    align-items: center;
    opacity: 0.5;
  }
  .crumb-current {
    color: hsl(var(--color-text));
    font-weight: 500;
  }

  /* Header */
  .mezmur-header {
    text-align: center;
    margin-bottom: 48px;
    padding-bottom: 40px;
    border-bottom: 1px solid hsl(var(--color-border));
    position: relative;
  }

  .header-cross {
    font-size: 24px;
    color: hsl(var(--color-accent) / 0.3);
    margin-bottom: 16px;
    letter-spacing: 12px;
  }

  .header-top {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 12px;
    color: hsl(var(--color-text-3));
    font-size: 13px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .sub-cat {
    color: hsl(var(--color-text-2));
    font-size: 14px;
    text-transform: none;
    letter-spacing: 0;
  }

  .mezmur-title {
    font-size: clamp(28px, 6vw, 48px);
    font-weight: 700;
    line-height: 1.35;
    margin-bottom: 16px;
    padding: 0 12px;
  }

  .zemari-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    border-radius: 999px;
    background: hsl(var(--color-accent) / 0.1);
    color: hsl(var(--color-accent));
    font-size: 14px;
    text-decoration: none;
    margin-bottom: 20px;
    transition: all var(--transition);
  }
  .zemari-tag:hover {
    background: hsl(var(--color-accent) / 0.2);
    transform: translateY(-1px);
  }

  .play-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 8px;
  }

  /* Lyrics Body */
  .mezmur-body {
    display: grid;
    grid-template-columns: 1fr;
    gap: 32px;
  }

  /* Lyrics card */
  .lyrics-wrapper {
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-lg);
    padding: 0;
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .lyrics-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 32px;
    border-bottom: 1px solid hsl(var(--color-border));
    background: hsl(var(--color-surface-2));
  }

  .lyrics-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: hsl(var(--color-accent));
  }

  .lyrics-content {
    padding: 48px 32px;
  }

  .lyric-line {
    font-size: clamp(17px, 4vw, 22px);
    font-weight: 500;
    line-height: 2.2;
    color: hsl(var(--color-text));
    text-align: center;
    transition: all 0.2s ease;
    padding: 2px 8px;
    border-radius: var(--radius);
  }

  .lyric-line:hover {
    color: hsl(var(--color-accent));
    background: hsl(var(--color-accent) / 0.06);
  }

  .lyric-verse-break {
    height: 28px;
    position: relative;
  }

  .lyric-verse-break::after {
    content: '·';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: hsl(var(--color-accent) / 0.25);
    font-size: 20px;
  }

  .lyrics-footer {
    padding: 20px;
    text-align: center;
    border-top: 1px solid hsl(var(--color-border));
    background: hsl(var(--color-surface-2));
  }

  .lyrics-end-mark {
    font-size: 14px;
    color: hsl(var(--color-accent) / 0.3);
    letter-spacing: 8px;
  }

  /* ── No Lyrics State ── */
  .no-lyrics-wrapper {
    text-align: center;
    padding: 64px 24px;
    background: hsl(var(--color-surface));
    border: 2px dashed hsl(var(--color-border));
    border-radius: var(--radius-lg);
  }

  .no-lyrics-icon {
    color: hsl(var(--color-accent) / 0.3);
    margin-bottom: 20px;
  }

  .no-lyrics-title {
    font-size: 22px;
    font-weight: 600;
    color: hsl(var(--color-text));
    margin-bottom: 8px;
  }

  .no-lyrics-subtitle {
    font-size: 14px;
    color: hsl(var(--color-text-3));
    margin-bottom: 4px;
  }

  .no-lyrics-cta {
    font-size: 14px;
    color: hsl(var(--color-text-2));
    margin-bottom: 24px;
  }

  .contribute-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    border-radius: var(--radius);
    background: linear-gradient(135deg, hsl(var(--color-accent)), hsl(var(--color-accent) / 0.8));
    color: white;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    transition: all var(--transition);
    box-shadow: 0 4px 14px hsl(var(--color-accent) / 0.3);
  }

  .contribute-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px hsl(var(--color-accent) / 0.4);
  }

  /* ── Contribute Section (below existing lyrics) ── */
  .contribute-section {
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-lg);
    padding: 24px;
    box-shadow: var(--shadow-sm);
  }

  .contribute-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .contribute-heading {
    font-size: 15px;
    font-weight: 600;
    color: hsl(var(--color-text));
    margin-bottom: 4px;
  }

  .contribute-desc {
    font-size: 13px;
    color: hsl(var(--color-text-3));
  }

  .contribute-btn-sm {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border-radius: var(--radius);
    background: hsl(var(--color-accent) / 0.1);
    color: hsl(var(--color-accent));
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    transition: all var(--transition);
    white-space: nowrap;
    border: 1px solid hsl(var(--color-accent) / 0.2);
  }

  .contribute-btn-sm:hover {
    background: hsl(var(--color-accent) / 0.2);
    transform: translateY(-1px);
  }

  /* Meaning Panel */
  .meaning-panel {
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    border-left: 4px solid hsl(var(--color-accent));
    padding: 24px;
    border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  }

  .meaning-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    color: hsl(var(--color-accent));
  }

  .meaning-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: hsl(var(--color-text-3));
  }

  .meaning-text {
    font-size: 16px;
    line-height: 1.8;
    color: hsl(var(--color-text-2));
  }

  @media (min-width: 1024px) {
    .mezmur-page {
      max-width: 900px;
    }
    .lyrics-content {
      padding: 60px 48px;
    }
  }

  @media (max-width: 640px) {
    .mezmur-page {
      padding: 4px 0 40px;
    }
    .mezmur-header {
      padding-bottom: 32px;
      margin-bottom: 32px;
    }
    .lyrics-content {
      padding: 32px 16px;
    }
    .lyrics-header {
      padding: 12px 16px;
    }
    .contribute-inner {
      flex-direction: column;
      text-align: center;
    }
  }
`;
