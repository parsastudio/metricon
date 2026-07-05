import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session_user_id")?.value;

  if (pathname.startsWith("/dashboard")) {
    if (!sessionCookie) {
      const loginUrl = new URL("/auth", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/auth")) {
    if (sessionCookie) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth"],
};
