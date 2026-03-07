import * as dotenv from "dotenv";
import path from "path";
import { Client } from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function test() {
  console.log("Testing connection to:", process.env.DATABASE_URL?.split('@')[1]);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✅ Successfully connected to PG!");
    const res = await client.query('SELECT NOW()');
    console.log("Time from DB:", res.rows[0]);
  } catch (err) {
    console.error("❌ Connection failed:", err);
  } finally {
    await client.end();
  }
}

test();
