"use server";

import { db } from "@/lib/db";
import { workspaces, links } from "@/lib/schema";
import { eq } from "drizzle-orm";

async function getOrCreateDemoWorkspace() {
  const [existing] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.shortPrefix, "demo"))
    .limit(1);

  if (existing) {
    return existing;
  }

  const workspaceId = "demo-workspace-id-2026";

  await db.insert(workspaces).values({
    id: workspaceId,
    name: "Demo Sandbox Workspace",
    slug: "sandbox-demo-org",
    shortPrefix: "demo",
    plan: "free",
    linkLimit: 1000000,
  });

  return {
    id: workspaceId,
    shortPrefix: "demo",
  };
}

export async function createLandingDemoLink(originalUrl: string) {
  try {
    new URL(originalUrl);

    const demoWorkspace = await getOrCreateDemoWorkspace();

    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let shortCode = "";
    for (let i = 0; i < 5; i++) {
      shortCode += chars[Math.floor(Math.random() * chars.length)];
    }

    const linkId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(links).values({
      id: linkId,
      workspaceId: demoWorkspace.id,
      originalUrl,
      shortCode,
      title: "Sandbox Demo Link",
      expiresAt,
      clicksCount: 0,
    });

    return { success: true, shortCode };
  } catch {
    return { success: false, error: "INVALID_URL" };
  }
}
