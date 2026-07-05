import { NextResponse } from "next/server";
import { verifyMagicToken } from "@/actions/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth?error=missing_token", request.url)
    );
  }

  const result = await verifyMagicToken(token);

  if (!result.success) {
    return NextResponse.redirect(
      new URL("/auth?error=expired_token", request.url)
    );
  }

  return NextResponse.redirect(
    new URL(`/dashboard/${result.defaultWorkspaceSlug}`, request.url)
  );
}
