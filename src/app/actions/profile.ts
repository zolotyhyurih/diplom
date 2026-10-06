"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ProfileSchema, zodErrors, type FormState } from "@/lib/schemas";
import { deleteSession } from "@/lib/session";
import { LAST_ADMIN, hasOtherActiveAdmin, userHistoryError } from "@/lib/users";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "");

// Изменение собственного профиля. Роль и признак активности здесь не меняются.
export async function updateProfile(formData: FormData): Promise<FormState> {
  const me = await requireUser();

  const parsed = ProfileSchema.safeParse({
    name: str(formData, "name"),
    email: str(formData, "email"),
    currentPassword: str(formData, "currentPassword"),
    newPassword: str(formData, "newPassword"),
  });
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  const d = parsed.data;
  const email = d.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) return { error: "Пользователь не найден" };

  // Почта – это логин, а пароль защищает вход, поэтому их смена требует ввода текущего пароля.
  if (email !== user.email || d.newPassword) {
    if (!d.currentPassword) return { errors: { currentPassword: "Введите текущий пароль для смены почты или пароля" } };
    if (!(await bcrypt.compare(d.currentPassword, user.passwordHash))) {
      return { errors: { currentPassword: "Неверный текущий пароль" } };
    }
  }
  if (await prisma.user.findFirst({ where: { email, id: { not: me.id } } })) {
    return { errors: { email: "Пользователь с таким email уже есть" } };
  }

  await prisma.user.update({
    where: { id: me.id },
    data: {
      name: d.name,
      email,
      ...(d.newPassword ? { passwordHash: await bcrypt.hash(d.newPassword, 10) } : {}),
    },
  });
  revalidatePath("/", "layout");
  return undefined;
}

// Удаление собственного профиля: только с подтверждением паролем и только если с пользователем не связаны записи.
export async function deleteProfile(formData: FormData): Promise<FormState> {
  const me = await requireUser();
  const password = str(formData, "deletePassword");

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) return { error: "Пользователь не найден" };
  if (!password) return { errors: { deletePassword: "Введите пароль для подтверждения" } };
  if (!(await bcrypt.compare(password, user.passwordHash))) return { errors: { deletePassword: "Неверный пароль" } };

  if (user.role === "ADMIN" && user.active && !(await hasOtherActiveAdmin(me.id))) return { error: LAST_ADMIN };
  const historyError = await userHistoryError(me.id, "self");
  if (historyError) return { error: historyError };

  await prisma.user.delete({ where: { id: me.id } });
  await deleteSession();
  redirect("/login");
}
