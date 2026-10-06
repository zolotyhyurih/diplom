"use client";

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MIN_YEAR = 1990;
const MAX_YEAR = 2100;

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function isoToText(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

function maskDate(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`;
}

function parseIso(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) } : null;
}

// Возвращает ISO для полностью и правильно введённой даты, иначе — сырой текст (его отсечёт проверка формы).
function textToValue(text: string) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text);
  if (!m) return text;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  const real = dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
  return real && y >= MIN_YEAR && y <= MAX_YEAR ? toIso(y, mo - 1, d) : text;
}

export function DatePicker({
  id,
  value,
  onChange,
  invalid,
  min,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  /** Самая ранняя допустимая дата (ISO): более ранние дни в календаре недоступны. */
  min?: string;
}) {
  const [text, setText] = useState(() => isoToText(value));
  const [open, setOpen] = useState(false);
  const today = new Date();
  const selected = parseIso(value);
  const minDate = min ? parseIso(min) : null;
  const [view, setView] = useState(() => ({ y: selected?.y ?? today.getFullYear(), m: selected?.m ?? today.getMonth() }));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function commit(nextText: string) {
    setText(nextText);
    onChange(textToValue(nextText));
  }

  function pick(y: number, m: number, d: number) {
    commit(`${pad(d)}.${pad(m + 1)}.${y}`);
    setOpen(false);
  }

  function openCalendar() {
    const s = parseIso(value) ?? minDate;
    if (s) setView({ y: s.y, m: s.m });
    setOpen((o) => !o);
  }

  const lowestYear = Math.max(MIN_YEAR, minDate?.y ?? MIN_YEAR);
  const isBeforeMin = (y: number, m: number, d: number) =>
    !!minDate && (y < minDate.y || (y === minDate.y && (m < minDate.m || (m === minDate.m && d < minDate.d))));
  // Месяцы целиком раньше минимальной даты листать нельзя.
  const canGoBack = !minDate || view.y * 12 + view.m > minDate.y * 12 + minDate.m;

  function shift(delta: number) {
    setView((v) => {
      const total = v.y * 12 + v.m + delta;
      const y = Math.floor(total / 12);
      return { y: Math.min(MAX_YEAR, Math.max(lowestYear, y)), m: ((total % 12) + 12) % 12 };
    });
  }

  const firstWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array<null>(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const years = Array.from({ length: MAX_YEAR - lowestYear + 1 }, (_, i) => lowestYear + i);

  return (
    <div ref={rootRef} className="relative">
      <Input
        id={id}
        value={text}
        onChange={(e) => commit(maskDate(e.target.value))}
        inputMode="numeric"
        autoComplete="off"
        placeholder="дд.мм.гггг"
        maxLength={10}
        aria-invalid={invalid || undefined}
        className="pr-11"
      />
      <button
        type="button"
        onClick={openCalendar}
        aria-label="Выбрать дату в календаре"
        aria-expanded={open}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <CalendarIcon className="size-4" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Календарь"
          className="absolute left-0 z-40 mt-1 w-80 max-w-[calc(100vw-2rem)] animate-in rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg duration-150 fade-in zoom-in-95"
        >
          <div className="mb-3 flex items-center gap-1.5">
            <Button type="button" variant="outline" size="icon" aria-label="Предыдущий месяц" disabled={!canGoBack} onClick={() => shift(-1)}>
              <ChevronLeftIcon />
            </Button>
            <NativeSelect
              aria-label="Месяц"
              value={view.m}
              onChange={(e) => setView((v) => ({ ...v, m: Number(e.target.value) }))}
              className="flex-1"
            >
              {MONTHS.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="Год"
              value={view.y}
              onChange={(e) => setView((v) => ({ ...v, y: Number(e.target.value) }))}
              className="w-[5.25rem] flex-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </NativeSelect>
            <Button type="button" variant="outline" size="icon" aria-label="Следующий месяц" onClick={() => shift(1)}>
              <ChevronRightIcon />
            </Button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={cn("py-1", i >= 5 && "text-destructive/80")}>
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />;
              const isSelected = selected?.y === view.y && selected.m === view.m && selected.d === day;
              const disabled = isBeforeMin(view.y, view.m, day);
              const isToday = today.getFullYear() === view.y && today.getMonth() === view.m && today.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(view.y, view.m, day)}
                  aria-label={`${day} ${MONTHS[view.m].toLowerCase()} ${view.y}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "mx-auto flex size-10 items-center justify-center rounded-lg text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:text-muted-foreground/40 disabled:line-through",
                    (i % 7 >= 5) && "text-destructive/80",
                    isToday && !isSelected && "border border-foreground/40 font-medium",
                    isSelected && "bg-primary font-medium text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-between border-t pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isBeforeMin(today.getFullYear(), today.getMonth(), today.getDate())}
              onClick={() => pick(today.getFullYear(), today.getMonth(), today.getDate())}
            >
              Сегодня
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                commit("");
                setOpen(false);
              }}
            >
              Очистить
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
