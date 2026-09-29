"use server";

import { db } from "@/lib/db";
import { links, workspaces } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { verifyWorkspaceAccess } from "@/lib/rbac";
import { revalidateTag } from "next/cache";
import {
  createLinkSchema,
  updateLinkSchema,
  CreateLinkInput,
  UpdateLinkInput,
} from "@/lib/validations";
import { ZodError } from "zod";
import { SUBSCRIPTION_PLANS } from "@/core/config";
import { hashSha256 } from "@/lib/crypto";

export async function getLinks(workspaceId: string) {
  await verifyWorkspaceAccess(workspaceId, ["owner", "admin", "viewer"]);
  const dbLinks = await db
    .select({
      id: links.id,
      workspaceId: links.workspaceId,
      shortCode: links.shortCode,
      originalUrl: links.originalUrl,
      title: links.title,
      isActive: links.isActive,
      password: links.password,
      expiresAt: links.expiresAt,
      maxClicks: links.maxClicks,
      iosUrl: links.iosUrl,
      androidUrl: links.androidUrl,
      desktopUrl: links.desktopUrl,
      geoRouting: links.geoRouting,
      createdAt: links.createdAt,
      updatedAt: links.updatedAt,
      clicksCount: links.clicksCount,
    })
    .from(links)
    .where(eq(links.workspaceId, workspaceId))
    .orderBy(desc(links.createdAt));

  return dbLinks.map((link) => ({
    ...link,
    password: link.password ? "●●●●●●" : null,
  }));
}

export async function createLink(data: CreateLinkInput) {
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

    if (
      workspace.plan === "free" &&
      existingLinks.length >= workspace.linkLimit
    ) {
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
    const hashedPassword = validated.password
      ? await hashSha256(validated.password)
      : null;

    await db.insert(links).values({
      id: linkId,
      workspaceId: validated.workspaceId,
      originalUrl: validated.originalUrl,
      shortCode: cleanShortCode,
      title: validated.title || validated.originalUrl,
      password: hashedPassword,
      expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
      maxClicks: validated.maxClicks || null,
      iosUrl: validated.iosUrl || null,
      androidUrl: validated.androidUrl || null,
      desktopUrl: validated.desktopUrl || null,
      geoRouting: validated.geoRouting || null,
      clicksCount: 0,
    });

    revalidateTag(`link-${validated.workspaceId}-${cleanShortCode}`, "max");
    return { success: true, linkId };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "INVALID_FIELDS",
      };
    }
    if (
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function updateLink(data: UpdateLinkInput) {
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

    let passwordValue = link.password;
    if (validated.password !== undefined) {
      if (validated.password === "") {
        passwordValue = null;
      } else if (validated.password !== "●●●●●●") {
        passwordValue = await hashSha256(validated.password);
      }
    }

    await db
      .update(links)
      .set({
        originalUrl: validated.originalUrl,
        title: validated.title || validated.originalUrl,
        password: passwordValue,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        maxClicks: validated.maxClicks || null,
        iosUrl: validated.iosUrl || null,
        androidUrl: validated.androidUrl || null,
        desktopUrl: validated.desktopUrl || null,
        geoRouting: validated.geoRouting || null,
        updatedAt: new Date(),
      })
      .where(eq(links.id, validated.linkId));

    revalidateTag(`link-${validated.workspaceId}-${link.shortCode}`, "max");
    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "INVALID_FIELDS",
      };
    }
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
    const [link] = await db
      .select({ shortCode: links.shortCode })
      .from(links)
      .where(eq(links.id, linkId))
      .limit(1);

    if (link) {
      await db
        .update(links)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(links.id, linkId), eq(links.workspaceId, workspaceId)));

      revalidateTag(`link-${workspaceId}-${link.shortCode}`, "max");
    }
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
    const [link] = await db
      .select({ shortCode: links.shortCode })
      .from(links)
      .where(eq(links.id, linkId))
      .limit(1);

    if (link) {
      await db
        .delete(links)
        .where(and(eq(links.id, linkId), eq(links.workspaceId, workspaceId)));

      revalidateTag(`link-${workspaceId}-${link.shortCode}`, "max");
    }
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
