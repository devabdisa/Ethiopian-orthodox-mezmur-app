/**
 * 🛡️ Dead Link Purge Script
 *
 * Scans every Mezmur in the database that has a youtubeUrl,
 * checks if the video is still playable via the YouTube Data API v3,
 * and deletes any Mezmurs whose videos are dead/private/removed.
 *
 * Usage:  npx tsx scripts/verify-links.ts
 *
 * Requires: YOUTUBE_API_KEY in your .env file
 */

import * as dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ── Config ────────────────────────────────────────────────────────────────────
const BATCH_SIZE = 50; // YouTube API allows up to 50 IDs per request
const DRY_RUN = process.argv.includes("--dry-run"); // Pass --dry-run to preview without deleting

// ── Blacklist (Protestant/Non-Orthodox filters) ───────────────────────────────
const BLACKLIST = [
  "ፓስተር", "ነቢይ", "protestant", "pente", "presence", "pastor",
  "prophet", "apostolic", "gospel", "ፕሮቴስታንት", "jesus tv",
  "christ army", "marsil", "pentecostal", "reformed", "evangelical",
  "cj", "haleluya", "ዮናታን", "yonatan"
];
const blacklistRegex = new RegExp(BLACKLIST.join("|"), "i");

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

  console.log("🔗 Connecting to database...");
  console.log(DRY_RUN ? "🏃 DRY RUN MODE — no deletions will happen\n" : "");

  // 1. Fetch all Mezmurs that have a YouTube URL
  const { rows: mezmurs } = await pool.query(
    'SELECT id, title, "youtubeUrl" FROM mezmurs WHERE "youtubeUrl" IS NOT NULL'
  );

  console.log(`📊 Found ${mezmurs.length} Mezmurs with YouTube URLs to verify.\n`);

  if (mezmurs.length === 0) {
    console.log("✅ Nothing to verify.");
    await pool.end();
    return;
  }

  // 2. Extract video IDs from URLs
  const mezmurMap = new Map<string, { id: string; title: string; url: string }>();

  for (const m of mezmurs) {
    const videoId = extractVideoId(m.youtubeUrl);
    if (!videoId) {
      // If we can't even parse the URL, it's definitely broken
      mezmurMap.set(`UNPARSEABLE_${m.id}`, { id: m.id, title: m.title, url: m.youtubeUrl });
      continue;
    }
    mezmurMap.set(videoId, { id: m.id, title: m.title, url: m.youtubeUrl });
  }

  // 3. Batch-check video IDs with YouTube Data API
  const allVideoIds = [...mezmurMap.keys()].filter((k) => !k.startsWith("UNPARSEABLE_"));
  const deadMezmurIds: string[] = [];
  const unparseableIds = [...mezmurMap.entries()]
    .filter(([key]) => key.startsWith("UNPARSEABLE_"))
    .map(([, val]) => val.id);

  // Add unparseable URLs to the dead list immediately
  deadMezmurIds.push(...unparseableIds);
  if (unparseableIds.length > 0) {
    console.log(`⚠️  ${unparseableIds.length} Mezmurs have unparseable YouTube URLs.\n`);
  }

  let checked = 0;
  for (let i = 0; i < allVideoIds.length; i += BATCH_SIZE) {
    const batchIds = allVideoIds.slice(i, i + BATCH_SIZE);
    const idsParam = batchIds.join(",");

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=status,snippet&id=${idsParam}&key=${YOUTUBE_API_KEY}`;

    let response;
    try {
      const res = await fetch(apiUrl);
      response = await res.json();
    } catch (err) {
      console.error(`❌ YouTube API request failed for batch starting at index ${i}:`, err);
      continue;
    }

    if (response.error) {
      console.error(`❌ YouTube API error:`, response.error.message);
      continue;
    }

    // Build a set of video IDs that YouTube confirmed as existing & embeddable
    const aliveIds = new Set<string>();
    
    for (const item of response.items || []) {
      const status = item.status;
      const snippet = item.snippet;
      
      // A video is "alive" if it's public/unlisted AND embeddable
      if (
        status &&
        (status.privacyStatus === "public" || status.privacyStatus === "unlisted") &&
        status.embeddable === true
      ) {
        // Evaluate the Orthodox Blacklist Check
        const rawTitle = snippet?.title || "";
        const channel = snippet?.channelTitle || "";
        
        if (blacklistRegex.test(rawTitle) || blacklistRegex.test(channel)) {
           console.log(`  🚫 [BLACKLISTED] "${rawTitle}" by [${channel}]`);
           // We intentionally skip adding it to aliveIds. 
           // It will be treated as "DEAD" and deleted from the database.
        } else {
           aliveIds.add(item.id);
        }
      }
    }

    // Any ID we sent that YouTube didn't return as alive is dead
    for (const videoId of batchIds) {
      if (!aliveIds.has(videoId)) {
        const mezmur = mezmurMap.get(videoId)!;
        deadMezmurIds.push(mezmur.id);
        console.log(`  💀 DEAD: "${mezmur.title}" → ${mezmur.url}`);
      }
    }

    checked += batchIds.length;
    console.log(`  ✅ Verified ${checked} / ${allVideoIds.length}`);

    // Small delay to be kind to the API
    await new Promise((r) => setTimeout(r, 200));
  }

  // 4. Report & Delete
  console.log(`\n════════════════════════════════════════`);
  console.log(`📊 VERIFICATION RESULTS`);
  console.log(`════════════════════════════════════════`);
  console.log(`   Total checked:  ${mezmurs.length}`);
  console.log(`   Alive & playable: ${mezmurs.length - deadMezmurIds.length}`);
  console.log(`   Dead / broken:    ${deadMezmurIds.length}`);
  console.log(`════════════════════════════════════════\n`);

  if (deadMezmurIds.length === 0) {
    console.log("🎉 All YouTube links are alive! Nothing to delete.");
    await pool.end();
    return;
  }

  if (DRY_RUN) {
    console.log(`🏃 DRY RUN: Would have deleted ${deadMezmurIds.length} broken Mezmurs.`);
    console.log("   Re-run without --dry-run to execute the purge.");
    await pool.end();
    return;
  }

  // Delete in batches to avoid overly large SQL queries
  console.log(`🗑️  Deleting ${deadMezmurIds.length} broken Mezmurs...`);
  const DEL_BATCH = 100;
  let deleted = 0;

  for (let i = 0; i < deadMezmurIds.length; i += DEL_BATCH) {
    const batch = deadMezmurIds.slice(i, i + DEL_BATCH);
    const placeholders = batch.map((_, idx) => `$${idx + 1}`).join(",");
    await pool.query(`DELETE FROM mezmurs WHERE id IN (${placeholders})`, batch);
    deleted += batch.length;
    console.log(`   🗑️  Deleted ${deleted} / ${deadMezmurIds.length}`);
  }

  console.log(`\n✅ Purge complete! Removed ${deadMezmurIds.length} broken Mezmurs from the database.`);
  await pool.end();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractVideoId(url: string): string | null {
  if (!url) return null;
  // Handle: https://www.youtube.com/watch?v=XXXXX
  const match1 = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (match1) return match1[1];
  // Handle: https://youtu.be/XXXXX
  const match2 = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match2) return match2[1];
  return null;
}

main().catch((e) => {
  console.error("Unhandled Error:", e);
  process.exit(1);
});
