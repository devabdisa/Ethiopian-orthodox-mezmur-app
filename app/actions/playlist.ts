"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

// Helper to securely grab session
async function getUserId() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  return session?.user?.id;
}

export async function createPlaylist(name: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("NOT_AUTHENTICATED");
  if (!name.trim()) throw new Error("Name cannot be empty");

  const playlist = await prisma.playlist.create({
    data: { name: name.trim(), userId },
  });

  revalidatePath("/playlists");
  return { success: true, playlist };
}

export async function addMezmurToPlaylist(playlistId: string, mezmurId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("NOT_AUTHENTICATED");

  // Verify ownership before modifying
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId, userId },
  });
  if (!playlist) throw new Error("NOT_FOUND_OR_FORBIDDEN");

  // Upsert ensures if they add a song twice, it just resets 'addedAt' to right now
  await prisma.playlistMezmur.upsert({
    where: { playlistId_mezmurId: { playlistId, mezmurId } },
    create: { playlistId, mezmurId },
    update: { addedAt: new Date() },
  });

  revalidatePath("/playlists");
  revalidatePath(`/playlists/${playlistId}`);
  return { success: true };
}

export async function removeMezmurFromPlaylist(playlistId: string, mezmurId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("NOT_AUTHENTICATED");

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId, userId },
  });
  if (!playlist) throw new Error("NOT_FOUND_OR_FORBIDDEN");

  await prisma.playlistMezmur.delete({
    where: { playlistId_mezmurId: { playlistId, mezmurId } },
  });

  revalidatePath(`/playlists/${playlistId}`);
  return { success: true };
}

export async function deletePlaylist(playlistId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("NOT_AUTHENTICATED");

  // Prisma Cascade handles deleting the PlaylistMezmurs internally
  await prisma.playlist.delete({
    where: { id: playlistId, userId },
  });

  revalidatePath("/playlists");
  return { success: true };
}

export async function getUserPlaylists() {
  const userId = await getUserId();
  if (!userId) return [];

  return prisma.playlist.findMany({
    where: { userId },
    include: {
      _count: { select: { mezmurs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
