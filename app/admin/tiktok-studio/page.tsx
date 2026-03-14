import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { TikTokStudio } from "./TikTokStudio";

export default async function TikTokStudioPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) redirect("/auth");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (dbUser?.role !== "SUPER_ADMIN" && dbUser?.role !== "EDITOR") {
    redirect("/admin");
  }

  // Fetch mezmurs that have lyrics
  const mezmurs = await prisma.mezmur.findMany({
    where: {
      lyrics: { isEmpty: false },
      youtubeUrl: { not: null },
    },
    select: {
      id: true,
      title: true,
      lyrics: true,
      youtubeUrl: true,
      zemari: { select: { name: true } },
    },
    orderBy: { title: "asc" },
  });

  return (
    <div>
      <div className="admin-page-header">
        <h1>🎬 TikTok Studio</h1>
        <p className="admin-page-subtitle">
          Create beautiful lyric clips for TikTok & YouTube Shorts
        </p>
      </div>

      <TikTokStudio
        mezmurs={JSON.parse(JSON.stringify(mezmurs))}
      />
    </div>
  );
}
