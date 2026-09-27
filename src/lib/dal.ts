import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, decrypt } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import type { RoleName } from "@/lib/roles";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: RoleName;
};

// Безопасная проверка: токен из cookie + актуальный пользователь в БД (роль могли изменить).
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const session = await decrypt(store.get(SESSION_COOKIE)?.value);
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true },
  });
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(check: (role: RoleName) => boolean) {
  const user = await requireUser();
  if (!check(user.role)) redirect("/contracts");
  return user;
}
