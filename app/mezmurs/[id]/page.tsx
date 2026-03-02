import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { PlayMezmurButton } from "@/components/mezmur/PlayMezmurButton";

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

  return (
    <div className="mezmur-page animate-in">
      {/* ── Breadcrumb ── */}
      <nav className="breadcrumb">
        <Link href="/" className="crumb-link">
          Home
        </Link>
        <span className="crumb-sep">/</span>
        <Link href={`/categories/${catSlug}`} className="crumb-link">
          {mezmur.subCategory.category.nameTransliterated ||
            mezmur.subCategory.category.name}
        </Link>
        <span className="crumb-sep">/</span>
        <span
          className="crumb-current font-ethiopic"
          style={{ fontSize: "14px" }}
        >
          {mezmur.title}
        </span>
      </nav>

      {/* ── Header ── */}
      <header className="mezmur-header">
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

        <div className="play-wrapper">
          <PlayMezmurButton track={track} variant="full" />
        </div>
      </header>

      {/* ── Lyrics Layout ── */}
      <main className="mezmur-body">
        <div className="lyrics-wrapper">
          {mezmur.lyrics.map((line, idx) => (
            <p
              key={idx}
              className={`lyric-line font-ethiopic ${
                line.trim() === "" ? "lyric-gap" : ""
              }`}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Translation / Meaning sidebar if it exists */}
        {mezmur.meaning && (
          <aside className="meaning-panel">
            <h3 className="meaning-title">Ge&apos;ez Translation / Meaning</h3>
            <p className="meaning-text font-ethiopic">{mezmur.meaning}</p>
          </aside>
        )}
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .mezmur-page {
    padding: 12px 0 60px;
    max-width: 800px;
    margin: 0 auto;
  }

  /* Breadcrumb */
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    margin-bottom: 32px;
    color: hsl(var(--color-text-2));
  }
  .crumb-link {
    color: hsl(var(--color-text-2));
    text-decoration: none;
    transition: color var(--transition);
  }
  .crumb-link:hover {
    color: hsl(var(--color-text));
  }
  .crumb-sep {
    color: hsl(var(--color-text-3));
  }
  .crumb-current {
    color: hsl(var(--color-accent));
    font-weight: 500;
  }

  /* Header */
  .mezmur-header {
    text-align: center;
    margin-bottom: 48px;
    padding-bottom: 40px;
    border-bottom: 1px dashed hsl(var(--color-border));
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
    font-size: clamp(32px, 5vw, 48px);
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 24px;
    text-shadow: var(--shadow-sm);
  }

  .play-wrapper {
    display: flex;
    justify-content: center;
  }

  /* Lyrics Body */
  .mezmur-body {
    display: grid;
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .lyrics-wrapper {
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-lg);
    padding: 40px 32px;
    box-shadow: var(--shadow-sm);
  }

  .lyric-line {
    font-size: clamp(18px, 3vw, 22px);
    font-weight: 500;
    line-height: 2.2;  /* Generous line height for Ethiopic */
    color: hsl(var(--color-text));
    text-align: center;
    transition: color var(--transition);
  }

  .lyric-line:hover {
    color: hsl(var(--color-accent));
  }

  .lyric-gap {
    height: 24px;
  }

  /* Meaning Panel */
  .meaning-panel {
    background: hsl(var(--color-surface-2));
    border-left: 4px solid hsl(var(--color-accent));
    padding: 24px;
    border-radius: 0 var(--radius) var(--radius) 0;
  }

  .meaning-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: hsl(var(--color-text-3));
    margin-bottom: 12px;
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
    .lyrics-wrapper {
      padding: 60px 48px;
    }
  }

  @media (max-width: 640px) {
    .mezmur-header {
      padding-bottom: 32px;
      margin-bottom: 32px;
    }
    .lyrics-wrapper {
      padding: 32px 20px;
    }
  }
`;
