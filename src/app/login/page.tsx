import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { expired } = await searchParams;
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      {expired && (
        <p role="status" className="w-full max-w-sm rounded-lg bg-muted px-3 py-2 text-sm">
          Сеанс завершён: учётная запись отключена или удалена. Войдите заново.
        </p>
      )}
      <LoginForm />
    </main>
  );
}
