"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users, workspaces, workspaceMembers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { loginSchema } from "@/lib/validations";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user_id")?.value;

  if (!userId) {
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user || null;
}

export async function loginUser(email: string, name?: string) {
  const cookieStore = await cookies();
  const validated = loginSchema.parse({ email });
  const cleanEmail = validated.email;

  let [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  let defaultWorkspaceSlug = "";

  if (!existingUser) {
    const userId = crypto.randomUUID();
    const workspaceId = crypto.randomUUID();
    const workspaceSlug =
      cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "-") + "-org";

    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email: cleanEmail,
        name: name || cleanEmail.split("@")[0],
      });

      await tx.insert(workspaces).values({
        id: workspaceId,
        name: `${name || cleanEmail.split("@")[0]}'s Org`,
        slug: workspaceSlug,
        plan: "free",
        linkLimit: 10,
      });

      await tx.insert(workspaceMembers).values({
        id: crypto.randomUUID(),
        workspaceId,
        userId,
        role: "owner",
      });
    });

    existingUser = {
      id: userId,
      email: cleanEmail,
      name: name || cleanEmail.split("@")[0],
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    defaultWorkspaceSlug = workspaceSlug;
  } else {
    const [memberWorkspace] = await db
      .select({ slug: workspaces.slug })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, existingUser.id))
      .limit(1);

    defaultWorkspaceSlug = memberWorkspace?.slug || "default-org";
  }

  cookieStore.set("session_user_id", existingUser.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { user: existingUser, defaultWorkspaceSlug };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("session_user_id");
  return { success: true };
}
