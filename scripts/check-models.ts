import * as dotenv from "dotenv";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function list() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return;
  
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-001",
    "gemini-pro"
  ];

  console.log("Checking available Gemini models...");
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("test");
      if (result.response.text()) {
        console.log(`✅ ${m}: OK`);
      }
    } catch (e: any) {
      console.log(`❌ ${m}: FAIL (${e.message.split('\n')[0]})`);
    }
  }
}

list();
