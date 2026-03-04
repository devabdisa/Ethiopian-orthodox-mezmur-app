"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// ── Toggle Favorite ─────────────────────────────────────────────────────────
// Returns { isFavorited: boolean } on success, or { error: string } on failure.

export async function toggleFavorite(mezmurId: string) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    return { error: "NOT_AUTHENTICATED" };
  }

  const userId = session.user.id;

  // Check if already favorited
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_mezmurId: { userId, mezmurId },
    },
  });

  if (existing) {
    // Un-favorite
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { isFavorited: false };
  } else {
    // Favorite
    await prisma.favorite.create({
      data: { userId, mezmurId },
    });
    return { isFavorited: true };
  }
}

// ── Check if a list of mezmur IDs are favorited by the current user ─────────
// Used on category pages to know which hearts to fill.

export async function getFavoriteIds(mezmurIds: string[]): Promise<string[]> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id || mezmurIds.length === 0) return [];

  const favorites = await prisma.favorite.findMany({
    where: {
      userId: session.user.id,
      mezmurId: { in: mezmurIds },
    },
    select: { mezmurId: true },
  });

  return favorites.map((f) => f.mezmurId);
}
