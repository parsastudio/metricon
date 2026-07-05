import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { links, workspaceMembers, workspaces, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/actions/auth";
import { createLinkSchema } from "@/lib/validations";
import { getClientIp } from "@/lib/geoip";
import { checkRateLimit } from "@/lib/rate-limit";

async function getAuthorizedUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.apiKey, token))
        .limit(1);
      return user?.id || null;
    }
  }
  const user = await getSessionUser();
  return user?.id || null;
}

export async function GET(req: Request) {
  try {
    const userId = await getAuthorizedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "MISSING_WORKSPACE_ID" },
        { status: 400 }
      );
    }

    const [member] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const result = await db
      .select()
      .from(links)
      .where(eq(links.workspaceId, workspaceId));

    return NextResponse.json({ success: true, links: result });
  } catch {
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const rawIp = getClientIp(req.headers);
    const isAllowed = await checkRateLimit(`rate_limit_create_link_${rawIp}`);
    if (!isAllowed) {
      return NextResponse.json({ error: "TOO_MANY_REQUESTS" }, { status: 429 });
    }

    const userId = await getAuthorizedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createLinkSchema.parse(body);

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, validated.workspaceId))
      .limit(1);

    if (!workspace) {
      return NextResponse.json(
        { error: "WORKSPACE_NOT_FOUND" },
        { status: 404 }
      );
    }

    const [member] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, validated.workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )
      .limit(1);

    if (!member || member.role === "viewer") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const existingLinks = await db
      .select({ id: links.id })
      .from(links)
      .where(eq(links.workspaceId, validated.workspaceId));

    if (
      workspace.plan === "free" &&
      existingLinks.length >= workspace.linkLimit
    ) {
      return NextResponse.json({ error: "LIMIT_REACHED" }, { status: 402 });
    }

    const cleanShortCode = validated.shortCode
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, "");

    const [existingShortCode] = await db
      .select()
      .from(links)
      .where(eq(links.shortCode, cleanShortCode))
      .limit(1);

    if (existingShortCode) {
      return NextResponse.json({ error: "SHORT_CODE_EXISTS" }, { status: 409 });
    }

    const linkId = crypto.randomUUID();

    const expiresAtDate =
      typeof validated.expiresAt === "string" &&
      validated.expiresAt.trim() !== ""
        ? new Date(validated.expiresAt)
        : null;

    if (expiresAtDate && isNaN(expiresAtDate.getTime())) {
      return NextResponse.json(
        { error: "INVALID_EXPIRES_AT" },
        { status: 400 }
      );
    }

    await db.insert(links).values({
      id: linkId,
      workspaceId: validated.workspaceId,
      originalUrl: validated.originalUrl,
      shortCode: cleanShortCode,
      title: validated.title || validated.originalUrl,
      password: validated.password || null,
      expiresAt: expiresAtDate,
      maxClicks: validated.maxClicks || null,
      iosUrl: validated.iosUrl || null,
      androidUrl: validated.androidUrl || null,
      desktopUrl: validated.desktopUrl || null,
      geoRouting: validated.geoRouting || null,
      clicksCount: 0,
    });

    return NextResponse.json(
      { success: true, linkId, shortCode: cleanShortCode },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "BAD_REQUEST",
        details: err instanceof Error ? err.message : err,
      },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getAuthorizedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const linkId = searchParams.get("linkId");

    if (!workspaceId || !linkId) {
      return NextResponse.json(
        { error: "MISSING_PARAMETERS" },
        { status: 400 }
      );
    }

    const [member] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )
      .limit(1);

    if (!member || member.role === "viewer") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const deleted = await db
      .delete(links)
      .where(and(eq(links.id, linkId), eq(links.workspaceId, workspaceId)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
