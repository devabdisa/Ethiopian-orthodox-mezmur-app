import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { google } from "googleapis";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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
    const firstLyric = Array.isArray(mezmur.lyrics) 
      ? (mezmur.lyrics.find((l) => typeof l === 'string' && l.trim().length > 0) ?? "") 
      : "";
      
    // Always append "mezmur" to ensure we get an Ethiopian hymn
    const query = `${mezmur.title} ${firstLyric} mezmur orthodox`.trim();

    // Ensure we have an API key
    if (!process.env.YOUTUBE_API_KEY) {
      console.error("[audio-url] Missing YOUTUBE_API_KEY");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });

    let attempt = 0;
    while (attempt < 3) {
      try {
        const response = await youtube.search.list({
          part: ['id'],
          q: query,
          type: ['video'],
          maxResults: 1
        });

        const videoId = response.data.items?.[0]?.id?.videoId;
        
        if (!videoId) {
          return NextResponse.json(
            { error: "No YouTube results found" },
            { status: 404 },
          );
        }

        const videoUrl = `https://youtube.com/watch?v=${videoId}`;

        // Cache it
        await prisma.mezmur.update({
          where: { id },
          data: { youtubeUrl: videoUrl, youtubeUrlSource: "AUTO_FETCHED" },
        });

        return NextResponse.json({ url: videoUrl });
      } catch (e: any) {
        attempt++;
        console.error(`[audio-url] Attempt ${attempt} failed:`, e?.message || e);
        if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 800));
      }
    }

    return NextResponse.json(
      { error: "Failed to find audio after retries" },
      { status: 502 },
    );
  } catch (error: any) {
    console.error("[audio-url] Unhandled Exception:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
