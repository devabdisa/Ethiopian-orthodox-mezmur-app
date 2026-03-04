import Link from "next/link";
import type { Metadata } from "next";
import prisma from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Browse Categories — ቅዱሳን Mezmur",
  description:
    "Browse all Ethiopian Orthodox Tewahedo mezmur categories. Explore praise hymns, festive songs, Sunday school mezmurs, and more.",
};

// ── Category emoji map ────────────────────────────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  "የምስጋና መዝሙር": "🙌",
  "የሰንበት ትምህርት ቤት መዝሙር": "📖",
  "አጫጭር መዝሙሮች": "🎵",
  "የሠርግ መዝሙሮች": "💒",
  "የሠርግ መዝሙራት": "💒",
  "የመስቀል መዝሙር": "✝️",
  "ዝማሬ ምሽት መዝሙሮች": "🌙",
  "የገና እና የጥምቀት መዝሙር": "⭐",
  "የአዲስ ዓመት እና የመስቀል መዝሙራት": "🕯️",
  "የልደት መዝሙራት": "🌟",
  "የጥምቀት መዝሙራት": "🌊",
  "የእመቤታችን መዝሙራት": "🌹",
  "የንስሐ መዝሙራት": "🙏",
  "የሆሣዕና መዝሙራት": "🌿",
  "የትንሣኤ መዝሙራት": "☀️",
  "የኢየሱስ ክርስቶስ የምስጋና መዝሙራት": "👑",
  "የፃድቃን እና የቅዱሳን መላእክት መዝሙራት": "😇",
  "የደብረ ታቦር መዝሙራት": "⛰️",
  "የተለያዩ በዓላት ወረብ": "🎶",
};

export default async function BrowseCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      subCategories: {
        include: {
          _count: { select: { mezmurs: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    mezmurCount: cat.subCategories.reduce(
      (sum, sub) => sum + sub._count.mezmurs,
      0,
    ),
    slug: encodeURIComponent(cat.name),
  }));

  const totalMezmurs = categoriesWithCount.reduce(
    (sum, cat) => sum + cat.mezmurCount,
    0,
  );

  return (
    <div className="browse-page">
      {/* Header */}
      <header className="browse-header animate-in">
        <div className="browse-icon">📚</div>
        <div>
          <h1 className="browse-title">Browse Categories</h1>
          <p className="browse-subtitle">
            {categories.length} categories • {totalMezmurs.toLocaleString()}{" "}
            mezmurs
          </p>
        </div>
      </header>

      {/* Grid */}
      <div className="categories-grid">
        {categoriesWithCount.map((cat, i) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="category-card animate-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="cat-emoji">
              {CATEGORY_EMOJI[cat.name] ?? "🎵"}
            </span>
            <div className="cat-body">
              <h3 className="cat-name font-ethiopic">{cat.name}</h3>
              {cat.nameTransliterated && (
                <p className="cat-en">{cat.nameTransliterated}</p>
              )}
              <p className="cat-count">{cat.mezmurCount} mezmurs</p>
            </div>
            <span className="cat-arrow">→</span>
          </Link>
        ))}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .browse-page {
    padding: 12px 0 60px;
    max-width: 960px;
    margin: 0 auto;
  }

  /* Header */
  .browse-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 40px;
    padding-bottom: 24px;
    border-bottom: 1px dashed hsl(var(--color-border));
  }

  .browse-icon {
    font-size: 36px;
    line-height: 1;
  }

  .browse-title {
    font-size: 28px;
    font-weight: 700;
    color: hsl(var(--color-text));
    letter-spacing: -0.02em;
  }

  .browse-subtitle {
    font-size: 14px;
    color: hsl(var(--color-text-2));
    margin-top: 4px;
  }

  /* Grid — reuses the same card styles as the home page */
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }

  .category-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    border-radius: var(--radius-lg);
    background: hsl(var(--color-surface));
    border: 1px solid hsl(var(--color-border));
    text-decoration: none;
    transition: all var(--transition);
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .category-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      hsl(var(--color-accent) / .06),
      transparent 60%
    );
    opacity: 0;
    transition: opacity var(--transition);
  }

  .category-card:hover {
    border-color: hsl(var(--color-accent) / .4);
    transform: translateY(-2px);
    box-shadow: var(--shadow);
  }

  .category-card:hover::before {
    opacity: 1;
  }

  .category-card:hover .cat-arrow {
    transform: translateX(4px);
    color: hsl(var(--color-accent));
  }

  .cat-emoji {
    font-size: 26px;
    line-height: 1;
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: hsl(var(--color-accent) / .1);
    border-radius: var(--radius);
  }

  .cat-body {
    flex: 1;
    min-width: 0;
  }

  .cat-name {
    font-size: 15px;
    font-weight: 600;
    color: hsl(var(--color-text));
    line-height: 1.4;
    margin-bottom: 2px;
  }

  .cat-en {
    font-size: 11px;
    color: hsl(var(--color-text-2));
    margin-bottom: 4px;
    font-style: italic;
  }

  .cat-count {
    font-size: 11px;
    color: hsl(var(--color-accent));
    font-weight: 500;
  }

  .cat-arrow {
    font-size: 16px;
    color: hsl(var(--color-text-3));
    flex-shrink: 0;
    transition: all var(--transition);
  }

  @media (max-width: 640px) {
    .categories-grid {
      grid-template-columns: 1fr;
    }
  }
`;
