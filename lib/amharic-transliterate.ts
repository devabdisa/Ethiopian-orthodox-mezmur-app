// ═══════════════════════════════════════════════════════════════════════════════
// Amharic Phonetic Transliterator (Latin → Ge'ez/Fidäl)
// ═══════════════════════════════════════════════════════════════════════════════
//
// The Ethiopian writing system (Fidäl) has ~230 characters organized in a grid:
//   - Each ROW is a consonant (ለ, መ, ረ, etc.)
//   - Each COLUMN is a vowel order (ä, u, i, a, é, ə, o)
//
// This means transliteration is highly predictable:
//   "la" → ላ  (l-consonant, a-vowel = 4th order)
//   "le" → ለ  (l-consonant, e-vowel = 1st order)
//   "l"  → ል  (l-consonant, no vowel = 6th order / bare)
//
// Usage:
//   transliterate("lamesgnh yene geta") → "ላመስግንህ የነ ገታ"
// ═══════════════════════════════════════════════════════════════════════════════

// Each entry: [consonant_key, [1st, 2nd, 3rd, 4th, 5th, 6th, 7th]]
//                               ä/e   u    i    a    é    ə    o
const FIDEL_MAP: [string, string[]][] = [
  // Multi-char consonants MUST come first (greedy matching)
  ["sh", ["ሸ", "ሹ", "ሺ", "ሻ", "ሼ", "ሽ", "ሾ"]],
  ["ch", ["ቸ", "ቹ", "ቺ", "ቻ", "ቼ", "ች", "ቾ"]],
  ["zh", ["ዠ", "ዡ", "ዢ", "ዣ", "ዤ", "ዥ", "ዦ"]],
  ["ts", ["ጸ", "ጹ", "ጺ", "ጻ", "ጼ", "ጽ", "ጾ"]],
  ["tz", ["ፀ", "ፁ", "ፂ", "ፃ", "ፄ", "ፅ", "ፆ"]],
  ["ny", ["ኘ", "ኙ", "ኚ", "ኛ", "ኜ", "ኝ", "ኞ"]],
  ["gn", ["ኘ", "ኙ", "ኚ", "ኛ", "ኜ", "ኝ", "ኞ"]],

  // Single-char consonants
  ["h", ["ሀ", "ሁ", "ሂ", "ሃ", "ሄ", "ህ", "ሆ"]],
  ["l", ["ለ", "ሉ", "ሊ", "ላ", "ሌ", "ል", "ሎ"]],
  ["m", ["መ", "ሙ", "ሚ", "ማ", "ሜ", "ም", "ሞ"]],
  ["r", ["ረ", "ሩ", "ሪ", "ራ", "ሬ", "ር", "ሮ"]],
  ["s", ["ሰ", "ሱ", "ሲ", "ሳ", "ሴ", "ስ", "ሶ"]],
  ["q", ["ቀ", "ቁ", "ቂ", "ቃ", "ቄ", "ቅ", "ቆ"]],
  ["b", ["በ", "ቡ", "ቢ", "ባ", "ቤ", "ብ", "ቦ"]],
  ["v", ["ቨ", "ቩ", "ቪ", "ቫ", "ቬ", "ቭ", "ቮ"]],
  ["t", ["ተ", "ቱ", "ቲ", "ታ", "ቴ", "ት", "ቶ"]],
  ["c", ["ቸ", "ቹ", "ቺ", "ቻ", "ቼ", "ች", "ቾ"]],
  ["n", ["ነ", "ኑ", "ኒ", "ና", "ኔ", "ን", "ኖ"]],
  ["k", ["ከ", "ኩ", "ኪ", "ካ", "ኬ", "ክ", "ኮ"]],
  ["K", ["ኸ", "ኹ", "ኺ", "ኻ", "ኼ", "ኽ", "ኾ"]],
  ["w", ["ወ", "ዉ", "ዊ", "ዋ", "ዌ", "ው", "ዎ"]],
  ["z", ["ዘ", "ዙ", "ዚ", "ዛ", "ዜ", "ዝ", "ዞ"]],
  ["y", ["የ", "ዩ", "ዪ", "ያ", "ዬ", "ይ", "ዮ"]],
  ["d", ["ደ", "ዱ", "ዲ", "ዳ", "ዴ", "ድ", "ዶ"]],
  ["j", ["ጀ", "ጁ", "ጂ", "ጃ", "ጄ", "ጅ", "ጆ"]],
  ["g", ["ገ", "ጉ", "ጊ", "ጋ", "ጌ", "ግ", "ጎ"]],
  ["f", ["ፈ", "ፉ", "ፊ", "ፋ", "ፌ", "ፍ", "ፎ"]],
  ["p", ["ፐ", "ፑ", "ፒ", "ፓ", "ፔ", "ፕ", "ፖ"]],
];

