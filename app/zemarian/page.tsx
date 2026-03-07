import prisma from "@/lib/db/prisma";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zemarian (ዘማሪያን) — ቅዱሳን Mezmur",
  description:
    "Browse popular Ethiopian Orthodox Tewahedo Zemarian (Singers) and their Mezmurs.",
};

export default async function ZemarianPage() {
  const zemarian = await prisma.zemari.findMany({
    include: {
      _count: {
        select: { mezmurs: true },
      },
    },
    orderBy: {
      // Order by the most number of mezmurs
      mezmurs: {
        _count: "desc",
      },
    },
  });

  return (
    <div className="zemarian-page">
      <div className="page-header">
        <h1 className="page-title">Zemarian (ዘማሪያን)</h1>
        <p className="page-subtitle">
          Browse the voices behind our sacred Ethiopian Orthodox Tewahedo hymns.
        </p>
      </div>

      {zemarian.length === 0 ? (
        <div className="empty-state">
          <p>No Zemarian found in the database yet.</p>
        </div>
      ) : (
        <div className="zemari-grid">
          {zemarian.map((zemari) => (
            <Link key={zemari.id} href={`/zemari/${zemari.id}`} className="zemari-card">
              <div className="zemari-avatar">
                {zemari.imageUrl ? (
                  <img
                    src={zemari.imageUrl}
                    alt={zemari.nameAmharic || zemari.name}
                    className="avatar-img"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {(zemari.nameAmharic || zemari.name).charAt(0)}
                  </div>
                )}
              </div>

              <div className="zemari-info">
                <h3 className="zemari-name-amharic">
                  {zemari.nameAmharic || zemari.name}
                </h3>
                {zemari.nameAmharic && zemari.nameAmharic !== zemari.name && (
                  <span className="zemari-name-latin">{zemari.name}</span>
                )}

                <div className="zemari-stats">
                  <span className="stat-badge">
                    🎵 {zemari._count.mezmurs} Mezmurs
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .zemarian-page {
          padding: 40px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .page-header {
          margin-bottom: 48px;
          text-align: center;
        }
        
        .page-title {
          font-family: var(--font-noto-ethiopic);
          font-size: 40px;
          font-weight: 700;
          color: hsl(var(--color-text));
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          color: hsl(var(--color-text-2));
          font-size: 16px;
        }

        .zemari-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .zemari-card {
          background: hsl(var(--color-surface));
          border: 1px solid hsl(var(--color-border));
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .zemari-card:hover {
          transform: translateY(-4px);
          border-color: hsl(var(--color-accent));
          box-shadow: 0 12px 24px -10px hsla(var(--color-accent) / 0.15);
        }

        .zemari-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 2px solid hsl(var(--color-overlay));
          overflow: hidden;
          flex-shrink: 0;
          background: hsl(var(--color-overlay));
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-noto-ethiopic);
          font-size: 28px;
          font-weight: 600;
          color: hsl(var(--color-accent));
        }

        .zemari-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .zemari-name-amharic {
          font-family: var(--font-noto-ethiopic);
          font-size: 20px;
          font-weight: 600;
          color: hsl(var(--color-text));
        }

        .zemari-name-latin {
          font-size: 13px;
          color: hsl(var(--color-text-2));
        }

        .zemari-stats {
          margin-top: 8px;
        }

        .stat-badge {
          display: inline-flex;
          align-items: center;
          background: hsla(var(--color-accent) / 0.1);
          color: hsl(var(--color-accent));
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
        }

        .empty-state {
          text-align: center;
          padding: 60px 0;
          color: hsl(var(--color-text-2));
          border: 1px dashed hsl(var(--color-border));
          border-radius: 16px;
        }
      `}</style>
    </div>
  );
}
