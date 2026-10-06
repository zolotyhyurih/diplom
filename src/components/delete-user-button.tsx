"use client";

import { Trash2Icon } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/schemas";

// Пользователя без истории удаляем сразу после подтверждения; если удалить нельзя, показываем причину.
export function DeleteUserButton({ action, name }: { action: () => Promise<FormState>; name: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="Удалить"
      aria-label={`Удалить пользователя ${name}`}
      disabled={pending}
      className="text-destructive hover:text-destructive"
      onClick={() => {
        if (!window.confirm(`Удалить пользователя «${name}»? Действие необратимо.`)) return;
        start(async () => {
          const result = await action();
          if (result?.error) window.alert(result.error);
        });
      }}
    >
      <Trash2Icon />
    </Button>
  );
}
