import * as dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  console.log("🚀 Starting deletion of all AUTO_FETCHED Mezmurs...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("🔗 Connected to database...");
    
    const res = await pool.query(`DELETE FROM "mezmurs" WHERE "youtubeUrlSource" = 'AUTO_FETCHED'`);
    
    console.log(`✅ Successfully deleted ${res.rowCount} Mezmurs.`);
  } catch (error) {
    console.error("❌ Error deleting Mezmurs:", error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
