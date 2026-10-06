"use server";

import { redirect } from "next/navigation";
import { logAction } from "@/lib/audit";
import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { enqueueOcr } from "@/lib/queue";
import { can } from "@/lib/roles";
import { ContractEditSchema, ContractSchema, checkFile, zodErrors, type FormState } from "@/lib/schemas";
import { removeFile, saveFile } from "@/lib/storage";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "");
const toDate = (v: string) => (v ? new Date(`${v}T00:00:00Z`) : null);

export async function createContract(formData: FormData): Promise<FormState> {
  const user = await requirePermission(can.upload);

  const parsed = ContractSchema.safeParse({
    number: str(formData, "number"),
    title: str(formData, "title"),
    counterparty: str(formData, "counterparty"),
    categoryId: str(formData, "categoryId"),
    amount: str(formData, "amount"),
    signedAt: str(formData, "signedAt"),
    startsAt: str(formData, "startsAt"),
    expiresAt: str(formData, "expiresAt"),
    tags: formData.getAll("tags").map(String),
    description: str(formData, "description"),
  });
  const fileError = checkFile(formData.get("file"));
  if (!parsed.success || fileError) {
    return { errors: { ...(parsed.success ? {} : zodErrors(parsed.error)), ...(fileError ? { file: fileError } : {}) } };
  }
  const d = parsed.data;
  const file = formData.get("file") as File;

  if (!(await prisma.category.findUnique({ where: { id: d.categoryId } }))) {
    return { errors: { categoryId: "Такой категории нет — выберите из списка" } };
  }
  const duplicate = await prisma.contract.findFirst({
    where: { number: d.number, counterparty: { name: d.counterparty } },
  });
  if (duplicate) return { errors: { number: "Договор с таким номером у этого контрагента уже есть в архиве" } };

  const counterparty = await prisma.counterparty.upsert({
    where: { name: d.counterparty },
    update: {},
    create: { name: d.counterparty },
  });

  const contract = await prisma.contract.create({
    data: {
      number: d.number,
      title: d.title,
      description: d.description || null,
      amount: d.amount ? Number(d.amount.replace(",", ".")) : null,
      signedAt: toDate(d.signedAt),
      startsAt: toDate(d.startsAt),
      expiresAt: toDate(d.expiresAt),
      counterpartyId: counterparty.id,
      categoryId: d.categoryId,
      createdById: user.id,
      tags: {
        connectOrCreate: [...new Set(d.tags)].map((name) => ({ where: { name }, create: { name } })),
      },
    },
  });

  const saved = await saveFile(contract.id, file);
  const version = await prisma.contractVersion.create({
    data: {
      contractId: contract.id,
      versionNumber: 1,
      fileName: file.name,
      mimeType: file.type,
      fileSize: saved.size,
      storagePath: saved.storagePath,
      sha256: saved.sha256,
      uploadedById: user.id,
    },
  });
  await enqueueOcr(version.id);
  logAction(contract.id, user.id, "UPLOAD", `версия ${version.versionNumber} · ${file.name}`);

  redirect(`/contracts/${contract.id}`);
}

const ISO = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
const money = (v: { toString(): string } | null) => (v == null ? "" : Number(v.toString()).toFixed(2));

