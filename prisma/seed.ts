/**
 * 🕊️ Prisma Seed Script — Ethiopian Orthodox Mezmur Platform
 *
 * Reads data/mezmurs.json and populates:
 *   1. Categories       (from unique mainCategory values)
 *   2. SubCategories    (from unique subCategory values per category)
 *   3. Mezmurs          (all 792+ hymns linked to their subcategory)
 *
 * Run with: npx prisma db seed
 * (Configured via the "prisma.seed" field in package.json)
 */

import { PrismaClient } from "@/app/generated/prisma/client";
import * as fs from "fs";
import * as path from "path";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// ─── Type for the raw JSON data ───────────────────────────
interface RawMezmur {
  id: number;
  title: string;
  mainCategory: string;
  subCategory: string; // Can be ""
  youtubeUrl: string; // Always "" in current data
  lyrics: string[];
  meaning?: string;
}

// ─── English transliterations for known categories ────────
const CATEGORY_TRANSLITERATIONS: Record<string, string> = {
  // ── Original mezmurs ───────────────────────────────────────
  "የምስጋና መዝሙር": "Praise Hymns",
  "የሰንበት ትምህርት ቤት መዝሙር": "Sunday School Hymns",
  "የገና እና የጥምቀት መዝሙር": "Christmas & Epiphany Hymns",
  "አጫጭር መዝሙሮች": "Short Hymns",
  "የሠርግ መዝሙሮች": "Wedding Hymns",
  "የመስቀል መዝሙር": "Meskel (Holy Cross) Hymns",
  "ዝማሬ ምሽት መዝሙሮች": "Evening Hymns",
  // ── PDF-sourced mezmurs (12 categories from table of contents) ─
  "የአዲስ ዓመት እና የመስቀል መዝሙራት": "New Year & Meskel Hymns",
  "የልደት መዝሙራት": "Christmas Hymns",
  "የጥምቀት መዝሙራት": "Timkat / Epiphany Hymns",
  "የእመቤታችን መዝሙራት": "Our Lady St. Mary's Hymns",
  "የንስሐ መዝሙራት": "Repentance Hymns",
  "የሆሣዕና መዝሙራት": "Hosanna / Palm Sunday Hymns",
  "የትንሣኤ መዝሙራት": "Resurrection / Easter Hymns",
  "የኢየሱስ ክርስቶስ የምስጋና መዝሙራት": "Jesus Christ Praise Hymns",
  "የሠርግ መዝሙራት": "Wedding Hymns",
  "የፃድቃን እና የቅዱሳን መላእክት መዝሙራት": "Saints & Holy Angels Hymns",
  "የደብረ ታቦር መዝሙራት": "Debre Tabor / Transfiguration Hymns",
  "የተለያዩ በዓላት ወረብ": "Various Holidays Wereb",
};

const SUBCATEGORY_TRANSLITERATIONS: Record<string, string> = {
  "የቅድስት ሥላሴ": "Holy Trinity",
  "የእመቤታችን ቅድስት ድንግል ማርያም": "St. Virgin Mary",
  "የቅዱሳን መላእክት የምስጋና መዝሙራት": "Holy Angels",
  "የቅዱሳን፣ የጻድቃን እና የሰማዕታት የምስጋና መዝሙራት": "Saints, Righteous & Martyrs",
  "የቅድስት ቤተክርስቲያን የምስጋና መዝሙራት": "Holy Church",
  "የሀገራችን የኢትዮጵያ የምስጋና መዝሙራት": "Ethiopia Praise",
  "ለፓትርያርክ እና ጳጳሳት የሚዘመሩ መዝሙራት": "Patriarch & Bishops",
  "የቅዱስ ቁርባን ምስጋና መዝሙራት": "Holy Communion",
  "ትውፊታዊ መዝሙራት": "Traditional Hymns",
  "የወርኃ ክረምት መዝሙራት": "Rainy Season (Kremit)",
  "የዕለተ ሰንበት መዝሙራት": "Sabbath Day",
  "የጉባኤ መዝሙራት": "Congregation/Assembly",
};

// Label for mezmurs with no subCategory in the JSON
const DEFAULT_SUBCATEGORY = "ጠቅላላ"; // "General"
const DEFAULT_SUBCATEGORY_EN = "General";

