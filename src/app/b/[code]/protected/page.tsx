import { db } from "@/lib/db";
import { links, workspaces } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function LegacyProtectedPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [link] = await db
    .select()
    .from(links)
    .where(eq(links.shortCode, code))
    .limit(1);

  if (!link) {
    redirect("/b/expired");
  }

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, link.workspaceId))
    .limit(1);

  if (!workspace) {
    redirect("/b/expired");
  }

  redirect(`/r/${workspace.shortPrefix}/${code}/protected`);
}