// Редактирование реквизитов договора. Файлы и версии здесь не затрагиваются: их меняет только addVersion.
export async function updateContract(contractId: string, formData: FormData): Promise<FormState> {
  const user = await requirePermission(can.edit);

  const parsed = ContractEditSchema.safeParse({
    number: str(formData, "number"),
    title: str(formData, "title"),
    counterparty: str(formData, "counterparty"),
    categoryId: str(formData, "categoryId"),
    status: str(formData, "status"),
    amount: str(formData, "amount"),
    signedAt: str(formData, "signedAt"),
    startsAt: str(formData, "startsAt"),
    expiresAt: str(formData, "expiresAt"),
    tags: formData.getAll("tags").map(String),
    description: str(formData, "description"),
  });
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  const d = parsed.data;

  const old = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { counterparty: true, category: true, tags: true },
  });
  if (!old) return { error: "Договор не найден" };

  const category = await prisma.category.findUnique({ where: { id: d.categoryId } });
  if (!category) return { errors: { categoryId: "Такой категории нет — выберите из списка" } };

  const duplicate = await prisma.contract.findFirst({
    where: { id: { not: contractId }, number: d.number, counterparty: { name: d.counterparty } },
  });
  if (duplicate) return { errors: { number: "Договор с таким номером у этого контрагента уже есть в архиве" } };

  const counterparty = await prisma.counterparty.upsert({
    where: { name: d.counterparty },
    update: {},
    create: { name: d.counterparty },
  });
  const tags = [...new Set(d.tags)];

  await prisma.contract.update({
    where: { id: contractId },
    data: {
      number: d.number,
      title: d.title,
      description: d.description || null,
      status: d.status,
      amount: d.amount ? Number(d.amount.replace(",", ".")) : null,
      signedAt: toDate(d.signedAt),
      startsAt: toDate(d.startsAt),
      expiresAt: toDate(d.expiresAt),
      counterpartyId: counterparty.id,
      categoryId: d.categoryId,
      tags: { set: [], connectOrCreate: tags.map((name) => ({ where: { name }, create: { name } })) },
    },
  });

  // В журнал попадает перечень изменившихся полей, а не их значения.
  const changed = [
    old.number !== d.number && "номер",
    old.title !== d.title && "название",
    old.counterparty.name !== d.counterparty && "контрагент",
    old.categoryId !== d.categoryId && "категория",
    old.status !== d.status && "статус",
    money(old.amount) !== (d.amount ? Number(d.amount.replace(",", ".")).toFixed(2) : "") && "сумма",
    ISO(old.signedAt) !== d.signedAt && "дата подписания",
    ISO(old.startsAt) !== d.startsAt && "начало действия",
    ISO(old.expiresAt) !== d.expiresAt && "окончание действия",
    [...old.tags.map((t) => t.name)].sort().join("\n") !== [...tags].sort().join("\n") && "теги",
    (old.description ?? "") !== d.description && "описание",
  ].filter(Boolean);
  await logAction(contractId, user.id, "UPDATE", changed.length ? `изменено: ${changed.join(", ")}` : "без изменений");

  redirect(`/contracts/${contractId}`);
}

export async function addVersion(contractId: string, formData: FormData): Promise<FormState> {
  const user = await requirePermission(can.upload);

  const fileError = checkFile(formData.get("file"));
  if (fileError) return { errors: { file: fileError } };
  const file = formData.get("file") as File;

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { versions: { select: { versionNumber: true, sha256: true } } },
  });
  if (!contract) return { error: "Договор не найден" };

  const saved = await saveFile(contract.id, file);
  if (contract.versions.some((v) => v.sha256 === saved.sha256)) {
    await removeFile(saved.storagePath);
    return { errors: { file: "Такой файл уже загружен в одну из версий" } };
  }

  const next = Math.max(0, ...contract.versions.map((v) => v.versionNumber)) + 1;
  const version = await prisma.contractVersion.create({
    data: {
      contractId,
      versionNumber: next,
      fileName: file.name,
      mimeType: file.type,
      fileSize: saved.size,
      storagePath: saved.storagePath,
      sha256: saved.sha256,
      uploadedById: user.id,
    },
  });
  await enqueueOcr(version.id);
  logAction(contractId, user.id, "UPLOAD", `версия ${version.versionNumber} · ${file.name}`);

  redirect(`/contracts/${contractId}`);
}

export async function retryOcr(versionId: string) {
  await requirePermission(can.upload);
  const version = await prisma.contractVersion.update({
    where: { id: versionId },
    data: { ocrStatus: "PENDING", ocrError: null },
  });
  await enqueueOcr(version.id);
  redirect(`/contracts/${version.contractId}`);
}

export async function deleteContract(contractId: string) {
  await requirePermission(can.delete);
  const versions = await prisma.contractVersion.findMany({
    where: { contractId },
    select: { storagePath: true },
  });
  await prisma.contract.delete({ where: { id: contractId } });
  await Promise.all(versions.map((v) => removeFile(v.storagePath)));
  redirect("/contracts");
}