async function main() {
  console.log("🕊️  Starting seed...\n");

  // ─── 1. Read and parse the JSON ────────────────────────
  const jsonPath = path.join(__dirname, "..", "data", "mezmurs.json");
  const raw: RawMezmur[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`📖 Loaded ${raw.length} mezmurs from JSON\n`);

  // ─── 2. Extract unique categories and subcategories ────
  const categoryMap = new Map<string, Set<string>>();

  for (const m of raw) {
    const cat = m.mainCategory;
    const sub = m.subCategory || DEFAULT_SUBCATEGORY;

    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, new Set());
    }
    categoryMap.get(cat)!.add(sub);
  }

  // ─── 3. Upsert Categories ─────────────────────────────
  console.log("📂 Seeding categories...");
  const categoryIdMap = new Map<string, string>(); // name → db id

  for (const catName of categoryMap.keys()) {
    const category = await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: {
        name: catName,
        nameTransliterated: CATEGORY_TRANSLITERATIONS[catName] || null,
      },
    });
    categoryIdMap.set(catName, category.id);
    console.log(
      `   ✅ ${catName} → ${CATEGORY_TRANSLITERATIONS[catName] || "(no EN name)"}`,
    );
  }

  // ─── 4. Upsert SubCategories ──────────────────────────
  console.log("\n📁 Seeding subcategories...");
  // Composite key: "mainCategory::subCategory" → db id
  const subCategoryIdMap = new Map<string, string>();

  for (const [catName, subs] of categoryMap) {
    const categoryId = categoryIdMap.get(catName)!;

    for (const subName of subs) {
      const transliterated =
        subName === DEFAULT_SUBCATEGORY
          ? DEFAULT_SUBCATEGORY_EN
          : SUBCATEGORY_TRANSLITERATIONS[subName] || null;

      const subCategory = await prisma.subCategory.upsert({
        where: {
          name_categoryId: { name: subName, categoryId },
        },
        update: {},
        create: {
          name: subName,
          nameTransliterated: transliterated,
          categoryId,
        },
      });

      const compositeKey = `${catName}::${subName}`;
      subCategoryIdMap.set(compositeKey, subCategory.id);
      console.log(`   ✅ ${subName} → ${transliterated || "(no EN name)"}`);
    }
  }

  // ─── 5. Seed Mezmurs in batches ───────────────────────
  console.log(`\n🎵 Seeding ${raw.length} mezmurs...`);

  // Clear existing mezmurs to allow re-seeding
  const deleted = await prisma.mezmur.deleteMany();
  console.log(`   🗑️  Cleared ${deleted.count} existing mezmurs`);

  const BATCH_SIZE = 50;
  let seeded = 0;

  for (let i = 0; i < raw.length; i += BATCH_SIZE) {
    const batch = raw.slice(i, i + BATCH_SIZE);

    await prisma.mezmur.createMany({
      data: batch.map((m) => {
        const subName = m.subCategory || DEFAULT_SUBCATEGORY;
        const compositeKey = `${m.mainCategory}::${subName}`;
        const subCategoryId = subCategoryIdMap.get(compositeKey);

        if (!subCategoryId) {
          throw new Error(
            `❌ Missing subCategoryId for: "${m.mainCategory}" → "${subName}" (Mezmur: "${m.title}")`,
          );
        }

        return {
          title: m.title,
          lyrics: m.lyrics,
          meaning: m.meaning || null,
          youtubeUrl: m.youtubeUrl || null, // "" becomes null
          subCategoryId,
        };
      }),
    });

    seeded += batch.length;
    console.log(`   📝 ${seeded} / ${raw.length}`);
  }

  // ─── 6. Summary ───────────────────────────────────────
  const counts = {
    categories: await prisma.category.count(),
    subCategories: await prisma.subCategory.count(),
    mezmurs: await prisma.mezmur.count(),
  };

  console.log("\n✅ Seed complete!");
  console.log("──────────────────────────");
  console.log(`   Categories:    ${counts.categories}`);
  console.log(`   SubCategories: ${counts.subCategories}`);
  console.log(`   Mezmurs:       ${counts.mezmurs}`);
  console.log("──────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
