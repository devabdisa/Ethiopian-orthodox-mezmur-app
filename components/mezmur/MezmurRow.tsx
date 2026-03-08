"use client";

import Link from "next/link";
import { type Mezmur } from "@/app/generated/prisma/client";
import { PlayMezmurButton } from "./PlayMezmurButton";
import { FavoriteButton } from "./FavoriteButton";
import { AddToPlaylistButton } from "./AddToPlaylistButton";
import type { PlayerTrack } from "@/types";

interface MezmurRowProps {
  mezmur: Mezmur;
  subCategoryName: string;
  index: number;
  queue?: PlayerTrack[];
  isFavorited?: boolean; // Pre-loaded from the server
}

export function MezmurRow({
  mezmur,
  subCategoryName,
  index,
  queue,
  isFavorited = false,
}: MezmurRowProps) {
  const track = {
    id: mezmur.id,
    title: mezmur.title,
    youtubeUrl: mezmur.youtubeUrl,
    subCategoryName,
  };

  return (
    <div
      className="mezmur-row animate-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <Link href={`/mezmurs/${mezmur.id}`} className="row-link">
        {/* Abstract "play" icon shape as a placeholder/numbering */}
        <div className="row-number">{String(index + 1).padStart(2, "0")}</div>

        <div className="row-content">
          <h4 className="row-title font-ethiopic">{mezmur.title}</h4>
          {mezmur.meaning && (
            <p className="row-meaning">Contains Ge&apos;ez meaning</p>
          )}
        </div>
      </Link>

      {/* ── Actions: Add + Favorite + Play ── */}
      <div className="row-actions">
        <AddToPlaylistButton mezmurId={mezmur.id} />
        <FavoriteButton
          mezmurId={mezmur.id}
          initialFavorited={isFavorited}
          size={16}
        />
        <PlayMezmurButton track={track} queue={queue} variant="icon" />
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .mezmur-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-radius: var(--radius);
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    margin-bottom: 8px;
    transition: all var(--transition);
    position: relative;
    overflow: hidden;
    max-width: 100%;
  }

  .mezmur-row:hover {
    border-color: hsl(var(--color-accent) / .4);
    background: hsl(var(--color-surface-2));
    transform: translateX(4px);
    box-shadow: var(--shadow-sm);
  }

  .row-link {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16px;
    text-decoration: none;
    min-width: 0; /* for truncation */
  }

  .row-number {
    font-size: 11px;
    font-weight: 700;
    color: hsl(var(--color-text-3));
    font-variant-numeric: tabular-nums;
    width: 24px;
    text-align: right;
  }

  .mezmur-row:hover .row-number {
    color: hsl(var(--color-accent));
  }

  .row-content {
    flex: 1;
    min-width: 0;
  }

  .row-title {
    font-size: 16px;
    font-weight: 600;
    color: hsl(var(--color-text));
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row-meaning {
    font-size: 11px;
    color: hsl(var(--color-accent) / .8);
    margin-top: 2px;
    font-style: italic;
  }

  .row-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-left: 12px;
    flex-shrink: 0;
  }
`;
