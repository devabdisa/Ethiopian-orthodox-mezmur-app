import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { transliterate, isLatinText } from "@/lib/amharic-transliterate";

// GET /api/search?q=search+term
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  // ── Build search terms ──────────────────────────────────────────────────────
  // If the user typed Latin text like "lamesgnh", transliterate it to Amharic
  // and search with BOTH the original + transliterated version.
  const searchTerms: string[] = [q];

  if (isLatinText(q)) {
    const amharic = transliterate(q);
    if (amharic !== q) {
      searchTerms.push(amharic);
    }
  }

  // ── Search with Postgres ────────────────────────────────────────────────────
  // We use a combination of:
  // 1. to_tsvector('simple', ...) for tokenized full-text search (Amharic-safe)
  // 2. ILIKE for partial/substring matching (catches incomplete words)
  //
  // We search both `title` and `lyrics` (array → joined text)

  try {
    // Build OR conditions for each search term
    const conditions = searchTerms.map((term) => {
      // Escape special characters for LIKE
      const escaped = term.replace(/[%_\\]/g, "\\$&");
      return `(
        m."title" ILIKE '%${escaped}%'
        OR array_to_string(m."lyrics", ' ') ILIKE '%${escaped}%'
      )`;
    });

    const whereClause = conditions.join(" OR ");

    const results: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        m."id",
        m."title",
        m."lyrics",
        sc."name" AS "subCategoryName",
        sc."categoryId",
        m."youtubeUrl"
      FROM "mezmurs" m
      JOIN "sub_categories" sc ON sc."id" = m."subCategoryId"
      WHERE ${whereClause}
      ORDER BY
        CASE
          WHEN m."title" ILIKE '%${searchTerms[0].replace(/[%_\\]/g, "\\$&")}%' THEN 0
          ELSE 1
        END,
        m."title" ASC
      LIMIT 50
    `);

    // Format results — include a matching lyric snippet
    const formatted = results.map((r) => {
      let matchingLine = "";
      const lyrics: string[] = r.lyrics || [];

      // Find the first lyric line that matches any search term
      for (const term of searchTerms) {
        const lower = term.toLowerCase();
        const found = lyrics.find((line: string) =>
          line.toLowerCase().includes(lower),
        );
        if (found) {
          matchingLine = found;
          break;
        }
      }

      return {
        id: r.id,
        title: r.title,
        subCategoryName: r.subCategoryName,
        youtubeUrl: r.youtubeUrl,
        matchingLine: matchingLine || (lyrics[0] ?? ""),
      };
    });

    return NextResponse.json({
      results: formatted,
      transliterated: searchTerms.length > 1 ? searchTerms[1] : null,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { results: [], error: "Search failed" },
      { status: 500 },
    );
  }
}
