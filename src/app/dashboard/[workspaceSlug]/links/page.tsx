import { getSessionUser } from "@/actions/auth";
import { getWorkspaces } from "@/actions/workspace";
import {
  getLinks,
  createLink,
  updateLink,
  deleteLink,
  toggleLinkActiveStatus,
} from "@/actions/links-crud";
import { LinksManager } from "@/components/links-manager";
import { SeedButton } from "@/components/analytics/seed-button";
import { ComponentErrorBoundary } from "@/components/component-error-boundary";
import { Layers } from "lucide-react";
import { redirect } from "next/navigation";

export default async function LinksPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth");

  const workspaces = await getWorkspaces();
  const currentWorkspace = workspaces.find((w) => w.slug === workspaceSlug);
  if (!currentWorkspace) redirect("/auth");

  const linksList = await getLinks(currentWorkspace.id);

  return (
    <div className="space-y-6">
      {linksList.length === 0 ? (
        <div className="bg-card border-border space-y-4 rounded-xl border p-12 text-center">
          <div className="bg-muted text-muted-foreground mx-auto flex size-12 items-center justify-center rounded-full">
            <Layers className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">No links created</h3>
            <p className="text-muted-foreground mx-auto mb-4 max-w-sm text-xs leading-relaxed">
              Create your first campaign tracking link or instantly populate the
              workspace with mock telemetry.
            </p>
          </div>
          <div className="flex justify-center">
            <SeedButton workspaceId={currentWorkspace.id} />
          </div>
        </div>
      ) : (
        <ComponentErrorBoundary>
          <LinksManager
            workspaceId={currentWorkspace.id}
            workspacePrefix={currentWorkspace.shortPrefix}
            initialLinks={linksList}
            isPro={currentWorkspace.plan === "pro"}
            onCreateLink={createLink}
            onUpdateLink={updateLink}
            onDeleteLink={async (linkId) => {
              "use server";
              return deleteLink(currentWorkspace.id, linkId);
            }}
            onToggleActive={async (linkId, isActive) => {
              "use server";
              return toggleLinkActiveStatus(
                currentWorkspace.id,
                linkId,
                isActive
              );
            }}
          />
        </ComponentErrorBoundary>
      )}
    </div>
  );
}
