import { BackLink } from "@/components/back-link";
import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/roles";
import { ContractForm } from "./contract-form";

export default async function NewContractPage() {
  await requirePermission(can.upload);
  const [categories, counterparties] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.counterparty.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <BackLink />
        <h1 className="mt-3 text-2xl font-semibold">Загрузка договора</h1>
      </div>
      <ContractForm categories={categories} counterparties={counterparties.map((c) => c.name)} />
    </div>
  );
}
