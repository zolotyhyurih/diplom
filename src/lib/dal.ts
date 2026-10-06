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
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  // Отключённого пользователя выкидываем сразу, не дожидаясь окончания срока токена.
  if (!user?.active) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

export async function requireUser() {
  const user = await getCurrentUser();
  // expired: в cookie ещё лежит токен, но пользователь отключён или удалён – proxy.ts по этому признаку сбросит cookie, иначе будет цикл перенаправлений.
  if (!user) redirect("/login?expired=1");
  return user;
}

export async function requirePermission(check: (role: RoleName) => boolean) {
  const user = await requireUser();
  if (!check(user.role)) redirect("/contracts");
  return user;
}
