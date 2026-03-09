import Link from "next/link";
import type { Metadata } from "next";
import prisma from "@/lib/db/prisma";
import { getListenHistory } from "@/app/actions/history";
import { getFavoriteIds } from "@/app/actions/favorites";
import { MezmurRow } from "@/components/mezmur/MezmurRow";
import { getFeaturedZemarian } from "@/app/actions/zemari";
import { ZemariCard } from "@/components/ui/ZemariCard";
import HeroSection from "@/components/layout/HeroSection";

export const metadata: Metadata = {
  title: "የዝማሬ ማዕድ | Ethiopian Orthodox Tewahedo Hymns",
  description:
    "Browse 1,272+ Ethiopian Orthodox Tewahedo mezmurs by category. Read Amharic lyrics, Ge'ez translations, and listen.",
};

export const revalidate = 60;

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
  "የዘማሪያን ስብስብ": "🎙️",
};

export default async function HomePage() {
  // Fetch featured Zemarians
  const featuredZemarians = await getFeaturedZemarian();

  // Fetch all categories with mezmur counts (via subcategories)
  const categories = await prisma.category.findMany({
    include: {
      subCategories: {
        include: {
          _count: { select: { mezmurs: true } },
        },
      },
    },
    orderBy: { orderIndex: "asc" },
  });

  // Compute total mezmur count per category
  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    mezmurCount: cat.subCategories.reduce(
      (sum, sub) => sum + sub._count.mezmurs,
      0,
    ),
    slug: encodeURIComponent(cat.name),
  }));

  // Fetch recent history if logged in
  const recentHistory = await getListenHistory(5); // Show top 5

  let favoritedSet = new Set<string>();
  let recentQueue: any[] = [];

  if (recentHistory.length > 0) {
    const ids = recentHistory.map((h) => h.mezmur.id);
    const favs = await getFavoriteIds(ids);
    favoritedSet = new Set(favs);

    recentQueue = recentHistory.map((h) => ({
      id: h.mezmur.id,
      title: h.mezmur.title,
      youtubeUrl: h.mezmur.youtubeUrl,
      subCategoryName: h.mezmur.subCategory?.name ?? "",
    }));
  }

  return (
    <div className="home-page">
      {/* ── Hero ── */}
      <HeroSection />

      {/* ── Recently Played ── */}
      {recentHistory.length > 0 && (
        <section className="recent-section">
          <h2 className="section-title">Recently Played</h2>
          <div className="recent-list">
            {recentHistory.map((record, i) => (
              <MezmurRow
                key={record.id}
                mezmur={record.mezmur as any}
                subCategoryName={record.mezmur.subCategory?.name ?? ""}
                index={i}
                queue={recentQueue}
                isFavorited={favoritedSet.has(record.mezmur.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Zemarian ── */}
      {featuredZemarians.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title !mb-0">Featured Zemarian</h2>
            <Link href="/zemarian" className="text-sm font-medium text-accent hover:underline">
              View All
            </Link>
          </div>
          <div className="zemarian-carousel scrollbar-hide">
            {featuredZemarians.map((zemari) => (
              <div key={zemari.id} className="carousel-slide">
                <ZemariCard
                  id={zemari.id}
                  name={zemari.name}
                  nameAmharic={zemari.nameAmharic}
                  imageUrl={zemari.imageUrl}
                  mezmursCount={zemari._count.mezmurs}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Categories grid ── */}
      <section>
        <h2 className="section-title">Browse Categories</h2>
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
              </div>
              <span className="cat-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      <style>{homeStyles}</style>
    </div>
  );
}

// ── Scoped styles ─────────────────────────────────────────────────────────────
const homeStyles = `
  .home-page {
    padding: 8px 0 40px;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .home-hero {
    margin-bottom: 40px;
    padding-bottom: 32px;
    border-bottom: 1px solid hsl(var(--color-border));
  }

  .hero-title {
    font-size: clamp(26px, 4vw, 42px);
    font-weight: 700;
    color: hsl(var(--color-accent));
    margin-bottom: 12px;
    line-height: 1.3;
  }

  .hero-sub {
    font-size: 15px;
    color: hsl(var(--color-text-2));
    line-height: 1.7;
    max-width: 520px;
  }

  .section-title {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: hsl(var(--color-text-3));
    margin-bottom: 16px;
  }

  .recent-section {
    margin-bottom: 48px;
  }

  .recent-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  .zemarian-carousel {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 16px;
    padding-top: 8px;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  .carousel-slide {
    flex: 0 0 auto;
    scroll-snap-align: start;
    width: auto; /* Let the internal ZemariCard handle the sizing naturally */
  }

  @media (min-width: 640px) {
    .zemarian-carousel {
      gap: 24px;
    }
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
