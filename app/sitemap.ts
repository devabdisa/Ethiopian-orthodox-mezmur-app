import { MetadataRoute } from "next";
import prisma from "@/lib/db/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://mezmur.vercel.app"; // Update when you deploy

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];

  // All categories
  const categories = await prisma.category.findMany({
    select: { name: true },
  });

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/categories/${encodeURIComponent(cat.name)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // All mezmurs
  const mezmurs = await prisma.mezmur.findMany({
    select: { id: true, createdAt: true },
    orderBy: { id: "asc" },
  });

  const mezmurPages: MetadataRoute.Sitemap = mezmurs.map((m) => ({
    url: `${baseUrl}/mezmurs/${m.id}`,
    lastModified: m.createdAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...mezmurPages];
}
