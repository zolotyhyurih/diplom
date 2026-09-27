"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/roles";
import { UserSchema, zodErrors, type FormState } from "@/lib/schemas";

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
