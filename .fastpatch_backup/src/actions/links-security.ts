"use server";

import { db } from "@/lib/db";
import { links, workspaces, failedAttempts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { getClientIp } from "@/lib/geoip";
import { hashSha256, getSaltedIpHash } from "@/lib/crypto";

export async function generateUnlockSignature(
  workspacePrefix: string,
  code: string
): Promise<string> {
  const secret =
    process.env.STRIPE_SECRET_KEY || "fallback_encryption_token_2026";
  return await hashSha256(`${workspacePrefix}:${code}:${secret}:unlocked`);
}

export async function verifyLinkPassword(
  workspacePrefix: string,
  code: string,
  passwordEntered: string
) {
  try {
    const headersList = await headers();
    const rawIp = getClientIp(headersList);
    const ipHash = await getSaltedIpHash(rawIp);

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

    const isLockExpired =
      existingRecord &&
      existingRecord.lockedUntil &&
      new Date() >= new Date(existingRecord.lockedUntil);

    if (
      existingRecord &&
      existingRecord.lockedUntil &&
      !isLockExpired &&
      new Date() < new Date(existingRecord.lockedUntil)
    ) {
      return { success: false, error: "LOCKED_OUT" };
    }

    const baseAttempts = isLockExpired
      ? 0
      : existingRecord
        ? existingRecord.attempts
        : 0;

    const hashedEntered = await hashSha256(passwordEntered);

    if (link.password !== passwordEntered && link.password !== hashedEntered) {
      const attempts = baseAttempts + 1;
      const lockedUntil =
        attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await db
        .insert(failedAttempts)
        .values({
          id: crypto.randomUUID(),
          ipHash,
          linkId: link.id,
          attempts,
          lockedUntil,
        })
        .onConflictDoUpdate({
          target: [failedAttempts.ipHash, failedAttempts.linkId],
          set: {
            attempts,
            lockedUntil,
            updatedAt: new Date(),
          },
        });

      if (attempts >= 5) {
        return { success: false, error: "INCORRECT_PASSWORD_LOCKED" };
      } else {
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
