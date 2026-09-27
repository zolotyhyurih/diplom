import * as z from "zod";

export type Errors = Record<string, string>;
export type FormState = { error?: string; errors?: Errors } | undefined;

export const MAX_FILE_SIZE = 25 * 1024 * 1024;
export const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/tiff": ".tiff",
};
export const FILE_ACCEPT = ".pdf,.png,.jpg,.jpeg,.tif,.tiff";

export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;

export function checkFile(file: unknown): string | null {
  if (!(file instanceof File) || file.size === 0) return "Прикрепите файл";
  if (!ALLOWED_TYPES[file.type]) return "Допустимы только PDF, PNG, JPG и TIFF";
  if (file.size > MAX_FILE_SIZE) return "Файл больше 25 МБ";
  return null;
}

export function zodErrors(error: z.ZodError): Errors {
  const out: Errors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export function sanitizeAmount(raw: string) {
  const v = raw.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const i = v.indexOf(",");
  const [int, frac] = (i === -1 ? v : v.slice(0, i + 1) + v.slice(i + 1).replace(/,/g, "")).split(",");
  return frac === undefined ? int.slice(0, 12) : `${int.slice(0, 12)},${frac.slice(0, 2)}`;
}

export function isRealIsoDate(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 1990 || y > 2100) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

// Поле даты хранит ISO (гггг-мм-дд), а если введено что-то неполное или невозможное — сырой текст, его отсекает эта проверка.
const optionalDate = z
  .string()
  .refine((v) => v === "" || isRealIsoDate(v), {
    error: (iss) =>
      typeof iss.input === "string" && iss.input.length === 10
        ? "Такой даты не существует (год — от 1990 до 2100)"
        : "Введите дату полностью в формате дд.мм.гггг",
  });

export const ALLOWED_NUMBER_CHARS = /[^\p{L}\p{N}\s/\\\-_.№#]/gu;
export const ALLOWED_NAME_CHARS = /[^\p{L}\s\-'.]/gu;
export const ALLOWED_TAG_CHARS = /[^\p{L}\p{N}\s\-_]/gu;

export const AMOUNT_RE = /^\d{1,12}([.,]\d{1,2})?$/;

export const ContractSchema = z
  .object({
    number: z
      .string()
      .trim()
      .min(1, { error: "Укажите номер договора" })
      .max(50, { error: "Номер — не длиннее 50 символов" })
      .refine((v) => !/[^\p{L}\p{N}\s/\\\-_.№#]/u.test(v), { error: "Допустимы буквы, цифры и символы / - _ . № #" }),
    title: z
      .string()
      .trim()
      .min(1, { error: "Укажите название договора" })
      .min(3, { error: "Название — минимум 3 символа" })
      .max(300, { error: "Название — не длиннее 300 символов" }),
    counterparty: z
      .string()
      .trim()
      .min(1, { error: "Укажите контрагента" })
      .min(2, { error: "Название контрагента — минимум 2 символа" })
      .max(200, { error: "Название контрагента — не длиннее 200 символов" }),
    categoryId: z.string(),
    amount: z
      .string()
      .trim()
      .refine((v) => v === "" || AMOUNT_RE.test(v), { error: "Сумма: только цифры, до двух знаков после запятой" }),
    signedAt: optionalDate,
    startsAt: optionalDate,
    expiresAt: optionalDate,
    tags: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(MAX_TAG_LENGTH, { error: `Тег — не длиннее ${MAX_TAG_LENGTH} символов` })
          .refine((v) => !/[^\p{L}\p{N}\s\-_]/u.test(v), { error: "В теге допустимы буквы, цифры, пробел, - и _" }),
      )
      .max(MAX_TAGS, { error: `Не больше ${MAX_TAGS} тегов` }),
    description: z.string().trim().max(2000, { error: "Описание — не длиннее 2000 символов" }),
  })
  .refine((d) => !(isRealIsoDate(d.startsAt) && isRealIsoDate(d.expiresAt)) || d.expiresAt >= d.startsAt, {
    path: ["expiresAt"],
    error: "Дата окончания не может быть раньше даты начала",
  })
  .refine((d) => !(isRealIsoDate(d.signedAt) && isRealIsoDate(d.expiresAt)) || d.expiresAt >= d.signedAt, {
    path: ["expiresAt"],
    error: "Дата окончания не может быть раньше даты подписания",
  });

export type ContractValues = z.input<typeof ContractSchema>;

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { error: "Введите email" })
    .refine((v) => z.email().safeParse(v).success, { error: "Введите корректный email, например name@company.ru" }),
  password: z.string().min(1, { error: "Введите пароль" }),
});

export const UserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Укажите имя" })
    .min(2, { error: "Имя — минимум 2 символа" })
    .max(100, { error: "Имя — не длиннее 100 символов" })
    .refine((v) => !/[^\p{L}\s\-'.]/u.test(v), { error: "В имени допустимы только буквы, пробел, дефис и точка" }),
  email: LoginSchema.shape.email,
  password: z
    .string()
    .min(1, { error: "Придумайте пароль" })
    .min(8, { error: "Пароль — минимум 8 символов" })
    .max(72, { error: "Пароль — не длиннее 72 символов" })
    .refine((v) => !/\s/.test(v), { error: "Пароль не должен содержать пробелов" })
    .refine((v) => /\p{L}/u.test(v) && /\d/.test(v), { error: "В пароле нужна хотя бы одна буква и одна цифра" }),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"], { error: "Выберите роль" }),
});

export type UserValues = z.input<typeof UserSchema>;
