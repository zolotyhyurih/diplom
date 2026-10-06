import "server-only";
import { prisma } from "@/lib/prisma";

export const AUDIT_ACTION_LABELS = {
  UPLOAD: "Загрузка версии",
  VIEW: "Просмотр карточки",
  DOWNLOAD: "Скачивание файла",
  UPDATE: "Изменение реквизитов",
} as const;

type AuditAction = keyof typeof AUDIT_ACTION_LABELS;

// Страница договора сама себя перезагружает, пока идёт OCR (см. AutoRefresh), поэтому
// одно и то же открытие карточки иначе писалось бы в журнал каждые несколько секунд.
const VIEW_DEDUPE_MS = 60_000;

// Ошибка записи лога не должна ронять действие пользователя, поэтому промис сам гасит исключение;
// вызывающий код может при желании дождаться завершения (например, чтобы запись попала в тут же читаемый список).
export async function logAction(contractId: string, userId: string, action: AuditAction, detail?: string) {
  try {
    if (action === "VIEW") {
      const recent = await prisma.auditLog.findFirst({
        where: { contractId, userId, action, createdAt: { gte: new Date(Date.now() - VIEW_DEDUPE_MS) } },
        orderBy: { createdAt: "desc" },
      });
      if (recent) return recent;
    }
    return await prisma.auditLog.create({ data: { contractId, userId, action, detail } });
  } catch (err) {
    console.error("audit log write failed", err);
    return null;
  }
}
