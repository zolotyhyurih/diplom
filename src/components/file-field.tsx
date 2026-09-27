"use client";

import { FileTextIcon, UploadIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FILE_ACCEPT } from "@/lib/schemas";
import { cn } from "@/lib/utils";

function fmtSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export function FileField({
  id,
  file,
  onChange,
  invalid,
}: {
  id: string;
  file: File | null;
  onChange: (file: File | null) => void;
  invalid?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const openDialog = () => inputRef.current?.click();

  function take(next: File | null) {
    onChange(next);
    if (!next && inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={FILE_ACCEPT}
        tabIndex={-1}
        className="sr-only"
        aria-hidden="true"
        onChange={(e) => {
          take(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
            <FileTextIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{fmtSize(file.size)}</p>
          </div>
          <Button id={id} type="button" variant="outline" size="sm" onClick={openDialog} aria-invalid={invalid || undefined}>
            Заменить
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Убрать файл" onClick={() => take(null)}>
            <XIcon />
          </Button>
        </div>
      ) : (
        <div
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest("button")) openDialog();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            take(e.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors hover:bg-muted/40",
            dragging && "border-primary bg-muted/60",
            invalid && "border-destructive bg-destructive/5",
          )}
        >
          <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UploadIcon className="size-5" />
          </div>
          <Button id={id} type="button" onClick={openDialog} aria-invalid={invalid || undefined} className="h-10 px-5 text-sm">
            Выбрать файл
          </Button>
          <p className="hidden text-sm text-muted-foreground sm:block">или перетащите его сюда</p>
          <p className="text-xs text-muted-foreground">PDF, PNG, JPG или TIFF — до 25 МБ</p>
        </div>
      )}
    </div>
  );
}
