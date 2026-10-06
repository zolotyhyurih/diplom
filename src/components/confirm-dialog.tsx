"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { InfoIcon, PencilLineIcon, Trash2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tone = "danger" | "default" | "info";

const ICONS = { danger: Trash2Icon, default: PencilLineIcon, info: InfoIcon } as const;
const ICON_STYLES: Record<Tone, string> = {
  danger: "bg-destructive/10 text-destructive",
  default: "bg-primary/10 text-primary",
  info: "bg-muted text-foreground",
};

// Красивая замена окнам confirm/alert браузера: затемнение, карточка по центру, понятные кнопки.
// Закрывается по Esc и по клику на затемнение; фокус удерживается внутри, пока окно открыто.
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  details,
  confirmLabel = "Подтвердить",
  cancelLabel = "Отмена",
  tone = "default",
  pending = false,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  /** Список пунктов под описанием (например, какие поля будут изменены). */
  details?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger – необратимое действие, default – изменение данных, info – только сообщение (одна кнопка). */
  tone?: Tone;
  pending?: boolean;
  error?: string;
  onConfirm?: () => void;
}) {
  const Icon = ICONS[tone];
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => (pending ? undefined : onOpenChange(next))}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <AlertDialog.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-popover p-6 text-popover-foreground shadow-2xl outline-none",
            "transition-all duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
          )}
        >
          <div className="flex gap-4">
            <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", ICON_STYLES[tone])}>
              <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <AlertDialog.Title className="text-lg leading-snug font-semibold">{title}</AlertDialog.Title>
              {description && (
                <AlertDialog.Description className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </AlertDialog.Description>
              )}
              {details && details.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {details.map((d) => (
                    <li key={d} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                      {d}
                    </li>
                  ))}
                </ul>
              )}
              {error && (
                <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {tone === "info" ? (
              <AlertDialog.Close render={<Button className="h-10 px-5 text-sm" />}>Понятно</AlertDialog.Close>
            ) : (
              <>
                <AlertDialog.Close
                  disabled={pending}
                  render={<Button variant="outline" className="h-10 px-5 text-sm" />}
                >
                  {cancelLabel}
                </AlertDialog.Close>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={onConfirm}
                  className={cn(
                    "h-10 px-5 text-sm",
                    tone === "danger" && "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30",
                  )}
                >
                  {pending ? "Подождите…" : confirmLabel}
                </Button>
              </>
            )}
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

// Подтверждение перед отправкой формы: сначала обычная проверка полей, затем окно, и только после «Подтвердить» форма уходит на сервер.
export function useConfirmedSubmit(
  submit: (e: React.FormEvent<HTMLFormElement>) => void,
  shouldConfirm: () => boolean | "block",
) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmed = useRef(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (confirmed.current) {
      confirmed.current = false;
      submit(e);
      return;
    }
    const need = shouldConfirm();
    if (need === "block") {
      e.preventDefault(); // отправлять нечего (например, ничего не изменено): окно с пояснением показывает вызывающий код
      return;
    }
    if (need) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    submit(e);
  }

  function confirm() {
    confirmed.current = true;
    setOpen(false);
    formRef.current?.requestSubmit();
  }

  return { open, setOpen, formRef, onSubmit, confirm };
}
