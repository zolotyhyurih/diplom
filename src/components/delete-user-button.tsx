"use client";

import { Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/schemas";

// Пользователя без истории удаляем после подтверждения; если удалить нельзя, причина показывается в том же окне.
export function DeleteUserButton({ action, name }: { action: () => Promise<FormState>; name: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setError(undefined);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title="Удалить"
        aria-label={`Удалить пользователя ${name}`}
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        tone="danger"
        title="Удалить пользователя?"
        description={
          <>
            Учётная запись <b className="font-medium text-foreground">«{name}»</b> будет удалена. Это действие необратимо.
          </>
        }
        confirmLabel="Удалить"
        pending={pending}
        error={error}
        onConfirm={() =>
          start(async () => {
            const result = await action();
            if (result?.error) setError(result.error);
            else setOpen(false);
          })
        }
      />
    </>
  );
}
