"use client";

import { FileField } from "@/components/file-field";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { checkFile, type Errors, type FormState } from "@/lib/schemas";
import { useForm } from "@/lib/use-form";

export function VersionForm({ action }: { action: (formData: FormData) => Promise<FormState> }) {
  const f = useForm<{ file: File | null }>({
    initial: { file: null },
    validate: (v): Errors => {
      const e = checkFile(v.file);
      return e ? { file: e } : {};
    },
    submit: (v) => {
      const fd = new FormData();
      fd.set("file", v.file as File);
      return action(fd);
    },
  });

  return (
    <form onSubmit={f.onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Файл новой версии" htmlFor="version-file" required error={f.errors.file}>
        <FileField id="version-file" file={f.values.file} onChange={(file) => f.set("file", file)} invalid={!!f.errors.file} />
      </Field>
      {f.formError && <p className="text-sm text-destructive">{f.formError}</p>}
      <Button type="submit" disabled={f.pending} className="self-start">
        {f.pending ? "Загрузка…" : "Добавить версию"}
      </Button>
    </form>
  );
}
