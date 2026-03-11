/**
 * ═══════════════════════════════════════════════════════════════════
 *  📂 Category-Based Mezmur Fetcher
 *  Fetches YouTube videos by searching for specific subcategory
 *  keywords (e.g. "የበዓል መዝሙር", "የሰንበት ትምህርት ቤት", etc.)
 *
 *  Usage:
 *    npx tsx scripts/fetch-category.ts                       # List all subcategories
 *    npx tsx scripts/fetch-category.ts --sub "ድንግል ማርያም"    # Fetch for specific subcategory
 *    npx tsx scripts/fetch-category.ts --sub "all"           # Fetch for ALL subcategories
 *    npx tsx scripts/fetch-category.ts --dry-run --sub "..."  # Preview without DB writes
 *    npx tsx scripts/fetch-category.ts --limit 10 --sub "..." # Limit per subcategory
 * ═══════════════════════════════════════════════════════════════════
 */

import * as dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ── Orthodox Blacklist ──────────────────────────────────────────────
const BLACKLIST = [
  "ፓስተር", "ነቢይ", "protestant", "pente", "presence",
  "pastor", "prophet", "apostolic", "gospel", "ፕሮቴስታንት",
  "pentecostal", "jesus tv", "worship", "praise"
];
const blacklistRegex = new RegExp(BLACKLIST.join("|"), "i");

