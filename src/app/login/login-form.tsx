"use client";

import { login } from "@/app/actions/auth";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/password-input";
import { Input } from "@/components/ui/input";
import { LoginSchema, zodErrors } from "@/lib/schemas";
import { useForm } from "@/lib/use-form";

export function LoginForm() {
  const f = useForm({
    initial: { email: "", password: "" },
    validate: (v) => {
      const r = LoginSchema.safeParse(v);
      return r.success ? {} : zodErrors(r.error);
    },
    submit: (v) => {
      const fd = new FormData();
      fd.set("email", v.email);
      fd.set("password", v.password);
      return login(fd);
    },
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Архив договоров</CardTitle>
        <p className="text-sm text-muted-foreground">Войдите, чтобы продолжить</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={f.onSubmit} noValidate className="flex flex-col gap-4">
          <Field label="Email" htmlFor="email" required error={f.errors.email}>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              maxLength={254}
              value={f.values.email}
              onChange={(e) => f.set("email", e.target.value.replace(/\s/g, ""))}
              aria-invalid={!!f.errors.email || undefined}
            />
          </Field>
          <Field label="Пароль" htmlFor="password" required error={f.errors.password}>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              maxLength={72}
              value={f.values.password}
              onValueChange={(v) => f.set("password", v)}
              aria-invalid={!!f.errors.password || undefined}
            />
          </Field>
          {f.formError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {f.formError}
            </p>
          )}
          <Button type="submit" disabled={f.pending}>
            {f.pending ? "Вход…" : "Войти"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
