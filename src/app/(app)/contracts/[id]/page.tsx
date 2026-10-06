import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteContract, retryOcr, addVersion } from "@/app/actions/contracts";
import { BackLink } from "@/components/back-link";
import { AutoRefresh } from "@/components/auto-refresh";
import { DeleteContractButton } from "@/components/delete-contract-button";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AUDIT_ACTION_LABELS, logAction } from "@/lib/audit";
import { requireUser } from "@/lib/dal";
import { fmtDate, fmtDateTime, fmtMoney, fmtSize } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { OCR_LABELS, STATUS_LABELS, can } from "@/lib/roles";
import { VersionForm } from "./version-form";

const AUDIT_LOG_LIMIT = 20;

const PREVIEW_CHARS = 4000;

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{children}</dd>
    </div>
  );
}

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      counterparty: true,
      category: true,
      createdBy: { select: { name: true } },
      tags: { orderBy: { name: "asc" } },
      versions: {
        orderBy: { versionNumber: "desc" },
        include: { uploadedBy: { select: { name: true } } },
      },
    },
  });
  if (!contract) notFound();
  await logAction(contract.id, user.id, "VIEW");

  const auditLogs = await prisma.auditLog.findMany({
    where: { contractId: contract.id },
    orderBy: { createdAt: "desc" },
    take: AUDIT_LOG_LIMIT,
    include: { user: { select: { name: true } } },
  });

  const busy = contract.versions.some((v) => v.ocrStatus === "PENDING" || v.ocrStatus === "PROCESSING");
  const latestText = contract.versions.find((v) => v.extractedText)?.extractedText ?? null;

  return (
    <div className="flex flex-col gap-6">
      {busy && <AutoRefresh />}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <BackLink />
          <h1 className="mt-3 break-words text-2xl font-semibold">{contract.title}</h1>
          <p className="text-sm text-muted-foreground">Договор № {contract.number}</p>
        </div>
        <div className="flex items-center gap-2">
          {can.edit(user.role) && (
            <Link href={`/contracts/${contract.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Редактировать
            </Link>
          )}
          <Badge variant={contract.status === "ACTIVE" ? "default" : "secondary"}>{STATUS_LABELS[contract.status]}</Badge>
        </div>
      </div>

      <Card>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Meta label="Контрагент">{contract.counterparty.name}</Meta>
            <Meta label="Категория">{contract.category?.name ?? "—"}</Meta>
            <Meta label="Сумма">{fmtMoney(contract.amount)}</Meta>
            <Meta label="Дата подписания">{fmtDate(contract.signedAt)}</Meta>
            <Meta label="Начало действия">{fmtDate(contract.startsAt)}</Meta>
            <Meta label="Действует до">{fmtDate(contract.expiresAt)}</Meta>
            <Meta label="Загрузил">{contract.createdBy.name}</Meta>
            <Meta label="Добавлен">{fmtDateTime(contract.createdAt)}</Meta>
            <Meta label="Теги">
              {contract.tags.length ? contract.tags.map((t) => t.name).join(", ") : "—"}
            </Meta>
          </dl>
          {contract.description && <p className="mt-4 text-sm">{contract.description}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Версии файла</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {contract.versions.map((v) => (
            <div key={v.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="w-10 text-sm font-medium">v{v.versionNumber}</span>
              <div className="min-w-0 flex-1 basis-48">
                <p className="truncate text-sm">{v.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtSize(v.fileSize)} · {v.uploadedBy.name} · {fmtDateTime(v.createdAt)}
                  {v.pageCount ? ` · стр.: ${v.pageCount}` : ""}
                  {v.ocrMethod ? ` · ${v.ocrMethod === "ocr" ? "распознано OCR" : "текстовый слой PDF"}` : ""}
                </p>
                {v.ocrError && <p className="text-xs text-destructive">{v.ocrError}</p>}
              </div>
              <Badge
                variant={v.ocrStatus === "FAILED" ? "destructive" : v.ocrStatus === "DONE" ? "outline" : "secondary"}
              >
                {OCR_LABELS[v.ocrStatus]}
              </Badge>
              <a
                href={`/api/files/${v.id}`}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Открыть
              </a>
              <a
                href={`/api/files/${v.id}?download=1`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Скачать
              </a>
              {v.ocrStatus === "FAILED" && can.upload(user.role) && (
                <form action={retryOcr.bind(null, v.id)}>
                  <Button type="submit" variant="ghost" size="sm">
                    Повторить
                  </Button>
                </form>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Журнал действий</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Записей ещё нет.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {auditLogs.map((log) => (
                <li key={log.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2 text-sm first:pt-0 last:pb-0">
                  <span className="font-medium">{AUDIT_ACTION_LABELS[log.action]}</span>
                  <span className="text-muted-foreground">— {log.user.name}</span>
                  {log.detail && <span className="text-muted-foreground">({log.detail})</span>}
                  <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(log.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {can.upload(user.role) && (
        <Card>
          <CardHeader>
            <CardTitle>Загрузить новую версию</CardTitle>
          </CardHeader>
          <CardContent>
            <VersionForm action={addVersion.bind(null, contract.id)} />
          </CardContent>
        </Card>
      )}

      {latestText && (
        <Card>
          <CardHeader>
            <CardTitle>Распознанный текст</CardTitle>
          </CardHeader>
          <CardContent>
            <details>
              <summary className="cursor-pointer text-sm text-muted-foreground">Показать начало текста</summary>
              <pre className="mt-3 max-h-96 font-sans overflow-auto whitespace-pre-wrap text-sm">
                {latestText.slice(0, PREVIEW_CHARS)}
                {latestText.length > PREVIEW_CHARS ? "\n…" : ""}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      {can.delete(user.role) && (
        <DeleteContractButton action={deleteContract.bind(null, contract.id)} title={contract.title} label="Удалить договор вместе с файлами" />
      )}
    </div>
  );
}
