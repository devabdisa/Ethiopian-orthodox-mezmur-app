import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import ytSearch from "yt-search";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const mezmur = await prisma.mezmur.findUnique({
    where: { id },
    select: { id: true, title: true, lyrics: true, youtubeUrl: true },
  });

  if (!mezmur) {
    return NextResponse.json({ error: "Mezmur not found" }, { status: 404 });
  }

  // Already cached — return it immediately
  if (mezmur.youtubeUrl) {
    return NextResponse.json({ url: mezmur.youtubeUrl });
  }

  // Search YouTube: Title + first lyric line
  const firstLyric = mezmur.lyrics.find((l) => l.trim().length > 0) ?? "";
  const query = `${mezmur.title} ${firstLyric}`.trim();

  let attempt = 0;
  while (attempt < 3) {
    try {
      const results = await ytSearch(query);
      const video = results.videos[0];
      if (!video) {
        return NextResponse.json(
          { error: "No YouTube results found" },
          { status: 404 },
        );
      }

      // Cache it
      await prisma.mezmur.update({
        where: { id },
        data: { youtubeUrl: video.url, youtubeUrlSource: "AUTO_FETCHED" },
      });

      return NextResponse.json({ url: video.url });
    } catch (e: any) {
      attempt++;
      console.error(`[audio-url] Attempt ${attempt} failed:`, e?.message);
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 800));
    }
  }

  return NextResponse.json(
    { error: "Failed to find audio after retries" },
    { status: 502 },
  );
}
