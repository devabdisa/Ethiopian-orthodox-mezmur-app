import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { MezmurRow } from "@/components/mezmur/MezmurRow";
import type { PlayerTrack } from "@/types";

export const metadata = {
  title: "My Favorites — ቅዱሳን Mezmur",
  description: "Your saved Ethiopian Orthodox Tewahedo Mezmurs",
};

export default async function FavoritesPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  // Redirect unauthenticated users to login
  if (!session?.user?.id) {
    redirect("/auth");
  }

  // Fetch all favorites with their mezmur + subcategory data
  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      mezmur: {
        include: {
          subCategory: true,
        },
      },
    },
    orderBy: { createdAt: "desc" }, // newest favorites first
  });

  // Build queue from all favorited mezmurs
  const pageQueue: PlayerTrack[] = favorites.map((f) => ({
    id: f.mezmur.id,
    title: f.mezmur.title,
    youtubeUrl: f.mezmur.youtubeUrl,
    subCategoryName: f.mezmur.subCategory.name,
  }));

  return (
    <div className="favorites-page">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/" className="crumb-link">
          Home
        </Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">Favorites</span>
      </nav>

      {/* Header */}
      <header className="fav-header animate-in">
        <div className="fav-header-icon">❤️</div>
        <div>
          <h1 className="fav-title">My Favorites</h1>
          <p className="fav-subtitle">
            {favorites.length === 0
              ? "You haven't saved any mezmurs yet."
              : `${favorites.length} saved mezmur${favorites.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="fav-body">
        {favorites.length === 0 ? (
          <div className="empty-state animate-in">
            <div className="empty-icon">🕊️</div>
            <h2 className="empty-title">No favorites yet</h2>
            <p className="empty-text">
              Tap the heart icon on any Mezmur to save it here for easy access.
            </p>
            <Link href="/" className="empty-cta accent-gradient">
              Browse Mezmurs
            </Link>
          </div>
        ) : (
          <div className="mezmur-list">
            {favorites.map((fav, i) => (
              <MezmurRow
                key={fav.id}
                mezmur={fav.mezmur}
                subCategoryName={fav.mezmur.subCategory.name}
                index={i}
                queue={pageQueue}
                isFavorited={true}
              />
            ))}
          </div>
        )}
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .favorites-page {
    padding: 12px 0 60px;
    max-width: 960px;
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
  .fav-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 40px;
    padding-bottom: 24px;
    border-bottom: 1px dashed hsl(var(--color-border));
  }

  .fav-header-icon {
    font-size: 36px;
    line-height: 1;
  }

  .fav-title {
    font-size: 28px;
    font-weight: 700;
    color: hsl(var(--color-text));
    letter-spacing: -0.02em;
  }

  .fav-subtitle {
    font-size: 14px;
    color: hsl(var(--color-text-2));
    margin-top: 4px;
  }

  .fav-body {
    min-height: 200px;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 60px 24px;
    background: hsl(var(--color-surface));
    border: 1px dashed hsl(var(--color-border));
    border-radius: var(--radius-lg);
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 20px;
    font-weight: 600;
    color: hsl(var(--color-text));
    margin-bottom: 8px;
  }

  .empty-text {
    font-size: 15px;
    color: hsl(var(--color-text-2));
    line-height: 1.5;
    max-width: 360px;
    margin: 0 auto 24px;
  }

  .empty-cta {
    display: inline-flex;
    align-items: center;
    padding: 12px 28px;
    border-radius: 99px;
    text-decoration: none;
    font-size: 15px;
    font-weight: 600;
    box-shadow: var(--shadow-accent);
    transition: all var(--transition);
  }

  .empty-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px hsl(var(--color-accent) / 0.3);
  }
`;
