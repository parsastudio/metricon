"use server";

import { db } from "@/lib/db";
import {
  workspaces,
  workspaceMembers,
  workspaceInvitations,
  users,
} from "@/lib/schema";
import { eq, and, ne, gte } from "drizzle-orm";
import { getSessionUser } from "./auth";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
} from "@/lib/validations";
import { IS_DEMO_MODE } from "@/core/config";
import { sendEmail } from "@/lib/resend";
import { getAppOrigin } from "@/lib/network";

async function generateUniquePrefix(): Promise<string> {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let attempts = 0;
  while (attempts < 50) {
    let prefix = "";
    for (let i = 0; i < 4; i++) {
      prefix += chars[Math.floor(Math.random() * chars.length)];
    }
    const [existing] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.shortPrefix, prefix))
      .limit(1);
    if (!existing) {
      return prefix;
    }
    attempts++;
  }
  return crypto.randomUUID().substring(0, 5);
}

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
      shortPrefix: workspaces.shortPrefix,
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

export async function getPendingWorkspaceInvitations(workspaceId: string) {
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
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: "UNAUTHORIZED" };
    }

    const validated = inviteMemberSchema.parse({ workspaceId, email, role });
    const cleanEmail = validated.email.toLowerCase().trim();

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
  } catch {
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
      .delete(workspaceInvitations)
      .where(eq(workspaceInvitations.id, invitationId));
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

export async function updateWorkspace(
  workspaceId: string,
  name: string,
  slug: string,
  shortPrefix: string
) {
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

    if (!member || member.role !== "owner") {
      return { success: false, error: "FORBIDDEN" };
    }

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
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function deleteWorkspace(workspaceId: string) {
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

    if (!member || member.role !== "owner") {
      return { success: false, error: "FORBIDDEN" };
    }

    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    return { success: true };
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: "owner" | "admin" | "viewer"
) {
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
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}
