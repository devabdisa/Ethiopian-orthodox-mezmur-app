"use server";

import prisma from "@/lib/db/prisma";
import ytSearch from "yt-search";

/**
 * Searches YouTube for a Mezmur audio stream and saves it to the DB if found.
 *
 * THE TRICK: We search using the Mezmur Title + the FIRST line of the lyrics.
 * We just grab the very first video result from YouTube.
 */
export async function getOrFetchMezmurAudioUrl(
  mezmurId: string,
): Promise<string | null> {
  const mezmur = await prisma.mezmur.findUnique({
    where: { id: mezmurId },
    select: { id: true, title: true, lyrics: true, youtubeUrl: true },
  });

  if (!mezmur) throw new Error("Mezmur not found");

  // 1. If we already cached the URL, return it immediately
  if (mezmur.youtubeUrl) return mezmur.youtubeUrl;

  // 2. We need to fetch it.
  // Grab the first non-empty lyric line to make the search highly accurate.
  const firstLyric = mezmur.lyrics.find((line) => line.trim().length > 0) || "";

  // Construct query: "Title FirstLyric" (often results in best exact matches on YT)
  const searchQuery = `${mezmur.title} ${firstLyric}`.trim();

  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      const results = await ytSearch(searchQuery);
      const firstVideo = results.videos[0];

      if (!firstVideo) {
        console.warn(`No YouTube results mapped for: ${searchQuery}`);
        return null;
      }

      const foundUrl = firstVideo.url;

      // 3. Cache it in the database exactly once!
      await prisma.mezmur.update({
        where: { id: mezmurId },
        data: {
          youtubeUrl: foundUrl,
          youtubeUrlSource: "AUTO_FETCHED",
        },
      });

      return foundUrl;
    } catch (error: any) {
      attempt++;
      console.error(
        `YouTube search crashed on attempt ${attempt}:`,
        error?.message || error,
      );

      if (attempt >= maxRetries) {
        console.error(
          "Max retries reached. YouTube search failed permanently.",
        );
        return null;
      }
      // Wait before retrying (exponential backoff: 1s, 2s)
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  return null;
}
