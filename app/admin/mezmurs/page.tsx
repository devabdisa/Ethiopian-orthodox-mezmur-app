import prisma from "@/lib/db/prisma";
import { MezmurTable } from "./MezmurTable";

// ── Searchable, filterable, paginated mezmur admin ────────────────────────────

interface Props {
  searchParams: Promise<{
    page?: string;
    q?: string;
    filter?: string;
    category?: string;
  }>;
}

const PER_PAGE = 30;

export default async function AdminMezmursPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const query = params.q?.trim() || "";
  const filter = params.filter || "all"; // "all" | "missing" | "linked"
  const categoryFilter = params.category || "";

  // ── Build where clause ────────────────────────────────────────────────────
  const where: any = {};

  if (query) {
    where.title = { contains: query, mode: "insensitive" };
  }

  if (filter === "missing") {
    where.youtubeUrl = null;
  } else if (filter === "linked") {
    where.youtubeUrl = { not: null };
  }

  if (categoryFilter) {
    where.subCategory = { categoryId: categoryFilter };
  }

  // ── Parallel fetch: count + page data + categories ──────────────────────────
  const [totalCount, mezmurs, categories] = await Promise.all([
    prisma.mezmur.count({ where }),
    prisma.mezmur.findMany({
      where,
      include: {
        subCategory: {
          include: { category: true },
        },
      },
      orderBy: { title: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Mezmur Management</h1>
        <p className="admin-page-subtitle">
          {totalCount.toLocaleString()} mezmur{totalCount !== 1 ? "s" : ""}{" "}
          found
        </p>
      </div>

      <MezmurTable
        mezmurs={mezmurs}
        categories={categories}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        query={query}
        filter={filter}
        categoryFilter={categoryFilter}
      />
    </div>
  );
}
