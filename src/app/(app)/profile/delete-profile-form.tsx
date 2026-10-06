"use client";

import { deleteProfile } from "@/app/actions/profile";
import { Field } from "@/components/form-field";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import type { Errors } from "@/lib/schemas";
import { useForm } from "@/lib/use-form";

export function DeleteProfileForm() {
  const f = useForm<{ deletePassword: string }>({
    initial: { deletePassword: "" },
    validate: (v): Errors => (v.deletePassword ? {} : { deletePassword: "Введите пароль для подтверждения" }),
    submit: (v) => {
      const fd = new FormData();
      fd.set("deletePassword", v.deletePassword);
      return deleteProfile(fd);
    },
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (f.values.deletePassword && !window.confirm("Удалить свой профиль? Войти в систему с этими данными больше не получится. Действие необратимо.")) {
      e.preventDefault();
      return;
    }
    f.onSubmit(e);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Профиль можно удалить, только если вы ещё ничего не загружали и не меняли в системе. В остальных случаях попросите администратора отключить вашу учётную запись.
      </p>
      <Field label="Пароль для подтверждения" htmlFor="deletePassword" required error={f.errors.deletePassword}>
        <PasswordInput
          id="deletePassword"
          maxLength={72}
          autoComplete="current-password"
          value={f.values.deletePassword}
          onValueChange={(val) => f.set("deletePassword", val)}
          aria-invalid={!!f.errors.deletePassword || undefined}
        />
      </Field>
      {f.formError && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {f.formError}
        </p>
      )}
      <Button type="submit" variant="destructive" disabled={f.pending} className="self-start">
        {f.pending ? "Удаление…" : "Удалить профиль"}
      </Button>
    </form>
  );
}
