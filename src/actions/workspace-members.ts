"use server";

import { db } from "@/lib/db";
import { workspaceMembers, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { verifyWorkspaceAccess } from "@/lib/rbac";
export {
  getPendingWorkspaceInvitations,
  inviteMember,
  acceptWorkspaceInvitation,
  revokeWorkspaceInvitation,
} from "./workspace-invitations";

export async function getWorkspaceMembers(workspaceId: string) {
  await verifyWorkspaceAccess(workspaceId, ["owner", "admin", "viewer"]);
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

export async function removeMember(workspaceId: string, memberId: string) {
  try {
    await verifyWorkspaceAccess(workspaceId, ["owner"]);

    const [memberToDelete] = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.id, memberId))
      .limit(1);

    if (memberToDelete?.role === "owner") {
      const owners = await db
        .select({ id: workspaceMembers.id })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.role, "owner")
          )
        );
      if (owners.length <= 1) {
        return { success: false, error: "SOLE_OWNER_REMOVAL_FORBIDDEN" };
      }
    }

    await db.delete(workspaceMembers).where(eq(workspaceMembers.id, memberId));
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

export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: "owner" | "admin" | "viewer"
) {
  try {
    await verifyWorkspaceAccess(workspaceId, ["owner"]);

    const [memberToUpdate] = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.id, memberId))
      .limit(1);

    if (memberToUpdate?.role === "owner" && newRole !== "owner") {
      const owners = await db
        .select({ id: workspaceMembers.id })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.role, "owner")
          )
        );
      if (owners.length <= 1) {
        return { success: false, error: "SOLE_OWNER_DEMOTION_FORBIDDEN" };
      }
    }

    await db
      .update(workspaceMembers)
      .set({ role: newRole })
      .where(
        and(
          eq(workspaceMembers.id, memberId),
          eq(workspaceMembers.workspaceId, workspaceId)
        )
      );
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
