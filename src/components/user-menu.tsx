"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronDownIcon, LogOutIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

// Меню пользователя в шапке: профиль и выход.
export function UserMenu({ name, roleLabel }: { name: string; roleLabel: string }) {
  const [open, setOpen] = useState(false);
  // Шапка не перерисовывается при переходах, поэтому меню закрываем сами, иначе его слой остаётся поверх страницы.

  const item =
    "flex w-full cursor-default items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none select-none data-[highlighted]:bg-muted";

  return (
    <Menu.Root open={open} onOpenChange={setOpen}>
      <Menu.Trigger render={<Button variant="outline" size="sm" className="gap-2" aria-label="Меню пользователя" />}>
        <UserIcon />
        <span className="hidden max-w-48 truncate lg:inline">
          {name} · {roleLabel}
        </span>
        <ChevronDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={6} className="z-50">
          <Menu.Popup className="min-w-52 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg outline-none">
            <div className="px-2.5 py-2">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <Menu.Separator className="my-1 h-px bg-border" />
            <Menu.LinkItem render={<Link href="/profile" />} className={item} onClick={() => setOpen(false)}>
              <UserIcon className="size-4" />
              Профиль
            </Menu.LinkItem>
            <Menu.Item className={item} onClick={() => void logout()}>
              <LogOutIcon className="size-4" />
              Выйти
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
