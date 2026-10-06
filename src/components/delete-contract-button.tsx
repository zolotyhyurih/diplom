"use client";

import { Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

// Удаление необратимо (договор уходит вместе с версиями, журналом и файлами), поэтому перед выполнением спрашиваем подтверждение.
export function DeleteContractButton({
  action,
  title,
  label,
}: {
  action: () => Promise<void>;
  title: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      {label ? (
        <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
          {label}
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Удалить"
          aria-label={`Удалить договор ${title}`}
          className="text-destructive hover:text-destructive"
          onClick={() => setOpen(true)}
        >
          <Trash2Icon />
        </Button>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        tone="danger"
        title="Удалить договор?"
        description={
          <>
            Договор <b className="font-medium text-foreground">«{title}»</b> будет удалён вместе со всеми версиями, журналом действий и файлами.
            Это действие необратимо.
          </>
        }
        confirmLabel="Удалить"
        pending={pending}
        onConfirm={() => start(async () => void (await action()))}
      />
    </>
  );
}
