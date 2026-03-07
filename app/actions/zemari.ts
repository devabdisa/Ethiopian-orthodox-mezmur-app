"use server";

import prisma from "@/lib/db/prisma";

export async function getFeaturedZemarian() {
  try {
    const zemarian = await prisma.zemari.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: { mezmurs: true },
        },
      },
    });
    return zemarian;
  } catch (error) {
    console.error("Failed to fetch featured Zemarian:", error);
    return [];
  }
}

export async function getAllZemarian() {
  try {
    const zemarian = await prisma.zemari.findMany({
      orderBy: {
        nameAmharic: "asc",
      },
      include: {
        _count: {
          select: { mezmurs: true },
        },
      },
    });
    return zemarian;
  } catch (error) {
    console.error("Failed to fetch all Zemarian:", error);
    return [];
  }
}
