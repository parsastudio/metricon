import { redirect } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import { getWorkspaces } from "@/actions/workspace";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getAppOrigin } from "@/lib/network";
import { GeneralSettingsForm } from "./general-settings-form";
import { ApiCredentialsCard } from "./api-credentials-card";
import { DangerZoneCard } from "./danger-zone-card";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth");

  const workspacesList = await getWorkspaces();
  const currentWorkspace = workspacesList.find((w) => w.slug === workspaceSlug);
  if (!currentWorkspace) redirect("/auth");

  const [memberRecord] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, currentWorkspace.id),
        eq(workspaceMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!memberRecord) redirect("/auth");

  const [workspaceData] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, currentWorkspace.id))
    .limit(1);

  if (!workspaceData) redirect("/auth");

  const isOwner = memberRecord.role === "owner";
  const origin = await getAppOrigin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Workspace Settings
        </h2>
        <p className="text-muted-foreground text-xs">
          Configure organization profiles, metadata paths and control access
          levels.
        </p>
      </div>

      <GeneralSettingsForm
        workspace={{
          id: workspaceData.id,
          name: workspaceData.name,
          slug: workspaceData.slug,
          shortPrefix: workspaceData.shortPrefix,
          plan: workspaceData.plan,
        }}
        isOwner={isOwner}
      />

      <ApiCredentialsCard
        workspaceId={workspaceData.id}
        userId={user.id}
        origin={origin}
      />

      <DangerZoneCard
        workspace={{
          id: workspaceData.id,
          slug: workspaceData.slug,
        }}
        isOwner={isOwner}
      />
    </div>
  );
}
