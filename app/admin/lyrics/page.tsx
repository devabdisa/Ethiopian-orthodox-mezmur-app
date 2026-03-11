import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { LyricsReviewList } from "./LyricsReviewList";

export default async function AdminLyricsPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) redirect("/auth");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (dbUser?.role !== "SUPER_ADMIN") redirect("/admin");

  // Fetch all submissions grouped by status
  const submissions = await prisma.lyricsSubmission.findMany({
    include: {
      mezmur: { select: { id: true, title: true, lyrics: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = submissions.filter((s) => s.status === "PENDING");
  const approved = submissions.filter((s) => s.status === "APPROVED");
  const rejected = submissions.filter((s) => s.status === "REJECTED");

  return (
    <div>
      <div className="admin-page-header">
        <h1>✍️ Lyrics Submissions</h1>
        <p className="admin-page-subtitle">
          Review and approve community-contributed lyrics
        </p>
      </div>

      {/* Stats */}
      <div className="lyrics-stats">
        <div className="stat-card stat-pending">
          <span className="stat-number">{pending.length}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card stat-approved">
          <span className="stat-number">{approved.length}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-card stat-rejected">
          <span className="stat-number">{rejected.length}</span>
          <span className="stat-label">Rejected</span>
        </div>
      </div>

      {/* Pending Section */}
      <section>
        <h2 className="section-title">
          🔔 Pending Review ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="empty-state">No pending submissions. 🎉</p>
        ) : (
          <LyricsReviewList submissions={JSON.parse(JSON.stringify(pending))} />
        )}
      </section>

      {/* Approved History */}
      {approved.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 className="section-title">
            ✅ Recently Approved ({approved.length})
          </h2>
          <div className="history-list">
            {approved.slice(0, 10).map((s) => (
              <div key={s.id} className="history-item">
                <span className="font-ethiopic">{s.mezmur.title}</span>
                <span className="history-meta">
                  by {s.user.name} •{" "}
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .admin-page-header {
    margin-bottom: 24px;
  }

  .admin-page-header h1 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .admin-page-subtitle {
    font-size: 14px;
    color: hsl(var(--color-text-2));
  }

  .lyrics-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 32px;
  }

  .stat-card {
    padding: 16px;
    border-radius: 12px;
    text-align: center;
    border: 1px solid hsl(var(--color-border));
    background: hsl(var(--color-surface));
  }

  .stat-number {
    display: block;
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: hsl(var(--color-text-3));
  }

  .stat-pending .stat-number { color: hsl(40 90% 50%); }
  .stat-approved .stat-number { color: hsl(140 60% 45%); }
  .stat-rejected .stat-number { color: hsl(0 70% 55%); }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid hsl(var(--color-border));
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: hsl(var(--color-text-3));
    font-size: 15px;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    border-radius: 8px;
    font-size: 14px;
  }

  .history-meta {
    font-size: 12px;
    color: hsl(var(--color-text-3));
  }
`;
