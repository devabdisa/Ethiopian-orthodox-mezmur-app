/**
 * 🎤 Synced Lyrics Backfill Script
 *
 * Scans every Mezmur with a YouTube URL that DOES NOT have syncedLyrics yet.
 * Uses `youtube-transcript` to attempt to fetch closed captions (CC).
 * If found, transforms them into the karaoke [{ time, text }] format and saves.
 * 
 * Usage:  npx tsx scripts/fetch-sync-lyrics.ts
 *         npx tsx scripts/fetch-sync-lyrics.ts --dry-run
 */

import * as dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";
import { YoutubeTranscript } from "youtube-transcript";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ── Config ────────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log("🎤 Synced Lyrics Backfill");
  console.log("════════════════════════════════════════");
  console.log(`   Mode:  ${DRY_RUN ? "🏃 DRY RUN (no saves)" : "🚀 LIVE"}`);
  console.log("════════════════════════════════════════\n");

  // Fetch Mezmurs that HAVE a YouTube URL but NO synced lyrics
  const { rows: mezmurs } = await pool.query(
    'SELECT id, title, "youtubeUrl" FROM mezmurs WHERE "youtubeUrl" IS NOT NULL AND "syncedLyrics" IS NULL'
  );

  console.log(`📊 Found ${mezmurs.length} Mezmurs waiting for synced lyrics.\n`);

  if (mezmurs.length === 0) {
    console.log("🎉 All Mezmurs already processed!");
    await pool.end();
    return;
  }

  let success = 0;
  let noCaptions = 0;
  let failed = 0;

  for (let i = 0; i < mezmurs.length; i++) {
    const mezmur = mezmurs[i];
    const progress = `[${i + 1}/${mezmurs.length}]`;

    if (!mezmur.youtubeUrl) continue;

    try {
      // Fetch transcript via scraping (no API key needed!)
      const transcript = await YoutubeTranscript.fetchTranscript(mezmur.youtubeUrl);
      
      if (!transcript || transcript.length === 0) {
        console.log(`${progress} 🤷 No captions: "${mezmur.title}"`);
        noCaptions++;
        continue;
      }

      // Format for our syncedLyrics Json array: [{ time: number, text: string }]
      // The transcript comes back as [{ text, duration, offset }] (offset = time in MS)
      const formattedLyrics = transcript.map((t) => ({
        time: parseFloat((t.offset / 1000).toFixed(2)),   // Convert to seconds
        text: t.text
          .replace(/&amp;/g, "&")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"') // Basic cleanup
          .trim()
      }));

      // Ignore auto-generated tracks that just say "[Music]" for 5 minutes
      if (formattedLyrics.length < 3 || formattedLyrics[0].text.includes("[Music]")) {
         console.log(`${progress} ⚠️  Skipping useless auto-captions: "${mezmur.title}"`);
         noCaptions++;
         continue;
      }

      if (DRY_RUN) {
         console.log(`${progress} 🏃 WOULD SAVE: "${mezmur.title}" (${formattedLyrics.length} lines found)`);
         success++;
      } else {
         const jsonStr = JSON.stringify(formattedLyrics);
         await pool.query(
           'UPDATE mezmurs SET "syncedLyrics" = $1 WHERE id = $2',
           [jsonStr, mezmur.id]
         );
         console.log(`${progress} ✅ SAVED: "${mezmur.title}" (${formattedLyrics.length} lines)`);
         success++;
      }

    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("Could not find captions") || msg.includes("Transcript is disabled")) {
         console.log(`${progress} 🤷 No captions: "${mezmur.title}"`);
         noCaptions++;
      } else {
         console.error(`${progress} ❌ Error fetching "${mezmur.title}":`, msg);
         failed++;
      }
    }

    // Small delay to prevent IP bans/rate-limiting from YouTube's scraping protection
    await new Promise((r) => setTimeout(r, 1000));
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n════════════════════════════════════════`);
  console.log(`📊 LYRICS RESULTS`);
  console.log(`════════════════════════════════════════`);
  console.log(`   Processed:   ${mezmurs.length}`);
  console.log(`   Success:     ${success} ✅ (Now have synced lyrics)`);
  console.log(`   No Captions: ${noCaptions} 🤷`);
  console.log(`   Failed:      ${failed} ❌`);
  console.log(`════════════════════════════════════════`);

  await pool.end();
}

main().catch((e) => {
  console.error("Unhandled Error:", e);
  process.exit(1);
});
