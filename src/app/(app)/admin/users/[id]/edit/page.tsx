import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/roles";
import { UserEditForm } from "./user-edit-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission(can.manageUsers);
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <BackLink href="/admin/users">Все пользователи</BackLink>
        <h1 className="mt-3 text-2xl font-semibold">Редактирование пользователя</h1>
      </div>
      <UserEditForm
        userId={user.id}
        isSelf={user.id === me.id}
        initial={{ name: user.name, email: user.email, role: user.role, active: user.active ? "true" : "false" }}
      />
    </div>
  );
}
