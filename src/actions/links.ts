"use server";

import { db } from "@/lib/db";
import { links, workspaces } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { verifyWorkspaceAccess } from "@/lib/rbac";
import { cookies } from "next/headers";
import { createLinkSchema, updateLinkSchema } from "@/lib/validations";

export async function getLinks(workspaceId: string) {
  await verifyWorkspaceAccess(workspaceId, ["owner", "admin", "viewer"]);

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
    const validated = createLinkSchema.parse(data);
    await verifyWorkspaceAccess(validated.workspaceId, ["owner", "admin"]);

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, validated.workspaceId))
      .limit(1);

    if (!workspace) {
      return { success: false, error: "WORKSPACE_NOT_FOUND" };
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
      "r",
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
      .where(
        and(
          eq(links.workspaceId, validated.workspaceId),
          eq(links.shortCode, cleanShortCode)
        )
      )
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
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function updateLink(data: {
  linkId: string;
  workspaceId: string;
  originalUrl: string;
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
    const validated = updateLinkSchema.parse(data);
    await verifyWorkspaceAccess(validated.workspaceId, ["owner", "admin"]);

    const [link] = await db
      .select()
      .from(links)
      .where(
        and(
          eq(links.id, validated.linkId),
          eq(links.workspaceId, validated.workspaceId)
        )
      )
      .limit(1);

    if (!link) {
      return { success: false, error: "LINK_NOT_FOUND" };
    }

    await db
      .update(links)
      .set({
        originalUrl: validated.originalUrl,
        title: validated.title || validated.originalUrl,
        password: validated.password || null,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        maxClicks: validated.maxClicks || null,
        iosUrl: validated.iosUrl || null,
        androidUrl: validated.androidUrl || null,
        desktopUrl: validated.desktopUrl || null,
        geoRouting: validated.geoRouting || null,
        updatedAt: new Date(),
      })
      .where(eq(links.id, validated.linkId));

    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function toggleLinkActiveStatus(
  workspaceId: string,
  linkId: string,
  isActive: boolean
) {
  try {
    await verifyWorkspaceAccess(workspaceId, ["owner", "admin"]);

    await db
      .update(links)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(links.id, linkId), eq(links.workspaceId, workspaceId)));

    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function deleteLink(workspaceId: string, linkId: string) {
  try {
    await verifyWorkspaceAccess(workspaceId, ["owner", "admin"]);

    await db
      .delete(links)
      .where(and(eq(links.id, linkId), eq(links.workspaceId, workspaceId)));

    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function verifyLinkPassword(
  workspacePrefix: string,
  code: string,
  passwordEntered: string
) {
  try {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.shortPrefix, workspacePrefix))
      .limit(1);

    if (!workspace) {
      return { success: false, error: "WORKSPACE_NOT_FOUND" };
    }

    const [link] = await db
      .select()
      .from(links)
      .where(
        and(eq(links.workspaceId, workspace.id), eq(links.shortCode, code))
      )
      .limit(1);

    if (!link) {
      return { success: false, error: "LINK_NOT_FOUND" };
    }
    if (link.password !== passwordEntered) {
      return { success: false, error: "INCORRECT_PASSWORD" };
    }

    const cookieStore = await cookies();
    cookieStore.set(`link_unlocked_${workspacePrefix}_${code}`, "true", {
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
