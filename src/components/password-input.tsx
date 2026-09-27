"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

type Props = Omit<React.ComponentProps<"input">, "type" | "onChange" | "value"> & {
  value: string;
  onValueChange: (value: string) => void;
};

// Пароль без пробелов: они вырезаются и при вводе, и при вставке.
export function PasswordInput({ value, onValueChange, className, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onValueChange(e.target.value.replace(/\s/g, ""))}
        onKeyDown={(e) => {
          if (e.key === " ") e.preventDefault();
          props.onKeyDown?.(e);
        }}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={`pr-11 ${className ?? ""}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {visible ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
      </button>
    </div>
  );
}
