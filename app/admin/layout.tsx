import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import Link from "next/link";
import "./admin.css";

export const metadata = {
  title: "Admin Dashboard — ቅዱሳን Mezmur",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  // 1. Verify Authentication
  if (!session?.user?.id) {
    redirect("/auth");
  }

  // 2. Fetch role directly from DB (Better Auth session doesn't include custom fields)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const role = dbUser?.role;
  if (role !== "EDITOR" && role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return (
    <div className="admin-layout">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link href="/admin" style={{ textDecoration: "none" }}>
            <h2>🛡️ Admin Panel</h2>
          </Link>
          <span className={`role-badge role-${role.toLowerCase()}`}>
            {role.replace("_", " ")}
          </span>
        </div>

        <nav className="admin-nav">
          <Link href="/admin" className="admin-nav-link">
            Overview
          </Link>
          <Link href="/admin/mezmurs" className="admin-nav-link">
            Mezmurs
          </Link>
          <Link href="/admin/categories" className="admin-nav-link">
            Categories
          </Link>
          <Link href="/admin/zemarians" className="admin-nav-link">
            Zemarians
          </Link>
          <Link href="/admin/lyrics" className="admin-nav-link">
            ✍️ Lyrics
          </Link>
          {role === "SUPER_ADMIN" && (
            <Link href="/admin/users" className="admin-nav-link">
              Users
            </Link>
          )}
        </nav>

        <div className="admin-sidebar-bottom">
          <Link href="/" className="admin-back-link">
            ← Back to App
          </Link>
        </div>
      </aside>

      {/* Admin Main Content */}
      <main className="admin-main">
        <div className="admin-content-wrapper">{children}</div>
      </main>
    </div>
  );
}
