"use client";

import Link from "next/link";
import { updateUser } from "@/app/actions/users";
import { Field } from "@/components/form-field";
import { NativeSelect } from "@/components/native-select";
import { PasswordInput } from "@/components/password-input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/roles";
import { ALLOWED_NAME_CHARS, UserEditSchema, zodErrors } from "@/lib/schemas";
import { useForm } from "@/lib/use-form";
import { cn } from "@/lib/utils";

type Values = { name: string; email: string; role: string; active: string; password: string };

export function UserEditForm({ userId, initial, isSelf }: { userId: string; initial: Omit<Values, "password">; isSelf: boolean }) {
  const f = useForm<Values>({
    initial: { ...initial, password: "" },
    validate: (v) => {
      const r = UserEditSchema.safeParse(v);
      return r.success ? {} : zodErrors(r.error);
    },
    submit: (v) => {
      const fd = new FormData();
      for (const [k, val] of Object.entries(v)) fd.set(k, val);
      return updateUser(userId, fd);
    },
  });
  const invalid = (k: string) => !!f.errors[k] || undefined;

  return (
    <form onSubmit={f.onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Имя" htmlFor="name" required error={f.errors.name}>
        <Input
          id="name"
          maxLength={100}
          autoComplete="off"
          value={f.values.name}
          onChange={(e) => f.set("name", e.target.value.replace(ALLOWED_NAME_CHARS, "").replace(/\s{2,}/g, " "))}
          aria-invalid={invalid("name")}
        />
      </Field>
      <Field label="Email" htmlFor="email" required error={f.errors.email}>
        <Input
          id="email"
          type="email"
          maxLength={254}
          autoCapitalize="none"
          autoComplete="off"
          value={f.values.email}
          onChange={(e) => f.set("email", e.target.value)}
          aria-invalid={invalid("email")}
        />
      </Field>
      <Field label="Роль" htmlFor="role" required error={f.errors.role} hint={isSelf ? "Свою роль изменить нельзя" : undefined}>
        <NativeSelect id="role" value={f.values.role} disabled={isSelf} onChange={(e) => f.set("role", e.target.value)}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Новый пароль" htmlFor="password" error={f.errors.password} hint="Оставьте пустым, чтобы не менять. От 8 символов, буква и цифра, без пробелов">
        <PasswordInput
          id="password"
          maxLength={72}
          autoComplete="new-password"
          value={f.values.password}
          onValueChange={(v) => f.set("password", v)}
          aria-invalid={invalid("password")}
        />
      </Field>
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm">
          <input
            id="active"
            type="checkbox"
            className="size-4"
            checked={f.values.active === "true"}
            disabled={isSelf}
            onChange={(e) => f.set("active", e.target.checked ? "true" : "false")}
          />
          Учётная запись активна
        </label>
        <p className="text-xs text-muted-foreground">
          {isSelf ? "Свою учётную запись отключить нельзя." : "Отключённый пользователь не может войти в систему, но его договоры и записи журнала сохраняются."}
        </p>
      </div>
      {f.formError && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {f.formError}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Link
          href="/admin/users"
          className={cn(buttonVariants({ variant: "outline" }), "h-10 border-2 border-foreground/50 px-5 text-sm hover:border-foreground/80")}
        >
          Отмена
        </Link>
        <Button type="submit" disabled={f.pending} className="h-10 px-5 text-sm">
          {f.pending ? "Сохранение…" : "Сохранить изменения"}
        </Button>
      </div>
    </form>
  );
}
