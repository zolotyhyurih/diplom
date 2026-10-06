import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { deleteUser } from "@/app/actions/users";
import { DeleteUserButton } from "@/components/delete-user-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePermission } from "@/lib/dal";
import { fmtDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS, can } from "@/lib/roles";
import { UserForm } from "./user-form";

function UserActions({ id, name, isSelf }: { id: string; name: string; isSelf: boolean }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/admin/users/${id}/edit`} title="Редактировать" aria-label={`Редактировать пользователя ${name}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
        <PencilIcon />
      </Link>
      {!isSelf && <DeleteUserButton action={deleteUser.bind(null, id)} name={name} />}
    </div>
  );
}

export default async function UsersPage() {
  const me = await requirePermission(can.manageUsers);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Пользователи</h1>

      <ul className="flex flex-col gap-3 md:hidden">
        {users.map((u) => (
          <li key={u.id} className="rounded-xl border p-4">
            <p className="font-medium">{u.name}</p>
            <p className="break-all text-sm text-muted-foreground">{u.email}</p>
            <p className="mt-1 text-sm">
              {ROLE_LABELS[u.role]}
              {!u.active && <Badge variant="secondary" className="ml-2">Отключён</Badge>}
            </p>
            <div className="mt-2">
              <UserActions id={u.id} name={u.name} isSelf={u.id === me.id} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Создан</TableHead>
              <TableHead className="w-24 text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{ROLE_LABELS[u.role]}</TableCell>
                <TableCell>
                  <Badge variant={u.active ? "default" : "secondary"}>{u.active ? "Активен" : "Отключён"}</Badge>
                </TableCell>
                <TableCell>{fmtDateTime(u.createdAt)}</TableCell>
                <TableCell>
                  <UserActions id={u.id} name={u.name} isSelf={u.id === me.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <section className="max-w-md">
        <h2 className="mb-3 text-lg font-medium">Добавить пользователя</h2>
        <UserForm />
      </section>
    </div>
  );
}
