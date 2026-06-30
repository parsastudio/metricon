"use server";

import { db } from "@/lib/db";
import { workspaces, workspaceMembers, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "./auth";
import { createWorkspaceSchema, inviteMemberSchema } from "@/lib/validations";

export async function getWorkspaces() {
  const user = await getSessionUser();
  if (!user) return [];

  const memberships = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      plan: workspaces.plan,
      linkLimit: workspaces.linkLimit,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, user.id));

  return memberships;
}

export async function createWorkspace(name: string, slug: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const validated = createWorkspaceSchema.parse({ name, slug });
  const cleanSlug = validated.slug.toLowerCase().replace(/[^a-zA-Z0-9-]/g, "");
  const workspaceId = crypto.randomUUID();

  await db.insert(workspaces).values({
    id: workspaceId,
    name: validated.name,
    slug: cleanSlug,
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

export async function getWorkspaceMembers(workspaceId: string) {
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
    .select({
      id: workspaceMembers.id,
      role: workspaceMembers.role,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId));
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: "owner" | "admin" | "viewer"
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: "UNAUTHORIZED" };
    }

    const validated = inviteMemberSchema.parse({ workspaceId, email, role });

    const [currentUserMember] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, validated.workspaceId),
          eq(workspaceMembers.userId, user.id)
        )
      )
      .limit(1);

    if (!currentUserMember || currentUserMember.role === "viewer") {
      return { success: false, error: "FORBIDDEN" };
    }

    const cleanEmail = validated.email.toLowerCase().trim();
    let [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!targetUser) {
      const targetUserId = crypto.randomUUID();
      await db.insert(users).values({
        id: targetUserId,
        email: cleanEmail,
        name: cleanEmail.split("@")[0],
      });
      targetUser = {
        id: targetUserId,
        email: cleanEmail,
        name: cleanEmail.split("@")[0],
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const [existingMembership] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, validated.workspaceId),
          eq(workspaceMembers.userId, targetUser.id)
        )
      )
      .limit(1);

    if (existingMembership) {
      return { success: false, error: "USER_ALREADY_MEMBER" };
    }

    await db.insert(workspaceMembers).values({
      id: crypto.randomUUID(),
      workspaceId: validated.workspaceId,
      userId: targetUser.id,
      role: validated.role,
    });

    return { success: true };
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function removeMember(workspaceId: string, memberId: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: "UNAUTHORIZED" };
    }

    const [currentUserMember] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, user.id)
        )
      )
      .limit(1);

    if (!currentUserMember || currentUserMember.role !== "owner") {
      return { success: false, error: "FORBIDDEN" };
    }

    await db.delete(workspaceMembers).where(eq(workspaceMembers.id, memberId));
    return { success: true };
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}
