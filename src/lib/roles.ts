export type RoleName = "ADMIN" | "MANAGER" | "EMPLOYEE";

export const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: "Администратор",
  MANAGER: "Менеджер",
  EMPLOYEE: "Сотрудник",
};

export const STATUS_LABELS = {
  DRAFT: "Черновик",
  ACTIVE: "Действует",
  EXPIRED: "Истёк",
  TERMINATED: "Расторгнут",
} as const;

export const OCR_LABELS = {
  PENDING: "В очереди",
  PROCESSING: "Распознаётся",
  DONE: "Готово",
  FAILED: "Ошибка",
} as const;

// Права: сотрудник только читает и ищет, менеджер загружает и правит, админ управляет всем.
export const can = {
  upload: (role: RoleName) => role === "ADMIN" || role === "MANAGER",
  delete: (role: RoleName) => role === "ADMIN",
  manageUsers: (role: RoleName) => role === "ADMIN",
};
