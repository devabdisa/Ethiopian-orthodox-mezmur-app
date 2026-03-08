import prisma from "@/lib/db/prisma";
import { CategoryTable } from "./CategoryTable";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      subCategories: {
        include: {
          _count: { select: { mezmurs: true } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { orderIndex: "asc" },
  });

  const formatted = categories.map((cat) => ({
    ...cat,
    totalMezmurs: cat.subCategories.reduce(
      (sum, sub) => sum + sub._count.mezmurs,
      0,
    ),
  }));

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Category Management</h1>
        <p className="admin-page-subtitle">
          {categories.length} categories •{" "}
          {formatted.reduce((s, c) => s + c.totalMezmurs, 0).toLocaleString()}{" "}
          total mezmurs
        </p>
      </div>

      <CategoryTable categories={formatted} />
    </div>
  );
}
