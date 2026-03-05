"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: Verify admin session and return user + role
// ═══════════════════════════════════════════════════════════════════════════════
async function requireAdmin(minRole: "EDITOR" | "SUPER_ADMIN" = "EDITOR") {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    throw new Error("NOT_AUTHENTICATED");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, name: true },
  });

  if (!dbUser) throw new Error("USER_NOT_FOUND");

  const allowedRoles =
    minRole === "SUPER_ADMIN" ? ["SUPER_ADMIN"] : ["EDITOR", "SUPER_ADMIN"];

  if (!allowedRoles.includes(dbUser.role)) {
    throw new Error("INSUFFICIENT_PERMISSIONS");
  }

  return dbUser;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: Create audit log entry
// ═══════════════════════════════════════════════════════════════════════════════
async function logAudit(
  userId: string,
  action: string,
  targetId?: string,
  details?: string,
) {
  await prisma.auditLog.create({
    data: { userId, action, targetId, details },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Update Mezmur (EDITOR + SUPER_ADMIN)
//    - Edit title, lyrics, youtubeUrl, subCategoryId
// ═══════════════════════════════════════════════════════════════════════════════
export async function updateMezmur(
  mezmurId: string,
  data: {
    title?: string;
    lyrics?: string[];
    youtubeUrl?: string | null;
    subCategoryId?: string;
  },
) {
  const user = await requireAdmin("EDITOR");

  const updated = await prisma.mezmur.update({
    where: { id: mezmurId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.lyrics !== undefined && { lyrics: data.lyrics }),
      ...(data.youtubeUrl !== undefined && {
        youtubeUrl: data.youtubeUrl || null,
      }),
      ...(data.subCategoryId !== undefined && {
        subCategoryId: data.subCategoryId,
      }),
    },
  });

  const changes = Object.keys(data).filter(
    (k) => data[k as keyof typeof data] !== undefined,
  );

  await logAudit(
    user.id,
    "UPDATE_MEZMUR",
    mezmurId,
    `Updated fields: ${changes.join(", ")}`,
  );

  revalidatePath("/admin/mezmurs");
  revalidatePath(`/mezmurs/${mezmurId}`);

  return { success: true, mezmur: updated };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Delete Mezmur (SUPER_ADMIN only)
// ═══════════════════════════════════════════════════════════════════════════════
export async function deleteMezmur(mezmurId: string) {
  const user = await requireAdmin("SUPER_ADMIN");

  const mezmur = await prisma.mezmur.findUnique({
    where: { id: mezmurId },
    select: { title: true },
  });

  await prisma.mezmur.delete({ where: { id: mezmurId } });

  await logAudit(
    user.id,
    "DELETE_MEZMUR",
    mezmurId,
    `Deleted: ${mezmur?.title}`,
  );

  revalidatePath("/admin/mezmurs");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Bulk Add YouTube URLs (EDITOR + SUPER_ADMIN)
//    Accepts an array of { mezmurId, youtubeUrl } pairs
// ═══════════════════════════════════════════════════════════════════════════════
export async function bulkAddYoutubeUrls(
  entries: { mezmurId: string; youtubeUrl: string }[],
) {
  const user = await requireAdmin("EDITOR");

  const results = await Promise.allSettled(
    entries.map((entry) =>
      prisma.mezmur.update({
        where: { id: entry.mezmurId },
        data: { youtubeUrl: entry.youtubeUrl },
      }),
    ),
  );

  const successCount = results.filter((r) => r.status === "fulfilled").length;

  await logAudit(
    user.id,
    "BULK_ADD_URLS",
    undefined,
    `Added ${successCount}/${entries.length} YouTube URLs`,
  );

  revalidatePath("/admin/mezmurs");
  return { success: true, count: successCount };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Update Category (SUPER_ADMIN only)
// ═══════════════════════════════════════════════════════════════════════════════
export async function updateCategory(
  categoryId: string,
  data: { name?: string; nameTransliterated?: string },
) {
  const user = await requireAdmin("SUPER_ADMIN");

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data,
  });

  await logAudit(
    user.id,
    "UPDATE_CATEGORY",
    categoryId,
    `Updated: ${updated.name}`,
  );
  revalidatePath("/admin/categories");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Delete Category (SUPER_ADMIN only)
// ═══════════════════════════════════════════════════════════════════════════════
export async function deleteCategory(categoryId: string) {
  const user = await requireAdmin("SUPER_ADMIN");

  const cat = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { name: true },
  });

  await prisma.category.delete({ where: { id: categoryId } });

  await logAudit(
    user.id,
    "DELETE_CATEGORY",
    categoryId,
    `Deleted: ${cat?.name}`,
  );
  revalidatePath("/admin/categories");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Update User Role (SUPER_ADMIN only)
// ═══════════════════════════════════════════════════════════════════════════════
export async function updateUserRole(
  targetUserId: string,
  newRole: "USER" | "EDITOR" | "SUPER_ADMIN",
) {
  const user = await requireAdmin("SUPER_ADMIN");

  // Prevent self-demotion
  if (user.id === targetUserId) {
    throw new Error("Cannot change your own role");
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });

  await logAudit(
    user.id,
    "UPDATE_USER_ROLE",
    targetUserId,
    `Changed ${updated.email} to ${newRole}`,
  );

  revalidatePath("/admin/users");
  return { success: true };
}
