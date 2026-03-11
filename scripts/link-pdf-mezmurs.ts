/**
 * 🔗 PDF Mezmur Auto-Linker Script
 *
 * Finds all Mezmurs in the database that have NO YouTube URL
 * (i.e., the ones imported from the PDF) and uses the YouTube
 * Data API v3 to search for their Amharic title and attach the
 * best matching video link.
 *
 * No Gemini API needed — we already have clean Amharic titles from the PDF.
 *
 * ⚠️  YouTube API Quota:
 *   - Each search costs 100 quota units.
 *   - Default daily quota is 10,000 → ~100 searches/day.
 *   - The script is RESUMABLE: it skips Mezmurs that already have a URL,
 *     so you can safely run it multiple times across days.
 *
 * Usage:
 *   npx tsx scripts/link-pdf-mezmurs.ts              # Run (links up to daily quota)
 *   npx tsx scripts/link-pdf-mezmurs.ts --dry-run    # Preview without saving
 *   npx tsx scripts/link-pdf-mezmurs.ts --limit 50   # Only process 50 mezmurs
 */

import * as dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ── Config ────────────────────────────────────────────────────────────────────
const DEFAULT_LIMIT = 95; // Stay safely under 100 searches/day quota
const DELAY_MS = 1500;    // 1.5s between requests to be kind to the API

// ── Blacklist (same as fetch-zemarian.ts) ─────────────────────────────────────
const BLACKLIST = [
  "ፓስተር",
  "ነቢይ",
  "protestant",
  "pente",
  "presence",
  "pastor",
  "prophet",
  "apostolic",
  "gospel",
  "ፕሮቴስታንት",
];
const blacklistRegex = new RegExp(BLACKLIST.join("|"), "i");

// ── Parse CLI args ────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");
const limitArgIdx = process.argv.indexOf("--limit");
const LIMIT = limitArgIdx !== -1 ? parseInt(process.argv[limitArgIdx + 1], 10) : DEFAULT_LIMIT;

async function main() {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    console.error("❌ Missing YOUTUBE_API_KEY in .env");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log("🔗 PDF Mezmur Auto-Linker");
  console.log("════════════════════════════════════════");
  console.log(`   Mode:  ${DRY_RUN ? "🏃 DRY RUN (no saves)" : "🚀 LIVE"}`);
  console.log(`   Limit: ${LIMIT} mezmurs per run`);
  console.log("════════════════════════════════════════\n");

  // 1. Fetch Mezmurs that have NO YouTube URL
  const { rows: unlinked } = await pool.query(
    `SELECT m.id, m.title, sc.name as "subCategoryName"
     FROM mezmurs m
     LEFT JOIN sub_categories sc ON m."subCategoryId" = sc.id
     WHERE m."youtubeUrl" IS NULL
     ORDER BY m."createdAt" ASC
     LIMIT $1`,
    [LIMIT]
  );

  // Also count total remaining
  const { rows: countRows } = await pool.query(
    'SELECT COUNT(*) as count FROM mezmurs WHERE "youtubeUrl" IS NULL'
  );
  const totalUnlinked = parseInt(countRows[0].count, 10);

  console.log(`📊 Found ${totalUnlinked} total Mezmurs without YouTube links.`);
  console.log(`   Processing ${Math.min(LIMIT, totalUnlinked)} this run.\n`);

  if (unlinked.length === 0) {
    console.log("🎉 All Mezmurs already have YouTube links! Nothing to do.");
    await pool.end();
    return;
  }

  let linked = 0;
  let skipped = 0;
  let notFound = 0;

  for (let i = 0; i < unlinked.length; i++) {
    const mezmur = unlinked[i];
    const progress = `[${i + 1}/${unlinked.length}]`;

    // Build search query: title + Orthodox context keywords
    const searchQuery = `${mezmur.title} ኦርቶዶክስ ተዋህዶ መዝሙር`;
    const encodedQuery = encodeURIComponent(searchQuery);

    const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`;

    let ytResponse;
    try {
      const res = await fetch(ytUrl);
      ytResponse = await res.json();
    } catch (err) {
      console.error(`${progress} ❌ API request failed for "${mezmur.title}":`, err);
      skipped++;
      continue;
    }

    // Check for quota errors
    if (ytResponse.error) {
      if (ytResponse.error.code === 403) {
        console.error(`\n🛑 [QUOTA HIT] YouTube API daily quota exceeded!`);
        console.error(`   Linked ${linked} mezmurs this run. Re-run tomorrow to continue.`);
        break;
      }
      console.error(`${progress} ❌ API error for "${mezmur.title}":`, ytResponse.error.message);
      skipped++;
      continue;
    }

    if (!ytResponse.items || ytResponse.items.length === 0) {
      console.log(`${progress} 🔍 No results: "${mezmur.title}"`);
      notFound++;
      continue;
    }

    // Find the first result that passes the blacklist filter
    let bestMatch: { videoId: string; title: string; channel: string } | null = null;

    for (const item of ytResponse.items) {
      const rawTitle = item.snippet?.title || "";
      const channel = item.snippet?.channelTitle || "";

      if (blacklistRegex.test(rawTitle) || blacklistRegex.test(channel)) {
        continue; // Skip non-Orthodox results
      }

      bestMatch = {
        videoId: item.id.videoId,
        title: rawTitle,
        channel,
      };
      break; // Take the first clean result
    }

    if (!bestMatch) {
      console.log(`${progress} ⚠️  All results blacklisted: "${mezmur.title}"`);
      notFound++;
      continue;
    }

    const youtubeLink = `https://www.youtube.com/watch?v=${bestMatch.videoId}`;

    // Check if this URL already exists in the database (prevent duplicates)
    const { rows: dupeCheck } = await pool.query(
      'SELECT id FROM mezmurs WHERE "youtubeUrl" = $1',
      [youtubeLink]
    );

    if (dupeCheck.length > 0) {
      console.log(`${progress} 🔄 Duplicate URL skipped: "${mezmur.title}" → already linked to another mezmur`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`${progress} 🏃 WOULD LINK: "${mezmur.title}" → ${youtubeLink} (by ${bestMatch.channel})`);
      linked++;
    } else {
      try {
        await pool.query(
          'UPDATE mezmurs SET "youtubeUrl" = $1, "youtubeUrlSource" = $2, "updatedAt" = NOW() WHERE id = $3',
          [youtubeLink, "AUTO_FETCHED", mezmur.id]
        );
        console.log(`${progress} ✅ LINKED: "${mezmur.title}" → ${youtubeLink}`);
        linked++;
      } catch (err: any) {
        console.error(`${progress} ❌ DB update failed for "${mezmur.title}":`, err.message);
        skipped++;
      }
    }

    // Delay between requests
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n════════════════════════════════════════`);
  console.log(`📊 AUTO-LINKER RESULTS`);
  console.log(`════════════════════════════════════════`);
  console.log(`   Processed:   ${unlinked.length}`);
  console.log(`   Linked:      ${linked} ✅`);
  console.log(`   Not found:   ${notFound} 🔍`);
  console.log(`   Skipped:     ${skipped} ⚠️`);
  console.log(`   Remaining:   ${totalUnlinked - linked} unlinked mezmurs`);
  console.log(`════════════════════════════════════════`);

  if (totalUnlinked - linked > 0) {
    console.log(`\n💡 Run this script again tomorrow to link more (YouTube quota resets daily).`);
  } else {
    console.log(`\n🎉 All Mezmurs are now linked!`);
  }

  await pool.end();
}

main().catch((e) => {
  console.error("Unhandled Error:", e);
  process.exit(1);
});
