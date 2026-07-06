import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/crypto";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session_user_id")?.value;

  let isValid = false;
  if (sessionCookie) {
    const verified = await verifySession(sessionCookie);
    if (verified) {
      isValid = true;
    }
  }

  if (pathname.startsWith("/dashboard")) {
    if (!isValid) {
      const loginUrl = new URL("/auth", request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("session_user_id");
      return response;
    }
  }

  if (pathname.startsWith("/auth")) {
    if (isValid) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth"],
};
