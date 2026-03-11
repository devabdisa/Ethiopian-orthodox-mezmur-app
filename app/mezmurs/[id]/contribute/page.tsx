import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { ContributeForm } from "./ContributeForm";

export default async function ContributePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const mezmur = await prisma.mezmur.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      subCategory: {
        select: {
          name: true,
          category: { select: { name: true, nameTransliterated: true } },
        },
      },
      zemari: { select: { name: true } },
    },
  });

  if (!mezmur) return notFound();

  const hasExistingLyrics =
    mezmur.subCategory !== null;

  return (
    <div className="contribute-page animate-in">
      {/* ── Breadcrumb ── */}
      <nav className="breadcrumb">
        <Link href="/" className="crumb-link">Home</Link>
        <span className="crumb-sep">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </span>
        <Link href={`/mezmurs/${id}`} className="crumb-link font-ethiopic">
          {mezmur.title}
        </Link>
        <span className="crumb-sep">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </span>
        <span className="crumb-current">Contribute Lyrics</span>
      </nav>

      {/* ── Header ── */}
      <header className="contribute-header">
        <div className="header-icon">✍️</div>
        <h1 className="contribute-title">Contribute Lyrics</h1>
        <p className="contribute-subtitle font-ethiopic text-accent" style={{ fontSize: '20px' }}>
          {mezmur.title}
        </p>
        {mezmur.zemari && (
          <p className="contribute-artist font-ethiopic">{mezmur.zemari.name}</p>
        )}
      </header>

      {/* ── Guidelines ── */}
      <div className="guidelines-card">
        <h3 className="guidelines-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          Before you contribute
        </h3>
        <ul className="guidelines-list">
          <li>📋 You can <strong>copy-paste</strong> lyrics from Telegram channels or other sources</li>
          <li>🇪🇹 Only <strong>Amharic / Ge&apos;ez</strong> text is accepted</li>
          <li>✨ Don&apos;t worry about formatting — our system will clean it up automatically</li>
          <li>⏳ Your submission will be <strong>reviewed by an admin</strong> before going live</li>
          <li>🙏 Thank you for helping the community!</li>
        </ul>
      </div>

      {/* ── Form ── */}
      <ContributeForm mezmurId={id} mezmurTitle={mezmur.title} />

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .contribute-page {
    padding: 12px 0 80px;
    max-width: 700px;
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
  .contribute-header {
    text-align: center;
    margin-bottom: 32px;
    padding-bottom: 32px;
    border-bottom: 1px solid hsl(var(--color-border));
  }

  .header-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .contribute-title {
    font-size: 28px;
    font-weight: 700;
    color: hsl(var(--color-text));
    margin-bottom: 8px;
  }

  .contribute-subtitle {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .contribute-artist {
    font-size: 14px;
    color: hsl(var(--color-text-3));
  }

  /* Guidelines */
  .guidelines-card {
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 24px;
  }

  .guidelines-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: hsl(var(--color-text));
    margin-bottom: 16px;
  }

  .guidelines-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .guidelines-list li {
    font-size: 14px;
    color: hsl(var(--color-text-2));
    line-height: 1.6;
    padding: 6px 0;
  }

  .guidelines-list li strong {
    color: hsl(var(--color-text));
  }

  @media (max-width: 640px) {
    .contribute-page {
      padding: 4px 0 40px;
    }
    .guidelines-card {
      padding: 16px;
    }
  }
`;
