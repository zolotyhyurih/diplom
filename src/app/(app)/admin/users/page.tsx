import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePermission } from "@/lib/dal";
import { fmtDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS, can } from "@/lib/roles";
import { UserForm } from "./user-form";

export default async function UsersPage() {
  await requirePermission(can.manageUsers);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Пользователи</h1>

      <ul className="flex flex-col gap-3 md:hidden">
        {users.map((u) => (
          <li key={u.id} className="rounded-xl border p-4">
            <p className="font-medium">{u.name}</p>
            <p className="break-all text-sm text-muted-foreground">{u.email}</p>
            <p className="mt-1 text-sm">{ROLE_LABELS[u.role]}</p>
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
              <TableHead>Создан</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{ROLE_LABELS[u.role]}</TableCell>
                <TableCell>{fmtDateTime(u.createdAt)}</TableCell>
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
