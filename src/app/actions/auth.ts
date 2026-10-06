"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LoginSchema, zodErrors, type FormState } from "@/lib/schemas";
import { createSession, deleteSession } from "@/lib/session";

// Хэш для несуществующего пользователя: время ответа не выдаёт, есть ли такой email.
const DUMMY_HASH = bcrypt.hashSync("нет-такого-пользователя", 10);

export async function login(formData: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { errors: zodErrors(parsed.error) };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.active) return { error: "Неверный email или пароль" };

  await createSession(user.id);
  redirect("/contracts");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
