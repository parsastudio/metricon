"use server";

import { db } from "@/lib/db";
import { workspaceInvitations, workspaceMembers, users, workspaces } from "@/lib/schema";
import { eq, and, gte } from "drizzle-orm";
import { verifyWorkspaceAccess } from "@/lib/rbac";
import { inviteMemberSchema } from "@/lib/validations";
import { IS_DEMO_MODE } from "@/core/config";
import { sendEmail } from "@/lib/resend";
import { getAppOrigin } from "@/lib/network";
import { getSessionUser } from "@/actions/auth";

export async function getPendingWorkspaceInvitations(workspaceId: string) {
  await verifyWorkspaceAccess(workspaceId, ["owner", "admin", "viewer"]);
  return await db
    .select()
    .from(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        gte(workspaceInvitations.expiresAt, new Date())
      )
    );
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: "owner" | "admin" | "viewer"
) {
  try {
    const validated = inviteMemberSchema.parse({ workspaceId, email, role });
    await verifyWorkspaceAccess(validated.workspaceId, ["owner", "admin"]);
    const cleanEmail = validated.email.toLowerCase().trim();

    let [targetUser] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);

    if (IS_DEMO_MODE) {
      if (!targetUser) {
        const targetUserId = crypto.randomUUID();
        await db.insert(users).values({ id: targetUserId, email: cleanEmail, name: cleanEmail.split("@")[0] });
        targetUser = { id: targetUserId, email: cleanEmail, name: cleanEmail.split("@")[0], image: null, apiKey: null, createdAt: new Date(), updatedAt: new Date() };
      }

      const [existing] = await db
        .select()
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, validated.workspaceId), eq(workspaceMembers.userId, targetUser.id)))
        .limit(1);

      if (existing) return { success: false, error: "USER_ALREADY_MEMBER" };

      await db.insert(workspaceMembers).values({
        id: crypto.randomUUID(),
        workspaceId: validated.workspaceId,
        userId: targetUser.id,
        role: validated.role,
      });

      return { success: true, isDemo: true };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(workspaceInvitations).values({
      id: crypto.randomUUID(),
      workspaceId: validated.workspaceId,
      email: cleanEmail,
      role: validated.role,
      token,
      expiresAt,
    });

    const appUrl = await getAppOrigin();
    await sendEmail({
      to: cleanEmail,
      subject: "Workspace Invitation from Metricon",
      html: `<p>Invitation code: <a href="${appUrl}/invite/accept?token=${token}">Accept</a></p>`,
    });

    return { success: true, isDemo: false };
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function acceptWorkspaceInvitation(token: string) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { success: false, error: "UNAUTHORIZED" };

  const [invitation] = await db
    .select()
    .from(workspaceInvitations)
    .where(and(eq(workspaceInvitations.token, token), gte(workspaceInvitations.expiresAt, new Date())))
    .limit(1);

  if (!invitation) return { success: false, error: "INVALID_OR_EXPIRED" };
  if (sessionUser.email !== invitation.email) return { success: false, error: "EMAIL_MISMATCH" };

  let [targetUser] = await db.select().from(users).where(eq(users.email, invitation.email)).limit(1);
  if (!targetUser) {
    const targetUserId = crypto.randomUUID();
    await db.insert(users).values({ id: targetUserId, email: invitation.email, name: invitation.email.split("@")[0] });
    targetUser = { id: targetUserId, email: invitation.email, name: invitation.email.split("@")[0], image: null, apiKey: null, createdAt: new Date(), updatedAt: new Date() };
  }

  await db.insert(workspaceMembers).values({
    id: crypto.randomUUID(),
    workspaceId: invitation.workspaceId,
    userId: targetUser.id,
    role: invitation.role,
  });

  await db.delete(workspaceInvitations).where(eq(workspaceInvitations.id, invitation.id));
  const [workspace] = await db.select({ slug: workspaces.slug }).from(workspaces).where(eq(workspaces.id, invitation.workspaceId)).limit(1);
  return { success: true, slug: workspace?.slug };
}

export async function revokeWorkspaceInvitation(workspaceId: string, invitationId: string) {
  try {
    await verifyWorkspaceAccess(workspaceId, ["owner", "admin"]);
    await db.delete(workspaceInvitations).where(eq(workspaceInvitations.id, invitationId));
    return { success: true };
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}
