import prisma from "@/lib/db/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AdminOverview() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  // ── Parallel data fetching for maximum speed ──────────────────────────────
  const [
    totalMezmurs,
    missingYtCount,
    totalUsers,
    todayListens,
    totalCategories,
    recentMezmurs,
  ] = await Promise.all([
    prisma.mezmur.count(),
    prisma.mezmur.count({ where: { youtubeUrl: null } }),
    prisma.user.count(),
    prisma.listenHistory.count({
      where: {
        playedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.category.count(),
    prisma.mezmur.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { subCategory: { include: { category: true } } },
    }),
  ]);

  const coveragePercent =
    totalMezmurs > 0
      ? Math.round(((totalMezmurs - missingYtCount) / totalMezmurs) * 100)
      : 0;

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">
          Welcome back, {session?.user.name?.split(" ")[0]}. Here&apos;s your
          content overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon purple">🎵</div>
          <p className="stat-label">Total Mezmurs</p>
          <p className="stat-number">{totalMezmurs.toLocaleString()}</p>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon amber">⚠️</div>
          <p className="stat-label">Missing YouTube</p>
          <p className="stat-number">{missingYtCount.toLocaleString()}</p>
          <Link href="/admin/mezmurs?filter=missing" className="stat-link">
            Review Queue →
          </Link>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon green">👥</div>
          <p className="stat-label">Registered Users</p>
          <p className="stat-number">{totalUsers.toLocaleString()}</p>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon blue">🎧</div>
          <p className="stat-label">Listens (24h)</p>
          <p className="stat-number">{todayListens.toLocaleString()}</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="overview-columns">
        {/* Coverage Meter */}
        <div className="admin-card">
          <h3 className="admin-section-title">📊 YouTube Coverage</h3>
          <div className="coverage-meter">
            <div className="coverage-bar">
              <div
                className="coverage-fill"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
            <div className="coverage-stats">
              <span className="coverage-percent">{coveragePercent}%</span>
              <span className="coverage-detail">
                {(totalMezmurs - missingYtCount).toLocaleString()} /{" "}
                {totalMezmurs.toLocaleString()} have audio
              </span>
            </div>
          </div>
          <p className="coverage-note">
            {missingYtCount > 0
              ? `${missingYtCount} mezmurs still need a YouTube link.`
              : "All mezmurs have YouTube links! 🎉"}
          </p>
        </div>

        {/* Quick Info */}
        <div className="admin-card">
          <h3 className="admin-section-title">📋 Quick Info</h3>
          <div className="quick-info-list">
            <div className="quick-info-row">
              <span className="qi-label">Categories</span>
              <span className="qi-value">{totalCategories}</span>
            </div>
            <div className="quick-info-row">
              <span className="qi-label">Avg Mezmurs / Category</span>
              <span className="qi-value">
                {totalCategories > 0
                  ? Math.round(totalMezmurs / totalCategories)
                  : 0}
              </span>
            </div>
            <div className="quick-info-row">
              <span className="qi-label">Audio Coverage</span>
              <span className="qi-value">{coveragePercent}%</span>
            </div>
            <div className="quick-info-row">
              <span className="qi-label">Your Role</span>
              <span className="qi-value" style={{ color: "#f87171" }}>
                SUPER ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Mezmurs Table */}
      <div className="admin-card" style={{ marginTop: 24 }}>
        <h3 className="admin-section-title">🕐 Recently Added Mezmurs</h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>YouTube</th>
              </tr>
            </thead>
            <tbody>
              {recentMezmurs.map((m) => (
                <tr key={m.id}>
                  <td style={{ color: "var(--admin-text)", fontWeight: 500 }}>
                    {m.title}
                  </td>
                  <td>{m.subCategory.category.name}</td>
                  <td>
                    {m.youtubeUrl ? (
                      <span className="status-badge ok">● Linked</span>
                    ) : (
                      <span className="status-badge missing">● Missing</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{overviewStyles}</style>
    </div>
  );
}

const overviewStyles = `
  .overview-columns {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 16px;
  }

  @media (max-width: 900px) {
    .overview-columns {
      grid-template-columns: 1fr;
    }
  }

  /* Coverage Meter */
  .coverage-meter {
    margin: 20px 0 16px;
  }

  .coverage-bar {
    height: 10px;
    background: var(--admin-surface-2);
    border-radius: 99px;
    overflow: hidden;
  }

  .coverage-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--admin-accent), var(--admin-green));
    border-radius: 99px;
    transition: width 1s ease;
  }

  .coverage-stats {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-top: 12px;
  }

  .coverage-percent {
    font-size: 32px;
    font-weight: 700;
    color: var(--admin-text);
    letter-spacing: -0.03em;
  }

  .coverage-detail {
    font-size: 13px;
    color: var(--admin-text-3);
  }

  .coverage-note {
    font-size: 13px;
    color: var(--admin-text-2);
    margin-top: 4px;
  }

  /* Quick Info */
  .quick-info-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .quick-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px solid var(--admin-border);
  }

  .quick-info-row:last-child {
    border-bottom: none;
  }

  .qi-label {
    font-size: 14px;
    color: var(--admin-text-2);
  }

  .qi-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--admin-text);
  }
`;
