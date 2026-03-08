import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { redirect } from "next/navigation";

export default async function PlaylistsPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  if (!session?.user?.id) redirect("/");

  const playlists = await prisma.playlist.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { mezmurs: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="playlists-page animate-in">
      <header className="pl-header">
        <h1 className="title font-ethiopic">My Playlists</h1>
      </header>

      {playlists.length === 0 ? (
        <div className="pl-empty text-muted">You haven't created any playlists.</div>
      ) : (
        <div className="pl-grid">
          {playlists.map((pl) => (
            <Link key={pl.id} href={`/playlists/${pl.id}`} className="pl-card surface-2">
              <div className="pl-cover">💿</div>
              <div className="pl-info">
                <h3 className="pl-name font-ethiopic">{pl.name}</h3>
                <p className="pl-meta text-faint">{pl._count.mezmurs} tracks</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .playlists-page { padding: 32px 24px; max-width: 1000px; margin: 0 auto; }
  .pl-header { border-bottom: 1px solid hsl(var(--color-border)); padding-bottom: 16px; margin-bottom: 32px; }
  .title { font-size: 28px; font-weight: 700; color: hsl(var(--color-text)); }
  .pl-empty { padding: 60px 20px; text-align: center; border: 1px dashed hsl(var(--color-border)); border-radius: var(--radius-lg); }
  .pl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
  .pl-card { display: flex; flex-direction: column; text-decoration: none; overflow: hidden; transition: transform var(--transition); border-radius: var(--radius-lg); }
  .pl-card:hover { transform: translateY(-4px); border-color: hsl(var(--color-accent) / .5); box-shadow: var(--shadow-sm); }
  .pl-cover { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: hsl(var(--color-bg)); font-size: 48px; border-bottom: 1px solid hsl(var(--color-border)); }
  .pl-info { padding: 16px; }
  .pl-name { font-size: 17px; font-weight: 600; color: hsl(var(--color-text)); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pl-meta { font-size: 13px; margin: 0; }
`;
