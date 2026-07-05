"server-only";

import { getSessionUser } from "@/actions/auth";
import { db } from "@/lib/db";
import { workspaceMembers } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export type WorkspaceRole = "owner" | "admin" | "viewer";

export async function verifyWorkspaceAccess(
  workspaceId: string,
  allowedRoles: WorkspaceRole[] = ["owner", "admin", "viewer"]
) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
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

  if (!member) {
    throw new Error("FORBIDDEN");
  }

  if (!allowedRoles.includes(member.role as WorkspaceRole)) {
    throw new Error("FORBIDDEN");
  }

  return { user, member };
}
