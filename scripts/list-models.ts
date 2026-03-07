import * as dotenv from "dotenv";
import path from "path";
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function listModels() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return;
  
  // The official way to list models is via the v1 API for some SDK versions
  // but let's try a simple fetch to the endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

listModels();
