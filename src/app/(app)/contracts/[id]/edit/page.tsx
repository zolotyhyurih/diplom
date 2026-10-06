import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/roles";
import { sanitizeAmount } from "@/lib/schemas";
import { ContractForm } from "../../new/contract-form";

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(can.edit);
  const { id } = await params;

  const [contract, categories, counterparties] = await Promise.all([
    prisma.contract.findUnique({ where: { id }, include: { counterparty: true, tags: { orderBy: { name: "asc" } } } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.counterparty.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);
  if (!contract) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <BackLink />
        <h1 className="mt-3 text-2xl font-semibold">Редактирование договора</h1>
        <p className="text-sm text-muted-foreground">
          Меняются только реквизиты. Файлы и версии остаются без изменений: новую версию загружают в карточке договора.
        </p>
      </div>
      <ContractForm
        categories={categories}
        counterparties={counterparties.map((c) => c.name)}
        edit={{
          contractId: contract.id,
          initial: {
            number: contract.number,
            title: contract.title,
            counterparty: contract.counterparty.name,
            categoryId: contract.categoryId ?? "",
            status: contract.status,
            amount: contract.amount ? sanitizeAmount(contract.amount.toString()) : "",
            signedAt: iso(contract.signedAt),
            startsAt: iso(contract.startsAt),
            expiresAt: iso(contract.expiresAt),
            tags: contract.tags.map((t) => t.name),
            description: contract.description ?? "",
          },
        }}
      />
    </div>
  );
}
