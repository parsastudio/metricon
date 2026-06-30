"use server";

import { db } from "@/lib/db";
import { links, workspaces, workspaceMembers } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSessionUser } from "./auth";
import { cookies } from "next/headers";
import { createLinkSchema } from "@/lib/validations";

export async function getLinks(workspaceId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!member) throw new Error("Access denied");

  return await db
    .select()
    .from(links)
    .where(eq(links.workspaceId, workspaceId))
    .orderBy(desc(links.createdAt));
}

export async function createLink(data: {
  workspaceId: string;
  originalUrl: string;
  shortCode: string;
  title?: string;
  password?: string;
  expiresAt?: string;
  maxClicks?: number;
  iosUrl?: string;
  androidUrl?: string;
  desktopUrl?: string;
  geoRouting?: Record<string, string>;
}) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: "UNAUTHORIZED" };
    }

    const validated = createLinkSchema.parse(data);

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, validated.workspaceId))
      .limit(1);

    if (!workspace) {
      return { success: false, error: "WORKSPACE_NOT_FOUND" };
    }

    const [member] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, validated.workspaceId),
          eq(workspaceMembers.userId, user.id)
        )
      )
      .limit(1);

    if (!member || member.role === "viewer") {
      return { success: false, error: "FORBIDDEN" };
    }

    const existingLinks = await db
      .select({ id: links.id })
      .from(links)
      .where(eq(links.workspaceId, validated.workspaceId));

    const linkCount = existingLinks.length;
    if (workspace.plan === "free" && linkCount >= workspace.linkLimit) {
      return { success: false, error: "LIMIT_REACHED" };
    }

    const cleanShortCode = validated.shortCode
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, "");

    const RESERVED_WORDS = [
      "expired",
      "protected",
      "api",
      "dashboard",
      "auth",
      "static",
      "b",
      "links",
      "analytics",
      "members",
      "billing",
    ];
    if (RESERVED_WORDS.includes(cleanShortCode)) {
      return { success: false, error: "RESERVED_SHORT_CODE" };
    }

    const [existingShortCode] = await db
      .select()
      .from(links)
      .where(eq(links.shortCode, cleanShortCode))
      .limit(1);

    if (existingShortCode) {
      return { success: false, error: "SHORT_CODE_EXISTS" };
    }

    const linkId = crypto.randomUUID();

    await db.insert(links).values({
      id: linkId,
      workspaceId: validated.workspaceId,
      originalUrl: validated.originalUrl,
      shortCode: cleanShortCode,
      title: validated.title || validated.originalUrl,
      password: validated.password || null,
      expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
      maxClicks: validated.maxClicks || null,
      iosUrl: validated.iosUrl || null,
      androidUrl: validated.androidUrl || null,
      desktopUrl: validated.desktopUrl || null,
      geoRouting: validated.geoRouting || null,
      clicksCount: 0,
    });

    return { success: true };
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function deleteLink(workspaceId: string, linkId: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: "UNAUTHORIZED" };
    }

    const [member] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, user.id)
        )
      )
      .limit(1);

    if (!member || member.role === "viewer") {
      return { success: false, error: "FORBIDDEN" };
    }

    await db
      .delete(links)
      .where(and(eq(links.id, linkId), eq(links.workspaceId, workspaceId)));

    return { success: true };
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function verifyLinkPassword(
  code: string,
  passwordEntered: string
) {
  try {
    const [link] = await db
      .select()
      .from(links)
      .where(eq(links.shortCode, code))
      .limit(1);

    if (!link) {
      return { success: false, error: "LINK_NOT_FOUND" };
    }
    if (link.password !== passwordEntered) {
      return { success: false, error: "INCORRECT_PASSWORD" };
    }

    const cookieStore = await cookies();
    cookieStore.set(`link_unlocked_${code}`, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
    });

    return { success: true };
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}
