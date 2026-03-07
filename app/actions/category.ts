"use server";

import prisma from "@/lib/db/prisma";

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subCategories: {
          include: {
            _count: {
              select: { mezmurs: true },
            },
          },
        },
        _count: {
          select: { subCategories: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    return categories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export async function getFeaturedCategories() {
  try {
    const categories = await prisma.category.findMany({
      take: 6,
      include: {
        subCategories: {
          include: {
            _count: {
              select: { mezmurs: true },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    return categories;
  } catch (error) {
    console.error("Failed to fetch featured categories:", error);
    return [];
  }
}
