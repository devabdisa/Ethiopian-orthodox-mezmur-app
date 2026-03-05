import prisma from "@/lib/db/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { UserTable } from "./UserTable";

export default async function AdminUsersPage() {
  // Double-check: SUPER_ADMIN only
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) redirect("/auth");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "SUPER_ADMIN") redirect("/admin");

  // Fetch all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
      _count: {
        select: {
          favorites: true,
          listenHistory: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">User Management</h1>
        <p className="admin-page-subtitle">
          {users.length} registered user{users.length !== 1 ? "s" : ""}
        </p>
      </div>

      <UserTable users={users} currentUserId={session.user.id} />
    </div>
  );
}
