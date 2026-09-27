import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const CATEGORIES = ["Поставка", "Услуги", "Аренда", "Подряд", "Трудовые", "Прочее"];

const USERS = [
  { email: "admin@archive.local", name: "Иван Петров", role: "ADMIN", password: "Admin12345" },
  { email: "manager@archive.local", name: "Анна Смирнова", role: "MANAGER", password: "Manager12345" },
  { email: "user@archive.local", name: "Игорь Кузнецов", role: "EMPLOYEE", password: "User12345" },
] as const;

async function main() {
  for (const name of CATEGORIES) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const { password, ...u } of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { ...u, passwordHash: await bcrypt.hash(password, 10) },
    });
  }
  console.log("Готово. Тестовые пользователи (только для разработки):");
  for (const u of USERS) console.log(`  ${u.role.padEnd(8)} ${u.email}  /  ${u.password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
