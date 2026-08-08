import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { unsealData } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The MCP endpoint authenticates itself with a secret path segment, so it
  // must bypass the passcode/session wall (external clients like Claude have
  // no session cookie). The /.well-known/* OAuth-discovery paths must also
  // bypass it so they return a clean 404 — that 404 is how Claude concludes
  // the server is authless and connects, instead of redirecting to /login
  // (which Claude misreads as an OAuth sign-in service).
  if (
    pathname.startsWith("/api/mcp") ||
    pathname.startsWith("/.well-known")
  ) {
    return NextResponse.next();
  }

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
