"use server";

import { db } from "@/lib/db";
import { workspaces, workspaceMembers } from "@/lib/schema";
import { eq, and, ne } from "drizzle-orm";
import { getSessionUser } from "./auth";
import { verifyWorkspaceAccess } from "@/lib/rbac";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from "@/lib/validations";
import { generateUniquePrefix } from "@/lib/workspace-generator";

export async function getWorkspaces() {
  const user = await getSessionUser();
  if (!user) return [];
  return await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      plan: workspaces.plan,
      linkLimit: workspaces.linkLimit,
      shortPrefix: workspaces.shortPrefix,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, user.id));
}

export async function createWorkspace(name: string, slug: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const validated = createWorkspaceSchema.parse({ name, slug });
  const cleanSlug = validated.slug.toLowerCase().replace(/[^a-zA-Z0-9-]/g, "");
  const workspaceId = crypto.randomUUID();
  const shortPrefix = await generateUniquePrefix();

  await db.insert(workspaces).values({
    id: workspaceId,
    name: validated.name,
    slug: cleanSlug,
    shortPrefix,
    plan: "free",
    linkLimit: 10,
  });

  await db.insert(workspaceMembers).values({
    id: crypto.randomUUID(),
    workspaceId: workspaceId,
    userId: user.id,
    role: "owner",
  });

  return { id: workspaceId, slug: cleanSlug };
}

export async function updateWorkspace(
  workspaceId: string,
  name: string,
  slug: string,
  shortPrefix: string
) {
  try {
    await verifyWorkspaceAccess(workspaceId, ["owner"]);
    const validated = updateWorkspaceSchema.parse({ name, slug, shortPrefix });
    const cleanSlug = validated.slug
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, "");

    const [existingSlug] = await db
      .select()
      .from(workspaces)
      .where(
        and(eq(workspaces.slug, cleanSlug), ne(workspaces.id, workspaceId))
      )
      .limit(1);

    if (existingSlug) {
      return { success: false, error: "SLUG_EXISTS" };
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return { success: false, error: "WORKSPACE_NOT_FOUND" };
    }

    const cleanPrefix =
      workspace.plan === "pro"
        ? validated.shortPrefix.toLowerCase().replace(/[^a-zA-Z0-9-]/g, "")
        : workspace.shortPrefix;

    if (workspace.plan === "pro") {
      const [existingPrefix] = await db
        .select()
        .from(workspaces)
        .where(
          and(
            eq(workspaces.shortPrefix, cleanPrefix),
            ne(workspaces.id, workspaceId)
          )
        )
        .limit(1);

      if (existingPrefix) {
        return { success: false, error: "PREFIX_EXISTS" };
      }
    }

    await db
      .update(workspaces)
      .set({
        name: validated.name,
        slug: cleanSlug,
        shortPrefix: cleanPrefix,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId));

    return { success: true, slug: cleanSlug };
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

export async function deleteWorkspace(workspaceId: string) {
  try {
    await verifyWorkspaceAccess(workspaceId, ["owner"]);
    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
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
