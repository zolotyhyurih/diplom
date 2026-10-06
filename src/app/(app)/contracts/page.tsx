import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { deleteContract } from "@/app/actions/contracts";
import { DeleteContractButton } from "@/components/delete-contract-button";
import { NativeSelect } from "@/components/native-select";
import { Snippet } from "@/components/snippet";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/dal";
import { fmtDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, can, type RoleName } from "@/lib/roles";
import { findContracts } from "@/lib/search";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const pick = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

function RowActions({ id, title, role }: { id: string; title: string; role: RoleName }) {
  if (!can.edit(role) && !can.delete(role)) return null;
  return (
    <div className="flex items-center justify-end gap-1">
      {can.edit(role) && (
        <Link
          href={`/contracts/${id}/edit`}
          title="Редактировать"
          aria-label={`Редактировать договор ${title}`}
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          <PencilIcon />
        </Link>
      )}
      {can.delete(role) && <DeleteContractButton action={deleteContract.bind(null, id)} title={title} />}
    </div>
  );
}

export default async function ContractsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const sp = await searchParams;
  const filters = { q: pick(sp.q), status: pick(sp.status), categoryId: pick(sp.categoryId) };

  const [rows, categories] = await Promise.all([
    findContracts(filters),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  const showActions = can.edit(user.role) || can.delete(user.role);
  const filtered = Boolean(filters.q || filters.status || filters.categoryId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Договоры</h1>
        {can.upload(user.role) && (
          <Link href="/contracts/new" className={buttonVariants()}>
            Загрузить договор
          </Link>
        )}
      </div>

      <form method="get" action="/contracts" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_180px_200px_auto]">
        <Input
          name="q"
          maxLength={200}
          defaultValue={filters.q}
          placeholder="Поиск по названию, контрагенту и тексту договора…"
          aria-label="Поиск"
          className="sm:col-span-2 lg:col-span-1"
        />
        <NativeSelect name="status" defaultValue={filters.status ?? ""} aria-label="Статус">
          <option value="">Все статусы</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="categoryId" defaultValue={filters.categoryId ?? ""} aria-label="Категория">
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <Button type="submit" className="flex-1 lg:flex-none">
            Найти
          </Button>
          {filtered && (
            <Link href="/contracts" className={buttonVariants({ variant: "ghost" })}>
              Сбросить
            </Link>
          )}
        </div>
      </form>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {filtered ? "Ничего не найдено. Попробуйте изменить запрос." : "В архиве пока нет договоров."}
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((c) => (
              <li key={c.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/contracts/${c.id}`} className="min-w-0 break-words font-medium hover:underline">
                    {c.title}
                  </Link>
                  <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"} className="shrink-0">
                    {STATUS_LABELS[c.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  <Link href={`/contracts/${c.id}`} className="hover:underline">
                    № {c.number}
                  </Link>{" "}
                  · {c.counterparty}
                </p>
                <p className="text-sm text-muted-foreground">
                  {c.category ?? "Без категории"} · до {fmtDate(c.expiresAt)}
                </p>
                {c.snippet && <div className="mt-2"><Snippet text={c.snippet} /></div>}
                <div className="mt-2">
                  <RowActions id={c.id} title={c.title} role={user.role} />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер</TableHead>
                  <TableHead>Договор</TableHead>
                  <TableHead>Контрагент</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действует до</TableHead>
                  {showActions && <TableHead className="w-24 text-right">Действия</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap">
                      <Link href={`/contracts/${c.id}`} className="hover:underline">
                        {c.number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-md whitespace-normal">
                      <Link href={`/contracts/${c.id}`} className="font-medium hover:underline">
                        {c.title}
                      </Link>
                      {c.snippet && <Snippet text={c.snippet} />}
                    </TableCell>
                    <TableCell>{c.counterparty}</TableCell>
                    <TableCell>{c.category ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>{STATUS_LABELS[c.status]}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{fmtDate(c.expiresAt)}</TableCell>
                    {showActions && (
                      <TableCell>
                        <RowActions id={c.id} title={c.title} role={user.role} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
