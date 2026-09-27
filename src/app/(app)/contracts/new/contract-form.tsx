"use client";

import Link from "next/link";
import { createContract } from "@/app/actions/contracts";
import { DatePicker } from "@/components/date-picker";
import { FileField } from "@/components/file-field";
import { Field } from "@/components/form-field";
import { NativeSelect } from "@/components/native-select";
import { TagInput } from "@/components/tag-input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ALLOWED_NUMBER_CHARS, ContractSchema, checkFile, sanitizeAmount, zodErrors } from "@/lib/schemas";
import { useForm } from "@/lib/use-form";
import { cn } from "@/lib/utils";

type Values = {
  number: string;
  title: string;
  counterparty: string;
  categoryId: string;
  amount: string;
  signedAt: string;
  startsAt: string;
  expiresAt: string;
  tags: string[];
  description: string;
  file: File | null;
};

const initial: Values = {
  number: "",
  title: "",
  counterparty: "",
  categoryId: "",
  amount: "",
  signedAt: "",
  startsAt: "",
  expiresAt: "",
  tags: [],
  description: "",
  file: null,
};

export function ContractForm({
  categories,
  counterparties,
}: {
  categories: { id: string; name: string }[];
  counterparties: string[];
}) {
  const f = useForm<Values>({
    initial,
    validate: ({ file, ...rest }) => {
      const r = ContractSchema.safeParse(rest);
      const errors = r.success ? {} : zodErrors(r.error);
      const fileError = checkFile(file);
      return fileError ? { ...errors, file: fileError } : errors;
    },
    submit: ({ file, tags, ...rest }) => {
      const fd = new FormData();
      for (const [k, v] of Object.entries(rest)) fd.set(k, v);
      for (const tag of tags) fd.append("tags", tag);
      fd.set("file", file as File);
      return createContract(fd);
    },
  });
  const { values: v, errors: e } = f;
  const invalid = (k: string) => !!e[k] || undefined;

  return (
    <form onSubmit={f.onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Номер договора" htmlFor="number" required error={e.number}>
          <Input
            id="number"
            maxLength={50}
            autoComplete="off"
            placeholder="15/2026"
            value={v.number}
            onChange={(ev) => f.set("number", ev.target.value.replace(ALLOWED_NUMBER_CHARS, ""))}
            aria-invalid={invalid("number")}
          />
        </Field>
        <Field label="Категория" htmlFor="categoryId" error={e.categoryId}>
          <NativeSelect id="categoryId" value={v.categoryId} onChange={(ev) => f.set("categoryId", ev.target.value)}>
            <option value="">Без категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <Field label="Название" htmlFor="title" required error={e.title}>
        <Input
          id="title"
          maxLength={300}
          autoComplete="off"
          placeholder="Например: Договор поставки канцелярии"
          value={v.title}
          onChange={(ev) => f.set("title", ev.target.value)}
          aria-invalid={invalid("title")}
        />
      </Field>

      <Field label="Контрагент" htmlFor="counterparty" required error={e.counterparty}>
        <Input
          id="counterparty"
          list="counterparties"
          maxLength={200}
          autoComplete="off"
          placeholder="ООО «Ромашка»"
          value={v.counterparty}
          onChange={(ev) => f.set("counterparty", ev.target.value)}
          aria-invalid={invalid("counterparty")}
        />
        <datalist id="counterparties">
          {counterparties.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Дата подписания" htmlFor="signedAt" error={e.signedAt}>
          <DatePicker id="signedAt" value={v.signedAt} onChange={(d) => f.set("signedAt", d)} invalid={!!e.signedAt} />
        </Field>
        <Field label="Начало действия" htmlFor="startsAt" error={e.startsAt}>
          <DatePicker id="startsAt" value={v.startsAt} onChange={(d) => f.set("startsAt", d)} invalid={!!e.startsAt} />
        </Field>
        <Field label="Действует до" htmlFor="expiresAt" error={e.expiresAt}>
          <DatePicker id="expiresAt" value={v.expiresAt} onChange={(d) => f.set("expiresAt", d)} invalid={!!e.expiresAt} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Сумма, ₽" htmlFor="amount" error={e.amount}>
          <Input
            id="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="150000"
            value={v.amount}
            onChange={(ev) => f.set("amount", sanitizeAmount(ev.target.value))}
            aria-invalid={invalid("amount")}
          />
        </Field>
        <Field label="Теги" htmlFor="tags" error={e.tags} hint="Введите тег и поставьте запятую или нажмите Enter">
          <TagInput id="tags" value={v.tags} onChange={(t) => f.set("tags", t)} invalid={!!e.tags} placeholder="аренда, офис" />
        </Field>
      </div>

      <Field label="Описание" htmlFor="description" error={e.description}>
        <Textarea
          id="description"
          rows={3}
          maxLength={2000}
          value={v.description}
          onChange={(ev) => f.set("description", ev.target.value)}
          aria-invalid={invalid("description")}
        />
      </Field>

      <Field label="Файл договора" htmlFor="file" required error={e.file}>
        <FileField id="file" file={v.file} onChange={(file) => f.set("file", file)} invalid={!!e.file} />
      </Field>

      {f.formError && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {f.formError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Link
          href="/contracts"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-10 border-2 border-foreground/50 px-5 text-sm hover:border-foreground/80",
          )}
        >
          Отмена
        </Link>
        <Button type="submit" disabled={f.pending} className="h-10 px-5 text-sm">
          {f.pending ? "Сохранение…" : "Сохранить в архив"}
        </Button>
      </div>
    </form>
  );
}
