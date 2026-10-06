import Link from "next/link";
import { MobileMenu, type MenuItem } from "@/components/mobile-menu";
import { buttonVariants } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { requireUser } from "@/lib/dal";
import { ROLE_LABELS, can } from "@/lib/roles";

const navLink = buttonVariants({ variant: "ghost", size: "sm" });

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const items: MenuItem[] = [{ href: "/contracts", label: "Договоры" }];
  if (can.upload(user.role)) items.push({ href: "/contracts/new", label: "Загрузить договор" });
  if (can.manageUsers(user.role)) items.push({ href: "/admin/users", label: "Пользователи" });

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-2 md:py-3">
          <MobileMenu items={items} userName={user.name} roleLabel={ROLE_LABELS[user.role]} />

          <Link href="/contracts" className="text-lg font-bold whitespace-nowrap md:mr-4">
            Архив договоров
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {items.map((item) => (
              <Link key={item.href} href={item.href} className={navLink}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden md:block">
            <UserMenu name={user.name} roleLabel={ROLE_LABELS[user.role]} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-4 sm:py-6">{children}</main>
    </div>
  );
}
