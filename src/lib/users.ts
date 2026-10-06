import "server-only";
import { prisma } from "@/lib/prisma";

export const LAST_ADMIN = "В системе должен остаться хотя бы один активный администратор";

// Есть ли кроме этого пользователя другой активный администратор.
export async function hasOtherActiveAdmin(exceptId: string) {
  return (await prisma.user.count({ where: { role: "ADMIN", active: true, id: { not: exceptId } } })) > 0;
}

// Записи, которые ссылаются на пользователя: из-за них его нельзя удалить (журнал и договоры должны остаться целыми).
export async function userHistoryError(userId: string, who: "user" | "self"): Promise<string | null> {
  const [contracts, versions, logs] = await Promise.all([
    prisma.contract.count({ where: { createdById: userId } }),
    prisma.contractVersion.count({ where: { uploadedById: userId } }),
    prisma.auditLog.count({ where: { userId } }),
  ]);
  if (contracts + versions + logs === 0) return null;
  const counts = `договоров: ${contracts}, версий файлов: ${versions}, записей журнала: ${logs}`;
  return who === "self"
    ? `Профиль нельзя удалить: с ним связаны записи (${counts}). Попросите администратора отключить вашу учётную запись.`
    : `Пользователя нельзя удалить: с ним связаны записи (${counts}). Отключите учётную запись на странице редактирования – войти в систему она больше не сможет.`;
}
