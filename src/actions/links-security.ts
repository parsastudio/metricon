"use server";

import { db } from "@/lib/db";
import { links, workspaces, failedAttempts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies, headers } from "next/headers";

async function getSha256Hash(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function generateUnlockSignature(
  workspacePrefix: string,
  code: string
): Promise<string> {
  const secret =
    process.env.STRIPE_SECRET_KEY || "fallback_encryption_token_2026";
  return await getSha256Hash(`${workspacePrefix}:${code}:${secret}:unlocked`);
}

export async function verifyLinkPassword(
  workspacePrefix: string,
  code: string,
  passwordEntered: string
) {
  try {
    const headersList = await headers();
    const rawIp =
      headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const ipHash = await getSha256Hash(rawIp);

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.shortPrefix, workspacePrefix))
      .limit(1);

    if (!workspace) {
      return { success: false, error: "WORKSPACE_NOT_FOUND" };
    }

    const [link] = await db
      .select()
      .from(links)
      .where(
        and(eq(links.workspaceId, workspace.id), eq(links.shortCode, code))
      )
      .limit(1);

    if (!link) {
      return { success: false, error: "LINK_NOT_FOUND" };
    }

    const [existingRecord] = await db
      .select()
      .from(failedAttempts)
      .where(
        and(
          eq(failedAttempts.ipHash, ipHash),
          eq(failedAttempts.linkId, link.id)
        )
      )
      .limit(1);

    if (
      existingRecord &&
      existingRecord.lockedUntil &&
      new Date() < new Date(existingRecord.lockedUntil)
    ) {
      return { success: false, error: "LOCKED_OUT" };
    }

    if (link.password !== passwordEntered) {
      const attempts = existingRecord ? existingRecord.attempts + 1 : 1;

      if (attempts >= 5) {
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        if (existingRecord) {
          await db
            .update(failedAttempts)
            .set({ attempts, lockedUntil, updatedAt: new Date() })
            .where(eq(failedAttempts.id, existingRecord.id));
        } else {
          await db.insert(failedAttempts).values({
            id: crypto.randomUUID(),
            ipHash,
            linkId: link.id,
            attempts,
            lockedUntil,
          });
        }
        return { success: false, error: "INCORRECT_PASSWORD_LOCKED" };
      } else {
        if (existingRecord) {
          await db
            .update(failedAttempts)
            .set({ attempts, updatedAt: new Date() })
            .where(eq(failedAttempts.id, existingRecord.id));
        } else {
          await db.insert(failedAttempts).values({
            id: crypto.randomUUID(),
            ipHash,
            linkId: link.id,
            attempts,
          });
        }
        return { success: false, error: "INCORRECT_PASSWORD" };
      }
    }

    if (existingRecord) {
      await db
        .delete(failedAttempts)
        .where(eq(failedAttempts.id, existingRecord.id));
    }

    const cookieStore = await cookies();
    const signature = await generateUnlockSignature(workspacePrefix, code);

    cookieStore.set(`link_unlocked_${workspacePrefix}_${code}`, signature, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
    });

    return { success: true };
  } catch {
    return { success: false, error: "SERVER_ERROR" };
  }
}
