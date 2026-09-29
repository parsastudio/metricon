import { db } from "@/lib/db";
import { users, workspaces, workspaceMembers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { SUBSCRIPTION_PLANS } from "@/core/config";

export async function generateUniquePrefix(): Promise<string> {
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

export async function provisionWorkspaceForUser(params: {
  userId: string;
  email: string;
  name?: string;
  hashedApiKey: string;
}) {
  const workspaceId = crypto.randomUUID();
  const workspaceSlug = `${params.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "-")}-org`;
  const shortPrefix = await generateUniquePrefix();

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: params.userId,
      email: params.email,
      name: params.name || params.email.split("@")[0],
      apiKey: params.hashedApiKey,
    });

    await tx.insert(workspaces).values({
      id: workspaceId,
      name: `${params.name || params.email.split("@")[0]}'s Org`,
      slug: workspaceSlug,
      shortPrefix,
      plan: "free",
      linkLimit: SUBSCRIPTION_PLANS.free.limits.links,
    });

    await tx.insert(workspaceMembers).values({
      id: crypto.randomUUID(),
      workspaceId,
      userId: params.userId,
      role: "owner",
    });
  });

  return { workspaceSlug, workspaceId };
}
