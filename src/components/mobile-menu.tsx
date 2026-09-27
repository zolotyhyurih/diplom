"use client";

import { MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MenuItem = { href: string; label: string };

export function MobileMenu({
  items,
  userName,
  roleLabel,
}: {
  items: MenuItem[];
  userName: string;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Открыть меню"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Меню">
          <div
            className="absolute inset-0 animate-in bg-black/40 duration-200 fade-in"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] animate-in flex-col bg-background shadow-xl duration-200 slide-in-from-left">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="font-semibold">Архив договоров</span>
              <Button type="button" variant="ghost" size="icon" aria-label="Закрыть меню" onClick={() => setOpen(false)}>
                <XIcon />
              </Button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {items.map((item) => {
                const active =
                  item.href === "/contracts"
                    ? pathname === "/contracts" || (pathname.startsWith("/contracts/") && !pathname.startsWith("/contracts/new"))
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-base hover:bg-muted",
                      active && "bg-muted font-medium",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-col gap-3 border-t p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{userName}</p>
                <p className="text-sm text-muted-foreground">{roleLabel}</p>
              </div>
              <form action={logout}>
                <Button type="submit" variant="outline" className="w-full">
                  Выйти
                </Button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
