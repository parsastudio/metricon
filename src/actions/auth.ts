"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  users,
  workspaces,
  workspaceMembers,
  verificationTokens,
} from "@/lib/schema";
import { eq, and, gte } from "drizzle-orm";
import { loginSchema } from "@/lib/validations";
import { IS_DEMO_MODE } from "@/core/config";
import { sendEmail } from "@/lib/resend";
import { getAppOrigin } from "@/lib/network";
import { hashSha256, signSession, verifySession } from "@/lib/crypto";

import { provisionWorkspaceForUser } from "@/lib/workspace-generator";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const signedSession = cookieStore.get("session_user_id")?.value;

  if (!signedSession) {
    return null;
  }

  const userId = await verifySession(signedSession);
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

export async function rotateApiKey() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  const newApiKeyRaw = `mc_live_${crypto.randomUUID().replace(/-/g, "")}`;
  const hashedKey = await hashSha256(newApiKeyRaw);
  await db
    .update(users)
    .set({ apiKey: hashedKey, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  return { success: true, apiKey: newApiKeyRaw };
}

export async function loginUser(email: string, name?: string) {
  const cookieStore = await cookies();
  const validated = loginSchema.parse({ email });
  const cleanEmail = validated.email.toLowerCase().trim();

  let [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  let defaultWorkspaceSlug = "";

  if (IS_DEMO_MODE) {
    if (!existingUser) {
      const userId = crypto.randomUUID();
      const initialApiKeyRaw = `mc_live_${crypto.randomUUID().replace(/-/g, "")}`;
      const hashedKey = await hashSha256(initialApiKeyRaw);

      const provisioned = await provisionWorkspaceForUser({
        userId,
        email: cleanEmail,
        name: name || cleanEmail.split("@")[0],
        hashedApiKey: hashedKey,
      });

      defaultWorkspaceSlug = provisioned.workspaceSlug;
      existingUser = {
        id: userId,
        email: cleanEmail,
        name: name || cleanEmail.split("@")[0],
        image: null,
        apiKey: hashedKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      const [memberWorkspace] = await db
        .select({ slug: workspaces.slug })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
        .where(eq(workspaceMembers.userId, existingUser.id))
        .limit(1);

      defaultWorkspaceSlug = memberWorkspace?.slug || "default-org";
    }

    cookieStore.set("session_user_id", await signSession(existingUser.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true, isDemo: true, defaultWorkspaceSlug };
  } else {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(verificationTokens).values({
      id: crypto.randomUUID(),
      email: cleanEmail,
      token,
      expiresAt,
    });

    const appUrl = await getAppOrigin();
    const verificationUrl = `${appUrl}/auth/callback?token=${token}`;

    const emailResult = await sendEmail({
      to: cleanEmail,
      subject: "Access Your Metricon Account",
      html: `<div style="font-family: sans-serif; padding: 20px;">
        <h2>Welcome back to Metricon</h2>
        <p>Click the link below to securely sign in without passwords:</p>
        <p><a href="${verificationUrl}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify & Continue</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">This security link is valid for 10 minutes.</p>
      </div>`,
    });

    if (!emailResult.success) {
      return { success: false, error: "EMAIL_DISPATCH_FAILURE" };
    }

    return { success: true, isDemo: false };
  }
}

export async function verifyMagicToken(token: string) {
  const cookieStore = await cookies();
  const [tokenRecord] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.token, token),
        gte(verificationTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!tokenRecord) {
    return { success: false, error: "INVALID_OR_EXPIRED_TOKEN" };
  }

  let [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, tokenRecord.email))
    .limit(1);

  let defaultWorkspaceSlug = "";

  if (!existingUser) {
    const userId = crypto.randomUUID();
    const initialApiKeyRaw = `mc_live_${crypto.randomUUID().replace(/-/g, "")}`;
    const hashedKey = await hashSha256(initialApiKeyRaw);

    const provisioned = await provisionWorkspaceForUser({
      userId,
      email: tokenRecord.email,
      name: tokenRecord.email.split("@")[0],
      hashedApiKey: hashedKey,
    });

    defaultWorkspaceSlug = provisioned.workspaceSlug;
    existingUser = {
      id: userId,
      email: tokenRecord.email,
      name: tokenRecord.email.split("@")[0],
      image: null,
      apiKey: hashedKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } else {
    const [memberWorkspace] = await db
      .select({ slug: workspaces.slug })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, existingUser.id))
      .limit(1);

    defaultWorkspaceSlug = memberWorkspace?.slug || "default-org";
  }

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.id, tokenRecord.id));

  cookieStore.set("session_user_id", await signSession(existingUser.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { success: true, defaultWorkspaceSlug };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("session_user_id");
  return { success: true };
}
