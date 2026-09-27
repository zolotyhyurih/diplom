import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export function BackLink({ href = "/contracts", children = "Все договоры" }: { href?: string; children?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border bg-background px-4 text-base font-medium transition-colors hover:bg-muted active:bg-muted"
    >
      <ArrowLeftIcon className="size-5" />
      {children}
    </Link>
  );
}
