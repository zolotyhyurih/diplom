import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, decrypt } from "@/lib/jwt";

// Быстрая проверка по cookie (без обращения к БД). Полная проверка — в dal.ts.
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = path === "/login";

  if (!session?.userId && !isLogin) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (session?.userId && isLogin) {
    return NextResponse.redirect(new URL("/contracts", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico)$).*)"],
};
