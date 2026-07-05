import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { workspaces, links } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export const getCachedWorkspace = (shortPrefix: string) => {
  return unstable_cache(
    async () => {
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.shortPrefix, shortPrefix))
        .limit(1);
      return workspace || null;
    },
    ["workspace-by-prefix", shortPrefix],
    {
      revalidate: 86400,
      tags: [`workspace-${shortPrefix}`],
    }
  )();
};

export const getCachedLink = (workspaceId: string, shortCode: string) => {
  return unstable_cache(
    async () => {
      const [link] = await db
        .select()
        .from(links)
        .where(
          and(
            eq(links.workspaceId, workspaceId),
            eq(links.shortCode, shortCode)
          )
        )
        .limit(1);
      return link || null;
    },
    ["link-by-code", workspaceId, shortCode],
    {
      revalidate: 86400,
      tags: [`link-${workspaceId}-${shortCode}`],
    }
  )();
};
