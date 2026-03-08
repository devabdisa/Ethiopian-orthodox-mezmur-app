import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { MezmurRow } from "@/components/mezmur/MezmurRow";
import { PlaylistClientControls } from "./PlaylistClientControls";

export default async function SelectedPlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  if (!session?.user?.id) redirect("/");

  const playlist = await prisma.playlist.findUnique({
    where: { id, userId: session.user.id },
    include: {
      mezmurs: {
        orderBy: { addedAt: 'desc' },
        include: { mezmur: { include: { subCategory: true } } }
      }
    }
  });

  if (!playlist) return notFound();

  // Map to player object shape
  const tracks = playlist.mezmurs.map((p) => ({
    id: p.mezmur.id,
    title: p.mezmur.title,
    youtubeUrl: p.mezmur.youtubeUrl,
    subCategoryName: p.mezmur.subCategory.name
  }));

  // Create a queue starting from the currently playing index 
  // Wait, MezmurRow handles queue directly, but wait... 
  // Let's pass the whole tracks array as queue to MezmurRow.

  // Fetch favorite status for these tracks
  const mezmurIds = playlist.mezmurs.map(p => p.mezmur.id);
  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id, mezmurId: { in: mezmurIds } },
    select: { mezmurId: true }
  });
  const favoritedSet = new Set(favorites.map(f => f.mezmurId));

  return (
    <div className="pl-detail animate-in">
      <header className="pl-head surface-2">
        <div>
          <Link href="/playlists" className="back-link text-faint">← Back to Playlists</Link>
          <h1 className="pl-detail-title font-ethiopic">{playlist.name}</h1>
          <p className="text-faint mt-2">{tracks.length} tracks</p>
          <PlaylistClientControls playlistId={playlist.id} tracks={tracks} />
        </div>
      </header>

      <div className="pl-tracks">
        {playlist.mezmurs.length === 0 ? (
          <div className="empty-state text-muted">Add Mezmurs to this playlist!</div>
        ) : (
          playlist.mezmurs.map((pm, i) => (
            <MezmurRow 
              key={pm.mezmur.id}
              mezmur={pm.mezmur as any}
              subCategoryName={pm.mezmur.subCategory.name}
              index={i}
              queue={tracks}
              isFavorited={favoritedSet.has(pm.mezmur.id)}
            />
          ))
        )}
      </div>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .pl-detail { padding: 24px 20px 60px; max-width: 900px; margin: 0 auto; }
  .pl-head { padding: 32px 24px; display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; border-radius: var(--radius-lg); }
  .back-link { font-size: 13px; text-decoration: none; margin-bottom: 12px; display: inline-block; transition: color var(--transition); }
  .back-link:hover { color: hsl(var(--color-text)); }
  .pl-detail-title { font-size: 36px; font-weight: 700; color: hsl(var(--color-text)); line-height: 1.2; }
  .mt-2 { margin-top: 8px; }
  .empty-state { padding: 60px 20px; text-align: center; border: 1px dashed hsl(var(--color-border)); border-radius: var(--radius-lg); margin-top: 24px; }
`;
