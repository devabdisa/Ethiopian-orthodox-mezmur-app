import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db/prisma";
import { MezmurRow } from "@/components/mezmur/MezmurRow";
import { Pagination } from "@/components/ui/Pagination";
import { PlayAllButton } from "@/components/mezmur/PlayAllButton";
import { getFavoriteIds } from "@/app/actions/favorites";
import { type Mezmur, type SubCategory } from "@/app/generated/prisma/client";

const PER_PAGE = 30; // 30 mezmurs per page

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { slug } = await params;
  const decodedName = decodeURIComponent(slug);

  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.p || "1", 10));

  // 1. Get the main category to ensure it exists
  const category = await prisma.category.findUnique({
    where: { name: decodedName },
    include: {
      _count: {
        select: { subCategories: true },
      },
    },
  });

  if (!category) return notFound();

  // 2. Count total Mezmurs for pagination logic
  const totalMezmurs = await prisma.mezmur.count({
    where: {
      subCategory: {
        category: { id: category.id },
      },
    },
  });

  const totalPages = Math.ceil(totalMezmurs / PER_PAGE);

  // 3. Fetch flat paginated Mezmurs ordered by ID, including their parent subcategory info
  const mezmursList = await prisma.mezmur.findMany({
    where: {
      subCategory: {
        category: { id: category.id },
      },
    },
    include: {
      subCategory: true,
    },
    orderBy: { id: "asc" },
    skip: (currentPage - 1) * PER_PAGE,
    take: PER_PAGE,
  });

  // 4. Group the flat mezmurs logically so they visually appear nested by subcategory again
  // We use an array instead of a Record to guarantee the ordered sequence from the DB
  const subcategoryGroups: {
    subCategory: SubCategory;
    mezmurs: Mezmur[];
  }[] = [];

  for (const mezmur of mezmursList) {
    let lastGroup = subcategoryGroups[subcategoryGroups.length - 1];

    // If it's a new subcategory, push a new group
    if (!lastGroup || lastGroup.subCategory.id !== mezmur.subCategoryId) {
      lastGroup = {
        subCategory: mezmur.subCategory,
        mezmurs: [],
      };
      subcategoryGroups.push(lastGroup);
    }

    // Safety cast needed because MezmurRow component expects the pure Mezmur type
    // and Prisma's `include` adds extra fields. We can pass it safely.
    lastGroup.mezmurs.push(mezmur as Mezmur);
  }

  // 5. Build the full-page queue once — passed to every MezmurRow so that
  //    clicking any individual play button loads the full page as a queue,
  //    enabling Next/Prev navigation and auto-play on track end.
  const pageQueue = mezmursList.map((m) => ({
    id: m.id,
    title: m.title,
    youtubeUrl: m.youtubeUrl,
    subCategoryName: (m as any).subCategory?.name ?? "",
  }));

  // 6. Batch-fetch which mezmurs are favorited by the current user (if logged in)
  const mezmurIds = mezmursList.map((m) => m.id);
  const favoritedIds = await getFavoriteIds(mezmurIds);
  const favoritedSet = new Set(favoritedIds);

  return (
    <div className="cat-page">
      {/* ── Breadcrumb ── */}
      <nav className="breadcrumb">
        <Link href="/" className="crumb-link">
          Home
        </Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">
          {category.nameTransliterated || "Category"}
        </span>
      </nav>

      {/* ── Header ── */}
      <header className="cat-header">
        <div className="cat-header-icon">🕊️</div>
        <div>
          <h1 className="cat-title font-ethiopic">{category.name}</h1>
          {category.nameTransliterated && (
            <p className="cat-subtitle">{category.nameTransliterated}</p>
          )}
          <div className="cat-meta-row">
            <p className="cat-meta">
              {totalMezmurs} Mezmurs • {category._count.subCategories}{" "}
              Subcategories
            </p>
            <PlayAllButton tracks={pageQueue} label="Play All" />
          </div>
        </div>
      </header>

      {/* ── SubCategories & Paginated Mezmurs List ── */}
      <main className="cat-body">
        {subcategoryGroups.length === 0 ? (
          <div className="empty-state">No mezmurs found on this page.</div>
        ) : (
          subcategoryGroups.map((group, i) => (
            <section
              key={group.subCategory.id + i}
              className="sub-section animate-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="sub-header">
                <h2 className="sub-title font-ethiopic">
                  {group.subCategory.name}
                </h2>
                {group.subCategory.nameTransliterated && (
                  <span className="sub-translit">
                    — {group.subCategory.nameTransliterated}
                  </span>
                )}
                {/* On paginated views, we don't know the full length of the subcategory unless we query it, so we leave it visually simpler */}
              </div>

              <div className="mezmur-list">
                {group.mezmurs.map((mezmur, j) => {
                  // The true global index based on pagination offset
                  const globalIndex =
                    (currentPage - 1) * PER_PAGE +
                    subcategoryGroups
                      .slice(0, i)
                      .reduce((acc, g) => acc + g.mezmurs.length, 0) +
                    j;

                  return (
                    <MezmurRow
                      key={mezmur.id}
                      mezmur={mezmur}
                      subCategoryName={group.subCategory.name}
                      index={globalIndex}
                      queue={pageQueue}
                      isFavorited={favoritedSet.has(mezmur.id)}
                    />
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      {/* ── Pagination controls ── */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .cat-page {
    padding: 8px 0 40px;
  }

  /* Breadcrumb */
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    margin-bottom: 24px;
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
  .cat-header {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    padding-bottom: 40px;
    border-bottom: 1px solid hsl(var(--color-border));
    margin-bottom: 32px;
  }

  .cat-header-icon {
    font-size: 48px;
    line-height: 1;
    padding: 16px;
    background: hsl(var(--color-accent) / .1);
    border-radius: var(--radius-lg);
    border: 1px solid hsl(var(--color-accent) / .2);
  }

  .cat-title {
    font-size: clamp(28px, 4vw, 42px);
    font-weight: 700;
    color: hsl(var(--color-text));
    line-height: 1.2;
    margin-bottom: 8px;
  }

  .cat-subtitle {
    font-size: 16px;
    color: hsl(var(--color-text-2));
    margin-bottom: 12px;
    font-style: italic;
  }

  .cat-meta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 99px;
    background: hsl(var(--color-surface-2));
    border: 1px solid hsl(var(--color-border-2));
    font-size: 11px;
    font-weight: 600;
    color: hsl(var(--color-accent));
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .cat-meta-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  /* Subcategories */
  .sub-section {
    margin-bottom: 48px;
  }

  .sub-header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px dashed hsl(var(--color-border));
  }

  .sub-title {
    font-size: 20px;
    font-weight: 600;
    color: hsl(var(--color-text));
  }

  .sub-translit {
    font-size: 14px;
    color: hsl(var(--color-text-2));
    font-style: italic;
  }

  .mezmur-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .empty-state {
    padding: 40px;
    text-align: center;
    color: hsl(var(--color-text-3));
    font-style: italic;
    background: hsl(var(--color-surface));
    border-radius: var(--radius);
    border: 1px dashed hsl(var(--color-border));
  }

  @media (max-width: 640px) {
    .cat-header {
      flex-direction: column;
      gap: 16px;
    }
    .cat-header-icon {
      font-size: 36px;
      padding: 12px;
    }
  }
`;