// Standalone vowels (when no consonant precedes them) — uses the አ row
const VOWEL_MAP: Record<string, string> = {
  e: "እ", // 6th order (schwa)
  u: "ኡ",
  i: "ኢ",
  a: "አ",
  o: "ኦ",
};

// Vowel → column index mapping (used after a consonant match)
function getVowelIndex(input: string, pos: number): [number, number] {
  // Returns [column_index, chars_consumed]
  if (pos >= input.length) return [5, 0]; // bare consonant (6th order)

  const c = input[pos];
  const next = pos + 1 < input.length ? input[pos + 1] : "";

  // "ee" → 5th order (é)
  if (c === "e" && next === "e") return [4, 2];
  // "ie" → 5th order (é) — alternative spelling
  if (c === "i" && next === "e") return [4, 2];

  switch (c) {
    case "e":
      return [0, 1]; // 1st order (ä)
    case "u":
      return [1, 1]; // 2nd order
    case "i":
      return [2, 1]; // 3rd order
    case "a":
      return [3, 1]; // 4th order
    case "o":
      return [6, 1]; // 7th order
    default:
      return [5, 0]; // bare consonant (6th order) — no vowel consumed
  }
}

/**
 * Transliterate Latin phonetic text to Amharic/Ge'ez (Fidäl) script.
 *
 * @example
 * transliterate("lamesgnh")     → "ላመስግንህ"
 * transliterate("yene geta")    → "የነ ገታ"
 * transliterate("mariam")       → "ማሪአም"
 * transliterate("selam")        → "ሰላም"
 */
export function transliterate(input: string): string {
  const lower = input.toLowerCase();
  let result = "";
  let i = 0;

  while (i < lower.length) {
    const ch = lower[i];

    // Preserve spaces, punctuation, numbers, and already-Amharic text
    if (ch === " " || ch === "\t" || ch === "\n") {
      result += ch;
      i++;
      continue;
    }

    // If character is already Amharic (Unicode range), pass through
    if (ch.charCodeAt(0) >= 0x1200 && ch.charCodeAt(0) <= 0x137f) {
      result += ch;
      i++;
      continue;
    }

    // Try to match a consonant (longest match first — multi-char before single)
    let matched = false;
    for (const [key, forms] of FIDEL_MAP) {
      if (lower.startsWith(key, i)) {
        // Matched a consonant — now find the vowel that follows
        const afterConsonant = i + key.length;
        const [vowelIdx, vowelChars] = getVowelIndex(lower, afterConsonant);
        result += forms[vowelIdx];
        i = afterConsonant + vowelChars;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Check if it's a standalone vowel
      if (VOWEL_MAP[ch]) {
        result += VOWEL_MAP[ch];
        i++;
      } else {
        // Unknown character — pass through as-is (numbers, punctuation, etc.)
        result += ch;
        i++;
      }
    }
  }

  return result;
}

/**
 * Check if a string contains primarily Latin characters
 * (used to decide whether to transliterate before searching)
 */
export function isLatinText(text: string): boolean {
  const latinChars = text.replace(/[\s\d\W]/g, "");
  if (latinChars.length === 0) return false;
  const latinCount = (latinChars.match(/[a-zA-Z]/g) || []).length;
  return latinCount / latinChars.length > 0.5;
}
