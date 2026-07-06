"use server";

import { db } from "@/lib/db";
import {
  workspaces,
  workspaceMembers,
  workspaceInvitations,
  users,
} from "@/lib/schema";
import { eq, and, gte } from "drizzle-orm";
import { verifyWorkspaceAccess } from "@/lib/rbac";
import { inviteMemberSchema } from "@/lib/validations";
import { IS_DEMO_MODE } from "@/core/config";
import { sendEmail } from "@/lib/resend";
import { getAppOrigin } from "@/lib/network";

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

    let [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (IS_DEMO_MODE) {
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
          apiKey: null,
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

      return { success: true, isDemo: true };
    } else {
      const [existingMembership] = targetUser
        ? await db
            .select()
            .from(workspaceMembers)
            .where(
              and(
                eq(workspaceMembers.workspaceId, validated.workspaceId),
                eq(workspaceMembers.userId, targetUser.id)
              )
            )
            .limit(1)
        : [null];

      if (existingMembership) {
        return { success: false, error: "USER_ALREADY_MEMBER" };
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
      const invitationUrl = `${appUrl}/invite/accept?token=${token}`;

      await sendEmail({
        to: cleanEmail,
        subject: "Workspace Invitation from Metricon",
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h2>Workspace Join Request</h2>
          <p>You have been invited to participate as a <strong>${validated.role}</strong> in the Metricon workspace.</p>
          <p><a href="${invitationUrl}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">This unique authorization link is valid for 24 hours.</p>
        </div>`,
      });

      return { success: true, isDemo: false };
    }
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

export async function acceptWorkspaceInvitation(token: string) {
  const [invitation] = await db
    .select()
    .from(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.token, token),
        gte(workspaceInvitations.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!invitation) {
    return { success: false, error: "INVALID_OR_EXPIRED" };
  }

  let [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, invitation.email))
    .limit(1);

  if (!targetUser) {
    const targetUserId = crypto.randomUUID();
    await db.insert(users).values({
      id: targetUserId,
      email: invitation.email,
      name: invitation.email.split("@")[0],
    });
    targetUser = {
      id: targetUserId,
      email: invitation.email,
      name: invitation.email.split("@")[0],
      image: null,
      apiKey: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const [existingMembership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, invitation.workspaceId),
        eq(workspaceMembers.userId, targetUser.id)
      )
    )
    .limit(1);

  if (!existingMembership) {
    await db.insert(workspaceMembers).values({
      id: crypto.randomUUID(),
      workspaceId: invitation.workspaceId,
      userId: targetUser.id,
      role: invitation.role,
    });
  }

  await db
    .delete(workspaceInvitations)
    .where(eq(workspaceInvitations.id, invitation.id));
  const [workspace] = await db
    .select({ slug: workspaces.slug })
    .from(workspaces)
    .where(eq(workspaces.id, invitation.workspaceId))
    .limit(1);

  return { success: true, slug: workspace?.slug };
}

export async function revokeWorkspaceInvitation(
  workspaceId: string,
  invitationId: string
) {
  try {
    await verifyWorkspaceAccess(workspaceId, ["owner", "admin"]);
    await db
      .delete(workspaceInvitations)
      .where(eq(workspaceInvitations.id, invitationId));
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

export async function removeMember(workspaceId: string, memberId: string) {
  try {
    await verifyWorkspaceAccess(workspaceId, ["owner"]);
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
