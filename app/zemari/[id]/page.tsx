import { notFound } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/db/prisma";
import { PlayMezmurButton } from "@/components/mezmur/PlayMezmurButton";
import { MezmurRow } from "@/components/mezmur/MezmurRow";
import { getFavoriteIds } from "@/app/actions/favorites";

interface ZemariPageProps {
  params: Promise<{ id: string }>;
}

export default async function ZemariPage({ params }: ZemariPageProps) {
  const { id } = await params;
  
  const zemari = await prisma.zemari.findUnique({
    where: { id },
    include: {
      mezmurs: {
        include: {
          subCategory: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!zemari) {
    notFound();
  }

  // Optimize performance by batch checking favorites
  const mezmurIds = zemari.mezmurs.map((m) => m.id);
  const favoritedIds = await getFavoriteIds(mezmurIds);
  const favoritedSet = new Set(favoritedIds);

  // Map to player queue
  const queue = zemari.mezmurs.map((m) => ({
    id: m.id,
    title: m.title,
    youtubeUrl: m.youtubeUrl,
    subCategoryName: m.subCategory?.name ?? "",
  }));

  return (
    <div className="zemari-page max-w-5xl mx-auto pb-24">
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-12 animate-in pt-8">
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden surface-2 shadow-2xl relative flex-shrink-0">
          {zemari.imageUrl ? (
            <Image
              src={zemari.imageUrl}
              alt={zemari.nameAmharic || zemari.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 192px, 256px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[hsl(var(--color-overlay)_/_0.5)]">
              <span className="text-6xl">🎵</span>
            </div>
          )}
        </div>

        <div className="text-center md:text-left flex-1 min-w-0">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">
            Artist
          </p>
          <h1 className="text-4xl md:text-6xl font-black font-ethiopic text-primary mb-4 leading-tight">
            {zemari.nameAmharic || zemari.name}
          </h1>
          <p className="text-lg text-muted mb-6">
            {zemari.mezmurs.length} Mezmurs
          </p>

          <div className="flex items-center justify-center md:justify-start gap-4">
            {queue.length > 0 && (
              <PlayMezmurButton track={queue[0]} queue={queue} variant="full" />
            )}
          </div>
        </div>
      </header>

      {/* ── Mezmurs List ── */}
      <section className="animate-in" style={{ animationDelay: "150ms" }}>
        <h2 className="text-2xl font-bold font-ethiopic mb-6">All Mezmurs</h2>
        <div className="flex flex-col gap-2">
          {zemari.mezmurs.length === 0 ? (
            <p className="text-muted p-8 text-center surface-2 rounded-xl">
              No mezmurs found for this artist yet.
            </p>
          ) : (
            zemari.mezmurs.map((mezmur, idx) => (
              <MezmurRow
                key={mezmur.id}
                mezmur={mezmur as any}
                subCategoryName={mezmur.subCategory?.name ?? "Unknown Category"}
                index={idx}
                queue={queue}
                isFavorited={favoritedSet.has(mezmur.id)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
