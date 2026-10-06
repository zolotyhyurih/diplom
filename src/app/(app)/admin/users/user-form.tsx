"use client";

import { createUser } from "@/app/actions/users";
import { Field } from "@/components/form-field";
import { NativeSelect } from "@/components/native-select";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/roles";
import { ALLOWED_NAME_CHARS, UserSchema, zodErrors } from "@/lib/schemas";
import { useForm } from "@/lib/use-form";

export function UserForm() {
  const f = useForm({
    initial: { name: "", email: "", password: "", role: "EMPLOYEE" },
    validate: (v) => {
      const r = UserSchema.safeParse(v);
      return r.success ? {} : zodErrors(r.error);
    },
    submit: (v) => {
      const fd = new FormData();
      for (const [k, val] of Object.entries(v)) fd.set(k, val);
      return createUser(fd);
    },
    resetOnSuccess: true,
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
          onChange={(e) => f.set("email", e.target.value.replace(/\s/g, ""))}
          aria-invalid={invalid("email")}
        />
      </Field>
      <Field
        label="Пароль"
        htmlFor="password"
        required
        error={f.errors.password}
        hint="От 8 символов, буква и цифра, без пробелов"
      >
        <PasswordInput
          id="password"
          maxLength={72}
          autoComplete="new-password"
          value={f.values.password}
          onValueChange={(v) => f.set("password", v)}
          aria-invalid={invalid("password")}
        />
      </Field>
      <Field label="Роль" htmlFor="role" required error={f.errors.role}>
        <NativeSelect id="role" value={f.values.role} onChange={(e) => f.set("role", e.target.value)}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      {f.formError && <p className="text-sm text-destructive">{f.formError}</p>}
      {f.done && (
        <p role="status" className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          Пользователь создан
        </p>
      )}
      <Button type="submit" disabled={f.pending} className="self-start">
        {f.pending ? "Создание…" : "Создать"}
      </Button>
    </form>
  );
}
