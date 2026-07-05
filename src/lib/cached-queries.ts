import { db } from "@/lib/db";
import { workspaces, links } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export const getCachedWorkspace = async (shortPrefix: string) => {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.shortPrefix, shortPrefix))
    .limit(1);
  return workspace || null;
};

export const getCachedLink = async (workspaceId: string, shortCode: string) => {
  const [link] = await db
    .select()
    .from(links)
    .where(
      and(eq(links.workspaceId, workspaceId), eq(links.shortCode, shortCode))
    )
    .limit(1);
  return link || null;
};
