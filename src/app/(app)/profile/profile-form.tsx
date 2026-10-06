"use client";

import { updateProfile } from "@/app/actions/profile";
import { Field } from "@/components/form-field";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALLOWED_NAME_CHARS, ProfileSchema, zodErrors } from "@/lib/schemas";
import { useForm } from "@/lib/use-form";

type Values = { name: string; email: string; currentPassword: string; newPassword: string };

export function ProfileForm({ initial }: { initial: { name: string; email: string } }) {
  const f = useForm<Values>({
    initial: { ...initial, currentPassword: "", newPassword: "" },
    validate: (v) => {
      const r = ProfileSchema.safeParse(v);
      return r.success ? {} : zodErrors(r.error);
    },
    submit: (v) => {
      const fd = new FormData();
      for (const [k, val] of Object.entries(v)) fd.set(k, val);
      return updateProfile(fd);
    },
  });
  const invalid = (k: string) => !!f.errors[k] || undefined;
  const v = f.values;

  // Что изменилось относительно сохранённых данных – это показываем в запросе подтверждения.
  const changes = [
    v.name.trim() !== initial.name && "имя",
    v.email.trim().toLowerCase() !== initial.email && "почта",
    v.newPassword !== "" && "пароль",
  ].filter(Boolean) as string[];

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const valid = ProfileSchema.safeParse(v).success;
    if (valid) {
      if (changes.length === 0) {
        e.preventDefault();
        window.alert("Вы ничего не изменили.");
        return;
      }
      if (!window.confirm(`Сохранить изменения в профиле (${changes.join(", ")})?`)) {
        e.preventDefault();
        return;
      }
    }
    f.onSubmit(e); // при ошибках ввода просто покажет сообщения
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Имя" htmlFor="name" required error={f.errors.name}>
        <Input
          id="name"
          maxLength={100}
          autoComplete="name"
          value={v.name}
          onChange={(e) => f.set("name", e.target.value.replace(ALLOWED_NAME_CHARS, "").replace(/\s{2,}/g, " "))}
          aria-invalid={invalid("name")}
        />
      </Field>
      <Field label="Email (логин)" htmlFor="email" required error={f.errors.email}>
        <Input
          id="email"
          type="email"
          maxLength={254}
          autoCapitalize="none"
          autoComplete="username"
          value={v.email}
          onChange={(e) => f.set("email", e.target.value)}
          aria-invalid={invalid("email")}
        />
      </Field>
      <Field
        label="Новый пароль"
        htmlFor="newPassword"
        error={f.errors.newPassword}
        hint="Оставьте пустым, чтобы не менять. От 8 символов, буква и цифра, без пробелов"
      >
        <PasswordInput
          id="newPassword"
          maxLength={72}
          autoComplete="new-password"
          value={v.newPassword}
          onValueChange={(val) => f.set("newPassword", val)}
          aria-invalid={invalid("newPassword")}
        />
      </Field>
      <Field
        label="Текущий пароль"
        htmlFor="currentPassword"
        error={f.errors.currentPassword}
        hint="Нужен, только если вы меняете почту или пароль"
      >
        <PasswordInput
          id="currentPassword"
          maxLength={72}
          autoComplete="current-password"
          value={v.currentPassword}
          onValueChange={(val) => f.set("currentPassword", val)}
          aria-invalid={invalid("currentPassword")}
        />
      </Field>
      {f.formError && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {f.formError}
        </p>
      )}
      {f.done && (
        <p role="status" className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          Изменения сохранены
        </p>
      )}
      <Button type="submit" disabled={f.pending} className="self-start">
        {f.pending ? "Сохранение…" : "Сохранить изменения"}
      </Button>
    </form>
  );
}
