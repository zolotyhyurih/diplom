"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { LAST_ADMIN, hasOtherActiveAdmin, userHistoryError } from "@/lib/users";
import { can } from "@/lib/roles";
import { UserEditSchema, UserSchema, zodErrors, type FormState } from "@/lib/schemas";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "");

export async function createUser(formData: FormData): Promise<FormState> {
  await requirePermission(can.manageUsers);

  const parsed = UserSchema.safeParse({
    name: str(formData, "name"),
    email: str(formData, "email"),
    password: str(formData, "password"),
    role: str(formData, "role"),
  });
  if (!parsed.success) return { errors: zodErrors(parsed.error) };

  const { password, ...rest } = parsed.data;
  const email = rest.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    return { errors: { email: "Пользователь с таким email уже есть" } };
  }

  await prisma.user.create({ data: { ...rest, email, passwordHash: await bcrypt.hash(password, 10) } });
  revalidatePath("/admin/users");
  return undefined;
}

export async function updateUser(userId: string, formData: FormData): Promise<FormState> {
  const me = await requirePermission(can.manageUsers);

  const parsed = UserEditSchema.safeParse({
    name: str(formData, "name"),
    email: str(formData, "email"),
    role: str(formData, "role"),
    active: str(formData, "active"),
    password: str(formData, "password"),
  });
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  const d = parsed.data;
  const active = d.active === "true";
  const email = d.email.toLowerCase();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "Пользователь не найден" };

  const demoted = d.role !== "ADMIN" || !active;
  if (userId === me.id && demoted) return { error: "Нельзя понизить или отключить собственную учётную запись" };
  if (target.role === "ADMIN" && target.active && demoted && !(await hasOtherActiveAdmin(userId))) {
    return { error: LAST_ADMIN };
  }
  const taken = await prisma.user.findFirst({ where: { email, id: { not: userId } } });
  if (taken) return { errors: { email: "Пользователь с таким email уже есть" } };

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: d.name,
      email,
      role: d.role,
      active,
      ...(d.password ? { passwordHash: await bcrypt.hash(d.password, 10) } : {}),
    },
  });
  redirect("/admin/users");
}

// Пользователя с историей (договоры, версии, журнал) удалять нельзя: записи должны остаться – его можно отключить.
export async function deleteUser(userId: string): Promise<FormState> {
  const me = await requirePermission(can.manageUsers);
  if (userId === me.id) return { error: "Нельзя удалить собственную учётную запись" };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "Пользователь не найден" };
  if (target.role === "ADMIN" && target.active && !(await hasOtherActiveAdmin(userId))) return { error: LAST_ADMIN };

  const historyError = await userHistoryError(userId, "user");
  if (historyError) return { error: historyError };

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
  return undefined;
}
