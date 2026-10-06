"use client";

import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Удаление необратимо (договор уходит вместе с версиями, журналом и файлами), поэтому перед отправкой формы спрашиваем подтверждение.
export function DeleteContractButton({
  action,
  title,
  label,
}: {
  action: () => Promise<void>;
  title: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Удалить договор «${title}» вместе со всеми версиями и файлами? Действие необратимо.`)) {
          e.preventDefault();
        }
      }}
    >
      {label ? (
        <Button type="submit" variant="destructive">
          {label}
        </Button>
      ) : (
        <Button type="submit" variant="ghost" size="icon-sm" title="Удалить" aria-label={`Удалить договор ${title}`} className="text-destructive hover:text-destructive">
          <Trash2Icon />
        </Button>
      )}
    </form>
  );
}
