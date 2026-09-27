import { MARK_END, MARK_START } from "@/lib/search";

// Подсвечивает найденные слова, не используя dangerouslySetInnerHTML.
export function Snippet({ text }: { text: string }) {
  const parts = text.split(new RegExp(`${MARK_START}(.*?)${MARK_END}`, "gs"));
  return (
    <p className="text-sm text-muted-foreground">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-500/40">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}
