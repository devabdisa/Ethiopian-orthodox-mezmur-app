import * as dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables from the root .env file BEFORE importing anything that uses process.env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

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

  // Denomination-accurate blacklist Regex (case-insensitive)
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
  ];
  const blacklistRegex = new RegExp(BLACKLIST.join("|"), "i");

  const ZEMARIAN = [
    "ዘማሪት ትዕግስት",
    "ዘማሪት ምርትነሽ ጥላሁን",
    "ቴዎድሮስ ዮሴፍ",
    "ዘማሪ ሮቤል ማቲያስ",
    "ቀሲስ እንግዳወርቅ በቀለ",
    "ይልማ ኃይሉ",
    "ቀሲስ አሸናፊ",
    "ዘማሪ ሙሉቀን",
    "ቸርነት ሰናይ",
    "ዘማሪት ቤተልሔም",
    "ዘማሪ ዲ/ን ዕዝራ",
    "ዘማሪ ገብረዮሐንስ ገብረጻድቅ",
    "ቀሲስ ምንዳዬ",
    "ዲ/ን አዝማሪያም",
    "ዘማሪት ጸዳለ",
    "ዘማሪት ፋሲካ መኮንን",
    "ሲስተር ሕይወት",
    "ዘማሪት ማርታ ኃይሉ",
    "ዘማሪ ዲ/ን ዘአማኑኤል",
  ];

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  console.log("🔗 Connecting to database...");

  // 1. Ensure Category and SubCategory exist
  const categoryName = "የዘማሪያን ስብስብ";
  let categoryId: string;

  const catRes = await pool.query("SELECT id FROM categories WHERE name = $1", [
    categoryName,
  ]);
  if (catRes.rows.length === 0) {
    const newCat = await pool.query(
      'INSERT INTO categories (id, name, "nameTransliterated", "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
      [`cat_${Date.now()}`, categoryName, "Zemarian Collection"],
    );
    categoryId = newCat.rows[0].id;
  } else {
    categoryId = catRes.rows[0].id;
  }

  let subCategoryId: string;
  const subCatRes = await pool.query(
    'SELECT id FROM sub_categories WHERE name = $1 AND "categoryId" = $2',
    ["Auto Fetched", categoryId],
  );
  if (subCatRes.rows.length === 0) {
    const newSubCat = await pool.query(
      'INSERT INTO sub_categories (id, name, "categoryId", "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
      [`sub_${Date.now()}`, "Auto Fetched", categoryId],
    );
    subCategoryId = newSubCat.rows[0].id;
  } else {
    subCategoryId = subCatRes.rows[0].id;
  }

  for (const artistName of ZEMARIAN) {
    console.log(`\n========================================`);
    console.log(`🎧 Fetching for Zemari: ${artistName}`);
    console.log(`========================================`);

    // 2. Upsert Zemari
    let zemariId: string;
    const zemRes = await pool.query("SELECT id FROM zemarian WHERE name = $1", [
      artistName,
    ]);
    if (zemRes.rows.length === 0) {
      const newZem = await pool.query(
        'INSERT INTO zemarian (id, name, "nameAmharic", "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
        [`zem_${Date.now()}`, artistName, artistName],
      );
      zemariId = newZem.rows[0].id;
    } else {
      zemariId = zemRes.rows[0].id;
    }

    console.log(`✓ Zemari ensured in DB: ID ${zemariId}`);

    // 3. Fetch YouTube Videos
    // Append mandatory positive keywords and negative exclusion operators
    const query = encodeURIComponent(
      `${artistName} ኦርቶዶክስ ተዋህዶ -ፕሮቴስታንት -ፓስተር -protestant -pente -apostolic`,
    );
    const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=40&key=${YOUTUBE_API_KEY}`;

    let ytResponse;
    try {
      const res = await fetch(ytUrl);
      ytResponse = await res.json();
    } catch (err) {
      console.error(`Failed to fetch YouTube data for ${artistName}`, err);
      continue;
    }

    if (!ytResponse.items) {
      console.error(
        `No items found for ${artistName}. API Response:`,
        ytResponse,
      );
      continue;
    }

    for (const item of ytResponse.items) {
      // The Result Bouncer (Post-Fetch Filter)
      const rawTitle = item.snippet?.title || "";
      const channel = item.snippet?.channelTitle || "";
      if (blacklistRegex.test(rawTitle) || blacklistRegex.test(channel)) {
        console.log(
          `[BOUNCED] Non-Orthodox match: "${rawTitle}" by [${channel}]`,
        );
        continue;
      }

      const decodedTitle = rawTitle
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"');
      const videoId = item.id.videoId;
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // Prevent duplicate URLs
      const existing = await pool.query(
        'SELECT id FROM mezmurs WHERE "youtubeUrl" = $1',
        [youtubeUrl],
      );
      if (existing.rows.length > 0) {
        console.log(`[SKIP] Already exists: ${youtubeUrl}`);
        continue;
      }

      // 4. AI Data Cleaning using Gemini
      console.log(`\n✨ Requesting Gemini for: "${decodedTitle}"...`);
      const prompt = `You are an Ethiopian Orthodox Mezmur cataloger. Your task is to extract ONLY the PURE title of the Mezmur from the following string.
Rules:
1. Remove artist names (specifically ${artistName}).
2. Remove category labels like "አዲስ ዝማሬ", "ንስሃ ዝማሬ", "ምርጥ ዝማሬ", "የንስሃ", "የአመቱ ምርጥ".
3. Remove YouTube clutter like "Official Video", "New", "HD", "Subscribe", "Like", or ANY English text.
4. Remove all separators like "|", "-", "–", ":", "(", ")", "[", "]", "🔴".
5. Return ONLY the Amharic title text. No quotes, no extra words, no punctuation at start/end.
String: "${decodedTitle}"`;

      let cleanTitle: string | null = null;
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
        });
        const result = await model.generateContent(prompt);
        cleanTitle = result.response.text().trim();
        cleanTitle = cleanTitle.replace(/^["'](.*)["']$/, "$1").trim();

        if (!cleanTitle || cleanTitle.includes("\n")) {
          throw new Error("AI returned empty or malformed output");
        }
      } catch (err: any) {
        const errorMessage = err.message || String(err);
        if (
          errorMessage.includes("429") ||
          errorMessage.includes("Quota") ||
          errorMessage.includes("Resource exhausted")
        ) {
          console.error(
            `\n🛑 [CIRCUIT BREAKER] Gemini Quota Exhausted! Message: ${errorMessage}`,
          );
          process.exit(1);
        }
        console.error(
          `  [SKIP] Gemini AI failed for this video (${errorMessage}). Skipping.`,
        );
        continue;
      }

      // 5. Strict Amharic Validation
      const hasEnglish = /[a-zA-Z]/.test(cleanTitle);
      const isTooLong = cleanTitle.length > 100;

      if (hasEnglish || isTooLong) {
        console.warn(
          `  [REJECTED] Validation Failed: Title contains English or is too long. Title: "${cleanTitle}"`,
        );
        continue;
      }

      console.log(`  -> Final Valid Title: "${cleanTitle}"`);

      // 6. SQL Insertion
      try {
        await pool.query(
          'INSERT INTO mezmurs (id, title, lyrics, "youtubeUrl", "youtubeUrlSource", "subCategoryId", "zemariId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
          [
            `mez_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            cleanTitle,
            [],
            youtubeUrl,
            "AUTO_FETCHED",
            subCategoryId,
            zemariId,
          ],
        );
        console.log(`  [SUCCESS] Inserted Mezmur successfully!`);
      } catch (err: any) {
        console.error(`  [ERROR] DB Insert failed: ${err.message}`);
      }

      await delay(25000);
    }
  }

  console.log("\n✅ All fetching completed successfully.");
  await pool.end();
}

main().catch(async (e) => {
  console.error("Unhandled Error:", e);
  process.exit(1);
});
