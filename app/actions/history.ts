"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// ── Log a listen ────────────────────────────────────────────────────────────
// Upserts the history, ensuring the playedAt date is updated to now.
export async function logListen(mezmurId: string) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    return { error: "NOT_AUTHENTICATED" };
  }

  const userId = session.user.id;

  try {
    await prisma.listenHistory.upsert({
      where: {
        userId_mezmurId: { userId, mezmurId },
      },
      create: {
        userId,
        mezmurId,
      },
      update: {
        playedAt: new Date(),
      },
    });

    return { success: true };
  } catch (err) {
    console.error("Failed to log listen:", err);
    return { error: "FAILED_TO_LOG" };
  }
}

// ── Get Listen History ──────────────────────────────────────────────────────
export async function getListenHistory(limit = 20) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    return [];
  }

  const history = await prisma.listenHistory.findMany({
    where: { userId: session.user.id },
    include: {
      mezmur: {
        include: {
          subCategory: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: { playedAt: "desc" },
    take: limit,
  });

  return history.map((record) => ({
    id: record.id,
    playedAt: record.playedAt,
    mezmur: record.mezmur,
  }));
}
