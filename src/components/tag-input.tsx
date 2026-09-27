"use client";

import { XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { ALLOWED_TAG_CHARS, MAX_TAGS, MAX_TAG_LENGTH } from "@/lib/schemas";
import { cn } from "@/lib/utils";

function normalize(raw: string) {
  return raw.replace(ALLOWED_TAG_CHARS, "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, MAX_TAG_LENGTH);
}

export function TagInput({
  id,
  value,
  onChange,
  invalid,
  placeholder,
}: {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  invalid?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function add(parts: string[]) {
    const next = [...value];
    for (const part of parts) {
      const tag = normalize(part);
      if (tag && !next.includes(tag) && next.length < MAX_TAGS) next.push(tag);
    }
    if (next.length !== value.length) onChange(next);
  }

  function handleChange(text: string) {
    if (!text.includes(",")) {
      setDraft(text);
      return;
    }
    const parts = text.split(",");
    add(parts.slice(0, -1));
    setDraft(parts[parts.length - 1]);
  }

  function commitDraft() {
    if (!draft.trim()) return;
    add([draft]);
    setDraft("");
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex min-h-8 w-full cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        invalid && "border-destructive ring-3 ring-destructive/20 focus-within:border-destructive focus-within:ring-destructive/30",
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex h-7 items-center gap-1 rounded-full bg-secondary pr-1 pl-3 text-sm text-secondary-foreground"
        >
          {tag}
          <button
            type="button"
            aria-label={`Убрать тег ${tag}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(value.filter((t) => t !== tag));
              inputRef.current?.focus();
            }}
            className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/15 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <XIcon className="size-3.5" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitDraft();
          } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commitDraft}
        aria-invalid={invalid || undefined}
        disabled={value.length >= MAX_TAGS}
        maxLength={MAX_TAG_LENGTH + 1}
        autoComplete="off"
        placeholder={value.length === 0 ? placeholder : value.length >= MAX_TAGS ? "" : "Ещё тег…"}
        className="h-7 min-w-24 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm"
      />
    </div>
  );
}