// ── CLI Args ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const subArg = args.find((_, i) => args[i - 1] === "--sub") || "";
const limitArg = args.find((_, i) => args[i - 1] === "--limit");
const MAX_PER_SUB = limitArg ? parseInt(limitArg) : 30;

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function main() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  if (!GEMINI_API_KEY || !YOUTUBE_API_KEY) {
    console.error("❌ Missing GEMINI_API_KEY or YOUTUBE_API_KEY in .env");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  console.log("📂 Category-Based Mezmur Fetcher");
  console.log("════════════════════════════════════════");
  console.log(`   Mode:  ${DRY_RUN ? "🏃 DRY RUN" : "💾 LIVE"}`);
  console.log(`   Max per sub: ${MAX_PER_SUB}`);
  console.log("════════════════════════════════════════\n");

  // ── 1. Fetch all subcategories from DB ──
  const subCatsResult = await pool.query(
    `SELECT sc.id, sc.name, sc."nameTransliterated", c.name as "categoryName"
     FROM sub_categories sc
     JOIN categories c ON sc."categoryId" = c.id
     ORDER BY c."orderIndex", sc."orderIndex"`
  );

  const allSubCategories = subCatsResult.rows;

  if (!subArg) {
    // Just list all subcategories and exit
    console.log("📋 Available SubCategories:\n");
    for (const sc of allSubCategories) {
      const count = await pool.query(
        'SELECT COUNT(*) FROM mezmurs WHERE "subCategoryId" = $1',
        [sc.id]
      );
      console.log(
        `  • ${sc.name} (${sc.nameTransliterated || "?"}) — ${count.rows[0].count} mezmurs — Category: ${sc.categoryName}`
      );
    }
    console.log(
      `\n💡 Usage: npx tsx scripts/fetch-category.ts --sub "ድንግል ማርያም"`
    );
    console.log(
      `         npx tsx scripts/fetch-category.ts --sub "all" --limit 20`
    );
    await pool.end();
    return;
  }

  // ── 2. Determine which subcategories to process ──
  let targetSubs: typeof allSubCategories;

  if (subArg === "all") {
    targetSubs = allSubCategories;
    console.log(`🎯 Processing ALL ${targetSubs.length} subcategories\n`);
  } else {
    targetSubs = allSubCategories.filter(
      (sc) => sc.name.includes(subArg) 
        || (sc.nameTransliterated && sc.nameTransliterated.toLowerCase().includes(subArg.toLowerCase()))
        || sc.categoryName.includes(subArg)
    );

    if (targetSubs.length === 0) {
      console.error(`❌ No subcategory found matching "${subArg}".`);
      console.log("Run without --sub to see all available subcategories.");
      await pool.end();
      return;
    }

    console.log(`🎯 Matched ${targetSubs.length} subcategories:\n`);
    for (const sc of targetSubs) {
      console.log(`  • ${sc.name} (${sc.nameTransliterated || "?"})`);
    }
    console.log();
  }

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalBounced = 0;

  // ── 3. For each subcategory, search YouTube ──
  for (const subCat of targetSubs) {
    console.log(`\n${"═".repeat(50)}`);
    console.log(`📂 SubCategory: ${subCat.name} (${subCat.nameTransliterated || "?"})`);
    console.log(`   Category: ${subCat.categoryName}`);
    console.log(`${"═".repeat(50)}`);

    // Use category name for search if subcategory is generic ("ጠቅላላ")
    const searchLabel = subCat.name === "ጠቅላላ" ? subCat.categoryName : subCat.name;

    // Build search query
    const searchTerms = [
      `${searchLabel} ኦርቶዶክስ ተዋህዶ መዝሙር`,
      `${searchLabel} Ethiopian Orthodox mezmur`,
    ];

    let insertedForSub = 0;

    for (const searchTerm of searchTerms) {
      if (insertedForSub >= MAX_PER_SUB) break;

      const query = encodeURIComponent(
        `${searchTerm} -ፕሮቴስታንት -ፓስተር -protestant -pente -apostolic`
      );
      const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=50&key=${YOUTUBE_API_KEY}`;

      let ytResponse;
      try {
        const res = await fetch(ytUrl);
        ytResponse = await res.json();
      } catch (err) {
        console.error(`  ❌ YouTube API error for "${searchTerm}":`, err);
        continue;
      }

      if (ytResponse.error) {
        console.error(`  ❌ YouTube API returned error:`, ytResponse.error.message);
        if (ytResponse.error.message?.includes("quota")) {
          console.error("\n🛑 YouTube API quota exhausted! Try again tomorrow.");
          await pool.end();
          process.exit(1);
        }
        continue;
      }

      if (!ytResponse.items || ytResponse.items.length === 0) {
        console.log(`  📭 No results for: "${searchTerm}"`);
        continue;
      }

      console.log(`  🔍 Found ${ytResponse.items.length} results for: "${searchTerm}"`);

      for (const item of ytResponse.items) {
        if (insertedForSub >= MAX_PER_SUB) break;

        const rawTitle = item.snippet?.title || "";
        const channel = item.snippet?.channelTitle || "";
        const videoId = item.id?.videoId;

        if (!videoId) continue;

        // ── Blacklist filter ──
        if (blacklistRegex.test(rawTitle) || blacklistRegex.test(channel)) {
          console.log(`  [BOUNCED] "${rawTitle}" by [${channel}]`);
          totalBounced++;
          continue;
        }

        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // ── Duplicate check ──
        const existing = await pool.query(
          'SELECT id FROM mezmurs WHERE "youtubeUrl" = $1',
          [youtubeUrl]
        );
        if (existing.rows.length > 0) {
          console.log(`  [SKIP] Already exists: ${youtubeUrl}`);
          totalSkipped++;
          continue;
        }

        // ── Clean title with Gemini ──
        const decodedTitle = rawTitle
          .replace(/&amp;/g, "&")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"');

        let cleanTitle: string | null = null;
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const prompt = `You are an Ethiopian Orthodox Mezmur cataloger. Extract ONLY the PURE Amharic title of the Mezmur from this string.
Rules:
1. Remove ALL artist/singer names.
2. Remove labels like "አዲስ ዝማሬ", "ንስሃ ዝማሬ", "ምርጥ ዝማሬ", "የንስሃ", "የአመቱ ምርጥ", "New".
3. Remove YouTube clutter: "Official Video", "HD", "Subscribe", "Like", or ANY English text.
4. Remove separators: "|", "-", "–", ":", "(", ")", "[", "]", emojis.
5. Return ONLY the clean Amharic title. Nothing else.
String: "${decodedTitle}"`;

          const result = await model.generateContent(prompt);
          cleanTitle = result.response.text().trim();
          cleanTitle = cleanTitle.replace(/^["'](.*?)["']$/, "$1").trim();

          if (!cleanTitle || cleanTitle.includes("\n") || cleanTitle.length < 2) {
            throw new Error("AI returned empty or malformed output");
          }
        } catch (err: any) {
          const msg = err.message || String(err);
          if (msg.includes("429") || msg.includes("Quota") || msg.includes("Resource exhausted")) {
            console.error(`\n🛑 Gemini Quota Exhausted! ${msg}`);
            console.log(`\n📊 Session stats: ${totalInserted} inserted, ${totalSkipped} skipped, ${totalBounced} bounced`);
            await pool.end();
            process.exit(1);
          }
          console.error(`  [SKIP] Gemini failed: ${msg}`);
          continue;
        }

        // ── Validate: must be Amharic ──
        if (/[a-zA-Z]/.test(cleanTitle) || cleanTitle.length > 100) {
          console.warn(`  [REJECTED] "${cleanTitle}" — Contains English or too long`);
          continue;
        }

        // ── Check title doesn't already exist in this subcategory ──
        const titleExists = await pool.query(
          'SELECT id FROM mezmurs WHERE title = $1 AND "subCategoryId" = $2',
          [cleanTitle, subCat.id]
        );
        if (titleExists.rows.length > 0) {
          console.log(`  [SKIP] Title "${cleanTitle}" already exists in this subcategory`);
          totalSkipped++;
          continue;
        }

        // ── Insert ──
        if (DRY_RUN) {
          console.log(`  🏃 WOULD INSERT: "${cleanTitle}" → ${youtubeUrl}`);
        } else {
          try {
            await pool.query(
              `INSERT INTO mezmurs (id, title, lyrics, "youtubeUrl", "youtubeUrlSource", "subCategoryId", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
              [
                `mez_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                cleanTitle,
                [],
                youtubeUrl,
                "AUTO_FETCHED",
                subCat.id,
              ]
            );
            console.log(`  ✅ SAVED: "${cleanTitle}"`);
          } catch (err: any) {
            console.error(`  ❌ DB Insert failed: ${err.message}`);
            continue;
          }
        }

        totalInserted++;
        insertedForSub++;

        // Rate limit: Gemini needs ~2s between calls
        await delay(3000);
      }
    }

    console.log(
      `  📊 SubCategory done: ${insertedForSub} new mezmurs ${DRY_RUN ? "(dry run)" : "saved"}`
    );
  }

  // ── Final Summary ──
  console.log("\n" + "═".repeat(50));
  console.log("📊 FINAL SUMMARY");
  console.log("═".repeat(50));
  console.log(`  ✅ Inserted:  ${totalInserted}`);
  console.log(`  ⏭️  Skipped:   ${totalSkipped}`);
  console.log(`  🚫 Bounced:   ${totalBounced}`);
  console.log(`  Mode:         ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log("═".repeat(50));

  await pool.end();
}

main().catch(async (e) => {
  console.error("Unhandled Error:", e);
  process.exit(1);
});
