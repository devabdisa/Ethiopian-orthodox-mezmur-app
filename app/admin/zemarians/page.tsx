import prisma from "@/lib/db/prisma";
import { ZemariTable } from "./ZemariTable";

export default async function AdminZemariansPage() {
  const zemarians = await prisma.zemari.findMany({
    include: {
      _count: { select: { mezmurs: true } },
    },
    orderBy: { name: "asc" },
  });

  const formatted = zemarians.map((zemari) => ({
    ...zemari,
    totalMezmurs: zemari._count.mezmurs,
  }));

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Zemarians Management</h1>
        <p className="admin-page-subtitle">
          {zemarians.length} Zemarians •{" "}
          {formatted.reduce((s, z) => s + z.totalMezmurs, 0).toLocaleString()}{" "}
          total mezmurs
        </p>
      </div>

      <ZemariTable zemarians={formatted} />
    </div>
  );
}
