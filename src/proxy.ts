import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { unsealData } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname.startsWith("/login");

  const cookie = request.cookies.get(sessionOptions.cookieName)?.value;
  let authenticated = false;

  if (cookie) {
    try {
      const data = await unsealData<SessionData>(cookie, {
        password: sessionOptions.password,
      });
      authenticated = !!data.authenticated;
    } catch {
      authenticated = false;
    }
  }

  if (!authenticated && !isLoginRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authenticated && isLoginRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
